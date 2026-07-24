import request from '@/utils/axios';
import type { MealDetailItem } from './mealDetail';
import type { DietPatientRuleInfo } from './dietPatientRule';

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
  dietPatientRuleId?: number | string;
  dietRuleSnapshot?: DietPatientRuleInfo;
};

export type MealRecordDetail = {
  mainInfo?: MealRecordItem & {
    dietPatientRuleId?: number;
  };
  mealDetailList?: MealDetailItem[];
};

export type MealExecutionTrendItem = {
  date?: string;
  energyRate?: number;
  proteinRate?: number;
  carbsRate?: number;
  fatRate?: number;
  waterRate?: number;
};

export type MealExecutionStatistics = {
  executionRate?: number;
  calorieComplianceRate?: number;
  proteinComplianceRate?: number;
  carbsComplianceRate?: number;
  fatComplianceRate?: number;
  waterComplianceRate?: number;
  statDayCount?: number;
  trendList?: MealExecutionTrendItem[];
};

export type MealAllRecordDayItem = {
  customerLocalDate?: string;
  mealList?: MealRecordItem[];
};

export type MealAllRecordMonthGroup = {
  yyyyMM?: string;
  list?: MealAllRecordDayItem[];
};

export type MealAllRecordsResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: MealAllRecordMonthGroup[];
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

export const getMealExecutionStatistics = (params: {
  dietPatientRuleId?: string;
  startDate?: string;
  endDate?: string;
}) =>
  request.get<{ code?: number; msg?: string; data?: MealExecutionStatistics }>(
    '/patient/fitpulse/meal/executionStatistics',
    { params },
  );

export const getMealAllRecords = (params?: {
  dietPatientRuleId?: string;
  pageSize?: number;
  pageNum?: number;
}) =>
  request.get<MealAllRecordsResult>('/patient/fitpulse/meal/allRecords', { params });
