import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type MeasureDataType = '血压' | '血糖' | '体温' | '尿酸' | '血脂' | '体重';
export type VitalsMeasureType = MeasureDataType | '血氧' | '心率' | '步数' | '消耗' | '睡眠';

export type VitalKey =
  | 'bloodPressure'
  | 'bloodGlucose'
  | 'bodyTemperature'
  | 'uricAcid'
  | 'bloodLipids';

export const VITAL_KEYS: VitalKey[] = [
  'bloodPressure',
  'bloodGlucose',
  'bodyTemperature',
  'uricAcid',
  'bloodLipids',
];

export const VITAL_KEY_API_TYPE: Record<VitalKey, MeasureDataType> = {
  bloodPressure: '血压',
  bloodGlucose: '血糖',
  bodyTemperature: '体温',
  uricAcid: '尿酸',
  bloodLipids: '血脂',
};

export type MeasureDataDayGroup = {
  customerLocalDate?: string;
  childList?: MeasureDataItem[];
};

export type MeasureDataRangeDetailResult = {
  code?: number;
  msg?: string;
  data?: MeasureDataDayGroup[];
};

export type AddMeasureDataPayload = {
  id?: number | null;
  type: MeasureDataType;
  customerLocalDate: string;
  dataTime: string;
  val: number;
  val2?: number;
  measurementStatus?: string;
  measuringSite?: string;
  remark?: string;
  thirdPartyDataId?: string;
  sourceName?: string;
  xuezhiTc?: number;
  xuezhiTg?: number;
  xuezhiHdlC?: number;
  xuezhiLdlC?: number;
};

export type BatchDeviceMeasureDataItem = {
  id?: number;
  type: MeasureDataType;
  customerLocalDate: string;
  dataTime: string;
  val?: number;
  val2?: number;
  measurementStatus?: string;
  measuringSite?: string;
  remark?: string;
  thirdPartyDataId?: string;
  sourceName?: string;
  xuezhiTc?: number;
  xuezhiTg?: number;
  xuezhiHdlC?: number;
  xuezhiLdlC?: number;
};

export type AddMeasureDataResult = {
  code?: number;
  msg?: string;
};

export type UpdateMeasureDataPayload = AddMeasureDataPayload & {
  id: number;
};

export type MeasureDataItem = {
  id?: number;
  userId?: number;
  type?: string;
  customerLocalDate?: string;
  dataTime?: string;
  val?: number;
  val2?: number;
  bmi?: number | string;
  isHigh?: number;
  isLow?: number;
  level?: string;
  measurementStatus?: string;
  measuringSite?: string;
  remark?: string;
  sourceName?: string;
  xuezhiTc?: number;
  xuezhiTg?: number;
  xuezhiHdlC?: number;
  xuezhiLdlC?: number;
};

export type MeasureDataDetailResult = {
  code?: number;
  msg?: string;
  data?: MeasureDataItem[];
};

export type MeasureDataLatestResult = {
  code?: number;
  msg?: string;
  data?: MeasureDataItem;
};

export type MeasureDataAllRecordsParams = {
  type?: MeasureDataType | '';
  pageSize?: number;
  pageNum?: number;
  isHigh?: number;
  isLow?: number;
  stepIsGoals?: number;
  activeEnergyIsGoals?: number;
  levelLabel?: string;
};

export type MeasureDataAllRecordsDayGroup = {
  id?: number;
  customerLocalDate?: string;
  avgVal?: number;
  avgVal2?: number;
  childList?: MeasureDataItem[];
  statisLevelResult?: {
    level?: string;
    isHigh?: boolean;
    isLow?: boolean;
  };
};

export type MeasureDataAllRecordsMonthGroup = {
  yyyyMM?: string;
  list?: MeasureDataAllRecordsDayGroup[];
};

export type MeasureDataAllRecordsResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: MeasureDataAllRecordsMonthGroup[];
};

export const addMeasureData = (data: AddMeasureDataPayload) =>
  request.post<AddMeasureDataResult>('/patient/measureData/add', data);

