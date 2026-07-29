import type { FoodIdentifyItem } from '@/api/mealRecognition';
import type { FoodUnitValue } from '@/src/features/profile/medication/meal/utils/foodUnitHelpers';
import { isGramUnit } from '@/src/features/profile/medication/meal/utils/foodUnitHelpers';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';

export type FoodServingBaseline = {
  item: FoodIdentifyItem;
  amount: number;
  unitValue: FoodUnitValue;
};

function scaleNutrient(raw: number | string | undefined | null, ratio: number): number {
  const n = toNumber(raw);
  if (!Number.isFinite(n) || n === 0) return 0;
  return parseFloat((n * ratio).toFixed(2));
}

function scaleOthersNutrition(
  source: Record<string, unknown> | undefined,
  ratio: number,
): Record<string, unknown> | undefined {
  if (!source) return source;
  const next: Record<string, unknown> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))) {
      next[key] = scaleNutrient(value as number | string, ratio);
      return;
    }
    next[key] = value;
  });
  return next;
}

/** 当前分量对应的克重基准 */
export function resolveServingWeightGrams(
  item: FoodIdentifyItem,
  amount: number,
  unitValue: FoodUnitValue,
): number {
  if (isGramUnit(unitValue)) {
    return amount > 0 ? amount : 0;
  }
  const weight = toNumber(item.weight);
  return weight > 0 ? weight : 0;
}

/** 计算分量变化后的营养缩放比（优先按克重，其次同单位份数） */
export function resolveServingScaleRatio(
  baseline: FoodServingBaseline,
  nextAmount: number,
  nextUnit: FoodUnitValue,
): number {
  const baseAmount = baseline.amount > 0 ? baseline.amount : 0;
  const baseWeight = resolveServingWeightGrams(baseline.item, baseline.amount, baseline.unitValue);

  let nextWeight = 0;
  if (isGramUnit(nextUnit)) {
    nextWeight = nextAmount > 0 ? nextAmount : 0;
  } else if (baseAmount > 0 && baseWeight > 0) {
    // 非克单位：按「每份克重 × 新份数」
    nextWeight = (baseWeight / baseAmount) * nextAmount;
  }

  if (baseWeight > 0 && nextWeight > 0) {
    return nextWeight / baseWeight;
  }
  if (baseAmount > 0 && baseline.unitValue === nextUnit) {
    return nextAmount / baseAmount;
  }
  if (baseAmount > 0) {
    return nextAmount / baseAmount;
  }
  return 1;
}

/** 按基准分量缩放营养素，得到当前分量下的食物数据 */
export function scaleFoodItemByServing(
  baseline: FoodServingBaseline,
  nextAmount: number,
  nextUnit: FoodUnitValue,
): FoodIdentifyItem {
  const ratio = resolveServingScaleRatio(baseline, nextAmount, nextUnit);
  const base = baseline.item;
  const baseWeight = resolveServingWeightGrams(base, baseline.amount, baseline.unitValue);
  const nextWeight = isGramUnit(nextUnit)
    ? nextAmount
    : baseline.amount > 0 && baseWeight > 0
      ? parseFloat(((baseWeight / baseline.amount) * nextAmount).toFixed(1))
      : toNumber(base.weight);

  return {
    ...base,
    amount: nextAmount,
    unit: nextUnit,
    servingUnit: nextUnit,
    weight: nextWeight,
    calorie: scaleNutrient(base.calorie, ratio),
    protein: scaleNutrient(base.protein, ratio),
    fat: scaleNutrient(base.fat, ratio),
    carbs: scaleNutrient(base.carbs, ratio),
    fiber: scaleNutrient(base.fiber, ratio),
    othersNutrition: scaleOthersNutrition(base.othersNutrition, ratio),
  };
}

/** 切换单位时尽量保持实际克重对应的分量 */
export function resolveAmountAfterUnitChange(
  baseline: FoodServingBaseline,
  currentAmount: number,
  currentUnit: FoodUnitValue,
  nextUnit: FoodUnitValue,
  limits: { min: number; max: number },
): number {
  if (currentUnit === nextUnit) {
    return Math.max(limits.min, Math.min(currentAmount || limits.min, limits.max));
  }

  const currentWeight = resolveServingWeightGrams(baseline.item, currentAmount, currentUnit)
    || resolveServingWeightGrams(baseline.item, baseline.amount, baseline.unitValue);

  if (isGramUnit(nextUnit)) {
    const grams = currentWeight > 0 ? currentWeight : currentAmount;
    return Math.max(limits.min, Math.min(Math.round(grams) || limits.min, limits.max));
  }

  // 克 -> 份：用基准份的克重反推份数
  const baseWeight = resolveServingWeightGrams(baseline.item, baseline.amount, baseline.unitValue);
  const weightPerPortion =
    !isGramUnit(baseline.unitValue) && baseline.amount > 0 && baseWeight > 0
      ? baseWeight / baseline.amount
      : 0;
  const portions =
    weightPerPortion > 0
      ? (isGramUnit(currentUnit) ? currentAmount : currentWeight) / weightPerPortion
      : baseline.amount || 1;
  return Math.max(
    limits.min,
    Math.min(parseFloat(portions.toFixed(1)) || limits.min, limits.max),
  );
}
