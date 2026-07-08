import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import StepsDetailChart, { type StepsChartRange, type StepsPoint } from './components/StepsDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getWearableDataDetailByDateRange,
    WEARABLE_DATA_TYPES,
    type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDateRange, sortWearableItems } from '../vitalsHelpers';
import {
    buildStepsDetailPeriodSeries,
    buildStepsDetailTodaySeries,
    calcStepsDetailOverview,
    formatStepsDetailPointDisplay,
    getStepsDetailGoal,
    mapDetailChartRangeToVitalsRange,
    type StepsDetailPoint,
} from './detailHelpers';

const EMPTY_OVERVIEW = {
    totalSteps: '--',
    dailyAverage: '--',
    compliantDays: '--',
};

function formatOverviewNumber(value: number) {
    return value.toLocaleString('en-US');
}

function resetHeaderDisplay(range: StepsChartRange, goal: number) {
    return formatStepsDetailPointDisplay(range, undefined, goal);
}

export default function StepsPage() {
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<StepsChartRange>('today');
    const [chartData, setChartData] = useState<StepsPoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [suggestionLabel, setSuggestionLabel] = useState('目标：10,000');
    const [overview, setOverview] = useState(EMPTY_OVERVIEW);
    const [stepGoal, setStepGoal] = useState(10000);

    const handleChartPointChange = useCallback((point: StepsPoint | undefined) => {
        const display = formatStepsDetailPointDisplay(
            selectedType,
            point as StepsDetailPoint | undefined,
            stepGoal,
        );
        setDisplayValue(display.value);
        setDisplayStatus(display.status);
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
        setSuggestionLabel(display.suggestionLabel);
    }, [selectedType, stepGoal]);

    const loadStepsData = useCallback(async (range: StepsChartRange) => {
        try {
            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getWearableDataDetailByDateRange({
                startDate,
                endDate,
                type: WEARABLE_DATA_TYPES.steps,
            })) as unknown as { code?: number; data?: WearableDataItem[] };

            if (!isResourceApiOk(res)) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range, 10000);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(emptyDisplay.status);
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                setSuggestionLabel(emptyDisplay.suggestionLabel);
                setOverview(EMPTY_OVERVIEW);
                setStepGoal(10000);
                return;
            }

            const items = sortWearableItems(apiResourceData<WearableDataItem[]>(res) ?? []);
            const goal = getStepsDetailGoal(items);
            setStepGoal(goal);

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
            const emptyDisplay = resetHeaderDisplay(range, 10000);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(emptyDisplay.status);
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            setSuggestionLabel(emptyDisplay.suggestionLabel);
            setOverview(EMPTY_OVERVIEW);
            setStepGoal(10000);
        }
    }, []);

    useEffect(() => {
        loadStepsData(selectedType);
    }, [loadStepsData, selectedType]);

    useFocusEffect(
        useCallback(() => {
            loadStepsData(selectedType);
        }, [loadStepsData, selectedType]),
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
                    contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
                >
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={setSelectedType} />

                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>(步)</Text>
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
                        />
                    </View>

                    <View style={[styles.rowBox, { marginTop: 30 }]}>
                        <Text style={styles.analysisTitle}>步数总览</Text>
                        <Flex justify='between' style={styles.analysisContent}>
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
                    </View>

                </ScrollView>
            </View>
        </PageLayout>
    );
}
