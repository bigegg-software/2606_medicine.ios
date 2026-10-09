import moment from 'moment';
import type { CourseSessionBookingItem, CourseSessionItem, CourseSessionType } from '@/api/courseSession';
import type { CoachUserInfo } from '@/api/coachUser';
import {
  bookCourseSession,
  cancelMyBooking,
  getCourseSessionInfo,
  getCourseSessionPage,
  getMyBookingNext,
  getRecommendGroupCourseSessions,
  getRecommendOnlineCourseSessions,
  getRecommendPrivateCourseSessions,
  rescheduleMyBooking,
} from '@/api/courseSession';
import { apiResourceData, getResourceRows, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import { fetchCoachUserDetail } from './coachUserHelpers';
import {
  isInsufficientBenefitMsg,
  parseRemainCountFromMsg,
  type BookingDialogInfo,
} from './bookingDialogHelpers';
import { fetchMyBookingStatusForSession } from './myBookingHelpers';

const DEFAULT_PAGE_SIZE = 20;

type SessionListQueryOptions = {
  stationId?: string;
  coachUserId?: string;
  courseCategory?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  /** 排除的场次 id，多个英文逗号分隔（用于排除推荐课次） */
  excludeSessionIds?: string;
  pageSize?: number;
  pageNum?: number;
};

export type CourseSessionListPageResult<T> = {
  cards: T[];
  /** 推荐场次 id（逗号分隔），分页加载更多时原样回传 */
  excludeSessionIds: string;
  pageNum: number;
  hasMore: boolean;
};

function buildSessionQueryParams(
  courseType: CourseSessionType,
  options: SessionListQueryOptions,
) {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  return {
    stationId,
    courseType,
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    ...(options.coachUserId ? { coachUserId: String(options.coachUserId).trim() } : {}),
    ...(options.courseCategory ? { courseCategory: options.courseCategory } : {}),
    ...(options.startDate ? { startDate: options.startDate } : {}),
    ...(options.endDate ? { endDate: options.endDate } : {}),
    ...(options.startTime ? { startTime: options.startTime } : {}),
    ...(options.endTime ? { endTime: options.endTime } : {}),
    ...(options.excludeSessionIds?.trim()
      ? { excludeSessionIds: options.excludeSessionIds.trim() }
      : {}),
  };
}

function collectSessionIds(rows: CourseSessionItem[]) {
  return rows
    .map(item => (item.sessionId != null ? String(item.sessionId).trim() : ''))
    .filter(Boolean);
}

function joinExcludeSessionIds(ids: string[]) {
  return Array.from(new Set(ids)).join(',');
}

async function fetchRecommendSessionRows(
  courseType: CourseSessionType,
  options: SessionListQueryOptions,
): Promise<CourseSessionItem[]> {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  if (!stationId) return [];
  const params = buildSessionQueryParams(courseType, { ...options, pageNum: 1 });
  const res =
    courseType === 'private'
      ? await getRecommendPrivateCourseSessions(params)
      : courseType === 'group'
        ? await getRecommendGroupCourseSessions(params)
        : await getRecommendOnlineCourseSessions(params);
  if (!isResourceApiOk(res as { code?: number })) return [];
  const data = apiResourceData<CourseSessionItem[]>(
    res as { code?: number; data?: CourseSessionItem[] },
  );
  return Array.isArray(data) ? data : [];
}

async function fetchCourseSessionPageRows(
  courseType: CourseSessionType,
  options: SessionListQueryOptions,
): Promise<{ rows: CourseSessionItem[]; hasMore: boolean }> {
  const stationId = options.stationId != null ? String(options.stationId).trim() : '';
  if (!stationId) return { rows: [], hasMore: false };

  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const pageNum = options.pageNum ?? 1;
  const res = await getCourseSessionPage(buildSessionQueryParams(courseType, options));
  const rows = getResourceRows(res);
  const total = typeof (res as { total?: number }).total === 'number'
    ? Number((res as { total?: number }).total)
    : 0;
  const hasMore = total > 0 ? pageNum * pageSize < total : rows.length >= pageSize;
  return { rows, hasMore };
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
  /** 课程封面优先；无封面时用教练头像 */
  coverUri?: string;
  avatarUri?: string;
  /** 场次状态：0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */
  status?: number;
  bookedByMe: boolean;
  bookingId?: string;
  bookingInfo: BookingDialogInfo;
};

export type NextBookingView = {
  bookingId: string;
  sessionId: string;
  detailText: string;
};

export type CourseSessionActionResult = {
  ok: boolean;
  msg?: string;
  /** 权益/次数不足 */
  insufficientBenefit?: boolean;
  remainCount?: number;
  needCount?: number;
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

function mapBookingDialogInfo(item: CourseSessionItem): BookingDialogInfo {
  return {
    courseName: item.template?.courseName?.trim() || '课程',
    coachName: item.coachRealName?.trim() || '教练',
    sessionDate: item.sessionDate?.trim() || '',
    startTime: formatHm(item.startTime),
    endTime: formatHm(item.endTime),
    stationName:
      item.stationName?.trim() || item.template?.stationName?.trim() || '门店',
  };
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

function formatSessionTags(raw?: string | null): string {
  return parseSessionTags(raw).join(' · ');
}

function parseSessionTags(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,，、]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

/** 私教列表权益文案：私教权益 剩余X节（缺省/-- 按 0） */
export function formatPrivateBenefitRemainText(remain?: number | null): string {
  if (remain === -1) return '私教权益 不限次数';
  const n =
    remain == null || Number.isNaN(Number(remain)) ? 0 : Math.max(0, Math.floor(Number(remain)));
  return `私教权益 剩余${n}节`;
}

export function mapPrivateSessionToCard(
  item: CourseSessionItem,
  options?: { privateRemainCount?: number | null; isRecommend?: boolean },
): PrivateSessionCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const specialty = item.coachSpecialtyDirection?.trim() || '';
  const courseName = item.template?.courseName?.trim() || '';
  const courseTags = formatSessionTags(item.template?.courseTags);
  const coverUri = item.template?.coverOssUrl?.trim() || undefined;
  const avatarUri = item.coachAvatarUrl?.trim() || undefined;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  return {
    key: sessionId,
    sessionId,
    name: item.coachRealName?.trim() || '教练',
    tag: options?.isRecommend ? '处方推荐' : '',
    // 优先课程标签；无则显示教练擅长方向
    desc: courseTags || formatSessionTags(specialty),
    benefitText: formatPrivateBenefitRemainText(options?.privateRemainCount),
    time: formatSessionTime(item.startTime, item.endTime),
    topic: courseName || '一对一私教训练',
    coverUri,
    avatarUri,
    status: item.status,
    bookedByMe: Boolean(item.bookedByMe),
    bookingInfo: mapBookingDialogInfo(item),
    ...(bookingId ? { bookingId } : {}),
  };
}

function mapPrivateCards(
  rows: CourseSessionItem[],
  options?: { privateRemainCount?: number | null; isRecommend?: boolean },
) {
  return rows
    .map(item => mapPrivateSessionToCard(item, options))
    .filter((item): item is PrivateSessionCardView => item != null);
}

/**
 * 私教：先拉处方推荐，再拉分页列表并排除推荐 id
 * pageNum=1 返回推荐+第一页；pageNum>1 仅返回分页（须带 excludeSessionIds）
 */
export async function fetchRecommendPrivateSessions(
  options: SessionListQueryOptions & { privateRemainCount?: number | null },
): Promise<CourseSessionListPageResult<PrivateSessionCardView>> {
  const pageNum = options.pageNum ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  if (pageNum > 1) {
    const excludeSessionIds = options.excludeSessionIds?.trim() || '';
    const { rows, hasMore } = await fetchCourseSessionPageRows('private', {
      ...options,
      pageNum,
      pageSize,
      excludeSessionIds,
    });
    return {
      cards: mapPrivateCards(rows, { privateRemainCount: options.privateRemainCount }),
      excludeSessionIds,
      pageNum,
      hasMore,
    };
  }

  const recommended = await fetchRecommendSessionRows('private', options);
  const excludeSessionIds = joinExcludeSessionIds(collectSessionIds(recommended));
  const { rows, hasMore } = await fetchCourseSessionPageRows('private', {
    ...options,
    pageNum: 1,
    pageSize,
    excludeSessionIds,
  });
  const recommendCards = mapPrivateCards(recommended, {
    privateRemainCount: options.privateRemainCount,
    isRecommend: true,
  });
  const listCards = mapPrivateCards(rows, { privateRemainCount: options.privateRemainCount });
  const seen = new Set(recommendCards.map(card => card.sessionId));
  return {
    cards: [
      ...recommendCards,
      ...listCards.filter(card => !seen.has(card.sessionId)),
    ],
    excludeSessionIds,
    pageNum: 1,
    hasMore,
  };
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
  status?: number;
  bookedByMe: boolean;
  bookingId?: string;
  bookingInfo: BookingDialogInfo;
  /** 处方推荐场次 */
  isRecommend?: boolean;
};

function formatGroupCoachMeta(item: CourseSessionItem) {
  const coach = item.coachRealName?.trim() || '教练';
  const capacity = item.capacity ?? item.template?.capacity;
  if (capacity == null) return coach;
  if (capacity < 0) return `${coach}·不限人数`;
  return `${coach}·${capacity}人班`;
}

function formatGroupEnrollText(item: CourseSessionItem) {
  const booked = typeof item.bookedCount === 'number' ? item.bookedCount : 0;
  const capacity = item.capacity;
  if (capacity == null) return `已报名${booked}人`;
  if (capacity < 0) return `已报名${booked}人·不限`;
  const remain = Math.max(capacity - booked, 0);
  return `已报名${booked}人·还可预约${remain}人`;
}

export function mapGroupSessionToCard(
  item: CourseSessionItem,
  options?: { isRecommend?: boolean },
): GroupSessionCardView | null {
  const sessionId = item.sessionId != null ? String(item.sessionId).trim() : '';
  if (!sessionId) return null;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  const coverUri = item.template?.coverOssUrl?.trim() || undefined;
  return {
    key: sessionId,
    sessionId,
    title: item.template?.courseName?.trim() || '集体课',
    coachMeta: formatGroupCoachMeta(item),
    enrollText: formatGroupEnrollText(item),
    time: formatSessionTime(item.startTime, item.endTime),
    benefitText: '使用集体训练权益 1 节',
    coverUri,
    status: item.status,
    bookedByMe: Boolean(item.bookedByMe),
    bookingInfo: mapBookingDialogInfo(item),
    isRecommend: Boolean(options?.isRecommend),
    ...(bookingId ? { bookingId } : {}),
  };
}

function mapGroupCards(rows: CourseSessionItem[], options?: { isRecommend?: boolean }) {
  return rows
    .map(item => mapGroupSessionToCard(item, options))
    .filter((item): item is GroupSessionCardView => item != null);
}

/**
 * 集体课：先拉处方推荐，再拉分页列表并排除推荐 id
 */
export async function fetchRecommendGroupSessions(
  options: SessionListQueryOptions,
): Promise<CourseSessionListPageResult<GroupSessionCardView>> {
  const pageNum = options.pageNum ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  if (pageNum > 1) {
    const excludeSessionIds = options.excludeSessionIds?.trim() || '';
    const { rows, hasMore } = await fetchCourseSessionPageRows('group', {
      ...options,
      pageNum,
      pageSize,
      excludeSessionIds,
    });
    return {
      cards: mapGroupCards(rows),
      excludeSessionIds,
      pageNum,
      hasMore,
    };
  }

  const recommended = await fetchRecommendSessionRows('group', options);
  const excludeSessionIds = joinExcludeSessionIds(collectSessionIds(recommended));
  const { rows, hasMore } = await fetchCourseSessionPageRows('group', {
    ...options,
    pageNum: 1,
    pageSize,
    excludeSessionIds,
  });
  const recommendCards = mapGroupCards(recommended, { isRecommend: true });
  const listCards = mapGroupCards(rows);
  const seen = new Set(recommendCards.map(card => card.sessionId));
  return {
    cards: [
      ...recommendCards,
      ...listCards.filter(card => !seen.has(card.sessionId)),
    ],
    excludeSessionIds,
    pageNum: 1,
    hasMore,
  };
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
  /** 课程封面 */
  coverUri?: string;
  avatarUri?: string;
  /** 处方推荐条目 */
  isRecommend?: boolean;
  status?: number;
  bookedByMe: boolean;
  bookingId?: string;
  bookingInfo: BookingDialogInfo;
};

function formatOnlineWeekdayTime(item: CourseSessionItem) {
  const sessionDate = item.sessionDate?.trim() || '';
  const weekday = sessionDate
    ? WEEKDAY_LABELS[moment(sessionDate, 'YYYY-MM-DD').day()] || ''
    : '';
  const range = formatSessionTime(item.startTime, item.endTime);
  return weekday ? `${weekday} ${range}` : range;
}

export function mapOnlineSessionToCard(
  item: CourseSessionItem,
  options?: { isRecommend?: boolean },
): OnlineSessionCardView | null {
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
    coverUri: item.template?.coverOssUrl?.trim() || undefined,
    avatarUri: item.coachAvatarUrl?.trim() || undefined,
    isRecommend: Boolean(options?.isRecommend),
    status: item.status,
    bookedByMe: Boolean(item.bookedByMe),
    bookingInfo: mapBookingDialogInfo({
      ...item,
      template: {
        ...item.template,
        courseName: courseName,
      },
    }),
    ...(bookingId ? { bookingId } : {}),
  };
}

function mapOnlineCards(rows: CourseSessionItem[], options?: { isRecommend?: boolean }) {
  return rows
    .map(item => mapOnlineSessionToCard(item, options))
    .filter((item): item is OnlineSessionCardView => item != null);
}

/**
 * 线上课：先拉处方推荐，再拉分页列表并排除推荐 id
 */
export async function fetchRecommendOnlineSessions(
  options: SessionListQueryOptions,
): Promise<CourseSessionListPageResult<OnlineSessionCardView>> {
  const pageNum = options.pageNum ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  if (pageNum > 1) {
    const excludeSessionIds = options.excludeSessionIds?.trim() || '';
    const { rows, hasMore } = await fetchCourseSessionPageRows('online', {
      ...options,
      pageNum,
      pageSize,
      excludeSessionIds,
    });
    return {
      cards: mapOnlineCards(rows),
      excludeSessionIds,
      pageNum,
      hasMore,
    };
  }

  const recommended = await fetchRecommendSessionRows('online', options);
  const excludeSessionIds = joinExcludeSessionIds(collectSessionIds(recommended));
  const { rows, hasMore } = await fetchCourseSessionPageRows('online', {
    ...options,
    pageNum: 1,
    pageSize,
    excludeSessionIds,
  });
  const recommendCards = mapOnlineCards(recommended, { isRecommend: true });
  const listCards = mapOnlineCards(rows);
  const seen = new Set(recommendCards.map(card => card.sessionId));
  return {
    cards: [
      ...recommendCards,
      ...listCards.filter(card => !seen.has(card.sessionId)),
    ],
    excludeSessionIds,
    pageNum: 1,
    hasMore,
  };
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
      const msg = actionFailMsg(res, '预约失败，请稍后重试');
      if (isInsufficientBenefitMsg(msg)) {
        return {
          ok: false,
          msg,
          insufficientBenefit: true,
          remainCount: parseRemainCountFromMsg(msg, 0),
          needCount: 1,
        };
      }
      return { ok: false, msg };
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

/** 调整预约到新场次（同类型；不扣不退权益） */
export async function reschedulePrivateBooking(options: {
  oldBookingId: string;
  newSessionId: string;
}): Promise<CourseSessionActionResult> {
  const oldBookingId = String(options.oldBookingId ?? '').trim();
  const newSessionId = String(options.newSessionId ?? '').trim();
  if (!oldBookingId) return { ok: false, msg: '预约无效' };
  if (!newSessionId) return { ok: false, msg: '请选择新时段' };
  try {
    const res = await rescheduleMyBooking({ oldBookingId, newSessionId });
    if (!isResourceApiOk(res)) {
      return { ok: false, msg: actionFailMsg(res, '调整失败，请稍后重试') };
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
  /** 服务站 id */
  stationId: string;
  title: string;
  coachName: string;
  stationName: string;
  /** 课程类型文案，如：线上课 */
  courseTypeLabel: string;
  /** 课程分类名称，如：综合训练 */
  categoryLabel: string;
  /** 课程标签（逗号分割解析后） */
  courseTags: string[];
  enrollText: string;
  /** 信息栏时间，如：10:15-11:15 */
  timeText: string;
  /** 上课日期 yyyy-MM-dd */
  sessionDate: string;
  startTime: string;
  endTime: string;
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
  /** 是否关联课程模板（无私教关联课程时不展示介绍区） */
  hasLinkedCourse: boolean;
  /** 教练用户 id */
  coachUserId?: string;
  /** 教练头像 */
  avatarUri?: string;
  coverUri?: string;
  liveLink?: string;
  /** 场次状态：0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */
  status?: number;
  bookedCount: number;
  capacity?: number;
  bookedByMe: boolean;
  bookingId?: string;
  /** 当前用户预约状态：1.已预约 2.已取消 3.已核销 4.已爽约 */
  bookingStatus?: number;
};

/** 场次是否关联课程模板 */
export function hasLinkedCourseTemplate(item: CourseSessionItem) {
  if (item.templateId != null && String(item.templateId).trim()) return true;
  if (item.template?.templateId != null && String(item.template.templateId).trim()) {
    return true;
  }
  return Boolean(item.template?.courseName?.trim());
}

/** 详情信息栏时间：今天/明天/M月D日 + HH:mm-HH:mm */
export function formatOnlineDetailTime(item: CourseSessionItem) {
  const start = formatHm(item.startTime);
  const end = formatHm(item.endTime);
  const range = start && end ? `${start}-${end}` : start || end || '';
  const sessionDate = item.sessionDate?.trim() || '';
  if (!sessionDate) return range;

  const m = moment(sessionDate, 'YYYY-MM-DD');
  if (!m.isValid()) return range;

  const today = moment().startOf('day');
  const diff = m.clone().startOf('day').diff(today, 'days');
  let dayLabel = m.format('M月D日');
  if (diff === 0) dayLabel = '今天';
  else if (diff === 1) dayLabel = '明天';

  return range ? `${dayLabel} ${range}` : dayLabel;
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

/** 模板封面：优先 listCoverOssUrl，其次 coverOssUrl */
function resolveTemplateCoverUri(item: CourseSessionItem) {
  return (
    item.template?.listCoverOssUrl?.trim() ||
    item.template?.coverOssUrl?.trim() ||
    undefined
  );
}

/** 映射集体课详情 */
export function mapGroupCourseDetail(item: CourseSessionItem): OnlineCourseDetailView | null {
  const base = mapCourseSessionDetail(item, {
    courseTypeLabel: '集体课',
    titleFallback: '集体课',
  });
  if (!base) return null;
  return {
    ...base,
    coverUri: resolveTemplateCoverUri(item),
  };
}

/** 映射私教课详情 */
export function mapPrivateCourseDetail(item: CourseSessionItem): OnlineCourseDetailView | null {
  const base = mapCourseSessionDetail(item, {
    courseTypeLabel: '私教课',
    titleFallback: '一对一私教训练',
  });
  if (!base) return null;
  const specialty = item.coachSpecialtyDirection?.trim() || '';
  const certificate = item.coachCertificate?.trim() || '';
  return {
    ...base,
    certificateText: certificate,
    specialtyText: specialty,
    // 仅用课程封面；无封面时由详情页默认图兜底
    coverUri: item.template?.coverOssUrl?.trim() || undefined,
  };
}

/** 用教练详情覆盖资格证书 / 擅长方向 / 姓名 / 头像（封面不回退教练头像） */
export function applyCoachUserToDetail(
  detail: OnlineCourseDetailView,
  coach: CoachUserInfo | null | undefined,
): OnlineCourseDetailView {
  if (!coach) return detail;
  const certificate = coach.qualificationCert?.trim() || '';
  const specialty = coach.specialtyDirection?.trim() || '';
  const realName = coach.realName?.trim() || '';
  const avatarUri = coach.avatarOssUrl?.trim() || '';
  const coachUserId =
    coach.userId != null && String(coach.userId).trim()
      ? String(coach.userId).trim()
      : detail.coachUserId;
  return {
    ...detail,
    certificateText: certificate || detail.certificateText,
    specialtyText: specialty || detail.specialtyText,
    coachName: realName || detail.coachName,
    avatarUri: avatarUri || detail.avatarUri,
    ...(coachUserId ? { coachUserId } : {}),
  };
}

/** @deprecated 使用 applyCoachUserToDetail */
export const applyCoachUserToPrivateDetail = applyCoachUserToDetail;

/** 场次项上的预约状态（若接口已回填） */
function pickItemBookingStatus(item: CourseSessionItem): number | undefined {
  if (item.bookingStatus != null && String(item.bookingStatus).trim() !== '') {
    return Number(item.bookingStatus);
  }
  return undefined;
}

/** 补齐详情上的预约状态（签到核销/缺席后用于底部操作） */
async function withResolvedBookingStatus(
  detail: OnlineCourseDetailView,
  options?: { bookingStatusHint?: number | null },
): Promise<OnlineCourseDetailView> {
  const hint = options?.bookingStatusHint;
  if (hint != null && String(hint).trim() !== '') {
    return { ...detail, bookingStatus: Number(hint) };
  }
  if (detail.bookingStatus != null) return detail;
  // 已预约、有 bookingId、进行中/已结束（签到或缺席后可能已清 bookedByMe）时再查
  if (
    !detail.bookedByMe &&
    !detail.bookingId &&
    detail.status !== 4 &&
    detail.status !== 5
  ) {
    return detail;
  }
  const bookingStatus = await fetchMyBookingStatusForSession({
    sessionId: detail.sessionId,
    bookingId: detail.bookingId,
  });
  if (bookingStatus == null) return detail;
  return { ...detail, bookingStatus };
}

async function fetchCourseDetailWithCoach(
  mapDetail: (item: CourseSessionItem) => OnlineCourseDetailView | null,
  sessionId?: string | number | null,
  bookingStatusHint?: number | null,
): Promise<OnlineCourseDetailView | null> {
  const item = await fetchCourseSessionDetail(sessionId);
  if (!item) return null;
  const detail = mapDetail(item);
  if (!detail) return null;
  const [coach, withBooking] = await Promise.all([
    fetchCoachUserDetail(item.coachUserId),
    withResolvedBookingStatus(detail, { bookingStatusHint }),
  ]);
  return applyCoachUserToDetail(withBooking, coach);
}

/** 拉取私教课详情（含教练信息） */
export async function fetchPrivateCourseDetail(
  sessionId?: string | number | null,
  bookingStatusHint?: number | null,
): Promise<OnlineCourseDetailView | null> {
  return fetchCourseDetailWithCoach(mapPrivateCourseDetail, sessionId, bookingStatusHint);
}

/** 拉取集体课详情（含教练信息） */
export async function fetchGroupCourseDetail(
  sessionId?: string | number | null,
  bookingStatusHint?: number | null,
): Promise<OnlineCourseDetailView | null> {
  return fetchCourseDetailWithCoach(mapGroupCourseDetail, sessionId, bookingStatusHint);
}

/** 拉取线上课详情（含教练信息） */
export async function fetchOnlineCourseDetail(
  sessionId?: string | number | null,
  bookingStatusHint?: number | null,
): Promise<OnlineCourseDetailView | null> {
  return fetchCourseDetailWithCoach(mapOnlineCourseDetail, sessionId, bookingStatusHint);
}

function mapCourseSessionDetail(
  item: CourseSessionItem,
  options: { courseTypeLabel: string; titleFallback: string },
): OnlineCourseDetailView | null {
  const sessionId = toSessionId(item.sessionId);
  if (!sessionId) return null;
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  const bookingStatus = pickItemBookingStatus(item);
  const stationId =
    item.stationId != null && String(item.stationId).trim()
      ? String(item.stationId).trim()
      : item.template?.stationId != null && String(item.template.stationId).trim()
        ? String(item.template.stationId).trim()
        : '';
  const courseName = item.template?.courseName?.trim() || options.titleFallback;
  const coachName = item.coachRealName?.trim() || '教练待定';
  const coachUserId =
    item.coachUserId != null && String(item.coachUserId).trim()
      ? String(item.coachUserId).trim()
      : '';
  const stationName =
    item.stationName?.trim() || item.template?.stationName?.trim() || '';
  const platformLabel =
    item.livePlatformLabel?.trim() || item.livePlatform?.trim() || '';
  const categoryLabel = item.template?.courseCategoryLabel?.trim() || '';
  const courseTags = parseSessionTags(item.template?.courseTags);
  const crowd = item.template?.applicableCrowd?.trim() || '';
  const equipment = item.template?.requiredEquipment?.trim() || '';
  const bookedCount =
    typeof item.bookedCount === 'number' && Number.isFinite(item.bookedCount)
      ? item.bookedCount
      : 0;
  return {
    sessionId,
    stationId,
    title: courseName,
    coachName,
    stationName,
    courseTypeLabel: options.courseTypeLabel,
    categoryLabel,
    courseTags,
    enrollText: formatCapacityText(item),
    timeText: formatOnlineDetailTime(item),
    sessionDate: item.sessionDate?.trim() || '',
    startTime: formatHm(item.startTime),
    endTime: formatHm(item.endTime),
    platformLabel,
    suitText: crowd,
    prepareText: equipment ? `准备：${equipment}` : '',
    introText: item.template?.courseIntro?.trim() || '',
    pointsText: item.template?.coursePoints?.trim() || '',
    certificateText: item.coachCertificate?.trim() || '',
    specialtyText: item.coachSpecialtyDirection?.trim() || '',
    hasLinkedCourse: hasLinkedCourseTemplate(item),
    coverUri: item.template?.coverOssUrl?.trim() || undefined,
    avatarUri: item.coachAvatarUrl?.trim() || undefined,
    liveLink: item.liveLink?.trim() || undefined,
    status: item.status,
    bookedCount,
    capacity: item.capacity,
    bookedByMe: Boolean(item.bookedByMe),
    ...(coachUserId ? { coachUserId } : {}),
    ...(bookingId ? { bookingId } : {}),
    ...(bookingStatus != null ? { bookingStatus } : {}),
  };
}
