import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import WeightDetailChart, {
  type WeightChartRange,
  type WeightDetailPoint,
} from './components/WeightDetailChart';
import BmiProgressBar from './components/BmiProgressBar';
import VitalsProgressRing from './components/VitalsProgressRing';
import { LinearGradient } from 'expo-linear-gradient';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import {
  getMeasureDataDetailByDate,
  getMeasureDataLatestByType,
  getMeasureDataStatisByDateRange,
  type MeasureDataItem,
  type MeasureDataStatisDayGroup,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { flattenMeasureItems, getDateRange } from '../vitalsHelpers';
import {
  buildWeightChartFromStatisGroups,
  buildWeightDetailTodaySeries,
  buildWeightGoalSummary,
  calcWeightDetailStats,
  calcWeightTrendFromPoints,
  findWeightHealthGoal,
  formatWeightCurrentValue,
  formatWeightDetailPointDisplay,
  getInitialWeightFromPoints,
  getEarliestWeightFromItems,
  hasWeightHealthGoal,
  resolveWeightDetailBmi,
  resolveWeightGoalDisplay,
  type WeightGoalSummary,
  type WeightTrendSummary,
} from './helpers/weight';
import { parseMeasureNumber } from './helpers/shared';
import {
  mapDetailChartRangeToVitalsRange,
  normalizeStatisRangeData,
} from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMPTY_STATS = {
  rangeText: '--',
  recordCount: null as number | null,
  bmiText: '--',
};

type WeightRangeSnapshot = {
  chartData: WeightDetailPoint[];
  latestItem?: MeasureDataItem;
  displayBmi: number | null;
  stats: typeof EMPTY_STATS;
};

const WEIGHT_CHART_RANGES: WeightChartRange[] = ['today', 'week', 'month'];

function formatStatusText(status?: string) {
  return status?.replace(/^・/, '') || '--';
}

function resetHeaderDisplay(range: WeightChartRange, heightCm?: number | null) {
  return formatWeightDetailPointDisplay(range, undefined, undefined, heightCm);
}

function buildEmptyWeightRangeSnapshot(): WeightRangeSnapshot {
  return {
    chartData: [],
    latestItem: undefined,
    displayBmi: null,
    stats: EMPTY_STATS,
  };
}

async function fetchWeightRangeSnapshot(
  range: WeightChartRange,
  heightCm?: number | null,
): Promise<WeightRangeSnapshot | null> {
  if (range === 'today') {
    const latestRes = (await getMeasureDataLatestByType('体重')) as unknown as {
      code?: number;
      data?: MeasureDataItem;
    };

    if (!isResourceApiOk(latestRes)) return null;

    const latest = apiResourceData<MeasureDataItem>(latestRes);
    const latestDate = latest?.customerLocalDate?.trim();
    let items: MeasureDataItem[] = latest ? [latest] : [];

    if (latestDate) {
      const detailRes = (await getMeasureDataDetailByDate({
        customerLocalDate: latestDate,
        type: '体重',
      })) as unknown as { code?: number; data?: MeasureDataItem[] };

      if (isResourceApiOk(detailRes)) {
        const dayItems = flattenMeasureItems(apiResourceData<MeasureDataItem[]>(detailRes));
        items = dayItems.length ? dayItems : items;
      }
    }

    const periodStats = calcWeightDetailStats(items, range, [], heightCm);
    return {
      chartData: buildWeightDetailTodaySeries(items, heightCm),
      latestItem: latest,
      displayBmi: resolveWeightDetailBmi(undefined, latest, heightCm),
      stats: periodStats ? {
        rangeText: periodStats.rangeText,
        recordCount: periodStats.recordCount,
        bmiText: periodStats.bmiText,
      } : EMPTY_STATS,
    };
  }

  const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
  const res = (await getMeasureDataStatisByDateRange({
    startDate,
    endDate,
    type: '体重',
  })) as unknown as { code?: number; data?: MeasureDataStatisDayGroup[] };

  if (!isResourceApiOk(res)) return null;

  const groups = normalizeStatisRangeData(apiResourceData<unknown>(res));
  const periodStats = calcWeightDetailStats([], range, groups, heightCm);
  return {
    chartData: buildWeightChartFromStatisGroups(groups, range, heightCm),
    latestItem: undefined,
    displayBmi: null,
    stats: periodStats ? {
      rangeText: periodStats.rangeText,
      recordCount: periodStats.recordCount,
      bmiText: periodStats.bmiText,
    } : EMPTY_STATS,
  };
}

function WeightTrendCard({
  title,
  trend,
}: {
  title: string;
  trend: WeightTrendSummary;
}) {
  const showIcon = trend.direction !== 'flat' && trend.rangeText !== '--';

  return (
    <View style={styles.colBox}>
      <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.rValue}>{trend.rangeText}</Text>
      <Text style={[styles.rowIntro, { color: trend.changeColor }]}>{trend.changeText}</Text>
      {showIcon ? (
        <Image
          style={styles.colImage3}
          source={trend.direction === 'up'
            ? require('@/assets/images/vitals/up.png')
            : require('@/assets/images/vitals/jd.png')}
        />
      ) : null}
    </View>
  );
}

