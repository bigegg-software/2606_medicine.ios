import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import MiniProgressRing from '@/src/features/home/components/MiniProgressRing';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import type { MealRecordItem } from '@/api/meal';
import type { MealDetailItem } from '@/api/mealDetail';
import styles from '@/css/medication/mealHistory';
import mealStyles from '@/css/medication/meal';
import { NUTRITION_COLOR } from './utils/dietRuleHelpers';
import {
  buildDayNutritionSummary,
  buildMealSections,
  buildWaterTimeline,
  formatMealHistoryDate,
} from './utils/mealHistoryHelpers';
import { formatNutritionInteger } from './utils/mealDetailHelpers';
import { loadMealDayDetailPayload } from './utils/mealDayDetailHelpers';

type Route = RouteProp<RootStackParamList, 'MealDayDetailPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type DayDetailState = {
  meals: MealRecordItem[];
  foodDetails: MealDetailItem[];
  detailsByMealId: Record<string, MealDetailItem[]>;
};

const EMPTY_DAY_STATE: DayDetailState = {
  meals: [],
  foodDetails: [],
  detailsByMealId: {},
};

function NutritionStatusTag({
  display,
}: {
  display: { label: string; tone: keyof typeof NUTRITION_COLOR; arrow: 'up' | 'down' | 'none' };
}) {
  const color = NUTRITION_COLOR[display.tone];
  return (
    <Flex align="center">
      <Text style={[styles.statusText, { color }]}>{display.label}</Text>
      {display.arrow !== 'none' ? (
        <Image
          style={[styles.statusIcon, { tintColor: color }]}
          source={
            display.arrow === 'up'
              ? require('@/assets/images/medication/up.png')
              : require('@/assets/images/medication/down.png')
          }
        />
      ) : null}
    </Flex>
  );
}

