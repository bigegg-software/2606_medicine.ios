import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import {
  getTodayWearableItem,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  collectHeartRateReadings,
  collectRestingHeartRateReadings,
  filterWearableItemsInRange,
  getLatestWearableItem,
  getWearableDate,
  getWearableTimestamp,
  mapDetailChartRangeToVitalsRange,
  parseMeasureNumber,
  parseWearableHeartRateValue,
  parseWearableRestingHeartRateValue,
} from './shared';

export type HeartRateDetailChartRange = 'today' | 'week' | 'month';

export type HeartRateDetailPoint = {
  hour: string;
  min: number;
  max: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
};

function isValidHeartRateDetailPoint(point?: HeartRateDetailPoint) {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

function getHeartRateDetailStatus(point: HeartRateDetailPoint) {
  if (point.max > 100) return '偏高';
  if (point.min < 60) return '偏低';
  return '正常';
}

function getHeartRateStatsPeriodLabel(range: HeartRateDetailChartRange) {
  switch (range) {
    case 'week':
      return '近7天';
    case 'month':
      return '近30天';
    default:
      return '今日区间';
  }
}

function getHeartRateDayMinMax(dayItems: WearableDataItem[]) {
  const mins: number[] = [];
  const maxs: number[] = [];

  dayItems.forEach(item => {
    const min = parseMeasureNumber(item.minHeartRate);
    const max = parseMeasureNumber(item.maxHeartRate);
    if (min != null && min > 0) mins.push(Math.round(min));
    if (max != null && max > 0) maxs.push(Math.round(max));
  });

  if (!mins.length || !maxs.length) return null;
  return {
    min: Math.min(...mins),
    max: Math.max(...maxs),
  };
}

export function buildHeartRateDetailTodaySeries(items: WearableDataItem[]): HeartRateDetailPoint[] {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const readings = collectHeartRateReadings(todayItems);

  if (readings.length) {
    return readings.map(({ ts, value }) => ({
      hour: ts.format('HH:mm'),
      min: value,
      max: value,
      x: ts.hour() + ts.minute() / 60,
      dataTime: ts.format('HH:mm'),
      customerLocalDate: ts.format('YYYY-MM-DD'),
    }));
  }

  const latest = getLatestWearableItem(todayItems);
  const min = parseMeasureNumber(latest?.minHeartRate);
  const max = parseMeasureNumber(latest?.maxHeartRate);
  const single = parseWearableHeartRateValue(latest);
  const ts = latest ? getWearableTimestamp(latest) : moment();

  if (single != null && single > 0) {
    return [{
      hour: ts.format('HH:mm'),
      min: single,
      max: single,
      x: ts.hour() + ts.minute() / 60,
      dataTime: ts.format('HH:mm'),
      customerLocalDate: ts.format('YYYY-MM-DD'),
    }];
  }

  if (min != null && max != null && min > 0 && max > 0) {
    return [{
      hour: ts.format('HH:mm'),
      min: Math.round(min),
      max: Math.round(max),
      x: ts.hour() + ts.minute() / 60,
      dataTime: ts.format('HH:mm'),
      customerLocalDate: ts.format('YYYY-MM-DD'),
    }];
  }

  return [];
}

export function buildHeartRateDetailPeriodSeries(
  items: WearableDataItem[],
  range: 'week' | 'month',
): HeartRateDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const dayItems = items.filter(item => getWearableDate(item).isSame(day, 'day'));
    const minMax = getHeartRateDayMinMax(dayItems);

    return {
      hour: day.format('M/D'),
      min: minMax?.min ?? 0,
      max: minMax?.max ?? 0,
      customerLocalDate: day.format('YYYY-MM-DD'),
    };
  });
}

export function formatHeartRateCurrentLabel(
  range: HeartRateDetailChartRange,
  point?: HeartRateDetailPoint,
) {
  if (range === 'today') {
    const time = point?.dataTime?.trim() || point?.hour?.trim();
    return time ? `当前：今天 ${time}` : '当前：今天';
  }

  const date = point?.customerLocalDate;
  if (!date) return point?.hour ? `当前：${point.hour}` : '当前：--';
  return `当前：${moment(date).format('M/D')}`;
}

export function formatHeartRateDetailPointDisplay(
  range: HeartRateDetailChartRange,
  point?: HeartRateDetailPoint,
) {
  if (!isValidHeartRateDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
    };
  }

  const statusLabel = getHeartRateDetailStatus(point!);
  const value = range === 'today' && point!.min === point!.max
    ? String(point!.min)
    : `${point!.min}-${point!.max}`;
  return {
    value,
    status: statusLabel,
    statusColor: getLevelColor(statusLabel),
    currentLabel: formatHeartRateCurrentLabel(range, point),
  };
}

