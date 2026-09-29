import moment from 'moment';
import type {
  CourseSessionBookingItem,
  CourseSessionItem,
  CourseSessionType,
} from '@/api/courseSession';
import { getMyBookingNext, getMyBookingPage } from '@/api/courseSession';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { canCancelOrAdjustSession } from './sessionActionHelpers';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const DEFAULT_PAGE_SIZE = 20;
const RECENT_COMPLETED_SIZE = 3;

type BookingStatusLabelOptions = {
  /** 核销方式：1.学员签到 2.管理员核销 3.教练核销 */
  verifyType?: number | null;
  /** 场次/模板状态：5.已结束 → 展示为已完成 */
  sessionStatus?: number | null;
};

/**
 * 预约状态文案：
 * - 预约：1.已预约 2.已取消 3.已核销 4.已爽约/缺席
 * - 学员签到核销(verifyType=1) → 已签到
 * - 场次已结束(sessionStatus=5)：已核销 → 已完成；未核销 → 已过期
 */
export function bookingStatusLabel(
  status?: number,
  options?: BookingStatusLabelOptions,
) {
  const s = Number(status);
  const verifyType = Number(options?.verifyType);
  const sessionStatus = Number(options?.sessionStatus);

  if (s === 3 && verifyType === 1) return '已签到';
  if (s === 3) return '已完成';
  if (s === 4) return '缺席';
  if (s === 2) return '已取消';
  if (sessionStatus === 4) return '进行中';
  if (sessionStatus === 5) return '已过期';
  if (s === 1) return '已预约';
  return '已预约';
}

function resolveSessionStatus(item: CourseSessionBookingItem) {
  const sessionStatus = item.session?.status;
  if (sessionStatus != null && String(sessionStatus).trim() !== '') {
    return Number(sessionStatus);
  }
  const templateStatus = item.session?.template?.status;
  if (templateStatus != null && String(templateStatus).trim() !== '') {
    return Number(templateStatus);
  }
  return undefined;
}

function resolveBookingStatusLabel(item: CourseSessionBookingItem) {
  return bookingStatusLabel(item.status, {
    verifyType: item.verifyType,
    sessionStatus: resolveSessionStatus(item),
  });
}

