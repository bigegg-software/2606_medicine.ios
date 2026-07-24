import type { MealDetailInfo, MealDetailItem } from '@/api/mealDetail';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';

const CATEGORY_LABELS: Record<number, string> = {
  1: '早餐',
  2: '午餐',
  3: '晚餐',
  4: '加餐',
};

export type MealRecordTotals = {
  calorie: number;
  protein: number;
  fat: number;
  carbs: number;
};

export function buildMealRecordTotals(info: MealDetailInfo | null): MealRecordTotals {
  const main = info?.mainInfo;
  if (main) {
    return {
      calorie: toNumber(main.calorie),
      protein: toNumber(main.protein),
      fat: toNumber(main.fat),
      carbs: toNumber(main.carbs),
    };
  }
  const list = info?.mealDetailList ?? [];
  return list.reduce<MealRecordTotals>(
    (acc, item) => ({
      calorie: acc.calorie + toNumber(item.calorie),
      protein: acc.protein + toNumber(item.protein),
      fat: acc.fat + toNumber(item.fat),
      carbs: acc.carbs + toNumber(item.carbs),
    }),
    { calorie: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export function getMealRecordCategoryLabel(list: MealDetailItem[] = []): string {
  const category = list.find(item => item.mealCategory != null)?.mealCategory;
  if (category == null) return '用餐';
  return CATEGORY_LABELS[Number(category)] ?? '用餐';
}

export function getMealRecordTime(info: MealDetailInfo | null): string {
  return info?.timeStr || info?.mealDetailList?.[0]?.timeStr || '--';
}
