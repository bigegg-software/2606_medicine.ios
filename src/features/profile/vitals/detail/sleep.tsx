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
import SleepDetailChart, { type SleepChartRange } from './components/SleepDetailChart';
import SleepStageDetailChart from './components/SleepStageDetailChart';
import SleepScoreBar from './components/SleepScoreBar';
import SleepPieChart from '@/src/features/profile/components/SleepPieChart';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getWearableDataDetailByDateRange,
    WEARABLE_DATA_TYPES,
    type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    getSleepFetchDateRange,
    sortWearableItems,
    getWearableReturnOriginalDataParam,
} from '../vitalsHelpers';
import {
    buildSleepAnalysisPieSegments,
    buildSleepAnalysisStages,
    buildSleepDetailPeriodSeries,
    buildSleepDetailTodaySeries,
    buildSleepGoalProgress,
    buildSleepScoreSummary,
    calcSleepDetailStats,
    formatSleepDetailPointDisplay,
    formatSleepSuggestionTimeText,
    getSleepDetailDisplayItem,
    getSleepDetailInitialDisplay,
    resolveStoreSleepGoal,
    type SleepDetailPoint,
    type SleepDetailStats,
} from './helpers/sleep';
import { mapDetailChartRangeToVitalsRange } from './helpers/shared';

const EMPTY_STATS: SleepDetailStats = {
    totalSleep: '--',
    dailyAverage: '--',
    avgWakeTime: '--',
    avgBedTime: '--',
};

function resetHeaderDisplay(range: SleepChartRange, goalHours: number) {
    return formatSleepDetailPointDisplay(range, undefined, goalHours);
}

