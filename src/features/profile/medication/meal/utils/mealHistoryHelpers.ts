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
  NUTRITION_COLOR,
} from './dietRuleHelpers';
import {
  formatMealServingText,
  formatNutritionInteger,
  getWaterRecords,
  sumCarbs,
  sumFat,
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
  return Number(Number(value).toFixed(2));
}

/** 整数原样展示；有小数时最多保留两位 */
export function formatMealHistoryRate(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '0';
  const rounded = Math.round(Number(value) * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
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

export function formatMealHistoryDayTitle(date?: string) {
  const parsed = moment(date, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return date?.trim() || '--';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${formatMealHistoryDayLabel(date)} ${weekdays[parsed.day()]}`;
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

export function getPrescriptionPeriodDayCount(rule?: DietPatientRuleInfo | null) {
  const startDate = rule?.startDate?.trim();
  const endDate = rule?.endDate?.trim();
  if (!startDate || !endDate) return 0;

  const start = moment(startDate, 'YYYY-MM-DD', true);
  const end = moment(endDate, 'YYYY-MM-DD', true);
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return 0;

  return end.diff(start, 'days') + 1;
}

export function getPrescriptionDateRange(rule?: DietPatientRuleInfo | null) {
  const today = moment().format('YYYY-MM-DD');
  const startDate = rule?.startDate?.trim() || today;
  let endDate = rule?.endDate?.trim() || today;

  const todayMoment = moment(today, 'YYYY-MM-DD', true);
  const endMoment = moment(endDate, 'YYYY-MM-DD', true);
  const startMoment = moment(startDate, 'YYYY-MM-DD', true);

  if (endMoment.isValid() && endMoment.isAfter(todayMoment)) {
    endDate = today;
  }
  if (startMoment.isValid() && startMoment.isAfter(todayMoment)) {
    return { startDate: today, endDate: today };
  }
  if (startMoment.isValid() && endMoment.isValid() && endMoment.isBefore(startMoment)) {
    return { startDate, endDate: startDate };
  }

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
  carbs: number;
  fat: number;
  water: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetWater?: number;
  caloriePercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  waterPercent: number;
  calorieProgress: number;
  proteinProgress: number;
  carbsProgress: number;
  fatProgress: number;
  waterProgress: number;
  calorieDisplay: ReturnType<typeof getCalorieNutritionDisplay>;
  proteinDisplay: ReturnType<typeof getProteinNutritionDisplay>;
  carbsDisplay: ReturnType<typeof getProteinNutritionDisplay>;
  fatDisplay: ReturnType<typeof getProteinNutritionDisplay>;
  waterDisplay: ReturnType<typeof getWaterNutritionDisplay>;
};

export function buildDayNutritionSummary(
  meals: MealRecordItem[],
  foodDetails: MealDetailItem[],
  snapshot?: DietPatientRuleInfo,
): DayNutritionSummary {
  const calories = meals.reduce((sum, item) => sum + toNumber(item.calorie), 0);
  const protein = meals.reduce((sum, item) => sum + toNumber(item.protein), 0);
  const carbsFromMeals = meals.reduce((sum, item) => sum + toNumber(item.carbs), 0);
  const fatFromMeals = meals.reduce((sum, item) => sum + toNumber(item.fat), 0);
  const carbs = carbsFromMeals > 0 ? carbsFromMeals : sumCarbs(foodDetails);
  const fat = fatFromMeals > 0 ? fatFromMeals : sumFat(foodDetails);
  const water = sumWaterIntake(foodDetails.length > 0 ? foodDetails : []);
  const targetCalories = snapshot?.targetCalories;
  const targetProtein = snapshot?.targetProtein;
  const targetCarbs = snapshot?.targetCarbs;
  const targetFat = snapshot?.targetFat;
  const targetWater = snapshot?.targetWater;
  const caloriePercent = calcNutritionPercent(calories, targetCalories);
  const proteinPercent = calcNutritionPercent(protein, targetProtein);
  const carbsPercent = calcNutritionPercent(carbs, targetCarbs);
  const fatPercent = calcNutritionPercent(fat, targetFat);
  const waterPercent = calcNutritionPercent(water, targetWater);

  return {
    calories,
    protein,
    carbs,
    fat,
    water,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetWater,
    caloriePercent,
    proteinPercent,
    carbsPercent,
    fatPercent,
    waterPercent,
    calorieProgress: calcNutritionProgress(calories, targetCalories),
    proteinProgress: calcNutritionProgress(protein, targetProtein),
    carbsProgress: calcNutritionProgress(carbs, targetCarbs),
    fatProgress: calcNutritionProgress(fat, targetFat),
    waterProgress: calcNutritionProgress(water, targetWater),
    calorieDisplay: getCalorieNutritionDisplay(caloriePercent),
    proteinDisplay: getProteinNutritionDisplay(proteinPercent),
    carbsDisplay: getProteinNutritionDisplay(carbsPercent),
    fatDisplay: getProteinNutritionDisplay(fatPercent),
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

export function isCountableMealRecord(item: MealRecordItem) {
  const category = item.mealCategory;
  if (category === -1) return false;
  if (category != null && category >= 1 && category <= 4) return true;
  const hasFoodNutrition = toNumber(item.calorie) > 0 || toNumber(item.protein) > 0;
  return hasFoodNutrition;
}

export function getDayMealCount(day?: MealAllRecordDayItem | null) {
  return (day?.mealList ?? []).filter(isCountableMealRecord).length;
}

export type DayComplianceDisplay = {
  label: string;
  color: string;
};

export function getCalorieComplianceDisplay(percent: number | null | undefined): DayComplianceDisplay | null {
  if (percent == null || Number.isNaN(Number(percent))) return null;

  if (percent > 120) {
    return { label: '偏高', color: NUTRITION_COLOR.red };
  }
  if (percent > 110) {
    return { label: '偏高', color: NUTRITION_COLOR.orange };
  }
  if (percent >= 90) {
    return { label: '达标', color: NUTRITION_COLOR.green };
  }
  if (percent >= 80) {
    return { label: '偏低', color: NUTRITION_COLOR.orange };
  }
  return { label: '明显不足', color: NUTRITION_COLOR.red };
}

export function getDayComplianceDisplay(day?: MealAllRecordDayItem | null): DayComplianceDisplay | null {
  const snapshot = getDayDietSnapshot(day);
  if (!day || !snapshot?.targetCalories || snapshot.targetCalories <= 0) return null;

  const calories = sumDayCalories(day);
  return getCalorieComplianceDisplay(calcNutritionPercent(calories, snapshot.targetCalories));
}

export function formatDayListSubtitle(day: MealAllRecordDayItem) {
  const mealCount = getDayMealCount(day);
  const calories = sumDayCalories(day);
  return `${mealCount}餐 · ${formatNutritionInteger(calories)}千卡`;
}
