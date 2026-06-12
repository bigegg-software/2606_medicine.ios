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
  userId?: number;
  dataType?: number;
  medicationPlanTime?: string;
  isAllDay?: number;
  action?: number | null;
  actionTime?: string;
};

export type IndexMedicationPlanGroupItem = {
  medicationPlanTime?: string;
  list?: IndexMedicationPlanItem[];
};

export type IndexMedicationPlanResult = ApiResult & {
  data?: IndexMedicationPlanItem[];
};

export type IndexMedicationPlanGroupResult = ApiResult & {
  data?: IndexMedicationPlanGroupItem[];
};

export const getIndexMedicationPlan = () =>
  request.get<IndexMedicationPlanResult>('/patient/medicationPlan/indexPlan');

export const getIndexMedicationPlanGroupByTime = () =>
  request.get<IndexMedicationPlanGroupResult>('/patient/medicationPlan/indexPlanGroupByTime');

export const getMedicationPlanInfo = (medicationPlanId: string | number) =>
  request.get<MedicationPlanInfoResult>('/patient/medicationPlan/getInfo', {
    params: { medicationPlanId: String(medicationPlanId) },
  });

export const getMyMedicationPlanList = (params?: { planType?: number | '' }) =>
  request.get<ApiResult & { data?: MedicationPlan[] }>('/patient/medicationPlan/myList', { params });

export const addMedicationPlan = (data: MedicationPlanPayload) =>
  request.post<ApiResult>('/patient/medicationPlan/add', data);

export const updateMedicationPlan = (data: MedicationPlanPayload & { medicationPlanId: string | number }) =>
  request.put<ApiResult>('/patient/medicationPlan/update', data);

export const removeMedicationPlanById = (medicationPlanId: string | number) =>
  request.delete<ApiResult>('/patient/medicationPlan/removeById', {
    params: { medicationPlanId: String(medicationPlanId) },
  });

export const updateMedicationPlanTimeList = (data: {
  medicationPlanId: string | number;
  timeList: string[];
}) => request.put<ApiResult>('/patient/medicationPlan/updateTimeList', data);
