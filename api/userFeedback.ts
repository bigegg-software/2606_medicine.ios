import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type SubmitUserFeedbackParams = {
  content: string;
};

export type SubmitUserFeedbackResult = ApiResult;

export const submitUserFeedback = (data: SubmitUserFeedbackParams) =>
  request.post<SubmitUserFeedbackResult>('/patient/userFeedback/submit', data);
