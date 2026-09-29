import {
  getExPatientRuleList,
  type ExPatientRuleInfo,
} from '@/api/exPatientRule';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 运动处方状态：0.进行中 1.已暂停 2.已结束 */
export function isExerciseRulePaused(status?: number | null) {
  return Number(status) === 1;
}

export function isExerciseRuleCompleted(status?: number | null) {
  return Number(status) === 2;
}

/** 暂停提示：运动处方已暂停，暂停原因"xxx"， */
export function formatExercisePauseTipPrefix(stopReason?: string | null) {
  const reason = String(stopReason ?? '').trim();
  if (reason) {
    return `运动处方已暂停，暂停原因"${reason}"，`;
  }
  return '运动处方已暂停，';
}

/** 已完成提示前缀 */
export function formatExerciseCompletedTipPrefix() {
  return '运动处方已完成，';
}

export type ExerciseHistoryTip = {
  kind: 'paused' | 'completed';
  exPatientRuleId: string;
  stopReason?: string;
};

function firstRowTip(
  res: unknown,
  kind: ExerciseHistoryTip['kind'],
): ExerciseHistoryTip | null {
  if (!isResourceApiOk(res as { code?: number })) return null;
  const first = getResourceRows<ExPatientRuleInfo>(res as never)[0];
  if (!first) return null;
  const id = first.exPatientRuleId != null ? String(first.exPatientRuleId).trim() : '';
  if (!id) return null;
  if (kind === 'paused' && isExerciseRulePaused(first.status)) {
    return { kind: 'paused', exPatientRuleId: id, stopReason: first.stopReason };
  }
  if (kind === 'completed' && isExerciseRuleCompleted(first.status)) {
    return { kind: 'completed', exPatientRuleId: id };
  }
  return null;
}

/**
 * 无进行中处方时：list pageSize=1,pageNum=1
 * 优先已暂停(status=1)，否则已结束(status=2)。
 */
export async function fetchLatestHistoryExerciseTip(
  patientUserId?: string | null,
): Promise<ExerciseHistoryTip | null> {
  try {
    const opts = patientUserId ? { patientUserId } : undefined;
    const pausedTip = firstRowTip(
      await getExPatientRuleList({ status: 1, pageSize: 1, pageNum: 1 }, opts),
      'paused',
    );
    if (pausedTip) return pausedTip;

    return firstRowTip(
      await getExPatientRuleList({ status: 2, pageSize: 1, pageNum: 1 }, opts),
      'completed',
    );
  } catch {
    return null;
  }
}
