import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import VitalsProgressRing from './components/VitalsProgressRing';
import BloodSugarDetailChart, {
    type BloodSugarChartRange,
    type BloodSugarPoint,
} from './components/BloodSugarDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import {
    getMeasureDataDetailByDateRange,
    getMeasureDataNormalDayCount,
    type MeasureDataItem,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { flattenMeasureItems } from '../vitalsHelpers';
import {
    buildBloodSugarDetailPeriodSeries,
    buildBloodSugarDetailTodaySeries,
    buildBloodSugarStatsFromItems,
    formatBloodSugarDetailPointDisplay,
    getBloodSugarDetailQueryRange,
    type BloodSugarDetailPoint,
} from './helpers/bloodSugar';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getPrescriptionCycleDayCount(startDate?: string, endDate?: string) {
    const start = moment(startDate);
    const end = moment(endDate);
    if (!start.isValid() || !end.isValid()) return null;
    return end.diff(start, 'days') + 1;
}

function buildBloodSugarGoalSummary(rule?: InUseExPatientRule | null) {
    const cycleDays = getPrescriptionCycleDayCount(rule?.startDate, rule?.endDate);

    return {
        cycleDays,
        exPatientRuleId: rule?.exPatientRuleId != null ? String(rule.exPatientRuleId) : null,
    };
}

function hasBloodSugarHealthGoal(rule?: InUseExPatientRule | null) {
    return (rule?.healthGoalTargetList ?? []).some(target => {
        const goal = target.healthGoalVo;
        return goal?.assessmentType === 'health_indicator_type' && goal?.assessmentValue === 'xueTang';
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

function resetHeaderDisplay(range: BloodSugarChartRange) {
    return formatBloodSugarDetailPointDisplay(range);
}

function applyEmptyBloodSugarState(
    range: BloodSugarChartRange,
    setters: {
        setChartData: (data: BloodSugarPoint[]) => void;
        setDisplayValue: (value: string) => void;
        setDisplayStatus: (status: string) => void;
        setDisplayStatusColor: (color: string) => void;
        setCurrentLabel: (label: string) => void;
        resetPeriodStats: () => void;
    },
) {
    const emptyDisplay = resetHeaderDisplay(range);
    setters.setChartData([]);
    setters.setDisplayValue(emptyDisplay.value);
    setters.setDisplayStatus(formatStatusText(emptyDisplay.status));
    setters.setDisplayStatusColor(emptyDisplay.statusColor);
    setters.setCurrentLabel(emptyDisplay.currentLabel);
    setters.resetPeriodStats();
}

function applyBloodSugarStats(
    items: MeasureDataItem[],
    setters: {
        setMaxValue: (value: string) => void;
        setMinValue: (value: string) => void;
        setMeasureCount: (count: number | null) => void;
        resetPeriodStats: () => void;
    },
) {
    const stats = buildBloodSugarStatsFromItems(items);
    if (stats) {
        setters.setMaxValue(String(stats.max));
        setters.setMinValue(String(stats.min));
        setters.setMeasureCount(stats.count);
        return;
    }
    setters.resetPeriodStats();
}

async function loadBloodSugarDetailItems(range: BloodSugarChartRange) {
    const { startDate, endDate } = getBloodSugarDetailQueryRange(range);
    const res = (await getMeasureDataDetailByDateRange({
        startDate,
        endDate,
        type: '血糖',
    })) as unknown as { code?: number; data?: MeasureDataItem[] };

    if (!isResourceApiOk(res)) return null;
    return flattenMeasureItems(apiResourceData<MeasureDataItem[]>(res));
}

export default function VitalsPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<BloodSugarChartRange>('today');
    const [goalCycleDays, setGoalCycleDays] = useState<number | null>(null);
    const [goalCompliantDays, setGoalCompliantDays] = useState<number | null>(null);
    const [showGoalSummary, setShowGoalSummary] = useState(false);
    const [chartData, setChartData] = useState<BloodSugarPoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [maxValue, setMaxValue] = useState('--');
    const [minValue, setMinValue] = useState('--');
    const [measureCount, setMeasureCount] = useState<number | null>(null);

    const goalProgressPercent = useMemo(
        () => calcGoalProgressPercent(goalCompliantDays, goalCycleDays),
        [goalCompliantDays, goalCycleDays],
    );

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '血糖' });
    }, [navigation]);

    const handleChartPointChange = useCallback((point: BloodSugarPoint | undefined) => {
        const display = formatBloodSugarDetailPointDisplay(
            selectedType,
            point as BloodSugarDetailPoint | undefined,
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
            if (!hasBloodSugarHealthGoal(rule)) {
                setShowGoalSummary(false);
                setGoalCycleDays(null);
                setGoalCompliantDays(null);
                return;
            }

            setShowGoalSummary(true);
            const summary = buildBloodSugarGoalSummary(rule);
            setGoalCycleDays(summary.cycleDays);

            if (!summary.exPatientRuleId) return;

            const countRes = await getMeasureDataNormalDayCount({
                exPatientRuleId: summary.exPatientRuleId,
                type: '血糖',
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

    const resetPeriodStats = useCallback(() => {
        setMaxValue('--');
        setMinValue('--');
        setMeasureCount(null);
    }, []);

    const loadMeasureData = useCallback(async (range: BloodSugarChartRange) => {
        const emptySetters = {
            setChartData,
            setDisplayValue,
            setDisplayStatus,
            setDisplayStatusColor,
            setCurrentLabel,
            resetPeriodStats,
        };
        const statsSetters = {
            setMaxValue,
            setMinValue,
            setMeasureCount,
            resetPeriodStats,
        };

        try {
            const detailItems = await loadBloodSugarDetailItems(range);
            if (detailItems == null) {
                applyEmptyBloodSugarState(range, emptySetters);
                return;
            }

            setChartData(
                range === 'today'
                    ? buildBloodSugarDetailTodaySeries(detailItems)
                    : buildBloodSugarDetailPeriodSeries(detailItems, range),
            );
            applyBloodSugarStats(detailItems, statsSetters);
        } catch {
            applyEmptyBloodSugarState(range, emptySetters);
        }
    }, [resetPeriodStats]);

    useFocusEffect(
        useCallback(() => {
            void loadGoalSummary();
            void loadMeasureData(selectedType);
        }, [loadGoalSummary, loadMeasureData, selectedType]),
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '血糖',
    });

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
                                    血糖控制目标{formatGoalDays(goalCycleDays)}天
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
                            <Text style={styles.rowTitle}>血糖(mmol/L)</Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>正常范围：3.9-6.1 mmol/L</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <BloodSugarDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                        />
                    </View>

                    <Flex justify='center' style={styles.colTopBox}>
                        <Flex>
                            <Flex style={styles.colRightBor}></Flex>
                            <Text style={styles.colRightText}>偏低</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colLBor}></Flex>
                            <Text style={styles.colLText}>正常</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colHBor}></Flex>
                            <Text style={styles.colHText}>偏高</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colHxBor}></Flex>
                            <Text style={styles.colHxText}>高风险</Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.colRow}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>最高值(mmol/L)</Text>
                            <Text style={styles.HValue}>{maxValue}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>最低值(mmol/L)</Text>
                            <Text style={styles.LValue}>{minValue}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>测量次数(次)</Text>
                            <Text style={styles.rValue}>{measureCount ?? '--'}</Text>
                        </View>
                    </Flex>
                </ScrollView>
                <Flex
                    justify="between"
                    style={[
                        styles.bottomBar,
                        { height:100, paddingBottom: insets.bottom },
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
