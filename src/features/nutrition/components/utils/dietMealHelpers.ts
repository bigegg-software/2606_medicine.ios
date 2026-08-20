import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import type { DietMealFoodItem, DietMealItem, DietPatientRuleInfo } from '@/api/dietPatientRule';
import type { MealDetailItem } from '@/api/mealDetail';
import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser, UserExtr } from '@/api/user';
import { parseFoods } from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  formatMealServingText,
  toNumber,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { maskFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';

export type RecommendedFoodItem = {
  key: string;
  foodName: string;
  proteinText: string;
  carbsText: string;
  fatText: string;
  amountText: string;
  caloriesText: string;
};

export type RecommendedMealSection = {
  key: string;
  category: number;
  title: string;
  icon: ImageSourcePropType;
  planCalories: number;
  planCaloriesText: string;
  foods: RecommendedFoodItem[];
};

/** 选中日期是否在营养处方起止范围内（开始前 / 结束后视为无处方） */
export function isDietRuleActiveOnDate(
  rule: DietPatientRuleInfo | null | undefined,
  customerLocalDate: string,
) {
  if (!rule) return false;
  const day = moment(customerLocalDate, 'YYYY-MM-DD', true);
  if (!day.isValid()) return false;

  const start = rule.startDate?.trim();
  if (start) {
    const startDay = moment(start, ['YYYY-MM-DD', 'YYYY/MM/DD', moment.ISO_8601], true);
    if (startDay.isValid() && day.isBefore(startDay, 'day')) return false;
  }

  const end = rule.endDate?.trim();
  if (end) {
    const endDay = moment(end, ['YYYY-MM-DD', 'YYYY/MM/DD', moment.ISO_8601], true);
    if (endDay.isValid() && day.isAfter(endDay, 'day')) return false;
  }

  return true;
}

const MEAL_SECTION_META: Record<number, { title: string; icon: ImageSourcePropType }> = {
  1: {
    title: '早餐',
    icon: require('@/assets/images/schedule/zc.png'),
  },
  2: {
    title: '午餐',
    icon: require('@/assets/images/schedule/wwc.png'),
  },
  3: {
    title: '晚餐',
    icon: require('@/assets/images/schedule/ws.png'),
  },
  4: {
    title: '加餐',
    icon: require('@/assets/images/medication/icon.png'),
  },
};

function toFiniteNumber(value?: number | null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatMacroGrams(value?: number | null) {
  const num = toFiniteNumber(value);
  if (num <= 0) return '0';
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10);
}

function formatAmount(amount?: number | null, unit?: string | null) {
  const num = toFiniteNumber(amount);
  const unitText = unit?.trim() || 'g';
  if (num <= 0) return '--';
  const amountText = Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10);
  return `${amountText}${unitText}`;
}

function formatCalories(value?: number | null) {
  const num = Math.round(toFiniteNumber(value));
  return num > 0 ? `${num} kcal` : '-- kcal';
}

function formatPlanCalories(value?: number | null) {
  const num = Math.round(toFiniteNumber(value));
  return num > 0 ? `计划${num} kcal` : '计划-- kcal';
}

function mapFoodItem(food: DietMealFoodItem, index: number): RecommendedFoodItem {
  return {
    key: `food-${index}-${food.foodName ?? ''}`,
    foodName: food.foodName?.trim() || '--',
    proteinText: `蛋 ${formatMacroGrams(food.protein)}g`,
    carbsText: `碳 ${formatMacroGrams(food.carbs)}g`,
    fatText: `脂 ${formatMacroGrams(food.fat)}g`,
    amountText: formatAmount(food.amount, food.unit),
    caloriesText: formatCalories(food.calories),
  };
}

function buildFoodsFromMeal(meal: DietMealItem): RecommendedFoodItem[] {
  const list = meal.foodList ?? [];
  if (list.length) {
    return list.map(mapFoodItem);
  }

  const names = parseFoods(meal.foods);
  if (!names.length) return [];

  return names.map((name, index) => ({
    key: `food-name-${index}-${name}`,
    foodName: name,
    proteinText: `蛋 ${formatMacroGrams(meal.protein)}g`,
    carbsText: `碳 ${formatMacroGrams(meal.carbs)}g`,
    fatText: `脂 ${formatMacroGrams(meal.fat)}g`,
    amountText: '--',
    caloriesText: formatCalories(meal.calories),
  }));
}

/** 用新生成的某一天餐次替换 mealList 中对应星期的项 */
export function mergeOneDayMeals(
  mealList: DietMealItem[] | undefined,
  day: number,
  nextDayMeals: DietMealItem[],
): DietMealItem[] {
  const others = (mealList ?? []).filter(item => Number(item.day) !== day);
  return [...others, ...nextDayMeals];
}

/** 按选中日期（周一=1…周日=7）筛选推荐餐次 */
export function buildRecommendedMealSections(
  mealList: DietMealItem[] | undefined,
  date: string,
): RecommendedMealSection[] {
  const weekday = moment(date).isoWeekday();

  return (mealList ?? [])
    .filter(item => {
      if (item.mealCategory == null || String(item.mealCategory).trim() === '') return false;
      const day = Number(item.day);
      if (!Number.isFinite(day) || day <= 0) return true;
      return day === weekday;
    })
    .sort((a, b) => Number(a.mealCategory) - Number(b.mealCategory))
    .map((item, index) => {
      const category = Number(item.mealCategory);
      const meta = MEAL_SECTION_META[category] ?? MEAL_SECTION_META[1];
      const planCalories = Math.round(toFiniteNumber(item.calories));
      return {
        key: `${meta.title}-${category}-${index}`,
        category,
        title: meta.title,
        icon: meta.icon,
        planCalories,
        planCaloriesText: formatPlanCalories(item.calories),
        foods: buildFoodsFromMeal(item),
      };
    });
}

/** 实际摄入列表：`100g · 116 kcal` */
export function formatActualFoodMeta(item: MealDetailItem): string {
  const weight = Math.round(toNumber(item.weight));
  const servingText = formatMealServingText(item);
  const amountText = weight > 0
    ? `${weight}g`
    : (servingText !== '--' ? servingText.split(/\s+/)[0] : '--');
  const calories = Math.round(toNumber(item.calorie));
  return `${amountText} · ${calories} kcal`;
}

export function formatDietHeaderInfo(
  rule: DietPatientRuleInfo | null,
  user?: UserBaseInfo | null,
  systemUser?: SystemUser | null,
  userExtr?: UserExtr | null,
  options?: {
    /** 家人只读：优先展示该姓名，不回落登录人 */
    forceDisplayName?: string | null;
    /** 家人只读：用家人资料算年龄性别 */
    forceUser?: UserBaseInfo | null;
  },
) {
  const base = rule?.patientUserBaseInfo;
  const forceName = options?.forceDisplayName?.trim() || '';
  const profile = options?.forceUser ?? (options ? null : user);
  const isFamilyView = options != null;
  const rawName =
    rule?.patientUserName?.trim()
    || base?.name?.trim()
    || forceName
    || options?.forceUser?.name?.trim()
    || (!isFamilyView ? getDisplayUserName(user, systemUser) : '')
    || forceName
    || '';
  const name = isFamilyView
    ? (maskFamilyDisplayName(rawName) || forceName || '--')
    : (rawName || '--');

  let age = '';
  if (base?.age != null && Number(base.age) > 0) {
    age = `${base.age}岁`;
  } else {
    const birthMoment = moment(
      profile?.birthDate ?? base?.birthDate,
      ['YYYY-MM-DD', 'YYYYMMDD'],
      true,
    );
    if (birthMoment.isValid()) {
      age = `${moment().diff(birthMoment, 'years')}岁`;
    }
  }

  const gender = base?.gender?.trim() || profile?.gender?.trim() || '';
  const diagnosis = rule?.diagnosticLabel?.trim()
    || rule?.diagnosis?.trim()
    || base?.diagnosticLabel?.trim()
    || base?.primaryDiagnosis?.trim()
    || '';

  const weightGoal = Number(userExtr?.weightGoals);
  const goalText =
    Number.isFinite(weightGoal) && weightGoal > 0 ? `目标${weightGoal}kg` : '';

  const version = rule?.version != null && Number(rule.version) > 0
    ? `处方V${rule.version}`
    : '';

  const infoText = [age, gender, diagnosis, goalText].filter(Boolean).join(' | ') || '--';

  return { name: name || '--', version, infoText };
}
