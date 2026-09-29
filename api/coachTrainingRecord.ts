import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

/** 教练到店训练日志 */
export type CoachTrainingRecord = {
  id?: number | string;
  coachUserId?: number | string;
  coachRealName?: string;
  patientUserId?: number | string;
  exPatientRuleId?: number | string;
  difficultyFeedback?: string;
  difficultyFeedbackLabel?: string;
  /** 指定日期完成度 0-100 */
  completeRate?: number;
  summary?: string;
  trainingDuration?: number;
  exerciseKcal?: number;
  customerLocalDate?: string;
  createTime?: string;
  updateTime?: string;
};

export type CoachTrainingRecordResult = {
  code?: number;
  msg?: string;
  data?: CoachTrainingRecord | null;
};

/** 查询指定处方、指定日期的训练日志 */
export const getCoachTrainingRecordByRuleAndDate = (
  params: {
    exPatientRuleId: string;
    customerLocalDate: string;
  },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<CoachTrainingRecordResult>(
    '/patient/coachTrainingRecord/getByRuleAndDate',
    {
      params: {
        exPatientRuleId: String(params.exPatientRuleId),
        customerLocalDate: params.customerLocalDate,
      },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );
