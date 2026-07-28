import type { MealDetailInfo, MealDetailItem } from '@/api/mealDetail';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
  FOOD_UNIT,
  isGramUnit,
  resolveFoodUnitValue,
} from '@/src/features/profile/medication/meal/utils/foodUnitHelpers';

export function pickMealRecordDetailItem(
  info: MealDetailInfo | null,
  mealDetailId: number,
): MealDetailItem | null {
  if (!info?.mealDetailList?.length) return null;
  const matched = info.mealDetailList.find(
    item => item.mealDetailId != null && Number(item.mealDetailId) === Number(mealDetailId),
  );
  return matched ?? info.mealDetailList[0] ?? null;
}

export function resolveMealRecordFoodImageUrl(
  info: MealDetailInfo | null,
  item: MealDetailItem | null,
): string | undefined {
  const fromItem = item?.ossUrl?.trim();
  if (fromItem) return fromItem;
  const fromInfo = info?.ossUrl?.trim();
  return fromInfo || undefined;
}

export function buildMealRecordFoodMeta(item: MealDetailItem): string {
  const amount = toNumber(item.servingAmount ?? 1) || 1;
  const unitValue = resolveFoodUnitValue(item.servingUnit, item.unit);
  const weight = toNumber(item.weight);

  if (isGramUnit(unitValue)) {
    return `${Math.round(amount)}克`;
  }
  if (weight > 0) {
    return `${amount}${unitValue}·约${weight}${FOOD_UNIT.gram}`;
  }
  return `${amount}${unitValue}`;
}
