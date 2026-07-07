import request from '@/utils/axios';
import type { MealDetailItem } from './mealDetail';

export type MealRecordItem = {
  mealId?: number | string;
  userId?: number;
  customerLocalDate?: string;
  mealCategory?: number;
  calorie?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  salt?: number;
  waterIntake?: number;
  updateTime?: string;
};

export type MealRecordDetail = {
  mainInfo?: MealRecordItem & {
    dietPatientRuleId?: number;
  };
  mealDetailList?: MealDetailItem[];
};

export const getMealListByDate = (params: { customerLocalDate: string }) =>
  request.get<{ code?: number; msg?: string; data?: MealRecordItem[] }>(
    '/patient/fitpulse/meal/listByDate',
    { params },
  );

export const getMealDetailByMealId = (mealId: string) =>
  request.get<{ code?: number; msg?: string; data?: MealRecordDetail }>(
    `/patient/fitpulse/meal/mealDetail/${mealId}`,
  );
