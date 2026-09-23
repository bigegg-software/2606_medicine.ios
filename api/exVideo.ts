import request from '@/utils/axios';

/** 动作类型：home.居家 in_store.到店 */
export type ExVideoActionType = 'home' | 'in_store';

export type ExVideoInfo = {
  exVideoId?: number | string;
  coverOssId?: number;
  coverOssUrl?: string;
  videoOssId?: number;
  videoOssUrl?: string;
  title?: string;
  videoIntro?: string;
  exerciseType?: string;
  exerciseChildType?: string;
  difficultyLevel?: string;
  strengthLevel?: string;
  trainingSteps?: string;
  trainingPrompt?: string;
  precautions?: string;
  labels?: string;
  displayStatus?: number;
  viewCount?: number;
  duration?: number;
  trainingPhase?: string;
  timerType?: string;
  durationMinVal?: number;
  /** 每分钟消耗 kcal */
  kcalPerMinute?: number | string;
  groupVal?: number;
  numberVal?: number;
  keepSecondVal?: number;
  restBetweenGroupSeconds?: number;
  /** 适用人群（英文逗号分割） */
  applicableCrowd?: string;
  /** 禁忌人群（英文逗号分割） */
  contraindicatedCrowd?: string;
  exerciseBodyParts?: string[];
  /** 动作类型：home.居家 in_store.到店 */
  actionType?: string;
  /** 单次预计时长，单位秒（非必填）；group_number 时 × 次数作为每组计时 */
  estimatedSingleSeconds?: number;
  createTime?: string;
  updateTime?: string;
};

export type ExVideoFrontListParams = {
  exerciseType: string;
  exerciseChildType: string;
  strengthLevel: string;
};

export type ExVideoFrontListResult = {
  code?: number;
  msg?: string;
  data?: ExVideoInfo[];
};

export const getExVideoFrontList = (params: ExVideoFrontListParams) =>
  request.get<ExVideoFrontListResult>('/patient/exVideo/frontList', { params });

export const getExVideoInfo = (exVideoId: string) =>
  request.get<{ code?: number; msg?: string; data?: ExVideoInfo }>(
    '/patient/exVideo/getInfo',
    { params: { exVideoId: String(exVideoId) } },
  );

/** 视频播放量埋点（播放量 +1） */
export const recordExVideoView = (exVideoId: string) =>
  request.post<{ code?: number; msg?: string }>(
    '/patient/exVideo/recordView',
    undefined,
    { params: { exVideoId: String(exVideoId) } },
  );
