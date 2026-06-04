import request from '@/utils/axios';

export type AllergyItem = {
  allergyType?: string;
  allergenName?: string;
  severity?: string;
  allergicSymptoms?: string;
};

export type AllergyInfo = {
  userId?: number;
  allergyList?: AllergyItem[];
};

export type AllergyInfoResult = {
  code?: number;
  msg?: string;
  data?: AllergyInfo;
};

export const getAllergyInfo = () => request.get<AllergyInfoResult>('/patient/allergy/getInfo');

export const updateAllergy = (data: { allergyList: AllergyItem[] }) =>
  request.put<{ code?: number; msg?: string }>('/patient/allergy/update', data);
