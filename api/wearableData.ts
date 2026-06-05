import request from '@/utils/axios';

export type WearableDataType = 'sleepAnalysis' | 'restingHeartRate' | 'stepCount' | 'oxygenSaturation';

export const WEARABLE_DATA_TYPES = {
  sleep: 'sleepAnalysis',
  heartRate: 'restingHeartRate',
  steps: 'stepCount',
  oxygen: 'oxygenSaturation',
} as const satisfies Record<string, WearableDataType>;

export type WearableDataItem = {
  wearableDataId?: number;
  userId?: number;
  type?: string;
  dataDate?: string;
  customerLocalDate?: string;
  startTimeStr?: string;
  endTimeStr?: string;
  stepCount?: number;
  restingHeartRate?: number;
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
