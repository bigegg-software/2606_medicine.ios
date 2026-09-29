import {
  getDietPatientRuleList,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 营养处方状态：0.进行中 1.已暂停 2.已结束 */
export function isDietRulePaused(status?: number | null) {
  return Number(status) === 1;
}

export function isDietRuleCompleted(status?: number | null) {
  return Number(status) === 2;
}

/** 暂停提示：营养处方已暂停，暂停原因"xxx"， */
export function formatDietPauseTipPrefix(stopReason?: string | null) {
  const reason = String(stopReason ?? '').trim();
  if (reason) {
    return `营养处方已暂停，暂停原因"${reason}"，`;
  }
  return '营养处方已暂停，';
}

/** 已完成提示前缀 */
export function formatDietCompletedTipPrefix() {
  return '营养处方已完成，';
}

export type DietHistoryTip = {
  kind: 'paused' | 'completed';
  dietPatientRuleId: string;
  stopReason?: string;
};

function firstRowTip(
  res: unknown,
  kind: DietHistoryTip['kind'],
): DietHistoryTip | null {
  if (!isResourceApiOk(res as { code?: number })) return null;
  const first = getResourceRows<DietPatientRuleInfo>(res as never)[0];
  if (!first) return null;
  const id = first.dietPatientRuleId != null ? String(first.dietPatientRuleId).trim() : '';
  if (!id) return null;
  if (kind === 'paused' && isDietRulePaused(first.status)) {
    return { kind: 'paused', dietPatientRuleId: id, stopReason: first.stopReason };
  }
  if (kind === 'completed' && isDietRuleCompleted(first.status)) {
    return { kind: 'completed', dietPatientRuleId: id };
  }
  return null;
}

/**
 * 无进行中处方时：list pageSize=1,pageNum=1
 * 优先已暂停(status=1)，否则已结束(status=2)。
 */
export async function fetchLatestHistoryDietTip(
  patientUserId?: string | null,
): Promise<DietHistoryTip | null> {
  try {
    const opts = patientUserId ? { patientUserId } : undefined;
    const pausedTip = firstRowTip(
      await getDietPatientRuleList({ status: 1, pageSize: 1, pageNum: 1 }, opts),
      'paused',
    );
    if (pausedTip) return pausedTip;

    return firstRowTip(
      await getDietPatientRuleList({ status: 2, pageSize: 1, pageNum: 1 }, opts),
      'completed',
    );
  } catch {
    return null;
  }
}
