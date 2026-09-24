import moment from 'moment';
import type { CourseSessionBookingItem, CourseSessionItem, CourseSessionType } from '@/api/courseSession';
import type { CoachUserInfo } from '@/api/coachUser';
import {
  bookCourseSession,
  cancelMyBooking,
  getCourseSessionInfo,
  getCourseSessionPage,
  getMyBookingNext,
} from '@/api/courseSession';
import { apiResourceData, getResourceRows, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import { fetchCoachUserDetail } from './coachUserHelpers';

const DEFAULT_PAGE_SIZE = 50;

type SessionListQueryOptions = {
  stationId?: string;
  coachUserId?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  pageSize?: number;
  pageNum?: number;
};

async function fetchCourseSessionRows(
  courseType: CourseSessionType,
  options: SessionListQueryOptions,
): Promise<CourseSessionItem[]> {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  if (!stationId) return [];

  const res = await getCourseSessionPage({
    stationId,
    courseType,
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    ...(options.coachUserId ? { coachUserId: options.coachUserId } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {}),
    ...(options.startTime ? { startTime: options.startTime } : {}),
    ...(options.endTime ? { endTime: options.endTime } : {}),
  });

  return getResourceRows(res);
}

export type PrivateSessionCardView = {
  key: string;
  sessionId: string;
  name: string;
  tag: string;
  desc: string;
  benefitText: string;
  time: string;
  topic: string;
  avatarUri?: string;
  bookedByMe: boolean;
  bookingId?: string;
};

export type NextBookingView = {
  bookingId: string;
  sessionId: string;
  detailText: string;
};

export type CourseSessionActionResult = {
  ok: boolean;
  msg?: string;
};

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatSessionTime(startTime?: string, endTime?: string) {
  const start = startTime?.trim() || '--';
  const end = endTime?.trim() || '--';
  return `${start}-${end}`;
}

function formatHm(time?: string) {
  const raw = time?.trim() || '';
  if (!raw) return '';
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function actionFailMsg(res: ApiResult | null | undefined, fallback: string) {
  return res?.msg?.trim() || res?.message?.trim() || fallback;
}

/** 周六 10:30 · 李老师 */
export function formatNextBookingDetail(item: CourseSessionBookingItem): string {
  const sessionDate = item.sessionDate?.trim() || item.session?.sessionDate?.trim() || '';
  const startTime =
    formatHm(item.startTime) || formatHm(item.session?.startTime) || '--';
  const coachName =
    item.coachRealName?.trim() ||
    item.session?.coachRealName?.trim() ||
    '教练';
  const weekday = sessionDate
    ? WEEKDAY_LABELS[moment(sessionDate, 'YYYY-MM-DD').day()] || ''
    : '';
  const left = [weekday, startTime].filter(Boolean).join(' ');
  return left ? `${left} · ${coachName}` : coachName;
}

export function mapNextBooking(item: CourseSessionBookingItem | null | undefined): NextBookingView | null {
  if (item == null) return null;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  if (!bookingId) return null;
  const sessionId =
    item.sessionId != null
      ? String(item.sessionId).trim()
      : item.session?.sessionId != null
        ? String(item.session.sessionId).trim()
        : '';
  return {
    bookingId,
    sessionId,
    detailText: formatNextBookingDetail(item),
  };
}

/** 拉取下一次待上课预约（私教） */
export async function fetchNextPrivateBooking(options: {
  stationId?: string;
}): Promise<NextBookingView | null> {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  const res = await getMyBookingNext({
    courseType: 'private',
    status: 1,
    sessionDateOrder: 'asc',
    startTimeOrder: 'asc',
    ...(stationId ? { stationId } : {}),
  });
  if (!isResourceApiOk(res)) return null;
  return mapNextBooking(apiResourceData(res));
}

function formatCapacityText(item: CourseSessionItem) {
  const booked = typeof item.bookedCount === 'number' ? item.bookedCount : 0;
  const capacity = item.capacity;
  if (capacity == null) return `已预约 ${booked} 人`;
  if (capacity < 0) return `已预约 ${booked} 人 · 不限`;
  return `已预约 ${booked}/${capacity} 人`;
}

export function mapPrivateSessionToCard(item: CourseSessionItem): PrivateSessionCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const specialty = item.coachSpecialtyDirection?.trim() || '';
  const courseName = item.template?.courseName?.trim() || '';
  const avatarUri = item.coachAvatarUrl?.trim() || undefined;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  return {
    key: sessionId,
    sessionId,
    name: item.coachRealName?.trim() || '教练',
    tag: '处方推荐',
    desc: specialty || item.template?.courseIntro?.trim() || '专业私教陪伴',
    benefitText: formatCapacityText(item),
    time: formatSessionTime(item.startTime, item.endTime),
    topic: courseName || item.template?.coursePoints?.trim() || '--',
    avatarUri,
    bookedByMe: Boolean(item.bookedByMe),
    ...(bookingId ? { bookingId } : {}),
  };
}

/** 拉取私教排期列表 */
export async function fetchRecommendPrivateSessions(
  options: SessionListQueryOptions,
): Promise<PrivateSessionCardView[]> {
  const list = await fetchCourseSessionRows('private', options);
  return list
    .map(mapPrivateSessionToCard)
    .filter((item): item is PrivateSessionCardView => item != null);
}

export type GroupSessionCardView = {
  key: string;
  sessionId: string;
  title: string;
  coachMeta: string;
  enrollText: string;
  time: string;
  benefitText: string;
  coverUri?: string;
  bookedByMe: boolean;
  bookingId?: string;
};

function formatGroupCoachMeta(item: CourseSessionItem) {
  const coach = item.coachRealName?.trim() || '教练';
  const capacity = item.capacity ?? item.template?.capacity;
  if (capacity == null) return coach;
  if (capacity < 0) return `${coach}·不限人数小班`;
  return `${coach}·${capacity}人小班`;
}

function formatGroupEnrollText(item: CourseSessionItem) {
  const booked = typeof item.bookedCount === 'number' ? item.bookedCount : 0;
  const capacity = item.capacity;
  if (capacity == null) return `已报名${booked}人`;
  if (capacity < 0) return `已报名${booked}人·不限`;
  const remain = Math.max(capacity - booked, 0);
  return `已报名${booked}人·还可预约${remain}人`;
}

export function mapGroupSessionToCard(item: CourseSessionItem): GroupSessionCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  const coverUri =
    item.template?.coverOssUrl?.trim() || undefined;
  return {
    key: sessionId,
    sessionId,
    title: item.template?.courseName?.trim() || '集体课',
    coachMeta: formatGroupCoachMeta(item),
    enrollText: formatGroupEnrollText(item),
    time: formatSessionTime(item.startTime, item.endTime),
    benefitText: '使用小班训练权益 1 节',
    coverUri,
    bookedByMe: Boolean(item.bookedByMe),
    ...(bookingId ? { bookingId } : {}),
  };
}

