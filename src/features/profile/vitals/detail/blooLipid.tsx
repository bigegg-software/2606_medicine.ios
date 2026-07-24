import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import WeightDetailChart, {
    type WeightDetailPoint,
} from './components/WeightDetailChart';
import type { HealthGoalTarget } from '@/api/healthGoal';
import {
    getMeasureDataAllRecords,
    type MeasureDataAllRecordsResult,
    type MeasureDataItem,
} from '@/api/measureData';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    BLOOD_LIPID_RECENT_PAGE_SIZE,
    buildBloodLipidCompareSummary,
    buildBloodLipidDetailSeries,
    buildBloodLipidDetailYAxis,
    flattenBloodLipidAllRecords,
    formatBloodLipidDetailPointDisplay,
    formatBloodLipidTcGoalProgressStatus,
    getBloodLipidChartReferenceLines,
    getBloodLipidRecentItems,
    loadBloodLipidPrescriptionGoalSummary,
    getBloodLipidMetricTabs,
    getBloodLipidMetricTitle,
    getBloodLipidNormalRangeText,
    type BloodLipidCompareSummary,
    type BloodLipidDetailPoint,
    type BloodLipidGoalRow,
    type BloodLipidMetricKey,
} from './helpers/bloodLipid';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function applyEmptyDisplay(
    setters: {
        setAllItems: (items: MeasureDataItem[]) => void;
        setCompareSummary: (summary: BloodLipidCompareSummary | null) => void;
        setDisplayValue: (value: string) => void;
        setDisplayStatus: (status: string) => void;
        setDisplayStatusColor: (color: string) => void;
        setCurrentLabel: (label: string) => void;
    },
    metricKey: BloodLipidMetricKey,
) {
    const emptyDisplay = formatBloodLipidDetailPointDisplay(undefined, metricKey);
    setters.setAllItems([]);
    setters.setCompareSummary(null);
    setters.setDisplayValue(emptyDisplay.value);
    setters.setDisplayStatus(formatStatusText(emptyDisplay.status));
    setters.setDisplayStatusColor(emptyDisplay.statusColor);
    setters.setCurrentLabel(emptyDisplay.currentLabel);
}

