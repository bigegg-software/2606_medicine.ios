import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

/** 顺延弹框选择：0 不顺延；1 顺延 */
export type ExPostponeChoiceValue = 0 | 1;

export type ExPostponeChoiceInfo = {
  id?: number | string;
  userId?: number | string;
  exPatientRuleId?: number | string;
  customerLocalDate?: string;
  choice?: ExPostponeChoiceValue | number;
  createTime?: string;
};

export type AddExPostponeChoicePayload = {
  exPatientRuleId: string;
  /** 不传则服务端取当天 */
  customerLocalDate?: string;
  choice: ExPostponeChoiceValue;
};

/** 记录今日（或指定日期）顺延弹框选择 */
export const addExPostponeChoice = (
  payload: AddExPostponeChoicePayload,
  options?: { patientUserId?: string | number | null },
) =>
  request.post<{ code?: number; msg?: string }>(
    '/patient/exPostponeChoice/add',
    {
      exPatientRuleId: String(payload.exPatientRuleId),
      choice: payload.choice,
      ...(payload.customerLocalDate?.trim()
        ? { customerLocalDate: payload.customerLocalDate.trim() }
        : {}),
    },
    {
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

/** 查询指定日期顺延弹框选择详情 */
export const getExPostponeChoiceInfo = (
  params: { exPatientRuleId: string | number; customerLocalDate: string },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExPostponeChoiceInfo }>(
    '/patient/exPostponeChoice/getInfo',
    {
      params: {
        exPatientRuleId: String(params.exPatientRuleId),
        customerLocalDate: String(params.customerLocalDate),
      },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );
