import request from '@/utils/axios';

export type CourseItem = {
  courseId?: number | string;
  coverOssId?: number | string;
  coverOssUrl?: string;
  title?: string;
  courseType?: string;
  instructor?: string;
  videoOssId?: number | string;
  videoOssUrl?: string;
  courseIntro?: string;
  courseDetail?: string;
  displayStatus?: number;
  displayStatusName?: string;
  viewCount?: number;
  favoriteCount?: number;
  likeCount?: number;
  isFavorited?: boolean;
  isLiked?: boolean;
  createTime?: string;
  updateTime?: string;
};

export type CourseListParams = {
  courseType?: string;
  pageSize?: number;
  pageNum?: number;
};

export type CourseListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: CourseItem[];
};

export type CourseInfoResult = {
  code?: number;
  msg?: string;
  data?: CourseItem;
};

export type CourseTogglePayload = {
  courseId: string;
  status: boolean;
};

export type CourseCompletePayload = {
  courseId: string;
};

export type CourseActionResult = {
  code?: number;
  msg?: string;
  data?: { status?: boolean };
};

export const getCourseList = (params?: CourseListParams) =>
  request.get<CourseListResult>('/patient/course/list', { params });

export const getCourseFavoriteList = (params?: CourseListParams) =>
  request.get<CourseListResult>('/patient/course/favoriteList', { params });

export const getCourseInfo = (courseId: string) =>
  request.get<CourseInfoResult>('/patient/course/getInfo', { params: { courseId } });

export const recordCourseView = (data: CourseTogglePayload) =>
  request.post<CourseActionResult>('/patient/course/recordView', data);

export const toggleCourseFavorite = (data: CourseTogglePayload) =>
  request.post<CourseActionResult>('/patient/course/toggleFavorite', data);

export const toggleCourseLike = (data: CourseTogglePayload) =>
  request.post<CourseActionResult>('/patient/course/toggleLike', data);

export const recordCourseComplete = (data: CourseCompletePayload) =>
  request.post<CourseActionResult>('/patient/course/recordComplete', data);
