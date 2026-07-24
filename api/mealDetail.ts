import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type MealDetailItem = {
    mealDetailId?: number;
    userId?: number;
    customerLocalDate?: string;
    mealName?: string;
    servingAmount?: number;
    unit?: string;
    servingUnit?: number | string;
    weight?: number;
    mealCategory?: number;
    calorie?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
    salt?: number;
    waterIntake?: number;
    isWater?: number;
    othersNutrition?: Record<string, unknown>;
    ossId?: number;
    ossUrl?: string;
    timeStr?: string;
};

export type AddMealDetailItemPayload = {
    mealDetailId?: number;
    mealName?: string;
    servingAmount: number;
    servingUnit: number | string;
    weight: number;
    mealCategory: number;
    calorie: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    salt: number;
    waterIntake: number;
    isWater: number;
    othersNutrition: Record<string, never>;
    ossId?: number;
    timeStr: string;
};

export type AddMealDetailListPayload = {
    mealDetailList: AddMealDetailItemPayload[];
    ossId?: number;
    foodIdentifyId?: number;
    timeStr: string;
};

export type MealDetailMainInfo = {
    calorie?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
    mealCategory?: number;
    othersNutrition?: Record<string, unknown>;
    updateTime?: string;
};

export type MealDetailInfo = {
    mainInfo?: MealDetailMainInfo;
    mealDetailList: MealDetailItem[];
    ossUrl?: string;
    timeStr?: string;
};

export type TodayMealDetailListResult = ApiResult<MealDetailItem[]>;
export type MealDetailInfoResult = ApiResult<MealDetailInfo | MealDetailItem>;

export const getTodayMealDetailList = () =>
    request.get<TodayMealDetailListResult>('/patient/fitpulse/mealDetail/todayMealDetailList');

export const getMealDetailInfo = (mealDetailId: number) =>
    request.get<MealDetailInfoResult>(`/patient/fitpulse/mealDetail/${mealDetailId}`);

export const addMealDetailList = (payload: AddMealDetailListPayload) =>
    request.post<ApiResult>('/patient/fitpulse/mealDetail/addMealDetailList', payload);

/** 删除食物记录 */
export const deleteMealDetail = (mealDetailId: string | number) =>
    request.delete<ApiResult>(`/patient/fitpulse/mealDetail/delete/${String(mealDetailId)}`);

export type CaloriesToFoodEquivResult = ApiResult<string>;

/** 根据卡路里换算约等于多少常见食物（AI） */
export const getCaloriesToFoodEquiv = (params: { calories: number }) =>
    request.get<CaloriesToFoodEquivResult>('/patient/fitpulse/mealDetail/caloriesToFoodEquiv', {
        params,
    });
