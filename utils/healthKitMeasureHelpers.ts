import moment from 'moment';
import type { BatchDeviceMeasureDataItem, MeasureDataType } from '@/api/measureData';

type HealthKitSampleLike = {
  id?: string;
  startDate?: string;
  value?: number;
  bloodPressureSystolicValue?: number;
  bloodPressureDiastolicValue?: number;
  sourceName?: string;
  metadata?: {
    HKBloodGlucoseMealTime?: number;
    sourceName?: string;
  };
};

function toFiniteNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function roundByType(type: MeasureDataType, value: number): number {
  if (type === '血压') return Math.round(value);
  if (type === '体重' || type === '体温') return Math.round(value * 10) / 10;
  if (type === '血糖') return Math.round(value * 100) / 100;
  return value;
}

function resolveSourceName(sample: HealthKitSampleLike): string | undefined {
  if (typeof sample.sourceName === 'string' && sample.sourceName.trim()) {
    return sample.sourceName.trim();
  }
  const metaName = sample.metadata?.sourceName;
  if (typeof metaName === 'string' && metaName.trim()) {
    return metaName.trim();
  }
  return 'Apple Health';
}

function resolveGlucoseMeasurementStatus(sample: HealthKitSampleLike): string | undefined {
  const mealTime = sample.metadata?.HKBloodGlucoseMealTime;
  if (mealTime === 1) return '餐前';
  if (mealTime === 2) return '餐后';
  return undefined;
}

function buildBaseItem(
  type: MeasureDataType,
  sample: HealthKitSampleLike,
  val: number,
  val2?: number,
): BatchDeviceMeasureDataItem | null {
  if (!sample.startDate) return null;
  const m = moment(sample.startDate);
  if (!m.isValid()) return null;

  const thirdPartyDataId =
    sample.id != null && String(sample.id).trim()
      ? String(sample.id)
      : `${type}_${m.format('YYYY-MM-DDTHH:mm:ss')}_${val}${val2 != null ? `_${val2}` : ''}`;

  return {
    type,
    customerLocalDate: m.format('YYYY-MM-DD'),
    dataTime: m.format('HH:mm'),
    val: roundByType(type, val),
    ...(val2 != null ? { val2: roundByType(type, val2) } : {}),
    thirdPartyDataId,
    sourceName: resolveSourceName(sample),
  };
}

/** HealthKit 血糖样本 → 测量上报项 */
export function mapBloodGlucoseSamplesToDeviceItems(
  samples: HealthKitSampleLike[] | null | undefined,
): BatchDeviceMeasureDataItem[] {
  if (!Array.isArray(samples) || samples.length === 0) return [];
  const items: BatchDeviceMeasureDataItem[] = [];
  for (const sample of samples) {
    const val = toFiniteNumber(sample.value);
    if (val == null) continue;
    const item = buildBaseItem('血糖', sample, val);
    if (!item) continue;
    const status = resolveGlucoseMeasurementStatus(sample);
    if (status) item.measurementStatus = status;
    items.push(item);
  }
  return items;
}

/** HealthKit 血压样本 → 测量上报项 */
export function mapBloodPressureSamplesToDeviceItems(
  samples: HealthKitSampleLike[] | null | undefined,
): BatchDeviceMeasureDataItem[] {
  if (!Array.isArray(samples) || samples.length === 0) return [];
  const items: BatchDeviceMeasureDataItem[] = [];
  for (const sample of samples) {
    const systolic = toFiniteNumber(sample.bloodPressureSystolicValue);
    const diastolic = toFiniteNumber(sample.bloodPressureDiastolicValue);
    if (systolic == null || diastolic == null) continue;
    const item = buildBaseItem('血压', sample, systolic, diastolic);
    if (item) items.push(item);
  }
  return items;
}

/** HealthKit 体重样本 → 测量上报项（kg） */
export function mapWeightSamplesToDeviceItems(
  samples: HealthKitSampleLike[] | null | undefined,
): BatchDeviceMeasureDataItem[] {
  if (!Array.isArray(samples) || samples.length === 0) return [];
  const items: BatchDeviceMeasureDataItem[] = [];
  for (const sample of samples) {
    const val = toFiniteNumber(sample.value);
    if (val == null) continue;
    const item = buildBaseItem('体重', sample, val);
    if (item) items.push(item);
  }
  return items;
}

/** HealthKit 体温样本 → 测量上报项（℃） */
export function mapBodyTemperatureSamplesToDeviceItems(
  samples: HealthKitSampleLike[] | null | undefined,
): BatchDeviceMeasureDataItem[] {
  if (!Array.isArray(samples) || samples.length === 0) return [];
  const items: BatchDeviceMeasureDataItem[] = [];
  for (const sample of samples) {
    const val = toFiniteNumber(sample.value);
    if (val == null) continue;
    const item = buildBaseItem('体温', sample, val);
    if (item) items.push(item);
  }
  return items;
}
