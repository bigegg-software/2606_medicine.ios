import request from '@/utils/axios';

export type PointsRuleItem = {
  ruleId?: number | string;
  moduleCategory?: string;
  moduleCategoryName?: string;
  moduleSubKey?: string;
  moduleSubName?: string;
  bizType?: number;
  rewardPoints?: number | string;
  /** 上限类型 1.每日次数 2.每日积分 */
  limitType?: number;
  limitValue?: number | string;
  /** 是否启用 0.否 1.是 */
  enabled?: number;
  sortOrder?: number;
};

export type PointsRuleGroup = {
  moduleCategory?: string;
  moduleCategoryName?: string;
  rules?: PointsRuleItem[];
};

export type PointsRuleListResult = {
  code?: number;
  msg?: string;
  data?: PointsRuleGroup[];
};

/** 获取全部积分规则（按模块大类分组） */
export const getPointsRuleList = () =>
  request.get<PointsRuleListResult>('/patient/pointsConfig/ruleList');
