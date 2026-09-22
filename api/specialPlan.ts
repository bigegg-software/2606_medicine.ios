import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type SpecialPlanIntro = {
  coreConcept?: string;
  suitableCrowd?: string;
  interventionContent?: string;
  basis?: string;
};

export type SpecialPlanServiceStep = {
  title?: string;
  content?: string;
};

export type SpecialPlanItem = {
  planId?: number | string;
  coverOssId?: number | string;
  coverOssUrl?: string;
  planName?: string;
  schemeName?: string;
  price?: number;
  /** 多个标签用英文逗号分割 */
  planTags?: string;
  applicableCrowd?: string;
  planIntro?: SpecialPlanIntro;
  serviceProcess?: SpecialPlanServiceStep[];
  /** 0.下架 1.上架 */
  status?: number;
  publishTime?: string;
  createTime?: string;
  updateTime?: string;
};

export type SpecialPlanListResult = ApiResult & {
  data?: SpecialPlanItem[];
};

export type SpecialPlanInfoResult = ApiResult & {
  data?: SpecialPlanItem;
};

/** 推荐专项计划列表 */
export const getSpecialPlanList = () =>
  request.get<SpecialPlanListResult>('/patient/specialPlan/list');

/** 专项计划详情（下架、已删除也返回） */
export const getSpecialPlanInfo = (planId: string) =>
  request.get<SpecialPlanInfoResult>('/patient/specialPlan/getInfo', {
    params: { planId: String(planId) },
  });
