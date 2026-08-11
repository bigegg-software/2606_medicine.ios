import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** 运动打卡信息 */
export type ExUserSignInfo = {
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
  /** 今日主训练是否已全部完成（半完成也算完成） */
  mainTrainingCompleted?: boolean;
  /** 今日是否可打卡（主训练全部完成且尚未打卡） */
  canSign?: boolean;
  /** 进行中运动处方 id */
  exPatientRuleId?: number | string | null;
  /** 今日主训练项总数 */
  mainTotalCount?: number;
  /** 今日主训练已完成项数（含半完成） */
  mainCompleteCount?: number;
};

export type ExUserSignInfoResult = ApiResult<ExUserSignInfo>;

/** 获取运动打卡信息 */
export const getExUserSignInfo = () =>
  request.get<ExUserSignInfoResult>('/patient/ex/userSignInfo/getInfo');

/** 完成今日运动打卡（需当日主训练全部完成，半完成也算完成） */
export const postExUserSign = () =>
  request.post<ExUserSignInfoResult>('/patient/ex/userSignInfo/sign');
