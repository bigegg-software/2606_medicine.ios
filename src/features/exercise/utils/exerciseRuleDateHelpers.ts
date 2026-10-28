import moment from 'moment';
import {
  getExPatientRuleSnapshotByDate,
  type ExPatientRuleInfo,
} from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type ExPatientRuleDateOptions = {
  patientUserId?: string | number | null;
  /** 指定处方 id（历史计划/数据隔离） */
  exPatientRuleId?: string | number | null;
};

function toRuleId(value?: string | number | null) {
  if (value == null) return undefined;
  const id = String(value).trim();
  return id || undefined;
}

export async function fetchExPatientRuleForDate(
  customerLocalDate: string,
  options?: ExPatientRuleDateOptions,
): Promise<InUseExPatientRule | null> {
  const exPatientRuleId = toRuleId(options?.exPatientRuleId);
  try {
    const res = await getExPatientRuleSnapshotByDate(
      {
        customerLocalDate,
        ...(exPatientRuleId ? { exPatientRuleId } : {}),
      },
      options,
    );
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return (
      apiResourceData<ExPatientRuleInfo>(
        res as unknown as { code?: number; data?: ExPatientRuleInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/** 锁定查看历史处方时：日历默认定位到处方开始日期所在周 */
export function resolveLockedExerciseViewDate(
  rule?: Pick<InUseExPatientRule, 'startDate' | 'endDate'> | null,
) {
  const start = rule?.startDate?.trim();
  if (start && moment(start, 'YYYY-MM-DD', true).isValid()) {
    return start;
  }
  const end = rule?.endDate?.trim();
  if (end && moment(end, 'YYYY-MM-DD', true).isValid()) {
    return end;
  }
  return moment().format('YYYY-MM-DD');
}

/** 按本地日期查询运动处方快照（带 exPatientRuleId 做数据隔离） */
export async function loadExPatientRuleForDate(
  customerLocalDate: string,
  inUseRule: InUseExPatientRule | null,
  options?: ExPatientRuleDateOptions,
): Promise<InUseExPatientRule | null> {
  return fetchExPatientRuleForDate(customerLocalDate, {
    ...options,
    exPatientRuleId: options?.exPatientRuleId ?? inUseRule?.exPatientRuleId,
  });
}

/**
 * 日课表规则：快照优先；快照无 weekTrainingScheduleList 时回退进行中处方周课表。
 * 避免休息日（如周三 isRest）因空快照丢失，居家/到店都读不到休息标记。
 */
export function resolveExerciseDayRule(
  snapshot: InUseExPatientRule | null | undefined,
  inUseRule: InUseExPatientRule | null | undefined,
): InUseExPatientRule | null {
  const snap = snapshot ?? null;
  const inUse = inUseRule ?? null;
  const snapHasSchedule = (snap?.weekTrainingScheduleList?.length ?? 0) > 0;
  if (snapHasSchedule) return snap;
  const inUseHasSchedule = (inUse?.weekTrainingScheduleList?.length ?? 0) > 0;
  if (inUseHasSchedule) {
    if (!snap) return inUse;
    return {
      ...inUse,
      ...snap,
      weekTrainingScheduleList: inUse.weekTrainingScheduleList,
    };
  }
  return snap ?? inUse;
}
