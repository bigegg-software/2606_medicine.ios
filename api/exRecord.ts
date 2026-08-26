import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type AddExRecordPayload = {
  exPatientRuleId: number | string;
  customerLocalDate?: string;
  exerciseType: string;
  exerciseChildType: string;
  exerciseDuration: number;
  remark?: string;
};

export type ExRecordApiResult = {
  code?: number;
  msg?: string;
};

export const addExRecord = (data: AddExRecordPayload) =>
  request.post<ExRecordApiResult>('/patient/exRecord/add', data);

/** 训练阶段：hot.热身 main.主训练 cold.冷身 */
export type ExRecordTrainingPhase = 'hot' | 'main' | 'cold';

export type MarkCompleteGroupsPayload = {
  exPatientRuleId: string;
  customerLocalDate: string;
  trainingPhase: ExRecordTrainingPhase;
  /** trainingPhase=main 时必填 */
  exerciseType?: string;
  exVideoId: string;
  /** 本次锻炼时长（分钟），服务端累加到当日累计值 */
  exerciseDuration: number;
  /** 本次消耗 kcal，服务端累加到当日累计值 */
  exerciseKcal?: number;
  /** 完成的组数整数组，整数组覆盖写入，如 [1,2,3] */
  complateGroups: number[];
  /** 每组完成的次数，如 [12,13,15] 表示第1/2/3组分别完成 12/13/15 次 */
  complateGroupCounts?: number[];
};

export type ExRecordVideoMarkResult = {
  code?: number;
  msg?: string;
  data?: {
    id?: number;
    exPatientRuleId?: number;
    complateGroups?: number[];
    complateGroupCounts?: number[];
    isComplate?: number;
    exerciseDuration?: number;
    exerciseKcal?: number;
  };
};

/** 提交累计锻炼时长（分钟）：支持两位小数，如 50 秒 → 0.83 */
function normalizeRecordExerciseDuration(value: number) {
  const minutes = Math.max(0, Number(value) || 0);
  return Math.round(minutes * 100) / 100;
}

/** 标记完成组数（整数组覆盖写入）；全部组完成时调用，有效字段 complateGroups */
export const markCompleteGroups = (data: MarkCompleteGroupsPayload) =>
  request.post<ExRecordVideoMarkResult>('/patient/exRecordVideo/markCompleteGroups', {
    ...data,
    exPatientRuleId: String(data.exPatientRuleId),
    exVideoId: String(data.exVideoId),
    exerciseDuration: normalizeRecordExerciseDuration(data.exerciseDuration),
    exerciseKcal: data.exerciseKcal != null
      ? Math.max(0, Number(data.exerciseKcal) || 0)
      : undefined,
    complateGroups: Array.isArray(data.complateGroups) ? data.complateGroups : [],
    complateGroupCounts: Array.isArray(data.complateGroupCounts)
      ? data.complateGroupCounts.map(item => Math.max(0, Math.round(Number(item) || 0)))
      : [],
  });

/** 记录每组完成的次数（覆盖写入）；组别过程保存，有效字段 complateGroupCounts */
export const recordGroupCounts = (data: MarkCompleteGroupsPayload & {
  complateGroupCounts: number[];
}) =>
  request.post<ExRecordVideoMarkResult>('/patient/exRecordVideo/recordGroupCounts', {
    ...data,
    exPatientRuleId: String(data.exPatientRuleId),
    exVideoId: String(data.exVideoId),
    exerciseDuration: normalizeRecordExerciseDuration(data.exerciseDuration),
    exerciseKcal: data.exerciseKcal != null
      ? Math.max(0, Number(data.exerciseKcal) || 0)
      : undefined,
    complateGroups: Array.isArray(data.complateGroups) ? data.complateGroups : [],
    complateGroupCounts: Array.isArray(data.complateGroupCounts)
      ? data.complateGroupCounts.map(item => Math.max(0, Math.round(Number(item) || 0)))
      : [],
  });

/** 记录锻炼时长（累加当日该视频累计分钟）；计时类型使用，组数字段传空数组 */
export const recordDuration = (data: MarkCompleteGroupsPayload) =>
  request.post<ExRecordVideoMarkResult>('/patient/exRecordVideo/recordDuration', {
    ...data,
    exPatientRuleId: String(data.exPatientRuleId),
    exVideoId: String(data.exVideoId),
    exerciseDuration: normalizeRecordExerciseDuration(data.exerciseDuration),
    exerciseKcal: data.exerciseKcal != null
      ? Math.max(0, Number(data.exerciseKcal) || 0)
      : undefined,
    complateGroups: Array.isArray(data.complateGroups) ? data.complateGroups : [],
    complateGroupCounts: Array.isArray(data.complateGroupCounts)
      ? data.complateGroupCounts.map(item => Math.max(0, Math.round(Number(item) || 0)))
      : [],
  });

