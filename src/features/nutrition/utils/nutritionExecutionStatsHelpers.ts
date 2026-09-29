import moment from 'moment';
import {
  getDietPatientRuleDayComplianceRate,
  getDietPatientRuleInfo,
  type DietDayComplianceRateItem,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import {
  getMealExecutionStatistics,
  type MealExecutionStatistics,
} from '@/api/meal';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { normalizeComplianceRate } from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import type { NutritionTrendItem } from '../components/NutritionTrendChart';
import {
  buildFoodRecordingRateCards,
  formatFoodRecordingRate,
  getFoodRecordingRateStatus,
  type FoodRecordingRateCard,
} from '../components/utils/foodRecordingHelpers';

function averagePositiveRates(values: number[]) {
  const list = values.filter(value => Number.isFinite(value) && value > 0);
  if (list.length === 0) return null;
  const sum = list.reduce((acc, value) => acc + value, 0);
  return sum / list.length;
}

/** 按日达标率汇总为总体达标率（取有效日均值） */
export function summarizeDayComplianceRates(
  rows: DietDayComplianceRateItem[],
): Pick<
  MealExecutionStatistics,
  | 'calorieComplianceRate'
  | 'proteinComplianceRate'
  | 'carbsComplianceRate'
  | 'fatComplianceRate'
> {
  return {
    calorieComplianceRate: averagePositiveRates(
      rows.map(item => normalizeComplianceRate(item.calorieRate)),
    ) ?? undefined,
    proteinComplianceRate: averagePositiveRates(
      rows.map(item => normalizeComplianceRate(item.proteinRate)),
    ) ?? undefined,
    carbsComplianceRate: averagePositiveRates(
      rows.map(item => normalizeComplianceRate(item.carbsRate)),
    ) ?? undefined,
    fatComplianceRate: averagePositiveRates(
      rows.map(item => normalizeComplianceRate(item.fatRate)),
    ) ?? undefined,
  };
}

export function buildExecutionStatsRateCards(
  rows: DietDayComplianceRateItem[],
): FoodRecordingRateCard[] {
  return buildFoodRecordingRateCards(summarizeDayComplianceRates(rows));
}

/** 每日达标率 → 趋势图数据 */
export function mapDayComplianceToTrendChart(
  rows: DietDayComplianceRateItem[],
): NutritionTrendItem[] {
  return [...rows]
    .map(item => ({
      date: item.date?.trim() || '',
      caloriesRate: normalizeComplianceRate(item.calorieRate),
      proteinRate: normalizeComplianceRate(item.proteinRate),
      carbsRate: normalizeComplianceRate(item.carbsRate),
      fatRate: normalizeComplianceRate(item.fatRate),
    }))
    .filter(item => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 从完整日序列截取近 N 天（含末日） */
export function sliceTrendRowsByRange(
  rows: DietDayComplianceRateItem[],
  range: 7 | 30,
): DietDayComplianceRateItem[] {
  const sorted = [...rows]
    .filter(item => Boolean(item.date?.trim()))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (sorted.length === 0) return [];
  const endDate = sorted[sorted.length - 1]?.date?.trim() || '';
  if (!endDate) return [];
  const start = moment(endDate, 'YYYY-MM-DD')
    .subtract(range - 1, 'days')
    .format('YYYY-MM-DD');
  return sorted.filter(item => {
    const date = item.date?.trim() || '';
    return date >= start && date <= endDate;
  });
}

export function resolveExecutionStatsDateRange(rule?: DietPatientRuleInfo | null) {
  const startDate = rule?.startDate?.trim() || '';
  const endDate = rule?.endDate?.trim() || moment().format('YYYY-MM-DD');
  return { startDate, endDate };
}

export async function loadDietRuleForExecutionStats(
  dietPatientRuleId: string,
): Promise<DietPatientRuleInfo | null> {
  const id = String(dietPatientRuleId ?? '').trim();
  if (!id) return null;
  try {
    const res = await getDietPatientRuleInfo(id);
    if (!isResourceApiOk(res as { code?: number })) return null;
    return (
      apiResourceData<DietPatientRuleInfo>(
        res as { code?: number; data?: DietPatientRuleInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/** 拉取指定处方在起止日内每日达标率 */
export async function loadDayComplianceRateList(options: {
  dietPatientRuleId: string;
  startDate: string;
  endDate: string;
}): Promise<DietDayComplianceRateItem[]> {
  const dietPatientRuleId = String(options.dietPatientRuleId ?? '').trim();
  const startDate = String(options.startDate ?? '').trim();
  const endDate = String(options.endDate ?? '').trim();
  if (!dietPatientRuleId || !startDate || !endDate) return [];

  try {
    const res = await getDietPatientRuleDayComplianceRate({
      dietPatientRuleId,
      startDate,
      endDate,
    });
    if (!isResourceApiOk(res as { code?: number })) return [];
    const data = apiResourceData<DietDayComplianceRateItem[]>(
      res as { code?: number; data?: DietDayComplianceRateItem[] },
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** 处方执行率数字文案：88.9% / -- */
export function formatPrescriptionExecutionRateValue(rate?: number | null) {
  return formatFoodRecordingRate(rate);
}

/** 查询指定处方执行率 */
export async function loadPrescriptionExecutionRate(options: {
  dietPatientRuleId: string;
  startDate: string;
  endDate: string;
}): Promise<number | null> {
  const dietPatientRuleId = String(options.dietPatientRuleId ?? '').trim();
  const startDate = String(options.startDate ?? '').trim();
  const endDate = String(options.endDate ?? '').trim();
  if (!dietPatientRuleId || !startDate || !endDate) return null;

  try {
    const res = await getMealExecutionStatistics({
      dietPatientRuleId,
      startDate,
      endDate,
    });
    if (!isResourceApiOk(res as { code?: number })) return null;
    const data = apiResourceData<MealExecutionStatistics>(
      res as { code?: number; data?: MealExecutionStatistics },
    );
    const rate = Number(data?.executionRate);
    return Number.isFinite(rate) ? rate : null;
  } catch {
    return null;
  }
}

export {
  formatFoodRecordingRate,
  getFoodRecordingRateStatus,
  type FoodRecordingRateCard,
};
