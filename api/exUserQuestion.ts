import request from '@/utils/axios';
import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';

export type FirstAndLatestUserQuestionRecord = {
  firstRecord?: UserQuestionRecord | null;
  latestRecord?: UserQuestionRecord | null;
};

export type ExUserQuestionQueryParams = {
  exPatientRuleId: string | number;
  type: QuestionnaireType;
  userId?: string | number;
};

export const queryFirstAndLatestExUserQuestion = (params: ExUserQuestionQueryParams) =>
  request.get<{ code?: number; msg?: string; data?: FirstAndLatestUserQuestionRecord }>(
    '/patient/exUserQuestion/queryFirstAndLatestRecord',
    { params },
  );

export type ExUserQuestionListParams = ExUserQuestionQueryParams & {
  pageNum?: number;
  pageSize?: number;
};

export type ExUserQuestionListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: UserQuestionRecord[];
};

export const listExUserQuestions = (params: ExUserQuestionListParams) =>
  request.get<ExUserQuestionListResult>('/patient/exUserQuestion/list', { params });
