import request from '@/utils/axios';

export type MeasureDataType = '血压' | '血糖' | '体温';
export type VitalsMeasureType = MeasureDataType | '血氧' | '心率';

export type VitalKey = 'bloodPressure' | 'bloodGlucose' | 'bodyTemperature';

export const VITAL_KEYS: VitalKey[] = ['bloodPressure', 'bloodGlucose', 'bodyTemperature'];

export const VITAL_KEY_API_TYPE: Record<VitalKey, MeasureDataType> = {
  bloodPressure: '血压',
  bloodGlucose: '血糖',
  bodyTemperature: '体温',
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
};

export type MeasureDataDetailResult = {
  code?: number;
  msg?: string;
  data?: MeasureDataItem[];
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
