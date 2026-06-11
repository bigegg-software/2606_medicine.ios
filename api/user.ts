import request from '@/utils/axios';

export type UserExtr = {
  userId?: number;
  language?: string;
  regDeviceType?: number;
  acceptAi?: number;
  appVersion?: string;
  utcOffset?: number;
  iphoneDeviceToken?: string;
  params?: Record<string, unknown>;
  sleepGoals?: number;
  stepGoals?: number;
  energyGoals?: number;
  createTime?: string;
  drugIsTip?: number;
  drugBeforeTipTime?: number;
  drugTipTypes?: string;
  questionAiSuggestion?: string;
};

type UserInfoResponse = {
  userExtr?: UserExtr;
};

export const getUserInfo = () => request.get<UserInfoResponse>('/system/user/getInfo');
