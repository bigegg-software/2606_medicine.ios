import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type FamilyMedicalItem = {
  familyRelationships?: string;
  medicalCondition?: string;
  age?: number;
  status?: string;
};

export type FamilyMedicalInfo = {
  userId?: number;
  familyMedicalList?: FamilyMedicalItem[];
};

export type FamilyMedicalInfoResult = {
  code?: number;
  msg?: string;
  data?: FamilyMedicalInfo;
};

export type UpdateFamilyMedicalParams = {
  userId?: number;
  familyMedicalList: FamilyMedicalItem[];
};

export const getFamilyMedicalInfo = (options?: { patientUserId?: string | number | null }) =>
  request.get<FamilyMedicalInfoResult>('/patient/familyMedical/getInfo', {
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const updateFamilyMedical = (data: UpdateFamilyMedicalParams) =>
  request.put<{ code?: number; msg?: string }>('/patient/familyMedical/update', data);
