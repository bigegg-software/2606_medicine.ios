import request from '@/utils/axios';
import { withPatientUserIdHeaders, type ApiResult } from '@/src/utils/apiHelpers';

export type TodayAbnormalListData = {
  /** 当日有异常的指标类型，如 ["血氧","血糖"] */
  list?: string[];
};

export type TodayAbnormalListResult = ApiResult<TodayAbnormalListData>;

/** 查询当前患者今日有异常的指标类型 */
export const getTodayAbnormalList = (options?: {
  patientUserId?: string | number | null;
}) =>
  request.get<TodayAbnormalListResult>('/patient/todayAbnormal/list', {
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });
