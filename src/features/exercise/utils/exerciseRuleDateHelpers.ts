import moment from 'moment';
import {
  getExPatientRuleSnapshotByDate,
  getInUseExPatientRuleInfo,
  type ExPatientRuleInfo,
} from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export async function fetchExPatientRuleForDate(
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<InUseExPatientRule | null> {
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
  try {
    const res = isToday
      ? await getInUseExPatientRuleInfo(options)
      : await getExPatientRuleSnapshotByDate({ customerLocalDate }, options);
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

/**
 * 今天与未来：使用当前在用处方；
 * 过去日期：按本地日期查询处方快照。
 */
export async function loadExPatientRuleForDate(
  customerLocalDate: string,
  inUseRule: InUseExPatientRule | null,
  options?: { patientUserId?: string | number | null },
): Promise<InUseExPatientRule | null> {
  const today = moment().format('YYYY-MM-DD');
  if (customerLocalDate >= today) return inUseRule;
  return fetchExPatientRuleForDate(customerLocalDate, options);
}
