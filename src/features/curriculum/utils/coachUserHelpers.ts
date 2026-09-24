import type { CoachUserInfo } from '@/api/coachUser';
import { getCoachUserInfo } from '@/api/coachUser';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 拉取教练详细信息 */
export async function fetchCoachUserDetail(
  userId?: string | number | null,
): Promise<CoachUserInfo | null> {
  const id = userId != null ? String(userId).trim() : '';
  if (!id) return null;
  try {
    const res = await getCoachUserInfo(id);
    if (!isResourceApiOk(res)) return null;
    return apiResourceData(res) ?? null;
  } catch {
    return null;
  }
}