/** 记录消耗 kcal（累加当日该视频累计消耗）；有效字段 exerciseKcal */
export const recordKcal = (data: MarkCompleteGroupsPayload & { exerciseKcal: number }) =>
  request.post<ExRecordVideoMarkResult>('/patient/exRecordVideo/recordKcal', {
    ...data,
    exPatientRuleId: String(data.exPatientRuleId),
    exVideoId: String(data.exVideoId),
    exerciseDuration: normalizeRecordExerciseDuration(data.exerciseDuration),
    exerciseKcal: Math.max(0, Number(data.exerciseKcal) || 0),
    complateGroups: Array.isArray(data.complateGroups) ? data.complateGroups : [],
    complateGroupCounts: Array.isArray(data.complateGroupCounts)
      ? data.complateGroupCounts.map(item => Math.max(0, Math.round(Number(item) || 0)))
      : [],
  });

export type GetExRecordVideoCompleteInfoParams = {
  exPatientRuleId: string;
  customerLocalDate: string;
  trainingPhase: ExRecordTrainingPhase;
  /** trainingPhase=main 时必填 */
  exerciseType?: string;
  exVideoId: string;
};

export type ExRecordVideoCompleteInfo = {
  id?: number;
  exPatientRuleId?: number;
  userId?: number;
  customerLocalDate?: string;
  trainingPhase?: string;
  exerciseType?: string;
  exVideoId?: string | number;
  exerciseDuration?: number;
  exerciseKcal?: number;
  complateGroups?: number[];
  /** 每组完成的次数，与组序号一一对应 */
  complateGroupCounts?: number[];
  isComplate?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
};

/** 查询指定处方、训练阶段、模块、视频的当日完成情况 */
export const getExRecordVideoCompleteInfo = (
  params: GetExRecordVideoCompleteInfoParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExRecordVideoCompleteInfo }>(
    '/patient/exRecordVideo/getCompleteInfo',
    {
      params: {
        ...params,
        exPatientRuleId: String(params.exPatientRuleId),
        exVideoId: String(params.exVideoId),
      },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

/** 按日期范围查询每日是否运动过 */
export type ExRecordVideoIsExerciseByDateItem = {
  customerLocalDate?: string;
  /** 当日是否存在记录：true 有，false 无 */
  exists?: boolean;
};

export type ExRecordVideoIsExerciseByDateRangeParams = {
  /** 运动处方 id（数据隔离） */
  exPatientRuleId: string;
  startDate: string;
  endDate: string;
};

export const getExRecordVideoIsExerciseByDateRange = (
  params: ExRecordVideoIsExerciseByDateRangeParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExRecordVideoIsExerciseByDateItem[] }>(
    '/patient/exRecordVideo/isExerciseByDateRange',
    {
      params: {
        exPatientRuleId: String(params.exPatientRuleId),
        startDate: params.startDate,
        endDate: params.endDate,
      },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

/** 指定处方、指定日期的总锻炼时长、总消耗 kcal 与主训练完成率 */
export type GetExRecordVideoDayStatParams = {
  exPatientRuleId: string;
  customerLocalDate: string;
};

export type ExRecordVideoDayStat = {
  exPatientRuleId?: number;
  customerLocalDate?: string;
  /** 当日总锻炼时长（分钟），含热身/主训练/冷身 */
  sumExerciseDuration?: number;
  hotExerciseDuration?: number;
  mainExerciseDuration?: number;
  coldExerciseDuration?: number;
  /** 当日总消耗 kcal */
  exerciseKcal?: number;
  mainTotalCount?: number;
  mainCompleteCount?: number;
  /** 主训练完成率 0-100 */
  mainCompleteRate?: number;
};

export const getExRecordVideoDayStat = (
  params: GetExRecordVideoDayStatParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: ExRecordVideoDayStat }>(
    '/patient/exRecordVideo/getDayStat',
    {
      params: {
        exPatientRuleId: String(params.exPatientRuleId),
        customerLocalDate: params.customerLocalDate,
      },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );
