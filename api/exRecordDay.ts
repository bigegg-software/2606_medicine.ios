import request from '@/utils/axios';

export type ExRecordDayCalendarItem = {
  customerLocalDate?: string;
  isToday?: boolean;
  isComplate?: number;
  complateNum?: number;
  suNum?: number;
};

export type ExRecordDayCalendarResult = {
  code?: number;
  msg?: string;
  data?: ExRecordDayCalendarItem[];
};

export type ExRecordDayStatisData = {
  complateNum?: number;
  needSumExNum?: number;
  complateRatio?: number;
  sumExerciseDuration?: number;
};

export type ExRecordDayStatisResult = {
  code?: number;
  msg?: string;
  data?: ExRecordDayStatisData;
};

export const getExRecordDayCalendarList = (params: {
  exPatientRuleId: string;
  startDate: string;
  endDate: string;
}) => request.get<ExRecordDayCalendarResult>('/patient/exRecordDay/dayCalendarList', { params });

export const getExRecordDayStatis = (params: {
  exPatientRuleId: string;
  startDate: string;
  endDate: string;
}) => request.get<ExRecordDayStatisResult>('/patient/exRecordDay/statis', { params });
