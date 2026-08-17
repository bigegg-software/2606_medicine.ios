import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchInUsePrescription } from '@/store/actions/prescription';
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
import TopHeaderTip from './components/TopHeaderTip';
import {
  getMeasureDataDetailByDate,
  getMeasureDataLatestByType,
  getMeasureDataLatestTwoByType,
  getMeasureDataStatisByDateRange,
  type MeasureDataItem,
  type MeasureDataStatisDayGroup,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { flattenMeasureItems, getDateRange } from '../vitalsHelpers';
import {
  buildWeightChartFromStatisGroups,
  buildWeightDetailTodaySeries,
  calcTodayWeightOverview,
  calcWeightDetailStats,
  calcWeightTrendFromPoints,
  formatWeightCurrentValue,
  formatWeightDetailPointDisplay,
  getBmiCategory,
  BMI_CATEGORY_COLORS,
  resolvePersonalWeightGoalDisplay,
  resolveWeightDetailBmi,
  type TodayWeightOverview,
  type WeightTrendSummary,
} from './helpers/weight';
import { parseMeasureNumber } from './helpers/shared';
import {
  mapDetailChartRangeToVitalsRange,
  normalizeStatisRangeData,
} from './helpers/shared';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';
import { resolveWeightTarget, WEIGHT_GOAL_MIN } from './helpers/vitalsGoalTargets';

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
  todayOverview: TodayWeightOverview;
};

const EMPTY_TODAY_OVERVIEW: TodayWeightOverview = {
  changeText: '--',
  avgText: '--',
};

function buildEmptyWeightRangeSnapshot(): WeightRangeSnapshot {
  return {
    chartData: [],
    latestItem: undefined,
    displayBmi: null,
    stats: EMPTY_STATS,
    todayOverview: EMPTY_TODAY_OVERVIEW,
  };
}

const WEIGHT_CHART_RANGES: WeightChartRange[] = ['today', 'week', 'month'];

function formatStatusText(status?: string) {
  return status?.replace(/^・/, '') || '--';
}

function resetHeaderDisplay(range: WeightChartRange, heightCm?: number | null) {
  return formatWeightDetailPointDisplay(range, undefined, undefined, heightCm);
}

