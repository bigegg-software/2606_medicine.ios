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
  /** 主诉 / 主诊断 */
  primaryDiagnosis?: string;
  /** 健康标签 / 诊断标签 */
  diagnosticLabel?: string;
  /** 主要健康目标（如：减重） */
  primaryHealthGoal?: string;
  /** 饮食偏好（如：喜辣,不吃鱼） */
  dietaryPreferences?: string;
  /** 体能水平评估，数据字典 key: fitness_level */
  fitnessLevel?: string;
  /** 训练目标可多选，数据字典 key: training_goal */
  trainingGoals?: string[];
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
  primaryDiagnosis?: string;
  diagnosticLabel?: string;
  primaryHealthGoal?: string;
  dietaryPreferences?: string;
  fitnessLevel?: string;
  trainingGoals?: string[];
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