function getRestingHeartRateDayValues(dayItems: WearableDataItem[]) {
  const readings = collectRestingHeartRateReadings(dayItems);
  if (readings.length) {
    return readings.map(reading => reading.value);
  }

  const values: number[] = [];
  dayItems.forEach(item => {
    const value = parseWearableRestingHeartRateValue(item);
    if (value != null && value > 0) values.push(value);
  });
  return values;
}

function getRestingHeartRateDayMinMax(dayItems: WearableDataItem[]) {
  const values = getRestingHeartRateDayValues(dayItems);
  if (!values.length) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export function resolveRestingHeartRateDisplay(
  items: WearableDataItem[],
  range: HeartRateDetailChartRange = 'today',
) {
  if (!items.length) return '--';

  const vitalsRange = mapDetailChartRangeToVitalsRange(range);
  const rangedItems = filterWearableItemsInRange(items, vitalsRange);

  if (range === 'week' || range === 'month') {
    const dayCount = range === 'week' ? 7 : 30;
    const dayMinMaxList: Array<{ min: number; max: number }> = [];

    for (let index = 0; index < dayCount; index += 1) {
      const day = moment().subtract(dayCount - 1 - index, 'days');
      const dayItems = rangedItems.filter(item => getWearableDate(item).isSame(day, 'day'));
      const minMax = getRestingHeartRateDayMinMax(dayItems);
      if (minMax) dayMinMaxList.push(minMax);
    }

    if (!dayMinMaxList.length) return '--';

    const values = dayMinMaxList.flatMap(day => [day.min, day.max]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    return minValue === maxValue ? String(minValue) : `${minValue}-${maxValue}`;
  }

  const latestItem = getTodayWearableItem(rangedItems) ?? getLatestWearableItem(rangedItems);
  const readings = collectRestingHeartRateReadings(rangedItems);
  const value = readings.at(-1)?.value ?? parseWearableRestingHeartRateValue(latestItem);
  return value != null ? String(value) : '--';
}

export function calcHeartRateDetailStats(
  items: WearableDataItem[],
  restingItems: WearableDataItem[],
  range: HeartRateDetailChartRange,
) {
  const vitalsRange = mapDetailChartRangeToVitalsRange(range);
  const rangedItems = filterWearableItemsInRange(items, vitalsRange);
  const restingHeartRate = resolveRestingHeartRateDisplay(restingItems, range);

  if (range === 'week' || range === 'month') {
    const dayCount = range === 'week' ? 7 : 30;
    const dayMinMaxList: Array<{ min: number; max: number }> = [];

    for (let index = 0; index < dayCount; index += 1) {
      const day = moment().subtract(dayCount - 1 - index, 'days');
      const dayItems = rangedItems.filter(item => getWearableDate(item).isSame(day, 'day'));
      const minMax = getHeartRateDayMinMax(dayItems);
      if (minMax) dayMinMaxList.push(minMax);
    }

    if (!dayMinMaxList.length && restingHeartRate === '--') {
      return null;
    }

    const values = dayMinMaxList.flatMap(day => [day.min, day.max]);
    const minValue = values.length ? Math.min(...values) : null;
    const maxValue = values.length ? Math.max(...values) : null;

    return {
      rangeText: minValue != null && maxValue != null ? `${minValue}-${maxValue}` : '--',
      restingHeartRate,
      periodLabel: getHeartRateStatsPeriodLabel(range),
    };
  }

  const readings = collectHeartRateReadings(rangedItems);
  const values = readings.map(reading => reading.value);

  rangedItems.forEach(item => {
    const min = parseMeasureNumber(item.minHeartRate);
    const max = parseMeasureNumber(item.maxHeartRate);
    if (min != null && min > 0) values.push(Math.round(min));
    if (max != null && max > 0) values.push(Math.round(max));
  });

  if (!values.length && restingHeartRate === '--') {
    return null;
  }

  const minValue = values.length ? Math.min(...values) : null;
  const maxValue = values.length ? Math.max(...values) : null;

  return {
    rangeText: minValue != null && maxValue != null ? `${minValue}-${maxValue}` : '--',
    restingHeartRate,
    periodLabel: getHeartRateStatsPeriodLabel(range),
  };
}
