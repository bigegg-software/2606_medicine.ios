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
  patientName?: string;
  patientPcode?: string;
  patientPhonenumber?: string;
  jsUserName?: string;
  jsPhonenumber?: string;
};

export type FamilyBindListResult = ApiResult<FamilyBindItem[]>;

/** 查询我的家人列表（子女端，含绑定审核状态 bindStatus） */
export const getFamilyBindMyList = () =>
  request.get<FamilyBindListResult>('/patient/familyBind/myList');

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
