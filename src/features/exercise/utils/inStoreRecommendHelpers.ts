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
  coachUserId?: string;
  /** 标签：擅长方向 / 课程分类 */
  tag: string;
  /** 可约时段：周日上午 / 周日上午/周一下午 */
  availableText: string;
  /** 单场次：周日上午 */
  weekdayPeriod: string;
  sessionDate?: string;
  startTime?: string;
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

/** 周日上午 / 周一下午（12 点前上午，否则下午） */
export function formatSessionWeekdayPeriod(
  sessionDate?: string | null,
  startTime?: string | null,
): string {
  const date = String(sessionDate ?? '').trim();
  const weekday = date ? WEEKDAY_LABELS[moment(date, 'YYYY-MM-DD').day()] || '' : '';
  const hm = formatTimePart(startTime);
  if (!weekday && !hm) return '';
  const hour = hm ? Number(hm.slice(0, 2)) : NaN;
  const period = Number.isFinite(hour) && hour < 12 ? '上午' : '下午';
  if (weekday && hm) return `${weekday}${period}`;
  return weekday || (hm ? period : '');
}

/** 李老师 · 崇文门Life Medicine */
export function formatInStoreRecommendSubtitle(item: CourseSessionItem): string {
  const coach = item.coachRealName?.trim() || '';
  const station = item.stationName?.trim() || item.template?.stationName?.trim() || '';
  return [coach, station].filter(Boolean).join(' · ') || '--';
}

function sessionSortKey(sessionDate?: string, startTime?: string) {
  const date = sessionDate?.trim() || '';
  const time = formatTimePart(startTime) || '00:00';
  return `${date} ${time}`;
}

/** 最近两个可约时段文案：周日上午/周一下午 */
export function formatNearestTwoWeekdayPeriods(
  cards: InStoreRecommendCardView[],
): string {
  const periods: string[] = [];
  [...cards]
    .sort((a, b) =>
      sessionSortKey(a.sessionDate, a.startTime).localeCompare(
        sessionSortKey(b.sessionDate, b.startTime),
      ),
    )
    .forEach(card => {
      const period = card.weekdayPeriod?.trim() || '';
      if (!period || periods.includes(period) || periods.length >= 2) return;
      periods.push(period);
    });
  return periods.join('/');
}

function resolveCoachKey(card: InStoreRecommendCardView) {
  return card.coachUserId?.trim() || card.coachName || card.key;
}

/**
 * 同一教练最近两个可约时段：周日上午/周一下午
 * 不同教练各自展示自己的最近时段
 */
export function applyNearestWeekdayPeriodTexts(
  cards: InStoreRecommendCardView[],
): InStoreRecommendCardView[] {
  const sorted = [...cards].sort((a, b) =>
    sessionSortKey(a.sessionDate, a.startTime).localeCompare(
      sessionSortKey(b.sessionDate, b.startTime),
    ),
  );
  const periodsByCoach = new Map<string, string[]>();
  sorted.forEach(card => {
    const coachKey = resolveCoachKey(card);
    const period = card.weekdayPeriod?.trim() || '';
    if (!period) return;
    const list = periodsByCoach.get(coachKey) ?? [];
    if (!list.includes(period) && list.length < 2) {
      list.push(period);
    }
    periodsByCoach.set(coachKey, list);
  });
  return cards.map(card => {
    const coachKey = resolveCoachKey(card);
    const periods = periodsByCoach.get(coachKey) ?? [];
    const availableText = periods.join('/') || card.weekdayPeriod || card.availableText;
    return { ...card, availableText };
  });
}

/**
 * 按教练去重：保留该教练最早一场，可约文案已合并最近两个时段
 */
export function dedupeInStoreRecommendByCoach(
  cards: InStoreRecommendCardView[],
  limit = 2,
): InStoreRecommendCardView[] {
  const withTexts = applyNearestWeekdayPeriodTexts(cards);
  const sorted = [...withTexts].sort((a, b) =>
    sessionSortKey(a.sessionDate, a.startTime).localeCompare(
      sessionSortKey(b.sessionDate, b.startTime),
    ),
  );
  const seen = new Set<string>();
  const result: InStoreRecommendCardView[] = [];
  for (const card of sorted) {
    const coachKey = resolveCoachKey(card);
    if (seen.has(coachKey)) continue;
    seen.add(coachKey);
    result.push(card);
    if (result.length >= limit) break;
  }
  return result;
}

export function mapInStoreRecommendCard(item: CourseSessionItem): InStoreRecommendCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const courseType = (item.courseType?.trim() || item.template?.courseType?.trim() || '') as
    | CourseSessionType
    | string;
  const title = formatInStoreRecommendTitle(item);
  const weekdayPeriod = formatSessionWeekdayPeriod(item.sessionDate, item.startTime);
  const coachName = item.coachRealName?.trim() || '教练';
  const coachUserId =
    item.coachUserId != null ? String(item.coachUserId).trim() : undefined;
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
    coachUserId,
    tag,
    weekdayPeriod,
    sessionDate: item.sessionDate?.trim() || undefined,
    startTime: formatTimePart(item.startTime) || undefined,
    availableText: weekdayPeriod || title,
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
    const cards = list
      .map(mapInStoreRecommendCard)
      .filter((card): card is InStoreRecommendCardView => card != null);
    // 先按全部场次汇总时段，再按教练去重（避免同一教练两条重复）
    return dedupeInStoreRecommendByCoach(cards, 2);
  } catch (error) {
    console.error('loadInStoreRecommendCards failed:', error);
    return [];
  }
}