export default function SleepPage() {
    const insets = useSafeAreaInsets();
    const storeSleepGoalMinutes = useSelector((state: RootState) => state.user.userExtr?.sleepGoals);
    const defaultSleepGoal = useMemo(
        () => resolveStoreSleepGoal(storeSleepGoalMinutes),
        [storeSleepGoalMinutes],
    );
    const [selectedType, setSelectedType] = useState<SleepChartRange>('today');
    const [chartData, setChartData] = useState<SleepDetailPoint[]>([]);
    const [sleepItems, setSleepItems] = useState<WearableDataItem[]>([]);
    const [displayDuration, setDisplayDuration] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：--');
    const [suggestionLabel, setSuggestionLabel] = useState(() =>
        formatSleepSuggestionTimeText(defaultSleepGoal),
    );
    const [stats, setStats] = useState(EMPTY_STATS);
    const [sleepGoal, setSleepGoal] = useState(defaultSleepGoal);

    const analysisItem = useMemo(
        () => getSleepDetailDisplayItem(sleepItems, selectedType),
        [sleepItems, selectedType],
    );
    const analysisStages = useMemo(
        () => buildSleepAnalysisStages(analysisItem),
        [analysisItem],
    );
    const analysisPieSegments = useMemo(
        () => buildSleepAnalysisPieSegments(analysisItem),
        [analysisItem],
    );
    const goalProgress = useMemo(
        () => buildSleepGoalProgress(analysisItem, sleepGoal),
        [analysisItem, sleepGoal],
    );
    const sleepScoreSummary = useMemo(
        () => buildSleepScoreSummary(analysisItem),
        [analysisItem],
    );
    const isTodayView = selectedType === 'today';

    const handleChartPointChange = useCallback((point: SleepDetailPoint | undefined) => {
        const display = formatSleepDetailPointDisplay(selectedType, point, sleepGoal);
        setDisplayDuration(display.duration);
        setDisplayStatus(display.quality.label || '--');
        setDisplayStatusColor(display.quality.color);
        setCurrentLabel(display.currentLabel);
        setSuggestionLabel(display.suggestionLabel);
    }, [selectedType, sleepGoal]);

    const loadSleepData = useCallback(async (range: SleepChartRange) => {
        const goalHours = defaultSleepGoal;
        try {
            const { startDate, endDate } = getSleepFetchDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getWearableDataDetailByDateRange({
                startDate,
                endDate,
                type: WEARABLE_DATA_TYPES.sleep,
                ...getWearableReturnOriginalDataParam(range),
            })) as unknown as { code?: number; data?: WearableDataItem[] };

            if (!isResourceApiOk(res)) {
                setSleepItems([]);
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range, goalHours);
                setDisplayDuration(emptyDisplay.duration);
                setDisplayStatus(emptyDisplay.quality.label || '--');
                setDisplayStatusColor(emptyDisplay.quality.color);
                setCurrentLabel(emptyDisplay.currentLabel);
                setSuggestionLabel(emptyDisplay.suggestionLabel);
                setStats(EMPTY_STATS);
                setSleepGoal(goalHours);
                return;
            }

            const items = sortWearableItems(apiResourceData<WearableDataItem[]>(res) ?? []);
            setSleepItems(items);
            setSleepGoal(goalHours);

            if (range === 'today') {
                setChartData(buildSleepDetailTodaySeries(items, goalHours));
            } else {
                setChartData(buildSleepDetailPeriodSeries(items, range, goalHours));
            }

            const initialDisplay = getSleepDetailInitialDisplay(items, range, goalHours);
            setDisplayDuration(initialDisplay.duration);
            setDisplayStatus(initialDisplay.quality.label || '--');
            setDisplayStatusColor(initialDisplay.quality.color);
            setCurrentLabel(initialDisplay.currentLabel);
            setSuggestionLabel(initialDisplay.suggestionLabel);

            const periodStats = calcSleepDetailStats(items, range);
            setStats(periodStats ?? EMPTY_STATS);
        } catch {
            setSleepItems([]);
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range, goalHours);
            setDisplayDuration(emptyDisplay.duration);
            setDisplayStatus(emptyDisplay.quality.label || '--');
            setDisplayStatusColor(emptyDisplay.quality.color);
            setCurrentLabel(emptyDisplay.currentLabel);
            setSuggestionLabel(emptyDisplay.suggestionLabel);
            setStats(EMPTY_STATS);
            setSleepGoal(goalHours);
        }
    }, [defaultSleepGoal]);

    useFocusEffect(
        useCallback(() => {
            void loadSleepData(selectedType);
        }, [loadSleepData, selectedType]),
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
                        {isTodayView ? (
                            <>
                                <Text style={styles.rowTitle}>夜间睡眠</Text>
                                <Text style={styles.rowLeftValue}>{displayDuration}</Text>
                                <Flex justify='between'>
                                    <Text style={styles.rowTitle}>{suggestionLabel}</Text>
                                    <Flex style={styles.dayBox}>
                                        <Text style={styles.dayText}>{currentLabel}</Text>
                                    </Flex>
                                </Flex>
                                {goalProgress ? (
                                    <Flex style={styles.mbBox} justify='center'>
                                        <Flex style={[styles.mbBoxContent, { borderColor: goalProgress.borderColor }]}>
                                            <Text style={[styles.mbBoxText, { color: goalProgress.statusColor }]}>
                                                {goalProgress.statusLabel}
                                            </Text>
                                        </Flex>
                                        <Text style={styles.mbBoxMessage}>{goalProgress.message}</Text>
                                    </Flex>
                                ) : null}
                                <SleepStageDetailChart item={analysisItem} />
                            </>
                        ) : (
                            <>
                                <Flex justify='between'>
                                    <Text style={styles.rowLeftValue}>{displayDuration}</Text>
                                    <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                        <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                            {displayStatus}
                                        </Text>
                                    </Flex>
                                </Flex>
                                <Flex justify='between'>
                                    <Text style={styles.rowTitle}>{suggestionLabel}</Text>
                                    <Flex style={styles.dayBox}>
                                        <Text style={styles.dayText}>{currentLabel}</Text>
                                    </Flex>
                                </Flex>
                                <SleepDetailChart
                                    range={selectedType}
                                    data={chartData}
                                    onPointChange={handleChartPointChange}
                                />
                            </>
                        )}
                    </View>

                    <Flex style={[styles.colRow, { marginTop: 30 }]}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>总睡眠时长</Text>
                            <Text style={[styles.rValue, { fontSize: 20 }]}>{stats.totalSleep}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>日均睡眠时长</Text>
                            <Text style={[styles.rValue, { fontSize: 20 }]}>{stats.dailyAverage}</Text>
                        </View>
                    </Flex>

                    <Flex style={[styles.colRow, { marginTop: 10 }]}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>平均起床时间</Text>
                            <Text style={[styles.rValue, { fontSize: 20 }]}>{stats.avgWakeTime}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>平均就寝时间</Text>
                            <Text style={[styles.rValue, { fontSize: 20 }]}>{stats.avgBedTime}</Text>
                        </View>
                    </Flex>
                    <View style={[styles.rowBox, { marginTop: 30 }]}>
                        <Flex justify='between' align='center'>
                            <Text style={styles.analysisTitle}>睡眠分析</Text>
                            <Flex style={[styles.statusBox, { borderColor: sleepScoreSummary.qualityColor }]}>
                                <Text style={[styles.statusText, { color: sleepScoreSummary.qualityColor }]}>
                                    {sleepScoreSummary.qualityLabel}
                                </Text>
                            </Flex>

                        </Flex>
                        <Flex style={{ marginTop: 15 }} align='start'>
                            <Flex align='end'>
                                <Text style={styles.analysisScore}>{sleepScoreSummary.scoreText}</Text>
                                <Text style={styles.analysisUnit}>分</Text>
                            </Flex>
                            <View style={{ marginLeft: 22, flex: 1 }}>
                                <Text style={styles.analysisDescription}>{sleepScoreSummary.description}</Text>
                                <SleepScoreBar score={sleepScoreSummary.score} />
                            </View>
                        </Flex>

                        <Flex style={[styles.sleepAnalysisBody, { marginTop: 20 }]}>
                            <View style={styles.sleepPieColumn}>
                                <View style={styles.sleepPieWrap}>
                                    <SleepPieChart
                                        data={analysisPieSegments}
                                        size={90}
                                        ringWidth={12}
                                        showCenterLabel
                                    />
                                </View>
                            </View>

                            <View style={styles.sleepAnalysisLegend}>
                                {analysisStages.map(stage => (
                                    <Flex key={stage.key} style={styles.sleepAnalysisLegendRow}>
                                        <Flex style={styles.sleepAnalysisLegendLabel}>
                                            <View style={[styles.colBor, { backgroundColor: stage.color }]} />
                                            <Text style={styles.sleepAnalysisLegendLabelText}>{stage.label}</Text>
                                        </Flex>
                                        <Text style={styles.sleepAnalysisLegendValue}>{stage.duration}</Text>
                                    </Flex>
                                ))}
                            </View>
                        </Flex>
                    </View>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
