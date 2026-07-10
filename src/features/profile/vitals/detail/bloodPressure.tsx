import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import moment from 'moment';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import VitalsProgressRing from './components/VitalsProgressRing';
import BloodPressureDetailChart, { type BloodPressureChartRange } from './components/BloodPressureDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import {
    getMeasureDataDetailByDateRange,
    getMeasureDataNormalDayCount,
    getMeasureDataStatisByDateRange,
    type MeasureDataItem,
    type MeasureDataStatisDayGroup,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { flattenMeasureItems, getDateRange } from '../vitalsHelpers';
import {
    buildBloodPressureAnalysisData,
    buildBloodPressureChartFromStatisGroups,
    buildBloodPressureDetailTodaySeries,
    buildBloodPressureStatsFromItems,
    formatBloodPressureDetailPointDisplay,
    formatBloodPressureNormalRangeText,
    getBloodPressureDetailQueryRange,
    getBloodPressureReferenceLineY,
    type BloodPressureAnalysisItem,
    type BloodPressureDetailPoint,
} from './helpers/bloodPressure';
import {
    mapDetailChartRangeToVitalsRange,
    normalizeStatisRangeData,
} from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getPrescriptionCycleDayCount(startDate?: string, endDate?: string) {
    const start = moment(startDate);
    const end = moment(endDate);
    if (!start.isValid() || !end.isValid()) return null;
    return end.diff(start, 'days') + 1;
}

function buildBloodPressureGoalSummary(rule?: InUseExPatientRule | null) {
    const cycleDays = getPrescriptionCycleDayCount(rule?.startDate, rule?.endDate);

    return {
        cycleDays,
        exPatientRuleId: rule?.exPatientRuleId != null ? String(rule.exPatientRuleId) : null,
    };
}

function hasBloodPressureHealthGoal(rule?: InUseExPatientRule | null) {
    return (rule?.healthGoalTargetList ?? []).some(target => {
        const goal = target.healthGoalVo;
        return goal?.assessmentType === 'health_indicator_type' && goal?.assessmentValue === 'xueYa';
    });
}

function formatGoalDays(value: number | null) {
    return value == null ? '--' : String(value);
}

function calcGoalProgressPercent(completedDays: number | null, targetDays: number | null) {
    if (completedDays == null || targetDays == null || targetDays <= 0) return 0;
    return Math.min(100, Math.round((completedDays / targetDays) * 100));
}

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function formatBloodPressureValue(high?: number | null, low?: number | null) {
    if (high == null || low == null || !Number.isFinite(high) || !Number.isFinite(low)) return '--';
    return `${high}/${low}`;
}

function resetHeaderDisplay(range: BloodPressureChartRange) {
    return formatBloodPressureDetailPointDisplay(range);
}

function applyEmptyBloodPressureState(
    range: BloodPressureChartRange,
    setters: {
        setChartData: (data: BloodPressurePoint[]) => void;
        setDisplayValue: (value: string) => void;
        setDisplayStatus: (status: string) => void;
        setDisplayStatusColor: (color: string) => void;
        setCurrentLabel: (label: string) => void;
        setAverageValue: (value: string) => void;
        setAbnormalCount: (count: number | null) => void;
        setAnalysisData: (data: BloodPressureAnalysisItem[]) => void;
    },
) {
    const emptyDisplay = resetHeaderDisplay(range);
    setters.setChartData([]);
    setters.setDisplayValue(emptyDisplay.value);
    setters.setDisplayStatus(formatStatusText(emptyDisplay.status));
    setters.setDisplayStatusColor(emptyDisplay.statusColor);
    setters.setCurrentLabel(emptyDisplay.currentLabel);
    setters.setAverageValue('--');
    setters.setAbnormalCount(null);
    setters.setAnalysisData(buildBloodPressureAnalysisData([]));
}

function applyBloodPressureStats(
    items: MeasureDataItem[],
    setters: {
        setAverageValue: (value: string) => void;
        setAbnormalCount: (count: number | null) => void;
        setAnalysisData: (data: BloodPressureAnalysisItem[]) => void;
    },
) {
    const stats = buildBloodPressureStatsFromItems(items);
    setters.setAverageValue(formatBloodPressureValue(stats.average?.high, stats.average?.low));
    setters.setAbnormalCount(stats.abnormalCount);
    setters.setAnalysisData(stats.analysisData);
}

async function loadBloodPressureDetailItems(range: BloodPressureChartRange) {
    const { startDate, endDate } = getBloodPressureDetailQueryRange(range);
    const res = (await getMeasureDataDetailByDateRange({
        startDate,
        endDate,
        type: '血压',
    })) as unknown as { code?: number; data?: MeasureDataItem[] };

    if (!isResourceApiOk(res)) return null;
    return flattenMeasureItems(apiResourceData<MeasureDataItem[]>(res));
}

export default function VitalsPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const userGender = useSelector((state: RootState) => state.user.info?.gender);
    const [selectedType, setSelectedType] = useState<BloodPressureChartRange>('today');
    const [goalCycleDays, setGoalCycleDays] = useState<number | null>(null);
    const [goalCompliantDays, setGoalCompliantDays] = useState<number | null>(null);
    const [showGoalSummary, setShowGoalSummary] = useState(false);
    const [chartData, setChartData] = useState<BloodPressurePoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [averageValue, setAverageValue] = useState('--');
    const [abnormalCount, setAbnormalCount] = useState<number | null>(null);
    const [analysisData, setAnalysisData] = useState<BloodPressureAnalysisItem[]>(
        () => buildBloodPressureAnalysisData([]),
    );

    const goalProgressPercent = useMemo(
        () => calcGoalProgressPercent(goalCompliantDays, goalCycleDays),
        [goalCompliantDays, goalCycleDays],
    );

    const referenceLines = useMemo(
        () => getBloodPressureReferenceLineY(userGender),
        [userGender],
    );

    const normalRangeText = useMemo(
        () => formatBloodPressureNormalRangeText(userGender),
        [userGender],
    );

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '血压' });
    }, [navigation]);

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '血压',
    });

    const handleChartPointChange = useCallback((point: BloodPressurePoint | undefined) => {
        const display = formatBloodPressureDetailPointDisplay(
            selectedType,
            point as BloodPressureDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [selectedType]);

    const loadGoalSummary = useCallback(async () => {
        try {
            const res = await getInUseExPatientRuleInfo();
            const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
            if (!isResourceApiOk(payload)) {
                setShowGoalSummary(false);
                setGoalCycleDays(null);
                setGoalCompliantDays(null);
                return;
            }

            const rule = apiResourceData<InUseExPatientRule>(payload);
            if (!hasBloodPressureHealthGoal(rule)) {
                setShowGoalSummary(false);
                setGoalCycleDays(null);
                setGoalCompliantDays(null);
                return;
            }

            setShowGoalSummary(true);
            const summary = buildBloodPressureGoalSummary(rule);
            setGoalCycleDays(summary.cycleDays);

            if (!summary.exPatientRuleId) return;

            const countRes = await getMeasureDataNormalDayCount({
                exPatientRuleId: summary.exPatientRuleId,
                type: '血压',
            });
            const countPayload = countRes as unknown as { code?: number; data?: number };
            if (isResourceApiOk(countPayload)) {
                const normalDayCount = apiResourceData<number>(countPayload);
                setGoalCompliantDays(normalDayCount ?? null);
            }
        } catch {
            setShowGoalSummary(false);
            setGoalCycleDays(null);
            setGoalCompliantDays(null);
        }
    }, []);

    const loadMeasureData = useCallback(async (range: BloodPressureChartRange) => {
        const emptySetters = {
            setChartData,
            setDisplayValue,
            setDisplayStatus,
            setDisplayStatusColor,
            setCurrentLabel,
            setAverageValue,
            setAbnormalCount,
            setAnalysisData,
        };
        const statsSetters = {
            setAverageValue,
            setAbnormalCount,
            setAnalysisData,
        };

        try {
            if (range === 'today') {
                const detailItems = await loadBloodPressureDetailItems(range);
                if (detailItems == null) {
                    applyEmptyBloodPressureState(range, emptySetters);
                    return;
                }

                setChartData(buildBloodPressureDetailTodaySeries(detailItems));
                applyBloodPressureStats(detailItems, statsSetters);
                return;
            }

            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const [statisRes, detailItems] = await Promise.all([
                getMeasureDataStatisByDateRange({
                    startDate,
                    endDate,
                    type: '血压',
                }),
                loadBloodPressureDetailItems(range),
            ]);
            const statisPayload = statisRes as unknown as { code?: number; data?: MeasureDataStatisDayGroup[] };

            if (!isResourceApiOk(statisPayload) || detailItems == null) {
                applyEmptyBloodPressureState(range, emptySetters);
                return;
            }

            const groups = normalizeStatisRangeData(apiResourceData<unknown>(statisPayload));
            setChartData(buildBloodPressureChartFromStatisGroups(groups, range));
            applyBloodPressureStats(detailItems, statsSetters);
        } catch {
            applyEmptyBloodPressureState(range, emptySetters);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadGoalSummary();
            void loadMeasureData(selectedType);
        }, [loadGoalSummary, loadMeasureData, selectedType]),
    );

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
                    {showGoalSummary ? (
                        <Flex justify='between' style={styles.rowBox}>
                            <View>
                                <Text style={styles.rowTitle}>
                                    血压控制目标{formatGoalDays(goalCycleDays)}天
                                </Text>
                                <Flex align="end" style={styles.rowValueBox}>
                                    <Text style={styles.rowValueText}>已达标</Text>
                                    <Text style={styles.rowValueNum}>{formatGoalDays(goalCompliantDays)}</Text>
                                    <Text style={styles.rowValueText}>天</Text>
                                </Flex>
                            </View>
                            <VitalsProgressRing progress={goalProgressPercent} />
                        </Flex>
                    ) : null}
                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>{selectedType === 'today' ? '血压' : '平均血压'}(mmHg)</Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>正常范围:{normalRangeText}</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <BloodPressureDetailChart
                            range={selectedType}
                            data={chartData}
                            referenceHighY={referenceLines.high}
                            referenceLowY={referenceLines.low}
                            onPointChange={handleChartPointChange}
                        />
                    </View>

                    <Flex justify='center' style={styles.colTopBox}>
                        <Flex>
                            <Flex style={styles.colLeftBor}></Flex>
                            <Text style={styles.colLeftText}>高压（收缩压）</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colRightBor}></Flex>
                            <Text style={styles.colRightText}>低压（舒张压）</Text>
                            <Text></Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.colRow}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>血压平均值（mmHg）</Text>
                            <Text style={styles.rValue}>{averageValue}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>高血压异常次数（次）</Text>
                            <Text style={styles.eValue}>{abnormalCount ?? '--'}</Text>
                        </View>
                    </Flex>

                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Text style={styles.analysisTitle}>血压分析</Text>
                        <Flex wrap='wrap' justify='between' style={styles.analysisBox}>
                            {
                                analysisData.map((item, index) => (
                                    <Flex key={index} style={styles.analysisItem}>
                                        <Flex style={[styles.analysisBor, { backgroundColor: item.color }]}></Flex>
                                        <Text style={styles.analysisText}>{item.title}</Text>
                                        <Text style={[item.value > 0 ? styles.analysisValue : styles.analysisValueEmpty]}>{item.value}次</Text>
                                    </Flex>
                                ))
                            }
                        </Flex>
                    </View>
                </ScrollView>
                <Flex
                    justify="between"
                    style={[
                        styles.bottomBar,
                        { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.bottomBarButtonLeft, { flex: 1 }]}
                        onPress={navigateToAddData}
                    >
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                style={styles.bottomBarButtonImg}
                                source={require('@/assets/images/vitals/add.png')}
                            />
                            <Text style={styles.bottomBarButtonTextLeft}>添加记录</Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </View>
            {menuModals}
        </PageLayout>
    );
}