export default function MealDayDetailPage() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { customerLocalDate } = route.params;

  const [loading, setLoading] = useState(true);
  const [dayState, setDayState] = useState<DayDetailState>(EMPTY_DAY_STATE);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setDayState(EMPTY_DAY_STATE);

    // 等转场动画结束再拉数，避免打开时主线程卡顿
    await new Promise<void>(resolve => {
      InteractionManager.runAfterInteractions(() => resolve());
    });

    try {
      const payload = await loadMealDayDetailPayload(customerLocalDate);
      setDayState(payload);
    } catch {
      setDayState(EMPTY_DAY_STATE);
    } finally {
      setLoading(false);
    }
  }, [customerLocalDate]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const snapshot = useMemo(
    () => dayState.meals.find(item => item.dietRuleSnapshot)?.dietRuleSnapshot,
    [dayState.meals],
  );

  const summary = useMemo(
    () => buildDayNutritionSummary(dayState.meals, dayState.foodDetails, snapshot),
    [dayState.foodDetails, dayState.meals, snapshot],
  );

  const mealSections = useMemo(
    () =>
      buildMealSections(
        dayState.meals,
        dayState.detailsByMealId,
        snapshot,
        customerLocalDate,
      ),
    [customerLocalDate, dayState.detailsByMealId, dayState.meals, snapshot],
  );

  const waterTimeline = useMemo(
    () => buildWaterTimeline(dayState.foodDetails),
    [dayState.foodDetails],
  );

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} contentStyle={styles.pageBody}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.dateText}>{formatMealHistoryDate(customerLocalDate)}</Text>

          <View style={[styles.card, styles.nutritionCard]}>
            <View style={mealStyles.yyContent}>
              <View style={mealStyles.yyItem}>
                <Flex align="center">
                  <Text style={mealStyles.yyTitle}>热量</Text>
                  <MiniProgressRing
                    size={30}
                    progress={summary.calorieProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#6D925E"
                  />
                </Flex>
                <Flex align="center" style={{ marginTop: 6 }}>
                  <Text style={mealStyles.yyValue}>{formatNutritionInteger(summary.calories)}</Text>
                  <Text style={mealStyles.yyUnit}> /{summary.targetCalories ?? '--'}千卡</Text>
                </Flex>
                <NutritionStatusTag display={summary.calorieDisplay} />
                <Text style={[styles.cardSubTitle, { marginTop: 4 }]}>{summary.caloriePercent}%</Text>
              </View>

              <View style={mealStyles.yyItem}>
                <Flex align="center">
                  <Text style={mealStyles.yyTitle}>蛋白质</Text>
                  <MiniProgressRing
                    size={30}
                    progress={summary.proteinProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#0951AE"
                  />
                </Flex>
                <Flex align="center" style={{ marginTop: 6 }}>
                  <Text style={mealStyles.yyValue}>{formatNutritionInteger(summary.protein)}</Text>
                  <Text style={mealStyles.yyUnit}> /{summary.targetProtein ?? '--'}g</Text>
                </Flex>
                <NutritionStatusTag display={summary.proteinDisplay} />
                <Text style={[styles.cardSubTitle, { marginTop: 4 }]}>{summary.proteinPercent}%</Text>
              </View>

              <View style={mealStyles.yyItem}>
                <Flex align="center">
                  <Text style={mealStyles.yyTitle}>饮水</Text>
                  <MiniProgressRing
                    size={30}
                    progress={summary.waterProgress}
                    trackColor="rgba(131,174,255,0.14)"
                    color="#4F86EE"
                  />
                </Flex>
                <Flex align="center" style={{ marginTop: 6 }}>
                  <Text style={mealStyles.yyValue}>{formatNutritionInteger(summary.water)}</Text>
                  <Text style={mealStyles.yyUnit}> /{summary.targetWater ?? '--'}ml</Text>
                </Flex>
                <NutritionStatusTag display={summary.waterDisplay} />
                <Text style={[styles.cardSubTitle, { marginTop: 4 }]}>{summary.waterPercent}%</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginVertical: 12 }]}>用餐详情</Text>
          {mealSections.length === 0 ? (
            <View style={[styles.card, { paddingVertical: 24 }]}>
              <Text style={styles.daySubtitle}>暂无用餐记录</Text>
            </View>
          ) : (
            mealSections.map(section => (
              <View key={section.key} style={[styles.card, styles.mealSection]}>
                <Text style={styles.mealSectionHeader}>
                  {section.title}
                  {section.currentCalories}
                  {section.targetCalories != null ? `/${section.targetCalories}` : ''}
                  千卡
                </Text>
                {section.foods.length === 0 ? (
                  <Text style={styles.daySubtitle}>暂无食物明细</Text>
                ) : (
                  section.foods.map(food => (
                    <TouchableOpacity
                      key={food.key}
                      style={styles.foodCard}
                      activeOpacity={food.mealDetailId ? 0.7 : 1}
                      onPress={() => {
                        if (!food.mealDetailId) return;
                        navigation.navigate('MealRecordDetailPage', {
                          mealDetailId: food.mealDetailId,
                        });
                      }}
                    >
                      {food.ossUrl ? (
                        <Image source={{ uri: food.ossUrl }} style={styles.foodImage} />
                      ) : (
                        <Image
                          source={require('@/assets/images/medication/default2.png')}
                          style={styles.foodImagePlaceholder}
                        />
                      )}
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodServing}>{food.servingText}</Text>
                      </View>
                      <Text style={styles.foodCalorie}>{food.calories}千卡</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ))
          )}

          {waterTimeline.length > 0 ? (
            <View style={[styles.card, styles.mealSection]}>
              <Text style={styles.waterHeader}>
                饮水{formatNutritionInteger(summary.water)}
                /{summary.targetWater ?? '--'}ml
              </Text>
              {waterTimeline.map(item => (
                <View key={item.key} style={styles.waterRow}>
                  <Text style={styles.waterTime}>{item.time}</Text>
                  <Text style={styles.waterAmount}>{item.amount}ml</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </PageLayout>
  );
}
