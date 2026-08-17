import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type UserBaseInfo = {
  userId?: number;
  avatarOssId?: string;
  avatarOssUrl?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  /** 日常活动水平：1.1–1.5 */
  dailyActivityLevel?: string;
};

export type UpdateUserBaseInfoParams = {
  avatarOssId?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  dailyActivityLevel?: string;
};

export const getUserBaseInfo = (options?: { patientUserId?: string | number | null }) =>
  request.get('/patient/userBaseInfo/getInfo', {
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const updateUserBaseInfo = (data: UpdateUserBaseInfoParams) =>
  request.put('/patient/userBaseInfo/update', data);

export type UpdateDrugTipInfoParams = {
  drugIsTip?: number;
  drugBeforeTipTime?: number;
  drugTipTypes?: string;
};

export type UpdateDrugTipInfoResult = {
  code?: number;
  msg?: string;
};

export const updateDrugTipInfo = (data: UpdateDrugTipInfoParams) =>
  request.put<UpdateDrugTipInfoResult>('/patient/user/updateDrugTipInfo', data);
