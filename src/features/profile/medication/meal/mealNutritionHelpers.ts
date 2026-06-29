import type { FoodIdentifyItem } from '@/api/mealRecognition';
import type { MealDetailItem } from '@/api/mealDetail';
import { toNumber } from '@/src/features/profile/medication/meal/mealDetailHelpers';

export const NUTRITION_LABELS: Record<string, string> = {
    fiber: '膳食纤维',
    calcium: '钙',
    sodium: '钠',
    potassium: '钾',
    vitaminD: '维生素D',
    vitaminB12: '维生素B12',
    alcohol: '酒精',
    caffeine: '咖啡因',
    addedSugar: '添加糖',
    vitaminA: '维生素A',
    vitaminB: '维生素B',
    vitaminC: '维生素C',
    vitaminE: '维生素E',
    vitaminK: '维生素K',
    vitaminB1: '维生素B1',
    vitaminB2: '维生素B2',
    vitaminB3: '维生素B3',
    vitaminB5: '维生素B5',
    vitaminB6: '维生素B6',
};

export const NUTRITION_UNITS: Record<string, string> = {
    fiber: '克',
    calcium: '毫克',
    sodium: '毫克',
    potassium: '毫克',
    vitaminD: '微克',
    vitaminB12: '微克',
    alcohol: '克',
    caffeine: '克',
    addedSugar: '克',
    vitaminA: '微克',
    vitaminB: '微克',
    vitaminC: '微克',
    vitaminE: '微克',
    vitaminK: '微克',
    vitaminB1: '微克',
    vitaminB2: '微克',
    vitaminB3: '微克',
    vitaminB5: '微克',
    vitaminB6: '微克',
};

export const PREVIEW_NUTRITION_KEYS = ['fiber', 'calcium'] as const;
export const EXPANDED_NUTRITION_KEYS = [
    'sodium',
    'potassium',
    'vitaminD',
    'vitaminB12',
    'alcohol',
    'caffeine',
    'addedSugar',
    'vitaminA',
    'vitaminB',
    'vitaminC',
    'vitaminE',
    'vitaminK',
    'vitaminB1',
    'vitaminB2',
    'vitaminB3',
    'vitaminB5',
    'vitaminB6',
] as const;

export const ALL_NUTRITION_KEYS = [...PREVIEW_NUTRITION_KEYS, ...EXPANDED_NUTRITION_KEYS] as const;

const LEGACY_NUTRITION_ALIASES: Record<string, readonly string[]> = {
    sodium: ['salt'],
    addedSugar: ['sugar'],
};

export type NutritionEntry = {
    key: string;
    label: string;
    value: number;
    unit: string;
};

export function getOtherNutrientValue(
    source: { fiber?: unknown; othersNutrition?: Record<string, unknown> },
    key: string,
): number {
    if (key === 'fiber') {
        return toNumber(source.fiber);
    }

    const direct = toNumber(source.othersNutrition?.[key]);
    if (direct !== 0) {
        return direct;
    }

    const aliases = LEGACY_NUTRITION_ALIASES[key];
    if (aliases) {
        for (const alias of aliases) {
            const legacy = toNumber(source.othersNutrition?.[alias]);
            if (legacy !== 0) {
                return legacy;
            }
        }
    }

    return 0;
}

export function getMealDetailOtherNutrientValue(item: MealDetailItem, key: string): number {
    if (key === 'sodium') {
        return toNumber(item.salt) || getOtherNutrientValue(item, key);
    }
    return getOtherNutrientValue(item, key);
}

export function formatNutritionValue(value: number, unit: string) {
    if (unit === '微克' || unit === '毫克') {
        return `${value % 1 === 0 ? value : value.toFixed(1)}${unit}`;
    }
    return `${value % 1 === 0 ? value : value.toFixed(1)}${unit}`;
}

export function aggregateNutrition(items: FoodIdentifyItem[]): Record<string, number> {
    const sums: Record<string, number> = {};
    items.forEach(item => {
        ALL_NUTRITION_KEYS.forEach(key => {
            const value = getOtherNutrientValue(item, key);
            if (value !== 0) {
                sums[key] = (sums[key] ?? 0) + value;
            }
        });
        Object.entries(item.othersNutrition ?? {}).forEach(([key, val]) => {
            if ((ALL_NUTRITION_KEYS as readonly string[]).includes(key)) return;
            if (key === 'salt' || key === 'sugar') return;
            const value = toNumber(val);
            if (value !== 0) {
                sums[key] = (sums[key] ?? 0) + value;
            }
        });
    });
    return sums;
}

export function getItemNutritionSums(item: FoodIdentifyItem): Record<string, number> {
    const sums: Record<string, number> = {};
    ALL_NUTRITION_KEYS.forEach(key => {
        const value = getOtherNutrientValue(item, key);
        if (value !== 0) {
            sums[key] = value;
        }
    });
    Object.entries(item.othersNutrition ?? {}).forEach(([key, val]) => {
        if ((ALL_NUTRITION_KEYS as readonly string[]).includes(key)) return;
        if (key === 'salt' || key === 'sugar') return;
        const value = toNumber(val);
        if (value !== 0) {
            sums[key] = value;
        }
    });
    return sums;
}

export function buildNutritionEntries(
    sums: Record<string, number>,
    keys: readonly string[],
    showZero = false,
): NutritionEntry[] {
    return keys
        .map(key => ({
            key,
            label: NUTRITION_LABELS[key] ?? key,
            value: sums[key] ?? 0,
            unit: NUTRITION_UNITS[key] ?? '克',
        }))
        .filter(entry => showZero || entry.value > 0);
}

export function buildAggregatedNutritionEntries(items: FoodIdentifyItem[], showZero = true): NutritionEntry[] {
    const sums = aggregateNutrition(items);
    const extraKeys = Object.keys(sums).filter(
        key => !ALL_NUTRITION_KEYS.includes(key as (typeof ALL_NUTRITION_KEYS)[number]),
    );
    return buildNutritionEntries(sums, [...ALL_NUTRITION_KEYS, ...extraKeys], showZero);
}

export function buildItemNutritionEntries(item: FoodIdentifyItem, showZero = true): NutritionEntry[] {
    const sums = getItemNutritionSums(item);
    const extraKeys = Object.keys(sums).filter(
        key => !ALL_NUTRITION_KEYS.includes(key as (typeof ALL_NUTRITION_KEYS)[number]),
    );
    return buildNutritionEntries(sums, [...ALL_NUTRITION_KEYS, ...extraKeys], showZero);
}

export function buildMealDetailNutritionEntries(item: MealDetailItem, showZero = true): NutritionEntry[] {
    const sums: Record<string, number> = {};
    ALL_NUTRITION_KEYS.forEach(key => {
        const value = getMealDetailOtherNutrientValue(item, key);
        if (showZero || value > 0) {
            sums[key] = value;
        }
    });
    const extraKeys = Object.keys(item.othersNutrition ?? {}).filter(key => {
        if ((ALL_NUTRITION_KEYS as readonly string[]).includes(key)) return false;
        if (key === 'salt' || key === 'sugar') return false;
        return showZero || toNumber(item.othersNutrition?.[key]) > 0;
    });
    extraKeys.forEach(key => {
        sums[key] = toNumber(item.othersNutrition?.[key]);
    });
    return buildNutritionEntries(sums, [...ALL_NUTRITION_KEYS, ...extraKeys], showZero);
}

export function chunkPairs<T>(items: T[]): T[][] {
    const rows: T[][] = [];
    for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
    }
    return rows;
}
