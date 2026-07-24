import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type UserSignInfoRecord = {
  signInfoId?: string;
  userId?: string;
  continuousDays?: number;
  historyContinuousDays?: number;
  signTimestamp?: number;
  signDateBj?: string;
};

export type UserSignInfoSummary = {
  userSignInfo?: UserSignInfoRecord;
  addedRewardsTokensSum?: string;
  baseRewardsTokensSum?: string;
  mlestoneDayRuleList?: unknown[];
  rewardsTokensSum?: string;
  nextMlestoneAddRatio?: string;
  nextMlestoneDays?: number;
};

/** 每日签到成功返回 */
export type UserSignResult = {
  /** 本次签到获得积分 */
  rewardsTokens?: string | number;
  /** 提示信息 */
  tipMsg?: string;
  /** 当前连续签到天数 */
  continuousDays?: number;
  /** 签到页汇总（与 getInfo 一致） */
  signInfo?: UserSignInfoSummary;
};

export type UserSignApiResult = ApiResult<UserSignResult>;

/** 签到提示文案（data 为字符串） */
export type UserSignTipResult = ApiResult<string>;

/** 每日签到：写入记录并发放积分 */
export const postUserSign = () =>
  request.post<UserSignApiResult>('/patient/userSignInfo/sign');

/** 根据当前登录用户签到信息返回提示文案 */
export const getUserSignTip = () =>
  request.get<UserSignTipResult>('/patient/userSignInfo/signTip');
