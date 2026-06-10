import request from '@/utils/axios';

export type MedicationPlan = {
  medicationPlanId?: number | null;
  userId?: number;
  name?: string;
  amount?: string;
  amountUnit?: string;
  medicationFrequency?: number;
  timeList?: string[];
  eventBased?: string;
  startDate?: string;
  endDate?: string;
  daysWeek?: number[];
  drugType?: string;
  isEnable?: number;
  dataType?: number;
  remark?: string;
  courseTreatment?: number;
  planType?: number;
  drugPatientRuleId?: number;
  createBy?: number;
  createByName?: string;
  createTime?: string;
};

export type MedicationPlanPayload = {
  medicationPlanId?: number | null;
  name: string;
  amount: string;
  amountUnit: string;
  medicationFrequency: number;
  timeList: string[];
  eventBased: string;
  startDate: string;
  endDate?: string;
  daysWeek?: number[];
  drugType: string;
  isEnable: number;
  dataType: number;
  remark?: string;
  courseTreatment: number;
};

export type ApiResult = {
  code?: number;
  msg?: string;
};

export type MedicationPlanInfoResult = ApiResult & {
  data?: MedicationPlan;
};

export type IndexMedicationPlanItem = {
  healthMedicationPlan?: MedicationPlan;
  dataType?: number;
  medicationPlanTime?: string;
  isAllDay?: number;
  action?: number | null;
  actionTime?: string;
};

export type IndexMedicationPlanResult = ApiResult & {
  data?: IndexMedicationPlanItem[];
};

export const getIndexMedicationPlan = () =>
  request.get<IndexMedicationPlanResult>('/patient/medicationPlan/indexPlan');

export const getMedicationPlanInfo = (medicationPlanId: number | string) =>
  request.get<MedicationPlanInfoResult>('/patient/medicationPlan/getInfo', {
    params: { medicationPlanId },
  });

export const addMedicationPlan = (data: MedicationPlanPayload) =>
  request.post<ApiResult>('/patient/medicationPlan/add', data);

export const updateMedicationPlan = (data: MedicationPlanPayload & { medicationPlanId: number }) =>
  request.put<ApiResult>('/patient/medicationPlan/update', data);
