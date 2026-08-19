import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** 绑定状态 0.待确认 1.已通过 2.未通过 */
export type OldFamilyBindStatus = 0 | 1 | 2;

/** 家属关系认证状态 0.待审核 1.审核通过 2.未审核通过（null 表示未提交） */
export type OldFamilyIdentityAuthStatus = 0 | 1 | 2 | null;

export type OldFamilyBindItem = {
  id?: number;
  jsUserId?: number;
  patientUserId?: number;
  /** 与患者关系(数据字典 relation_type) */
  relationType?: string;
  /** 家属备注姓名 (家属添加邀请老人的备注) */
  remarkName?: string;
  /** 老人给子女的备注（老人邀请家人时填写） */
  childRemarkName?: string;
  /**
   * 授权权限英文编码：
   * health_data / medication / exercise / diet / chronic_disease / assessment / health_alert
   */
  authPermissions?: string[];
  bindStatus?: OldFamilyBindStatus | number;
  identityAuthStatus?: OldFamilyIdentityAuthStatus | number | null;
  identityRejectReason?: string;
  delFlag?: string;
  patientName?: string;
  patientPcode?: string;
  patientPhonenumber?: string;
  jsUserName?: string;
  jsPhonenumber?: string;
  /** 家属头像 */
  jsAvatarOssUrl?: string;
  jsAvatarOssId?: string | number;
  jsGender?: string;
  avatarOssUrl?: string;
  jsUserBaseInfo?: {
    avatarOssUrl?: string;
    gender?: string;
  };
  createTime?: string;
};

export type OldFamilyInvitePayload = {
  /** 老人给子女的备注 */
  childRemarkName: string;
  /** 与家属关系(数据字典 relation_type) */
  relationType: string;
  /** 家属用户手机号（须为已注册 app_user 家属账号） */
  phonenumber: string;
  /** 授权权限英文编码（health_data/medication/exercise/diet/chronic_disease/assessment/health_alert） */
  authPermissions: string[];
};

export type OldFamilyUpdateAuthPayload = {
  /** 绑定记录主键（统一 string 传输） */
  id: string;
  /** 授权权限英文编码，无任何权限传空数组 [] */
  authPermissions: string[];
};

export type OldFamilyBindListResult = ApiResult<OldFamilyBindItem[]>;
export type OldFamilyBindInfoResult = ApiResult<OldFamilyBindItem>;
export type OldFamilyInviteResult = ApiResult<number | null>;
export type OldFamilyUpdateAuthResult = ApiResult;
export type OldFamilyRemoveResult = ApiResult;

/** 查询我的家人列表（patientUserId=当前登录用户） */
export const getOldFamilyBindMyList = () =>
  request.get<OldFamilyBindListResult>('/patient/oldFamilyBind/myList');

/** 查询我的家人详情 */
export const getOldFamilyBindInfo = (id: string | number) =>
  request.get<OldFamilyBindInfoResult>('/patient/oldFamilyBind/getInfo', {
    params: { id: String(id) },
  });

/** 邀请家人（指定授权权限，默认待确认，家人接受后 bindStatus=1） */
export const inviteOldFamilyBind = (payload: OldFamilyInvitePayload) =>
  request.post<OldFamilyInviteResult>('/patient/oldFamilyBind/invite', payload);

/** 编辑家人授权权限 */
export const updateOldFamilyBindAuth = (payload: OldFamilyUpdateAuthPayload) =>
  request.put<OldFamilyUpdateAuthResult>('/patient/oldFamilyBind/updateAuth', payload);

/** 同意家属授权申请（按 messageId，消息 params 中存 bindVo） */
export const approveOldFamilyBindByMessage = (messageId: string | number) =>
  request.put<ApiResult>(`/patient/oldFamilyBind/approve/${String(messageId)}`);

/** 拒绝家属授权申请（按 messageId，消息 params 中存 bindVo） */
export const rejectOldFamilyBindByMessage = (messageId: string | number) =>
  request.put<ApiResult>(`/patient/oldFamilyBind/reject/${String(messageId)}`);

/** 同意家属授权申请（按绑定记录 id） */
export const approveOldFamilyBindByBind = (id: string | number) =>
  request.put<ApiResult>(`/patient/oldFamilyBind/approveByBind/${String(id)}`);

/** 拒绝家属授权申请（按绑定记录 id） */
export const rejectOldFamilyBindByBind = (id: string | number) =>
  request.put<ApiResult>(`/patient/oldFamilyBind/rejectByBind/${String(id)}`);

/** 删除家人绑定关系（逻辑删除） */
export const removeOldFamilyBind = (id: string | number) =>
  request.delete<OldFamilyRemoveResult>(`/patient/oldFamilyBind/remove/${String(id)}`);
