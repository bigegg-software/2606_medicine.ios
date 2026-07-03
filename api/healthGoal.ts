import request from '@/utils/axios';

export type HealthTestItemVo = {
  healthTestItemId?: number;
  testName?: string;
  referenceStandard?: string;
  estimatedTime?: string;
  recommendFrequency?: string;
  testDescription?: string;
  testSteps?: string;
  resultRecord?: string;
  unit?: string;
  improveDirection?: number;
  precautions?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
};

export type HealthGoalVo = {
  healthGoalId?: number;
  targetCategory?: string;
  goalName?: string;
  assessmentType?: string;
  assessmentValue?: string;
  assessmentValueName?: string;
  healthTestItemVo?: HealthTestItemVo;
  status?: number;
  createTime?: string;
  updateTime?: string;
};

export type HealthGoalTarget = {
  healthGoalId?: number;
  complianceImproveType?: number;
  compliantTypes?: string[];
  healthGoalVo?: HealthGoalVo;
  compliantPercent?: number;
  xuezhiTcRate?: number;
  xuezhiTcImproveDirection?: number;
  xuezhiTgRate?: number;
  xuezhiTgImproveDirection?: number;
  xuezhiHdlCRate?: number;
  xuezhiHdlCImproveDirection?: number;
  xuezhiLdlCRate?: number;
  xuezhiLdlCImproveDirection?: number;
  improveDirectionVal?: number;
  exImpRate?: number;
  /** 改善进度百分比 0-100 */
  improvePercent?: number;
  /** 指标是否下降 1.是 */
  indicatorDeclined?: number;
};

export type HealthGoalInfo = HealthGoalVo;

export const getHealthGoalInfo = (healthGoalId: string | number) =>
  request.get<{ code?: number; data?: HealthGoalInfo }>('/patient/healthGoal/getInfo', {
    params: { healthGoalId },
  });