export default function WeightPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const userHeight = useSelector((state: RootState) => state.user.info?.height);
  const [selectedType, setSelectedType] = useState<WeightChartRange>('today');
  const [loadedRange, setLoadedRange] = useState<WeightChartRange>('today');
  const [chartData, setChartData] = useState<WeightDetailPoint[]>([]);
  const [latestItem, setLatestItem] = useState<MeasureDataItem | undefined>();
  const [displayValue, setDisplayValue] = useState('--');
  const [displayStatus, setDisplayStatus] = useState('--');
  const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
  const [currentLabel, setCurrentLabel] = useState('当前：今天');
  const [displayBmi, setDisplayBmi] = useState<number | null>(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [showWeightGoal, setShowWeightGoal] = useState(false);
  const [weightGoalSummary, setWeightGoalSummary] = useState<WeightGoalSummary | null>(null);
  const [initialWeightKg, setInitialWeightKg] = useState<number | null>(null);
  const rangeCacheRef = useRef<Partial<Record<WeightChartRange, WeightRangeSnapshot>>>({});
  const loadRequestRef = useRef(0);
  const selectedTypeRef = useRef(selectedType);
  const userHeightRef = useRef(userHeight);
  const prevUserHeightRef = useRef(userHeight);
  selectedTypeRef.current = selectedType;
  userHeightRef.current = userHeight;

  const currentWeightText = useMemo(
    () => formatWeightCurrentValue(displayValue, latestItem),
    [displayValue, latestItem],
  );

  const weightGoalDisplay = useMemo(() => {
    if (!weightGoalSummary) return null;
    const currentKg = parseMeasureNumber(latestItem?.val)
      ?? parseMeasureNumber(currentWeightText);
    const initialKg = initialWeightKg
      ?? getInitialWeightFromPoints(chartData, latestItem);
    return resolveWeightGoalDisplay(weightGoalSummary, currentKg, initialKg);
  }, [chartData, currentWeightText, initialWeightKg, latestItem, weightGoalSummary]);

  const navigateToAddData = useCallback(() => {
    navigation.navigate('AddDataPage', { type: '体重' });
  }, [navigation]);


  const handleChartPointChange = useCallback((point: WeightDetailPoint | undefined) => {
    const display = formatWeightDetailPointDisplay(
      loadedRange,
      point,
      latestItem,
      userHeight,
    );
    setDisplayValue(display.value);
    setDisplayStatus(formatStatusText(display.status));
    setDisplayStatusColor(display.statusColor);
    setCurrentLabel(display.currentLabel);
    setDisplayBmi(resolveWeightDetailBmi(point, latestItem, userHeight));
  }, [latestItem, loadedRange, userHeight]);

  const applyRangeSnapshot = useCallback((range: WeightChartRange, snapshot: WeightRangeSnapshot) => {
    setLoadedRange(range);
    setChartData(snapshot.chartData);
    setLatestItem(snapshot.latestItem);
    setDisplayBmi(snapshot.displayBmi);
    setStats(snapshot.stats);
  }, []);

  const applyEmptyRangeState = useCallback((range: WeightChartRange) => {
    const emptySnapshot = buildEmptyWeightRangeSnapshot();
    rangeCacheRef.current[range] = emptySnapshot;
    applyRangeSnapshot(range, emptySnapshot);
    const emptyDisplay = resetHeaderDisplay(range, userHeight);
    setDisplayValue(emptyDisplay.value);
    setDisplayStatus(formatStatusText(emptyDisplay.status));
    setDisplayStatusColor(emptyDisplay.statusColor);
    setCurrentLabel(emptyDisplay.currentLabel);
  }, [applyRangeSnapshot, userHeight]);

  const loadWeightGoal = useCallback(async () => {
    try {
      const res = await getInUseExPatientRuleInfo();
      const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
      if (!isResourceApiOk(payload)) {
        setShowWeightGoal(false);
        setWeightGoalSummary(null);
        setInitialWeightKg(null);
        return;
      }

      const rule = apiResourceData<InUseExPatientRule>(payload);
      if (!rule || !hasWeightHealthGoal(rule)) {
        setShowWeightGoal(false);
        setWeightGoalSummary(null);
        setInitialWeightKg(null);
        return;
      }

      const summary = buildWeightGoalSummary(findWeightHealthGoal(rule?.healthGoalTargetList));
      if (!summary) {
        setShowWeightGoal(false);
        setWeightGoalSummary(null);
        setInitialWeightKg(null);
        return;
      }

      let earliestWeight: number | null = null;
      const startDate = rule.startDate?.trim();
      const endDate = rule.endDate?.trim();
      if (startDate && endDate) {
        try {
          const statisRes = (await getMeasureDataStatisByDateRange({
            startDate,
            endDate,
            type: '体重',
          })) as unknown as { code?: number; data?: MeasureDataStatisDayGroup[] };
          if (isResourceApiOk(statisRes)) {
            const groups = normalizeStatisRangeData(apiResourceData<unknown>(statisRes));
            earliestWeight = getEarliestWeightFromItems(
              groups.flatMap(group => group.childList ?? []),
            );
          }
        } catch {
          earliestWeight = null;
        }
      }

      setShowWeightGoal(true);
      setWeightGoalSummary(summary);
      setInitialWeightKg(earliestWeight);
    } catch {
      setShowWeightGoal(false);
      setWeightGoalSummary(null);
      setInitialWeightKg(null);
    }
  }, []);

  const loadMeasureData = useCallback(async (
    range: WeightChartRange,
    options?: { background?: boolean },
  ) => {
    const background = options?.background ?? false;
    let requestId = 0;
    if (!background) {
      requestId = ++loadRequestRef.current;
    }

    try {
      const snapshot = await fetchWeightRangeSnapshot(range, userHeightRef.current);
      if (snapshot == null) {
        if (background) return;
        if (requestId !== loadRequestRef.current) return;
        applyEmptyRangeState(range);
        return;
      }

      rangeCacheRef.current[range] = snapshot;
      if (background) return;
      if (requestId !== loadRequestRef.current) return;
      applyRangeSnapshot(range, snapshot);
    } catch {
      if (background) return;
      if (requestId !== loadRequestRef.current) return;
      applyEmptyRangeState(range);
    }
  }, [applyEmptyRangeState, applyRangeSnapshot]);

  const prefetchOtherRanges = useCallback((currentRange: WeightChartRange) => {
    WEIGHT_CHART_RANGES
      .filter(range => range !== currentRange)
      .forEach(range => {
        void loadMeasureData(range, { background: true });
      });
  }, [loadMeasureData]);

  useEffect(() => {
    if (prevUserHeightRef.current === userHeight) return;
    prevUserHeightRef.current = userHeight;
    rangeCacheRef.current = {};
    void loadMeasureData(selectedTypeRef.current);
    prefetchOtherRanges(selectedTypeRef.current);
  }, [loadMeasureData, prefetchOtherRanges, userHeight]);

  const handleSelectedTypeChange = useCallback((range: WeightChartRange) => {
    setSelectedType(range);
    loadRequestRef.current += 1;

    const cached = rangeCacheRef.current[range];
    if (cached) {
      applyRangeSnapshot(range, cached);
      void loadMeasureData(range, { background: true });
      return;
    }

    void loadMeasureData(range);
  }, [applyRangeSnapshot, loadMeasureData]);

  useFocusEffect(
    useCallback(() => {
      void loadWeightGoal();
      const range = selectedTypeRef.current;
      const cached = rangeCacheRef.current[range];
      if (cached) {
        applyRangeSnapshot(range, cached);
      }
      void loadMeasureData(range);
      prefetchOtherRanges(range);
    }, [applyRangeSnapshot, loadMeasureData, loadWeightGoal, prefetchOtherRanges]),
  );

  const { menuModals } = useVitalsDetailMoreMenu({
    allRecordsType: '体重',
  });

  const weightTrend = useMemo(
    () => calcWeightTrendFromPoints(chartData, 'weight'),
    [chartData],
  );
  const bmiTrend = useMemo(
    () => calcWeightTrendFromPoints(chartData, 'bmi'),
    [chartData],
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
          <PageHeader selectedType={selectedType} onSelectedTypeChange={handleSelectedTypeChange} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          {showWeightGoal && weightGoalDisplay ? (
            <Flex style={[styles.colRow, { marginTop: 10 }]}>
              <View style={styles.colBox}>
                <Flex justify='between'>
                  <Text style={styles.analysisTitle}>体重目标</Text>
                  <Flex style={styles.rightBox}>
                    <Image style={styles.rightBoxIcon} source={require('@/assets/images/vitals/jz.png')} />
                    <Text style={styles.rightBoxText}>{weightGoalSummary?.planLabel}</Text>
                  </Flex>
                </Flex>

                <Flex justify='between' style={{ marginTop: 15 }}>
                  <Flex style={styles.targetBox}>
                    <View>
                      <Text style={styles.targetBoxText}>目标体重 (kg)</Text>
                      <Text style={styles.targetBoxValue}>{weightGoalDisplay.targetWeightText}</Text>
                    </View>
                    <View>
                      <Text style={styles.targetBoxText}>{weightGoalDisplay.remainingLabel}</Text>
                      <Text style={[styles.targetBoxValue, { color: '#0951AE' }]}>
                        {weightGoalDisplay.remainingText}
                      </Text>
                    </View>
                  </Flex>
                  <VitalsProgressRing
                    progress={weightGoalDisplay.progressPercent}
                    trackColor="rgba(131,174,255,0.14)"
                    progressColor="#0951AE"
                  />
                </Flex>
              </View>
            </Flex>
          ) : null}

          <View style={[styles.rowBox, { marginTop: 10 }]}>
            <Flex justify='between'>
              <Text style={styles.rowTitle}>体重(kg)</Text>
              <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                  {displayStatus}
                </Text>
              </Flex>
            </Flex>
            <Text style={styles.rowLeftValue}>{displayValue}</Text>
            <Flex justify='between'>
              <Text style={styles.rowTitle}>正常范围：BMI 18.5-23.9</Text>
            </Flex>

            <WeightDetailChart
              range={loadedRange}
              data={chartData}
              onPointChange={handleChartPointChange}
            />
          </View>

          <Flex style={[styles.colRow, { marginTop: 30 }]}>
            <View style={styles.colBox}>
              <Text style={styles.analysisTitle}>最新体重</Text>
              <Text style={styles.rValue}>{displayValue}kg</Text>
              <BmiProgressBar bmi={displayBmi} />
            </View>
          </Flex>
          <Flex style={styles.colRow}>
            <WeightTrendCard title="体重趋势（kg）" trend={weightTrend} />
            <WeightTrendCard title="BMI趋势" trend={bmiTrend} />
          </Flex>
        </ScrollView >
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
      </View >
      {menuModals}
    </PageLayout >
  );
}
