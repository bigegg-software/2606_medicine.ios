import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 家人日程：按 X-Patient-User-Id 拉在用运动处方，不写入本人 store */
export async function loadCalendarFamilyPrescription(
  patientUserId?: string,
): Promise<InUseExPatientRule | null> {
  const id = patientUserId?.trim();
  if (!id) return null;
  try {
    const res = await getInUseExPatientRuleInfo({ patientUserId: id });
    if (!isResourceApiOk(res as { code?: number })) return null;
    return apiResourceData<InUseExPatientRule>(
      res as { code?: number; data?: InUseExPatientRule },
    ) ?? null;
  } catch {
    return null;
  }
}
