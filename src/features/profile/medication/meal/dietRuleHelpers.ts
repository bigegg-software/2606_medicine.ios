import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import type { DietMealItem, DietPatientRuleInfo } from '@/api/dietPatientRule';

export type MealCardData = {
    key: string;
    title: string;
    time: string;
    icon: ImageSourcePropType;
    foods: string[];
    calories: number;
};

const MEAL_CATEGORY_META: Record<
    number,
    { key: string; title: string; time: string; icon: ImageSourcePropType }
> = {
    1: {
        key: 'breakfast',
        title: '早餐',
        time: '6:00-9:00',
        icon: require('@/assets/images/home/zao.png'),
    },
    2: {
        key: 'lunch',
        title: '午餐',
        time: '11:00-13:00',
        icon: require('@/assets/images/home/sun.png'),
    },
    3: {
        key: 'dinner',
        title: '晚餐',
        time: '17:00-19:00',
        icon: require('@/assets/images/home/yl.png'),
    },
    4: {
        key: 'snack',
        title: '加餐',
        time: '随时',
        icon: require('@/assets/images/medication/icon.png'),
    },
};

export function parseFoods(foods?: string): string[] {
    if (!foods?.trim()) return [];
    return foods
        .split(/[,，、]/)
        .map(item => item.trim())
        .filter(Boolean);
}

export function parsePrecautions(text?: string): string[] {
    if (!text?.trim()) return [];
    return text
        .split(/\n+/)
        .map(item => item.trim())
        .filter(Boolean);
}

export function formatDietNumber(value?: number | null, unit = ''): string {
    if (value == null || Number.isNaN(value)) return '--';
    const rounded = Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
    return `${rounded}${unit}`;
}

export function buildMealCardsFromRule(mealList?: DietMealItem[]): MealCardData[] {
    const today = moment().isoWeekday();
    return (mealList ?? [])
        .filter(item => item.day === today && item.mealCategory != null)
        .sort((a, b) => (a.mealCategory ?? 0) - (b.mealCategory ?? 0))
        .map((item, index) => {
            const meta = MEAL_CATEGORY_META[item.mealCategory!] ?? MEAL_CATEGORY_META[1];
            return {
                key: `${meta.key}-${index}`,
                title: meta.title,
                time: meta.time,
                icon: meta.icon,
                foods: parseFoods(item.foods),
                calories: item.calories ?? 0,
            };
        });
}

export function calcNutritionProgress(current: number, target?: number): number {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
}

export function calcNutritionPercent(current: number, target?: number): number {
    if (!target || target <= 0) return 0;
    return Math.round((current / target) * 100);
}

export const NUTRITION_COLOR = {
    green: '#34B69F',
    orange: '#FF8B07',
    red: '#F33F3E',
} as const;

export type NutritionTone = keyof typeof NUTRITION_COLOR;
export type NutritionArrow = 'up' | 'down' | 'none';

export type NutritionDisplay = {
    label: string;
    tone: NutritionTone;
    arrow: NutritionArrow;
};

export function getCalorieNutritionDisplay(percent: number): NutritionDisplay {
    if (percent > 120) {
        return { label: '偏高', tone: 'red', arrow: 'up' };
    }
    if (percent > 110) {
        return { label: '偏高', tone: 'orange', arrow: 'up' };
    }
    if (percent >= 90) {
        return { label: '达标', tone: 'green', arrow: 'up' };
    }
    if (percent >= 80) {
        return { label: '偏低', tone: 'orange', arrow: 'down' };
    }
    return { label: '明显不足', tone: 'red', arrow: 'down' };
}

export function getProteinNutritionDisplay(percent: number): NutritionDisplay {
    if (percent >= 90) {
        return { label: '达标', tone: 'green', arrow: 'up' };
    }
    if (percent >= 80) {
        return { label: '基本达标', tone: 'orange', arrow: 'down' };
    }
    return { label: '未达标', tone: 'red', arrow: 'down' };
}

export function getWaterNutritionDisplay(percent: number): NutritionDisplay {
    if (percent >= 90) {
        return { label: '达标', tone: 'green', arrow: 'up' };
    }
    if (percent >= 70) {
        return { label: '偏低', tone: 'orange', arrow: 'down' };
    }
    return { label: '风险', tone: 'red', arrow: 'down' };
}

export function getDietRuleSummary(rule: DietPatientRuleInfo | null) {
    return {
        targetCalories: rule?.targetCalories,
        targetProtein: rule?.targetProtein,
        targetWater: rule?.targetWater,
        carbsPercent: rule?.carbsPercent,
        fatPercent: rule?.fatPercent,
        recommendedIntake: rule?.recommendedIntake ?? [],
        restrictions: rule?.restrictions ?? [],
        precautions: parsePrecautions(rule?.precautions),
        mealCards: buildMealCardsFromRule(rule?.mealList),
    };
}
