import request from '@/utils/axios';

export type ExPatientRuleRatio = {
  exerciseType?: string;
  exerciseChildType?: string;
  strengthLevel?: string;
  ratio?: number;
  duration?: number;
};

export type ExPatientRuleInfo = {
  exPatientRuleId?: string;
  patientUserId?: string;
  patientUserName?: string;
  prescriptionName?: string;
  recoveryUserId?: string;
  recoveryUserName?: string;
  recoveryOrgName?: string;
  diagnosis?: string;
  startDate?: string;
  endDate?: string;
  exTemplateId?: string;
  needExerciseDuration?: number;
  needExerciseFrequency?: number;
  ruleRatioList?: ExPatientRuleRatio[];
  remark?: string;
  status?: number;
  progress?: number;
  progressInfo?: {
    complateNum?: number;
    needSumExNum?: number;
    complateRatio?: number;
    sumExerciseDuration?: number;
  };
  stopReason?: string;
  stopTime?: string;
  updateTime?: string;
  createTime?: string;
};

export const getInUseExPatientRuleInfo = () =>
  request.get<ExPatientRuleInfo>('/patient/exPatientRule/getInUseInfo');

export const getExPatientRuleInfo = (exPatientRuleId: string) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleInfo }>(
    '/patient/exPatientRule/getInfo',
    { params: { exPatientRuleId } },
  );

export const getExPatientRuleSnapshotByDate = (params: { customerLocalDate: string }) =>
  request.get<{ code?: number; msg?: string; data?: ExPatientRuleInfo }>(
    '/patient/exPatientRule/getSnapshotByDate',
    { params },
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
