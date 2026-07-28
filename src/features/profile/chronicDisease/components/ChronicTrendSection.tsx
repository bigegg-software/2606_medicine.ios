import React, { useCallback, useMemo, useState } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import styles from '@/css/chronicDisease/detail';
import vitalStyles from '@/css/vitals/bloodPage';
import type { RootState } from '@/store/store';
import BloodPressureDetailChart from '@/src/features/profile/vitals/detail/components/BloodPressureDetailChart';
import BloodSugarDetailChart, {
    type BloodSugarPoint,
} from '@/src/features/profile/vitals/detail/components/BloodSugarDetailChart';
import HeartRateDetailChart, {
    type HeartRatePoint,
} from '@/src/features/profile/vitals/detail/components/HeartRateDetailChart';
import BloodOxygenDetailChart, {
    type BloodOxygenPoint,
} from '@/src/features/profile/vitals/detail/components/BloodOxygenDetailChart';
import WeightDetailChart, {
    type WeightDetailPoint,
} from '@/src/features/profile/vitals/detail/components/WeightDetailChart';
import {
    formatBloodPressureDetailPointDisplay,
    formatBloodPressureNormalRangeText,
    getBloodPressureReferenceLineY,
    type BloodPressureDetailPoint,
} from '@/src/features/profile/vitals/detail/helpers/bloodPressure';
import {
    buildBloodSugarDetailPeriodSeries,
    buildBloodSugarStatsFromItems,
    formatBloodSugarDetailPointDisplay,
    type BloodSugarDetailPoint,
} from '@/src/features/profile/vitals/detail/helpers/bloodSugar';
import {
    buildBloodLipidDetailSeries,
    buildBloodLipidDetailYAxis,
    formatBloodLipidDetailPointDisplay,
    getBloodLipidChartReferenceLines,
    getBloodLipidMetricTabs,
    getBloodLipidMetricTitle,
    getBloodLipidNormalRangeText,
    type BloodLipidDetailPoint,
    type BloodLipidMetricKey,
} from '@/src/features/profile/vitals/detail/helpers/bloodLipid';
import {
    buildUricAcidDetailSeries,
    buildUricAcidDetailYAxis,
    calcUricAcidCompareToPrevious,
    formatUricAcidDetailPointDisplay,
    formatUricAcidNormalRangeText,
    getUricAcidChartReferenceLines,
    type UricAcidDetailPoint,
} from '@/src/features/profile/vitals/detail/helpers/uricAcid';
import {
    buildHeartRateDetailPeriodSeries,
    calcHeartRateDetailStats,
    formatHeartRateDetailPointDisplay,
    type HeartRateDetailPoint,
} from '@/src/features/profile/vitals/detail/helpers/heartRate';
import {
    buildBloodOxygenDetailPeriodSeries,
    calcBloodOxygenDetailStats,
    formatBloodOxygenDetailPointDisplay,
    type BloodOxygenDetailPoint,
} from '@/src/features/profile/vitals/detail/helpers/bloodOxygen';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import type { MeasureDataItem } from '@/api/measureData';
import type { WearableDataItem } from '@/api/wearableData';
import type { ChronicDetailData } from './chronicData';
import {
    countChronicHeartRateAbnormal,
    enrichChronicBloodPressureMonthSeries,
    getChronicControlStatusColor,
    getChronicControlStatusLabel,
} from './utils/chronicTrendHelpers';

