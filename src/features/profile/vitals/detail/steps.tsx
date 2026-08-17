import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
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
    buildStepsDetailPeriodSeries,
    buildStepsDetailTodaySeries,
    buildStepsDetailYAxis,
    calcStepsDetailOverview,
    formatStepsDetailPointDisplay,
    formatStepsGoalLabel,
    getStepsDetailDayTotal,
    getStepsDetailGoal,
    type StepsDetailPoint,
} from './helpers/steps';
import { mapDetailChartRangeToVitalsRange } from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';
import { resolveVitalsViewMode, type VitalsViewParams } from '@/src/features/profile/vitals/utils/vitalsViewMode';

const DEFAULT_STEP_TARGET = 10000;

const EMPTY_OVERVIEW = {
    totalSteps: '--',
    dailyAverage: '--',
    compliantDays: '--',
};

function resolveStoreStepGoal(stepGoals?: number) {
    if (stepGoals != null && stepGoals >= 0) {
        return Math.round(stepGoals / 500) * 500;
    }
    return DEFAULT_STEP_TARGET;
}

function formatOverviewNumber(value: number) {
    return value.toLocaleString('en-US');
}

function resetHeaderDisplay(range: StepsChartRange, goal: number) {
    return formatStepsDetailPointDisplay(range, undefined, goal);
}

