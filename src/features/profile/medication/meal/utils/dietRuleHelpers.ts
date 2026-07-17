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

export function parseFoods(foods?: string | string[] | null): string[] {
    if (foods == null) return [];
    if (Array.isArray(foods)) {
        return foods.map(item => String(item).trim()).filter(Boolean);
    }
    const text = String(foods).trim();
    if (!text) return [];
    return text
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
    return buildMealCardsFromRuleForDate(mealList, moment());
}

export function buildMealCardsFromRuleForDate(
    mealList?: DietMealItem[],
    date?: string | moment.Moment,
): MealCardData[] {
    const weekday = moment(date).isoWeekday();
    return (mealList ?? [])
        .filter(item => {
            if (item.mealCategory == null || String(item.mealCategory).trim() === '') return false;
            const day = Number(item.day);
            // 无 day / 非法 day 时视为每日适用；否则按 1=周一...7=周日 匹配
            if (!Number.isFinite(day) || day <= 0) return true;
            return day === weekday;
        })
        .sort((a, b) => Number(a.mealCategory) - Number(b.mealCategory))
        .map((item, index) => {
            const category = Number(item.mealCategory);
            const meta = MEAL_CATEGORY_META[category] ?? MEAL_CATEGORY_META[1];
            return {
                key: `${meta.key}-${index}`,
                title: meta.title,
                time: meta.time,
                icon: meta.icon,
                foods: parseFoods(item.foods),
                calories: Number(item.calories) || 0,
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

export type NutritionSuggestion = {
    key: string;
    label: string;
    text: string;
};

export function buildNutritionSuggestions(params: {
    calories: number;
    protein: number;
    water: number;
    targetCalories?: number;
    targetProtein?: number;
    targetWater?: number;
}): NutritionSuggestion[] {
    const { calories, protein, water, targetCalories, targetProtein, targetWater } = params;
    const suggestions: NutritionSuggestion[] = [];

    if (targetCalories && targetCalories > 0) {
        const percent = calcNutritionPercent(calories, targetCalories);
        const gap = Math.max(0, Math.round(targetCalories - calories));
        const over = Math.max(0, Math.round(calories - targetCalories));

        if (percent > 120) {
            suggestions.push({
                key: 'calorie',
                label: '热量',
                text: `热量摄入偏高，已超出目标约${over}千卡，建议减少高热量食物`,
            });
        } else if (percent > 110) {
            suggestions.push({
                key: 'calorie',
                label: '热量',
                text: '热量略偏高，建议控制后续加餐或零食摄入',
            });
        } else if (percent < 80) {
            suggestions.push({
                key: 'calorie',
                label: '热量',
                text: `热量明显不足，距离目标还差约${gap}千卡，建议及时补充能量`,
            });
        } else if (percent < 90) {
            suggestions.push({
                key: 'calorie',
                label: '热量',
                text: `热量摄入偏低，距离目标还差约${gap}千卡，建议补充适量主食`,
            });
        }
    }

    if (targetProtein && targetProtein > 0) {
        const percent = calcNutritionPercent(protein, targetProtein);
        const gap = Math.max(0, Math.round(targetProtein - protein));

        if (percent < 80) {
            suggestions.push({
                key: 'protein',
                label: '蛋白',
                text: `蛋白质未达标，距离目标还差约${gap}克，建议补充鱼、蛋、豆类`,
            });
        } else if (percent < 90) {
            suggestions.push({
                key: 'protein',
                label: '蛋白',
                text: `蛋白质基本达标，距离目标还差约${gap}克，可适量补充优质蛋白`,
            });
        }
    }

    if (targetWater && targetWater > 0) {
        const percent = calcNutritionPercent(water, targetWater);
        const gap = Math.max(0, Math.round(targetWater - water));

        if (percent < 70) {
            suggestions.push({
                key: 'water',
                label: '饮水',
                text: `饮水不足，距离目标还差约${gap}毫升，请及时补水`,
            });
        } else if (percent < 90) {
            suggestions.push({
                key: 'water',
                label: '饮水',
                text: `饮水量偏低，距离目标还差约${gap}毫升，建议分次补充`,
            });
        }
    }

    const hasTarget = Boolean(
        (targetCalories && targetCalories > 0)
        || (targetProtein && targetProtein > 0)
        || (targetWater && targetWater > 0),
    );

    if (hasTarget && suggestions.length === 0) {
        suggestions.push({
            key: 'all',
            label: '综合',
            text: '今日热量、蛋白、饮水均达标，继续保持良好饮食习惯',
        });
    }

    return suggestions;
}
