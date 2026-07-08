import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import {
  getTodayWearableItem,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  collectOxygenReadings,
  filterWearableItemsInRange,
  getLatestWearableItem,
  getWearableDate,
  getWearableTimestamp,
  mapDetailChartRangeToVitalsRange,
  normalizeOxygenPercent,
  parseWearableOxygenValue,
} from './shared';

export type BloodOxygenDetailChartRange = 'today' | 'week' | 'month';

export type BloodOxygenDetailPoint = {
  hour: string;
  min: number;
  max: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
};

const OXYGEN_ABNORMAL_THRESHOLD = 90;
const OXYGEN_LOW_THRESHOLD = 95;

function isValidBloodOxygenDetailPoint(point?: BloodOxygenDetailPoint) {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

function getBloodOxygenDetailStatus(point: BloodOxygenDetailPoint) {
  if (point.min < OXYGEN_ABNORMAL_THRESHOLD) return '异常';
  if (point.min < OXYGEN_LOW_THRESHOLD) return '偏低';
  return '正常';
}

function getBloodOxygenDayMinMax(dayItems: WearableDataItem[]) {
  const mins: number[] = [];
  const maxs: number[] = [];

  dayItems.forEach(item => {
    const min = normalizeOxygenPercent(item.minOxygenSaturation);
    const max = normalizeOxygenPercent(item.maxOxygenSaturation);
    if (min != null) mins.push(min);
    if (max != null) maxs.push(max);
  });

  if (!mins.length || !maxs.length) return null;
  return {
    min: Math.min(...mins),
    max: Math.max(...maxs),
  };
}

export function buildBloodOxygenDetailTodaySeries(items: WearableDataItem[]): BloodOxygenDetailPoint[] {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const readings = collectOxygenReadings(todayItems);

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
  const min = normalizeOxygenPercent(latest?.minOxygenSaturation);
  const max = normalizeOxygenPercent(latest?.maxOxygenSaturation);
  const single = parseWearableOxygenValue(latest);
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
      min,
      max,
      x: ts.hour() + ts.minute() / 60,
      dataTime: ts.format('HH:mm'),
      customerLocalDate: ts.format('YYYY-MM-DD'),
    }];
  }

  return [];
}

export function buildBloodOxygenDetailPeriodSeries(
  items: WearableDataItem[],
  range: 'week' | 'month',
): BloodOxygenDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const dayItems = items.filter(item => getWearableDate(item).isSame(day, 'day'));
    const minMax = getBloodOxygenDayMinMax(dayItems);

    return {
      hour: day.format('M/D'),
      min: minMax?.min ?? 0,
      max: minMax?.max ?? 0,
      customerLocalDate: day.format('YYYY-MM-DD'),
    };
  });
}

export function formatBloodOxygenCurrentLabel(
  range: BloodOxygenDetailChartRange,
  point?: BloodOxygenDetailPoint,
) {
  if (range === 'today') {
    const time = point?.dataTime?.trim() || point?.hour?.trim();
    return time ? `当前：今天 ${time}` : '当前：今天';
  }

  const date = point?.customerLocalDate;
  if (!date) return point?.hour ? `当前：${point.hour}` : '当前：--';
  return `当前：${moment(date).format('M/D')}`;
}

export function formatBloodOxygenDetailPointDisplay(
  range: BloodOxygenDetailChartRange,
  point?: BloodOxygenDetailPoint,
) {
  if (!isValidBloodOxygenDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
    };
  }

  const statusLabel = getBloodOxygenDetailStatus(point!);
  const value = range === 'today' && point!.min === point!.max
    ? String(point!.min)
    : `${point!.min}-${point!.max}`;
  return {
    value,
    status: statusLabel,
    statusColor: getLevelColor(statusLabel),
    currentLabel: formatBloodOxygenCurrentLabel(range, point),
  };
}

export function calcBloodOxygenDetailStats(items: WearableDataItem[], range: BloodOxygenDetailChartRange) {
  const vitalsRange = mapDetailChartRangeToVitalsRange(range);
  const rangedItems = filterWearableItemsInRange(items, vitalsRange);
  const latestItem = range === 'today'
    ? getTodayWearableItem(rangedItems) ?? getLatestWearableItem(rangedItems)
    : getLatestWearableItem(rangedItems);
  const latestValue = parseWearableOxygenValue(latestItem);

  if (range === 'week' || range === 'month') {
    const dayCount = range === 'week' ? 7 : 30;
    const dayMinMaxList: Array<{ min: number; max: number }> = [];

    for (let index = 0; index < dayCount; index += 1) {
      const day = moment().subtract(dayCount - 1 - index, 'days');
      const dayItems = rangedItems.filter(item => getWearableDate(item).isSame(day, 'day'));
      const minMax = getBloodOxygenDayMinMax(dayItems);
      if (minMax) dayMinMaxList.push(minMax);
    }

    if (!dayMinMaxList.length && latestValue == null) {
      return null;
    }

    const values = dayMinMaxList.flatMap(day => [day.min, day.max]);
    const minValue = values.length ? Math.min(...values) : null;
    const maxValue = values.length ? Math.max(...values) : null;

    return {
      latestValue: latestValue != null ? String(latestValue) : '--',
      rangeText: minValue != null && maxValue != null ? `${minValue}-${maxValue}` : '--',
      abnormalCount: dayMinMaxList.filter(day => day.min < OXYGEN_ABNORMAL_THRESHOLD).length,
    };
  }

  const readings = collectOxygenReadings(rangedItems);
  const values = readings.map(reading => reading.value);

  rangedItems.forEach(item => {
    const min = normalizeOxygenPercent(item.minOxygenSaturation);
    const max = normalizeOxygenPercent(item.maxOxygenSaturation);
    if (min != null) values.push(min);
    if (max != null) values.push(max);
  });

  if (!values.length && latestValue == null) {
    return null;
  }

  const minValue = values.length ? Math.min(...values) : null;
  const maxValue = values.length ? Math.max(...values) : null;

  return {
    latestValue: latestValue != null ? String(latestValue) : '--',
    rangeText: minValue != null && maxValue != null ? `${minValue}-${maxValue}` : '--',
    abnormalCount: readings.filter(reading => reading.value < OXYGEN_ABNORMAL_THRESHOLD).length,
  };
}
