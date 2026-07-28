import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
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
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import type { MealRecordItem } from '@/api/meal';
import type { MealDetailItem } from '@/api/mealDetail';
import styles from '@/css/medication/mealHistory';
import {
  buildDayNutritionSummary,
  buildMealSections,
  buildWaterTimeline,
} from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import { formatNutritionInteger } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import { loadMealDayDetailPayload } from '@/src/features/profile/medication/meal/utils/mealDayDetailHelpers';
import {
  buildNutritionGoalItems,
  getMealSectionIcon,
  getNutritionGoalStatusStyle,
  type NutritionGoalItemView,
} from '@/src/features/nutrition/utils/mealDayDetailPageHelpers';
import type { MealSectionItem } from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';

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

function NutritionGoalItem({ item }: { item: NutritionGoalItemView }) {
  const statusStyle = getNutritionGoalStatusStyle(item.display.label);
  return (
    <View style={styles.nutritionGoalItem}>
      <Flex align="center" justify="between">
        <Flex align="center" style={{ flexShrink: 1 }}>
          <Image source={item.icon} style={styles.nutritionGoalIcon} />
          <Text style={[styles.nutritionGoalItemTitle, { color: item.color }]} numberOfLines={1}>
            {item.title}
          </Text>
        </Flex>
        <View
          style={[
            styles.nutritionGoalStatusTag,
            {
              backgroundColor: statusStyle.backgroundColor,
              borderColor: statusStyle.borderColor,
            },
          ]}
        >
          <Text style={[styles.nutritionGoalStatus, { color: statusStyle.color }]} numberOfLines={1}>
            {item.display.label}
          </Text>
        </View>
      </Flex>

      <Flex align="end" style={styles.nutritionGoalValueRow}>
        <Text style={styles.nutritionGoalValue}>{item.valueText}</Text>
        <Text style={styles.nutritionGoalTarget}>/{item.targetText}</Text>
        <Text style={styles.nutritionGoalUnit}>{item.unit}</Text>
      </Flex>

      <View style={styles.nutritionGoalBarTrack}>
        <View
          style={[
            styles.nutritionGoalBarFill,
            { width: `${Math.min(100, Math.max(0, item.progress))}%`, backgroundColor: item.color },
          ]}
        />
      </View>
    </View>
  );
}

function MealDetailSection({
  section,
  isFirst,
  onPressFood,
}: {
  section: MealSectionItem;
  isFirst: boolean;
  onPressFood: (mealDetailId: number) => void;
}) {
  return (
    <View style={[styles.mealDetailCard, isFirst ? styles.mealDetailCardFirst : null]}>
      <Flex align="center">
        <Image source={getMealSectionIcon(section.category)} style={styles.mealDetailHeaderIcon} />
        <Text style={styles.mealDetailHeaderTitle}>{section.title}</Text>
        <Text style={styles.mealDetailHeaderValue}>{section.currentCalories}</Text>
        <Text style={styles.mealDetailHeaderTarget}>
          /{section.targetCalories != null ? section.targetCalories : '--'}
        </Text>
        <Text style={styles.mealDetailHeaderUnit}>千卡</Text>
      </Flex>

      {section.foods.length === 0 ? (
        <Text style={[styles.daySubtitle, { marginTop: 20 }]}>暂无食物明细</Text>
      ) : (
        <View>
          {section.foods.map(food => (
            <TouchableOpacity
              key={food.key}
              style={styles.mealDetailFoodRow}
              activeOpacity={food.mealDetailId ? 0.7 : 1}
              onPress={() => {
                if (!food.mealDetailId) return;
                onPressFood(food.mealDetailId);
              }}
            >
              {food.ossUrl ? (
                <Image source={{ uri: food.ossUrl }} style={styles.mealDetailFoodImage} />
              ) : (
                <Image
                  source={require('@/assets/images/medication/default2.png')}
                  style={styles.mealDetailFoodImage}
                />
              )}
              <View style={styles.mealDetailFoodInfo}>
                <Text style={styles.mealDetailFoodName} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={styles.mealDetailFoodServing} numberOfLines={1}>
                  {food.servingText}
                </Text>
              </View>
              <Flex align="center">
                <Text style={styles.mealDetailFoodCalorie}>{food.calories}千卡</Text>
                <Image
                  source={require('@/assets/images/nutrition/icon_right.png')}
                  style={styles.mealDetailFoodArrow}
                />
              </Flex>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
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

  const nutritionGoals = useMemo(() => buildNutritionGoalItems(summary), [summary]);

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
    <PageLayout style={styles.container}  contentStyle={styles.pageBody}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.body, { paddingHorizontal: 0 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.nutritionGoalCard}>
            <Text style={styles.nutritionGoalTitle}>营养目标</Text>
            <View style={styles.nutritionGoalGrid}>
              {nutritionGoals.map(item => (
                <NutritionGoalItem key={item.key} item={item} />
              ))}
            </View>
          </View>

          <ImageBackground
            source={require('@/assets/images/schedule/calendarBack.png')}
            style={styles.backImage1}
          >
            <Flex align="center" style={{ flex: 1, paddingHorizontal: 27 }}>
              <Text style={styles.backImage1Text}>用餐详情</Text>
            </Flex>
          </ImageBackground>

          {mealSections.length === 0 ? (
            <View style={[styles.mealDetailCard, styles.mealDetailCardFirst, { paddingVertical: 24 }]}>
              <Text style={styles.daySubtitle}>暂无用餐记录</Text>
            </View>
          ) : (
            mealSections.map((section, index) => (
              <MealDetailSection
                key={section.key}
                section={section}
                isFirst={index === 0}
                onPressFood={mealDetailId => {
                  navigation.navigate('MealRecordDetailPage', { mealDetailId });
                }}
              />
            ))
          )}

          {waterTimeline.length > 0 ? (
            <View style={[styles.mealDetailCard, mealSections.length === 0 ? styles.mealDetailCardFirst : null]}>
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