/** 拉取集体课排期列表 */
export async function fetchRecommendGroupSessions(
  options: SessionListQueryOptions,
): Promise<GroupSessionCardView[]> {
  const list = await fetchCourseSessionRows('group', options);
  return list
    .map(mapGroupSessionToCard)
    .filter((item): item is GroupSessionCardView => item != null);
}

/** 拉取下一次待上课预约（集体课） */
export async function fetchNextGroupBooking(options: {
  stationId?: string;
}): Promise<NextBookingView | null> {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  const res = await getMyBookingNext({
    courseType: 'group',
    status: 1,
    sessionDateOrder: 'asc',
    startTimeOrder: 'asc',
    ...(stationId ? { stationId } : {}),
  });
  if (!isResourceApiOk(res)) return null;
  return mapNextBooking(apiResourceData(res));
}

export type OnlineSessionCardView = {
  key: string;
  sessionId: string;
  title: string;
  suitText: string;
  prepareText: string;
  timeText: string;
  benefitText: string;
  avatarUri?: string;
  bookedByMe: boolean;
  bookingId?: string;
};

function formatOnlineWeekdayTime(item: CourseSessionItem) {
  const sessionDate = item.sessionDate?.trim() || '';
  const weekday = sessionDate
    ? WEEKDAY_LABELS[moment(sessionDate, 'YYYY-MM-DD').day()] || ''
    : '';
  const range = formatSessionTime(item.startTime, item.endTime);
  return weekday ? `${weekday} ${range}` : range;
}

export function mapOnlineSessionToCard(item: CourseSessionItem): OnlineSessionCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  const coach = item.coachRealName?.trim() || '教练';
  const courseName = item.template?.courseName?.trim() || '线上课';
  const crowd = item.template?.applicableCrowd?.trim() || '';
  const equipment = item.template?.requiredEquipment?.trim() || '';
  return {
    key: sessionId,
    sessionId,
    title: `${coach}·${courseName}`,
    suitText: crowd ? `适合：${crowd}` : '适合：按处方推荐',
    prepareText: equipment ? `准备：${equipment}` : '准备：按课程说明备妥器材',
    timeText: formatOnlineWeekdayTime(item),
    benefitText: formatCapacityText(item),
    avatarUri: item.coachAvatarUrl?.trim() || undefined,
    bookedByMe: Boolean(item.bookedByMe),
    ...(bookingId ? { bookingId } : {}),
  };
}

