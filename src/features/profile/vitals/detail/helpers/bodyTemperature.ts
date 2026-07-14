import moment from 'moment';
import type { MeasureDataItem } from '@/api/measureData';
import {
  filterMeasureItemsInRange,
  getDateRange,
} from '../../vitalsHelpers';
import {
  BODY_TEMPERATURE_HIGH_THRESHOLD,
  BODY_TEMPERATURE_LOW_THRESHOLD,
  getBodyTemperatureItemStatusLabel,
  getBodyTemperatureLevelFromValue,
  getBodyTemperaturePointColor,
  getBodyTemperatureStatusColor,
} from '../../vitalsStatusDisplay';
import {
  getItemTimestamp,
  mapDetailChartRangeToVitalsRange,
  parseMeasureNumber,
  type DetailChartRange,
} from './shared';

export type BodyTemperatureDetailChartRange = 'today' | 'week' | 'month';

export type BodyTemperatureDetailPoint = {
  hour: string;
  min: number;
  max: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
  statusLabel?: string;
};

function formatBodyTemperatureValue(min: number, max: number) {
  if (min === max) return min.toFixed(1);
  return `${min.toFixed(1)}-${max.toFixed(1)}`;
}

function getBodyTemperatureDetailStatus(point: BodyTemperatureDetailPoint) {
  const fromValue = getBodyTemperatureLevelFromValue(point.min, point.max);
  if (fromValue !== '正常') return fromValue;
  return point.statusLabel || '正常';
}

function isValidBodyTemperatureDetailPoint(point?: BodyTemperatureDetailPoint) {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

function isAbnormalBodyTemperatureItem(item: MeasureDataItem) {
  const value = parseMeasureNumber(item.val);
  if (value == null || value <= 0) return false;
  if (value < BODY_TEMPERATURE_LOW_THRESHOLD || value > BODY_TEMPERATURE_HIGH_THRESHOLD) return true;
  const label = getBodyTemperatureItemStatusLabel(item);
  return /偏低|发热|低体温|偏高/.test(label);
}

function getTemperatureDayMinMax(dayItems: MeasureDataItem[]) {
  const values = dayItems
    .map(item => parseMeasureNumber(item.val))
    .filter((value): value is number => value != null && value > 0)
    .map(value => Number(value.toFixed(1)));

  if (!values.length) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function getBodyTemperatureDayLevelLabel(dayItems: MeasureDataItem[]) {
  const minMax = getTemperatureDayMinMax(dayItems);
  if (!minMax) return '正常';

  const fromValue = getBodyTemperatureLevelFromValue(minMax.min, minMax.max);
  if (fromValue !== '正常') return fromValue;

  const abnormalLabel = dayItems
    .map(getBodyTemperatureItemStatusLabel)
    .find(label => label !== '正常');
  return abnormalLabel || '正常';
}

export function getBodyTemperatureDetailQueryRange(range: DetailChartRange) {
  if (range === 'today') {
    const today = moment().format('YYYY-MM-DD');
    return { startDate: today, endDate: today };
  }
  return getDateRange(mapDetailChartRangeToVitalsRange(range));
}

export function buildBodyTemperatureDetailTodaySeries(items: MeasureDataItem[]): BodyTemperatureDetailPoint[] {
  const rangedItems = filterMeasureItemsInRange(items, 'today');

  return rangedItems.map(item => {
    const ts = getItemTimestamp(item);
    const value = Number((parseMeasureNumber(item.val) ?? 0).toFixed(1));

    return {
      hour: ts.format('HH:mm'),
      min: value,
      max: value,
      x: ts.hour() + ts.minute() / 60,
      dataTime: item.dataTime,
      customerLocalDate: item.customerLocalDate,
      statusLabel: getBodyTemperatureItemStatusLabel(item),
    };
  });
}

export function buildBodyTemperatureDetailPeriodSeries(
  items: MeasureDataItem[],
  range: 'week' | 'month',
): BodyTemperatureDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const vitalsRange = mapDetailChartRangeToVitalsRange(range);
  const rangedItems = filterMeasureItemsInRange(items, vitalsRange);

  const itemsByDate = new Map<string, MeasureDataItem[]>();
  rangedItems.forEach(item => {
    const dateKey = moment(item.customerLocalDate).format('YYYY-MM-DD');
    const dayItems = itemsByDate.get(dateKey) ?? [];
    dayItems.push(item);
    itemsByDate.set(dateKey, dayItems);
  });

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const dateKey = day.format('YYYY-MM-DD');
    const dayItems = itemsByDate.get(dateKey) ?? [];
    const minMax = getTemperatureDayMinMax(dayItems);

    return {
      hour: day.format('M/D'),
      min: minMax?.min ?? 0,
      max: minMax?.max ?? 0,
      customerLocalDate: dateKey,
      statusLabel: dayItems.length ? getBodyTemperatureDayLevelLabel(dayItems) : '正常',
    };
  });
}

