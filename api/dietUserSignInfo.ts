import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

/** 饮食打卡信息 */
export type DietUserSignInfo = {
  signInfoId?: number | string;
  userId?: number | string;
  /** 当前有效连续打卡天数 */
  continuousDays?: number;
  /** 历史连续打卡最大天数 */
  historyContinuousDays?: number;
  /** 最近一次打卡时间戳 */
  signTimestamp?: number;
  /** 最近一次打卡日期（北京时间） */
  signDateBj?: string;
  /** 今日是否已打卡 */
  signedToday?: boolean;
  /** 今日是否已记录早中晚三餐 */
  fullDayMealRecorded?: boolean;
  /** 今日是否可打卡（三餐齐全且尚未打卡） */
  canSign?: boolean;
};

export type DietUserSignInfoResult = ApiResult<DietUserSignInfo>;

/** 获取饮食打卡信息 */
export const getDietUserSignInfo = (options?: { patientUserId?: string | number | null }) =>
  request.get<DietUserSignInfoResult>('/patient/diet/userSignInfo/getInfo', {
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

/** 完成今日饮食打卡（需当日三餐均已记录） */
export const postDietUserSign = () =>
  request.post<DietUserSignInfoResult>('/patient/diet/userSignInfo/sign');
