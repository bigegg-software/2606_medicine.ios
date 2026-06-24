import request from '@/utils/axios';

export type ExPatientRuleRatio = {
  exerciseType?: string;
  exerciseChildType?: string;
  strengthLevel?: string;
  ratio?: number;
  duration?: number;
};

export type ProgressInfo = {
  complateNum?: number;
  needSumExNum?: number;
  complateRatio?: number;
  sumExerciseDuration?: number;
};

export type InUseExPatientRule = {
  exPatientRuleId?: string | number;
  prescriptionName?: string;
  diagnosis?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  status?: number;
  ruleRatioList?: ExPatientRuleRatio[];
  progressInfo?: ProgressInfo;
  remark?: string;
};

export type HistoryExPatientRule = {
  exPatientRuleId?: string | number;
  prescriptionName?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
  stopReason?: string;
  stopTime?: string;
  updateTime?: string;
  createTime?: string;
};

export type HistoryListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: HistoryExPatientRule[];
};

export type HistoryListParams = {
  status: number;
  pageSize: number;
  pageNum: number;
};

export type WeekCalendarParams = {
  exPatientRuleId: string;
  startDate: string;
  endDate: string;
};

export type WeekCalendarItem = {
  customerLocalDate?: string;
  isToday?: boolean;
  isComplate?: number;
  complateNum?: number;
  suNum?: number;
};

export type WeekCalendarResult = {
  code?: number;
  msg?: string;
  data?: WeekCalendarItem[];
};

export type DayTypeChildItem = {
  exerciseChildType?: string;
  exerciseDuration?: number;
};

export type DayTypeDetailItem = {
  customerLocalDate?: string;
  exerciseType?: string;
  exerciseChildType?: string;
  typeNeedExerciseDuration?: number;
  typeSumExerciseDuration?: number;
  childTypeList?: DayTypeChildItem[];
};

export type DayTypeDetailParams = {
  customerLocalDate: string;
  exPatientRuleId: string;
};

export type DayTypeDetailResult = {
  code?: number;
  msg?: string;
  data?: DayTypeDetailItem[];
};

export type ExerciseTypeStatisItem = {
  exerciseType?: string;
  complateRatio?: number;
};

export type ExerciseTypeStatisResult = {
  code?: number;
  msg?: string;
  data?: ExerciseTypeStatisItem[];
};

export const getInUseExPatientRuleInfo = () =>
  request.get<{ code?: number; data?: InUseExPatientRule }>('/patient/exPatientRule/getInUseInfo');

export const getHistoryExPatientRuleList = (params: HistoryListParams) =>
  request.get<HistoryListResult>('/patient/exPatientRule/list', { params });

export const getScheduleWeekCalendarList = (params: WeekCalendarParams) =>
  request.get<WeekCalendarResult>('/patient/exRecordDay/dayCalendarList', { params });

export const getDayTypeListDetailByCustomerLocalDate = (params: DayTypeDetailParams) =>
  request.get<DayTypeDetailResult>('/patient/exRecordDayType/dayTypeListDetailByCustomerLocalDate', { params });

export const getExerciseTypeStatis = (params: { exPatientRuleId: string }) =>
  request.get<ExerciseTypeStatisResult>('/patient/exRecordDay/exerciseTypeStatis', { params });
