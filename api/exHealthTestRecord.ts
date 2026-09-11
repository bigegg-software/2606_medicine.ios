import request from '@/utils/axios';

export type ExHealthTestRecord = {
  id?: number | string;
  userId?: number | string;
  exPatientRuleId?: number | string | null;
  healthTestItemId?: number | string;
  testValue?: number | string;
  objValue?: Record<string, number | string | null> | null;
  createTime?: string;
  firstRecord?: boolean;
  changeValue?: number | null;
  firstChangePercent?: number | null;
};

export type FirstAndLatestHealthTestRecord = {
  firstRecord?: ExHealthTestRecord | null;
  latestRecord?: ExHealthTestRecord | null;
};

/** 从 list 结果推导首次/最新（兼容 exPatientRuleId 为空的教练代录数据） */
export function pickFirstAndLatestHealthTestRecords(
  rows: ExHealthTestRecord[],
): FirstAndLatestHealthTestRecord {
  if (!rows.length) {
    return { firstRecord: null, latestRecord: null };
  }
  const sortedAsc = [...rows].sort((a, b) => {
    const timeA = new Date(a.createTime ?? 0).getTime();
    const timeB = new Date(b.createTime ?? 0).getTime();
    return timeA - timeB;
  });
  const markedFirst = sortedAsc.find(row => row.firstRecord);
  return {
    firstRecord: markedFirst ?? sortedAsc[0] ?? null,
    latestRecord: sortedAsc[sortedAsc.length - 1] ?? null,
  };
}

export const queryFirstAndLatestHealthTestRecord = (params: {
  exPatientRuleId: string | number;
  healthTestItemId: string | number;
  userId?: string | number;
}) =>
  request.get<{ code?: number; data?: FirstAndLatestHealthTestRecord }>(
    '/patient/exHealthTestRecord/queryFirstAndLatestRecord',
    { params },
  );

export type HealthTestRecordListParams = {
  /** 运动处方周期起止日期 */
  startDate: string;
  endDate: string;
  healthTestItemId: string | number;
  userId?: string | number;
  pageNum?: number;
  pageSize?: number;
};

export type HealthTestRecordListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: ExHealthTestRecord[];
};

export const listHealthTestRecords = (params: HealthTestRecordListParams) =>
  request.get<HealthTestRecordListResult>('/patient/exHealthTestRecord/list', { params });

export type AddExHealthTestRecordPayload = {
  exPatientRuleId: string;
  healthTestItemId: string;
  /** 测试数值，保留4位小数（非必填） */
  testValue?: number;
  /** 关节活动度等对象值（非必填） */
  objValue?: Record<string, number>;
};

export const addExHealthTestRecord = (data: AddExHealthTestRecordPayload) =>
  request.post<{ code?: number; msg?: string }>('/patient/exHealthTestRecord/add', data);
