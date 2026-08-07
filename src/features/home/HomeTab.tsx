import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Platform, useWindowDimensions, DeviceEventEmitter, type ImageSourcePropType, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView, BlurTargetView } from 'expo-blur';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/src/features/home/MainTabs';
import type { RootStackParamList } from '@/route/router';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/home/home';
import MiniProgressRing from './components/MiniProgressRing';
import MiniSparkline from './components/MiniSparkline';
import VitalInfoModal from './components/VitalInfoModal';
import AutoScrollText from '@/src/components/AutoScrollText';
import CompleteProfileLink from '@/src/features/profile/healthRecord/components/CompleteProfileLink';
import { fetchUserBaseInfo, fetchUserInfo } from '@/store/actions/user';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppDispatch, RootState } from '@/store/store';
import { getInUseDietPatientRuleInfo, type DietMealItem, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import {
  getMeasureDataDetailByDateRange,
  type MeasureDataItem,
  type MeasureDataRangeDetailResult,
} from '@/api/measureData';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import {
  getWearableDataDetailByDateRange,
  WEARABLE_DATA_TYPES,
  type WearableDataItem,
  type WearableDataRangeResult,
  type WearableDataType,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import { isUserBaseInfoComplete } from '@/src/features/profile/healthRecord/utils/profileCompletenessHelpers';
import { HEALTH_KIT_SYNC_COMPLETED } from '@/utils/healthKit';
import {
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  filterMeasureItemsInRange,
  flattenMeasureItems,
  formatSingleValueFromItems,
  getDateRange,
  getEnergySummary,
  getHeartRateDisplay,
  normalizeMeasureRangeData,
  sortWearableItems,
} from '@/src/features/profile/vitals/vitalsHelpers';
import { resolveRestingHeartRateDisplay } from '@/src/features/profile/vitals/detail/helpers/heartRate';
import {
  calcNutritionProgress,
  getDietRuleSummary,
} from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  formatNutritionInteger,
  getFoodRecordsByCategory,
  sumCalories,
  sumCarbs,
  sumProtein,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
  buildExercisePrescriptionMetrics,
  enrichHealthGoalTargets,
  loadScheduleDictMaps,
  loadTodayTaskProgressMap,
  type ScheduleDictMaps,
} from '@/src/features/schedule/scheduleHelpers';
import {
  loadHomePrescriptionGoalDisplay,
  type HomePrescriptionGoalDisplay,
} from '@/src/features/home/homePrescriptionGoalHelpers';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HOME_BANNER_ASPECT = 531 / 375;
const BLUR_CARD_RADIUS = 12;
const BLUR_CARD_BORDER_WIDTH = 1;
const BLUR_CARD_GRADIENT_COLORS = ['rgba(210, 231, 255, 0.01)', 'rgba(210, 231, 255, 0.7)'] as const;
const CF_PROGRESS_TRACK_WIDTH = 70;
const BLUR_CARD_ENERGY_TRACK_WIDTH = 74;

function toSparklineValues(series: { value: number }[]) {
  const values = series.map(point => point.value).filter(value => value > 0);
  if (values.length >= 2) return values;
  if (values.length === 1) return [values[0], values[0]];
  return [];
}

type HomeMealKey = 'breakfast' | 'lunch' | 'dinner';

const HOME_MEAL_META: Record<
  HomeMealKey,
  { title: string; icon: ImageSourcePropType; category: number }
> = {
  breakfast: {
    title: '早餐',
    icon: require('@/assets/images/home/zao.png'),
    category: 1,
  },
  lunch: {
    title: '中餐',
    icon: require('@/assets/images/home/sun.png'),
    category: 2,
  },
  dinner: {
    title: '晚餐',
    icon: require('@/assets/images/home/yl.png'),
    category: 3,
  },
};

/** 03:00-11:00 早餐；11:00-16:00 午餐；16:00-02:00 晚餐 */
function getCurrentMealKey(date = new Date()): HomeMealKey {
  const hour = date.getHours();
  if (hour >= 3 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  return 'dinner';
}

function parseFoodNames(foods?: string): string[] {
  if (!foods?.trim()) return [];
  return foods
    .split(/[,，、]/)
    .map(item => item.trim())
    .filter(Boolean);
}

const HOME_FOOD_DISPLAY_MAX_CHARS = 8;

type HomeFoodDisplaySplit = {
  visible: string[];
  hasMore: boolean;
  truncateLast: boolean;
};

function splitFoodsForHomeDisplay(
  foods: string[],
  maxChars = HOME_FOOD_DISPLAY_MAX_CHARS,
): HomeFoodDisplaySplit {
  if (foods.length === 0) {
    return { visible: [], hasMore: false, truncateLast: false };
  }

  const visible: string[] = [];
  let used = 0;

  for (const food of foods) {
    const len = food.length;

    if (visible.length === 0) {
      if (len > maxChars) {
        return { visible: [food], hasMore: true, truncateLast: true };
      }
      visible.push(food);
      used = len;
      continue;
    }

    if (used + len > maxChars) {
      return { visible, hasMore: true, truncateLast: false };
    }

    visible.push(food);
    used += len;
  }

  return { visible, hasMore: false, truncateLast: false };
}

function getSuggestedMealItem(
  mealList: DietMealItem[] | undefined,
  category: number,
): DietMealItem | null {
  const today = moment().isoWeekday();
  return mealList?.find(item => {
    const day = Number(item.day);
    const matchDay = !Number.isFinite(day) || day <= 0 || day === today;
    return matchDay && Number(item.mealCategory) === category;
  }) ?? null;
}

function sumMealCalories(records: MealDetailItem[]): number {
  return records.reduce((sum, item) => sum + Number(item.calorie ?? 0), 0);
}

const NUTRITION_VALUE_MAX_DIGITS = 4;

function NutritionAmountText({
  text,
  textStyle,
  scrollStyle,
}: {
  text: string;
  textStyle: object;
  scrollStyle: object;
}) {
  if (text.length <= NUTRITION_VALUE_MAX_DIGITS) {
    return <Text style={textStyle}>{text}</Text>;
  }
  return (
    <AutoScrollText textStyle={textStyle} scrollStyle={scrollStyle}>
      {text}
    </AutoScrollText>
  );
}

export default function HomeTab() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef<View>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { width: windowWidth } = useWindowDimensions();
  const bannerSize = useMemo(() => {
    const width = windowWidth;
    return { width, height: Math.round(width * HOME_BANNER_ASPECT) };
  }, [windowWidth]);
  const [blurCardLayout, setBlurCardLayout] = useState({ width: 0, height: 0 });
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
  const [todayMealList, setTodayMealList] = useState<MealDetailItem[]>([]);
  const [bloodGlucose, setBloodGlucose] = useState<MeasureDataItem[]>([]);
  const [wearableHeartRate, setWearableHeartRate] = useState<WearableDataItem[]>([]);
  const [wearableRestingHeartRate, setWearableRestingHeartRate] = useState<WearableDataItem[]>([]);
  const [wearableActiveEnergy, setWearableActiveEnergy] = useState<WearableDataItem[]>([]);
  const [wearableBasalEnergy, setWearableBasalEnergy] = useState<WearableDataItem[]>([]);
  const [exercisePrescription, setExercisePrescription] = useState<InUseExPatientRule | null>(null);
  const [exerciseDictMaps, setExerciseDictMaps] = useState<ScheduleDictMaps | null>(null);
  const [exerciseProgressMap, setExerciseProgressMap] = useState<Record<string, number>>({});
  const [homePrescriptionGoal, setHomePrescriptionGoal] = useState<HomePrescriptionGoalDisplay | null>(null);
  const [vitalInfoKey, setVitalInfoKey] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [showTopMask, setShowTopMask] = useState(false);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const showTopMaskRef = useRef(false);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const user = useSelector((state: RootState) => state.user.info);
  const profileComplete = isUserBaseInfoComplete(user);
  const userId = useSelector(
    (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
  );

  const exercisePrescriptionMetrics = useMemo(
    () => buildExercisePrescriptionMetrics(
      exercisePrescription?.ruleRatioList,
      exerciseDictMaps ?? undefined,
      exerciseProgressMap,
    ),
    [exerciseDictMaps, exercisePrescription?.ruleRatioList, exerciseProgressMap],
  );

  const dietSummary = useMemo(() => getDietRuleSummary(dietRule), [dietRule]);
  const todayCalories = useMemo(() => sumCalories(todayMealList), [todayMealList]);
  const todayProtein = useMemo(() => sumProtein(todayMealList), [todayMealList]);
  const todayCarbs = useMemo(() => sumCarbs(todayMealList), [todayMealList]);

  const currentMealKey = getCurrentMealKey();
  const currentMealMeta = HOME_MEAL_META[currentMealKey];
  const currentMealRecords = useMemo(
    () => getFoodRecordsByCategory(todayMealList, currentMealKey),
    [currentMealKey, todayMealList],
  );
  const suggestedMeal = useMemo(
    () => getSuggestedMealItem(dietRule?.mealList, currentMealMeta.category),
    [currentMealMeta.category, dietRule?.mealList],
  );
  const hasLoggedCurrentMeal = currentMealRecords.length > 0;
  const displayFoods = hasLoggedCurrentMeal
    ? currentMealRecords.map(item => item.mealName || '--').filter(Boolean)
    : parseFoodNames(suggestedMeal?.foods);
  const displayCalories = hasLoggedCurrentMeal
    ? sumMealCalories(currentMealRecords)
    : Number(suggestedMeal?.calories ?? 0);
  const homeFoodDisplay = useMemo(
    () => splitFoodsForHomeDisplay(displayFoods),
    [displayFoods],
  );

  const calorieProgress = calcNutritionProgress(todayCalories, dietSummary.targetCalories);
  const proteinProgress = calcNutritionProgress(todayProtein, dietSummary.targetProtein);
  const carbsProgress = calcNutritionProgress(todayCarbs, dietSummary.targetCarbs);

  const heartRate = useMemo(() => getHeartRateDisplay(wearableHeartRate), [wearableHeartRate]);
  const heartRateSparkline = useMemo(
    () => toSparklineValues(buildWearableHeartRateSeries(wearableHeartRate, 'today')),
    [wearableHeartRate],
  );
  const restingHeartRate = useMemo(
    () => resolveRestingHeartRateDisplay(wearableRestingHeartRate, 'today'),
    [wearableRestingHeartRate],
  );

  const glucose = useMemo(
    () => formatSingleValueFromItems(bloodGlucose, '血糖', 'today'),
    [bloodGlucose],
  );
  const glucoseSparkline = useMemo(
    () => toSparklineValues(buildSingleValueSeries(bloodGlucose, 'today')),
    [bloodGlucose],
  );
  const glucoseSubtitle = useMemo(() => {
    const items = filterMeasureItemsInRange(bloodGlucose, 'today');
    const latest = items[items.length - 1];
    return latest?.measurementStatus?.trim() || '--';
  }, [bloodGlucose]);

  const energySummary = useMemo(
    () => getEnergySummary(wearableActiveEnergy, wearableBasalEnergy, 'today'),
    [wearableActiveEnergy, wearableBasalEnergy],
  );
  const energyTarget = userExtr?.energyGoals ?? 2000;
  const energyTotal = energySummary.total === '--' ? 0 : Number(energySummary.total);
  const blurCardEnergyProgress = calcNutritionProgress(energyTotal, energyTarget);

  const blurCardWidth = useMemo(() => windowWidth - 36, [windowWidth]);
  const blurViewProps = useMemo(
    () =>
      Platform.OS === 'android'
        ? { blurTarget: blurTargetRef, blurMethod: 'dimezisBlurView' as const }
        : {},
    [],
  );

  const onBlurCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBlurCardLayout(prev =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  const loadMealData = useCallback(async () => {
    try {
      const [ruleRes, todayRes] = await Promise.all([
        getInUseDietPatientRuleInfo(),
        getTodayMealDetailList(),
      ]);
      setDietRule(apiResourceData<DietPatientRuleInfo>(ruleRes as unknown as ApiResult<DietPatientRuleInfo>) ?? null);
      setTodayMealList(
        apiResourceData<MealDetailItem[]>(todayRes as unknown as ApiResult<MealDetailItem[]>) ?? [],
      );
    } catch {
      setDietRule(null);
      setTodayMealList([]);
    }
  }, []);

  const loadVitalsData = useCallback(async () => {
    const { startDate, endDate } = getDateRange('today');

    const fetchWearableItems = async (type: WearableDataType) => {
      try {
        const res = (await getWearableDataDetailByDateRange({
          startDate,
          endDate,
          type,
        })) as unknown as WearableDataRangeResult;
        if (!isResourceApiOk(res)) return [];
        const data = apiResourceData<WearableDataItem[]>(res);
        return sortWearableItems(Array.isArray(data) ? data : []);
      } catch {
        return [];
      }
    };

    try {
      const [glucoseRes, heartRateItems, restingHeartRateItems, activeEnergyItems, basalEnergyItems] = await Promise.all([
        getMeasureDataDetailByDateRange({
          startDate,
          endDate,
          type: '血糖',
        }),
        fetchWearableItems(WEARABLE_DATA_TYPES.heartRate),
        fetchWearableItems(WEARABLE_DATA_TYPES.restingHeartRate),
        fetchWearableItems(WEARABLE_DATA_TYPES.activeEnergy),
        fetchWearableItems(WEARABLE_DATA_TYPES.basalEnergy),
      ]);

      if (isResourceApiOk(glucoseRes as { code?: number })) {
        const groups = normalizeMeasureRangeData(
          apiResourceData<unknown>(glucoseRes as unknown as MeasureDataRangeDetailResult),
        );
        setBloodGlucose(flattenMeasureItems(groups));
      } else {
        setBloodGlucose([]);
      }

      setWearableHeartRate(heartRateItems);
      setWearableRestingHeartRate(restingHeartRateItems);
      setWearableActiveEnergy(activeEnergyItems);
      setWearableBasalEnergy(basalEnergyItems);
    } catch {
      setBloodGlucose([]);
      setWearableHeartRate([]);
      setWearableRestingHeartRate([]);
      setWearableActiveEnergy([]);
      setWearableBasalEnergy([]);
    }
  }, []);

  const loadExercisePrescription = useCallback(async () => {
    try {
      const [dictMaps, res] = await Promise.all([
        loadScheduleDictMaps().catch(() => null),
        getInUseExPatientRuleInfo(),
      ]);
      if (dictMaps) {
        setExerciseDictMaps(dictMaps);
      }

      const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
      if (!isResourceApiOk(payload)) {
        setExercisePrescription(null);
        setExerciseProgressMap({});
        setHomePrescriptionGoal(null);
        return;
      }

      let prescription = apiResourceData<InUseExPatientRule>(payload) ?? null;
      if (prescription?.healthGoalTargetList?.length) {
        const enrichedTargets = await enrichHealthGoalTargets(prescription.healthGoalTargetList);
        prescription = { ...prescription, healthGoalTargetList: enrichedTargets };
      }
      setExercisePrescription(prescription);
      const progressMap = prescription?.exPatientRuleId != null
        ? await loadTodayTaskProgressMap(prescription.exPatientRuleId).catch(() => ({}))
        : {};
      setExerciseProgressMap(progressMap);
      const goalDisplay = await loadHomePrescriptionGoalDisplay(prescription, userId);
      setHomePrescriptionGoal(goalDisplay);
    } catch {
      setExercisePrescription(null);
      setExerciseProgressMap({});
      setHomePrescriptionGoal(null);
    }
  }, [userId]);

  useEffect(() => {
    if (userExtr == null) {
      void dispatch(fetchUserInfo());
    }
  }, [dispatch, userExtr]);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchUserBaseInfo());
      void loadMealData();
      void loadVitalsData();
      void loadExercisePrescription();

      // 自动/手动同步完成时，仅在首页有焦点时刷新心率/卡路里/血糖
      const sub = DeviceEventEmitter.addListener(HEALTH_KIT_SYNC_COMPLETED, () => {
        void loadVitalsData();
      });
      return () => sub.remove();
    }, [dispatch, loadExercisePrescription, loadMealData, loadVitalsData]),
  );

  // useEffect(()=>{
  //   AsyncStorage.setItem('token','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJhcHBfdXNlcjoyMDYxMjYyMTkzNDQyMjM4NDY2Iiwicm5TdHIiOiJidlZsRnA2aVpXMVZreEpkQk44TU13OGJJbFRiZktheSIsImNsaWVudGlkIjoiNTI4Y2ZlZDc0ODkyNDMzYjkyZjJhYzU1MTk4OTIwY3EtdXNlckFwcFNtcyIsInRlbmFudElkIjoiMDAwMDAwIiwidXNlcklkIjoyMDYxMjYyMTkzNDQyMjM4NDY2LCJ1c2VyTmFtZSI6IjE3NjAxNjM4MDIxIn0.BgYnMUWXvdXFJj_LF3hBr-PDHjfYz55Ry_PjuyJ_EDw');
  //   AsyncStorage.setItem('clientId','528cfed74892433b92f2ac55198920cq-userAppSms');
  // },[])

  const updateScrollEnabled = useCallback(() => {
    const viewport = viewportHeightRef.current;
    const contentH = contentHeightRef.current;
    if (viewport <= 0 || contentH <= 0) {
      setScrollEnabled(false);
      return;
    }
    setScrollEnabled(contentH > viewport + 1);
  }, []);

  const onScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    updateScrollEnabled();
  }, [updateScrollEnabled]);

  const onScrollContentSizeChange = useCallback((_width: number, height: number) => {
    contentHeightRef.current = height;
    updateScrollEnabled();
  }, [updateScrollEnabled]);

  const onHomeScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > 1;
    if (next === showTopMaskRef.current) return;
    showTopMaskRef.current = next;
    setShowTopMask(next);
  }, []);

  const content = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scroll}
      scrollEnabled={scrollEnabled}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      onLayout={onScrollViewLayout}
      onContentSizeChange={onScrollContentSizeChange}
      onScroll={onHomeScroll}
      scrollEventThrottle={16}
    >
      <Image
        source={require('@/assets/images/home/back.png')}
        style={[bannerSize, { position: "absolute", top: 0, left: 0 }]}
        resizeMode="cover"
      />
      <View style={styles.pd18}>
        <View onLayout={onBlurCardLayout} style={[styles.blurViewShadow, { width: blurCardWidth }]}>
          <LinearGradient
            colors={[...BLUR_CARD_GRADIENT_COLORS]}
            locations={[0, 1]}
            style={styles.blurCardGradientFill}
            pointerEvents="none"
          />
          <BlurView
            intensity={60}
            tint="light"
            style={styles.blurCardBlurFill}
            pointerEvents="none"
            {...blurViewProps}
          />
          <View style={styles.blurCardContent}>
            <View style={styles.blurCardHeader}>
              <Text style={styles.blurCardTitle}>今日健康摘要</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VitalsPage')}>
                <Flex align="center">
                  <Text style={styles.blurCardMore}>查看全部</Text>
                  <Image style={styles.blurCardMoreIcon} tintColor={"#FFF"} source={require('@/assets/images/home/icon_right.png')} />
                </Flex>
              </TouchableOpacity>
            </View>
            <Flex justify='between' style={styles.blurCardContentListBox}>
              <View style={styles.blurCardContentList}>
                <View style={styles.blurCardListRow}>
                  <TouchableOpacity onPress={() => setVitalInfoKey('心率')}>
                    <Flex align="center">
                      <Image source={require('@/assets/images/home/xl_Icon.png')} style={styles.blurCardListIcon} />
                      <Flex align="center">
                        <Text style={styles.blurCardListText}>心率</Text>
                        <Image style={styles.blurCardInfoIcon} source={require('@/assets/images/home/info.png')} />
                      </Flex>
                    </Flex>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('HeartRatePage')}>
                    <Flex style={{ flex: 1 }}>
                      <Image tintColor="#333333" style={styles.blurCardListMoreIcon} source={require('@/assets/images/home/more.png')} />
                    </Flex>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('HeartRatePage')}>
                  <Flex align="end" style={styles.blurCardValueCol}>
                    <Text style={styles.blurCardValue}>{heartRate.value}</Text>
                    <Text style={styles.blurCardUnit}>次/分</Text>
                  </Flex>
                  <Flex align="center" style={styles.blurCardSparklineWrap}>
                    {heartRateSparkline.length > 0 ? (
                      <MiniSparkline data={heartRateSparkline} />
                    ) : null}
                  </Flex>
                  <Text style={styles.blurCardValueText}>静息心率:{restingHeartRate}次/分</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.blurCardContentList} >
                <View style={styles.blurCardListRow}>
                  <TouchableOpacity onPress={() => setVitalInfoKey('卡路里')}>
                    <Flex align="center">
                      <Image source={require('@/assets/images/home/kll_Icon.png')} style={styles.blurCardListIcon} />
                      <Flex align="center">
                        <Text style={styles.blurCardListText}>卡路里</Text>
                        <Image style={styles.blurCardInfoIcon} source={require('@/assets/images/home/info.png')} />
                      </Flex>
                    </Flex>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('ConsumptionPage')}>
                    <Flex style={{ flex: 1 }}>
                      <Image tintColor="#333333" style={styles.blurCardListMoreIcon} source={require('@/assets/images/home/more.png')} />
                    </Flex>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('ConsumptionPage')}>
                  <Flex align="end" style={styles.blurCardValueCol}>
                    <Text style={styles.blurCardValue}>{energySummary.total}</Text>
                    <Text style={styles.blurCardUnit}>千卡</Text>
                  </Flex>
                  <Flex align="center" style={styles.blurCardSparklineWrap}>
                    <View style={styles.blurCardProgressTrack}>
                      <View
                        style={[
                          styles.blurCardProgressFill,
                          {
                            width: Math.max(
                              0,
                              Math.min(
                                BLUR_CARD_ENERGY_TRACK_WIDTH,
                                (BLUR_CARD_ENERGY_TRACK_WIDTH * blurCardEnergyProgress) / 100,
                              ),
                            ),
                          },
                        ]}
                      />
                    </View>
                  </Flex>
                  <Text style={styles.blurCardValueText}>目标:{energyTarget}千卡</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.blurCardContentList}>
                <View style={styles.blurCardListRow}>
                  <TouchableOpacity onPress={() => setVitalInfoKey('血糖')}>
                    <Flex align="center">
                      <Image source={require('@/assets/images/home/xt_Icon.png')} style={styles.blurCardListIcon} />
                      <Flex align="center">
                        <Text style={styles.blurCardListText}>血糖</Text>
                        <Image style={styles.blurCardInfoIcon} source={require('@/assets/images/home/info.png')} />
                      </Flex>
                    </Flex>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('BloodSugarPage')}>
                    <Flex style={{ flex: 1 }}>
                      <Image tintColor="#333333" style={styles.blurCardListMoreIcon} source={require('@/assets/images/home/more.png')} />
                    </Flex>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('BloodSugarPage')}>
                  <Flex align="end" style={styles.blurCardValueCol}>
                    <Text style={styles.blurCardValue}>{glucose.value}</Text>
                    <Text style={styles.blurCardUnit}>mmol/L</Text>
                  </Flex>
                  <Flex align="center" style={styles.blurCardSparklineWrap}>
                    {glucoseSparkline.length > 0 ? (
                      <MiniSparkline data={glucoseSparkline} color="#EE9C44" />
                    ) : null}
                  </Flex>
                  <Text style={styles.blurCardValueText}>{glucoseSubtitle}</Text>
                </TouchableOpacity>
              </View>
            </Flex>
            {blurCardLayout.height > 0 ? (
              <Svg
                width={blurCardLayout.width}
                height={blurCardLayout.height}
                style={styles.blurViewBorderSvg}
                pointerEvents="none">
                <Defs>
                  <SvgLinearGradient id="homeBlurCardBorder" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.5} />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  x={BLUR_CARD_BORDER_WIDTH / 2}
                  y={BLUR_CARD_BORDER_WIDTH / 2}
                  width={blurCardLayout.width - BLUR_CARD_BORDER_WIDTH}
                  height={blurCardLayout.height - BLUR_CARD_BORDER_WIDTH}
                  rx={BLUR_CARD_RADIUS - BLUR_CARD_BORDER_WIDTH / 2}
                  ry={BLUR_CARD_RADIUS - BLUR_CARD_BORDER_WIDTH / 2}
                  fill="none"
                  stroke="url(#homeBlurCardBorder)"
                  strokeWidth={BLUR_CARD_BORDER_WIDTH}
                />
              </Svg>
            ) : null}
          </View>
        </View>
        <View style={styles.scheduleBoxShadow}>
          <View style={styles.scheduleBox}>
            <LinearGradient
              colors={['#E6F1FF', '#FEFFFF']}
              locations={[0, 0.3]}
              style={styles.scheduleBoxGradient}
              pointerEvents="none"
            />
            <View style={styles.scheduleBoxContent}>
              <Flex justify='between'>
                <Flex>
                  <Image source={require('@/assets/images/home/yd.png')} style={styles.cfIcon} />
                  <Text style={styles.cfIconText}>运动处方</Text>
                </Flex>
                <TouchableOpacity onPress={() => navigation.navigate('ExercisePage')}>
                  <Flex>
                    <Text style={styles.cfMore}>查看详情</Text>
                    <Image tintColor="#333333" style={styles.cfMoreIcon} source={require('@/assets/images/home/icon_right.png')} />
                  </Flex>
                </TouchableOpacity>
              </Flex>
              {!exercisePrescription ? (
                <View style={styles.cfEmpty}>
                  <Image
                    source={require('@/assets/images/home/icon_yd_empty.png')}
                    style={styles.cfEmptyIcon}
                  />
                  {profileComplete ? (
                    <Text style={styles.cfEmptyText}>暂无运动处方，如需开方，请联系工作人员</Text>
                  ) : (
                    <View style={styles.cfEmptyTextRow}>
                      <Text style={styles.cfEmptyTextInline}>暂无运动处方，请先</Text>
                      <CompleteProfileLink color='#6D925E' textStyle={styles.cfEmptyLink} />
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <Flex justify='between' style={styles.cfContent}>
                    {exercisePrescriptionMetrics.map(item => (
                      <View key={item.key} style={styles.cfItem}>
                        <Text style={styles.cfValue}>{item.value}%</Text>
                        <Text style={styles.cfText}>{item.label}</Text>
                        <View style={styles.cfProgressTrack}>
                          <View style={[
                            styles.cfProgressFill,
                            {
                              width: Math.max(0,
                                Math.min(CF_PROGRESS_TRACK_WIDTH, (CF_PROGRESS_TRACK_WIDTH * item.value) / 100),
                              ),
                              backgroundColor: item.color,
                            },
                          ]} />
                        </View>
                      </View>
                    ))}
                  </Flex>
                  {homePrescriptionGoal ? (
                    <Flex style={styles.cfBottom} align="center">
                      {homePrescriptionGoal.layout === 'metric' ? (
                        <>
                          <Text style={styles.btm1}>{homePrescriptionGoal.label}</Text>
                          <Text style={styles.btmText}>{homePrescriptionGoal.value}</Text>
                          <Text style={styles.btm1}>{homePrescriptionGoal.unit}</Text>
                          <Flex style={styles.ydbBox}>
                            <Text style={styles.ydbText}>{homePrescriptionGoal.badge}</Text>
                          </Flex>
                        </>
                      ) : (
                        <Text style={styles.btm1} numberOfLines={2}>{homePrescriptionGoal.text}</Text>
                      )}
                    </Flex>
                  ) : null}
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.scheduleBoxShadow}>
          <View style={styles.scheduleBox}>
            <LinearGradient
              colors={['#E6F1FF', '#FEFFFF']}
              locations={[0, 0.3]}
              style={styles.scheduleBoxGradient}
              pointerEvents="none"
            />
            <View style={[styles.scheduleBoxContent, { paddingBottom: 4 }]}>
              <Flex justify='between'>
                <Flex>
                  <Image source={require('@/assets/images/home/yy.png')} style={styles.cfIcon} />
                  <Text style={styles.cfIconText}>营养处方</Text>
                </Flex>
                <TouchableOpacity onPress={() =>
                  navigation.navigate('NutritionPage')
                  //  navigation.navigate('Medication', { tab: 'meal' })
                }>
                  <Flex>
                    <Text style={styles.cfMore}>查看详情</Text>
                    <Image tintColor="#333333" style={styles.cfMoreIcon} source={require('@/assets/images/home/icon_right.png')} />
                  </Flex>
                </TouchableOpacity>
              </Flex>
              <Flex justify='between' style={styles.yyContent}>
                <Flex style={styles.yyItem} align="center">
                  <MiniProgressRing size={30}
                    progress={calorieProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#6D925E"
                  />
                  <View style={styles.yyItemRight}>
                    <Flex style={styles.yyValueRow}>
                      <NutritionAmountText
                        text={formatNutritionInteger(todayCalories)}
                        textStyle={styles.yyValue}
                        scrollStyle={styles.yyValueScroll}
                      />
                      <Text style={styles.yyUnit}>/</Text>
                      <NutritionAmountText
                        text={`${dietSummary.targetCalories ?? '--'}`}
                        textStyle={styles.yyUnit}
                        scrollStyle={styles.yyUnitScroll}
                      />
                    </Flex>
                    <Text style={styles.yyTitle}>热量(千卡)</Text>
                  </View>
                </Flex>
                <Flex style={styles.yyItem} align="center">
                  <MiniProgressRing size={30}
                    progress={proteinProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#0951AE"
                  />
                  <View style={styles.yyItemRight}>
                    <Flex style={styles.yyValueRow}>
                      <NutritionAmountText
                        text={formatNutritionInteger(todayProtein)}
                        textStyle={styles.yyValue}
                        scrollStyle={styles.yyValueScroll}
                      />
                      <NutritionAmountText
                        text={` /${dietSummary.targetProtein ?? '--'}`}
                        textStyle={styles.yyUnit}
                        scrollStyle={styles.yyUnitScroll}
                      />
                    </Flex>
                    <Text style={styles.yyTitle}>蛋白(克)</Text>
                  </View>
                </Flex>
                <Flex style={styles.yyItem} align="center">
                  <MiniProgressRing size={30}
                    progress={carbsProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#EE9C44"
                  />
                  <View style={styles.yyItemRight}>
                    <Flex style={styles.yyValueRow}>
                      <NutritionAmountText
                        text={formatNutritionInteger(todayCarbs)}
                        textStyle={styles.yyValue}
                        scrollStyle={styles.yyValueScroll}
                      />
                      <NutritionAmountText
                        text={` /${dietSummary.targetCarbs ?? '--'}`}
                        textStyle={styles.yyUnit}
                        scrollStyle={styles.yyUnitScroll}
                      />
                    </Flex>
                    <Text style={styles.yyTitle}>碳水(克)</Text>
                  </View>
                </Flex>
              </Flex>
              <Flex style={styles.ysBox}>
                <Flex>
                  <Image style={styles.ysIcon} source={currentMealMeta.icon} />
                  <Text style={styles.ysText}>{currentMealMeta.title}</Text>
                </Flex>
                <Flex
                  justify='center'
                  style={[styles.wlrBox, hasLoggedCurrentMeal ? styles.wlrBoxLogged : null]}>
                  <Text style={[styles.wlrText, hasLoggedCurrentMeal ? styles.wlrTextLogged : null]}>{hasLoggedCurrentMeal ? '已录入' : '未录入'}</Text>
                </Flex>
                <View style={styles.line}></View>
                <View style={styles.foodArea}>
                  {displayFoods.length === 0 ? (
                    <View style={styles.foodChip}>
                      <Text style={styles.foodText}>暂无建议</Text>
                    </View>
                  ) : (
                    <View style={styles.foodList}>
                      {homeFoodDisplay.visible.map((food, index) => {
                        const shouldTruncate =
                          homeFoodDisplay.truncateLast
                          && index === homeFoodDisplay.visible.length - 1;
                        return (
                          <View
                            key={`${food}-${index}`}
                            style={[styles.foodChip, shouldTruncate ? styles.foodChipShrink : null]}
                          >
                            <Text
                              style={styles.foodText}
                              numberOfLines={shouldTruncate ? 1 : undefined}
                              ellipsizeMode="tail"
                            >
                              {food}
                            </Text>
                          </View>
                        );
                      })}
                      {homeFoodDisplay.hasMore && !homeFoodDisplay.truncateLast ? (
                        <View style={styles.foodChip}>
                          <Text style={styles.foodEllipsis}>...</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </Flex>
            </View>
            <Flex style={styles.jyBox} justify='center'>
              <Image source={require('@/assets/images/home/jy.png')} style={styles.jyIcon} />
              <Text style={styles.jyText}>
                {hasLoggedCurrentMeal
                  ? `本餐热量${formatNutritionInteger(displayCalories)}千卡`
                  : `建议热量${formatNutritionInteger(displayCalories)}千卡`}
              </Text>
            </Flex>
            {!dietRule ? (
              <Flex style={styles.yyEmptyTip} align="center">
                <Image
                  source={require('@/assets/images/home/icon_warn.png')}
                  style={styles.yyEmptyTipIcon}
                />
                {profileComplete ? (
                  <Text style={styles.yyEmptyTipText}>暂无营养处方，如需开方，请联系工作人员</Text>
                ) : (
                  <View style={styles.yyEmptyTipTextRow}>
                    <Text style={styles.yyEmptyTipTextInline}>暂无营养处方，请先</Text>
                    <CompleteProfileLink color='#C98A41' textStyle={styles.yyEmptyTipLink} />
                  </View>
                )}
              </Flex>
            ) : null}
          </View>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.floatingHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.floatingHeaderInner} pointerEvents="box-none">
          <Image source={require('@/assets/images/home/homeLogo.png')} style={styles.miniLogo} />
        </View>
      </View>
      {showTopMask ? (
        <LinearGradient
          colors={['rgba(1,24,44,0.9)', 'rgba(1,24,44,0.5)', 'rgba(46,108,149,0)']}
          locations={[0, 0.6, 1]}
          style={styles.scrollTopMask}
          pointerEvents="none"
        />
      ) : null}
      {Platform.OS === 'android' ? (
        <BlurTargetView ref={blurTargetRef} style={styles.scrollView}>
          {content}
        </BlurTargetView>
      ) : (
        content
      )}
      <VitalInfoModal vitalKey={vitalInfoKey} onClose={() => setVitalInfoKey(null)} />
    </View>
  );
}