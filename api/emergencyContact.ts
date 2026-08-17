import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type EmergencyContact = {
  id?: number;
  patientUserId?: number;
  contactName?: string;
  contactPhone?: string;
  relationType?: string;
  isDefault?: number;
  remark?: string;
};

export type EmergencyContactPayload = {
  id?: number;
  contactName: string;
  contactPhone: string;
  relationType: string;
  isDefault?: number;
  remark?: string;
};

export type EmergencyContactListParams = {
  pageNum?: number;
  pageSize?: number;
  patientUserId?: number;
  contactName?: string;
  contactPhone?: string;
  relationType?: string;
  isDefault?: number;
};

export type EmergencyContactListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: EmergencyContact[];
};

export type EmergencyContactInfoResult = {
  code?: number;
  msg?: string;
  data?: EmergencyContact;
};

export const getEmergencyContactList = (
  params: EmergencyContactListParams = {},
  options?: { patientUserId?: string | number | null },
) =>
  request.get<EmergencyContactListResult>('/patient/emergencyContact/list', {
    params: {
      pageNum: params.pageNum ?? 1,
      pageSize: params.pageSize ?? 10,
      ...params,
    },
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const getEmergencyContactInfo = (id: number | string) =>
  request.get<EmergencyContactInfoResult>('/patient/emergencyContact/getInfo', {
    params: { id: String(id) },
  });

export const addEmergencyContact = (data: EmergencyContactPayload) =>
  request.post<{ code?: number; msg?: string }>('/patient/emergencyContact/add', data);

export const updateEmergencyContact = (data: EmergencyContactPayload & { id: number }) =>
  request.put<{ code?: number; msg?: string }>('/patient/emergencyContact/update', data);

export const removeEmergencyContact = (id: number | string) =>
  request.delete<{ code?: number; msg?: string }>('/patient/emergencyContact/removeById', {
    params: { id: String(id) },
  });
