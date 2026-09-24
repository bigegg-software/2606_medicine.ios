import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** 课程类型：private / group / online */
export type CourseSessionType = 'private' | 'group' | 'online';

export type CourseSessionCoachItem = {
  coachUserId?: number | string;
  /** 教练姓名（sys_user.realName） */
  coachRealName?: string;
};

export type CourseSessionQueryParams = {
  /** 所属服务站id，必填 */
  stationId: string;
  courseType?: CourseSessionType | string;
  courseCategory?: string;
  coachUserId?: string;
  /** 上课日期起（含）yyyy-MM-dd；不传默认今日 */
  startDate?: string;
  /** 上课日期止（含）yyyy-MM-dd；不传默认今日+13 */
  endDate?: string;
  /** 查询时段开始 HH:mm */
  startTime?: string;
  /** 查询时段结束 HH:mm */
  endTime?: string;
  /** 排除的场次id，多个英文逗号分隔 */
  excludeSessionIds?: string;
  pageSize?: number | string;
  pageNum?: number | string;
};

export type CourseTemplateInfo = {
  templateId?: number | string;
  stationId?: number | string;
  stationName?: string;
  courseType?: string;
  courseCategory?: string;
  courseCategoryLabel?: string;
  capacity?: number;
  courseName?: string;
  defaultDuration?: number;
  coverOssId?: number | string;
  coverOssUrl?: string;
  courseTags?: string;
  applicableCrowd?: string;
  requiredEquipment?: string;
  courseIntro?: string;
  coursePoints?: string;
  status?: number;
  delFlag?: string;
  createTime?: string;
  updateTime?: string;
};

export type CourseSessionItem = {
  sessionId?: number | string;
  stationId?: number | string;
  stationName?: string;
  courseType?: string;
  coachUserId?: number | string;
  coachRealName?: string;
  coachAvatarOssId?: number | string;
  coachAvatarUrl?: string;
  /** 教练擅长方向 */
  coachSpecialtyDirection?: string;
  /** 教练资格证书 */
  coachCertificate?: string;
  templateId?: number | string;
  template?: CourseTemplateInfo;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  /** 课程容量；-1 表示不限 */
  capacity?: number;
  livePlatform?: string;
  livePlatformLabel?: string;
  liveLink?: string;
  /** 0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */
  status?: number;
  publishTime?: string;
  cancelReason?: string;
  bookedCount?: number;
  bookedByMe?: boolean;
  /** 当前用户预约 id（若列表回填） */
  bookingId?: number | string;
  delFlag?: string;
  createTime?: string;
  updateTime?: string;
};

export type CourseSessionCoachListResult = ApiResult & {
  data?: CourseSessionCoachItem[];
};

export type CourseSessionPageResult = ApiResult & {
  total?: number;
  rows?: CourseSessionItem[];
};

/** 我的预约（含关联场次） */
export type CourseSessionBookingItem = {
  bookingId?: number | string;
  sessionId?: number | string;
  session?: CourseSessionItem;
  userId?: number | string;
  userRealName?: string;
  name?: string;
  phonenumber?: string;
  stationId?: number | string;
  courseType?: string;
  coachUserId?: number | string;
  coachRealName?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  /** 1.已预约 2.已取消 3.已核销 4.已爽约 */
  status?: number;
  verifyType?: number;
  verifyBy?: number | string;
  verifyTime?: string;
  cancelReason?: string;
  cancelBy?: number | string;
  cancelTime?: string;
  createTime?: string;
  delFlag?: string;
};

export type CourseSessionMyBookingNextParams = {
  courseType?: CourseSessionType | string;
  stationId?: string;
  coachUserId?: string;
  /** 预约状态：1.已预约 2.已取消 3.已核销 4.已爽约 */
  status?: number | string;
  /** 排除的预约 id，多个英文逗号分隔 */
  excludeBookingIds?: string;
  /** 上课日期排序：asc / desc */
  sessionDateOrder?: 'asc' | 'desc' | string;
  /** 开课时间排序：asc / desc */
  startTimeOrder?: 'asc' | 'desc' | string;
};

export type CourseSessionMyBookingNextResult = ApiResult & {
  data?: CourseSessionBookingItem | null;
};

export type CourseSessionMyBookingPageParams = CourseSessionMyBookingNextParams & {
  pageSize?: number | string;
  pageNum?: number | string;
};

export type CourseSessionMyBookingPageResult = ApiResult & {
  total?: number;
  rows?: CourseSessionBookingItem[];
};

function buildCourseSessionParams(params: CourseSessionQueryParams) {
  return {
    ...params,
    stationId: String(params.stationId),
    ...(params.coachUserId != null && String(params.coachUserId).trim()
      ? { coachUserId: String(params.coachUserId).trim() }
      : {}),
  };
}

function buildMyBookingNextParams(params: CourseSessionMyBookingNextParams) {
  return {
    ...params,
    ...(params.stationId != null && String(params.stationId).trim()
      ? { stationId: String(params.stationId).trim() }
      : {}),
    ...(params.coachUserId != null && String(params.coachUserId).trim()
      ? { coachUserId: String(params.coachUserId).trim() }
      : {}),
    ...(params.status != null ? { status: String(params.status) } : {}),
  };
}

/** 当前服务站可预约教练姓名列表（条件同排期；仅在职） */
export const getCourseSessionCoachList = (params: CourseSessionQueryParams) =>
  request.get<CourseSessionCoachListResult>('/patient/courseSession/coach/list', {
    params: buildCourseSessionParams(params),
  });

/** 未来 14 天排期分页（服务站id必填；status=1～5） */
export const getCourseSessionPage = (params: CourseSessionQueryParams) =>
  request.get<CourseSessionPageResult>('/patient/courseSession/page', {
    params: buildCourseSessionParams(params),
  });

export type CourseSessionInfoResult = ApiResult & {
  data?: CourseSessionItem;
};

/** 排期场次详情（回填模板、已约人数、当前用户是否已预约及 bookingId） */
export const getCourseSessionInfo = (sessionId: string) =>
  request.get<CourseSessionInfoResult>('/patient/courseSession/getInfo', {
    params: { sessionId: String(sessionId) },
  });

/** 下一次待上课预约（已预约且场次未结束） */
export const getMyBookingNext = (params?: CourseSessionMyBookingNextParams) =>
  request.get<CourseSessionMyBookingNextResult>('/patient/courseSession/myBooking/next', {
    params: buildMyBookingNextParams(params ?? {}),
  });

/** 我的预约分页 */
export const getMyBookingPage = (params?: CourseSessionMyBookingPageParams) =>
  request.get<CourseSessionMyBookingPageResult>('/patient/courseSession/myBooking/page', {
    params: buildMyBookingNextParams(params ?? {}),
  });

/** 预约课程场次（冻结 1 次权益） */
export const bookCourseSession = (data: { sessionId: string }) =>
  request.post<ApiResult>('/patient/courseSession/book', {
    sessionId: String(data.sessionId),
  });

/** 用户取消预约（须开课前 24 小时，释放权益） */
export const cancelMyBooking = (data: { bookingId: string }) =>
  request.put<ApiResult>('/patient/courseSession/myBooking/cancel', {
    bookingId: String(data.bookingId),
  });
