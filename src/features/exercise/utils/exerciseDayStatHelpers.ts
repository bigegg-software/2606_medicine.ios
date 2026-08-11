import {
  getExRecordVideoDayStat,
  type ExRecordVideoDayStat,
} from '@/api/exRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type ExerciseDayStatView = {
  /** 当日总锻炼分钟 */
  sumMinutes: number;
  /** 主训练完成率 0-100 */
  mainCompleteRate: number;
};

export function emptyExerciseDayStatView(): ExerciseDayStatView {
  return { sumMinutes: 0, mainCompleteRate: 0 };
}

export function formatExerciseStatMinutes(minutes: number) {
  const n = Math.max(0, Math.round(Number(minutes) || 0));
  return String(n);
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
  const rawRate = Number(data?.mainCompleteRate);
  const mainCompleteRate = Number.isFinite(rawRate)
    ? Math.max(0, Math.min(100, rawRate))
    : 0;
  return { sumMinutes, mainCompleteRate };
}

/** 查询指定处方、指定日期的总锻炼时长与主训练完成率 */
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
