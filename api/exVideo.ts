import request from '@/utils/axios';

export type ExVideoInfo = {
  exVideoId?: number;
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