export default function StepsPage() {
    const route = useRoute();
    const { readOnly, patientUserId, viewNavParams } = resolveVitalsViewMode(
        route.params as VitalsViewParams | undefined,
    );
    const readOptions = useMemo(
        () => (patientUserId ? { patientUserId } : undefined),
        [patientUserId],
    );
    const insets = useSafeAreaInsets();
    const storeStepGoal = useSelector((state: RootState) => state.user.userExtr?.stepGoals);
    const defaultStepGoal = useMemo(
        () => resolveStoreStepGoal(storeStepGoal),
        [storeStepGoal],
    );
    const [selectedType, setSelectedType] = useState<StepsChartRange>('today');
    const [chartData, setChartData] = useState<StepsPoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [suggestionLabel, setSuggestionLabel] = useState(() => formatStepsGoalLabel(defaultStepGoal));
    const [overview, setOverview] = useState(EMPTY_OVERVIEW);
    const [stepGoal, setStepGoal] = useState(defaultStepGoal);
    const [todayDaySteps, setTodayDaySteps] = useState(0);

    const handleChartPointChange = useCallback((point: StepsPoint | undefined) => {
        const pointDisplay = formatStepsDetailPointDisplay(
            selectedType,
            point as StepsDetailPoint | undefined,
            stepGoal,
        );

        if (selectedType === 'today') {
            setDisplayValue(pointDisplay.value);
            const dayStatusDisplay = formatStepsDetailPointDisplay(
                'today',
                todayDaySteps > 0
                    ? {
                        hour: '',
                        value: todayDaySteps,
                        stepGoals: stepGoal,
                    }
                    : undefined,
                stepGoal,
            );
            setDisplayStatus(dayStatusDisplay.status);
            setDisplayStatusColor(dayStatusDisplay.statusColor);
            return;
        }

        setDisplayValue(pointDisplay.value);
        setDisplayStatus(pointDisplay.status);
        setDisplayStatusColor(pointDisplay.statusColor);
        setCurrentLabel(pointDisplay.currentLabel);
        setSuggestionLabel(pointDisplay.suggestionLabel);
    }, [selectedType, stepGoal, todayDaySteps]);

    const stepsYAxisBuilder = useCallback<StepsYAxisBuilder>(
        points => buildStepsDetailYAxis(points as StepsDetailPoint[], selectedType),
        [selectedType],
    );

    const loadStepsData = useCallback(async (range: StepsChartRange, goalOverride?: number) => {
        const fallbackGoal = goalOverride ?? defaultStepGoal;
        try {
            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getWearableDataDetailByDateRange({
                startDate,
                endDate,
                type: WEARABLE_DATA_TYPES.steps,
                ...getWearableReturnOriginalDataParam(range),
            }, readOptions)) as unknown as { code?: number; data?: WearableDataItem[] };

            if (!isResourceApiOk(res)) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range, fallbackGoal);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(emptyDisplay.status);
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                setSuggestionLabel(emptyDisplay.suggestionLabel);
                setOverview(EMPTY_OVERVIEW);
                setStepGoal(fallbackGoal);
                setTodayDaySteps(0);
                return;
            }

            const items = sortWearableItems(apiResourceData<WearableDataItem[]>(res) ?? []);
            const goal = getStepsDetailGoal(items, fallbackGoal);
            setStepGoal(goal);
            setSuggestionLabel(formatStepsGoalLabel(goal));
            if (range === 'today') {
                setCurrentLabel('当前：今天');
                setTodayDaySteps(getStepsDetailDayTotal(items));
            } else {
                setTodayDaySteps(0);
            }

            if (range === 'today') {
                setChartData(buildStepsDetailTodaySeries(items, goal));
            } else {
                setChartData(buildStepsDetailPeriodSeries(items, range, goal));
            }

            const overviewStats = calcStepsDetailOverview(items, range, goal);
            if (overviewStats) {
                setOverview({
                    totalSteps: formatOverviewNumber(overviewStats.totalSteps),
                    dailyAverage: formatOverviewNumber(overviewStats.dailyAverage),
                    compliantDays: String(overviewStats.compliantDays),
                });
            } else {
                setOverview(EMPTY_OVERVIEW);
            }
        } catch {
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range, fallbackGoal);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(emptyDisplay.status);
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            setSuggestionLabel(emptyDisplay.suggestionLabel);
            setOverview(EMPTY_OVERVIEW);
            setStepGoal(fallbackGoal);
            setTodayDaySteps(0);
        }
    }, [defaultStepGoal, readOptions]);

    useFocusEffect(
        useCallback(() => {
            void loadStepsData(selectedType);
        }, [loadStepsData, selectedType]),
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '步数',
        goalKind: 'steps',
        readOnly,
        viewNavParams,
        onGoalSaved: (target) => {
            void loadStepsData(selectedType, target);
        },
    });

    const todayCard = useMemo(() => {
        const steps = Math.max(0, Math.round(todayDaySteps));
        const goal = Math.max(0, Math.round(stepGoal));
        const remaining = Math.max(0, goal - steps);
        const progressPercent = goal > 0 ? Math.min(100, Math.round((steps / goal) * 100)) : 0;
        return {
            stepsText: steps > 0 ? formatOverviewNumber(steps) : '--',
            goalText: goal > 0 ? formatOverviewNumber(goal) : '--',
            remainingText: formatOverviewNumber(remaining),
            progressPercent,
        };
    }, [stepGoal, todayDaySteps]);

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
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={setSelectedType} />
                </View>

                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: insets.bottom }}
                >
                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify="between">
                            <Text style={styles.rowTitle}>步数</Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify="between">
                            <Text style={styles.rowTitle}>{suggestionLabel}</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <StepsDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                            yAxisBuilder={stepsYAxisBuilder}
                        />
                    </View>

                    <View style={[styles.rowBox, { marginTop: 30 }]}>
                        {selectedType === 'today' ? (
                            <>
                                <Flex justify="between">
                                    <View>
                                        <Text style={styles.todayMetricLabel}>今日步数</Text>
                                        <Text style={styles.todayMetricValue}>{todayCard.stepsText}</Text>
                                    </View>
                                    <View style={styles.todayMetricRight}>
                                        <Text style={styles.todayMetricLabel}>目标步数</Text>
                                        <Text style={styles.todayMetricValue}>{todayCard.goalText}</Text>
                                    </View>
                                </Flex>
                                <View style={styles.todayProgressTrack}>
                                    <View
                                        style={[
                                            styles.todayProgressFill,
                                            { width: `${todayCard.progressPercent}%` },
                                        ]}
                                    />
                                </View>
                                <Flex style={styles.todayRemainRow}>
                                    <View style={styles.todayRemainAccent} />
                                    <Text style={styles.todayRemainText}>
                                        距离目标还差{' '}
                                        <Text style={styles.todayRemainNum}>{todayCard.remainingText}</Text>
                                        {' '}步
                                    </Text>
                                </Flex>
                            </>
                        ) : (
                            <>
                                <Text style={styles.analysisTitle}>步数总览</Text>
                                <Flex justify="between" style={styles.analysisContent}>
                                    <View>
                                        <Text style={styles.analysis1}>总步数</Text>
                                        <Text style={styles.analysis2}>{overview.totalSteps}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.analysis1}>日均步数</Text>
                                        <Text style={styles.analysis2}>{overview.dailyAverage}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.analysis1}>达标天数 (天)</Text>
                                        <Text style={styles.analysis2}>{overview.compliantDays}</Text>
                                    </View>
                                </Flex>
                            </>
                        )}
                    </View>

                </ScrollView>
            </View>
            {menuModals}
        </PageLayout>
    );
}
