import moment from 'moment';
import {
  getDietPatientRuleSnapshotByDate,
  getInUseDietPatientRuleInfo,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { isDietRuleActiveOnDate } from './dietMealHelpers';

export type DietPatientRuleDateOptions = {
  patientUserId?: string | number | null;
  /** 指定营养处方 id（数据隔离，快照接口必传） */
  dietPatientRuleId?: string | number | null;
};

function toRuleId(value?: string | number | null) {
  if (value == null) return undefined;
  const id = String(value).trim();
  return id || undefined;
}

export async function fetchDietRuleForDate(
  customerLocalDate: string,
  options?: DietPatientRuleDateOptions,
): Promise<DietPatientRuleInfo | null> {
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
  const dietPatientRuleId = toRuleId(options?.dietPatientRuleId);
  try {
    // 今日且未锁定处方：走在用处方；其余（含历史日期）必须带 dietPatientRuleId 拉快照
    if (isToday && !dietPatientRuleId) {
      const res = await getInUseDietPatientRuleInfo(options);
      if (!isResourceApiOk(res as unknown as { code?: number })) return null;
      return (
        apiResourceData<DietPatientRuleInfo>(
          res as unknown as { code?: number; data?: DietPatientRuleInfo },
        ) ?? null
      );
    }

    if (!dietPatientRuleId) return null;

    const res = await getDietPatientRuleSnapshotByDate(
      { customerLocalDate, dietPatientRuleId },
      options,
    );
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return (
      apiResourceData<DietPatientRuleInfo>(
        res as unknown as { code?: number; data?: DietPatientRuleInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/**
 * 今天与未来：使用当前在用处方（或锁定的历史处方）；
 * 过去日期：按本地日期查询处方快照（必传 dietPatientRuleId 做数据隔离）。
 */
export async function loadDietRuleForDate(
  customerLocalDate: string,
  inUseRule: DietPatientRuleInfo | null,
  options?: DietPatientRuleDateOptions,
): Promise<DietPatientRuleInfo | null> {
  const today = moment().format('YYYY-MM-DD');
  const dietPatientRuleId = toRuleId(
    options?.dietPatientRuleId ?? inUseRule?.dietPatientRuleId,
  );

  const rule = customerLocalDate >= today
    ? inUseRule
    : await fetchDietRuleForDate(customerLocalDate, {
        ...options,
        dietPatientRuleId,
      });
  if (!isDietRuleActiveOnDate(rule, customerLocalDate)) return null;
  return rule;
}
