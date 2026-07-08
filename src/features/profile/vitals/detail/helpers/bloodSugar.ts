import moment from 'moment';
import type {
  MeasureDataItem,
  MeasureDataStatisDayGroup,
} from '@/api/measureData';
import {
  filterMeasureItemsInRange,
  getLevelLabel,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  getItemTimestamp,
  getStatisLevelLabel,
  parseMeasureNumber,
} from './shared';

export { flattenStatisChildItems } from './bloodPressure';

export type BloodSugarDetailPoint = {
  hour: string;
  value: number;
  x?: number;
  status?: 'low' | 'normal' | 'high';
  isHigh?: number;
  isLow?: number;
  statusLabel?: string;
  dataTime?: string;
  customerLocalDate?: string;
  measurementStatus?: string;
};

function buildBloodSugarStatus(value: number, item?: Pick<MeasureDataItem, 'isHigh' | 'isLow' | 'level'>) {
  if (item?.isLow === 1) return 'low';
  if (item?.isHigh === 1) return 'high';
  const label = getLevelLabel(item as MeasureDataItem | undefined);
  if (/偏低|低血糖/.test(label)) return 'low';
  if (/偏高|高血糖|糖尿病/.test(label)) return 'high';
  if (value < 3.9) return 'low';
  if (value > 6.1) return 'high';
  return 'normal';
}

function getBloodSugarStatusColor(label: string) {
  if (/偏低|低血糖/.test(label)) return '#0951AE';
  if (/偏高|高血糖|糖尿病|正常高值/.test(label)) return '#EE9C44';
  return getLevelColor(label);
}

function parseStatisBloodSugarValue(group?: MeasureDataStatisDayGroup) {
  if (!group) return null;
  const value = parseMeasureNumber(group.avgVal);
  if (value == null) return null;
  return value;
}

export type BloodSugarDetailChartRange = 'today' | 'week' | 'month';

export function buildBloodSugarDetailTodaySeries(items: MeasureDataItem[]): BloodSugarDetailPoint[] {
  const rangedItems = filterMeasureItemsInRange(items, 'today');
  return rangedItems.map(item => {
    const ts = getItemTimestamp(item);
    const value = parseMeasureNumber(item.val) ?? 0;
    return {
      value: Number(value.toFixed(1)),
      hour: ts.format('HH:mm'),
      x: ts.hour() + ts.minute() / 60,
      status: buildBloodSugarStatus(value, item),
      isHigh: item.isHigh,
      isLow: item.isLow,
      statusLabel: getLevelLabel(item) || '正常',
      dataTime: item.dataTime,
      measurementStatus: item.measurementStatus,
    };
  });
}

export function buildBloodSugarChartFromStatisGroups(
  groups: MeasureDataStatisDayGroup[],
  range: 'week' | 'month',
): BloodSugarDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const groupByDate = new Map(
    groups
      .filter(group => group.customerLocalDate)
      .map(group => [moment(group.customerLocalDate).format('YYYY-MM-DD'), group]),
  );

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const group = groupByDate.get(day.format('YYYY-MM-DD'));
    const value = parseStatisBloodSugarValue(group) ?? 0;
    const levelLabel = getStatisLevelLabel(group?.statisLevelResult) || '正常';
    const statisItem = {
      level: group?.statisLevelResult?.level,
      isHigh: group?.statisLevelResult?.isHigh ? 1 : 0,
      isLow: group?.statisLevelResult?.isLow ? 1 : 0,
    } as MeasureDataItem;

    return {
      value: Number(value.toFixed(1)),
      hour: day.format('M/D'),
      status: buildBloodSugarStatus(value, statisItem),
      isHigh: statisItem.isHigh,
      isLow: statisItem.isLow,
      statusLabel: levelLabel,
      customerLocalDate: day.format('YYYY-MM-DD'),
    };
  });
}

export function formatBloodSugarCurrentLabel(
  range: BloodSugarDetailChartRange,
  latestItem?: Pick<MeasureDataItem, 'dataTime' | 'customerLocalDate' | 'measurementStatus'>,
  latestGroup?: MeasureDataStatisDayGroup,
) {
  if (range === 'today') {
    const time = latestItem?.dataTime?.trim();
    const status = latestItem?.measurementStatus?.trim();
    if (!time && !status) return '当前：今天';
    const suffix = status ? ` (${status})` : '';
    return time ? `当前：今天 ${time}${suffix}` : `当前：今天${suffix}`;
  }

  const date = latestGroup?.customerLocalDate ?? latestItem?.customerLocalDate;
  if (!date) return '当前：--';

  return `当前：${moment(date).format('M/D')}`;
}

export function formatBloodSugarDetailPointDisplay(
  range: BloodSugarDetailChartRange,
  point?: BloodSugarDetailPoint,
) {
  if (!point || point.value <= 0) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
    };
  }

  const statusLabel = point.statusLabel || '正常';
  return {
    value: Number(point.value.toFixed(1)).toString(),
    status: statusLabel,
    statusColor: getBloodSugarStatusColor(statusLabel),
    currentLabel: formatBloodSugarCurrentLabel(
      range,
      point.dataTime || point.measurementStatus
        ? { dataTime: point.dataTime, measurementStatus: point.measurementStatus }
        : undefined,
      point.customerLocalDate ? { customerLocalDate: point.customerLocalDate } : undefined,
    ),
  };
}

export function calcBloodSugarPeriodStats(items: MeasureDataItem[]) {
  const validItems = items.filter(item => (parseMeasureNumber(item.val) ?? 0) > 0);
  if (!validItems.length) return null;

  const values = validItems
    .map(item => parseMeasureNumber(item.val))
    .filter((value): value is number => value != null);

  if (!values.length) return null;

  return {
    max: Number(Math.max(...values).toFixed(1)),
    min: Number(Math.min(...values).toFixed(1)),
    count: validItems.length,
  };
}
