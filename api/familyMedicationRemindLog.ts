import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type FamilyMedicationRemindLogItem = {
  id?: number | string;
  jsUserId?: number | string;
  patientUserId?: number | string;
  medicationPlanId?: number | string;
  customerLocalDate?: string;
  time?: string;
  createTime?: string;
};

export type AddFamilyMedicationRemindLogPayload = {
  patientUserId: string;
  medicationPlanId: string;
  customerLocalDate?: string;
  time: string;
};

export type FamilyMedicationRemindLogListParams = {
  patientUserId: string;
  customerLocalDate?: string;
};

/** 记录家属用药提醒日志 */
export const addFamilyMedicationRemindLog = (data: AddFamilyMedicationRemindLogPayload) =>
  request.post<ApiResult>('/patient/familyMedicationRemindLog/add', data);

/** 按家属与患者查询用药提醒日志列表 */
export const getFamilyMedicationRemindLogList = (params: FamilyMedicationRemindLogListParams) =>
  request.get<ApiResult<FamilyMedicationRemindLogItem[]>>(
    '/patient/familyMedicationRemindLog/list',
    { params },
  );
