import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type ServiceStationItem = {
  stationId?: number | string;
  stationName?: string;
  residentialProvince?: string;
  residentialCity?: string;
  residentialDistrict?: string;
  residentialStreet?: string;
  residentialAddress?: string;
  contactPhone?: string;
  directorName?: string;
  /** 0.禁用 1.启用 */
  status?: number;
  yihuUserCount?: number;
  coachUserCount?: number;
  yihuAssignedUserCount?: number;
  coachTrackingStudentCount?: number;
  createTime?: string;
  updateTime?: string;
};

export type ServiceStationListParams = {
  searchWords?: string;
  residentialProvince?: string;
  residentialCity?: string;
  residentialDistrict?: string;
  residentialStreet?: string;
  pageSize?: number;
  pageNum?: number;
};

export type ServiceStationListResult = ApiResult & {
  total?: number;
  rows?: ServiceStationItem[];
};

export type ServiceStationInfoResult = ApiResult & {
  data?: ServiceStationItem;
};

/** 分页查询启用中的服务站列表 */
export const getServiceStationList = (params?: ServiceStationListParams) =>
  request.get<ServiceStationListResult>('/patient/serviceStation/list', { params });

/** 获取服务站详情 */
export const getServiceStationInfo = (stationId: string) =>
  request.get<ServiceStationInfoResult>('/patient/serviceStation/getInfo', {
    params: { stationId: String(stationId) },
  });
