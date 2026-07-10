import moment from 'moment';
import type {
  MeasureDataItem,
  MeasureDataStatisDayGroup,
} from '@/api/measureData';
import {
  filterMeasureItemsInRange,
  getDateRange,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  getItemTimestamp,
  getStatisLevelLabel,
  mapDetailChartRangeToVitalsRange,
  parseMeasureNumber,
  type DetailChartRange,
} from './shared';

export { flattenStatisChildItems } from './bloodPressure';

export type BloodSugarStatus = 'low' | 'normal' | 'high' | 'highRisk';

export const BLOOD_SUGAR_STATUS_COLORS: Record<BloodSugarStatus, string> = {
  low: '#0951AE',
  normal: '#6D925E',
  high: '#EE9C44',
  highRisk: '#FB4550',
};

export type BloodSugarDetailPoint = {
  hour: string;
  value: number;
  x?: number;
  dayIndex?: number;
  status?: BloodSugarStatus;
  isHigh?: number;
  isLow?: number;
  statusLabel?: string;
  dataTime?: string;
  customerLocalDate?: string;
  measurementStatus?: string;
};

export function getBloodSugarLevelLabel(
  item?: Pick<MeasureDataItem, 'level' | 'isHigh' | 'isLow'>,
) {
  const level = item?.level?.split(',')[0]?.trim();
  if (level) return level;
  if (item?.isLow === 1) return '偏低';
  if (item?.isHigh === 1) return '偏高';
  return '';
}

export function mapBloodSugarLevelToChartStatus(label: string): BloodSugarStatus | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  if (/偏低|低血糖/.test(trimmed)) return 'low';
  if (/高风险|糖尿病|重度/.test(trimmed)) return 'highRisk';
  if (/偏高|高血糖|正常高值/.test(trimmed)) return 'high';
  if (/正常|理想/.test(trimmed)) return 'normal';
  return null;
}

export function buildBloodSugarStatus(
  _value: number,
  item?: Pick<MeasureDataItem, 'isHigh' | 'isLow' | 'level'>,
): BloodSugarStatus {
  const levelLabel = getBloodSugarLevelLabel(item);
  const fromLevel = mapBloodSugarLevelToChartStatus(levelLabel);
  if (fromLevel) return fromLevel;

  if (item?.isLow === 1) return 'low';
  if (item?.isHigh === 1) return 'high';
  return 'normal';
}

function getBloodSugarStatusColor(label: string) {
  if (/偏低|低血糖/.test(label)) return BLOOD_SUGAR_STATUS_COLORS.low;
  if (/高风险|糖尿病|重度/.test(label)) return BLOOD_SUGAR_STATUS_COLORS.highRisk;
  if (/偏高|高血糖|正常高值/.test(label)) return BLOOD_SUGAR_STATUS_COLORS.high;
  return getLevelColor(label);
}

function parseStatisBloodSugarValue(group?: MeasureDataStatisDayGroup) {
  if (!group) return null;
  const value = parseMeasureNumber(group.avgVal);
  if (value == null) return null;
  return value;
}

export type BloodSugarDetailChartRange = 'today' | 'week' | 'month';

export function getBloodSugarDetailQueryRange(range: DetailChartRange) {
  if (range === 'today') {
    const today = moment().format('YYYY-MM-DD');
    return { startDate: today, endDate: today };
  }
  return getDateRange(mapDetailChartRangeToVitalsRange(range));
}

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
      statusLabel: getBloodSugarLevelLabel(item) || '正常',
      dataTime: item.dataTime,
      measurementStatus: item.measurementStatus,
    };
  });
}

export function buildBloodSugarDetailPeriodSeries(
  items: MeasureDataItem[],
  range: 'week' | 'month',
): BloodSugarDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const rangeStart = moment().subtract(dayCount - 1, 'days').startOf('day');

  return items
    .map(item => {
      const ts = getItemTimestamp(item);
      const value = parseMeasureNumber(item.val) ?? 0;
      if (value <= 0) return null;

      const dayIndex = ts.clone().startOf('day').diff(rangeStart, 'days');
      if (dayIndex < 0 || dayIndex >= dayCount) return null;

      const day = rangeStart.clone().add(dayIndex, 'days');
      const dayFraction = (ts.hour() * 60 + ts.minute()) / (24 * 60);

      const point: BloodSugarDetailPoint = {
        value: Number(value.toFixed(1)),
        hour: ts.format('HH:mm'),
        x: dayIndex + dayFraction,
        dayIndex,
        status: buildBloodSugarStatus(value, item),
        isHigh: item.isHigh,
        isLow: item.isLow,
        statusLabel: getBloodSugarLevelLabel(item) || '正常',
        dataTime: item.dataTime,
        customerLocalDate: day.format('YYYY-MM-DD'),
        measurementStatus: item.measurementStatus,
      };
      return point;
    })
    .filter((point): point is BloodSugarDetailPoint => point != null)
    .sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
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
) {
  const time = latestItem?.dataTime?.trim();
  const status = latestItem?.measurementStatus?.trim();
  const suffix = status ? ` (${status})` : '';

  if (range === 'today') {
    if (!time && !status) return '当前：今天';
    return time ? `当前：今天 ${time}${suffix}` : `当前：今天${suffix}`;
  }

  const date = latestItem?.customerLocalDate;
  if (!date) return '当前：--';

  const dateText = moment(date).format('M/D');
  if (time) return `当前：${dateText} ${time}${suffix}`;
  return `当前：${dateText}${suffix}`;
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
    currentLabel: formatBloodSugarCurrentLabel(range, {
      dataTime: point.dataTime || point.hour,
      customerLocalDate: point.customerLocalDate,
      measurementStatus: point.measurementStatus,
    }),
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

export function buildBloodSugarStatsFromItems(items: MeasureDataItem[]) {
  return calcBloodSugarPeriodStats(items);
}
