import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** 绑定状态 0.待确认 1.已通过 2.未通过 */
export type FamilyBindStatus = 0 | 1 | 2;

/** 家属关系认证状态 0.待审核 1.审核通过 2.未审核通过（null 表示未提交） */
export type FamilyIdentityAuthStatus = 0 | 1 | 2 | null;

export type FamilyBindItem = {
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
  /** 绑定状态 0.待确认 1.已通过 2.未通过 */
  bindStatus?: FamilyBindStatus | number;
  identityAuthStatus?: FamilyIdentityAuthStatus | number | null;
  identityRejectReason?: string;
  delFlag?: string;
  /** 老人视角删除解绑标志（0代表存在 1代表删除） */
  delFlagByOld?: string | number;
  /** 家属视角删除解绑标志（0代表存在 1代表删除） */
  delFlagByJs?: string | number;
  /** 患者账号状态 0.正常 1.禁用 2.已注销 */
  patientAccountStatus?: number;
  /** 家属账号状态 0.正常 1.禁用 2.已注销 */
  jsAccountStatus?: number;
  patientName?: string;
  patientPcode?: string;
  patientPhonenumber?: string;
  /** 患者头像 */
  patientAvatarOssUrl?: string;
  patientAvatarOssId?: string | number;
  patientGender?: string;
  avatarOssUrl?: string;
  patientUserBaseInfo?: {
    avatarOssUrl?: string;
    gender?: string;
  };
  jsUserName?: string;
  jsPhonenumber?: string;
};

export type FamilyBindListResult = ApiResult<FamilyBindItem[]>;

export type AddFamilyBindPayload = {
  /** 家属备注姓名 (家属添加邀请老人的备注) */
  remarkName: string;
  /** 与患者关系(数据字典 relation_type) */
  relationType: string;
  /** 老人用户手机号（须为已注册 app_user） */
  phonenumber: string;
  /** 授权权限英文编码，子女发起绑定时默认全部权限 */
  authPermissions: string[];
};

export type AddFamilyBindResult = ApiResult<number | null>;

/** 查询我的家人列表（子女端，含绑定审核状态 bindStatus） */
export const getFamilyBindMyList = () =>
  request.get<FamilyBindListResult>('/patient/familyBind/myList');

/** 添加家人（发起绑定申请，默认待确认） */
export const addFamilyBind = (data: AddFamilyBindPayload) =>
  request.post<AddFamilyBindResult>('/patient/familyBind/add', data);

/** 接受老人邀请（按 messageId，消息 params 中存 bindVo） */
export const acceptFamilyBindInvite = (messageId: string | number) =>
  request.put<ApiResult>(`/patient/familyBind/acceptInvite/${String(messageId)}`);

/** 拒绝老人邀请（按 messageId，消息 params 中存 bindVo） */
export const rejectFamilyBindInvite = (messageId: string | number) =>
  request.put<ApiResult>(`/patient/familyBind/rejectInvite/${String(messageId)}`);

/** 接受老人邀请（按绑定记录 id） */
export const acceptFamilyBindInviteByBind = (id: string | number) =>
  request.put<ApiResult>(`/patient/familyBind/acceptInviteByBind/${String(id)}`);

/** 拒绝老人邀请（按绑定记录 id） */
export const rejectFamilyBindInviteByBind = (id: string | number) =>
  request.put<ApiResult>(`/patient/familyBind/rejectInviteByBind/${String(id)}`);

/** 删除家人绑定关系（家属端解绑，设置 delFlagByJs=1） */
export const removeFamilyBind = (id: string | number) =>
  request.delete<ApiResult>(`/patient/familyBind/remove/${String(id)}`);
