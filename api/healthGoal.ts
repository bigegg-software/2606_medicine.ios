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
  /** 计时类型 -1.倒计时 0.无 1.正向计时 */
  timerType?: number;
  /** 倒计时或计时秒数 */
  timerSeconds?: number;
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

export type HealthGoalMetricPair = {
  baseline?: number;
  target?: number;
};

export type HealthGoalBloodPressureTarget = {
  sbpBaseline?: number;
  sbpTarget?: number;
  dbpBaseline?: number;
  dbpTarget?: number;
};

export type HealthGoalBloodLipidTarget = {
  tc?: HealthGoalMetricPair;
  tg?: HealthGoalMetricPair;
  hdlC?: HealthGoalMetricPair;
  ldlC?: HealthGoalMetricPair;
};

export type HealthGoalJointRomTarget = {
  shoulderFlexion?: HealthGoalMetricPair;
  shoulderAbduction?: HealthGoalMetricPair;
  elbowFlexion?: HealthGoalMetricPair;
  hipFlexion?: HealthGoalMetricPair;
  kneeFlexion?: HealthGoalMetricPair;
  ankleDorsiflexion?: HealthGoalMetricPair;
};

export type HealthGoalTarget = {
  healthGoalId?: number;
  complianceImproveType?: number;
  compliantTypes?: string[];
  healthGoalVo?: HealthGoalVo;
  bloodPressure?: HealthGoalBloodPressureTarget;
  bloodGlucose?: HealthGoalMetricPair;
  bloodLipid?: HealthGoalBloodLipidTarget;
  weight?: HealthGoalMetricPair;
  /** 尿酸达标配置（基线值与目标值），单位 μmol/L */
  uricAcid?: HealthGoalMetricPair;
  healthTest?: HealthGoalMetricPair;
  jointRom?: HealthGoalJointRomTarget;
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
  tiZhongRate?: number;
  tiZhongImproveDirection?: number;
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
