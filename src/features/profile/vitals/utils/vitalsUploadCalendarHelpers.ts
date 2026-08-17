import {
  type MeasureDataType,
  type VitalsMeasureType,
} from '@/api/measureData';
import { WEARABLE_DATA_TYPES } from '@/api/wearableData';
import { AppTheme } from '@/common/theme';
import {
  loadUploadMarkerMapByYear,
  type DatePickerUploadMap,
  type DatePickerUploadMarker,
} from '@/src/features/nutrition/components/utils/datePickerUploadHelpers';

export const VITALS_UPLOAD_DOT_COLOR = AppTheme.primaryColor;

export type VitalsUploadMarker = DatePickerUploadMarker;
export type VitalsUploadMap = DatePickerUploadMap;

const WEARABLE_MEASURE_API_TYPE: Partial<Record<VitalsMeasureType, string>> = {
  血氧: WEARABLE_DATA_TYPES.oxygen,
  心率: WEARABLE_DATA_TYPES.heartRate,
  步数: WEARABLE_DATA_TYPES.steps,
  消耗: WEARABLE_DATA_TYPES.activeEnergy,
  睡眠: WEARABLE_DATA_TYPES.sleep,
};

const MEASURE_API_TYPES = new Set<MeasureDataType>([
  '血压',
  '血糖',
  '体温',
  '尿酸',
  '血脂',
  '体重',
]);

export function resolveVitalsUploadMarker(measureType: VitalsMeasureType): VitalsUploadMarker {
  const wearableType = WEARABLE_MEASURE_API_TYPE[measureType];
  if (wearableType) {
    return {
      source: 'wearable',
      type: wearableType,
      color: VITALS_UPLOAD_DOT_COLOR,
    };
  }
  if (MEASURE_API_TYPES.has(measureType as MeasureDataType)) {
    return {
      source: 'measure',
      type: measureType,
      color: VITALS_UPLOAD_DOT_COLOR,
    };
  }
  return {
    source: 'measure',
    type: measureType,
    color: VITALS_UPLOAD_DOT_COLOR,
  };
}

/** 按年懒加载上传标记（未来年直接跳过） */
export async function loadVitalsUploadMapByYear(
  marker: Pick<VitalsUploadMarker, 'source' | 'type'>,
  year: number,
  options?: { patientUserId?: string | number | null },
): Promise<VitalsUploadMap | null> {
  return loadUploadMarkerMapByYear(marker, year, options);
}
