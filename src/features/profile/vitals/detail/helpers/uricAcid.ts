import moment from 'moment';
import type {
  MeasureDataAllRecordsMonthGroup,
  MeasureDataItem,
} from '@/api/measureData';
import {
  filterMeasureItemsInRange,
  getLevelLabel,
  getUricAcidRange,
  getUricAcidStatusLabel,
  type VitalsRange,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  getItemTimestamp,
  parseMeasureNumber,
} from './shared';

export const URIC_ACID_RECENT_PAGE_SIZE = 10;

export type UricAcidDetailChartRange = 'today' | 'week' | 'month';

export type UricAcidDetailPoint = {
  hour: string;
  min: number;
  max: number;
  dataTime?: string;
  customerLocalDate?: string;
  measurementStatus?: string;
  statusLabel?: string;
  recordLabel?: string;
};

function getUricAcidItemLevelLabel(item: MeasureDataItem, gender?: string | null) {
  const value = parseMeasureNumber(item.val);
  if (value != null && value > 0) {
    const fromValue = getUricAcidStatusLabel(value, gender);
    if (fromValue) return fromValue;
  }
  return getLevelLabel(item) || '正常';
}

function mapDetailRangeToVitalsRange(range: UricAcidDetailChartRange): VitalsRange {
  if (range === 'week') return '7Days';
  if (range === 'month') return '30Days';
  return 'today';
}

function isValidUricAcidDetailPoint(point?: UricAcidDetailPoint) {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

function formatUricAcidValue(min: number, max: number) {
  if (min === max) return String(Math.round(min));
  return `${Math.round(min)}-${Math.round(max)}`;
}

export function flattenUricAcidAllRecords(rows?: MeasureDataAllRecordsMonthGroup[] | null) {
  if (!rows?.length) return [];

  const items = rows.flatMap(month =>
    (month.list ?? []).flatMap(day =>
      (day.childList ?? []).map(item => ({
        ...item,
        customerLocalDate:
          item.customerLocalDate?.trim() || day.customerLocalDate?.trim() || item.customerLocalDate,
      })),
    ),
  );

  return items.sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf());
}

function formatUricAcidChartDateLabel(item: MeasureDataItem) {
  const date = item.customerLocalDate?.trim();
  if (date) {
    const parsed = moment(date, 'YYYY-MM-DD', true);
    if (parsed.isValid()) return parsed.format('M/D');
  }
  return getItemTimestamp(item).format('M/D');
}

export function formatUricAcidRecordLabel(item?: MeasureDataItem) {
  if (!item) return '--';

  const ts = getItemTimestamp(item);
  const datePart = item.customerLocalDate?.trim()
    ? moment(item.customerLocalDate).format('YYYY/MM/DD')
    : ts.format('YYYY/MM/DD');
  const timePart = item.dataTime?.trim() || ts.format('HH:mm');
  const status = item.measurementStatus?.trim();
  const datetime = `${datePart} ${timePart}`;
  return status ? `${datetime} (${status})` : datetime;
}

function buildUricAcidRecordPoint(item: MeasureDataItem, gender?: string | null): UricAcidDetailPoint {
  const value = Math.round(parseMeasureNumber(item.val) ?? 0);

  return {
    hour: formatUricAcidChartDateLabel(item),
    min: value,
    max: value,
    dataTime: item.dataTime,
    customerLocalDate: item.customerLocalDate,
    measurementStatus: item.measurementStatus,
    statusLabel: getUricAcidItemLevelLabel(item, gender),
    recordLabel: formatUricAcidRecordLabel(item),
  };
}

export function formatUricAcidNormalRangeText(gender?: string | null) {
  const { min, max } = getUricAcidRange(gender);
  return `${min}-${max}`;
}

export function buildUricAcidDetailYAxis(
  points: UricAcidDetailPoint[],
  gender?: string | null,
) {
  const values = points
    .flatMap(point => [point.min, point.max])
    .filter(value => value > 0);
  const normalRange = getUricAcidRange(gender);
  const peak = values.length ? Math.max(...values, normalRange.max) : normalRange.max;
  const floor = values.length ? Math.min(...values, normalRange.min) : normalRange.min;
  const padding = 50;
  const span = peak - floor + padding * 2;
  const interval = span > 350 ? 100 : 50;
  const min = Math.max(0, Math.floor((floor - padding) / interval) * interval);
  const max = Math.max(
    min + interval * 4,
    Math.ceil((peak + padding) / interval) * interval,
  );

  return { min, max, interval };
}

export function getUricAcidSafetyLineY(gender?: string | null) {
  return getUricAcidRange(gender).max;
}

export function formatUricAcidSafetyLineLabel(gender?: string | null) {
  return `上线${getUricAcidSafetyLineY(gender)}`;
}

export function buildUricAcidDetailSeriesFromItems(
  items: MeasureDataItem[],
  range: UricAcidDetailChartRange,
  gender?: string | null,
): UricAcidDetailPoint[] {
  return filterMeasureItemsInRange(items, mapDetailRangeToVitalsRange(range))
    .filter(item => (parseMeasureNumber(item.val) ?? 0) > 0)
    .map(item => buildUricAcidRecordPoint(item, gender));
}

export function buildUricAcidDetailSeries(
  items: MeasureDataItem[],
  gender?: string | null,
): UricAcidDetailPoint[] {
  return items
    .filter(item => (parseMeasureNumber(item.val) ?? 0) > 0)
    .map(item => buildUricAcidRecordPoint(item, gender));
}

export function formatUricAcidCurrentLabel(point?: UricAcidDetailPoint) {
  return point?.recordLabel || '--';
}

export function formatUricAcidDetailPointDisplay(
  point?: UricAcidDetailPoint,
  gender?: string | null,
) {
  if (!isValidUricAcidDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: '--',
    };
  }

  const midpoint = Math.round((point!.min + point!.max) / 2);
  const statusLabel = point!.statusLabel || getUricAcidStatusLabel(midpoint, gender);

  return {
    value: formatUricAcidValue(point!.min, point!.max),
    status: statusLabel,
    statusColor: getLevelColor(statusLabel),
    currentLabel: formatUricAcidCurrentLabel(point),
  };
}

export function calcUricAcidCompareToPrevious(items: MeasureDataItem[]) {
  const sorted = [...items]
    .filter(item => (parseMeasureNumber(item.val) ?? 0) > 0)
    .sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf());

  if (sorted.length < 2) return null;

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const latestVal = parseMeasureNumber(latest.val);
  const prevVal = parseMeasureNumber(previous.val);
  if (latestVal == null || prevVal == null) return null;

  const diff = Math.round(latestVal - prevVal);
  if (diff === 0) {
    return {
      text: '较上次持平',
      color: '#999999',
      backgroundColor: 'rgba(153,153,153,0.1)',
      icon: null as null | 'up' | 'down',
    };
  }

  if (diff > 0) {
    return {
      text: `较上次上升 +${diff} μmol/L`,
      color: '#FB4550',
      backgroundColor: 'rgba(251,69,80,0.1)',
      icon: 'up' as const,
    };
  }

  return {
    text: `较上次下降 ${Math.abs(diff)} μmol/L`,
    color: '#6D925E',
    backgroundColor: 'rgba(109,146,94,0.1)',
    icon: 'down' as const,
  };
}
