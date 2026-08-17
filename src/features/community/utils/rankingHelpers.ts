import type { ImageSourcePropType } from 'react-native';
import {
  getGrowthRankingList,
  getVitalityRankingList,
  type GrowthRankingItem,
  type VitalityRankingItem,
} from '@/api/ranking';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';

export type RankingTab = 'growth' | 'vitality';

export type RankingDisplayItem = {
  key: string;
  userId?: string;
  nickName: string;
  sort: number;
  avatar?: number | string;
  /** 副文案：改善成果 / 打卡天数 */
  subtitle: string;
  /** 右侧文案：训练时长等 */
  trailing: string;
  score: number;
};

function toUserId(value?: number | string | null) {
  if (value == null || value === '') return undefined;
  return String(value);
}

function normalizeSort(sort?: number) {
  const value = Math.round(Number(sort));
  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function formatDurationMinutes(minutes?: number) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value <= 0) return '0分钟';
  if (value < 60) return `${value}分钟`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (rest <= 0) return `${hours}小时`;
  return `${hours}小时${rest}分钟`;
}

export function formatRankingScore(value?: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
}

export function formatMyRankLabel(rank?: number | null) {
  const value = Math.round(Number(rank));
  if (!Number.isFinite(value) || value <= 0 || value > 100) return '未上榜';
  return String(value);
}

export function resolveRankingAvatarSource(
  avatar?: number | string,
  gender?: string | number | null,
): ImageSourcePropType {
  if (typeof avatar === 'string' && /^https?:\/\//.test(avatar.trim())) {
    return { uri: avatar.trim() };
  }
  return getDefaultAvatarByGender(gender == null ? undefined : String(gender));
}

function sortByRank<T extends { sort?: number; score?: number }>(list: T[]) {
  return [...list].sort((a, b) => {
    const sortA = normalizeSort(a.sort);
    const sortB = normalizeSort(b.sort);
    if (sortA !== sortB) return sortA - sortB;
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  });
}

export function mapGrowthRankingItems(list: GrowthRankingItem[]): RankingDisplayItem[] {
  return sortByRank(list).map((item, index) => {
    const sort = normalizeSort(item.sort);
    const displaySort = sort === Number.MAX_SAFE_INTEGER ? index + 1 : sort;
    return {
      key: String(item.id ?? `${item.userId ?? 'u'}-${displaySort}`),
      userId: toUserId(item.userId),
      nickName: item.nickName?.trim() || '用户',
      sort: displaySort,
      avatar: item.avatar,
      subtitle: item.improveResult?.trim() || '暂无改善数据',
      trailing: formatDurationMinutes(item.exerciseDuration),
      score: Number(item.score) || 0,
    };
  });
}

export function mapVitalityRankingItems(list: VitalityRankingItem[]): RankingDisplayItem[] {
  return sortByRank(list).map((item, index) => {
    const sort = normalizeSort(item.sort);
    const displaySort = sort === Number.MAX_SAFE_INTEGER ? index + 1 : sort;
    const signDays = Math.max(0, Math.round(Number(item.signDays) || 0));
    return {
      key: String(item.id ?? `${item.userId ?? 'u'}-${displaySort}`),
      userId: toUserId(item.userId),
      nickName: item.nickName?.trim() || '用户',
      sort: displaySort,
      avatar: item.avatar,
      subtitle: `打卡${signDays}天`,
      trailing: formatDurationMinutes(item.exerciseDuration),
      score: Number(item.score) || 0,
    };
  });
}

export async function loadRankingDisplayList(tab: RankingTab): Promise<RankingDisplayItem[]> {
  if (tab === 'growth') {
    const res = await getGrowthRankingList();
    if (!isResourceApiOk(res as { code?: number })) return [];
    const data = apiResourceData<GrowthRankingItem[]>(res as { data?: GrowthRankingItem[] });
    return mapGrowthRankingItems(Array.isArray(data) ? data : []);
  }

  const res = await getVitalityRankingList();
  if (!isResourceApiOk(res as { code?: number })) return [];
  const data = apiResourceData<VitalityRankingItem[]>(res as { data?: VitalityRankingItem[] });
  return mapVitalityRankingItems(Array.isArray(data) ? data : []);
}

export function findMyRankingEntry(
  list: RankingDisplayItem[],
  currentUserId?: string | number | null,
) {
  const selfId = toUserId(currentUserId);
  if (!selfId) return undefined;
  return list.find(item => item.userId === selfId);
}