/** 拉取线上课排期列表（默认今日起 14 天） */
export async function fetchRecommendOnlineSessions(
  options: SessionListQueryOptions,
): Promise<OnlineSessionCardView[]> {
  const list = await fetchCourseSessionRows('online', options);
  return list
    .map(mapOnlineSessionToCard)
    .filter((item): item is OnlineSessionCardView => item != null);
}

/** 拉取下一次待上课预约（线上课） */
export async function fetchNextOnlineBooking(options: {
  stationId?: string;
}): Promise<NextBookingView | null> {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  const res = await getMyBookingNext({
    courseType: 'online',
    status: 1,
    sessionDateOrder: 'asc',
    startTimeOrder: 'asc',
    ...(stationId ? { stationId } : {}),
  });
  if (!isResourceApiOk(res)) return null;
  return mapNextBooking(apiResourceData(res));
}

/** 预约私教场次 */
export async function bookPrivateSession(sessionId: string): Promise<CourseSessionActionResult> {
  const id = String(sessionId ?? '').trim();
  if (!id) return { ok: false, msg: '场次无效' };
  try {
    const res = await bookCourseSession({ sessionId: id });
    if (!isResourceApiOk(res)) {
      return { ok: false, msg: actionFailMsg(res, '预约失败，请稍后重试') };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}

/** 取消私教预约 */
export async function cancelPrivateBooking(bookingId: string): Promise<CourseSessionActionResult> {
  const id = String(bookingId ?? '').trim();
  if (!id) return { ok: false, msg: '预约无效' };
  try {
    const res = await cancelMyBooking({ bookingId: id });
    if (!isResourceApiOk(res)) {
      return { ok: false, msg: actionFailMsg(res, '取消失败，请稍后重试') };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}

/** 解析卡片对应的预约 id（列表回填 / 下一次预约匹配） */
export function resolveCardBookingId(
  card: Pick<
    PrivateSessionCardView | GroupSessionCardView | OnlineSessionCardView,
    'sessionId' | 'bookingId'
  >,
  nextBooking?: NextBookingView | null,
): string {
  if (card.bookingId?.trim()) return card.bookingId.trim();
  if (
    nextBooking?.bookingId &&
    nextBooking.sessionId &&
    nextBooking.sessionId === card.sessionId
  ) {
    return nextBooking.bookingId;
  }
  return '';
}

export function toSessionId(value?: string | number | null) {
  return value != null ? String(value).trim() : '';
}

/** 拉取课程场次详情 */
export async function fetchCourseSessionDetail(
  sessionId?: string | number | null,
): Promise<CourseSessionItem | null> {
  const id = toSessionId(sessionId);
  if (!id) return null;
  try {
    const res = await getCourseSessionInfo(id);
    if (!isResourceApiOk(res)) return null;
    return apiResourceData(res) ?? null;
  } catch {
    return null;
  }
}

export type OnlineCourseDetailView = {
  sessionId: string;
  title: string;
  coachName: string;
  stationName: string;
  /** 课程类型文案，如：线上课 */
  courseTypeLabel: string;
  /** 课程分类名称，如：综合训练 */
  categoryLabel: string;
  enrollText: string;
  /** 信息栏时间，如：10:15-11:15 */
  timeText: string;
  platformLabel: string;
  /** 适合人群正文 */
  suitText: string;
  prepareText: string;
  introText: string;
  pointsText: string;
  /** 资格证书 */
  certificateText: string;
  /** 擅长方向 */
  specialtyText: string;
  coverUri?: string;
  liveLink?: string;
  /** 场次状态：0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */
  status?: number;
  bookedCount: number;
  capacity?: number;
  bookedByMe: boolean;
  bookingId?: string;
};

/** 信息栏时间文案 */
export function formatOnlineDetailTime(item: CourseSessionItem) {
  const start = formatHm(item.startTime);
  const end = formatHm(item.endTime);
  if (start && end) return `${start}-${end}`;
  return start || end || '';
}

export function formatOnlineWatchMethodText(platformLabel?: string | null) {
  const platform = platformLabel?.trim() || '第三方平台';
  return `跳转第三方平台 ${platform} 观看`;
}

/** 右上角：已预约6/12 人 */
export function formatOnlineHeaderEnrollText(bookedCount?: number, capacity?: number) {
  const booked =
    typeof bookedCount === 'number' && Number.isFinite(bookedCount)
      ? Math.max(0, Math.floor(bookedCount))
      : 0;
  if (capacity == null) return `已预约${booked} 人`;
  if (capacity < 0) return `已预约${booked} 人`;
  return `已预约${booked}/${capacity} 人`;
}

export function mapOnlineCourseDetail(item: CourseSessionItem): OnlineCourseDetailView | null {
  return mapCourseSessionDetail(item, {
    courseTypeLabel: '线上课',
    titleFallback: '线上课',
  });
}

/** 映射集体课详情 */
export function mapGroupCourseDetail(item: CourseSessionItem): OnlineCourseDetailView | null {
  return mapCourseSessionDetail(item, {
    courseTypeLabel: '集体课',
    titleFallback: '集体课',
  });
}

/** 映射私教课详情 */
export function mapPrivateCourseDetail(item: CourseSessionItem): OnlineCourseDetailView | null {
  const base = mapCourseSessionDetail(item, {
    courseTypeLabel: '私教课',
    titleFallback: '私教课',
  });
  if (!base) return null;
  const specialty = item.coachSpecialtyDirection?.trim() || '';
  const certificate = item.coachCertificate?.trim() || '';
  const courseIntro = item.template?.courseIntro?.trim() || '';
  return {
    ...base,
    certificateText: certificate,
    specialtyText: specialty,
    introText: courseIntro,
    coverUri: item.coachAvatarUrl?.trim() || item.template?.coverOssUrl?.trim() || undefined,
  };
}

/** 用教练详情覆盖资格证书 / 擅长方向 / 个人简介 / 头像 */
export function applyCoachUserToPrivateDetail(
  detail: OnlineCourseDetailView,
  coach: CoachUserInfo | null | undefined,
): OnlineCourseDetailView {
  if (!coach) return detail;
  const certificate = coach.qualificationCert?.trim() || '';
  const specialty = coach.specialtyDirection?.trim() || '';
  const introduction = coach.introduction?.trim() || '';
  const avatarUri = coach.avatarOssUrl?.trim() || '';
  const realName = coach.realName?.trim() || '';
  return {
    ...detail,
    certificateText: certificate || detail.certificateText,
    specialtyText: specialty || detail.specialtyText,
    introText: introduction || detail.introText,
    coverUri: avatarUri || detail.coverUri,
    coachName: realName || detail.coachName,
  };
}

/** 拉取私教课详情（含教练资格证书 / 擅长方向 / 个人简介） */
export async function fetchPrivateCourseDetail(
  sessionId?: string | number | null,
): Promise<OnlineCourseDetailView | null> {
  const item = await fetchCourseSessionDetail(sessionId);
  if (!item) return null;
  const detail = mapPrivateCourseDetail(item);
  if (!detail) return null;
  const coach = await fetchCoachUserDetail(item.coachUserId);
  return applyCoachUserToPrivateDetail(detail, coach);
}

function mapCourseSessionDetail(
  item: CourseSessionItem,
  options: { courseTypeLabel: string; titleFallback: string },
): OnlineCourseDetailView | null {
  const sessionId = toSessionId(item.sessionId);
  if (!sessionId) return null;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  const courseName = item.template?.courseName?.trim() || options.titleFallback;
  const coachName = item.coachRealName?.trim() || '教练待定';
  const stationName =
    item.stationName?.trim() || item.template?.stationName?.trim() || '';
  const platformLabel =
    item.livePlatformLabel?.trim() || item.livePlatform?.trim() || '';
  const categoryLabel = item.template?.courseCategoryLabel?.trim() || '';
  const crowd = item.template?.applicableCrowd?.trim() || '';
  const equipment = item.template?.requiredEquipment?.trim() || '';
  const bookedCount =
    typeof item.bookedCount === 'number' && Number.isFinite(item.bookedCount)
      ? item.bookedCount
      : 0;
  return {
    sessionId,
    title: courseName,
    coachName,
    stationName,
    courseTypeLabel: options.courseTypeLabel,
    categoryLabel,
    enrollText: formatCapacityText(item),
    timeText: formatOnlineDetailTime(item),
    platformLabel,
    suitText: crowd,
    prepareText: equipment ? `准备：${equipment}` : '',
    introText: item.template?.courseIntro?.trim() || '',
    pointsText: item.template?.coursePoints?.trim() || '',
    certificateText: item.coachCertificate?.trim() || '',
    specialtyText: item.coachSpecialtyDirection?.trim() || '',
    coverUri: item.template?.coverOssUrl?.trim() || item.coachAvatarUrl?.trim() || undefined,
    liveLink: item.liveLink?.trim() || undefined,
    status: item.status,
    bookedCount,
    capacity: item.capacity,
    bookedByMe: Boolean(item.bookedByMe),
    ...(bookingId ? { bookingId } : {}),
  };
}
