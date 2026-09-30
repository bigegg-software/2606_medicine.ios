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

export type CoachDetailView = {
  coachUserId: string;
  name: string;
  avatarUri?: string;
  certificateText: string;
  specialtyText: string;
  introText: string;
  stationName: string;
};

/** 映射教练详情展示 */
export function mapCoachDetailView(coach: CoachUserInfo): CoachDetailView | null {
  const coachUserId = coach.userId != null ? String(coach.userId).trim() : '';
  if (!coachUserId) return null;
  return {
    coachUserId,
    name: coach.realName?.trim() || '教练',
    avatarUri: coach.avatarOssUrl?.trim() || undefined,
    certificateText: coach.qualificationCert?.trim() || '',
    specialtyText: coach.specialtyDirection?.trim() || '',
    introText: coach.introduction?.trim() || '',
    stationName: coach.stationName?.trim() || '',
  };
}

/** 拉取并映射教练详情页数据 */
export async function fetchCoachDetailView(
  userId?: string | number | null,
): Promise<CoachDetailView | null> {
  const coach = await fetchCoachUserDetail(userId);
  if (!coach) return null;
  return mapCoachDetailView(coach);
}
