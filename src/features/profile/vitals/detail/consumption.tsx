import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import StepsDetailChart, {
    type StepsChartRange,
    type StepsPoint,
    type StepsYAxisBuilder,
} from './components/StepsDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getWearableDataDetailByDateRange,
    WEARABLE_DATA_TYPES,
    type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDateRange, sortWearableItems, getWearableReturnOriginalDataParam } from '../vitalsHelpers';
import {
    buildEnergyDetailPeriodSeries,
    buildEnergyDetailTodaySeries,
    buildEnergyDetailYAxis,
    calcEnergyDetailOverview,
    formatEnergyDetailPointDisplay,
    getEnergyDetailGoal,
    type EnergyDetailPoint,
} from './helpers/energy';
import { mapDetailChartRangeToVitalsRange, roundEnergyValue } from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';
import { resolveEnergyTarget } from './helpers/vitalsGoalTargets';

const EMPTY_OVERVIEW = {
    avgTotal: '--',
    avgActive: '--',
    avgBasal: '--',
};

function formatOverviewNumber(value: number) {
    return roundEnergyValue(value).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function resetHeaderDisplay(range: StepsChartRange, goal: number) {
    return formatEnergyDetailPointDisplay(range, undefined, goal);
}

function applyTodayGoalStatus(dayTotal: number, goal: number) {
    return formatEnergyDetailPointDisplay(
        'today',
        dayTotal > 0
            ? {
                hour: '',
                value: dayTotal,
                energyGoals: goal,
            }
            : undefined,
        goal,
    );
}

export default function ConsumptionPage() {
    const insets = useSafeAreaInsets();
    const storeEnergyGoal = useSelector((state: RootState) => state.user.userExtr?.energyGoals);
    const defaultEnergyGoal = useMemo(
        () => resolveEnergyTarget(storeEnergyGoal),
        [storeEnergyGoal],
    );
    const [selectedType, setSelectedType] = useState<StepsChartRange>('today');
    const [chartData, setChartData] = useState<StepsPoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [suggestionLabel, setSuggestionLabel] = useState(() => `目标：${defaultEnergyGoal.toLocaleString('en-US')}`);
    const [overview, setOverview] = useState(EMPTY_OVERVIEW);
    const [energyGoal, setEnergyGoal] = useState(defaultEnergyGoal);
    const [todayTotalEnergy, setTodayTotalEnergy] = useState(0);
    const loadingRef = useRef(false);
    const loadSeqRef = useRef(0);
    const selectedTypeRef = useRef(selectedType);
    selectedTypeRef.current = selectedType;

    const handleChartPointChange = useCallback((point: StepsPoint | undefined) => {
        // 切换区间加载中时忽略图表回调，避免目标状态闪成 --
        if (loadingRef.current) return;

        const range = selectedTypeRef.current;
        const pointDisplay = formatEnergyDetailPointDisplay(
            range,
            point as EnergyDetailPoint | undefined,
            energyGoal,
        );

        if (range === 'today') {
            // 今日数值跟图表选中点；目标状态始终用「全天活动消耗」
            if (point != null) {
                setDisplayValue(pointDisplay.value);
            }
            const dayStatusDisplay = applyTodayGoalStatus(todayTotalEnergy, energyGoal);
            setDisplayStatus(dayStatusDisplay.status);
            setDisplayStatusColor(dayStatusDisplay.statusColor);
            return;
        }

        // 周/月无选中点时保留当前展示，勿刷成空态
        if (point == null) return;

        setDisplayValue(pointDisplay.value);
        setDisplayStatus(pointDisplay.status);
        setDisplayStatusColor(pointDisplay.statusColor);
        setCurrentLabel(pointDisplay.currentLabel);
        setSuggestionLabel(pointDisplay.suggestionLabel);
    }, [energyGoal, todayTotalEnergy]);

    const energyYAxisBuilder = useCallback<StepsYAxisBuilder>(
        points => buildEnergyDetailYAxis(points as EnergyDetailPoint[], selectedType),
        [selectedType],
    );

    const loadEnergyData = useCallback(async (range: StepsChartRange, goalOverride?: number) => {
        const fallbackGoal = goalOverride ?? defaultEnergyGoal;
        const seq = ++loadSeqRef.current;
        loadingRef.current = true;
        try {
            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const [activeRawRes, basalRawRes] = await Promise.all([
                getWearableDataDetailByDateRange({
                    startDate,
                    endDate,
                    type: WEARABLE_DATA_TYPES.activeEnergy,
                    ...getWearableReturnOriginalDataParam(range),
                }),
                getWearableDataDetailByDateRange({
                    startDate,
                    endDate,
                    type: WEARABLE_DATA_TYPES.basalEnergy,
                    ...getWearableReturnOriginalDataParam(range),
                }),
            ]);
            if (seq !== loadSeqRef.current) return;

            const activeRes = activeRawRes as unknown as { code?: number; data?: WearableDataItem[] };
            const basalRes = basalRawRes as unknown as { code?: number; data?: WearableDataItem[] };

            const activeItems = isResourceApiOk(activeRes)
                ? sortWearableItems(apiResourceData<WearableDataItem[]>(activeRes) ?? [])
                : [];
            const basalItems = isResourceApiOk(basalRes)
                ? sortWearableItems(apiResourceData<WearableDataItem[]>(basalRes) ?? [])
                : [];

            if (!activeItems.length && !basalItems.length) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range, fallbackGoal);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(emptyDisplay.status);
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                setSuggestionLabel(emptyDisplay.suggestionLabel);
                setOverview(EMPTY_OVERVIEW);
                setEnergyGoal(fallbackGoal);
                setTodayTotalEnergy(0);
                return;
            }

            const goal = getEnergyDetailGoal(activeItems, basalItems, fallbackGoal);
            const nextChartData =
                range === 'today'
                    ? buildEnergyDetailTodaySeries(activeItems, basalItems, goal)
                    : buildEnergyDetailPeriodSeries(activeItems, basalItems, range, goal);
            const overviewStats = calcEnergyDetailOverview(activeItems, basalItems, range, goal);
            // 图表与目标进度统一按活动消耗，不含静息
            const dayTotal = overviewStats?.avgActive ?? 0;

            setEnergyGoal(goal);
            setChartData(nextChartData);
            setSuggestionLabel(`目标：${Math.round(goal).toLocaleString('en-US')}`);

            if (overviewStats) {
                setOverview({
                    avgTotal: formatOverviewNumber(overviewStats.avgTotal),
                    avgActive: formatOverviewNumber(overviewStats.avgActive),
                    avgBasal: formatOverviewNumber(overviewStats.avgBasal),
                });
                setTodayTotalEnergy(range === 'today' ? dayTotal : 0);
            } else {
                setOverview(EMPTY_OVERVIEW);
                setTodayTotalEnergy(0);
            }

            // 数据就绪后一次性写入头部，避免切换时先闪 --/旧状态
            if (range === 'today') {
                const dayDisplay = applyTodayGoalStatus(dayTotal, goal);
                setDisplayValue(dayDisplay.value);
                setDisplayStatus(dayDisplay.status);
                setDisplayStatusColor(dayDisplay.statusColor);
                setCurrentLabel('当前：今天');
                setSuggestionLabel(dayDisplay.suggestionLabel);
            } else {
                const lastValid = [...nextChartData].reverse().find(point => point.value > 0);
                const periodDisplay = formatEnergyDetailPointDisplay(
                    range,
                    lastValid as EnergyDetailPoint | undefined,
                    goal,
                );
                setDisplayValue(periodDisplay.value);
                setDisplayStatus(periodDisplay.status);
                setDisplayStatusColor(periodDisplay.statusColor);
                setCurrentLabel(periodDisplay.currentLabel);
                setSuggestionLabel(periodDisplay.suggestionLabel);
            }
        } catch {
            if (seq !== loadSeqRef.current) return;
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range, fallbackGoal);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(emptyDisplay.status);
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            setSuggestionLabel(emptyDisplay.suggestionLabel);
            setOverview(EMPTY_OVERVIEW);
            setEnergyGoal(fallbackGoal);
            setTodayTotalEnergy(0);
        } finally {
            if (seq === loadSeqRef.current) {
                loadingRef.current = false;
            }
        }
    }, [defaultEnergyGoal]);

    const handleSelectedTypeChange = useCallback((type: StepsChartRange) => {
        if (type === selectedTypeRef.current) return;
        // 立刻挡住图表回调，防止旧数据/空选中把目标状态刷掉
        loadingRef.current = true;
        setSelectedType(type);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadEnergyData(selectedType);
        }, [loadEnergyData, selectedType]),
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '消耗',
        goalKind: 'energy',
        onGoalSaved: (target) => {
            void loadEnergyData(selectedType, target);
        },
    });

    const todayEnergyCard = useMemo(() => {
        const total = Math.max(0, roundEnergyValue(todayTotalEnergy));
        const goal = Math.max(0, Math.round(energyGoal));
        const remaining = Math.max(0, roundEnergyValue(goal - total));
        const progressPercent = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
        return {
            activeText: total > 0 ? formatOverviewNumber(total) : '--',
            goalText: goal > 0 ? formatOverviewNumber(goal) : '--',
            remainingText: formatOverviewNumber(remaining),
            progressPercent,
        };
    }, [energyGoal, todayTotalEnergy]);

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <View style={styles.pageContent}>
                <LinearGradient
                    pointerEvents="none"
                    colors={['#FFFFFF', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.typeListFade}
                />
                <View style={styles.pageHeader}>
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={handleSelectedTypeChange} />
                </View>

                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: insets.bottom }}
                >
                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>活动消耗（千卡）</Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>{suggestionLabel}</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <StepsDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                            valueUnit="千卡"
                            yAxisBuilder={energyYAxisBuilder}
                        />
                    </View>

                    <View style={[styles.rowBox, { marginTop: 30 }]}>
                        <Flex justify="between">
                            <View>
                                <Text style={styles.analysis1}>
                                    {selectedType === 'today' ? '总消耗(千卡)' : '日均总消耗(千卡)'}
                                </Text>
                                <Text style={styles.analysis2}>{overview.avgTotal}</Text>
                            </View>
                            <View>
                                <Text style={styles.analysis1}>
                                    {selectedType === 'today' ? '活动消耗(千卡)' : '日均活动消耗(千卡)'}
                                </Text>
                                <Text style={[styles.analysis2, { color: '#EE9C44' }]}>{overview.avgActive}</Text>
                            </View>
                            <View>
                                <Text style={styles.analysis1}>
                                    {selectedType === 'today' ? '静息消耗(千卡)' : '日均静息消耗(千卡)'}
                                </Text>
                                <Text style={[styles.analysis2, { color: '#6D925E' }]}>{overview.avgBasal}</Text>
                            </View>
                        </Flex>
                    </View>
                    {selectedType === 'today' ? (
                        <View style={styles.rowBox}>
                            <Flex justify="between">
                                <View>
                                    <Text style={styles.todayMetricLabel}>已达成活动消耗</Text>
                                    <Text style={styles.todayMetricValue}>{todayEnergyCard.activeText}</Text>
                                </View>
                                <View style={styles.todayMetricRight}>
                                    <Text style={styles.todayMetricLabel}>目标值</Text>
                                    <Text style={styles.todayMetricValue}>{todayEnergyCard.goalText}</Text>
                                </View>
                            </Flex>
                            <View style={styles.todayProgressTrack}>
                                <View
                                    style={[
                                        styles.todayProgressFill,
                                        { width: `${todayEnergyCard.progressPercent}%` },
                                    ]}
                                />
                            </View>
                            <Flex style={styles.todayRemainRow}>
                                <View style={styles.todayRemainAccent} />
                                <Text style={styles.todayRemainText}>
                                    距离目标还差{' '}
                                    <Text style={styles.todayRemainNum}>{todayEnergyCard.remainingText}</Text>
                                    {' '}千卡
                                </Text>
                            </Flex>
                        </View>
                    ) : null}
                </ScrollView>
            </View>
            {menuModals}
        </PageLayout>
    );
}
