import type { ImageSourcePropType } from 'react-native';
import moment from 'moment';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
    createFoodItemState,
    isGramUnit,
    type FoodItemEditState,
} from '@/src/features/profile/medication/meal/components/FoodDetailCard';

/** 03:00-11:00 早餐；11:00-16:00 午餐；16:00-02:00 晚餐 */
export function getMealCategoryByTime() {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 11) return 1;
    if (hour >= 11 && hour < 16) return 2;
    return 3;
}

export function buildMealDetailItems(
    items: FoodIdentifyItem[],
    states: FoodItemEditState[],
    timeStr: string,
    mealCategory: number,
) {
    return items.map((item, index) => {
        const state = states[index] ?? createFoodItemState(item);
        return {
            mealName: item.mealName || '未知食物',
            servingAmount: state.amount,
            servingUnit: state.unitValue,
            unit: state.unitValue,
            weight: isGramUnit(state.unitValue) ? state.amount : toNumber(item.weight),
            mealCategory,
            calorie: toNumber(item.calorie),
            protein: toNumber(item.protein),
            fat: toNumber(item.fat),
            carbs: toNumber(item.carbs),
            fiber: toNumber(item.fiber),
            salt: 0,
            waterIntake: 0,
            isWater: 0,
            othersNutrition: (item.othersNutrition ?? {}) as Record<string, never>,
            timeStr,
        };
    });
}

export const MEAL_PERIOD_OPTIONS: ReadonlyArray<{
    category: number;
    label: string;
    icon: ImageSourcePropType;
}> = [
    { category: 1, label: '早餐', icon: require('@/assets/images/meal/zc.png') },
    { category: 2, label: '中餐', icon: require('@/assets/images/meal/zzc.png') },
    { category: 3, label: '晚餐', icon: require('@/assets/images/meal/wc.png') },
    // { category: 4, label: '加餐', icon: require('@/assets/images/meal/jc.png') },
];

export const TIME_PICKER_DATA = [
    Array.from({ length: 24 }, (_, hour) => ({
        label: String(hour).padStart(2, '0'),
        value: hour,
    })),
    Array.from({ length: 60 }, (_, minute) => ({
        label: String(minute).padStart(2, '0'),
        value: minute,
    })),
];

export function parseTimeValue(time: string): [number, number] {
    const parsed = moment(time, 'HH:mm', true);
    return parsed.isValid() ? [parsed.hour(), parsed.minute()] : [moment().hour(), moment().minute()];
}

/** 构造补充其他营养元素接口请求体 */
export function buildFillOthersPayload(
    foods: FoodIdentifyItem[],
    ossId?: number | string,
    ossUrl?: string,
) {
    return {
        analysisResult: foods.map(item => ({
            name: item.mealName || '未知食物',
            mealName: item.mealName || '未知食物',
            unit: item.unit,
            amount: item.amount != null ? String(item.amount) : undefined,
            weight: item.weight != null ? String(item.weight) : undefined,
            carbs: item.carbs != null ? String(item.carbs) : undefined,
            protein: item.protein != null ? String(item.protein) : undefined,
            fat: item.fat != null ? String(item.fat) : undefined,
            calorie: item.calorie != null ? String(item.calorie) : undefined,
            servingUnit: item.servingUnit,
            othersNutrition: item.othersNutrition ?? {},
        })),
        ossId,
        ossUrl,
    };
}
