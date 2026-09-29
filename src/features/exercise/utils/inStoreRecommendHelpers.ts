import moment from 'moment';
import {
  getRecommendInStoreCourseSessions,
  type CourseSessionItem,
  type CourseSessionType,
} from '@/api/courseSession';
import { getUserInfo } from '@/api/user';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export type InStoreRecommendCardView = {
  key: string;
  sessionId: string;
  courseType: CourseSessionType | string;
  /** 周六 10:00-11:00 */
  title: string;
  /** 李老师 · 崇文门Life Medicine */
  subtitle: string;
  /** 教练姓名 */
  coachName: string;
  /** 标签：擅长方向 / 课程分类 */
  tag: string;
  /** 可约：周六 10:00-11:00 */
  availableText: string;
  avatarUri?: string;
  bookedByMe: boolean;
};

function formatTimePart(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function formatSessionTimeRange(startTime?: string | null, endTime?: string | null): string {
  const start = formatTimePart(startTime);
  const end = formatTimePart(endTime);
  if (start && end) return `${start}-${end}`;
  return start || end || '';
}

/** 周六 10:00-11:00 */
export function formatInStoreRecommendTitle(item: CourseSessionItem): string {
  const sessionDate = item.sessionDate?.trim() || '';
  const weekday = sessionDate
    ? WEEKDAY_LABELS[moment(sessionDate, 'YYYY-MM-DD').day()] || ''
    : '';
  const range = formatSessionTimeRange(item.startTime, item.endTime);
  if (weekday && range) return `${weekday} ${range}`;
  return weekday || range || '--';
}

/** 李老师 · 崇文门Life Medicine */
export function formatInStoreRecommendSubtitle(item: CourseSessionItem): string {
  const coach = item.coachRealName?.trim() || '';
  const station = item.stationName?.trim() || item.template?.stationName?.trim() || '';
  return [coach, station].filter(Boolean).join(' · ') || '--';
}

export function mapInStoreRecommendCard(item: CourseSessionItem): InStoreRecommendCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const courseType = (item.courseType?.trim() || item.template?.courseType?.trim() || '') as
    | CourseSessionType
    | string;
  const title = formatInStoreRecommendTitle(item);
  const coachName = item.coachRealName?.trim() || '教练';
  const tag =
    item.coachSpecialtyDirection?.trim() ||
    item.template?.courseCategoryLabel?.trim() ||
    item.template?.courseName?.trim() ||
    '处方推荐';
  return {
    key: sessionId,
    sessionId,
    courseType,
    title,
    subtitle: formatInStoreRecommendSubtitle(item),
    coachName,
    tag,
    availableText: `可约：${title}`,
    avatarUri: item.coachAvatarUrl?.trim() || undefined,
    bookedByMe: Boolean(item.bookedByMe),
  };
}

/** 从 getInfo 读取当前用户所属服务站 id（string） */
export async function loadUserStationId(): Promise<string> {
  try {
    const res = await getUserInfo();
    if (!isResourceApiOk(res as { code?: number })) return '';
    const data = apiResourceData<{ user?: { stationId?: number | string } }>(
      res as { code?: number; data?: { user?: { stationId?: number | string } } },
    );
    const stationId = data?.user?.stationId;
    return stationId != null ? String(stationId).trim() : '';
  } catch (error) {
    console.error('loadUserStationId failed:', error);
    return '';
  }
}

/** 推荐到店训练列表（最多 2 条）；优先用传入 stationId，否则再拉 getInfo */
export async function loadInStoreRecommendCards(options?: {
  stationId?: string | number | null;
}): Promise<InStoreRecommendCardView[]> {
  const fromOptions =
    options?.stationId != null ? String(options.stationId).trim() : '';
  const stationId = fromOptions || (await loadUserStationId());
  if (!stationId) return [];
  try {
    const res = await getRecommendInStoreCourseSessions({ stationId });
    if (!isResourceApiOk(res as { code?: number })) return [];
    const list = apiResourceData<CourseSessionItem[]>(
      res as { code?: number; data?: CourseSessionItem[] },
    );
    if (!Array.isArray(list)) return [];
    return list
      .map(mapInStoreRecommendCard)
      .filter((card): card is InStoreRecommendCardView => card != null)
      .slice(0, 2);
  } catch (error) {
    console.error('loadInStoreRecommendCards failed:', error);
    return [];
  }
}
