import request from '@/utils/axios';
import { withPatientUserIdHeaders, type ApiResult } from '@/src/utils/apiHelpers';

export type PersonalizedDynamicIndicatorType =
  | '血糖'
  | '血压'
  | '血脂'
  | '尿酸'
  | '血氧'
  | '体温'
  | '睡眠'
  | '体重'
  | '步数'
  | string;

export type PersonalizedDynamicIndicatorMatchData = {
  /** 指标类型：血糖、血压、血脂、尿酸、血氧、体温、睡眠、体重、步数 */
  type?: PersonalizedDynamicIndicatorType | null;
};

export type PersonalizedDynamicIndicatorMatchResult =
  ApiResult<PersonalizedDynamicIndicatorMatchData>;

/** 匹配当前应展示的个性化动态指标类型 */
export const matchPersonalizedDynamicIndicator = (options?: {
  patientUserId?: string | number | null;
}) =>
  request.get<PersonalizedDynamicIndicatorMatchResult>(
    '/patient/personalizedDynamicIndicator/match',
    { headers: withPatientUserIdHeaders(options?.patientUserId) },
  );
