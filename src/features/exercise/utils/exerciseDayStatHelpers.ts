import {
  getExRecordVideoDayStat,
  type ExRecordVideoDayStat,
} from '@/api/exRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type ExerciseDayStatView = {
  /** 当日总锻炼分钟 */
  sumMinutes: number;
  /** 当日总消耗 kcal */
  exerciseKcal: number;
  /** 主训练完成率 0-100 */
  mainCompleteRate: number;
  mainTotalCount: number;
  /** 已完成项数（后端含半完成） */
  mainCompleteCount: number;
};

export function emptyExerciseDayStatView(): ExerciseDayStatView {
  return {
    sumMinutes: 0,
    exerciseKcal: 0,
    mainCompleteRate: 0,
    mainTotalCount: 0,
    mainCompleteCount: 0,
  };
}

export function formatExerciseStatMinutes(minutes: number) {
  const n = Math.max(0, Math.round(Number(minutes) || 0));
  return String(n);
}

/** 千卡展示：整数直接显示，小数最多保留 1 位 */
export function formatExerciseStatKcal(kcal: number) {
  const n = Number(kcal);
  if (!Number.isFinite(n) || n <= 0) return '0';
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatExerciseStatCompleteRate(rate: number) {
  const n = Math.max(0, Math.min(100, Math.round(Number(rate) || 0)));
  return `${n}%`;
}

export function resolveExerciseStatProgressPercent(rate: number) {
  return Math.max(0, Math.min(100, Math.round(Number(rate) || 0)));
}

function normalizeDayStat(data?: ExRecordVideoDayStat | null): ExerciseDayStatView {
  const sumMinutes = Math.max(0, Math.round(Number(data?.sumExerciseDuration) || 0));
  const rawKcal = Number(data?.exerciseKcal);
  const exerciseKcal = Number.isFinite(rawKcal) && rawKcal > 0
    ? Math.round(rawKcal * 10) / 10
    : 0;
  const rawRate = Number(data?.mainCompleteRate);
  const mainCompleteRate = Number.isFinite(rawRate)
    ? Math.max(0, Math.min(100, rawRate))
    : 0;
  const mainTotalCount = Math.max(0, Math.round(Number(data?.mainTotalCount) || 0));
  const mainCompleteCount = Math.max(0, Math.round(Number(data?.mainCompleteCount) || 0));
  return {
    sumMinutes,
    exerciseKcal,
    mainCompleteRate,
    mainTotalCount,
    mainCompleteCount,
  };
}

/** 查询指定处方、指定日期的总锻炼时长、总消耗 kcal 与主训练完成率 */
export async function loadExerciseDayStat(params: {
  exPatientRuleId?: string | number | null;
  customerLocalDate: string;
}): Promise<ExerciseDayStatView> {
  const exPatientRuleId = params.exPatientRuleId != null
    ? String(params.exPatientRuleId).trim()
    : '';
  const customerLocalDate = params.customerLocalDate?.trim();
  if (!exPatientRuleId || !customerLocalDate) return emptyExerciseDayStatView();

  try {
    const res = await getExRecordVideoDayStat({
      exPatientRuleId,
      customerLocalDate,
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) {
      return emptyExerciseDayStatView();
    }
    const data = apiResourceData<ExRecordVideoDayStat>(
      res as unknown as { code?: number; data?: ExRecordVideoDayStat },
    );
    return normalizeDayStat(data);
  } catch {
    return emptyExerciseDayStatView();
  }
}