async function fetchWeightRangeSnapshot(
  range: WeightChartRange,
  heightCm?: number | null,
): Promise<WeightRangeSnapshot | null> {
  if (range === 'today') {
    const todayDate = moment().format('YYYY-MM-DD');
    const [latestRawRes, latestTwoRawRes, todayDetailRawRes] = await Promise.all([
      getMeasureDataLatestByType('体重'),
      getMeasureDataLatestTwoByType('体重'),
      getMeasureDataDetailByDate({
        customerLocalDate: todayDate,
        type: '体重',
      }),
    ]);
    const latestRes = latestRawRes as unknown as {
      code?: number;
      data?: MeasureDataItem;
    };
    const latestTwoRes = latestTwoRawRes as unknown as {
      code?: number;
      data?: MeasureDataItem[];
    };
    const todayDetailRes = todayDetailRawRes as unknown as {
      code?: number;
      data?: MeasureDataItem[];
    };

    if (!isResourceApiOk(latestRes)) return null;

    const latest = apiResourceData<MeasureDataItem>(latestRes);
    const latestDate = latest?.customerLocalDate?.trim();
    let items: MeasureDataItem[] = latest ? [latest] : [];

    if (latestDate && latestDate === todayDate && isResourceApiOk(todayDetailRes)) {
      const dayItems = flattenMeasureItems(apiResourceData<MeasureDataItem[]>(todayDetailRes));
      items = dayItems.length ? dayItems : items;
    } else if (latestDate && latestDate !== todayDate) {
      const detailRes = (await getMeasureDataDetailByDate({
        customerLocalDate: latestDate,
        type: '体重',
      })) as unknown as { code?: number; data?: MeasureDataItem[] };

      if (isResourceApiOk(detailRes)) {
        const dayItems = flattenMeasureItems(apiResourceData<MeasureDataItem[]>(detailRes));
        items = dayItems.length ? dayItems : items;
      }
    }

    const calendarTodayItems = isResourceApiOk(todayDetailRes)
      ? flattenMeasureItems(apiResourceData<MeasureDataItem[]>(todayDetailRes))
      : [];
    const latestTwoItems = isResourceApiOk(latestTwoRes)
      ? (apiResourceData<MeasureDataItem[]>(latestTwoRes) ?? [])
      : [];

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
      todayOverview: calcTodayWeightOverview(calendarTodayItems, latestTwoItems),
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
    todayOverview: EMPTY_TODAY_OVERVIEW,
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
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const userHeight = useSelector((state: RootState) => state.user.info?.height);
  const userWeight = useSelector((state: RootState) => state.user.info?.weight);
  const storeWeightGoal = useSelector((state: RootState) => state.user.userExtr?.weightGoals);
  const prescriptionTargetWeight = useSelector(
    (state: RootState) => state.prescription.inUse?.targetWeight,
  );
  const defaultPersonalWeightGoal = useMemo(
    () => resolveWeightTarget(storeWeightGoal),
    [storeWeightGoal],
  );
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
  const [todayOverview, setTodayOverview] = useState<TodayWeightOverview>(EMPTY_TODAY_OVERVIEW);
  const [personalWeightGoal, setPersonalWeightGoal] = useState(defaultPersonalWeightGoal);
  const rangeCacheRef = useRef<Partial<Record<WeightChartRange, WeightRangeSnapshot>>>({});
  const loadRequestRef = useRef(0);
  const selectedTypeRef = useRef(selectedType);
  const userHeightRef = useRef(userHeight);
  const prevUserHeightRef = useRef(userHeight);
  selectedTypeRef.current = selectedType;
  userHeightRef.current = userHeight;

  useEffect(() => {
    setPersonalWeightGoal(defaultPersonalWeightGoal);
  }, [defaultPersonalWeightGoal]);

  const currentWeightText = useMemo(
    () => formatWeightCurrentValue(displayValue, latestItem),
    [displayValue, latestItem],
  );

  const prescriptionWeightGoalDisplay = useMemo(() => {
    const target = Number(prescriptionTargetWeight);
    if (!Number.isFinite(target) || target <= 0) return null;
    const currentKg = parseMeasureNumber(latestItem?.val)
      ?? parseMeasureNumber(currentWeightText);
    return resolvePersonalWeightGoalDisplay(target, currentKg);
  }, [currentWeightText, latestItem, prescriptionTargetWeight]);

  const personalWeightGoalDisplay = useMemo(() => {
    if (prescriptionWeightGoalDisplay) return null;
    if (storeWeightGoal == null || storeWeightGoal < WEIGHT_GOAL_MIN) return null;
    const currentKg = parseMeasureNumber(latestItem?.val)
      ?? parseMeasureNumber(currentWeightText);
    return resolvePersonalWeightGoalDisplay(personalWeightGoal, currentKg);
  }, [
    currentWeightText,
    latestItem,
    personalWeightGoal,
    prescriptionWeightGoalDisplay,
    storeWeightGoal,
  ]);

  const activeGoalDisplay = prescriptionWeightGoalDisplay ?? personalWeightGoalDisplay;
  const goalPlanLabel = activeGoalDisplay?.planLabel ?? '减重计划';

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
    setTodayOverview(snapshot.todayOverview);

    const lastPoint = [...snapshot.chartData]
      .reverse()
      .find(point => point.min > 0 && point.max > 0);
    const display = formatWeightDetailPointDisplay(
      range,
      lastPoint,
      snapshot.latestItem,
      userHeightRef.current,
    );
    setDisplayValue(display.value);
    setDisplayStatus(formatStatusText(display.status));
    setDisplayStatusColor(display.statusColor);
    setCurrentLabel(display.currentLabel);
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
      dispatch(fetchInUsePrescription({ force: true }));
      const range = selectedTypeRef.current;
      const cached = rangeCacheRef.current[range];
      if (cached) {
        applyRangeSnapshot(range, cached);
      }
      void loadMeasureData(range);
      prefetchOtherRanges(range);
    }, [applyRangeSnapshot, dispatch, loadMeasureData, prefetchOtherRanges]),
  );

  const { menuModals } = useVitalsDetailMoreMenu({
    allRecordsType: '体重',
    goalKind: 'weight',
    goalDisabled: prescriptionWeightGoalDisplay != null,
    onGoalSaved: (target) => {
      setPersonalWeightGoal(target);
    },
  });

  const weightTrend = useMemo(
    () => calcWeightTrendFromPoints(chartData, 'weight'),
    [chartData],
  );
  const bmiTrend = useMemo(
    () => calcWeightTrendFromPoints(chartData, 'bmi'),
    [chartData],
  );

  const showProfileTip = !(Number(userHeight) > 0) || !(Number(userWeight) > 0);
  const isToday = selectedType === 'today';
  const heightText = Number(userHeight) > 0
    ? `(身高${Math.round(Number(userHeight))}cm)`
    : '(身高--)';
  const todayBmiText = displayBmi != null && displayBmi > 0
    ? String(Number(displayBmi.toFixed(1)))
    : '--';
  const todayBmiStatus = displayBmi != null && displayBmi > 0
    ? getBmiCategory(displayBmi)
    : (displayStatus !== '--' ? displayStatus : '--');
  const todayBmiStatusColor = todayBmiStatus !== '--' && todayBmiStatus in BMI_CATEGORY_COLORS
    ? BMI_CATEGORY_COLORS[todayBmiStatus as keyof typeof BMI_CATEGORY_COLORS]
    : displayStatusColor;

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      {showProfileTip ? <TopHeaderTip /> : null}
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
          contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
        >
          {activeGoalDisplay ? (
            <Flex style={[styles.colRow, { marginTop: 10 }]}>
              <View style={styles.colBox}>
                <Flex justify='between'>
                  <Text style={styles.analysisTitle}>体重目标</Text>
                  <Flex style={styles.rightBox}>
                    <Image style={styles.rightBoxIcon} source={require('@/assets/images/vitals/jz.png')} />
                    <Text style={styles.rightBoxText}>{goalPlanLabel}</Text>
                  </Flex>
                </Flex>

                <Flex justify='between' style={{ marginTop: 15 }}>
                  <Flex style={styles.targetBox}>
                    <View>
                      <Text style={styles.targetBoxText}>目标体重 (kg)</Text>
                      <Text style={styles.targetBoxValue}>{activeGoalDisplay.targetWeightText}</Text>
                    </View>
                    <View>
                      <Text style={styles.targetBoxText}>{activeGoalDisplay.remainingLabel}</Text>
                      <Text style={[styles.targetBoxValue, { color: '#72A1C5' }]}>
                        {activeGoalDisplay.remainingText}
                      </Text>
                    </View>
                  </Flex>
                  <VitalsProgressRing
                    progress={activeGoalDisplay.progressPercent}
                    trackColor="rgba(131,174,255,0.14)"
                    progressColor="#72A1C5"
                  />
                </Flex>
              </View>
            </Flex>
          ) : null}

          {!isToday ? (
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
          ) : null}

          {isToday ? (
            <Flex style={[styles.colRow, { marginTop: 10 }]}>
              <View style={styles.colBox}>
                <Flex align="center">
                  <Text style={styles.todayBmiTitle}>当前BMI</Text>
                  <Text style={styles.todayBmiHeight}>{heightText}</Text>
                </Flex>

                <Flex justify="between" style={styles.todayBmiMetaRow}>
                  <Text style={styles.todayBmiMetaLabel}>正常范围：BMI 18.5-23.9</Text>
                  <Text style={styles.todayBmiMetaLabel}>当前体重(kg)</Text>
                </Flex>

                <Flex justify="between" align="center" style={styles.todayBmiValueRow}>
                  <Flex align="center">
                    <Text style={styles.todayBmiValue}>{todayBmiText}</Text>
                    {todayBmiStatus !== '--' ? (
                      <Flex
                        style={[
                          styles.todayBmiStatusBox,
                          { borderColor: todayBmiStatusColor },
                        ]}
                      >
                        <Text style={[styles.todayBmiStatusText, { color: todayBmiStatusColor }]}>
                          {todayBmiStatus}
                        </Text>
                      </Flex>
                    ) : null}
                  </Flex>
                  <Text style={styles.todayBmiValue}>{currentWeightText}</Text>
                </Flex>

                <BmiProgressBar bmi={displayBmi} />
              </View>
            </Flex>
          ) : null}

          {isToday ? (
            <Flex style={styles.colRow}>
              <View style={styles.colBox}>
                <Text style={styles.todayBmiTitle}>体重总览</Text>
                <Flex justify="between">
                  <View style={styles.todayOverviewCol}>
                    <Text style={styles.todayOverviewLabel}>较上次体重(kg)</Text>
                    <Text style={styles.todayOverviewValueLeft}>{todayOverview.changeText}</Text>
                  </View>
                  <View style={styles.todayOverviewCol}>
                    <Text style={styles.todayOverviewLabel}>日均体重(kg)</Text>
                    <Text style={styles.todayOverviewValueRight}>{todayOverview.avgText}</Text>
                  </View>
                </Flex>
              </View>
            </Flex>
          ) : (
            <Flex style={[styles.colRow, { marginTop: 30 }]}>
              <WeightTrendCard title="体重趋势（kg）" trend={weightTrend} />
              <WeightTrendCard title="BMI趋势" trend={bmiTrend} />
            </Flex>
          )}
        </ScrollView >
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
      </View >
      {menuModals}
    </PageLayout >
  );
}
