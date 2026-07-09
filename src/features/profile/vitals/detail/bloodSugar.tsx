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
import BloodSugarDetailChart, { type BloodSugarChartRange } from './components/BloodSugarDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import {
    getMeasureDataDetailByDate,
    getMeasureDataNormalDayCount,
    getMeasureDataStatisByDateRange,
    type MeasureDataItem,
    type MeasureDataStatisDayGroup,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDateRange } from '../vitalsHelpers';
import {
    buildBloodSugarChartFromStatisGroups,
    buildBloodSugarDetailTodaySeries,
    calcBloodSugarPeriodStats,
    flattenStatisChildItems,
    formatBloodSugarDetailPointDisplay,
    type BloodSugarDetailPoint,
} from './helpers/bloodSugar';
import {
    mapDetailChartRangeToVitalsRange,
    normalizeStatisRangeData,
} from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';
import type { BloodSugarPoint } from './components/BloodSugarDetailChart';

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
        try {
            if (range === 'today') {
                const res = (await getMeasureDataDetailByDate({
                    customerLocalDate: moment().format('YYYY-MM-DD'),
                    type: '血糖',
                })) as unknown as { code?: number; data?: MeasureDataItem[] };

                if (!isResourceApiOk(res)) {
                    setChartData([]);
                    const emptyDisplay = resetHeaderDisplay(range);
                    setDisplayValue(emptyDisplay.value);
                    setDisplayStatus(formatStatusText(emptyDisplay.status));
                    setDisplayStatusColor(emptyDisplay.statusColor);
                    setCurrentLabel(emptyDisplay.currentLabel);
                    resetPeriodStats();
                    return;
                }

                const items = apiResourceData<MeasureDataItem[]>(res) ?? [];
                const stats = calcBloodSugarPeriodStats(items);

                setChartData(buildBloodSugarDetailTodaySeries(items));
                if (stats) {
                    setMaxValue(String(stats.max));
                    setMinValue(String(stats.min));
                    setMeasureCount(stats.count);
                } else {
                    resetPeriodStats();
                }
                return;
            }

            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getMeasureDataStatisByDateRange({
                startDate,
                endDate,
                type: '血糖',
            })) as unknown as { code?: number; data?: MeasureDataStatisDayGroup[] };

            if (!isResourceApiOk(res)) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(formatStatusText(emptyDisplay.status));
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                resetPeriodStats();
                return;
            }

            const groups = normalizeStatisRangeData(apiResourceData<unknown>(res));
            const periodItems = flattenStatisChildItems(groups);
            const stats = calcBloodSugarPeriodStats(periodItems);

            setChartData(buildBloodSugarChartFromStatisGroups(groups, range));
            if (stats) {
                setMaxValue(String(stats.max));
                setMinValue(String(stats.min));
                setMeasureCount(stats.count);
            } else {
                resetPeriodStats();
            }
        } catch {
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(formatStatusText(emptyDisplay.status));
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            resetPeriodStats();
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
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
                >
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={setSelectedType} />

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
                            <Text style={styles.rowTitle}>
                                {selectedType === 'today' ? '今日血糖' : '平均血糖'}(mmol/L)
                            </Text>
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
