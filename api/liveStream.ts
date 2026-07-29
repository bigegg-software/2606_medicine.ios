import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type LiveStreamItem = {
  liveId?: number | string;
  coverOssId?: number | string;
  coverOssUrl?: string;
  title?: string;
  liveType?: string;
  anchorName?: string;
  liveStartTime?: string;
  liveEndTime?: string;
  livePlatform?: string;
  /** 第三方观看链接（如小鹅通） */
  liveUrl?: string;
  watchUrl?: string;
  liveIntro?: string;
  liveHighlights?: string;
  status?: number;
  statusName?: string;
  viewCount?: number;
  /** 预约人数 */
  reserveCount?: number;
  isReserved?: boolean;
  createTime?: string;
  updateTime?: string;
};

export type LiveStreamListParams = {
  liveType?: string;
  status?: number;
  pageSize?: number;
  pageNum?: number;
};

export type LiveStreamListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: LiveStreamItem[];
};

export type LiveStreamInfoResult = ApiResult & {
  data?: LiveStreamItem;
};

export type LiveStreamToggleResult = ApiResult & {
  data?: { status?: boolean };
};

export const getLiveStreamList = (params?: LiveStreamListParams) =>
  request.get<LiveStreamListResult>('/patient/liveStream/list', { params });

export const getLiveStreamInfo = (liveId: string) =>
  request.get<LiveStreamInfoResult>('/patient/liveStream/getInfo', { params: { liveId } });

export const recordLiveStreamView = (liveId: string) =>
  request.post<ApiResult>('/patient/liveStream/recordView', { liveId });

export const toggleLiveStreamReservation = (data: { liveId: string; status: boolean }) =>
  request.post<LiveStreamToggleResult>('/patient/liveStream/toggleReservation', data);