export function formatBodyTemperatureCurrentLabel(
  range: BodyTemperatureDetailChartRange,
  point?: BodyTemperatureDetailPoint,
) {
  if (range === 'today') {
    const time = point?.dataTime?.trim() || point?.hour?.trim();
    return time ? `当前：今天 ${time}` : '当前：今天';
  }

  const date = point?.customerLocalDate;
  if (!date) return point?.hour ? `当前：${point.hour}` : '当前：--';
  return `当前：${moment(date).format('M/D')}`;
}

export function formatBodyTemperatureDetailPointDisplay(
  range: BodyTemperatureDetailChartRange,
  point?: BodyTemperatureDetailPoint,
) {
  if (!isValidBodyTemperatureDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
    };
  }

  const statusLabel = getBodyTemperatureDetailStatus(point!);
  const value = range === 'today' && point!.min === point!.max
    ? point!.min.toFixed(1)
    : formatBodyTemperatureValue(point!.min, point!.max);

  return {
    value,
    status: statusLabel,
    statusColor: getBodyTemperatureStatusColor(statusLabel),
    currentLabel: formatBodyTemperatureCurrentLabel(range, point),
  };
}

export function calcBodyTemperatureDetailStats(
  items: MeasureDataItem[],
  range: BodyTemperatureDetailChartRange,
) {
  const vitalsRange = range === 'today' ? 'today' : mapDetailChartRangeToVitalsRange(range);
  const rangedItems = filterMeasureItemsInRange(items, vitalsRange)
    .filter(item => (parseMeasureNumber(item.val) ?? 0) > 0);

  if (!rangedItems.length) return null;

  const values = rangedItems
    .map(item => parseMeasureNumber(item.val))
    .filter((value): value is number => value != null && value > 0)
    .map(value => Number(value.toFixed(1)));
  const abnormalItems = rangedItems.filter(isAbnormalBodyTemperatureItem);

  let abnormalDays = 0;
  if (range === 'today') {
    abnormalDays = abnormalItems.length > 0 ? 1 : 0;
  } else {
    const dayCount = range === 'week' ? 7 : 30;
    for (let index = 0; index < dayCount; index += 1) {
      const day = moment().subtract(dayCount - 1 - index, 'days');
      const dayItems = rangedItems.filter(item => moment(item.customerLocalDate).isSame(day, 'day'));
      if (dayItems.some(isAbnormalBodyTemperatureItem)) {
        abnormalDays += 1;
      }
    }
  }

  return {
    statusText: abnormalItems.length > 0 ? '有异常' : '正常',
    rangeText: `${Math.min(...values).toFixed(1)}-${Math.max(...values).toFixed(1)}`,
    recordCount: rangedItems.length,
    abnormalDays,
    abnormalCount: abnormalItems.length,
  };
}

export { getBodyTemperaturePointColor } from '../../vitalsStatusDisplay';
