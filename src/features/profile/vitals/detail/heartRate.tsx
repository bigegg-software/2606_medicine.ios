import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import HeartRateDetailChart, { type HeartRateChartRange, type HeartRatePoint } from './components/HeartRateDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getWearableDataDetailByDateRange,
    WEARABLE_DATA_TYPES,
    type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDateRange, sortWearableItems } from '../vitalsHelpers';
import {
    buildHeartRateDetailPeriodSeries,
    buildHeartRateDetailTodaySeries,
    calcHeartRateDetailStats,
    formatHeartRateDetailPointDisplay,
    mapDetailChartRangeToVitalsRange,
    type HeartRateDetailPoint,
} from './detailHelpers';

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function resetHeaderDisplay(range: HeartRateChartRange) {
    return formatHeartRateDetailPointDisplay(range);
}

const EMPTY_STATS = {
    rangeText: '--',
    restingHeartRate: '--',
    highCount: null as number | null,
    lowCount: null as number | null,
    periodLabel: '今日区间',
};

export default function VitalsPage() {
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<HeartRateChartRange>('today');
    const [chartData, setChartData] = useState<HeartRatePoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [stats, setStats] = useState(EMPTY_STATS);

    const handleChartPointChange = useCallback((point: HeartRatePoint | undefined) => {
        const display = formatHeartRateDetailPointDisplay(
            selectedType,
            point as HeartRateDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [selectedType]);

    const loadHeartRateData = useCallback(async (range: HeartRateChartRange) => {
        try {
            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getWearableDataDetailByDateRange({
                startDate,
                endDate,
                type: WEARABLE_DATA_TYPES.heartRate,
            })) as unknown as { code?: number; data?: WearableDataItem[] };

            if (!isResourceApiOk(res)) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(formatStatusText(emptyDisplay.status));
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                setStats({ ...EMPTY_STATS, periodLabel: range === 'week' ? '近7天' : range === 'month' ? '近30天' : '今日区间' });
                return;
            }

            const items = sortWearableItems(apiResourceData<WearableDataItem[]>(res) ?? []);
            const periodStats = calcHeartRateDetailStats(items, range);

            if (range === 'today') {
                setChartData(buildHeartRateDetailTodaySeries(items));
            } else {
                setChartData(buildHeartRateDetailPeriodSeries(items, range));
            }

            if (periodStats) {
                setStats({
                    rangeText: periodStats.rangeText,
                    restingHeartRate: periodStats.restingHeartRate,
                    highCount: periodStats.highCount,
                    lowCount: periodStats.lowCount,
                    periodLabel: periodStats.periodLabel,
                });
            } else {
                setStats({
                    ...EMPTY_STATS,
                    periodLabel: range === 'week' ? '近7天' : range === 'month' ? '近30天' : '今日区间',
                });
            }
        } catch {
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(formatStatusText(emptyDisplay.status));
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            setStats({
                ...EMPTY_STATS,
                periodLabel: range === 'week' ? '近7天' : range === 'month' ? '近30天' : '今日区间',
            });
        }
    }, []);

    useEffect(() => {
        loadHeartRateData(selectedType);
    }, [loadHeartRateData, selectedType]);

    useFocusEffect(
        useCallback(() => {
            loadHeartRateData(selectedType);
        }, [loadHeartRateData, selectedType]),
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
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
                >
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={setSelectedType} />

                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>平均心率（次/分）</Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>正常范围: 60-100</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <HeartRateDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                        />
                    </View>

                    <Flex style={[styles.colRow, { marginTop: 30 }]}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle} numberOfLines={1}>心率范围（次/分）</Text>
                            <Text style={styles.rValue}>{stats.rangeText}</Text>
                            <Text style={styles.rowIntro}>{stats.periodLabel}</Text>
                            <Image style={styles.colImage1} source={require('@/assets/images/vitals/fw.png')} />
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle} numberOfLines={1}>静息心率（次/分）</Text>
                            <Text style={styles.rValue}>{stats.restingHeartRate}</Text>
                            <Text style={styles.rowIntro}>{stats.periodLabel}</Text>
                            <Image style={styles.colImage2} source={require('@/assets/images/vitals/xl.png')} />
                        </View>
                    </Flex>
                    <Flex style={styles.colRow}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle} numberOfLines={1}>心率过高（次）</Text>
                            <Text style={styles.rValue}>{stats.highCount ?? '--'}</Text>
                            <Text style={styles.rowIntro}>{'> 100 次/分'}</Text>
                            <Image style={styles.colImage3} source={require('@/assets/images/vitals/up.png')} />
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle} numberOfLines={1}>心率过低（次）</Text>
                            <Text style={styles.rValue}>{stats.lowCount ?? '--'}</Text>
                            <Text style={styles.rowIntro}>{'< 60 次/分'}</Text>
                            <Image style={styles.colImage3} source={require('@/assets/images/vitals/jd.png')} />
                        </View>
                    </Flex>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
