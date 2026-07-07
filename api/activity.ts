import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type ActivityItem = {
  activityId?: number | string;
  activityName?: string;
  activityType?: string;
  coverOssId?: number | string;
  coverOssUrl?: string;
  shareOssId?: number | string;
  shareOssUrl?: string;
  activityStartTime?: string;
  activityEndTime?: string;
  status?: number;
  statusName?: string;
  signupCount?: number;
  isPublished?: number;
  publishTime?: string;
  isSendWillStartTip?: number;
  activityLocation?: string;
  activityRemark?: string;
  signupLimit?: number;
  signupDeadline?: string;
  contactName?: string;
  contactPhone?: string;
  activityDetail?: string;
  isBm?: boolean;
  createTime?: string;
  updateTime?: string;
};

export type ActivityListParams = {
  activityType?: string;
  pageSize?: number;
  pageNum?: number;
};

export type ActivityListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: ActivityItem[];
};

export type ActivityInfoResult = ApiResult & {
  data?: ActivityItem;
};

export const getActivityFrontList = (params?: ActivityListParams) =>
  request.get<ActivityListResult>('/patient/activity/frontList', { params });

export const getActivityInfo = (activityId: string) =>
  request.get<ActivityInfoResult>(`/patient/activity/${activityId}`);

export const joinActivity = (activityId: string) =>
  request.post<ApiResult>('/patient/userActivity/add', { activityId });

export const leaveActivity = (activityId: string) =>
  request.post<ApiResult>('/patient/userActivity/delete', { activityId });