type Props = {
    detail: ChronicDetailData;
};

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function BloodPressureTrendCard({
    series,
    measureItems,
    stats,
}: {
    series: BloodPressurePoint[];
    measureItems: ChronicDetailData['measureItems'];
    stats: ChronicDetailData['stats'];
}) {
    const userGender = useSelector((state: RootState) => state.user.info?.gender);
    const chartData = useMemo(
        () => enrichChronicBloodPressureMonthSeries(series, measureItems),
        [measureItems, series],
    );
    const referenceLines = useMemo(() => getBloodPressureReferenceLineY(userGender), [userGender]);
    const normalRangeText = useMemo(
        () => formatBloodPressureNormalRangeText(userGender),
        [userGender],
    );

    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：--');

    const handleChartPointChange = useCallback((point: BloodPressurePoint | undefined) => {
        const display = formatBloodPressureDetailPointDisplay(
            'month',
            point as BloodPressureDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, []);

    return (
        <>
            <View style={styles.trendCard}>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>平均血压(mmHg)</Text>
                    <Flex style={[vitalStyles.statusBox, { borderColor: displayStatusColor }]}>
                        <Text style={[vitalStyles.statusText, { color: displayStatusColor }]}>
                            {displayStatus}
                        </Text>
                    </Flex>
                </Flex>
                <Text style={vitalStyles.rowLeftValue}>{displayValue}</Text>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>正常范围:{normalRangeText}</Text>
                    <Flex style={vitalStyles.dayBox}>
                        <Text style={vitalStyles.dayText}>{currentLabel}</Text>
                    </Flex>
                </Flex>
                <BloodPressureDetailChart
                    range="month"
                    data={chartData}
                    referenceHighY={referenceLines.high}
                    referenceLowY={referenceLines.low}
                    onPointChange={handleChartPointChange}
                />
            </View>
            <Flex justify="center" style={vitalStyles.colTopBox}>
                <Flex>
                    <Flex style={vitalStyles.colLeftBor} />
                    <Text style={vitalStyles.colLeftText}>高压（收缩压）</Text>
                </Flex>
                <Flex>
                    <Flex style={vitalStyles.colRightBor} />
                    <Text style={vitalStyles.colRightText}>低压（舒张压）</Text>
                </Flex>
            </Flex>
            <View style={styles.bpStatCard}>
                <Flex style={styles.bpStatRow}>
                    <View style={styles.bpStatItem}>
                        <Text style={styles.bpStatTitle}>达标率</Text>
                        <Text style={styles.bpStatValue}>
                            {stats.complianceRate ?? stats.bpComplianceRate ?? '--'}
                        </Text>
                    </View>
                    <View style={styles.bpStatItem}>
                        <Text style={styles.bpStatTitle}>最高</Text>
                        <Text style={styles.bpStatValue}>{stats.maxBp ?? '--'}</Text>
                    </View>
                    <View style={styles.bpStatItem}>
                        <Text style={styles.bpStatTitle}>最低</Text>
                        <Text style={styles.bpStatValue}>{stats.minBp ?? '--'}</Text>
                    </View>
                </Flex>
            </View>
        </>
    );
}

function BloodSugarTrendCard({ measureItems }: { measureItems: MeasureDataItem[] }) {
    const chartData = useMemo(
        () => buildBloodSugarDetailPeriodSeries(measureItems, 'month'),
        [measureItems],
    );
    const stats = useMemo(() => buildBloodSugarStatsFromItems(measureItems), [measureItems]);

    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：--');

    const handleChartPointChange = useCallback((point: BloodSugarPoint | undefined) => {
        const display = formatBloodSugarDetailPointDisplay(
            'month',
            point as BloodSugarDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, []);

    return (
        <>
            <View style={styles.trendCard}>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>血糖(mmol/L)</Text>
                    <Flex style={[vitalStyles.statusBox, { borderColor: displayStatusColor }]}>
                        <Text style={[vitalStyles.statusText, { color: displayStatusColor }]}>
                            {displayStatus}
                        </Text>
                    </Flex>
                </Flex>
                <Text style={vitalStyles.rowLeftValue}>{displayValue}</Text>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>正常范围：3.9-6.1 mmol/L</Text>
                    <Flex style={vitalStyles.dayBox}>
                        <Text style={vitalStyles.dayText}>{currentLabel}</Text>
                    </Flex>
                </Flex>
                <BloodSugarDetailChart
                    range="month"
                    data={chartData}
                    onPointChange={handleChartPointChange}
                />
            </View>
            <Flex justify="center" style={vitalStyles.colTopBox}>
                <Flex>
                    <Flex style={vitalStyles.colRightBor} />
                    <Text style={vitalStyles.colRightText}>偏低</Text>
                </Flex>
                <Flex>
                    <Flex style={vitalStyles.colLBor} />
                    <Text style={vitalStyles.colLText}>正常</Text>
                </Flex>
                <Flex>
                    <Flex style={vitalStyles.colHBor} />
                    <Text style={vitalStyles.colHText}>偏高</Text>
                </Flex>
                <Flex>
                    <Flex style={vitalStyles.colHxBor} />
                    <Text style={vitalStyles.colHxText}>高风险</Text>
                </Flex>
            </Flex>
            <Flex style={vitalStyles.colRow}>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle}>最高值(mmol/L)</Text>
                    <Text style={vitalStyles.HValue}>{stats ? String(stats.max) : '--'}</Text>
                </View>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle}>最低值(mmol/L)</Text>
                    <Text style={vitalStyles.LValue}>{stats ? String(stats.min) : '--'}</Text>
                </View>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle}>测量次数(次)</Text>
                    <Text style={vitalStyles.rValue}>{stats?.count ?? '--'}</Text>
                </View>
            </Flex>
        </>
    );
}

function BloodLipidTrendCard({ measureItems }: { measureItems: MeasureDataItem[] }) {
    const lipidTabs = useMemo(() => getBloodLipidMetricTabs(), []);
    const [selectedLipidType, setSelectedLipidType] = useState<BloodLipidMetricKey>('TC');
    const chartData = useMemo(
        () => buildBloodLipidDetailSeries(measureItems, selectedLipidType),
        [measureItems, selectedLipidType],
    );
    const normalRangeText = useMemo(
        () => getBloodLipidNormalRangeText(selectedLipidType),
        [selectedLipidType],
    );
    const chartCategoryLabels = useMemo(
        () => chartData.map(point => point.hour),
        [chartData],
    );
    const chartReferenceLines = useMemo(
        () => getBloodLipidChartReferenceLines(selectedLipidType),
        [selectedLipidType],
    );
    const lipidYAxisBuilder = useCallback(
        (points: WeightDetailPoint[]) =>
            buildBloodLipidDetailYAxis(points as BloodLipidDetailPoint[], selectedLipidType),
        [selectedLipidType],
    );

    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('--');

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

    return (
        <View style={styles.trendCard}>
            <Flex justify="between">
                <Text style={[vitalStyles.rowLeftValue, { fontSize: 16, marginTop: 0, marginBottom: 0 }]}>
                    {getBloodLipidMetricTitle(selectedLipidType)}
                </Text>
                <Flex style={[vitalStyles.statusBox, { borderColor: displayStatusColor }]}>
                    <Text style={[vitalStyles.statusText, { color: displayStatusColor }]}>
                        {displayStatus}
                    </Text>
                </Flex>
            </Flex>
            <Text style={styles.trendMetricTitle}>mmol/L</Text>
            <Text style={vitalStyles.rowLeftValue}>{displayValue}</Text>
            <Flex justify="between">
                <Text style={styles.trendMetricTitle}>正常范围：{normalRangeText}</Text>
                <Flex style={vitalStyles.dayBox}>
                    <Text style={vitalStyles.dayText}>{currentLabel}</Text>
                </Flex>
            </Flex>
            <Flex style={vitalStyles.tabBox}>
                {lipidTabs.map(item => {
                    const isActive = selectedLipidType === item.value;
                    return (
                        <TouchableOpacity
                            key={item.value}
                            activeOpacity={0.85}
                            onPress={() => setSelectedLipidType(item.value)}
                            style={[vitalStyles.tabItem, isActive && vitalStyles.tabItemActive]}>
                            <Flex justify="center" style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        vitalStyles.tabItemText,
                                        isActive && vitalStyles.tabItemTextActive,
                                    ]}>
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
            <Text style={vitalStyles.btmText}>最近10次测量</Text>
        </View>
    );
}

function UricAcidTrendCard({ measureItems }: { measureItems: MeasureDataItem[] }) {
    const userGender = useSelector((state: RootState) => state.user.info?.gender);
    const chartData = useMemo(
        () => buildUricAcidDetailSeries(measureItems, userGender),
        [measureItems, userGender],
    );
    const compareInfo = useMemo(
        () => calcUricAcidCompareToPrevious(measureItems),
        [measureItems],
    );
    const normalRangeText = useMemo(
        () => formatUricAcidNormalRangeText(userGender),
        [userGender],
    );
    const chartCategoryLabels = useMemo(
        () => chartData.map(point => point.hour),
        [chartData],
    );
    const chartReferenceLines = useMemo(
        () => getUricAcidChartReferenceLines(userGender),
        [userGender],
    );
    const uricAcidYAxisBuilder = useCallback(
        (points: WeightDetailPoint[]) =>
            buildUricAcidDetailYAxis(points as UricAcidDetailPoint[], userGender),
        [userGender],
    );

    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('--');

    const handleChartPointChange = useCallback((point: WeightDetailPoint | undefined) => {
        const display = formatUricAcidDetailPointDisplay(
            point as UricAcidDetailPoint | undefined,
            userGender,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [userGender]);

    return (
        <View style={styles.trendCard}>
            <Flex justify="between">
                <Text style={styles.trendMetricTitle}>尿酸(μmol/L)</Text>
                <Flex style={[vitalStyles.statusBox, { borderColor: displayStatusColor }]}>
                    <Text style={[vitalStyles.statusText, { color: displayStatusColor }]}>
                        {displayStatus}
                    </Text>
                </Flex>
            </Flex>
            <Text style={vitalStyles.rowLeftValue}>{displayValue}</Text>
            <Flex justify="between">
                <Text style={styles.trendMetricTitle}>正常范围：{normalRangeText}</Text>
                <Flex style={vitalStyles.dayBox}>
                    <Text style={vitalStyles.dayText}>{currentLabel}</Text>
                </Flex>
            </Flex>

            {compareInfo ? (
                <Flex
                    justify="center"
                    style={[vitalStyles.upBox, { backgroundColor: compareInfo.backgroundColor }]}>
                    {compareInfo.icon === 'up' ? (
                        <Image
                            style={vitalStyles.upIcon}
                            source={require('@/assets/images/vitals/icon_up.png')}
                        />
                    ) : null}
                    {compareInfo.icon === 'down' ? (
                        <Image
                            style={vitalStyles.upIcon}
                            source={require('@/assets/images/vitals/icon_xj.png')}
                        />
                    ) : null}
                    <Text style={[vitalStyles.upText, { color: compareInfo.color }]}>
                        {compareInfo.text}
                    </Text>
                </Flex>
            ) : null}

            <WeightDetailChart
                range="week"
                data={chartData}
                categoryLabels={chartCategoryLabels}
                onPointChange={handleChartPointChange}
                yAxisBuilder={uricAcidYAxisBuilder}
                safetyLineY={chartReferenceLines.safetyLineY}
                safetyLineLabel={chartReferenceLines.safetyLineLabel}
            />
            <Text style={vitalStyles.btmText}>最近10次测量</Text>
        </View>
    );
}

function HeartRateTrendCard({
    wearableItems,
    restingWearableItems,
}: {
    wearableItems: WearableDataItem[];
    restingWearableItems: WearableDataItem[];
}) {
    const chartData = useMemo(
        () => buildHeartRateDetailPeriodSeries(wearableItems, 'month'),
        [wearableItems],
    );
    const periodStats = useMemo(
        () => calcHeartRateDetailStats(wearableItems, restingWearableItems, 'month'),
        [restingWearableItems, wearableItems],
    );
    const abnormal = useMemo(
        () => countChronicHeartRateAbnormal(wearableItems),
        [wearableItems],
    );

    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：--');

    const handleChartPointChange = useCallback((point: HeartRatePoint | undefined) => {
        const display = formatHeartRateDetailPointDisplay(
            'month',
            point as HeartRateDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, []);

    return (
        <>
            <View style={styles.trendCard}>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>心率（次/分）</Text>
                    <Flex style={[vitalStyles.statusBox, { borderColor: displayStatusColor }]}>
                        <Text style={[vitalStyles.statusText, { color: displayStatusColor }]}>
                            {displayStatus}
                        </Text>
                    </Flex>
                </Flex>
                <Text style={vitalStyles.rowLeftValue}>{displayValue}</Text>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>正常范围: 60-100</Text>
                    <Flex style={vitalStyles.dayBox}>
                        <Text style={vitalStyles.dayText}>{currentLabel}</Text>
                    </Flex>
                </Flex>
                <HeartRateDetailChart
                    range="month"
                    data={chartData}
                    onPointChange={handleChartPointChange}
                />
            </View>
            <Flex style={[vitalStyles.colRow, { marginTop: 30 }]}>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle} numberOfLines={1}>心率范围（次/分）</Text>
                    <Text style={vitalStyles.rValue}>{periodStats?.rangeText ?? '--'}</Text>
                    <Text style={vitalStyles.rowIntro}>{periodStats?.periodLabel ?? '近30天'}</Text>
                    <Image style={vitalStyles.colImage1} source={require('@/assets/images/vitals/fw.png')} />
                </View>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle} numberOfLines={1}>静息心率（次/分）</Text>
                    <Text style={vitalStyles.rValue}>{periodStats?.restingHeartRate ?? '--'}</Text>
                    <Text style={vitalStyles.rowIntro}>{periodStats?.periodLabel ?? '近30天'}</Text>
                    <Image style={vitalStyles.colImage2} source={require('@/assets/images/vitals/xl.png')} />
                </View>
            </Flex>
            <Flex style={vitalStyles.colRow}>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle} numberOfLines={1}>心率过高（次）</Text>
                    <Text style={vitalStyles.rValue}>{abnormal.highCount}</Text>
                    <Text style={vitalStyles.rowIntro}>{'> 100 次/分'}</Text>
                    <Image style={vitalStyles.colImage3} source={require('@/assets/images/vitals/up.png')} />
                </View>
                <View style={vitalStyles.colBox}>
                    <Text style={vitalStyles.rowTitle} numberOfLines={1}>心率过低（次）</Text>
                    <Text style={vitalStyles.rValue}>{abnormal.lowCount}</Text>
                    <Text style={vitalStyles.rowIntro}>{'< 60 次/分'}</Text>
                    <Image style={vitalStyles.colImage3} source={require('@/assets/images/vitals/jd.png')} />
                </View>
            </Flex>
        </>
    );
}

function BloodOxygenTrendCard({ wearableItems }: { wearableItems: WearableDataItem[] }) {
    const chartData = useMemo(
        () => buildBloodOxygenDetailPeriodSeries(wearableItems, 'month'),
        [wearableItems],
    );
    const overview = useMemo(
        () => calcBloodOxygenDetailStats(wearableItems, 'month'),
        [wearableItems],
    );

    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：--');

    const handleChartPointChange = useCallback((point: BloodOxygenPoint | undefined) => {
        const display = formatBloodOxygenDetailPointDisplay(
            'month',
            point as BloodOxygenDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, []);

    return (
        <>
            <View style={styles.trendCard}>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>血氧(%)</Text>
                    <Flex style={[vitalStyles.statusBox, { borderColor: displayStatusColor }]}>
                        <Text style={[vitalStyles.statusText, { color: displayStatusColor }]}>
                            {displayStatus}
                        </Text>
                    </Flex>
                </Flex>
                <Text style={vitalStyles.rowLeftValue}>{displayValue}</Text>
                <Flex justify="between">
                    <Text style={styles.trendMetricTitle}>正常范围: 95-100</Text>
                    <Flex style={vitalStyles.dayBox}>
                        <Text style={vitalStyles.dayText}>{currentLabel}</Text>
                    </Flex>
                </Flex>
                <BloodOxygenDetailChart
                    range="month"
                    data={chartData}
                    onPointChange={handleChartPointChange}
                />
            </View>
            <View style={[styles.trendCard, { marginTop: 30 }]}>
                <Text style={vitalStyles.analysisTitle}>血氧总览</Text>
                <Flex justify="between" style={vitalStyles.analysisContent}>
                    <View>
                        <Text style={vitalStyles.analysis1}>最新值(%)</Text>
                        <Text style={vitalStyles.analysis2}>{overview?.latestValue ?? '--'}</Text>
                    </View>
                    <View>
                        <Text style={vitalStyles.analysis1}>饱和度范围(%)</Text>
                        <Text style={vitalStyles.analysis2}>{overview?.rangeText ?? '--'}</Text>
                    </View>
                    <View>
                        <Text style={vitalStyles.analysis1}>异常次数</Text>
                        <Text style={vitalStyles.analysis3}>{overview?.abnormalCount ?? '--'}</Text>
                    </View>
                </Flex>
                <Flex justify="center" style={vitalStyles.analysisIntro}>
                    <Text style={vitalStyles.analysisIntroText}>正常范围 95-100 %，低于 90% 为异常</Text>
                </Flex>
            </View>
        </>
    );
}

function renderTrendBody(detail: ChronicDetailData) {
    const {
        config,
        bloodPressureSeries,
        measureItems,
        wearableItems,
        restingWearableItems,
        stats,
    } = detail;

    switch (config.chartKind) {
        case 'bloodPressure':
            return (
                <BloodPressureTrendCard
                    series={bloodPressureSeries}
                    measureItems={measureItems}
                    stats={stats}
                />
            );
        case 'bloodGlucose':
            return <BloodSugarTrendCard measureItems={measureItems} />;
        case 'bloodLipids':
            return <BloodLipidTrendCard measureItems={measureItems} />;
        case 'heartRate':
            return (
                <HeartRateTrendCard
                    wearableItems={wearableItems}
                    restingWearableItems={restingWearableItems}
                />
            );
        case 'uricAcid':
            return <UricAcidTrendCard measureItems={measureItems} />;
        case 'bloodOxygen':
            return <BloodOxygenTrendCard wearableItems={wearableItems} />;
        default:
            return null;
    }
}

export default function ChronicTrendSection({ detail }: Props) {
    const { controlStatus } = detail;
    const statusColor = getChronicControlStatusColor(controlStatus);
    const statusLabel = getChronicControlStatusLabel(controlStatus);

    return (
        <View>
            <View style={styles.statusCard}>
            <Flex justify="between" align="center">
                    <Text style={styles.statusCardLabel}>当前状态</Text>
                    <Flex style={[styles.statusCardBadge, { borderColor: statusColor }]}>
                        <Text style={[styles.statusCardBadgeText, { color: statusColor }]}>
                            {statusLabel}
                    </Text>
                    </Flex>
            </Flex>
            </View>
            {renderTrendBody(detail)}
        </View>
    );
}
