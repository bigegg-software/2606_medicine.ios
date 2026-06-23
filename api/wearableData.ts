import request from '@/utils/axios';

export type WearableDataType =
  | 'sleepAnalysis'
  | 'heartRate'
  | 'stepCount'
  | 'oxygenSaturation'
  | 'activeEnergyBurned'
  | 'basalEnergyBurned';

export const WEARABLE_DATA_TYPES = {
  sleep: 'sleepAnalysis',
  heartRate: 'heartRate',
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
