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
  stopReason?: string;
  stopTime?: string;
  updateTime?: string;
  createTime?: string;
};

export const getInUseExPatientRuleInfo = () =>
  request.get<ExPatientRuleInfo>('/patient/exPatientRule/getInUseInfo');

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
