import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** personal.个人身份认证 family.家属关系认证 */
export type IdentityAuditType = 'personal' | 'family';

export type IdentityAuthStatus = 0 | 1 | 2 | null;

export type IdentityAuditRelationProofFile = {
  ossId?: number;
  ossUrl?: string;
  originalName?: string;
};

export type IdentityAuditPatientBindVo = {
  id?: number;
  jsUserId?: number;
  patientUserId?: number;
  relationType?: string;
  remarkName?: string;
  authPermissions?: string[];
  bindStatus?: number;
  identityAuthStatus?: number | null;
  identityRejectReason?: string;
  delFlag?: string;
  patientName?: string;
  patientPcode?: string;
  patientPhonenumber?: string;
  jsUserName?: string;
  jsPhonenumber?: string;
};

export type IdentityAuditLatestRecord = {
  auditId?: number;
  userId?: number;
  auditType?: IdentityAuditType | string;
  patientBindId?: number;
  patientBindVo?: IdentityAuditPatientBindVo;
  identityPerspective?: string;
  memberType?: string;
  pcode?: string;
  name?: string;
  phonenumber?: string;
  idCard?: string;
  idCardFrontOssId?: number;
  idCardFrontOssUrl?: string;
  idCardBackOssId?: number;
  idCardBackOssUrl?: string;
  residentialProvince?: string;
  residentialCity?: string;
  residentialDistrict?: string;
  residentialStreet?: string;
  residentialDetail?: string;
  relationType?: string;
  relationProofOssIds?: number[];
  relationProofFiles?: IdentityAuditRelationProofFile[];
  auditStatus?: number;
  rejectReason?: string;
  auditBy?: number;
  auditByName?: string;
  auditTime?: string;
  createTime?: string;
  submitTime?: string;
};

export type IdentityAuditInfo = {
  identityPerspective?: string;
  memberType?: string;
  phonenumber?: string;
  /** 0.待审核 1.审核通过 2.未审核通过；null 表示未提交过审核 */
  authStatus?: IdentityAuthStatus | number | null;
  canSubmit?: boolean;
  latestAudit?: IdentityAuditLatestRecord | null;
};

export type IdentityAuditInfoResult = ApiResult<IdentityAuditInfo>;

export type SubmitIdentityAuditParams = {
  auditType: IdentityAuditType;
  name: string;
  /** 须与账号手机号一致 */
  phonenumber: string;
  /** 个人身份认证必填 */
  idCard?: string;
  /** 身份证正面 ossId（个人必填） */
  idCardFrontOssId?: string;
  /** 身份证反面 ossId（个人必填） */
  idCardBackOssId?: string;
  residentialProvince?: string;
  residentialCity?: string;
  residentialDistrict?: string;
  residentialStreet?: string;
  /** 详细地址，最多 50 字 */
  residentialDetail?: string;
  /** 家属关系认证关联 bind id（家属必填），统一 string 传后端 */
  patientBindId?: string;
  /** 与患者关系，字典 relation_type（家属必填） */
  relationType?: string;
  /** 关系证明图片 ossId 列表（家属必填） */
  relationProofOssIds?: string[];
};

export type SubmitIdentityAuditResult = {
  code?: number;
  msg?: string;
};

/** 获取当前身份认证状态 */
export const getIdentityAuditInfo = () =>
  request.get<IdentityAuditInfoResult>('/patient/identityAudit/getInfo');

/** 提交身份认证 */
export const submitIdentityAudit = (data: SubmitIdentityAuditParams) =>
  request.post<SubmitIdentityAuditResult>('/patient/identityAudit/submit', data);

export type IdCardIdentifyData = {
  name?: string;
  idCard?: string;
  sex?: string;
  nation?: string;
  birth?: string;
  /** @deprecated 旧字段，兼容历史返回；优先用 fullAddress / detailAddress */
  address?: string;
  /** 完整住址（身份证上户籍地址全文） */
  fullAddress?: string;
  /** 省 / 直辖市 */
  province?: string;
  /** 市 */
  city?: string;
  /** 区 / 县 */
  district?: string;
  /** 街道 / 乡镇 */
  street?: string;
  /** 详细地址（门牌号等，不含省市区街道） */
  detailAddress?: string;
  ossId?: number | string;
  ossUrl?: string;
};

export type IdCardIdentifyResult = ApiResult<IdCardIdentifyData>;

/** 识别身份证照片信息（不超过 5M），建议正面 */
export const aiIdentifyIdCard = (file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  return request.post<IdCardIdentifyResult>('/patient/identityAudit/aiIdentifyIdCard', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
