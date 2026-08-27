import type { ImageSourcePropType } from 'react-native';
import moment from 'moment';
import type { DietMealItem, DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getInUseDietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  FAMILY_MEAL_NUTRITION_ITEMS,
  type FamilyMealNutritionItem,
  type FamilyMealStatusKey,
} from './familyDataHelpers';
import {
  calcNutritionPercent,
  calcNutritionProgress,
  getCalorieNutritionDisplay,
  getDietRuleSummary,
  getProteinNutritionDisplay,
} from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  formatNutritionInteger,
  getFoodRecordsByCategory,
  sumCalories,
  sumCarbs,
  sumFat,
  sumProtein,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';

type FamilyMealKey = 'breakfast' | 'lunch' | 'dinner';

const FAMILY_MEAL_META: Record<
  FamilyMealKey,
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

const FAMILY_FOOD_DISPLAY_MAX_CHARS = 8;

export type FamilyMealFoodDisplaySplit = {
  visible: string[];
  hasMore: boolean;
  truncateLast: boolean;
};

export type FamilyMealMetricItem = {
  key: 'calorie' | 'protein' | 'carbs';
  title: string;
  currentText: string;
  targetText: string;
  progress: number;
  color: string;
};

export type FamilyMealSectionView = {
  hasDietRule: boolean;
  metrics: FamilyMealMetricItem[];
  mealTitle: string;
  mealIcon: ImageSourcePropType;
  hasLoggedCurrentMeal: boolean;
  foodDisplay: FamilyMealFoodDisplaySplit;
  tipText: string;
};

/** 03:00-11:00 早餐；11:00-16:00 午餐；16:00-02:00 晚餐 */
function getCurrentMealKey(date = new Date()): FamilyMealKey {
  const hour = date.getHours();
  if (hour >= 3 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  return 'dinner';
}

function parseFoodNames(foods?: string | string[]): string[] {
  if (Array.isArray(foods)) {
    return foods.map(item => String(item).trim()).filter(Boolean);
  }
  if (!foods?.trim()) return [];
  return foods
    .split(/[,，、]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function splitFoodsForDisplay(
  foods: string[],
  maxChars = FAMILY_FOOD_DISPLAY_MAX_CHARS,
): FamilyMealFoodDisplaySplit {
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

function emptyMetrics(): FamilyMealMetricItem[] {
  return [
    {
      key: 'calorie',
      title: '热量(千卡)',
      currentText: '--',
      targetText: '--',
      progress: 0,
      color: '#6D925E',
    },
    {
      key: 'protein',
      title: '蛋白(克)',
      currentText: '--',
      targetText: '--',
      progress: 0,
      color: '#0951AE',
    },
    {
      key: 'carbs',
      title: '碳水(克)',
      currentText: '--',
      targetText: '--',
      progress: 0,
      color: '#EE9C44',
    },
  ];
}

export function emptyFamilyMealSectionView(): FamilyMealSectionView {
  const mealMeta = FAMILY_MEAL_META[getCurrentMealKey()];
  return {
    hasDietRule: false,
    metrics: emptyMetrics(),
    mealTitle: mealMeta.title,
    mealIcon: mealMeta.icon,
    hasLoggedCurrentMeal: false,
    foodDisplay: { visible: [], hasMore: false, truncateLast: false },
    tipText: '建议热量--千卡',
  };
}

function buildFamilyMealSectionView(
  rule: DietPatientRuleInfo | null,
  meals: MealDetailItem[],
): FamilyMealSectionView {
  const summary = getDietRuleSummary(rule);
  const todayCalories = sumCalories(meals);
  const todayProtein = sumProtein(meals);
  const todayCarbs = sumCarbs(meals);

  const mealKey = getCurrentMealKey();
  const mealMeta = FAMILY_MEAL_META[mealKey];
  const currentMealRecords = getFoodRecordsByCategory(meals, mealKey);
  const suggestedMeal = getSuggestedMealItem(rule?.mealList, mealMeta.category);
  const hasLoggedCurrentMeal = currentMealRecords.length > 0;
  const displayFoods = hasLoggedCurrentMeal
    ? currentMealRecords.map(item => item.mealName || '--').filter(Boolean)
    : parseFoodNames(suggestedMeal?.foods);
  const displayCalories = hasLoggedCurrentMeal
    ? sumMealCalories(currentMealRecords)
    : Number(suggestedMeal?.calories ?? 0);

  return {
    hasDietRule: Boolean(rule),
    metrics: [
      {
        key: 'calorie',
        title: '热量(千卡)',
        currentText: formatNutritionInteger(todayCalories),
        targetText: summary.targetCalories != null
          ? String(summary.targetCalories)
          : '--',
        progress: calcNutritionProgress(todayCalories, summary.targetCalories),
        color: '#6D925E',
      },
      {
        key: 'protein',
        title: '蛋白(克)',
        currentText: formatNutritionInteger(todayProtein),
        targetText: summary.targetProtein != null
          ? String(summary.targetProtein)
          : '--',
        progress: calcNutritionProgress(todayProtein, summary.targetProtein),
        color: '#0951AE',
      },
      {
        key: 'carbs',
        title: '碳水(克)',
        currentText: formatNutritionInteger(todayCarbs),
        targetText: summary.targetCarbs != null
          ? String(summary.targetCarbs)
          : '--',
        progress: calcNutritionProgress(todayCarbs, summary.targetCarbs),
        color: '#EE9C44',
      },
    ],
    mealTitle: mealMeta.title,
    mealIcon: mealMeta.icon,
    hasLoggedCurrentMeal,
    foodDisplay: splitFoodsForDisplay(displayFoods),
    tipText: hasLoggedCurrentMeal
      ? `本餐热量${formatNutritionInteger(displayCalories)}千卡`
      : `建议热量${formatNutritionInteger(displayCalories)}千卡`,
  };
}

/** 拉取指定家人今日用餐营养区块（对齐首页营养处方） */
export async function loadFamilyMealSectionView(
  patientUserId: string,
): Promise<FamilyMealSectionView> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyMealSectionView();

  try {
    const [ruleRes, mealRes] = await Promise.all([
      getInUseDietPatientRuleInfo({ patientUserId: id }),
      getTodayMealDetailList({ patientUserId: id }),
    ]);

    const rule = isResourceApiOk(ruleRes as { code?: number })
      ? (apiResourceData<DietPatientRuleInfo>(
        ruleRes as unknown as { code?: number; data?: DietPatientRuleInfo },
      ) ?? null)
      : null;
    const mealsRaw = isResourceApiOk(mealRes as { code?: number })
      ? apiResourceData<MealDetailItem[]>(
        mealRes as unknown as { code?: number; data?: MealDetailItem[] },
      )
      : null;
    const list = Array.isArray(mealsRaw) ? mealsRaw : [];
    return buildFamilyMealSectionView(rule, list);
  } catch {
    return emptyFamilyMealSectionView();
  }
}

function toFamilyMealStatus(label: string): FamilyMealStatusKey {
  if (label === '达标') return '达标';
  if (label === '基本达标') return '基本达标';
  if (label === '偏低') return '偏低';
  if (label === '偏高') return '偏高';
  if (label === '未达标') return '未达标';
  if (label === '明显不足') return '明显不足';
  return '明显不足';
}

function emptyMealItem(base: FamilyMealNutritionItem): FamilyMealNutritionItem {
  return {
    ...base,
    currentValue: '--',
    targetValue: base.key === 'calorie' ? '--千卡' : '--克',
    progress: 0,
    status: '明显不足',
  };
}

/** 家人首页重点关注：旧四宫格热量进度（仍被 familyHomeHelpers 使用） */
export function emptyFamilyMealNutritionItems(): FamilyMealNutritionItem[] {
  return FAMILY_MEAL_NUTRITION_ITEMS.map(emptyMealItem);
}

export async function loadFamilyMealNutritionItems(
  patientUserId: string,
): Promise<FamilyMealNutritionItem[]> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyMealNutritionItems();

  try {
    const [ruleRes, mealRes] = await Promise.all([
      getInUseDietPatientRuleInfo({ patientUserId: id }),
      getTodayMealDetailList({ patientUserId: id }),
    ]);

    const rule = isResourceApiOk(ruleRes as { code?: number })
      ? (apiResourceData<DietPatientRuleInfo>(
        ruleRes as unknown as { code?: number; data?: DietPatientRuleInfo },
      ) ?? null)
      : null;
    const mealsRaw = isResourceApiOk(mealRes as { code?: number })
      ? apiResourceData<MealDetailItem[]>(
        mealRes as unknown as { code?: number; data?: MealDetailItem[] },
      )
      : null;
    const list = Array.isArray(mealsRaw) ? mealsRaw : [];

    const currentCalories = sumCalories(list);
    const currentProtein = sumProtein(list);
    const currentCarbs = sumCarbs(list);
    const currentFat = sumFat(list);

    const targetCalories = rule?.targetCalories;
    const targetProtein = rule?.targetProtein;
    const targetCarbs = rule?.targetCarbs;
    const targetFat = rule?.targetFat;

    const caloriePercent = calcNutritionPercent(currentCalories, targetCalories);
    const proteinPercent = calcNutritionPercent(currentProtein, targetProtein);
    const carbsPercent = calcNutritionPercent(currentCarbs, targetCarbs);
    const fatPercent = calcNutritionPercent(currentFat, targetFat);

    const byKey: Record<
      string,
      Omit<FamilyMealNutritionItem, 'key' | 'title' | 'titleColor' | 'progressColor' | 'icon'>
    > = {
      calorie: {
        currentValue: formatNutritionInteger(currentCalories),
        targetValue: targetCalories != null
          ? `${formatNutritionInteger(targetCalories)}千卡`
          : '--千卡',
        progress: calcNutritionProgress(currentCalories, targetCalories),
        status: toFamilyMealStatus(getCalorieNutritionDisplay(caloriePercent).label),
      },
      protein: {
        currentValue: formatNutritionInteger(currentProtein),
        targetValue: targetProtein != null
          ? `${formatNutritionInteger(targetProtein)}克`
          : '--克',
        progress: calcNutritionProgress(currentProtein, targetProtein),
        status: toFamilyMealStatus(getProteinNutritionDisplay(proteinPercent).label),
      },
      carbs: {
        currentValue: formatNutritionInteger(currentCarbs),
        targetValue: targetCarbs != null
          ? `${formatNutritionInteger(targetCarbs)}克`
          : '--克',
        progress: calcNutritionProgress(currentCarbs, targetCarbs),
        status: toFamilyMealStatus(getProteinNutritionDisplay(carbsPercent).label),
      },
      fat: {
        currentValue: formatNutritionInteger(currentFat),
        targetValue: targetFat != null
          ? `${formatNutritionInteger(targetFat)}克`
          : '--克',
        progress: calcNutritionProgress(currentFat, targetFat),
        status: toFamilyMealStatus(getProteinNutritionDisplay(fatPercent).label),
      },
    };

    return FAMILY_MEAL_NUTRITION_ITEMS.map(item => ({
      ...item,
      ...(byKey[item.key] ?? emptyMealItem(item)),
    }));
  } catch {
    return emptyFamilyMealNutritionItems();
  }
}
