import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
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
import { getDateRange, sortWearableItems, getWearableReturnOriginalDataParam } from '../vitalsHelpers';
import {
    buildEnergyDetailPeriodSeries,
    buildEnergyDetailTodaySeries,
    calcEnergyDetailOverview,
    formatEnergyDetailPointDisplay,
    getEnergyDetailGoal,
    type EnergyDetailPoint,
} from './helpers/energy';
import { mapDetailChartRangeToVitalsRange } from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';
import { resolveEnergyTarget } from './helpers/vitalsGoalTargets';

const EMPTY_OVERVIEW = {
    avgTotal: '--',
    avgActive: '--',
    avgBasal: '--',
};

function formatOverviewNumber(value: number) {
    return value.toLocaleString('en-US');
}

function resetHeaderDisplay(range: StepsChartRange, goal: number) {
    return formatEnergyDetailPointDisplay(range, undefined, goal);
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

    const handleChartPointChange = useCallback((point: StepsPoint | undefined) => {
        const display = formatEnergyDetailPointDisplay(
            selectedType,
            point as EnergyDetailPoint | undefined,
            energyGoal,
        );
        setDisplayValue(display.value);
        setDisplayStatus(display.status);
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
        setSuggestionLabel(display.suggestionLabel);
    }, [selectedType, energyGoal]);

    const loadEnergyData = useCallback(async (range: StepsChartRange, goalOverride?: number) => {
        const fallbackGoal = goalOverride ?? defaultEnergyGoal;
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
                return;
            }

            const goal = getEnergyDetailGoal(activeItems, basalItems, fallbackGoal);
            setEnergyGoal(goal);

            if (range === 'today') {
                setChartData(buildEnergyDetailTodaySeries(activeItems, basalItems, goal));
            } else {
                setChartData(buildEnergyDetailPeriodSeries(activeItems, basalItems, range, goal));
            }

            const overviewStats = calcEnergyDetailOverview(activeItems, basalItems, range, goal);
            if (overviewStats) {
                setOverview({
                    avgTotal: formatOverviewNumber(overviewStats.avgTotal),
                    avgActive: formatOverviewNumber(overviewStats.avgActive),
                    avgBasal: formatOverviewNumber(overviewStats.avgBasal),
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
            setEnergyGoal(fallbackGoal);
        }
    }, [defaultEnergyGoal]);

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
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>消耗（千卡）</Text>
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
                            todayLineChart
                        />
                    </View>

                    <Flex justify='between' style={[styles.rowBox, { marginTop: 30 }]}>
                        <View>
                            <Text style={styles.analysis1}>日均总消耗(千卡)</Text>
                            <Text style={styles.analysis2}>{overview.avgTotal}</Text>
                        </View>
                        <View>
                            <Text style={styles.analysis1}>日均活动消耗(千卡)</Text>
                            <Text style={[styles.analysis2, { color: '#EE9C44' }]}>{overview.avgActive}</Text>
                        </View>
                        <View>
                            <Text style={styles.analysis1}>日均静消耗(千卡)</Text>
                            <Text style={[styles.analysis2, { color: '#0951AE' }]}>{overview.avgBasal}</Text>
                        </View>
                    </Flex>
                </ScrollView>
            </View>
            {menuModals}
        </PageLayout>
    );
}
