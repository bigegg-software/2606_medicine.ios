import type { FoodIdentifyItem } from '@/api/mealRecognition';
import { toNumber } from '@/src/features/profile/medication/meal/mealDetailHelpers';
import type { FoodItemEditState } from './components/FoodDetailCard';
import { ALL_NUTRITION_KEYS, getOtherNutrientValue, NUTRITION_LABELS } from './mealNutritionHelpers';

export type CustomNutrientItem = {
    id: string;
    name: string;
    amount: string;
    error?: boolean;
};

export type ManualCorrectionForm = {
    mealName: string;
    servingAmount: number;
    servingUnit: number;
    recordTime: string;
    calorie: string;
    protein: string;
    fat: string;
    carbs: string;
    visibleNutrients: string[];
    extraNutrition: Record<string, string>;
    customNutrients: CustomNutrientItem[];
};

export const ADDABLE_NUTRIENT_OPTIONS = [
    ...ALL_NUTRITION_KEYS.map(key => ({
        key,
        label: NUTRITION_LABELS[key] ?? key,
    })),
];

export function validateNutrientValue(value: string): string | null {
    if (value === '') return '';
    const reg = /^\d{0,5}(\.\d{0,4})?$/;
    if (!reg.test(value)) return null;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '';
    if (numericValue > 9999.9999) return '9999.9999';
    return value;
}

export function buildManualCorrectionForm(
    item: FoodIdentifyItem,
    state: FoodItemEditState,
    recordTime: string,
): ManualCorrectionForm {
    const visibleNutrients: string[] = [];
    const extraNutrition: Record<string, string> = {};
    const customNutrients: CustomNutrientItem[] = [];

    ALL_NUTRITION_KEYS.forEach(key => {
        const value = getOtherNutrientValue(item, key);
        if (value !== 0) {
            visibleNutrients.push(key);
            extraNutrition[key] = String(value);
        }
    });

    Object.entries(item.othersNutrition ?? {}).forEach(([key, val]) => {
        if ((ALL_NUTRITION_KEYS as readonly string[]).includes(key)) return;
        if (key === 'salt' || key === 'sugar') return;
        const value = toNumber(val);
        if (value !== 0) {
            customNutrients.push({
                id: `custom-${key}`,
                name: key,
                amount: String(value),
            });
        }
    });

    return {
        mealName: item.mealName ?? '',
        servingAmount: state.amount,
        servingUnit: state.unitValue,
        recordTime,
        calorie: toNumber(item.calorie) ? String(toNumber(item.calorie)) : '',
        protein: toNumber(item.protein) ? String(toNumber(item.protein)) : '',
        fat: toNumber(item.fat) ? String(toNumber(item.fat)) : '',
        carbs: toNumber(item.carbs) ? String(toNumber(item.carbs)) : '',
        visibleNutrients,
        extraNutrition,
        customNutrients,
    };
}

export function formToFoodIdentifyItem(
    form: ManualCorrectionForm,
    original: FoodIdentifyItem,
): { item: FoodIdentifyItem; state: FoodItemEditState } {
    const othersNutrition: Record<string, unknown> = {};

    form.visibleNutrients.forEach(key => {
        if (key === 'fiber') return;
        const value = toNumber(form.extraNutrition[key]);
        if (value !== 0 || form.extraNutrition[key] !== '') {
            othersNutrition[key] = value;
        }
    });

    form.customNutrients.forEach(nutrient => {
        const name = nutrient.name.trim();
        if (!name) return;
        const value = toNumber(nutrient.amount);
        if (value !== 0 || nutrient.amount !== '') {
            othersNutrition[name] = value;
        }
    });

    const item: FoodIdentifyItem = {
        ...original,
        mealName: form.mealName.trim(),
        amount: form.servingAmount,
        servingUnit: form.servingUnit,
        calorie: toNumber(form.calorie),
        protein: toNumber(form.protein),
        fat: toNumber(form.fat),
        carbs: toNumber(form.carbs),
        fiber: form.visibleNutrients.includes('fiber') ? toNumber(form.extraNutrition.fiber) : toNumber(original.fiber),
        weight: form.servingUnit === 2 ? form.servingAmount : toNumber(original.weight),
        othersNutrition,
    };

    const state: FoodItemEditState = {
        expanded: true,
        editMode: true,
        amount: form.servingAmount,
        unitValue: form.servingUnit,
    };

    return { item, state };
}

export function getServingStep(unitValue: number) {
    return unitValue === 2 ? 10 : 0.5;
}

export function getServingLimits(unitValue: number) {
    if (unitValue === 2) {
        return { min: 10, max: 500 };
    }
    return { min: 0.5, max: 10 };
}

export function adjustServingAmount(amount: number, unitValue: number, delta: number) {
    const { min, max } = getServingLimits(unitValue);
    const step = getServingStep(unitValue);
    const next = amount + delta * step;
    const clamped = Math.max(min, Math.min(next, max));
    return unitValue === 2 ? Math.round(clamped) : parseFloat(clamped.toFixed(1));
}

export type ManualCorrectionSavePayload = {
    index: number;
    item: FoodIdentifyItem;
    state: import('./components/FoodDetailCard').FoodItemEditState;
    recordTime: string;
};
