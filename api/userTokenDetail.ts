import request from '@/utils/axios';

export type UserTokenDetail = {
  tokenDetailId?: number | string;
  rewardsTokens?: number | string;
  baseRewardsTokens?: number | string;
  tokens?: number | string;
  bizId?: number | string;
  bizType?: number;
  action?: string;
  actionDesc?: string;
  userId?: number | string;
  detailDate?: string;
  dataDate?: string;
  createTime?: string;
  params?: Record<string, unknown>;
};

export type UserTokenDetailListParams = {
  /** 收益类型：1-收入，-1-支出；不传为全部 */
  incomeType?: 1 | -1;
  bizType?: number;
  bizTypes?: string;
  /** 数据日期 yyyy-MM-dd */
  dataDate?: string;
  pageSize?: number;
  pageNum?: number;
};

export type UserTokenDetailListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: UserTokenDetail[];
};

/** 分页查询当前用户积分明细 */
export const getUserTokenDetailList = (params?: UserTokenDetailListParams) =>
  request.get<UserTokenDetailListResult>('/patient/userTokenDetail/list', { params });
