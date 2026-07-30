import request from '@/utils/axios';

export type WearableDataType =
  | 'sleepAnalysis'
  | 'heartRate'
  | 'restingHeartRate'
  | 'stepCount'
  | 'oxygenSaturation'
  | 'activeEnergyBurned'
  | 'basalEnergyBurned';

export const WEARABLE_DATA_TYPES = {
  sleep: 'sleepAnalysis',
  heartRate: 'heartRate',
  restingHeartRate: 'restingHeartRate',
  steps: 'stepCount',
  oxygen: 'oxygenSaturation',
  activeEnergy: 'activeEnergyBurned',
  basalEnergy: 'basalEnergyBurned',
} as const satisfies Record<string, WearableDataType>;

export type WearableOriginalReading = {
  id?: string;
  value?: string | number;
  startDate?: string;
  endDate?: string;
  sourceId?: string;
  sourceName?: string;
  highLowLabel?: string;
};

export type WearableDataItem = {
  wearableDataId?: number | string;
  userId?: number | string;
  type?: string;
  dataDate?: string;
  customerLocalDate?: string;
  startTimeStr?: string;
  endTimeStr?: string;
  bedTimeStr?: string;
  wakeUpTimeStr?: string;
  originalData?: WearableOriginalReading[] | WearableOriginalReading[][];
  stepCount?: number;
  heartRate?: number;
  newHeartRate?: string;
  maxHeartRate?: number;
  minHeartRate?: number;
  newOxygenSaturation?: string;
  maxOxygenSaturation?: string;
  minOxygenSaturation?: string;
  sleepTime?: number;
  asleepTime?: number;
  deepSleepTime?: number;
  coreSleepTime?: number;
  remSleepTime?: number;
  awakeSleepTime?: number;
  inbedSleepTime?: number;
  sqsScore?: number;
  isHigh?: number;
  isLow?: number;
  sleepGoals?: number;
  stepGoals?: number;
  energyGoals?: number;
  restingHeartRate?: number;
  activeEnergyBurned?: number;
  basalEnergyBurned?: number;
};

export type WearableDataRangeResult = {
  code?: number;
  msg?: string;
  data?: WearableDataItem[];
};

export type WearableDataDetailResult = {
  code?: number;
  msg?: string;
  data?: WearableDataItem;
};

export const getWearableDataDetailByDateRange = (params: {
  startDate: string;
  endDate: string;
  type: WearableDataType;
  returnOriginalData?: boolean;
}) =>
  request.post<WearableDataRangeResult>(
    '/patient/wearableData/detailByBetweenCustomerLocalDate',
    {},
    { params },
  );

export const getWearableDataDetailByCustomerLocalDate = (params: {
  customerLocalDate: string;
  type: WearableDataType;
}) =>
  request.post<WearableDataDetailResult>(
    '/patient/wearableData/detailByCustomerLocalDate',
    {},
    { params },
  );

export const getWearableDataLatestByType = (type: WearableDataType) =>
  request.get<WearableDataDetailResult>('/patient/wearableData/latestByType', { params: { type } });

export type WearableUploadPayload = {
  type: string;
  appType: number;
  data: {
    last?: boolean;
    batchNum: string;
    origin: unknown[];
    startTime: string;
    endTime: string;
  };
};

export type WearableUploadResult = {
  code?: number;
  msg?: string;
};

export const uploadWearableData = (data: WearableUploadPayload) =>
  request.post<WearableUploadResult>('/patient/wearableData/upload', data);

export type LatestUploadTimeResult = {
  code?: number;
  msg?: string;
  data?: string | number | null;
};

export const getLatestWearableUploadTime = () =>
  request.get<LatestUploadTimeResult>('/patient/wearableData/latestUploadTime');

export type HeartRateAbnormalCount = {
  highCount?: number;
  lowCount?: number;
};

export type HeartRateAbnormalCountResult = {
  code?: number;
  msg?: string;
  data?: HeartRateAbnormalCount;
};

export const getHeartRateAbnormalCount = (params: {
  startDate: string;
  endDate: string;
  returnOriginalData?: boolean;
}) =>
  request.post<HeartRateAbnormalCountResult>(
    '/patient/wearableData/heartRateAbnormalCount',
    {},
    { params },
  );

export type WearableRemoveResult = {
  code?: number;
  msg?: string;
};

export const removeWearableOriginalDataById = (wearableDataId: string, id: string) =>
  request.delete<WearableRemoveResult>('/patient/wearableData/removeOriginalDataById', {
    params: { wearableDataId, id },
  });

export type WearableIsUploadByDateItem = {
  customerLocalDate?: string;
  exists?: boolean;
};

export type WearableIsUploadByDateRangeResult = {
  code?: number;
  msg?: string;
  data?: WearableIsUploadByDateItem[];
};

/** 按日期范围查询指定类型穿戴数据每日是否上传过 */
export const getWearableDataIsUploadByDateRange = (params: {
  type: WearableDataType | string;
  startDate: string;
  endDate: string;
}) =>
  request.get<WearableIsUploadByDateRangeResult>(
    '/patient/wearableData/isUploadByDateRange',
    { params },
  );
