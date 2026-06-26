import request from '@/utils/axios';

export type AddExRecordPayload = {
  exPatientRuleId: number | string;
  customerLocalDate?: string;
  exerciseType: string;
  exerciseChildType: string;
  exerciseDuration: number;
  remark?: string;
};

export type ExRecordApiResult = {
  code?: number;
  msg?: string;
};

export const addExRecord = (data: AddExRecordPayload) =>
  request.post<ExRecordApiResult>('/patient/exRecord/add', data);

export const postExRecordVideoView = (exVideoId: number) =>
  request.post<ExRecordApiResult>('/patient/exRecord/videoView', null, { params: { exVideoId } });
