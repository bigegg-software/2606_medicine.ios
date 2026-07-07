import moment from 'moment';
import type { MealDetailItem } from '@/api/mealDetail';
import type { MealAllRecordDayItem, MealAllRecordMonthGroup, MealRecordItem } from '@/api/meal';
import type { DietPatientRuleInfo } from '@/api/dietPatientRule';
import {
  calcNutritionPercent,
  calcNutritionProgress,
  getCalorieNutritionDisplay,
  getProteinNutritionDisplay,
  getWaterNutritionDisplay,
} from './dietRuleHelpers';
import {
  formatMealServingText,
  formatNutritionInteger,
  getWaterRecords,
  sumWaterIntake,
  toNumber,
} from './mealDetailHelpers';

export const MEAL_CATEGORY_LABELS: Record<number, string> = {
  1: '早餐',
  2: '午餐',
  3: '晚餐',
  4: '加餐',
};

export function normalizeComplianceRate(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.round(Number(value));
}

export function formatMealHistoryDate(date?: string) {
  const parsed = moment(date, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return date?.trim() || '--';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${parsed.format('YYYY/MM/DD')} ${weekdays[parsed.day()]}`;
}

export function formatMealHistoryDayLabel(date?: string) {
  const parsed = moment(date, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return date?.trim() || '--';
  if (parsed.isSame(moment(), 'day')) return '今天';
  if (parsed.isSame(moment().subtract(1, 'day'), 'day')) return '昨天';
  return parsed.format('M月D日');
}

export function formatMealHistoryMonthLabel(yyyyMM?: string) {
  if (!yyyyMM?.trim()) return '--';
  const parsed = moment(yyyyMM, ['YYYYMM', 'YYYY-MM'], true);
  return parsed.isValid() ? parsed.format('YYYY年M月') : yyyyMM;
}

export function getTrendDateRange(range: '7' | '30') {
  const endDate = moment().format('YYYY-MM-DD');
  const startDate = moment().subtract(range === '7' ? 6 : 29, 'day').format('YYYY-MM-DD');
  return { startDate, endDate };
}

export function flattenMealHistoryDays(groups: MealAllRecordMonthGroup[]) {
  return groups.flatMap(group =>
    (group.list ?? []).map(day => ({
      ...day,
      yyyyMM: group.yyyyMM,
    })),
  );
}

export function sumDayCalories(day?: MealAllRecordDayItem | null) {
  return (day?.mealList ?? []).reduce((sum, item) => sum + toNumber(item.calorie), 0);
}

export function sumDayProtein(day?: MealAllRecordDayItem | null) {
  return (day?.mealList ?? []).reduce((sum, item) => sum + toNumber(item.protein), 0);
}

export function sumDayWater(day?: MealAllRecordDayItem | null) {
  return (day?.mealList ?? []).reduce((sum, item) => sum + toNumber(item.waterIntake), 0);
}

export function getDayDietSnapshot(day?: MealAllRecordDayItem | null): DietPatientRuleInfo | undefined {
  return day?.mealList?.find(item => item.dietRuleSnapshot)?.dietRuleSnapshot;
}

export function getMealCategoryTargetCalories(
  snapshot: DietPatientRuleInfo | undefined,
  mealCategory: number,
  customerLocalDate?: string,
) {
  if (!snapshot?.mealList?.length) return undefined;
  const day = customerLocalDate
    ? moment(customerLocalDate, 'YYYY-MM-DD').isoWeekday()
    : moment().isoWeekday();
  const match = snapshot.mealList.find(
    item => item.day === day && item.mealCategory === mealCategory,
  );
  return match?.calories;
}

export type DayNutritionSummary = {
  calories: number;
  protein: number;
  water: number;
  targetCalories?: number;
  targetProtein?: number;
  targetWater?: number;
  caloriePercent: number;
  proteinPercent: number;
  waterPercent: number;
  calorieProgress: number;
  proteinProgress: number;
  waterProgress: number;
  calorieDisplay: ReturnType<typeof getCalorieNutritionDisplay>;
  proteinDisplay: ReturnType<typeof getProteinNutritionDisplay>;
  waterDisplay: ReturnType<typeof getWaterNutritionDisplay>;
};

export function buildDayNutritionSummary(
  meals: MealRecordItem[],
  foodDetails: MealDetailItem[],
  snapshot?: DietPatientRuleInfo,
): DayNutritionSummary {
  const calories = meals.reduce((sum, item) => sum + toNumber(item.calorie), 0);
  const protein = meals.reduce((sum, item) => sum + toNumber(item.protein), 0);
  const water = sumWaterIntake(foodDetails.length > 0 ? foodDetails : []);
  const targetCalories = snapshot?.targetCalories;
  const targetProtein = snapshot?.targetProtein;
  const targetWater = snapshot?.targetWater;
  const caloriePercent = calcNutritionPercent(calories, targetCalories);
  const proteinPercent = calcNutritionPercent(protein, targetProtein);
  const waterPercent = calcNutritionPercent(water, targetWater);

  return {
    calories,
    protein,
    water,
    targetCalories,
    targetProtein,
    targetWater,
    caloriePercent,
    proteinPercent,
    waterPercent,
    calorieProgress: calcNutritionProgress(calories, targetCalories),
    proteinProgress: calcNutritionProgress(protein, targetProtein),
    waterProgress: calcNutritionProgress(water, targetWater),
    calorieDisplay: getCalorieNutritionDisplay(caloriePercent),
    proteinDisplay: getProteinNutritionDisplay(proteinPercent),
    waterDisplay: getWaterNutritionDisplay(waterPercent),
  };
}

export type MealSectionItem = {
  key: string;
  mealId?: number | string;
  category: number;
  title: string;
  currentCalories: number;
  targetCalories?: number;
  foods: Array<{
    key: string;
    name: string;
    servingText: string;
    calories: number;
    ossUrl?: string;
    mealDetailId?: number;
  }>;
};

export function buildMealSections(
  meals: MealRecordItem[],
  detailsByMealId: Record<string, MealDetailItem[]>,
  snapshot?: DietPatientRuleInfo,
  customerLocalDate?: string,
): MealSectionItem[] {
  const categories = [1, 2, 3, 4];

  return categories
    .map(category => {
      const meal = meals.find(item => item.mealCategory === category);
      if (!meal) return null;

      const detailList = meal.mealId != null
        ? detailsByMealId[String(meal.mealId)] ?? []
        : [];
      const foods = detailList
        .filter(item => item.isWater !== 1)
        .map((item, index) => ({
          key: `${item.mealDetailId ?? index}`,
          name: item.mealName?.trim() || '食物',
          servingText: formatMealServingText(item),
          calories: Math.round(toNumber(item.calorie)),
          ossUrl: item.ossUrl,
          mealDetailId: item.mealDetailId,
        }));

      return {
        key: `${category}-${meal.mealId ?? category}`,
        mealId: meal.mealId,
        category,
        title: MEAL_CATEGORY_LABELS[category] ?? '用餐',
        currentCalories: Math.round(toNumber(meal.calorie)),
        targetCalories: getMealCategoryTargetCalories(snapshot, category, customerLocalDate),
        foods,
      };
    })
    .filter(Boolean) as MealSectionItem[];
}

export function buildWaterTimeline(foodDetails: MealDetailItem[]) {
  return getWaterRecords(foodDetails)
    .map((item, index) => ({
      key: `${item.mealDetailId ?? index}`,
      time: item.timeStr?.trim() || '--',
      amount: Math.round(toNumber(item.waterIntake)),
    }))
    .sort((left, right) => {
      const leftValue = moment(left.time, ['HH:mm', 'H:mm'], true);
      const rightValue = moment(right.time, ['HH:mm', 'H:mm'], true);
      if (!leftValue.isValid() || !rightValue.isValid()) return 0;
      return leftValue.valueOf() - rightValue.valueOf();
    });
}

export function formatDayListSubtitle(day: MealAllRecordDayItem) {
  const calories = sumDayCalories(day);
  const protein = sumDayProtein(day);
  const water = sumDayWater(day);
  const parts = [`${formatNutritionInteger(calories)}千卡`];
  if (protein > 0) parts.push(`蛋白${formatNutritionInteger(protein)}g`);
  if (water > 0) parts.push(`饮水${formatNutritionInteger(water)}ml`);
  return parts.join(' · ');
}
