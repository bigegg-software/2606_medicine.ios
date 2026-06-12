import request from '@/utils/axios';
import type { MedicationPlan } from '@/api/medicationPlan';

export type MedicationRecordAction = 0 | 1;

export type MedicationRecordPayload = {
  medicationPlanId: string | number;
  medicationPlanTime?: string;
  action: MedicationRecordAction;
};

export type MedicationRecordItem = {
  medicationRecordId?: number;
  customerLocalDate?: string;
  medicationPlanId?: number;
  userId?: number;
  medicationPlanTime?: string;
  action?: MedicationRecordAction;
  actionTime?: string;
  snapshotRule?: MedicationPlan;
  dataType?: number;
  isManual?: number;
};

export type MedicationRecordDayGroup = {
  yyyyMMdd?: string;
  list?: MedicationRecordItem[];
};

export type MedicationRecordListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: MedicationRecordDayGroup[];
};

export type MedicationRecordStatis = {
  takeCount?: number;
  notTakeCount?: number;
  rate?: number;
};

export type MedicationRecordStatisResult = {
  code?: number;
  msg?: string;
  data?: MedicationRecordStatis;
};

export type ApiResult = {
  code?: number;
  msg?: string;
};

export const addMedicationRecord = (data: MedicationRecordPayload) =>
  request.post<ApiResult>('/patient/medicationRecord/add', data);

export const getMedicationRecordAll = (params: {
  action?: MedicationRecordAction;
  startDate?: string;
  endDate?: string;
  pageSize?: number;
  pageNum?: number;
}) => request.get<MedicationRecordListResult>('/patient/medicationRecord/allRecords', { params });

export const getMedicationRecordStatis = (params?: { startDate?: string; endDate?: string }) =>
  request.get<MedicationRecordStatisResult>('/patient/medicationRecord/statis', { params });
