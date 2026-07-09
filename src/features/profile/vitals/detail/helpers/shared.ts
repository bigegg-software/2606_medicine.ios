import moment from 'moment';
import type {
  MeasureDataItem,
  MeasureDataStatisDayGroup,
} from '@/api/measureData';
import type { WearableDataItem, WearableOriginalReading } from '@/api/wearableData';
import {
  getDateRange,
  type VitalsRange,
} from '../../vitalsHelpers';

export function parseMeasureNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function parseMeasureDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  const parsed = moment(
    value,
    [
      moment.ISO_8601,
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'YYYY/MM/DD HH:mm:ss',
      'YYYY/MM/DD HH:mm',
      'YYYY/MM/DD',
    ],
    true,
  );
  return parsed.isValid() ? parsed : null;
}

export function getItemTimestamp(item: MeasureDataItem) {
  const parsedDate = parseMeasureDate(item.customerLocalDate);
  const base = parsedDate ? parsedDate.clone().startOf('day') : moment().startOf('day');
  const time = item.dataTime?.trim();
  if (!time) return base;

  const parsedTime = moment(time, ['HH:mm:ss', 'HH:mm', 'H:mm'], true);
  if (parsedTime.isValid()) {
    return base.hour(parsedTime.hour()).minute(parsedTime.minute()).second(parsedTime.second());
  }
  return base;
}

export function getWearableDate(item: WearableDataItem) {
  const date = item.customerLocalDate ?? item.dataDate?.slice(0, 10) ?? moment().format('YYYY-MM-DD');
  const parsed = moment(date, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : moment();
}

export function getWearableTimestamp(item: WearableDataItem) {
  if (item.startTimeStr) {
    const parsed = moment(item.startTimeStr);
    if (parsed.isValid()) return parsed;
  }
  if (item.dataDate && item.dataDate.length > 10) {
    const parsed = moment(item.dataDate);
    if (parsed.isValid()) return parsed;
  }
  return getWearableDate(item);
}

export function flattenWearableOriginalData(item: WearableDataItem): WearableOriginalReading[] {
  const data = item.originalData;
  if (!data?.length) return [];
  if (Array.isArray(data[0])) {
    return (data as WearableOriginalReading[][]).flat();
  }
  return data as WearableOriginalReading[];
}

function getOriginalReadingTimestamp(reading: WearableOriginalReading) {
  const dateStr = reading.startDate ?? reading.endDate;
  if (!dateStr) return null;
  const parsed = moment(dateStr);
  return parsed.isValid() ? parsed : null;
}

type WearableTimedReading = { ts: moment.Moment; value: number };

export function collectWearableReadings(
  items: WearableDataItem[],
  parseValue: (reading: WearableOriginalReading) => number | null,
): WearableTimedReading[] {
  const readings: WearableTimedReading[] = [];

  for (const item of items) {
    for (const reading of flattenWearableOriginalData(item)) {
      const ts = getOriginalReadingTimestamp(reading);
      const value = parseValue(reading);
      if (ts && value != null && value > 0) {
        readings.push({ ts, value: Math.round(value) });
      }
    }
  }

  return readings.sort((a, b) => a.ts.valueOf() - b.ts.valueOf());
}

export function collectHeartRateReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => parseMeasureNumber(reading.value));
}

export function collectOxygenReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => normalizeOxygenPercent(reading.value));
}

export function normalizeOxygenPercent(value?: string | number | null) {
  const raw = parseMeasureNumber(value);
  if (raw == null || raw <= 0) return null;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(raw);
}

export function parseWearableOxygenValue(item?: WearableDataItem) {
  if (!item) return null;
  return (
    normalizeOxygenPercent(item.newOxygenSaturation) ??
    normalizeOxygenPercent(item.maxOxygenSaturation) ??
    normalizeOxygenPercent(item.minOxygenSaturation)
  );
}

export function parseWearableHeartRateValue(item?: WearableDataItem) {
  if (!item) return null;
  const value =
    parseMeasureNumber(item.newHeartRate) ??
    parseMeasureNumber(item.heartRate) ??
    parseMeasureNumber(item.maxHeartRate) ??
    parseMeasureNumber(item.minHeartRate);
  return value != null ? Math.round(value) : null;
}

export function getLatestWearableItem(items: WearableDataItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

export function filterWearableItemsInRange(items: WearableDataItem[], range: VitalsRange) {
  const { startDate, endDate } = getDateRange(range);
  return items.filter(item => {
    const date = getWearableDate(item);
    return date.isBetween(startDate, endDate, 'day', '[]');
  });
}

export function parseStepsFromItem(item?: WearableDataItem) {
  if (!item) return 0;

  const readings = flattenWearableOriginalData(item);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => sum + (parseMeasureNumber(reading.value) ?? 0), 0);
    if (total > 0) return Math.round(total);
  }

  return Math.round(parseMeasureNumber(item.stepCount) ?? 0);
}

export function sumEnergyFromItem(item: WearableDataItem | undefined, field: 'activeEnergyBurned' | 'basalEnergyBurned') {
  if (!item) return 0;

  const fieldValue = Math.round(parseMeasureNumber(item[field]) ?? 0);
  const readings = flattenWearableOriginalData(item);
  if (!readings.length) return fieldValue;

  const values = readings
    .map(reading => parseMeasureNumber(reading.value) ?? 0)
    .filter(value => value > 0);
  if (!values.length) return fieldValue;

  const sumReadings = Math.round(values.reduce((sum, value) => sum + value, 0));
  const maxReading = Math.max(...values);
  const isIncremental = fieldValue <= 0
    ? sumReadings > maxReading * 1.5
    : sumReadings >= fieldValue * 0.85 && maxReading <= fieldValue * 0.5;

  if (isIncremental) {
    return fieldValue > 0 ? Math.max(fieldValue, sumReadings) : sumReadings;
  }

  const lastReading = Math.round(values[values.length - 1]);
  return Math.max(fieldValue, Math.round(maxReading), lastReading);
}

export function normalizeStatisRangeData(raw: unknown): MeasureDataStatisDayGroup[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];

  const first = raw[0];
  if (
    first != null &&
    typeof first === 'object' &&
    'list' in first &&
    Array.isArray((first as { list?: unknown }).list)
  ) {
    return raw.flatMap((month: { list?: MeasureDataStatisDayGroup[] }) => month.list ?? []);
  }

  return raw as MeasureDataStatisDayGroup[];
}

export type DetailChartRange = 'today' | 'week' | 'month';

export function mapDetailChartRangeToVitalsRange(range: DetailChartRange): VitalsRange {
  switch (range) {
    case 'week':
      return '7Days';
    case 'month':
      return '30Days';
    default:
      return 'today';
  }
}

export function getStatisLevelLabel(result?: MeasureDataStatisDayGroup['statisLevelResult']) {
  if (!result) return '';
  const level = result.level?.split(',')[0]?.trim();
  if (level) return level;
  if (result.isHigh) return '偏高';
  if (result.isLow) return '偏低';
  return '正常';
}