/** 是否缺席（已爽约） */
export function isBookingAbsent(status?: number) {
  return Number(status) === 4;
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

function resolveStationId(item: CourseSessionBookingItem) {
  if (item.stationId != null && String(item.stationId).trim()) {
    return String(item.stationId).trim();
  }
  const session = resolveSession(item);
  if (session?.stationId != null && String(session.stationId).trim()) {
    return String(session.stationId).trim();
  }
  if (session?.template?.stationId != null && String(session.template.stationId).trim()) {
    return String(session.template.stationId).trim();
  }
  return '';
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
  if (capacity < 0) return '不限人数';
  return `${capacity}人班`;
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
  stationId: string;
  courseType: string;
  /** 上课日期 yyyy-MM-dd */
  sessionDate: string;
  /** 开课时间 HH:mm */
  startTime: string;
  /** 场次状态 */
  sessionStatus?: number;
  /** 进行中/已结束等不可调整时间 */
  canAdjustTime: boolean;
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

function courseTypeShortLabel(courseType: string) {
  if (courseType === 'group') return '集体';
  if (courseType === 'online') return '线上';
  return '私教';
}

export type MyBookingCompletedCardView = {
  key: string;
  bookingId: string;
  sessionId: string;
  courseType: string;
  status: number;
  statusLabel: string;
  /** 缺席（status=4） */
  isAbsent: boolean;
  sessionDate: string;
  dateText: string;
  /** 康复普拉提 · 私教 · 李教练 */
  title: string;
  coverUri?: string;
};

export function mapCompletedBookingCard(
  item: CourseSessionBookingItem,
): MyBookingCompletedCardView | null {
  const bookingId = resolveBookingId(item);
  const sessionId = resolveSessionId(item);
  if (!bookingId) return null;
  const courseType = String(resolveCourseType(item) || 'private');
  const coach = resolveCoachName(item);
  const courseName = resolveCourseName(item);
  const status = Number(item.status ?? 3);
  return {
    key: bookingId,
    bookingId,
    sessionId,
    courseType,
    status,
    statusLabel: resolveBookingStatusLabel(item),
    isAbsent: isBookingAbsent(status),
    sessionDate: resolveSessionDate(item),
    dateText: formatCompletedDateText(item),
    title: `${courseName} · ${courseTypeShortLabel(courseType)} · ${coach}`,
    coverUri: resolveCoverUri(item),
  };
}

export function mapNextBookingCard(
  item: CourseSessionBookingItem | null | undefined,
): MyBookingNextCardView | null {
  if (item == null) return null;
  const bookingId = resolveBookingId(item);
  const sessionId = resolveSessionId(item);
  if (!bookingId || !sessionId) return null;
  const courseType = String(resolveCourseType(item) || 'private');
  const sessionStatus = resolveSessionStatus(item);
  return {
    key: bookingId,
    bookingId,
    sessionId,
    stationId: resolveStationId(item),
    courseType,
    sessionDate: resolveSessionDate(item),
    startTime: resolveStartTime(item),
    sessionStatus,
    canAdjustTime: canCancelOrAdjustSession(sessionStatus),
    statusLabel: resolveBookingStatusLabel(item),
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
    statusLabel: resolveBookingStatusLabel(item),
    timeText: formatFollowBookingTimeText(item),
    title: resolveCourseName(item),
    coachMeta: formatCoachMeta(item),
    coverUri: resolveCoverUri(item),
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

function sortCompletedCards(rows: MyBookingCompletedCardView[]) {
  return [...rows].sort((a, b) => {
    const ta = moment(a.sessionDate, 'YYYY-MM-DD');
    const tb = moment(b.sessionDate, 'YYYY-MM-DD');
    if (ta.isValid() && tb.isValid()) return tb.valueOf() - ta.valueOf();
    return String(b.sessionDate).localeCompare(String(a.sessionDate));
  });
}

async function fetchCompletedBookingsByStatus(options: {
  status: number;
  courseType?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<{ rows: MyBookingCompletedCardView[]; total: number }> {
  const courseType = options.courseType?.trim() || '';
  const res = await getMyBookingPage({
    status: options.status,
    sessionDateOrder: 'desc',
    startTimeOrder: 'desc',
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    ...(courseType ? { courseType } : {}),
  });
  const rows = getResourceRows<CourseSessionBookingItem>(res)
    .map(mapCompletedBookingCard)
    .filter((row): row is MyBookingCompletedCardView => row != null);
  const total =
    isResourceApiOk(res) && typeof res.total === 'number' ? res.total : rows.length;
  return { rows, total };
}

/**
 * 已完成列表：默认含已核销(3)+缺席(4)；可按状态筛选
 * status：'' | 3 | 4
 */
export async function fetchCompletedBookings(options?: {
  courseType?: string;
  /** 空=全部状态（已完成+缺席） */
  status?: number | string;
  pageNum?: number;
  pageSize?: number;
}): Promise<{ rows: MyBookingCompletedCardView[]; total: number }> {
  const courseType = options?.courseType?.trim() || '';
  const pageNum = options?.pageNum ?? 1;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const statusRaw = options?.status;
  const statusNum =
    statusRaw != null && String(statusRaw).trim() !== ''
      ? Number(statusRaw)
      : NaN;

  if (statusNum === 3 || statusNum === 4) {
    return fetchCompletedBookingsByStatus({
      status: statusNum,
      courseType,
      pageNum,
      pageSize,
    });
  }

  const [done, absent] = await Promise.all([
    fetchCompletedBookingsByStatus({ status: 3, courseType, pageNum, pageSize }),
    fetchCompletedBookingsByStatus({ status: 4, courseType, pageNum, pageSize }),
  ]);
  const merged = sortCompletedCards([...done.rows, ...absent.rows]).slice(0, pageSize);
  return { rows: merged, total: done.total + absent.total };
}

/** 即将开始页数据：下一次 + 后续安排 + 最近完成 */
export async function fetchMyBookingUpcomingBundle(): Promise<{
  next: MyBookingNextCardView | null;
  followList: MyBookingFollowCardView[];
  recentCompleted: MyBookingCompletedCardView[];
}> {
  const next = await fetchMyBookingNext();
  const [followList, completed] = await Promise.all([
    fetchUpcomingBookings({
      excludeBookingIds: next?.bookingId,
    }),
    fetchCompletedBookings({ pageSize: RECENT_COMPLETED_SIZE }),
  ]);
  return { next, followList, recentCompleted: completed.rows };
}
