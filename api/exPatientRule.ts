import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';
import type { UserBaseInfo } from './patient';

export type ExPatientRuleRatio = {
  exerciseType?: string;
  exerciseChildType?: string;
  strengthLevel?: string;
  ratio?: number;
  duration?: number;
  /** FITT-VP 参数，key 由前端约定 */
  fittVp?: Record<string, unknown>;
};

export type ExPatientRuleAiAnalysis = {
  title?: string;
  summary?: string;
};

/** 周训练安排中的单个动作项 */
export type ExWeekTrainingItem = {
  exVideoId?: string | number;
  duration?: number;
  kcal?: number;
  /** duration_min | group_number | keep_second_number */
  timerType?: string;
  durationMinVal?: number;
  groupVal?: number;
  numberVal?: number;
  keepSecondVal?: number;
};

export type ExWeekTrainingMainBlock = {
  cardioList?: ExWeekTrainingItem[];
  strengthList?: ExWeekTrainingItem[];
  flexibilityList?: ExWeekTrainingItem[];
  balanceList?: ExWeekTrainingItem[];
};

/** 每周训练安排：day 1=周一 ... 7=周日 */
export type ExWeekTrainingSchedule = {
  day?: number;
  isRest?: boolean;
  hotList?: ExWeekTrainingItem[];
  mainList?: ExWeekTrainingMainBlock[];
  coldList?: ExWeekTrainingItem[];
};

export type ExPatientRuleInfo = {
  exPatientRuleId?: string | number;
  patientUserId?: string | number;
  patientUserName?: string;
  realName?: string;
  coachUserId?: string | number;
  coachUserRealName?: string;
  /** 患者基本信息（getInfo 回填） */
  patientUserBaseInfo?: UserBaseInfo & {
    age?: number;
    idCard?: string;
    primaryDiagnosis?: string;
    diagnosticLabel?: string;
    riskLevel?: number;
  };
  prescriptionName?: string;
  recoveryUserId?: string | number;
  recoveryUserName?: string;
  recoveryOrgName?: string;
  diagnosis?: string;
  /** 诊断标签展示文案 */
  diagnosticLabel?: string;
  fitnessLevel?: string;
  trainingGoals?: string[];
  targetWeight?: number;
  startDate?: string;
  endDate?: string;
  exTemplateId?: string;
  needExerciseDuration?: number;
  needExerciseFrequency?: number;
  weekDuration?: number;
  weekKcal?: number;
  firstAdvanceWeeks?: string;
  strengthLevel?: string;
  ruleRatioList?: ExPatientRuleRatio[];
  remark?: string;
  extraRemark?: string;
  /** 调整处方的原因（编辑时填写） */
  adjustReason?: string;
  adjustTime?: string;
  /** 完成处方的总结（完成时填写） */
  completeSummary?: string;
  aiAnalysis?: ExPatientRuleAiAnalysis;
  weekTrainingScheduleList?: ExWeekTrainingSchedule[];
  status?: number;
  progress?: number;
  /** 处方主训练整体完成率 0-100 */
  mainCompleteRate?: number;
  progressInfo?: {
    complateNum?: number;
    needSumExNum?: number;
    complateRatio?: number;
    sumExerciseDuration?: number;
  };
  stopReason?: string;
  stopUserId?: string | number;
  stopUserName?: string;
  stopTime?: string;
  /** 处方版本号 */
  version?: number | string;
  updateTime?: string;
  createTime?: string;
  createBy?: string | number;
  createByName?: string;
};

