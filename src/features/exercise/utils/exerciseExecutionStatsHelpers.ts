import moment from 'moment';
import {
  getExPatientRuleInfo,
  getExPatientRuleModuleCompleteRate,
  getExPatientRuleModuleDayCompleteRate,
  type ExPatientRuleInfo,
  type ExPatientRuleModuleCompleteRate,
  type ExPatientRuleModuleDayCompleteRateItem,
} from '@/api/exPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { normalizeComplianceRate } from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import type {
  NutritionTrendItem,
  NutritionTrendSeriesItem,
} from '@/src/features/nutrition/components/NutritionTrendChart';
import {
  formatFoodRecordingRate,
  getFoodRecordingRateStatus,
  type FoodRecordingRateCard,
  type FoodRecordingRateTone,
} from '@/src/features/nutrition/components/utils/foodRecordingHelpers';

/** 图表四系：复用 NutritionTrendItem 字段映射 */
export const EXERCISE_TREND_SERIES: NutritionTrendSeriesItem[] = [
  { key: 'caloriesRate', label: '有氧心肺', color: '#6D925E' },
  { key: 'proteinRate', label: '抗阻增肌', color: '#0951AE' },
  { key: 'carbsRate', label: '柔韧拉伸', color: '#72A1C5' },
  { key: 'fatRate', label: '平衡控制', color: '#FB4550' },
];

function buildRateCard(
  key: string,
  title: string,
  rate?: number | null,
): FoodRecordingRateCard {
  const status = getFoodRecordingRateStatus(rate);
  return {
    key,
    title,
    valueText: formatFoodRecordingRate(rate),
    statusLabel: status?.label ?? '--',
    tone: (status?.tone ?? 'bad') as FoodRecordingRateTone,
  };
}

/** 总体达标率卡片：有氧/抗阻/柔韧/平衡/热身/冷身 */
export function buildExerciseExecutionStatsRateCards(
  data?: ExPatientRuleModuleCompleteRate | null,
): FoodRecordingRateCard[] {
  return [
    buildRateCard('cardio', '有氧心肺', data?.cardioCompleteRate),
    buildRateCard('strength', '抗阻增肌', data?.strengthCompleteRate),
    buildRateCard('flexibility', '柔韧拉伸', data?.flexibilityCompleteRate),
    buildRateCard('balance', '平衡控制', data?.balanceCompleteRate),
    buildRateCard('hot', '热身', data?.hotCompleteRate),
    buildRateCard('cold', '冷身', data?.coldCompleteRate),
  ];
}

export function formatExerciseExecutionRateValue(rate?: number | null) {
  return formatFoodRecordingRate(rate);
}

export function resolveExerciseStatsDateRange(rule?: ExPatientRuleInfo | null) {
  const startDate = rule?.startDate?.trim() || '';
  const endDate = rule?.endDate?.trim() || moment().format('YYYY-MM-DD');
  return { startDate, endDate };
}

export async function loadExerciseRuleForExecutionStats(
  exPatientRuleId: string,
): Promise<ExPatientRuleInfo | null> {
  const id = String(exPatientRuleId ?? '').trim();
  if (!id) return null;
  try {
    const res = await getExPatientRuleInfo(id);
    if (!isResourceApiOk(res as { code?: number })) return null;
    return (
      apiResourceData<ExPatientRuleInfo>(
        res as { code?: number; data?: ExPatientRuleInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/** 整体模块完成率（含热身/冷身） */
export async function loadExerciseModuleCompleteRate(
  exPatientRuleId: string,
): Promise<ExPatientRuleModuleCompleteRate | null> {
  const id = String(exPatientRuleId ?? '').trim();
  if (!id) return null;
  try {
    const res = await getExPatientRuleModuleCompleteRate(id);
    if (!isResourceApiOk(res as { code?: number })) return null;
    return (
      apiResourceData<ExPatientRuleModuleCompleteRate>(
        res as { code?: number; data?: ExPatientRuleModuleCompleteRate },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/** 每日四大模块完成率 */
export async function loadExerciseModuleDayCompleteRateList(options: {
  exPatientRuleId: string;
  startDate: string;
  endDate: string;
}): Promise<ExPatientRuleModuleDayCompleteRateItem[]> {
  const exPatientRuleId = String(options.exPatientRuleId ?? '').trim();
  const startDate = String(options.startDate ?? '').trim();
  const endDate = String(options.endDate ?? '').trim();
  if (!exPatientRuleId || !startDate || !endDate) return [];

  try {
    const res = await getExPatientRuleModuleDayCompleteRate({
      exPatientRuleId,
      startDate,
      endDate,
    });
    if (!isResourceApiOk(res as { code?: number })) return [];
    const data = apiResourceData<ExPatientRuleModuleDayCompleteRateItem[]>(
      res as { code?: number; data?: ExPatientRuleModuleDayCompleteRateItem[] },
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function mapModuleDayRateToTrendChart(
  rows: ExPatientRuleModuleDayCompleteRateItem[],
): NutritionTrendItem[] {
  return [...rows]
    .map(item => ({
      date: item.date?.trim() || '',
      caloriesRate: normalizeComplianceRate(item.cardioCompleteRate),
      proteinRate: normalizeComplianceRate(item.strengthCompleteRate),
      carbsRate: normalizeComplianceRate(item.flexibilityCompleteRate),
      fatRate: normalizeComplianceRate(item.balanceCompleteRate),
    }))
    .filter(item => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function sliceExerciseTrendRowsByRange(
  rows: ExPatientRuleModuleDayCompleteRateItem[],
  range: 7 | 30,
): ExPatientRuleModuleDayCompleteRateItem[] {
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

export type { FoodRecordingRateCard };
