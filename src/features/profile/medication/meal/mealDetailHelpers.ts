import type { MealDetailItem, MealDetailInfo, MealDetailMainInfo } from '@/api/mealDetail';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import { calcNutritionProgress } from './dietRuleHelpers';
import { FOOD_UNIT, isGramUnit, resolveFoodUnitValue } from './foodUnitHelpers';

export const MEAL_CATEGORY_BY_KEY: Record<string, number> = {
    breakfast: 1,
    lunch: 2,
    dinner: 3,
    snack: 4,
};

export function isWaterRecord(item: MealDetailItem): boolean {
    return item.isWater === 1;
}

export function getWaterRecords(list: MealDetailItem[]): MealDetailItem[] {
    return list.filter(isWaterRecord);
}

export function toNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

export function formatNutritionNumber(value: unknown): string {
    return toNumber(value).toFixed(2);
}

export function formatNutritionInteger(value: unknown): string {
    return String(Math.round(toNumber(value)));
}

export function getMealNotePlaceholder(date = new Date()): string {
    const hour = date.getHours();

    if (hour >= 6 && hour < 10) {
        return '记早餐';
    }
    if (hour >= 10 && hour < 11) {
        return '记加餐';
    }
    if (hour >= 11 && hour < 14) {
        return '记午餐';
    }
    if (hour >= 14 && hour < 17) {
        return '记加餐';
    }
    if (hour >= 17 && hour < 20) {
        return '记晚餐';
    }
    return '记加餐';
}

export function sumWaterIntake(list: MealDetailItem[]): number {
    return getWaterRecords(list).reduce((sum, item) => sum + toNumber(item.waterIntake), 0);
}

export function getWaterSummary(currentMl: number, targetMl?: number) {
    const target = targetMl ?? 0;
    const percent = calcNutritionProgress(currentMl, target);
    const remaining = Math.max(0, target - currentMl);
    return { currentMl, targetMl: target, percent, remainingMl: remaining };
}

export function getFoodRecordsByCategory(list: MealDetailItem[], mealKey: string): MealDetailItem[] {
    const category = MEAL_CATEGORY_BY_KEY[mealKey];
    if (category == null) return [];
    return list.filter(item => !isWaterRecord(item) && item.mealCategory === category);
}

export function sumCalories(list: MealDetailItem[]): number {
    return list
        .filter(item => !isWaterRecord(item))
        .reduce((sum, item) => sum + toNumber(item.calorie), 0);
}

export function sumProtein(list: MealDetailItem[]): number {
    return list
        .filter(item => !isWaterRecord(item))
        .reduce((sum, item) => sum + toNumber(item.protein), 0);
}


export function formatServingAmount(value: unknown): string {
    const num = toNumber(value);
    if (Number.isInteger(num)) {
        return String(num);
    }
    return String(parseFloat(num.toFixed(4)));
}

export function formatMealServingText(item: MealDetailItem): string {
    const parts: string[] = [];
    if (item.servingAmount != null) {
        const unit = resolveFoodUnitValue(item.servingUnit, item.unit);
        const amount = isGramUnit(unit)
            ? formatServingAmount(Math.round(toNumber(item.servingAmount)))
            : formatServingAmount(item.servingAmount);
        parts.push(`${amount}${unit}`);
    }
    const weight = toNumber(item.weight);
    if (weight > 0 && item.servingAmount != null) {
        const unit = resolveFoodUnitValue(item.servingUnit, item.unit);
        if (!isGramUnit(unit)) {
            parts.push(`约${formatServingAmount(weight)}${FOOD_UNIT.gram}`);
        }
    }
    return parts.join('  ') || '--';
}

function buildMainInfoFromItem(item: MealDetailItem): MealDetailMainInfo {
    return {
        calorie: toNumber(item.calorie),
        protein: toNumber(item.protein),
        fat: toNumber(item.fat),
        carbs: toNumber(item.carbs),
        fiber: toNumber(item.fiber),
        mealCategory: item.mealCategory,
        othersNutrition: item.othersNutrition,
    };
}

function buildMainInfoFromList(list: MealDetailItem[]): MealDetailMainInfo {
    return list.reduce<MealDetailMainInfo>(
        (acc, item) => ({
            calorie: toNumber(acc.calorie) + toNumber(item.calorie),
            protein: toNumber(acc.protein) + toNumber(item.protein),
            fat: toNumber(acc.fat) + toNumber(item.fat),
            carbs: toNumber(acc.carbs) + toNumber(item.carbs),
            fiber: toNumber(acc.fiber) + toNumber(item.fiber),
            mealCategory: acc.mealCategory ?? item.mealCategory,
            othersNutrition: acc.othersNutrition ?? item.othersNutrition,
        }),
        { calorie: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    );
}

export function mealDetailItemToFoodItem(item: MealDetailItem): FoodIdentifyItem {
    const unit =
        typeof item.unit === 'string'
            ? item.unit
            : typeof item.servingUnit === 'string'
              ? item.servingUnit
              : undefined;

    return {
        mealName: item.mealName,
        calorie: item.calorie,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
        fiber: item.fiber,
        amount: item.servingAmount,
        unit,
        servingUnit: item.servingUnit,
        weight: item.weight,
        mealCategory: item.mealCategory,
        othersNutrition: item.othersNutrition,
    };
}

export function normalizeMealDetailInfo(
    data: MealDetailInfo | MealDetailItem | null | undefined,
): MealDetailInfo | null {
    if (!data) return null;

    if ('mealDetailList' in data && Array.isArray(data.mealDetailList)) {
        const mealDetailList = data.mealDetailList.filter(item => item.isWater !== 1);
        if (mealDetailList.length === 0) return null;

        return {
            mainInfo: data.mainInfo ?? buildMainInfoFromList(mealDetailList),
            mealDetailList,
            ossUrl: data.ossUrl ?? mealDetailList.find(item => item.ossUrl)?.ossUrl,
            timeStr: data.timeStr ?? mealDetailList.find(item => item.timeStr)?.timeStr,
        };
    }

    const item = data as MealDetailItem;
    if (item.isWater === 1) return null;

    return {
        mainInfo: buildMainInfoFromItem(item),
        mealDetailList: [item],
        ossUrl: item.ossUrl,
        timeStr: item.timeStr,
    };
}
