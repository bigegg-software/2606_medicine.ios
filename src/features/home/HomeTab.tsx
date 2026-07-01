import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, useWindowDimensions, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
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
import UploadProgressBar from '@/src/components/UploadProgressBar';
import AutoScrollText from '@/src/components/AutoScrollText';
import { fetchUserInfo } from '@/store/actions/user';
import type { AppDispatch, RootState } from '@/store/store';
import { getInUseDietPatientRuleInfo, type DietMealItem, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import {
  getMeasureDataDetailByDateRange,
  type MeasureDataItem,
  type MeasureDataRangeDetailResult,
} from '@/api/measureData';
import {
  getWearableDataDetailByDateRange,
  WEARABLE_DATA_TYPES,
  type WearableDataItem,
  type WearableDataRangeResult,
  type WearableDataType,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import {
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  filterMeasureItemsInRange,
  flattenMeasureItems,
  formatSingleValueFromItems,
  getDateRange,
  getEnergySummary,
  getHeartRateDisplay,
  getTodayWearableItem,
  normalizeMeasureRangeData,
  sortWearableItems,
} from '@/src/features/profile/vitals/vitalsHelpers';
import {
  calcNutritionProgress,
  getDietRuleSummary,
} from '@/src/features/profile/medication/meal/dietRuleHelpers';
import {
  formatNutritionInteger,
  getFoodRecordsByCategory,
  sumCalories,
  sumProtein,
  sumWaterIntake,
} from '@/src/features/profile/medication/meal/mealDetailHelpers';

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

function getRestingHeartRateText(items: WearableDataItem[]) {
  const item = getTodayWearableItem(items);
  const min = item?.minHeartRate != null ? Number(item.minHeartRate) : Number.NaN;
  if (!Number.isFinite(min) || min <= 0) return '--';
  return String(Math.round(min));
}

const EXERCISE_PRESCRIPTION_METRICS = [
  { value: 65, label: '有氧心肺', color: '#6D925E' },
  { value: 15, label: '抗阻增肌', color: '#72A1C5' },
  { value: 100, label: '平衡控制', color: '#0951AE' },
  { value: 15, label: '柔韧拉伸', color: '#EE9C44' },
] as const;

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

function getCurrentMealKey(date = new Date()): HomeMealKey {
  const hour = date.getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 16) return 'lunch';
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
  return mealList?.find(item => item.day === today && item.mealCategory === category) ?? null;
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

function HomeHeaderRight() {
  return (
    <TouchableOpacity style={styles.topRight} activeOpacity={0.8}>
      <Image source={require('@/assets/images/home/tip.png')} style={styles.rightImg} />
      <View style={styles.redDot}>
        <Text style={styles.redDotText}>1+</Text>
      </View>
    </TouchableOpacity>
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
  const [wearableActiveEnergy, setWearableActiveEnergy] = useState<WearableDataItem[]>([]);
  const [wearableBasalEnergy, setWearableBasalEnergy] = useState<WearableDataItem[]>([]);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);

  const dietSummary = useMemo(() => getDietRuleSummary(dietRule), [dietRule]);
  const todayWaterMl = useMemo(() => sumWaterIntake(todayMealList), [todayMealList]);
  const todayCalories = useMemo(() => sumCalories(todayMealList), [todayMealList]);
  const todayProtein = useMemo(() => sumProtein(todayMealList), [todayMealList]);

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
  const waterProgress = calcNutritionProgress(todayWaterMl, dietSummary.targetWater);

  const heartRate = useMemo(() => getHeartRateDisplay(wearableHeartRate), [wearableHeartRate]);
  const heartRateSparkline = useMemo(
    () => toSparklineValues(buildWearableHeartRateSeries(wearableHeartRate, 'today')),
    [wearableHeartRate],
  );
  const restingHeartRate = useMemo(
    () => getRestingHeartRateText(wearableHeartRate),
    [wearableHeartRate],
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
      const [glucoseRes, heartRateItems, activeEnergyItems, basalEnergyItems] = await Promise.all([
        getMeasureDataDetailByDateRange({
          startDate,
          endDate,
          type: '血糖',
        }),
        fetchWearableItems(WEARABLE_DATA_TYPES.heartRate),
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
      setWearableActiveEnergy(activeEnergyItems);
      setWearableBasalEnergy(basalEnergyItems);
    } catch {
      setBloodGlucose([]);
      setWearableHeartRate([]);
      setWearableActiveEnergy([]);
      setWearableBasalEnergy([]);
    }
  }, []);

  useEffect(() => {
    if (userExtr == null) {
      void dispatch(fetchUserInfo());
    }
  }, [dispatch, userExtr]);

  useFocusEffect(
    useCallback(() => {
      void loadMealData();
      void loadVitalsData();
    }, [loadMealData, loadVitalsData]),
  );

  const content = (
    <View style={[styles.scrollView, styles.scroll]}>
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
                  <Image style={styles.blurCardMoreIcon} source={require('@/assets/images/home/more.png')} />
                </Flex>
              </TouchableOpacity>
            </View>
            <Flex justify='between' style={styles.blurCardContentListBox}>
              <View style={styles.blurCardContentList}>
                <View style={styles.blurCardListRow}>
                  <Flex align="center">
                    <Image source={require('@/assets/images/home/xl_Icon.png')} style={styles.blurCardListIcon} />
                    <Flex align="center">
                      <Text style={styles.blurCardListText}>心率</Text>
                      <Image style={styles.blurCardInfoIcon} source={require('@/assets/images/home/info.png')} />
                    </Flex>
                  </Flex>
                  <Image tintColor="#333333" style={styles.blurCardListMoreIcon} source={require('@/assets/images/home/more.png')} />
                </View>
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
              </View>
              <View style={styles.blurCardContentList}>
                <View style={styles.blurCardListRow}>
                  <Flex align="center">
                    <Image source={require('@/assets/images/home/kll_Icon.png')} style={styles.blurCardListIcon} />
                    <Flex align="center">
                      <Text style={styles.blurCardListText}>卡路里</Text>
                      <Image style={styles.blurCardInfoIcon} source={require('@/assets/images/home/info.png')} />
                    </Flex>
                  </Flex>
                  <Image tintColor="#333333" style={styles.blurCardListMoreIcon} source={require('@/assets/images/home/more.png')} />
                </View>

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
              </View>
              <View style={styles.blurCardContentList}>
                <View style={styles.blurCardListRow}>
                  <Flex align="center">
                    <Image source={require('@/assets/images/home/xt_Icon.png')} style={styles.blurCardListIcon} />
                    <Flex align="center">
                      <Text style={styles.blurCardListText}>血糖</Text>
                      <Image style={styles.blurCardInfoIcon} source={require('@/assets/images/home/info.png')} />
                    </Flex>
                  </Flex>
                  <Image tintColor="#333333" style={styles.blurCardListMoreIcon} source={require('@/assets/images/home/more.png')} />
                </View>
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
                <TouchableOpacity>
                  <Flex>
                    <Text style={styles.cfMore}>查看更多</Text>
                    <Image tintColor="#333333" style={styles.cfMoreIcon} source={require('@/assets/images/home/more.png')} />
                  </Flex>
                </TouchableOpacity>
              </Flex>
              <Flex justify='between' style={styles.cfContent}>
                {EXERCISE_PRESCRIPTION_METRICS.map(item => (
                  <View key={item.label} style={styles.cfItem}>
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
              <Flex style={styles.cfBottom}>
                <Text style={styles.btm1}>血糖控制目标</Text>
                <Text style={styles.btmText}>30</Text>
                <Text style={styles.btm1}>天</Text>
                <Flex style={styles.ydbBox}>
                  <Text style={styles.ydbText}>已达标15天</Text>
                </Flex>
              </Flex>
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
                <TouchableOpacity onPress={() => navigation.navigate('Medication', { tab: 'meal' })}>
                  <Flex>
                    <Text style={styles.cfMore}>查看更多</Text>
                    <Image tintColor="#333333" style={styles.cfMoreIcon} source={require('@/assets/images/home/more.png')} />
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
                    progress={waterProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#EE9C44"
                  />
                  <View style={styles.yyItemRight}>
                    <Flex style={styles.yyValueRow}>
                      <NutritionAmountText
                        text={formatNutritionInteger(todayWaterMl)}
                        textStyle={styles.yyValue}
                        scrollStyle={styles.yyValueScroll}
                      />
                      <NutritionAmountText
                        text={` /${dietSummary.targetWater ?? '--'}`}
                        textStyle={styles.yyUnit}
                        scrollStyle={styles.yyUnitScroll}
                      />
                    </Flex>
                    <Text style={styles.yyTitle}>饮水(毫升)</Text>
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
          </View>
        </View>
      </View>


    </View>
  );

  return (
    <View style={styles.container}>
      <UploadProgressBar />
      <View style={[styles.floatingHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.floatingHeaderInner}>
          <Image source={require('@/assets/images/home/homeLogo.png')} style={styles.miniLogo} />
          <HomeHeaderRight />
        </View>
      </View>
      {Platform.OS === 'android' ? (
        <BlurTargetView ref={blurTargetRef} style={styles.scrollView}>
          {content}
        </BlurTargetView>
      ) : (
        content
      )}
    </View>
  );
}