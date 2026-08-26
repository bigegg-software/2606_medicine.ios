import request from '@/utils/axios';

export type SystemUserRole = {
  roleId?: number;
  roleName?: string;
  roleKey?: string;
  roleSort?: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: string;
  remark?: string;
  createTime?: string;
  flag?: boolean;
};

export type SystemUser = {
  userId?: number;
  tenantId?: string;
  deptId?: number;
  userName?: string;
  nickName?: string;
  userType?: string;
  /** 身份视角 old.老人 child.子女，仅 user_type=app_user 时有效 */
  identityPerspective?: string;
  /** 用户类型 old.老人 child.子女（家属） */
  memberType?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: number;
  status?: string;
  loginIp?: string;
  loginDate?: string;
  remark?: string;
  createTime?: string;
  deptName?: string;
  roles?: SystemUserRole[];
  roleIds?: number[];
  postIds?: number[];
  roleId?: number;
  realName?: string;
  pcode?: string;
  deletedAccount?: number;
  tokens?: number;
  /** 是否付费 0.否 1.是 */
  isPaid?: number;
  /** 付费有效开始日期 yyyy-MM-dd */
  paidStartDate?: string;
  /** 付费有效结束日期 yyyy-MM-dd */
  paidEndDate?: string;
};

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
  calorieGoals?: number;
  weightGoals?: number;
  createTime?: string;
  drugIsTip?: number;
  drugBeforeTipTime?: number;
  drugTipTypes?: string;
  questionAiSuggestion?: string;
  isSendSysMsg?: number;
  autoSyncData?: number;
  synWdataDays?: number;
  authStatus?: number;
  wearableDeviceBound?: number;
  healthIndexShowList?: string[];
  /** 是否开启语音播报 0.否 1.是（默认关闭） */
  isVoiceBroadcast?: number;
  /** 语速（默认 1.0） */
  voiceSpeed?: number;
};

export type UserInfoData = {
  user?: SystemUser;
  userExtr?: UserExtr;
  permissions?: string[];
  roles?: string[];
};

type UserInfoResponse = {
  code?: number;
  msg?: string;
  data?: UserInfoData;
};

export const getUserInfo = () => request.get<UserInfoResponse>('/system/user/getInfo');

export type UpdateExtrInfoPayload = {
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
  calorieGoals?: number;
  weightGoals?: number;
  longitude?: string;
  latitude?: string;
  drugIsTip?: number;
  drugBeforeTipTime?: number;
  drugTipTypes?: string;
  questionAiSuggestion?: string;
  isSendSysMsg?: number;
  autoSyncData?: number;
  synWdataDays?: number;
  countryCode?: string;
  authStatus?: number;
  wearableDeviceBound?: number;
  /** 身份视角 old.老人 child.子女 */
  identityPerspective?: string;
  healthIndexShowList?: string[];
  /** 是否开启语音播报 0.否 1.是（默认关闭） */
  isVoiceBroadcast?: number;
  /** 语速（默认 1.0） */
  voiceSpeed?: number;
};

export const updateExtrInfo = (data: UpdateExtrInfoPayload) =>
  request.put<{ code?: number; msg?: string }>('/system/user/updateExtrInfo', data);

export type InitMemberTypePayload = {
  /** 用户类型 old.老人 child.子女（家属）；身份视角默认与 memberType 一致 */
  memberType: 'old' | 'child';
};

/** 首次设置用户类型（老人/家属） */
export const initMemberType = (data: InitMemberTypePayload) =>
  request.put<{ code?: number; msg?: string }>('/system/user/initMemberType', data);

/** 发送注销账号短信验证码（使用当前登录用户绑定手机号） */
export const sendDeleteAccountSmsCode = () =>
  request.post<{ code?: number; msg?: string }>('/patient/account/deleteAccount/sms/code');

/** 验证注销账号短信验证码，通过后注销当前登录账号 */
export const verifyDeleteAccountSmsCode = (sureCode: string) =>
  request.get<{ code?: number; msg?: string; data?: string }>(
    '/patient/account/deleteAccount/verifySmsCode',
    { params: { sureCode } },
  );
