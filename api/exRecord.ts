import request from '@/utils/axios';

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

export const postExRecordVideoView = (exVideoId: string) =>
  request.post<ExRecordApiResult>('/patient/exRecord/videoView', null, {
    params: { exVideoId: String(exVideoId) },
  });

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
  /** 完成的组数整数组，整数组覆盖写入，如 [1,2,3] */
  complateGroups: number[];
};

export type ExRecordVideoMarkResult = {
  code?: number;
  msg?: string;
  data?: {
    id?: number;
    exPatientRuleId?: number;
    complateGroups?: number[];
    isComplate?: number;
    exerciseDuration?: number;
  };
};

/** 标记完成组数（整数组覆盖写入） */
export const markCompleteGroups = (data: MarkCompleteGroupsPayload) =>
  request.post<ExRecordVideoMarkResult>('/patient/exRecordVideo/markCompleteGroups', {
    ...data,
    exPatientRuleId: String(data.exPatientRuleId),
    exVideoId: String(data.exVideoId),
    exerciseDuration: Math.max(0, Math.floor(Number(data.exerciseDuration) || 0)),
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
  complateGroups?: number[];
  isComplate?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
};

/** 查询指定处方、训练阶段、模块、视频的当日完成情况 */
export const getExRecordVideoCompleteInfo = (params: GetExRecordVideoCompleteInfoParams) =>
  request.get<{ code?: number; msg?: string; data?: ExRecordVideoCompleteInfo }>(
    '/patient/exRecordVideo/getCompleteInfo',
    {
      params: {
        ...params,
        exPatientRuleId: String(params.exPatientRuleId),
        exVideoId: String(params.exVideoId),
      },
    },
  );

/** 按日期范围查询每日是否运动过 */
export type ExRecordVideoIsExerciseByDateItem = {
  customerLocalDate?: string;
  /** 当日是否存在记录：true 有，false 无 */
  exists?: boolean;
};

export type ExRecordVideoIsExerciseByDateRangeParams = {
  startDate: string;
  endDate: string;
};

export const getExRecordVideoIsExerciseByDateRange = (
  params: ExRecordVideoIsExerciseByDateRangeParams,
) =>
  request.get<{ code?: number; msg?: string; data?: ExRecordVideoIsExerciseByDateItem[] }>(
    '/patient/exRecordVideo/isExerciseByDateRange',
    { params },
  );
