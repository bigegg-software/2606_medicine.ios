import request from '@/utils/axios';

/** personal.个人身份认证 family.家属关系认证 */
export type IdentityAuditType = 'personal' | 'family';

export type SubmitIdentityAuditParams = {
  auditType: IdentityAuditType;
  name: string;
  /** 须与账号手机号一致 */
  phonenumber: string;
  /** 个人身份认证必填 */
  idCard?: string;
  /** 身份证正面 ossId（个人必填） */
  idCardFrontOssId?: number;
  /** 身份证反面 ossId（个人必填） */
  idCardBackOssId?: number;
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
  relationProofOssIds?: number[];
};

export type SubmitIdentityAuditResult = {
  code?: number;
  msg?: string;
};

/** 提交身份认证 */
export const submitIdentityAudit = (data: SubmitIdentityAuditParams) =>
  request.post<SubmitIdentityAuditResult>('/patient/identityAudit/submit', data);
