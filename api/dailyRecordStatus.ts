import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type DailyRecordStatusItem = {
  customerLocalDate?: string;
  isDiet?: boolean;
  isEx?: boolean;
  isDrug?: boolean;
  isActivity?: boolean;
  isLive?: boolean;
};

export type DailyRecordStatusListResult = {
  code?: number;
  msg?: string;
  data?: DailyRecordStatusItem[];
};

export type DailyActivityItem = {
  activityId?: number | string;
  activityName?: string;
  activityType?: string;
  coverOssId?: number | string;
  coverOssUrl?: string;
  activityStartTime?: string;
  activityEndTime?: string;
  status?: number;
  statusName?: string;
  activityLocation?: string;
  activityRemark?: string;
  isBm?: boolean;
};

export type DailyLiveItem = {
  liveId?: number | string;
  coverOssUrl?: string;
  title?: string;
  liveType?: string;
  anchorName?: string;
  liveStartTime?: string;
  liveEndTime?: string;
  livePlatform?: string;
  liveIntro?: string;
  status?: number;
  statusName?: string;
  isReserved?: boolean;
};

export const getDailyRecordStatusListByDateRange = (
  params: {
    startDate: string;
    endDate: string;
  },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<DailyRecordStatusListResult>('/patient/dailyRecordStatus/listByDateRange', {
    params,
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const getDailyActivityListByDate = (
  params: { customerLocalDate: string },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: DailyActivityItem[] }>(
    '/patient/dailyRecordStatus/activityListByDate',
    {
      params,
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export const getDailyLiveListByDate = (
  params: { customerLocalDate: string },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: DailyLiveItem[] }>(
    '/patient/dailyRecordStatus/liveListByDate',
    {
      params,
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );
