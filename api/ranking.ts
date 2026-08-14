import request from '@/utils/axios';

/** 成长成果榜单项 */
export type GrowthRankingItem = {
  id?: number | string;
  userId?: number | string;
  nickName?: string;
  /** 头像 ossId 或 url */
  avatar?: number | string;
  /** 综合得分 */
  score?: number;
  /** 当月平均处方完成率（0-100） */
  completeRate?: number;
  /** 核心指标改善幅度得分（0-100） */
  improveScore?: number;
  /** 当月累计有效训练时长（分钟） */
  exerciseDuration?: number;
  /** 核心指标改善成果文案 */
  improveResult?: string;
  /** 排名 */
  sort?: number;
};

/** 活力打卡榜单项 */
export type VitalityRankingItem = {
  id?: number | string;
  userId?: number | string;
  nickName?: string;
  avatar?: number | string;
  /** 活力得分 */
  score?: number;
  /** 当月有效运动打卡天数 */
  signDays?: number;
  /** 打卡得分 */
  signScore?: number;
  /** 当月累计有效训练时长（分钟） */
  exerciseDuration?: number;
  /** 运动时长得分 */
  durationScore?: number;
  /** 排名 */
  sort?: number;
};

export type RankingListResult<T> = {
  code?: number;
  msg?: string;
  data?: T[];
};

/** @deprecated 旧积分榜，已由成长/活力榜替代 */
export type RankingItem = {
  id?: number;
  userId?: number;
  nickName?: string;
  tokens?: number;
  continuousDays?: number;
  avatar?: number | string;
  gender?: string | number;
  sort?: number;
};

/** 成长成果榜（当月综合得分前 100） */
export const getGrowthRankingList = () =>
  request.get<RankingListResult<GrowthRankingItem>>('/patient/ranking/growth/list');

/** 活力打卡榜（当月活力得分前 100） */
export const getVitalityRankingList = () =>
  request.get<RankingListResult<VitalityRankingItem>>('/patient/ranking/vitality/list');

/** @deprecated 使用 getGrowthRankingList / getVitalityRankingList */
export const getRankingList = () =>
  request.get<RankingListResult<RankingItem>>('/patient/ranking/list');
