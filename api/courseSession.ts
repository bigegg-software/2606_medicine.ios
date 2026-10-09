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
  /** 与 coverOssUrl 同级；详情封面优先使用 */
  listCoverOssUrl?: string;
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
  /** 当前用户预约状态：1.已预约 2.已取消 3.已核销 4.已爽约（若详情/列表回填） */
  bookingStatus?: number;
  /** 核销方式：1.学员签到 2.管理员核销 3.教练核销（若回填） */
  verifyType?: number;
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
  /** 预约状态：1.已预约 2.已取消 3.已核销 4.已爽约；多个英文逗号分隔 */
  status?: number | string;
  /** 上课日期 yyyy-MM-dd */
  sessionDate?: string;
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
    ...(params.sessionDate != null && String(params.sessionDate).trim()
      ? { sessionDate: String(params.sessionDate).trim() }
      : {}),
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

/** 按日起止与课程类型查询每日是否有场次 */
export type CourseSessionDateHasItem = {
  /** 上课日期 yyyy-MM-dd */
  date?: string;
  /** 该日是否有场次 */
  hasCourseSession?: boolean;
};

export type CourseSessionDateHasListParams = {
  /** 所属服务站id（可选） */
  stationId?: string;
  /** 教练用户id（可选；调整时间等场景限定当前教练） */
  coachUserId?: string;
  /** 上课日期起（含）yyyy-MM-dd */
  startDate: string;
  /** 上课日期止（含）yyyy-MM-dd */
  endDate: string;
  /** 课程类型：private / group / online */
  courseType: CourseSessionType | string;
};

export type CourseSessionDateHasListResult = ApiResult & {
  data?: CourseSessionDateHasItem[];
};

function buildDateHasListParams(params: CourseSessionDateHasListParams) {
  return {
    startDate: String(params.startDate).trim(),
    endDate: String(params.endDate).trim(),
    courseType: String(params.courseType).trim(),
    ...(params.stationId != null && String(params.stationId).trim()
      ? { stationId: String(params.stationId).trim() }
      : {}),
    ...(params.coachUserId != null && String(params.coachUserId).trim()
      ? { coachUserId: String(params.coachUserId).trim() }
      : {}),
  };
}

/** 排期场次详情（回填模板、已约人数、当前用户是否已预约及 bookingId） */
export const getCourseSessionInfo = (sessionId: string) =>
  request.get<CourseSessionInfoResult>('/patient/courseSession/getInfo', {
    params: { sessionId: String(sessionId) },
  });

export type CourseSessionRecommendInStoreResult = ApiResult & {
  data?: CourseSessionItem[];
};

/**
 * 推荐到店训练（首页卡片）：已预约未上课优先；再按处方匹配教练；不足则随机；最多 2 条
 * stationId 必填
 */
export const getRecommendInStoreCourseSessions = (params: CourseSessionQueryParams) =>
  request.get<CourseSessionRecommendInStoreResult>('/patient/courseSession/recommend/inStore', {
    params: buildCourseSessionParams(params),
  });

/** 推荐私教课程排次（按运动处方训练目标匹配教练擅长方向，最多 2 条） */
export const getRecommendPrivateCourseSessions = (params: CourseSessionQueryParams) =>
  request.get<CourseSessionRecommendInStoreResult>('/patient/courseSession/recommend/private', {
    params: buildCourseSessionParams(params),
  });

/** 推荐集体课排次（按主诊断/健康标签与适合人群匹配，最多 2 条） */
export const getRecommendGroupCourseSessions = (params: CourseSessionQueryParams) =>
  request.get<CourseSessionRecommendInStoreResult>('/patient/courseSession/recommend/group', {
    params: buildCourseSessionParams(params),
  });

/** 推荐线上课排次（按主诊断/健康标签与适合人群匹配，最多 2 条） */
export const getRecommendOnlineCourseSessions = (params: CourseSessionQueryParams) =>
  request.get<CourseSessionRecommendInStoreResult>('/patient/courseSession/recommend/online', {
    params: buildCourseSessionParams(params),
  });

/** 按日起止与课程类型查询每日是否有场次（status=1～5） */
export const getCourseSessionDateHasList = (params: CourseSessionDateHasListParams) =>
  request.get<CourseSessionDateHasListResult>('/patient/courseSession/dateHasList', {
    params: buildDateHasListParams(params),
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

/**
 * 用户调整预约：原场次开课前 ≥24h 可改；不扣不退权益；须同课程类型且新场次可约
 */
export const rescheduleMyBooking = (data: {
  oldBookingId: string;
  newSessionId: string;
}) =>
  request.put<ApiResult>('/patient/courseSession/myBooking/reschedule', {
    oldBookingId: String(data.oldBookingId),
    newSessionId: String(data.newSessionId),
  });

/**
 * 按签到码签到：核销本人该场次已预约记录（核销方式=学员签到；仅上课当日可操作）
 */
export const checkInMyBooking = (data: { checkInCode: string }) =>
  request.put<ApiResult>('/patient/courseSession/myBooking/checkIn', {
    checkInCode: String(data.checkInCode),
  });
