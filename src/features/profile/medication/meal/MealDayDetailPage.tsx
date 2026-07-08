import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { getMealDetailByMealId, getMealListByDate, type MealRecordItem } from '@/api/meal';
import type { MealDetailItem } from '@/api/mealDetail';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
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

type Route = RouteProp<RootStackParamList, 'MealDayDetailPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

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
  const [meals, setMeals] = useState<MealRecordItem[]>([]);
  const [foodDetails, setFoodDetails] = useState<MealDetailItem[]>([]);
  const [detailsByMealId, setDetailsByMealId] = useState<Record<string, MealDetailItem[]>>({});

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const listRes = await getMealListByDate({ customerLocalDate });
      const mealList = isResourceApiOk(listRes)
        ? apiResourceData<MealRecordItem[]>(listRes as any) ?? []
        : [];
      setMeals(mealList);

      const detailGroups = await Promise.all(
        mealList.map(async meal => {
          if (meal.mealId == null || meal.mealId === '') {
            return { mealId: '', list: [] as MealDetailItem[] };
          }
          try {
            const detailRes = await getMealDetailByMealId(String(meal.mealId));
            if (!isResourceApiOk(detailRes)) {
              return { mealId: String(meal.mealId), list: [] as MealDetailItem[] };
            }
            const detail = apiResourceData(detailRes as any);
            return { mealId: String(meal.mealId), list: detail?.mealDetailList ?? [] };
          } catch {
            return { mealId: String(meal.mealId), list: [] as MealDetailItem[] };
          }
        }),
      );
      const detailMap: Record<string, MealDetailItem[]> = {};
      detailGroups.forEach(group => {
        if (group.mealId) detailMap[group.mealId] = group.list;
      });
      setDetailsByMealId(detailMap);
      setFoodDetails(detailGroups.flatMap(group => group.list));
    } catch {
      setMeals([]);
      setFoodDetails([]);
      setDetailsByMealId({});
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
    () => meals.find(item => item.dietRuleSnapshot)?.dietRuleSnapshot,
    [meals],
  );

  const summary = useMemo(
    () => buildDayNutritionSummary(meals, foodDetails, snapshot),
    [meals, foodDetails, snapshot],
  );

  const mealSections = useMemo(
    () => buildMealSections(meals, detailsByMealId, snapshot, customerLocalDate),
    [customerLocalDate, detailsByMealId, meals, snapshot],
  );

  const waterTimeline = useMemo(() => buildWaterTimeline(foodDetails), [foodDetails]);

  if (loading) {
    return (
      <PageLayout>
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} contentStyle={styles.pageBody}>
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
                      navigation.navigate('MealRecordDetailPage', { mealDetailId: food.mealDetailId });
                    }}>
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
    </PageLayout>
  );
}
