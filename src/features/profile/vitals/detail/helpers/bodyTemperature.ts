import moment from 'moment';
import type { MeasureDataItem } from '@/api/measureData';
import {
  filterMeasureItemsInRange,
  getDateRange,
  getLevelLabel,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
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

const BODY_TEMPERATURE_LOW_THRESHOLD = 35.7;
const BODY_TEMPERATURE_HIGH_THRESHOLD = 37.2;
const BODY_TEMPERATURE_POINT_COLOR_NORMAL = '#6D925E';
const BODY_TEMPERATURE_POINT_COLOR_ABNORMAL = '#FB4550';

export function getBodyTemperaturePointColor(value: number) {
  if (value >= BODY_TEMPERATURE_LOW_THRESHOLD && value <= BODY_TEMPERATURE_HIGH_THRESHOLD) {
    return BODY_TEMPERATURE_POINT_COLOR_NORMAL;
  }
  return BODY_TEMPERATURE_POINT_COLOR_ABNORMAL;
}

function normalizeBodyTemperatureLevelLabel(label?: string) {
  const trimmed = label?.split(',')[0]?.trim();
  if (!trimmed) return '';
  if (/低体温|偏低/.test(trimmed)) return '偏低';
  if (/发热|偏高/.test(trimmed)) return '偏高';
  if (/正常/.test(trimmed)) return '正常';
  // 后端 level 可能混入血压/血糖等其它指标文案，体温页忽略
  if (/低血压|高血压|高血糖|低血糖|正常高值/.test(trimmed)) return '';
  return trimmed;
}

function getBodyTemperatureLevelFromValue(min: number, max: number) {
  if (min < BODY_TEMPERATURE_LOW_THRESHOLD) return '偏低';
  if (max > BODY_TEMPERATURE_HIGH_THRESHOLD) return '偏高';
  return '正常';
}

function getBodyTemperatureItemLevelLabel(item: MeasureDataItem) {
  const value = parseMeasureNumber(item.val);
  if (value != null && value > 0) {
    const fromValue = getBodyTemperatureLevelFromValue(value, value);
    if (fromValue !== '正常') return fromValue;
  }
  return normalizeBodyTemperatureLevelLabel(getLevelLabel(item)) || '正常';
}

function isValidBodyTemperatureDetailPoint(point?: BodyTemperatureDetailPoint) {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

function formatBodyTemperatureValue(min: number, max: number) {
  if (min === max) return min.toFixed(1);
  return `${min.toFixed(1)}-${max.toFixed(1)}`;
}

function getBodyTemperatureDetailStatus(point: BodyTemperatureDetailPoint) {
  const fromValue = getBodyTemperatureLevelFromValue(point.min, point.max);
  if (fromValue !== '正常') return fromValue;
  return normalizeBodyTemperatureLevelLabel(point.statusLabel) || '正常';
}

function getBodyTemperatureStatusColor(label: string) {
  if (/偏低|低体温/.test(label)) return '#0951AE';
  if (/偏高|发热/.test(label)) return '#FB4550';
  return getLevelColor(label);
}

function isAbnormalBodyTemperatureItem(item: MeasureDataItem) {
  const value = parseMeasureNumber(item.val);
  if (value == null || value <= 0) return false;
  if (value < BODY_TEMPERATURE_LOW_THRESHOLD || value > BODY_TEMPERATURE_HIGH_THRESHOLD) return true;
  const label = normalizeBodyTemperatureLevelLabel(getLevelLabel(item));
  return /偏高|偏低|发热|低体温/.test(label);
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
    .map(getBodyTemperatureItemLevelLabel)
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
      statusLabel: getBodyTemperatureItemLevelLabel(item),
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
