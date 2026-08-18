import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type ChronicDiseaseRecord = {
  id?: number;
  userId?: number;
  diseaseType?: string;
  diagnosisTime?: string;
  mainSymptoms?: string;
  associationMedicationPlanIds?: (string | number)[];
};

export type ChronicDiseaseListParams = {
  diseaseType?: string;
  pageSize?: number;
  pageNum?: number;
};

export type ChronicDiseaseListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: ChronicDiseaseRecord[];
};

export type ChronicDiseaseInfoResult = {
  code?: number;
  msg?: string;
  data?: ChronicDiseaseRecord;
};

export type ChronicDiseasePayload = {
  id?: number | null;
  diseaseType?: string;
  diagnosisTime?: string;
  mainSymptoms?: string;
  associationMedicationPlanIds?: (string | number)[];
};

export const getChronicDiseaseFrontList = (
  params?: ChronicDiseaseListParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<ChronicDiseaseListResult>('/patient/chronicDisease/frontList', {
    params,
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const getChronicDiseaseInfo = (
  id: number,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<ChronicDiseaseInfoResult>('/patient/chronicDisease/getInfo', {
    params: { id },
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const addChronicDisease = (data: ChronicDiseasePayload) =>
  request.post('/patient/chronicDisease/add', data);

export const updateChronicDisease = (data: ChronicDiseasePayload & { id: number }) =>
  request.put('/patient/chronicDisease/update', data);

export const removeChronicDiseaseById = (id: number) =>
  request.delete('/patient/chronicDisease/removeById', { params: { id } });
