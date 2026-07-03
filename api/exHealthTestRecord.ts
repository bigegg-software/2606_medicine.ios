import request from '@/utils/axios';

export type ExHealthTestRecord = {
  id?: number;
  userId?: number;
  exPatientRuleId?: number;
  healthTestItemId?: number;
  testValue?: number;
  createTime?: string;
  firstRecord?: boolean;
  changeValue?: number | null;
  firstChangePercent?: number | null;
};

export type FirstAndLatestHealthTestRecord = {
  firstRecord?: ExHealthTestRecord | null;
  latestRecord?: ExHealthTestRecord | null;
};

export const queryFirstAndLatestHealthTestRecord = (params: {
  exPatientRuleId: string | number;
  healthTestItemId: string | number;
  userId?: string | number;
}) =>
  request.get<{ code?: number; data?: FirstAndLatestHealthTestRecord }>(
    '/patient/exHealthTestRecord/queryFirstAndLatestRecord',
    { params },
  );

export type HealthTestRecordListParams = {
  exPatientRuleId: string | number;
  healthTestItemId: string | number;
  userId?: string | number;
  pageNum?: number;
  pageSize?: number;
};

export type HealthTestRecordListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: ExHealthTestRecord[];
};

export const listHealthTestRecords = (params: HealthTestRecordListParams) =>
  request.get<HealthTestRecordListResult>('/patient/exHealthTestRecord/list', { params });

export type AddExHealthTestRecordPayload = {
  exPatientRuleId: string;
  healthTestItemId: string;
  testValue: number;
};

export const addExHealthTestRecord = (data: AddExHealthTestRecordPayload) =>
  request.post<{ code?: number; msg?: string }>('/patient/exHealthTestRecord/add', data);
