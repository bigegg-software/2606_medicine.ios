import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import BloodOxygenDetailChart, { type BloodOxygenChartRange, type BloodOxygenPoint } from './components/BloodOxygenDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getWearableDataDetailByDateRange,
    WEARABLE_DATA_TYPES,
    type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDateRange, sortWearableItems, getWearableReturnOriginalDataParam } from '../vitalsHelpers';
import {
    buildBloodOxygenDetailPeriodSeries,
    buildBloodOxygenDetailTodaySeries,
    calcBloodOxygenDetailStats,
    formatBloodOxygenDetailPointDisplay,
    type BloodOxygenDetailPoint,
} from './helpers/bloodOxygen';
import { mapDetailChartRangeToVitalsRange } from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function resetHeaderDisplay(range: BloodOxygenChartRange) {
    return formatBloodOxygenDetailPointDisplay(range);
}

const EMPTY_OVERVIEW = {
    latestValue: '--',
    rangeText: '--',
    abnormalCount: null as number | null,
};

export default function VitalsPage() {
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<BloodOxygenChartRange>('today');
    const [chartData, setChartData] = useState<BloodOxygenPoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [overview, setOverview] = useState(EMPTY_OVERVIEW);

    const handleChartPointChange = useCallback((point: BloodOxygenPoint | undefined) => {
        const display = formatBloodOxygenDetailPointDisplay(
            selectedType,
            point as BloodOxygenDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [selectedType]);

    const loadBloodOxygenData = useCallback(async (range: BloodOxygenChartRange) => {
        try {
            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getWearableDataDetailByDateRange({
                startDate,
                endDate,
                type: WEARABLE_DATA_TYPES.oxygen,
                ...getWearableReturnOriginalDataParam(range),
            })) as unknown as { code?: number; data?: WearableDataItem[] };

            if (!isResourceApiOk(res)) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(formatStatusText(emptyDisplay.status));
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                setOverview(EMPTY_OVERVIEW);
                return;
            }

            const items = sortWearableItems(apiResourceData<WearableDataItem[]>(res) ?? []);
            const stats = calcBloodOxygenDetailStats(items, range);

            if (range === 'today') {
                setChartData(buildBloodOxygenDetailTodaySeries(items));
            } else {
                setChartData(buildBloodOxygenDetailPeriodSeries(items, range));
            }

            if (stats) {
                setOverview({
                    latestValue: stats.latestValue,
                    rangeText: stats.rangeText,
                    abnormalCount: stats.abnormalCount,
                });
            } else {
                setOverview(EMPTY_OVERVIEW);
            }
        } catch {
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(formatStatusText(emptyDisplay.status));
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            setOverview(EMPTY_OVERVIEW);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadBloodOxygenData(selectedType);
        }, [loadBloodOxygenData, selectedType]),
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '血氧',
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

                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>
                                {selectedType === 'today' ? '血氧(%)' : '平均血氧(%)'}
                            </Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>正常范围: 95-100</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <BloodOxygenDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                        />
                    </View>

                    <View style={[styles.rowBox, { marginTop: 30 }]}>
                        <Text style={styles.analysisTitle}>血氧总览</Text>
                        <Flex justify='between' style={styles.analysisContent}>
                            <View>
                                <Text style={styles.analysis1}>最新值(%)</Text>
                                <Text style={styles.analysis2}>{overview.latestValue}</Text>
                            </View>
                            <View>
                                <Text style={styles.analysis1}>饱和度范围(%)</Text>
                                <Text style={styles.analysis2}>{overview.rangeText}</Text>
                            </View>
                            <View>
                                <Text style={styles.analysis1}>异常次数</Text>
                                <Text style={styles.analysis3}>{overview.abnormalCount ?? '--'}</Text>
                            </View>
                        </Flex>
                        <Flex justify='center' style={styles.analysisIntro}>
                            <Text style={styles.analysisIntroText}>正常范围 95-100 %，低于 90% 为异常</Text>
                        </Flex>
                    </View>
                </ScrollView>
            </View>
            {menuModals}
        </PageLayout>
    );
}
