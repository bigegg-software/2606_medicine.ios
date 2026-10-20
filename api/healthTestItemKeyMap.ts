import request from '@/utils/axios';

/** 健康测试项 key 映射：有 objValueDes 表示该测试项需填写多个分项值 */
export type HealthTestItemKeyMap = {
  id?: number;
  /** 测试项业务 key（前后端约定，如 guan_jie_huo_dong_du） */
  itemKey?: string;
  /** 健康测试项 id */
  healthTestItemId?: string | number;
  /** 描述（如 关节活动度测量） */
  des?: string;
  /** obj_value 各 key 说明；仅用 obj_value 存储时有值 */
  objValueDes?: Record<string, string> | null;
  delFlag?: string;
};

/** 查询未删除且 obj_value_des 不为空的映射列表 */
export const listHealthTestItemKeyMapWithObjValueDes = () =>
  request.get<{ code?: number; msg?: string; data?: HealthTestItemKeyMap[] }>(
    '/patient/healthTestItemKeyMap/listWithObjValueDes',
  );
