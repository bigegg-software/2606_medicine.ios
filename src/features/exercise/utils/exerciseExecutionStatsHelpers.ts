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
import {
  formatMealHistoryRate,
  normalizeComplianceRate,
} from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import type {
  NutritionTrendItem,
  NutritionTrendSeriesItem,
} from '@/src/features/nutrition/components/NutritionTrendChart';
import type { FoodRecordingRateCard } from '@/src/features/nutrition/components/utils/foodRecordingHelpers';

/** 运动达标率色阶：绿优秀 / 蓝良好 / 橙偏低 / 红较低 */
export type ExerciseExecutionRateTone = 'ok' | 'good' | 'warn' | 'bad';

export type ExerciseExecutionRateCard = Omit<FoodRecordingRateCard, 'tone'> & {
  tone: ExerciseExecutionRateTone;
};

/**
 * 达标率标准：
 * 绿色优秀 ≥90%；蓝色良好 70–90%；橙色偏低 50–70%；红色较低 <50%
 * null 视为无安排/无数据
 */
export function getExerciseExecutionRateStatus(rate?: number | null): {
  label: string;
  tone: ExerciseExecutionRateTone;
} | null {
  if (rate == null || !Number.isFinite(Number(rate))) return null;
  const value = Number(rate);
  if (value >= 90) return { label: '优秀', tone: 'ok' };
  if (value >= 70) return { label: '良好', tone: 'good' };
  if (value >= 50) return { label: '偏低', tone: 'warn' };
  return { label: '较低', tone: 'bad' };
}

/** 图表四系：复用 NutritionTrendItem 字段映射 */
export const EXERCISE_TREND_SERIES: NutritionTrendSeriesItem[] = [
  { key: 'caloriesRate', label: '有氧心肺', color: '#6D925E' },
  { key: 'proteinRate', label: '抗阻增肌', color: '#0951AE' },
  { key: 'carbsRate', label: '柔韧拉伸', color: '#72A1C5' },
  { key: 'fatRate', label: '平衡控制', color: '#FB4550' },
];

/** null 无安排 → --；0 正常展示 0% */
export function formatExerciseExecutionRateValue(rate?: number | null) {
  if (rate == null || !Number.isFinite(Number(rate))) return '--';
  return `${formatMealHistoryRate(rate)}%`;
}

function buildRateCard(
  key: string,
  title: string,
  rate?: number | null,
): ExerciseExecutionRateCard {
  const status = getExerciseExecutionRateStatus(rate);
  return {
    key,
    title,
    valueText: formatExerciseExecutionRateValue(rate),
    statusLabel: status?.label ?? '--',
    tone: status?.tone ?? 'bad',
  };
}

/** 总体达标率卡片：有氧/抗阻/柔韧/平衡/热身/冷身（moduleCompleteRate） */
export function buildExerciseExecutionStatsRateCards(
  summary?: ExPatientRuleModuleCompleteRate | null,
): ExerciseExecutionRateCard[] {
  return [
    buildRateCard('cardio', '有氧心肺', summary?.cardioCompleteRate),
    buildRateCard('strength', '抗阻增肌', summary?.strengthCompleteRate),
    buildRateCard('flexibility', '柔韧拉伸', summary?.flexibilityCompleteRate),
    buildRateCard('balance', '平衡控制', summary?.balanceCompleteRate),
    buildRateCard('hot', '热身', summary?.hotCompleteRate),
    buildRateCard('cold', '冷身', summary?.coldCompleteRate),
  ];
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

/** 处方整体完成率（主训练、热身/冷身及四大模块） */
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

/** 每日完成率（主训练、热身/冷身及四大模块）— 趋势图 */
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

export type { ExerciseExecutionRateCard, ExPatientRuleModuleCompleteRate };
