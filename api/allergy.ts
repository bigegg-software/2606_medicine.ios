import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

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

export const getAllergyInfo = (options?: { patientUserId?: string | number | null }) =>
  request.get<AllergyInfoResult>('/patient/allergy/getInfo', {
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const updateAllergy = (data: { allergyList: AllergyItem[] }) =>
  request.put<{ code?: number; msg?: string }>('/patient/allergy/update', data);
