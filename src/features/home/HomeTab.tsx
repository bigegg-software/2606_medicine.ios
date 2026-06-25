import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ImageBackground, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex, Carousel } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/src/features/home/MainTabs';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/home/home';
import MiniProgressRing from './components/MiniProgressRing';
import type { RootStackParamList } from '@/route/router';
import { fetchUserInfo } from '@/store/actions/user';
import type { AppDispatch, RootState } from '@/store/store';
import { getInUseDietPatientRuleInfo, type DietMealItem, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
  calcNutritionPercent,
  calcNutritionProgress,
  getCalorieNutritionDisplay,
  getDietRuleSummary,
  getProteinNutritionDisplay,
  getWaterNutritionDisplay,
  NUTRITION_COLOR,
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

const HOME_BANNER_ASPECT = 434 / 750;

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

export default function HomeTab() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const { width: windowWidth } = useWindowDimensions();
  const bannerSize = useMemo(() => {
    const width = windowWidth;
    return { width, height: Math.round(width * HOME_BANNER_ASPECT) };
  }, [windowWidth]);
  const colBoxWidth = useMemo(
    () => Math.floor((windowWidth - 36) * 0.3),
    [windowWidth],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
  const [todayMealList, setTodayMealList] = useState<MealDetailItem[]>([]);
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

  const caloriePercent = calcNutritionPercent(todayCalories, dietSummary.targetCalories);
  const proteinPercent = calcNutritionPercent(todayProtein, dietSummary.targetProtein);
  const waterPercent = calcNutritionPercent(todayWaterMl, dietSummary.targetWater);
  const calorieProgress = calcNutritionProgress(todayCalories, dietSummary.targetCalories);
  const proteinProgress = calcNutritionProgress(todayProtein, dietSummary.targetProtein);
  const waterProgress = calcNutritionProgress(todayWaterMl, dietSummary.targetWater);
  const calorieDisplay = getCalorieNutritionDisplay(caloriePercent);
  const proteinDisplay = getProteinNutritionDisplay(proteinPercent);
  const waterDisplay = getWaterNutritionDisplay(waterPercent);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        userExtr == null ? dispatch(fetchUserInfo()) : Promise.resolve(),
        loadMealData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, loadMealData, userExtr]);


  useEffect(() => {
    if (userExtr == null) {
      void dispatch(fetchUserInfo());
    }
  }, [dispatch, userExtr]);

  useFocusEffect(
    useCallback(() => {
      void loadMealData();
    }, [loadMealData]),
  );

  useFocusEffect(
    useCallback(() => {
      const stackNavigation = navigation.getParent()?.getParent() ?? navigation.getParent();
      stackNavigation?.setOptions({
        title: '',
        headerTitle: () => null,
        headerLeft: () => (
          <View style={{ marginLeft: 18 }}>
            <Image source={require('@/assets/images/home/homeLogo.png')} style={styles.miniLogo} />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity style={styles.topRight} activeOpacity={0.8}>
            <Image source={require('@/assets/images/home/tip.png')} style={styles.rightImg} />
            <View style={styles.redDot} />
          </TouchableOpacity>
        ),
      });
      return () => {
        stackNavigation?.setOptions({
          headerTitle: undefined,
          headerLeft: undefined,
          headerRight: undefined,
        });
      };
    }, [navigation]),
  );


  // return (
  //   <TabPageLayout style={styles.container} contentStyle={styles.center}>
  //     <ActivityIndicator size="large" color={AppTheme.primaryColor} />
  //   </TabPageLayout>
  // );

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scroll}>
        <Image
          source={require('@/assets/images/home/banner.png')}
          style={[styles.banner, bannerSize]}
          resizeMode="cover"
        />
        <View style={styles.pd18}>
          <Flex justify='between' style={styles.colBoxes}>
            <ImageBackground
              source={require('@/assets/images/home/back1.png')}
              style={[styles.colBox, { width: colBoxWidth }]}
              imageStyle={styles.colBg}
              resizeMode="cover">
              <Image source={require('@/assets/images/home/rl_w.png')} style={styles.imgIcon} />
              <Text style={styles.colText}>心率</Text>
              <Text style={styles.colValue}>72次/分钟</Text>
            </ImageBackground>
            <ImageBackground
              source={require('@/assets/images/home/back2.png')}
              style={[styles.colBox, { width: colBoxWidth }]}
              imageStyle={styles.colBg}
              resizeMode="cover">
              <Image source={require('@/assets/images/home/xl_w.png')} style={styles.imgIcon} />
              <Text style={styles.colText}>卡路里</Text>
              <Text style={styles.colValue}>2000千卡</Text>
            </ImageBackground>
            <ImageBackground
              source={require('@/assets/images/home/back3.png')}
              style={[styles.colBox, { width: colBoxWidth }]}
              imageStyle={styles.colBg}
              resizeMode="cover">
              <Image source={require('@/assets/images/home/xt_w.png')} style={styles.imgIcon} />
              <Text style={styles.colText}>血糖</Text>
              <Text style={styles.colValue}>6.8mmol/L</Text>
            </ImageBackground>
          </Flex>
          <View style={styles.scheduleBox}>
            <Flex justify='between'>
              <Flex>
                <Flex justify='center' style={styles.cfIconBox}>
                  <Image source={require('@/assets/images/home/yd.png')} style={styles.cfIcon} />
                </Flex>
                <Text style={styles.cfIconText}>运动处方</Text>
              </Flex>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#333333" />
            </Flex>
            <Flex justify='between' style={styles.cfContent}>
              <View>
                <Text style={styles.cfValue}>65%</Text>
                <Text style={styles.cfText}>有氧心肺</Text>
              </View>
              <View>
                <Text style={styles.cfValue}>15%</Text>
                <Text style={styles.cfText}>抗阻增肌</Text>
              </View>
              <View>
                <Text style={styles.cfValue}>100%</Text>
                <Text style={styles.cfText}>平衡控制</Text>
              </View>
              <View>
                <Text style={styles.cfValue}>15%</Text>
                <Text style={styles.cfText}>柔韧拉伸</Text>
              </View>
            </Flex>
            <View style={styles.cfLine} />
            <Flex justify='center' style={{ marginTop: 16 }}>
              <Text style={styles.btm1}>血糖控制目标</Text>
              <Text style={styles.btmText}>30</Text>
              <Text style={styles.btm1}>天</Text>
              <Flex style={styles.ydbBox}>
                <Text style={styles.ydbText}>已达标15天</Text>
              </Flex>
            </Flex>
          </View>
          <View style={styles.scheduleBox}>
            <TouchableOpacity onPress={() => navigation.navigate('Medication', { tab: 'meal' })}>
              <Flex justify='between'>
                <Flex>
                  <Flex justify='center' style={styles.cfIconBox}>
                    <Image source={require('@/assets/images/home/yy.png')} style={styles.cfIcon} />
                  </Flex>
                  <Text style={styles.cfIconText}>营养处方</Text>
                </Flex>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#333333" />
              </Flex>
            </TouchableOpacity>
            <Flex justify='between' style={styles.yyContent}>
              <View style={styles.yyItem}>
                <Flex justify="center" align="center">
                  <Text style={styles.yyTitle}>热量</Text>
                  <MiniProgressRing
                    progress={calorieProgress}
                    color={NUTRITION_COLOR[calorieDisplay.tone]}
                  />
                </Flex>
                <Flex justify="center" style={{ marginTop: 6 }}>
                  <Text style={styles.yyValue}>{formatNutritionInteger(todayCalories)}</Text>
                  <Text style={styles.yyUnit}> /{dietSummary.targetCalories ?? '--'}千卡</Text>
                </Flex>
              </View>
              <View style={styles.yyItem}>
                <Flex justify="center" align="center">
                  <Text style={styles.yyTitle}>蛋白</Text>
                  <MiniProgressRing
                    progress={proteinProgress}
                    color={NUTRITION_COLOR[proteinDisplay.tone]}
                  />
                </Flex>
                <Flex justify="center" style={{ marginTop: 6 }}>
                  <Text style={styles.yyValue}>{formatNutritionInteger(todayProtein)}</Text>
                  <Text style={styles.yyUnit}> /{dietSummary.targetProtein ?? '--'}克</Text>
                </Flex>
              </View>
              <View style={styles.yyItem}>
                <Flex justify="center" align="center">
                  <Text style={styles.yyTitle}>饮水</Text>
                  <MiniProgressRing
                    progress={waterProgress}
                    color={NUTRITION_COLOR[waterDisplay.tone]}
                  />
                </Flex>
                <Flex justify="center" style={{ marginTop: 6 }}>
                  <Text style={styles.yyValue}>{formatNutritionInteger(todayWaterMl)}</Text>
                  <Text style={styles.yyUnit}> /{dietSummary.targetWater ?? '--'}毫升</Text>
                </Flex>
              </View>
            </Flex>
            <Flex style={styles.ysBox}>
              <View>
                <Flex>
                  <Image style={styles.ysIcon} source={currentMealMeta.icon} />
                  <Text style={styles.ysText}>{currentMealMeta.title}</Text>
                </Flex>
                <Flex
                  justify='center'
                  style={[styles.wlrBox, hasLoggedCurrentMeal ? styles.wlrBoxLogged : null]}>
                  <Text style={styles.wlrText}>{hasLoggedCurrentMeal ? '已录入' : '未录入'}</Text>
                </Flex>
              </View>
              <View style={styles.line}>
                {Array.from({ length: 5 }, (_, index) => (
                  <View key={index} style={styles.lineDash} />
                ))}
              </View>
              <View style={styles.foodArea}>
                <View style={styles.foodList}>
                  {displayFoods.length > 0 ? (
                    displayFoods.map((food, index) => (
                      <View key={`${food}-${index}`} style={styles.foodBox}>
                        <Text style={styles.foodText}>{food}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.foodBox}>
                      <Text style={styles.foodText}>暂无建议</Text>
                    </View>
                  )}
                </View>
                <Flex style={styles.jyBox} justify='center'>
                  <Image source={require('@/assets/images/home/jy.png')} style={styles.jyIcon} />
                  <Text style={styles.jyText}>
                    {hasLoggedCurrentMeal
                      ? `本餐热量：${formatNutritionInteger(displayCalories)}千卡`
                      : `建议热量：${formatNutritionInteger(displayCalories)}千卡`}
                  </Text>
                </Flex>
              </View>
            </Flex>
          </View>
        </View>

      </ScrollView>
    </TabPageLayout>
  );
}