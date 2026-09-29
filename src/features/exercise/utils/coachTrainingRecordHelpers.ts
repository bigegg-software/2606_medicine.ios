import {
  getCoachTrainingRecordByRuleAndDate,
  type CoachTrainingRecord,
} from '@/api/coachTrainingRecord';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 是否存在有效到店训练日志（有主键即视为已到店完成） */
export function hasCoachTrainingRecord(
  record?: CoachTrainingRecord | null,
): boolean {
  if (!record) return false;
  return record.id != null && String(record.id).trim() !== '';
}

/**
 * 查询指定处方、指定日期的到店训练日志；无记录返回 null
 */
export async function loadCoachTrainingRecordByRuleAndDate(options: {
  exPatientRuleId?: string | number | null;
  customerLocalDate?: string | null;
  patientUserId?: string | number | null;
}): Promise<CoachTrainingRecord | null> {
  const exPatientRuleId =
    options.exPatientRuleId != null ? String(options.exPatientRuleId).trim() : '';
  const customerLocalDate = String(options.customerLocalDate ?? '').trim();
  if (!exPatientRuleId || !customerLocalDate) return null;

  try {
    const res = await getCoachTrainingRecordByRuleAndDate(
      { exPatientRuleId, customerLocalDate },
      { patientUserId: options.patientUserId },
    );
    if (!isResourceApiOk(res as { code?: number })) return null;
    const data = apiResourceData<CoachTrainingRecord | null>(
      res as { code?: number; data?: CoachTrainingRecord | null },
    );
    if (!hasCoachTrainingRecord(data)) return null;
    return data ?? null;
  } catch {
    return null;
  }
}
