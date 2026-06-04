import request from '@/utils/axios';

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

export const getFamilyMedicalInfo = () =>
  request.get<FamilyMedicalInfoResult>('/patient/familyMedical/getInfo');

export const updateFamilyMedical = (data: UpdateFamilyMedicalParams) =>
  request.put<{ code?: number; msg?: string }>('/patient/familyMedical/update', data);