/** 批量新增测量数据（同步设备数据） */
export const batchAddDeviceMeasureData = (data: BatchDeviceMeasureDataItem[]) =>
  request.post<AddMeasureDataResult>('/patient/measureData/batchAddDeviceData', data);

export const updateMeasureData = (data: UpdateMeasureDataPayload) =>
  request.put<AddMeasureDataResult>('/patient/measureData/update', data);

export const removeMeasureDataById = (id: number) =>
  request.delete<AddMeasureDataResult>('/patient/measureData/removeById', { params: { id } });

/** 按 id 查询单条测量数据（消息跳转存在性校验） */
export const getMeasureDataById = (id: string | number) =>
  request.get<MeasureDataLatestResult>('/patient/measureData/getInfo', {
    params: { id: String(id) },
  });

export const getMeasureDataDetailByDate = (
  params: {
    customerLocalDate: string;
    type: MeasureDataType;
  },
  options?: { patientUserId?: string | number | null },
) =>
  request.post<MeasureDataDetailResult>(
    '/patient/measureData/detailByCustomerLocalDate',
    {},
    {
      params,
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export const getMeasureDataLatestByType = (
  type: MeasureDataType,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<MeasureDataLatestResult>('/patient/measureData/latestByType', {
    params: { type },
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export type MeasureDataLatestTwoResult = {
  code?: number;
  msg?: string;
  data?: MeasureDataItem[];
};

/** 指定类型最近两条测量数据 */
export const getMeasureDataLatestTwoByType = (
  type: MeasureDataType,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<MeasureDataLatestTwoResult>('/patient/measureData/latestTwoByType', {
    params: { type },
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export const getMeasureDataDetailByDateRange = (
  params: {
    startDate: string;
    endDate: string;
    type: MeasureDataType;
  },
  options?: { patientUserId?: string | number | null },
) =>
  request.post<MeasureDataRangeDetailResult>(
    '/patient/measureData/detailByBetweenCustomerLocalDate/detail',
    {},
    {
      params,
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export type MeasureDataStatisDayGroup = {
  id?: number;
  userId?: number;
  type?: string;
  customerLocalDate?: string;
  avgVal?: number;
  avgVal2?: number;
  statisLevelResult?: {
    level?: string;
    isHigh?: boolean;
    isLow?: boolean;
  };
  childList?: MeasureDataItem[];
};

export type MeasureDataStatisResult = {
  code?: number;
  msg?: string;
  data?: MeasureDataStatisDayGroup[];
};

export const getMeasureDataStatisByDateRange = (
  params: {
    startDate: string;
    endDate: string;
    type: MeasureDataType;
  },
  options?: { patientUserId?: string | number | null },
) =>
  request.post<MeasureDataStatisResult>(
    '/patient/measureData/detailByBetweenCustomerLocalDate/statis',
    {},
    {
      params,
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export const getMeasureDataAllRecords = (
  params: MeasureDataAllRecordsParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<MeasureDataAllRecordsResult>('/patient/measureData/allRecords', {
    params,
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

export type MeasureDataNormalDayCountParams = {
  exPatientRuleId: string;
  type: MeasureDataType;
  userId?: string;
};

export const getMeasureDataNormalDayCount = (
  params: MeasureDataNormalDayCountParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: number }>(
    '/patient/exMeasureData/normalDayCount',
    {
      params,
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );

export type MeasureIsUploadByDateItem = {
  customerLocalDate?: string;
  exists?: boolean;
};

export type MeasureIsUploadByDateRangeResult = {
  code?: number;
  msg?: string;
  data?: MeasureIsUploadByDateItem[];
};

/** 按日期范围查询指定类型测量数据每日是否上传过 */
export const getMeasureDataIsUploadByDateRange = (
  params: {
    type: MeasureDataType | string;
    startDate: string;
    endDate: string;
  },
  options?: { patientUserId?: string | number | null },
) =>
  request.get<MeasureIsUploadByDateRangeResult>('/patient/measureData/isUploadByDateRange', {
    params,
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });
