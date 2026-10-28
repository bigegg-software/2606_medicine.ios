import type { ImageSourcePropType } from 'react-native';
import type { CoachUserInfo } from '@/api/coachUser';
import { getCoachUserInfo } from '@/api/coachUser';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { isFemaleGender, isMaleGender } from '@/src/utils/userHelpers';

/** 私教列表教练封面默认图（女） */
export const DEFAULT_COACH_COVER_F = require('@/assets/images/curriculum/coach_default_f.png');
/** 私教列表教练封面默认图（男） */
export const DEFAULT_COACH_COVER_M = require('@/assets/images/curriculum/coach_default_m.png');

/** 按教练性别取列表默认封面（女→F，男/未知→M） */
export function getDefaultCoachCoverByGender(
  gender?: string | null,
): ImageSourcePropType {
  if (isFemaleGender(gender)) return DEFAULT_COACH_COVER_F;
  if (isMaleGender(gender)) return DEFAULT_COACH_COVER_M;
  return DEFAULT_COACH_COVER_M;
}


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
  /** 教练性别 sys_user.sex：无头像时默认图 */
  coachSex?: string;
  certificateText: string;
  specialtyText: string;
  introText: string;
  stationName: string;
};

/** 映射教练详情展示 */
export function mapCoachDetailView(coach: CoachUserInfo): CoachDetailView | null {
  const coachUserId = coach.userId != null ? String(coach.userId).trim() : '';
  if (!coachUserId) return null;
  const coachSex = coach.sex != null ? String(coach.sex).trim() : '';
  return {
    coachUserId,
    name: coach.realName?.trim() || '教练',
    avatarUri: coach.portraitOssUrl?.trim() || coach.avatarOssUrl?.trim() || undefined,
    ...(coachSex ? { coachSex } : {}),
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
