import request from '@/utils/axios';

export type MeasureDataType = '血压' | '血糖' | '体温' | '尿酸' | '血脂';
export type VitalsMeasureType = MeasureDataType | '血氧' | '心率' | '步数' | '消耗';

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

export const updateMeasureData = (data: UpdateMeasureDataPayload) =>
  request.put<AddMeasureDataResult>('/patient/measureData/update', data);

export const removeMeasureDataById = (id: number) =>
  request.delete<AddMeasureDataResult>('/patient/measureData/removeById', { params: { id } });

export const getMeasureDataDetailByDate = (params: {
  customerLocalDate: string;
  type: MeasureDataType;
}) =>
  request.post<MeasureDataDetailResult>('/patient/measureData/detailByCustomerLocalDate', {}, { params });

export const getMeasureDataDetailByDateRange = (params: {
  startDate: string;
  endDate: string;
  type: MeasureDataType;
}) =>
  request.post<MeasureDataRangeDetailResult>(
    '/patient/measureData/detailByBetweenCustomerLocalDate/detail',
    {},
    { params },
  );

export const getMeasureDataAllRecords = (params: MeasureDataAllRecordsParams) =>
  request.get<MeasureDataAllRecordsResult>('/patient/measureData/allRecords', { params });
