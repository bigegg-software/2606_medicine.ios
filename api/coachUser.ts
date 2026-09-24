import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** 教练详细信息 */
export type CoachUserInfo = {
  userId?: number | string;
  avatarOssId?: number | string;
  avatarOssUrl?: string;
  coachRole?: string;
  realName?: string;
  sex?: string;
  phonenumber?: string;
  idCard?: string;
  entryDate?: string;
  /** 0在职 1离职 */
  status?: string;
  /** 资质证书 */
  qualificationCert?: string;
  /** 擅长方向 */
  specialtyDirection?: string;
  /** 个人简介 */
  introduction?: string;
  stationId?: number | string;
  stationName?: string;
  trackingStudentCount?: number;
  regDate?: string;
  createTime?: string;
};

export type CoachUserInfoResult = ApiResult & {
  data?: CoachUserInfo;
};

/** 获取教练详细信息 */
export const getCoachUserInfo = (userId: string) =>
  request.get<CoachUserInfoResult>('/patient/coachUser/getInfo', {
    params: { userId: String(userId) },
  });
