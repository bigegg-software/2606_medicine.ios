import type { UserBaseInfo } from '@/api/patient';
import { getUserBaseInfo } from '@/api/patient';
import type { FamilyBindItem } from '@/api/familyBind';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export function resolveHealthRecordPatientOpts(patientUserId?: string) {
  const id = patientUserId?.trim();
  return id ? { patientUserId: id } : undefined;
}

export async function loadHealthRecordFamilyUser(
  patientUserId?: string,
): Promise<UserBaseInfo | null> {
  const id = patientUserId?.trim();
  if (!id) return null;
  try {
    const res = await getUserBaseInfo({ patientUserId: id });
    if (!isResourceApiOk(res as { code?: number })) return null;
    return apiResourceData<UserBaseInfo>(res as { code?: number; data?: UserBaseInfo }) ?? null;
  } catch {
    return null;
  }
}

export function resolveHealthRecordFamilyPhone(
  familyList: FamilyBindItem[],
  patientUserId?: string,
): string {
  const id = patientUserId?.trim();
  if (!id) return '';
  const item = familyList.find(row => String(row.patientUserId ?? '') === id);
  return item?.patientPhonenumber?.trim() || '';
}
