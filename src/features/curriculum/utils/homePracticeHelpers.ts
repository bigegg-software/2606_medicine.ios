import {
  getRecommendHomePractice,
  type RecommendHomePracticeItem,
} from '@/api/exPatientRule';
import { getExVideoInfo, type ExVideoInfo } from '@/api/exVideo';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { resolveDefaultTrainingThumb } from '@/src/features/exercise/utils/trainingPhaseHelpers';
import type { ImageSourcePropType } from 'react-native';

export type HomePracticeCardView = {
  key: string;
  exVideoId: string;
  title: string;
  subtitle: string;
  coverSource: ImageSourcePropType;
  /** 跳转播放器用 */
  timerType: string;
  groupVal: number;
  numberVal: number;
  keepSecondVal: number;
  durationMinutes: number;
};

function resolveDurationMinutes(item: RecommendHomePracticeItem) {
  const fromDuration = Number(item.duration);
  if (Number.isFinite(fromDuration) && fromDuration > 0) return Math.round(fromDuration);
  const fromMin = Number(item.durationMinVal);
  if (Number.isFinite(fromMin) && fromMin > 0) return Math.round(fromMin);
  return 0;
}

/** 优先接口 list 返回的名称，其次视频详情 title */
function resolvePracticeName(item: RecommendHomePracticeItem, videoTitle?: string) {
  return (
    item.title?.trim()
    || item.name?.trim()
    || videoTitle?.trim()
    || '居家练习'
  );
}

async function mapHomePracticeCard(
  item: RecommendHomePracticeItem,
  index: number,
): Promise<HomePracticeCardView | null> {
  const exVideoId = item.exVideoId != null ? String(item.exVideoId).trim() : '';
  if (!exVideoId) return null;
  let video: ExVideoInfo | null = null;
  try {
    const res = await getExVideoInfo(exVideoId);
    if (isResourceApiOk(res as { code?: number })) {
      video = apiResourceData(res as { code?: number; data?: ExVideoInfo }) ?? null;
    }
  } catch {
    // 无封面/标题时用处方默认图
  }
  const durationMinutes = resolveDurationMinutes(item);
  const coverUrl = video?.coverOssUrl?.trim() || '';
  const defaultThumb = resolveDefaultTrainingThumb(video?.exerciseType);
  const title = resolvePracticeName(item, video?.title);
  return {
    key: `${exVideoId}-${index}`,
    exVideoId,
    title,
    subtitle: '处方配套视频',
    coverSource: coverUrl ? { uri: coverUrl } : defaultThumb,
    timerType: item.timerType?.trim() || '',
    groupVal: Number.isFinite(Number(item.groupVal)) ? Math.round(Number(item.groupVal)) : 0,
    numberVal: Number.isFinite(Number(item.numberVal)) ? Math.round(Number(item.numberVal)) : 0,
    keepSecondVal: Number.isFinite(Number(item.keepSecondVal))
      ? Math.round(Number(item.keepSecondVal))
      : 0,
    durationMinutes,
  };
}

/** 拉取随时练一练推荐（最多 3 条，含视频标题/封面） */
export async function fetchHomePracticeCards(): Promise<HomePracticeCardView[]> {
  try {
    const res = await getRecommendHomePractice();
    if (!isResourceApiOk(res as { code?: number })) return [];
    const data = apiResourceData(res as { code?: number; data?: { list?: RecommendHomePracticeItem[] } });
    const list = Array.isArray(data?.list) ? data.list.slice(0, 3) : [];
    if (list.length === 0) return [];
    const cards = await Promise.all(list.map((item, index) => mapHomePracticeCard(item, index)));
    return cards.filter((item): item is HomePracticeCardView => item != null);
  } catch {
    return [];
  }
}