export default function BloodLipidPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const lipidTabs = useMemo(() => getBloodLipidMetricTabs(), []);
    const [selectedLipidType, setSelectedLipidType] = useState<BloodLipidMetricKey>('TC');
    const [allItems, setAllItems] = useState<MeasureDataItem[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('--');
    const [showGoalSummary, setShowGoalSummary] = useState(false);
    const [goalRows, setGoalRows] = useState<BloodLipidGoalRow[]>([]);
    const [prescriptionTarget, setPrescriptionTarget] = useState<HealthGoalTarget | null>(null);
    const [prescriptionPeriodItems, setPrescriptionPeriodItems] = useState<MeasureDataItem[]>([]);
    const [compareSummary, setCompareSummary] = useState<BloodLipidCompareSummary | null>(null);

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '血脂' });
    }, [navigation]);

    const handleChartPointChange = useCallback((point: WeightDetailPoint | undefined) => {
        const display = formatBloodLipidDetailPointDisplay(
            point as BloodLipidDetailPoint | undefined,
            selectedLipidType,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [selectedLipidType]);

    const loadPrescriptionGoal = useCallback(async (fallbackItems: MeasureDataItem[]) => {
        const summary = await loadBloodLipidPrescriptionGoalSummary(fallbackItems);
        if (!summary) {
            setShowGoalSummary(false);
            setGoalRows([]);
            setPrescriptionTarget(null);
            setPrescriptionPeriodItems([]);
            return null;
        }

        setShowGoalSummary(summary.rows.length > 0);
        setGoalRows(summary.rows);
        setPrescriptionTarget(summary.target);
        setPrescriptionPeriodItems(summary.periodItems);
        return summary;
    }, []);

    const loadMeasureData = useCallback(async () => {
        const setters = {
            setAllItems,
            setCompareSummary,
            setDisplayValue,
            setDisplayStatus,
            setDisplayStatusColor,
            setCurrentLabel,
        };

        try {
            const res = (await getMeasureDataAllRecords({
                type: '血脂',
                pageSize: BLOOD_LIPID_RECENT_PAGE_SIZE,
                pageNum: 1,
            })) as unknown as MeasureDataAllRecordsResult;

            if (!isResourceApiOk(res)) {
                applyEmptyDisplay(setters, selectedLipidType);
                return;
            }

            const items = flattenBloodLipidAllRecords(res.rows);
            const recentItems = getBloodLipidRecentItems(items);
            setAllItems(items);

            const prescriptionSummary = await loadPrescriptionGoal(items);

            const rule = prescriptionSummary?.rule;
            const baselineItems = prescriptionSummary?.periodItems ?? [];
            const compareFromPrescription = rule?.startDate && rule?.endDate && baselineItems.length
                ? buildBloodLipidCompareSummary(
                    baselineItems,
                    rule.startDate,
                    rule.endDate,
                )
                : null;

            if (compareFromPrescription) {
                setCompareSummary(compareFromPrescription);
            } else if (recentItems.length >= 2) {
                setCompareSummary(buildBloodLipidCompareSummary(recentItems));
            } else {
                setCompareSummary(null);
            }
        } catch {
            applyEmptyDisplay(setters, selectedLipidType);
        }
    }, [loadPrescriptionGoal, selectedLipidType]);

    useFocusEffect(
        useCallback(() => {
            void loadMeasureData();
        }, [loadMeasureData]),
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '血脂',
    });

    const chartData = useMemo(
        () => buildBloodLipidDetailSeries(allItems, selectedLipidType),
        [allItems, selectedLipidType],
    );

    const normalRangeText = useMemo(
        () => getBloodLipidNormalRangeText(selectedLipidType),
        [selectedLipidType],
    );

    const chartCategoryLabels = useMemo(
        () => chartData.map(point => point.hour),
        [chartData],
    );
    const tcGoalProgressStatus = useMemo(
        () => formatBloodLipidTcGoalProgressStatus(
            prescriptionTarget,
            prescriptionPeriodItems,
            allItems,
        ),
        [prescriptionTarget, prescriptionPeriodItems, allItems],
    );

    const lipidYAxisBuilder = useCallback(
        (points: WeightDetailPoint[]) =>
            buildBloodLipidDetailYAxis(points as BloodLipidDetailPoint[], selectedLipidType),
        [selectedLipidType],
    );
    const chartReferenceLines = useMemo(
        () => getBloodLipidChartReferenceLines(selectedLipidType),
        [selectedLipidType],
    );

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <View style={styles.pageContent}>
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
                >
                    {showGoalSummary && goalRows.length ? (
                        <View style={[styles.rowBox, { marginTop: 10 }]}>
                            <Text style={[styles.rowLeftValue, { fontSize: 16 }]}>血脂控制目标</Text>
                            {goalRows.map(row => (
                                <Flex key={row.shortLabel} style={styles.topTextBox}>
                                    <View style={styles.leftIcon} />
                                    <Text style={styles.typeTitle}>{row.shortLabel}</Text>
                                    <Text style={styles.rowTitle1}>{row.fullLabel}</Text>
                                    {row.icon === 'down' ? (
                                        <Image
                                            style={styles.rowImage}
                                            tintColor="#EE9C44"
                                            source={require('@/assets/images/vitals/icon_xj.png')}
                                        />
                                    ) : null}
                                    {row.icon === 'up' ? (
                                        <Image
                                            style={styles.rowImage}
                                            tintColor="#EE9C44"
                                            source={require('@/assets/images/vitals/icon_up.png')}
                                        />
                                    ) : null}
                                    <Text style={styles.rowValue}>{row.currentAmountText}</Text>
                                </Flex>
                            ))}
                        </View>
                    ) : null}

                    {compareSummary ? (
                        <View style={[styles.rowBox, { marginTop: 10 }]}>
                            <Flex justify="between">
                                <Text style={[styles.rowLeftValue, { fontSize: 16 }]}>指标对比</Text>
                                <Flex style={[styles.status1Box, { borderColor: tcGoalProgressStatus.color }]}>
                                    <Text style={[styles.status1Text, { color: tcGoalProgressStatus.color }]}>
                                        {tcGoalProgressStatus.text}
                                    </Text>
                                </Flex>
                            </Flex>
                            <Flex style={styles.dbBox}>
                                <Flex style={styles.dbBoxItem}>
                                    <Text style={styles.dbBoxItemText}>初始</Text>
                                    <Text style={styles.dbBoxItemValue}>{compareSummary.initialDateText}</Text>
                                </Flex>
                                <Image style={styles.dbImage} source={require('@/assets/images/vitals/db.png')} />
                                <Flex style={styles.dbBoxItem}>
                                    <Text style={styles.dbBoxItemText}>最近</Text>
                                    <Text style={styles.dbBoxItemValue}>{compareSummary.recentDateText}</Text>
                                </Flex>
                            </Flex>
                            {compareSummary.rows.map(row => {
                                const isImproved = row.outcome === 'improved';
                                const isWorsened = row.outcome === 'worsened';
                                return (
                                    <Flex key={row.key} justify="between" style={styles.dbCol}>
                                        <View>
                                            <Text style={styles.dbColTitle}>{row.shortLabel}</Text>
                                            <Text style={styles.dbColTitle1}>{row.fullLabel}</Text>
                                        </View>
                                        <Flex>
                                            <Text style={styles.dbColValue}>{row.initialText}</Text>
                                            <Image
                                                style={styles.dbColImg}
                                                source={require('@/assets/images/vitals/you.png')}
                                            />
                                            <Text style={styles.dbColValue1}>{row.recentText}</Text>
                                        </Flex>
                                        <Flex>
                                            <Text
                                                style={isWorsened ? styles.dbRightValue_1 : styles.dbRightValue}
                                            >
                                                {row.diffText}
                                            </Text>
                                            {isImproved ? (
                                                <Image
                                                    style={styles.dbColRightImg}
                                                    source={require('@/assets/images/vitals/xia.png')}
                                                />
                                            ) : null}
                                            {isWorsened ? (
                                                <Image
                                                    style={styles.dbColRightImg}
                                                    source={require('@/assets/images/vitals/shang.png')}
                                                />
                                            ) : null}
                                            <Text
                                                style={isWorsened ? styles.dbRightValue1_1 : styles.dbRightValue1}
                                            >
                                                {row.outcome === 'unchanged'
                                                    ? '持平'
                                                    : isImproved
                                                        ? '改善'
                                                        : '加重'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                );
                            })}
                        </View>
                    ) : null}

                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify="between">
                            <Text style={[styles.rowLeftValue, { fontSize: 16 }]}>
                                {getBloodLipidMetricTitle(selectedLipidType)}
                            </Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowTitle}>mmol/L</Text>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify="between">
                            <Text style={styles.rowTitle}>正常范围：{normalRangeText}</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>
                        <Flex style={styles.tabBox}>
                            {lipidTabs.map(item => {
                                const isActive = selectedLipidType === item.value;
                                return (
                                    <TouchableOpacity
                                        key={item.value}
                                        activeOpacity={0.85}
                                        onPress={() => setSelectedLipidType(item.value)}
                                        style={[styles.tabItem, isActive && styles.tabItemActive]}
                                    >
                                        <Flex justify="center" style={{ flex: 1 }}>
                                            <Text
                                                style={[
                                                    styles.tabItemText,
                                                    isActive && styles.tabItemTextActive,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </Flex>
                                    </TouchableOpacity>
                                );
                            })}
                        </Flex>
                        <WeightDetailChart
                            range="week"
                            data={chartData}
                            categoryLabels={chartCategoryLabels}
                            onPointChange={handleChartPointChange}
                            yAxisBuilder={lipidYAxisBuilder}
                            safetyLineY={chartReferenceLines.safetyLineY}
                            safetyLineLabel={chartReferenceLines.safetyLineLabel}
                        />
                        <Text style={styles.btmText}>最近10次测量</Text>
                    </View>
                </ScrollView>
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.bottomBarButtonLeft}
                        activeOpacity={0.7}
                        onPress={navigateToAddData}
                    >
                        <Flex style={{ flex: 1 }}>
                            <Image
                                style={styles.bottomBarButtonImg}
                                source={require('@/assets/images/vitals/icon_add.png')}
                            />
                            <Text style={styles.bottomBarButtonTextLeft}>添加记录</Text>
                        </Flex>
                    </TouchableOpacity>
                </View>
            </View>
            {menuModals}
        </PageLayout>
    );
}
