import type { MealDetailItem } from '@/api/mealDetail';
import { calcNutritionProgress } from './dietRuleHelpers';

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

export function formatMealServingText(item: MealDetailItem): string {
    const parts: string[] = [];
    if (item.servingAmount != null && item.servingUnit != null) {
        parts.push(`${item.servingAmount}份`);
    }
    if (item.weight != null) {
        parts.push(`约${item.weight}克`);
    }
    return parts.join('  ') || '--';
}
