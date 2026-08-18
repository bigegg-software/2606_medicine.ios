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

export function findHealthRecordFamilyBind(
  familyList: FamilyBindItem[],
  patientUserId?: string,
): FamilyBindItem | undefined {
  const id = patientUserId?.trim();
  if (!id) return undefined;
  return familyList.find(row => String(row.patientUserId ?? '') === id);
}

export function resolveHealthRecordFamilyPhone(
  familyList: FamilyBindItem[],
  patientUserId?: string,
): string {
  return findHealthRecordFamilyBind(familyList, patientUserId)?.patientPhonenumber?.trim() || '';
}
