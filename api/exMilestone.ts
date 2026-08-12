import request from '@/utils/axios';

/** 运动处方里程碑统计 */
export type ExMilestoneInfo = {
  /** 坚持天数 */
  persistDays?: number;
  /** 首次开始运动处方日期 yyyy-MM-dd */
  firstExerciseDate?: string;
  /** 累计训练时长（分钟） */
  exerciseDuration?: number;
  /** 累计课次 */
  totalLessons?: number;
  /** 平均完成率 0-100 */
  avgCompleteRate?: number;
  /** 改善指标数 */
  improveTargetCount?: number;
};

export type ExMilestoneInfoResult = {
  code?: number;
  msg?: string;
  data?: ExMilestoneInfo;
};

/** 近 6 个自然周统计（周一至周日，含本周，从早到晚） */
export type ExMilestoneWeekStat = {
  weekStartDate?: string;
  weekEndDate?: string;
  /** 本周总运动时长（分钟） */
  exerciseDuration?: number;
  cardioCompleteRate?: number;
  strengthCompleteRate?: number;
  flexibilityCompleteRate?: number;
  balanceCompleteRate?: number;
};

export type ExMilestoneWeekStatsResult = {
  code?: number;
  msg?: string;
  data?: ExMilestoneWeekStat[];
};

/** 指定处方的累计训练时长与累计课次 */
export type ExMilestoneRuleStat = {
  /** 累计训练时长（分钟） */
  exerciseDuration?: number;
  /** 累计课次 */
  totalLessons?: number;
};

export type ExMilestoneRuleStatResult = {
  code?: number;
  msg?: string;
  data?: ExMilestoneRuleStat;
};

/** 查询运动处方里程碑统计 */
export const getExMilestoneInfo = () =>
  request.get<ExMilestoneInfoResult>('/patient/exMilestone/getInfo');

/** 最近 6 个自然周统计 */
export const getExMilestoneRecentSixWeekStats = () =>
  request.get<ExMilestoneWeekStatsResult>('/patient/exMilestone/recentSixWeekStats');

/** 查询指定处方的累计训练时长与累计课次 */
export const getExMilestoneRuleStat = (exPatientRuleId: string | number) =>
  request.get<ExMilestoneRuleStatResult>('/patient/exMilestone/ruleStat', {
    params: { exPatientRuleId: String(exPatientRuleId) },
  });
