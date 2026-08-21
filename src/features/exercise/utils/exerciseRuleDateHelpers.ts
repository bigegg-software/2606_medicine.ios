import moment from 'moment';
import {
  getExPatientRuleSnapshotByDate,
  getInUseExPatientRuleInfo,
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
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
  const exPatientRuleId = toRuleId(options?.exPatientRuleId);
  try {
    const res = isToday && !exPatientRuleId
      ? await getInUseExPatientRuleInfo(options)
      : await getExPatientRuleSnapshotByDate(
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

/**
 * 今天与未来：使用当前在用处方；
 * 过去日期：按本地日期查询处方快照（带 exPatientRuleId 做数据隔离）。
 */
export async function loadExPatientRuleForDate(
  customerLocalDate: string,
  inUseRule: InUseExPatientRule | null,
  options?: ExPatientRuleDateOptions,
): Promise<InUseExPatientRule | null> {
  const today = moment().format('YYYY-MM-DD');
  if (customerLocalDate >= today) return inUseRule;
  return fetchExPatientRuleForDate(customerLocalDate, {
    ...options,
    exPatientRuleId: options?.exPatientRuleId ?? inUseRule?.exPatientRuleId,
  });
}
