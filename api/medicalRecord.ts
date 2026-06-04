import request from '@/utils/axios';

export type MedicalRecordAttachment = {
  ossId?: string;
  ossUrl?: string;
  originalName?: string;
};

export type MedicalRecord = {
  medicalRecordId?: number;
  userId?: number;
  medicalRecordType?: string;
  recordDate?: string;
  hospital?: string;
  medicalDepartment?: string;
  diagnosticResult?: string;
  doctor?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  pastMedicalHistory?: string;
  personalHistory?: string;
  physicalExamination?: string;
  previousExaminationResults?: string;
  medicalSummary?: string;
  attachmentList?: MedicalRecordAttachment[];
};

export type MedicalRecordListParams = {
  medicalRecordType?: string;
  diagnosticResult?: string;
  hospital?: string;
  pageSize?: number;
  pageNum?: number;
};

export type MedicalRecordListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: MedicalRecord[];
};

export type MedicalRecordPayload = Omit<MedicalRecord, 'userId'>;

export const getMedicalRecordFrontList = (params?: MedicalRecordListParams) =>
  request.get<MedicalRecordListResult>('/patient/medicalRecord/frontList', { params });

export type MedicalRecordInfoResult = {
  code?: number;
  msg?: string;
  data?: MedicalRecord;
};

export const getMedicalRecordInfo = (medicalRecordId: number) =>
  request.get<MedicalRecordInfoResult>('/patient/medicalRecord/getInfo', { params: { medicalRecordId } });

export const addMedicalRecord = (data: MedicalRecordPayload) =>
  request.post('/patient/medicalRecord/add', data);

export const updateMedicalRecord = (data: MedicalRecordPayload & { medicalRecordId: number }) =>
  request.put('/patient/medicalRecord/update', data);

export const removeMedicalRecord = (medicalRecordId: number) =>
  request.delete('/patient/medicalRecord/removeById', { params: { medicalRecordId } });

export const aiIdentifyMedicalRecord = (file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  return request.post('/patient/medicalRecord/aiIdentifyMedicalRecord', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
