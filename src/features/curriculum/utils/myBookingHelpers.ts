import moment from 'moment';
import type {
  CourseSessionBookingItem,
  CourseSessionItem,
  CourseSessionType,
} from '@/api/courseSession';
import { getMyBookingNext, getMyBookingPage } from '@/api/courseSession';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const DEFAULT_PAGE_SIZE = 20;
const RECENT_COMPLETED_SIZE = 3;

/** 预约状态文案：1.已预约 2.已取消 3.已核销 4.已爽约 */
export function bookingStatusLabel(status?: number) {
  if (status === 1) return '已预约';
  if (status === 2) return '已取消';
  if (status === 3) return '已完成';
  if (status === 4) return '已爽约';
  return '已预约';
}

function formatHm(time?: string) {
  const raw = time?.trim() || '';
  if (!raw) return '';
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function resolveSession(item: CourseSessionBookingItem): CourseSessionItem | undefined {
  return item.session;
}

function resolveCourseType(item: CourseSessionBookingItem): CourseSessionType | string {
  const raw =
    item.courseType?.trim() ||
    item.session?.courseType?.trim() ||
    item.session?.template?.courseType?.trim() ||
    '';
  return raw;
}

function resolveSessionId(item: CourseSessionBookingItem) {
  if (item.sessionId != null && String(item.sessionId).trim()) {
    return String(item.sessionId).trim();
  }
  const sid = item.session?.sessionId;
  return sid != null ? String(sid).trim() : '';
}

function resolveBookingId(item: CourseSessionBookingItem) {
  return item.bookingId != null ? String(item.bookingId).trim() : '';
}

function resolveSessionDate(item: CourseSessionBookingItem) {
  return item.sessionDate?.trim() || item.session?.sessionDate?.trim() || '';
}

function resolveStartTime(item: CourseSessionBookingItem) {
  return formatHm(item.startTime) || formatHm(item.session?.startTime);
}

function resolveEndTime(item: CourseSessionBookingItem) {
  return formatHm(item.endTime) || formatHm(item.session?.endTime);
}

function resolveCoachName(item: CourseSessionBookingItem) {
  return (
    item.coachRealName?.trim() ||
    item.session?.coachRealName?.trim() ||
    '教练'
  );
}

function resolveCourseName(item: CourseSessionBookingItem) {
  return item.session?.template?.courseName?.trim() || '课程';
}

function resolveStationName(item: CourseSessionBookingItem) {
  return (
    item.session?.stationName?.trim() ||
    item.session?.template?.stationName?.trim() ||
    ''
  );
}

function resolveCoverUri(item: CourseSessionBookingItem) {
  const session = resolveSession(item);
  const courseType = resolveCourseType(item);
  if (courseType === 'private') {
    return session?.coachAvatarUrl?.trim() || session?.template?.coverOssUrl?.trim() || undefined;
  }
  return session?.template?.coverOssUrl?.trim() || session?.coachAvatarUrl?.trim() || undefined;
}

function formatCapacityMeta(item: CourseSessionBookingItem) {
  const capacity = item.session?.capacity ?? item.session?.template?.capacity;
  if (capacity == null) return '';
  if (capacity < 0) return '不限人数小班';
  return `${capacity}人小班`;
}

function formatCoachMeta(item: CourseSessionBookingItem) {
  const coach = resolveCoachName(item);
  const courseType = resolveCourseType(item);
  if (courseType === 'group') {
    const cap = formatCapacityMeta(item);
    return cap ? `${coach}·${cap}` : coach;
  }
  if (courseType === 'online') {
    const platform = item.session?.livePlatformLabel?.trim() || '线上课';
    return `${coach}·${platform}`;
  }
  const specialty = item.session?.coachSpecialtyDirection?.trim() || '';
  const category = item.session?.template?.courseCategoryLabel?.trim() || '';
  const suffix = specialty || category || resolveCourseName(item);
  return suffix ? `${coach}·${suffix}` : coach;
}

/** 明天·周三 (10:15-11:15) / 11月8日·周六 (10:15-11:15) */
export function formatNextBookingTimeText(item: CourseSessionBookingItem) {
  const sessionDate = resolveSessionDate(item);
  const start = resolveStartTime(item) || '--';
  const end = resolveEndTime(item) || '--';
  const range = `(${start}-${end})`;
  if (!sessionDate) return range;

  const m = moment(sessionDate, 'YYYY-MM-DD');
  if (!m.isValid()) return range;
  const weekday = WEEKDAY_LABELS[m.day()] || '';
  const today = moment().startOf('day');
  const diff = m.clone().startOf('day').diff(today, 'days');
  let dayLabel = m.format('M月D日');
  if (diff === 0) dayLabel = '今天';
  else if (diff === 1) dayLabel = '明天';
  const left = [dayLabel, weekday].filter(Boolean).join('·');
  return `${left} ${range}`;
}

/** 11月8日 · 周六 10:30-11:30 */
export function formatFollowBookingTimeText(item: CourseSessionBookingItem) {
  const sessionDate = resolveSessionDate(item);
  const start = resolveStartTime(item) || '--';
  const end = resolveEndTime(item) || '--';
  const range = `${start}-${end}`;
  if (!sessionDate) return range;
  const m = moment(sessionDate, 'YYYY-MM-DD');
  if (!m.isValid()) return range;
  const weekday = WEEKDAY_LABELS[m.day()] || '';
  return `${m.format('M月D日')} · ${weekday} ${range}`;
}

/** 10月30日 */
export function formatCompletedDateText(item: CourseSessionBookingItem) {
  const sessionDate = resolveSessionDate(item);
  if (!sessionDate) return '--';
  const m = moment(sessionDate, 'YYYY-MM-DD');
  if (!m.isValid()) return sessionDate;
  return m.format('M月D日');
}

export type MyBookingDetailRoute =
  | 'PrivateCourseDetail'
  | 'GroupCourseDetail'
  | 'OnlineCourseDetail';

export function resolveBookingDetailRoute(
  courseType?: string,
): MyBookingDetailRoute {
  if (courseType === 'group') return 'GroupCourseDetail';
  if (courseType === 'online') return 'OnlineCourseDetail';
  return 'PrivateCourseDetail';
}

export type MyBookingNextCardView = {
  key: string;
  bookingId: string;
  sessionId: string;
  courseType: string;
  statusLabel: string;
  timeText: string;
  title: string;
  coachName: string;
  stationName: string;
  tipText: string;
  avatarUri?: string;
};

export type MyBookingFollowCardView = {
  key: string;
  bookingId: string;
  sessionId: string;
  courseType: string;
  statusLabel: string;
  timeText: string;
  title: string;
  coachMeta: string;
  coverUri?: string;
};

export type MyBookingCompletedCardView = {
  key: string;
  bookingId: string;
  sessionId: string;
  courseType: string;
  statusLabel: string;
  dateText: string;
  title: string;
};

export function mapNextBookingCard(
  item: CourseSessionBookingItem | null | undefined,
): MyBookingNextCardView | null {
  if (item == null) return null;
  const bookingId = resolveBookingId(item);
  const sessionId = resolveSessionId(item);
  if (!bookingId || !sessionId) return null;
  const courseType = String(resolveCourseType(item) || 'private');
  return {
    key: bookingId,
    bookingId,
    sessionId,
    courseType,
    statusLabel: bookingStatusLabel(item.status),
    timeText: formatNextBookingTimeText(item),
    title: resolveCourseName(item),
    coachName: formatCoachMeta(item),
    stationName: resolveStationName(item) || '服务站',
    tipText: courseType === 'online' ? '请提前进入直播间' : '请提前10分钟到店',
    avatarUri: resolveCoverUri(item),
  };
}

export function mapFollowBookingCard(
  item: CourseSessionBookingItem,
): MyBookingFollowCardView | null {
  const bookingId = resolveBookingId(item);
  const sessionId = resolveSessionId(item);
  if (!bookingId || !sessionId) return null;
  const courseType = String(resolveCourseType(item) || 'private');
  return {
    key: bookingId,
    bookingId,
    sessionId,
    courseType,
    statusLabel: bookingStatusLabel(item.status),
    timeText: formatFollowBookingTimeText(item),
    title: resolveCourseName(item),
    coachMeta: formatCoachMeta(item),
    coverUri: resolveCoverUri(item),
  };
}

export function mapCompletedBookingCard(
  item: CourseSessionBookingItem,
): MyBookingCompletedCardView | null {
  const bookingId = resolveBookingId(item);
  const sessionId = resolveSessionId(item);
  if (!bookingId) return null;
  const courseType = String(resolveCourseType(item) || 'private');
  const coach = resolveCoachName(item);
  const courseName = resolveCourseName(item);
  return {
    key: bookingId,
    bookingId,
    sessionId,
    courseType,
    statusLabel: bookingStatusLabel(item.status ?? 3),
    dateText: formatCompletedDateText(item),
    title: `${courseName} · ${coach}`,
  };
}

/** 下一次待上课预约（不限课程类型） */
export async function fetchMyBookingNext(): Promise<MyBookingNextCardView | null> {
  const res = await getMyBookingNext({
    status: 1,
    sessionDateOrder: 'asc',
    startTimeOrder: 'asc',
  });
  if (!isResourceApiOk(res)) return null;
  return mapNextBookingCard(apiResourceData(res));
}

/** 即将开始列表（已预约；可排除下一次预约） */
export async function fetchUpcomingBookings(options?: {
  excludeBookingIds?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<MyBookingFollowCardView[]> {
  const res = await getMyBookingPage({
    status: 1,
    sessionDateOrder: 'asc',
    startTimeOrder: 'asc',
    pageNum: options?.pageNum ?? 1,
    pageSize: options?.pageSize ?? DEFAULT_PAGE_SIZE,
    ...(options?.excludeBookingIds
      ? { excludeBookingIds: options.excludeBookingIds }
      : {}),
  });
  return getResourceRows<CourseSessionBookingItem>(res)
    .map(mapFollowBookingCard)
    .filter((row): row is MyBookingFollowCardView => row != null);
}

/** 已完成预约（已核销） */
export async function fetchCompletedBookings(options?: {
  pageNum?: number;
  pageSize?: number;
}): Promise<MyBookingCompletedCardView[]> {
  const res = await getMyBookingPage({
    status: 3,
    sessionDateOrder: 'desc',
    startTimeOrder: 'desc',
    pageNum: options?.pageNum ?? 1,
    pageSize: options?.pageSize ?? DEFAULT_PAGE_SIZE,
  });
  return getResourceRows<CourseSessionBookingItem>(res)
    .map(mapCompletedBookingCard)
    .filter((row): row is MyBookingCompletedCardView => row != null);
}

/** 即将开始页数据：下一次 + 后续安排 + 最近完成 */
export async function fetchMyBookingUpcomingBundle(): Promise<{
  next: MyBookingNextCardView | null;
  followList: MyBookingFollowCardView[];
  recentCompleted: MyBookingCompletedCardView[];
}> {
  const next = await fetchMyBookingNext();
  const [followList, recentCompleted] = await Promise.all([
    fetchUpcomingBookings({
      excludeBookingIds: next?.bookingId,
    }),
    fetchCompletedBookings({ pageSize: RECENT_COMPLETED_SIZE }),
  ]);
  return { next, followList, recentCompleted };
}
