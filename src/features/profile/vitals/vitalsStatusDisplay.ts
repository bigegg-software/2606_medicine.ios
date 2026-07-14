import type { MeasureDataItem } from '@/api/measureData';
import type { WearableDataItem } from '@/api/wearableData';
import { getLevelColor } from './vitalLevelColors';

export const BLOOD_OXYGEN_LEVEL_COLORS = {
  normal: '#6D925E',
  slightlyLow: '#0951AE',
  low: '#EE9C44',
  severeLow: '#FB4550',
} as const;

export type BloodOxygenLevelKey = keyof typeof BLOOD_OXYGEN_LEVEL_COLORS;

export function getBloodOxygenLevel(value: number): BloodOxygenLevelKey {
  if (value >= 95) return 'normal';
  if (value >= 93) return 'slightlyLow';
  if (value >= 90) return 'low';
  return 'severeLow';
}

export function getBloodOxygenLevelLabel(value: number) {
  switch (getBloodOxygenLevel(value)) {
    case 'normal':
      return '正常';
    case 'slightlyLow':
      return '偏低';
    case 'low':
      return '较低';
    case 'severeLow':
      return '异常偏低';
  }
}

export function getBloodOxygenPointColor(value: number) {
  return BLOOD_OXYGEN_LEVEL_COLORS[getBloodOxygenLevel(value)];
}

export function formatBloodOxygenValueStatus(value: number) {
  const status = getBloodOxygenLevelLabel(value);
  return {
    status,
    statusColor: getBloodOxygenPointColor(value),
  };
}

export function getHeartRateStatusFromMinMax(min: number, max: number) {
  if (max > 100) return '偏高';
  if (min < 60) return '偏低';
  return '正常';
}

export function formatHeartRateValueStatus(value: number) {
  const status = getHeartRateStatusFromMinMax(value, value);
  return {
    status,
    statusColor: getLevelColor(status),
  };
}

const BODY_TEMPERATURE_LOW_THRESHOLD = 36.0;
const BODY_TEMPERATURE_HIGH_THRESHOLD = 37.2;
const BODY_TEMPERATURE_FEVER_THRESHOLD = 38.0;
const BODY_TEMPERATURE_COLOR_LOW = '#0951AE';
const BODY_TEMPERATURE_COLOR_NORMAL = '#6D925E';
const BODY_TEMPERATURE_COLOR_HIGH = '#EE9C44';
const BODY_TEMPERATURE_COLOR_FEVER = '#FB4550';

function parseMeasureNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getMeasureLevelLabel(item?: MeasureDataItem) {
  if (!item) return '';
  const level = item.level?.split(',')[0]?.trim();
  if (level) return level;
  if (item.isHigh === 1) return '偏高';
  if (item.isLow === 1) return '偏低';
  return '正常';
}

function normalizeBodyTemperatureLevelLabel(label?: string) {
  const trimmed = label?.split(',')[0]?.trim();
  if (!trimmed) return '';
  if (/发热|高热/.test(trimmed)) return '发热';
  if (/偏高/.test(trimmed)) return '偏高';
  if (/低体温|偏低/.test(trimmed)) return '偏低';
  if (/正常/.test(trimmed)) return '正常';
  if (/低血压|高血压|高血糖|低血糖|正常高值/.test(trimmed)) return '';
  return trimmed;
}

export function getBodyTemperatureLevelFromValue(min: number, max: number) {
  if (max >= BODY_TEMPERATURE_FEVER_THRESHOLD) return '发热';
  if (max > BODY_TEMPERATURE_HIGH_THRESHOLD) return '偏高';
  if (min < BODY_TEMPERATURE_LOW_THRESHOLD) return '偏低';
  return '正常';
}

export function getBodyTemperaturePointColor(value: number) {
  return getBodyTemperatureStatusColor(getBodyTemperatureLevelFromValue(value, value));
}

export function getBodyTemperatureStatusColor(label: string) {
  if (/偏低|低体温/.test(label)) return BODY_TEMPERATURE_COLOR_LOW;
  if (/发热|高热/.test(label)) return BODY_TEMPERATURE_COLOR_FEVER;
  if (/偏高/.test(label)) return BODY_TEMPERATURE_COLOR_HIGH;
  if (/正常/.test(label)) return BODY_TEMPERATURE_COLOR_NORMAL;
  return getLevelColor(label);
}

export function getBodyTemperatureItemStatusLabel(item: MeasureDataItem) {
  const value = parseMeasureNumber(item.val);
  if (value != null && value > 0) {
    const fromValue = getBodyTemperatureLevelFromValue(value, value);
    if (fromValue !== '正常') return fromValue;
  }
  return normalizeBodyTemperatureLevelLabel(getMeasureLevelLabel(item)) || '正常';
}

export function formatBodyTemperatureMeasureStatus(item?: MeasureDataItem) {
  if (!item) {
    return { status: '', statusColor: '#999999' };
  }
  const status = getBodyTemperatureItemStatusLabel(item);
  return {
    status,
    statusColor: getBodyTemperatureStatusColor(status),
  };
}

export function formatBodyTemperatureMeasureDisplay(item?: MeasureDataItem) {
  if (!item) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  const parsed = parseMeasureNumber(item.val);
  const value = parsed != null ? parsed.toFixed(1) : '--';
  const { status, statusColor } = formatBodyTemperatureMeasureStatus(item);

  return { value, status, statusColor };
}

/** @deprecated item flags retained for callers that still pass wearable item */
export function formatBloodOxygenWearableStatus(_item: WearableDataItem | undefined, value: number) {
  return formatBloodOxygenValueStatus(value);
}

/** @deprecated item flags retained for callers that still pass wearable item */
export function formatHeartRateWearableStatus(_item: WearableDataItem | undefined, value: number) {
  return formatHeartRateValueStatus(value);
}

export {
  BODY_TEMPERATURE_LOW_THRESHOLD,
  BODY_TEMPERATURE_HIGH_THRESHOLD,
  BODY_TEMPERATURE_FEVER_THRESHOLD,
};