export const getInUseExPatientRuleInfo = (
  options?: { patientUserId?: string | number | null },
) =>
  request.get<ExPatientRuleInfo>('/patient/exPatientRule/getInUseInfo', {
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const getExPatientRuleInfo = (
  exPatientRuleId: string,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleInfo }>(
    '/patient/exPatientRule/getInfo',
    {
      params: { exPatientRuleId: String(exPatientRuleId) },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export const getExPatientRuleSnapshotByDate = (
  params: { customerLocalDate: string; exPatientRuleId?: string | number | null },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleInfo }>(
    '/patient/exPatientRule/getSnapshotByDate',
    {
      params: {
        customerLocalDate: params.customerLocalDate,
        ...(params.exPatientRuleId != null && String(params.exPatientRuleId).trim() !== ''
          ? { exPatientRuleId: String(params.exPatientRuleId) }
          : {}),
      },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export type ExPatientRuleListParams = {
  status?: number | '';
  pageSize?: number;
  pageNum?: number;
};

export type ExPatientRuleListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: ExPatientRuleInfo[];
};

export const getExPatientRuleList = (params: ExPatientRuleListParams) =>
  request.get<ExPatientRuleListResult>('/patient/exPatientRule/list', { params });

/** 按处方查询调整原因记录（版本号、调整原因、调整时间） */
export type ExPatientRuleAdjustItem = {
  adjustId?: number | string;
  exPatientRuleId?: number | string;
  patientUserId?: number | string;
  version?: number | string;
  adjustReason?: string;
  adjustTime?: string;
};

export const getExPatientRuleAdjustList = (
  exPatientRuleId: string,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleAdjustItem[] }>(
    '/patient/exPatientRule/adjustList',
    {
      params: { exPatientRuleId: String(exPatientRuleId) },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

/** 主训练四模块整体完成率（按处方起止日期），完成率 0-100 */
export type ExPatientRuleModuleCompleteRate = {
  exPatientRuleId?: number | string;
  /** 处方整体完成率（主训练）0-100 */
  mainCompleteRate?: number;
  hotCompleteRate?: number;
  coldCompleteRate?: number;
  cardioCompleteRate?: number;
  strengthCompleteRate?: number;
  flexibilityCompleteRate?: number;
  balanceCompleteRate?: number;
};

export const getExPatientRuleModuleCompleteRate = (
  exPatientRuleId: string,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleModuleCompleteRate }>(
    '/patient/exPatientRule/moduleCompleteRate',
    {
      params: { exPatientRuleId },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

/** 指定日期主训练完成率及四模块完成率（0-100）；当日无该模块安排时对应字段为 null */
export type ExPatientRuleDayCompleteRate = {
  date?: string;
  /** 训练时长（主训练，分钟） */
  mainExerciseDuration?: number;
  exerciseKcal?: number;
  mainCompleteRate?: number;
  cardioCompleteRate?: number | null;
  strengthCompleteRate?: number | null;
  flexibilityCompleteRate?: number | null;
  balanceCompleteRate?: number | null;
  hotCompleteRate?: number | null;
  coldCompleteRate?: number | null;
};

export const getExPatientRuleDayCompleteRate = (
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleDayCompleteRate }>(
    '/patient/exPatientRule/dayCompleteRate',
    {
      params: { customerLocalDate: String(customerLocalDate) },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

/** 健康目标分项进度字段 */
export type ExPatientRuleHealthGoalProgressField = {
  fieldKey?: string;
  fieldName?: string;
  baseline?: number | null;
  target?: number | null;
  current?: number | null;
  /** 1 提高；-1 降低；无法判断为 null */
  direction?: number | null;
  /** 进度 0-100；缺数据时为 null */
  progress?: number | null;
};

export type ExPatientRuleHealthGoalProgressItem = {
  healthGoalId?: number | string;
  goalName?: string;
  fieldList?: ExPatientRuleHealthGoalProgressField[];
};

/** 指定处方健康目标各分项进度 */
export type ExPatientRuleHealthGoalProgress = {
  exPatientRuleId?: number | string;
  healthGoalProgressList?: ExPatientRuleHealthGoalProgressItem[];
  /** 本处方下进度最大的健康目标 */
  maxProcess?: ExPatientRuleHealthGoalProgressItem | null;
};

export const getExPatientRuleHealthGoalProgress = (exPatientRuleId: string | number) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleHealthGoalProgress }>(
    '/patient/exPatientRule/healthGoalProgress',
    { params: { exPatientRuleId: String(exPatientRuleId) } },
  );
