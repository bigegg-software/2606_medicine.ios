import {
  getRecommendHealthCompanionCoaches,
  type CourseSessionCoachRecommendItem,
} from '@/api/courseSession';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { loadUserStationId } from '@/src/features/exercise/utils/inStoreRecommendHelpers';

export type HealthCompanionCoachCardView = {
  key: string;
  coachUserId: string;
  coachName: string;
  /** 擅长方向标签 */
  tag: string;
  /** 可约文案（已含「可约：」前缀，空则无） */
  availableText: string;
  avatarUri?: string;
  matchedRecommend: boolean;
};

/** 可约文案：接口可能已带「可约：」前缀 */
export function formatCoachRecommendAvailableText(raw?: string | null): string {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  if (text.startsWith('可约')) return text;
  return `可约：${text}`;
}

export function mapHealthCompanionCoachCard(
  item: CourseSessionCoachRecommendItem,
): HealthCompanionCoachCardView | null {
  const coachUserId = item.coachUserId != null ? String(item.coachUserId).trim() : '';
  if (!coachUserId) return null;
  const coachName = item.coachRealName?.trim() || '教练';
  const tag = item.specialtyDirection?.trim() || '';
  const avatarUri =
    item.coachAvatarUrl?.trim() || item.coachPortraitUrl?.trim() || undefined;
  return {
    key: coachUserId,
    coachUserId,
    coachName,
    tag,
    availableText: formatCoachRecommendAvailableText(item.availableText),
    avatarUri,
    matchedRecommend: Boolean(item.matchedRecommend),
  };
}

/** 推荐健康陪伴教练（最多 2 人）；优先用传入 stationId */
export async function loadHealthCompanionCoachCards(options?: {
  stationId?: string | number | null;
}): Promise<HealthCompanionCoachCardView[]> {
  const fromOptions =
    options?.stationId != null ? String(options.stationId).trim() : '';
  const stationId = fromOptions || (await loadUserStationId());
  if (!stationId) return [];
  try {
    const res = await getRecommendHealthCompanionCoaches({ stationId });
    if (!isResourceApiOk(res as { code?: number })) return [];
    const list = apiResourceData<CourseSessionCoachRecommendItem[]>(
      res as { code?: number; data?: CourseSessionCoachRecommendItem[] },
    );
    if (!Array.isArray(list)) return [];
    return list
      .map(mapHealthCompanionCoachCard)
      .filter((card): card is HealthCompanionCoachCardView => card != null)
      .slice(0, 2);
  } catch (error) {
    console.error('loadHealthCompanionCoachCards failed:', error);
    return [];
  }
}
