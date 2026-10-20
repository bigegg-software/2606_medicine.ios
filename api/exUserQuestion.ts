import request from '@/utils/axios';
import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';

export type FirstAndLatestUserQuestionRecord = {
  firstRecord?: UserQuestionRecord | null;
  latestRecord?: UserQuestionRecord | null;
};

/** 从 list 结果推导首次/最新（初始态用最早一条） */
export function pickFirstAndLatestUserQuestionRecords(
  rows: UserQuestionRecord[],
): FirstAndLatestUserQuestionRecord {
  if (!rows.length) {
    return { firstRecord: null, latestRecord: null };
  }
  const sortedAsc = [...rows].sort((a, b) => {
    const timeA = new Date(a.createTime ?? a.updateTime ?? 0).getTime();
    const timeB = new Date(b.createTime ?? b.updateTime ?? 0).getTime();
    return timeA - timeB;
  });
  return {
    firstRecord: sortedAsc[0] ?? null,
    latestRecord: sortedAsc[sortedAsc.length - 1] ?? null,
  };
}

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
