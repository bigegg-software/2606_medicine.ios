import moment from 'moment';
import type {
  MeasureDataItem,
  MeasureDataStatisDayGroup,
} from '@/api/measureData';
import type { WearableDataItem, WearableOriginalReading } from '@/api/wearableData';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import {
  filterMeasureItemsInRange,
  getDateRange,
  getLevelLabel,
  getTodayWearableItem,
  type VitalsRange,
} from '../vitalsHelpers';
import { getLevelColor } from '../vitalLevelColors';

function parseMeasureNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseMeasureDate(raw?: string | null) {
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

function getItemTimestamp(item: MeasureDataItem) {
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

function getWearableDate(item: WearableDataItem) {
  const date = item.customerLocalDate ?? item.dataDate?.slice(0, 10) ?? moment().format('YYYY-MM-DD');
  const parsed = moment(date, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : moment();
}

function getWearableTimestamp(item: WearableDataItem) {
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

function flattenWearableOriginalData(item: WearableDataItem): WearableOriginalReading[] {
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

function collectWearableReadings(
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

function collectHeartRateReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => parseMeasureNumber(reading.value));
}

function parseWearableHeartRateValue(item?: WearableDataItem) {
  if (!item) return null;
  const value =
    parseMeasureNumber(item.newHeartRate) ??
    parseMeasureNumber(item.heartRate) ??
    parseMeasureNumber(item.maxHeartRate) ??
    parseMeasureNumber(item.minHeartRate);
  return value != null ? Math.round(value) : null;
}

function getLatestWearableItem(items: WearableDataItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

function filterWearableItemsInRange(items: WearableDataItem[], range: VitalsRange) {
  const { startDate, endDate } = getDateRange(range);
  return items.filter(item => {
    const date = getWearableDate(item);
    return date.isBetween(startDate, endDate, 'day', '[]');
  });
}

function parseStepsFromItem(item?: WearableDataItem) {
  if (!item) return 0;

  const readings = flattenWearableOriginalData(item);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => sum + (parseMeasureNumber(reading.value) ?? 0), 0);
    if (total > 0) return Math.round(total);
  }

  return Math.round(parseMeasureNumber(item.stepCount) ?? 0);
}

function sumEnergyFromItem(item: WearableDataItem | undefined, field: 'activeEnergyBurned' | 'basalEnergyBurned') {
  if (!item) return 0;

  const readings = flattenWearableOriginalData(item);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => sum + (parseMeasureNumber(reading.value) ?? 0), 0);
    if (total > 0) return total;
  }

  return parseMeasureNumber(item[field]) ?? 0;
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

function parseStatisBloodPressureValues(group?: MeasureDataStatisDayGroup) {
  if (!group) return null;
  const high = parseMeasureNumber(group.avgVal);
  const low = parseMeasureNumber(group.avgVal2);
  if (high == null || low == null) return null;
  return { high, low };
}
export function buildBloodPressureDetailTodaySeries(items: MeasureDataItem[]): BloodPressureDetailPoint[] {
  const rangedItems = filterMeasureItemsInRange(items, 'today');
  return rangedItems.map(item => {
    const ts = getItemTimestamp(item);
    return {
      high: Math.round(parseMeasureNumber(item.val) ?? 0),
      low: Math.round(parseMeasureNumber(item.val2) ?? 0),
      hour: ts.format('HH:mm'),
      x: ts.hour() + ts.minute() / 60,
      statusLabel: getLevelLabel(item) || '正常',
      dataTime: item.dataTime,
    };
  });
}

export type BloodPressureDetailChartRange = 'today' | 'week' | 'month';

export type BloodPressureDetailPoint = BloodPressurePoint & {
  statusLabel?: string;
  dataTime?: string;
  customerLocalDate?: string;
};

export function formatBloodPressureDetailPointDisplay(
  range: BloodPressureDetailChartRange,
  point?: BloodPressureDetailPoint,
) {
  if (!point || (point.high <= 0 && point.low <= 0)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
    };
  }

  const statusLabel = point.statusLabel || '正常';
  return {
    value: `${point.high}/${point.low}`,
    status: statusLabel,
    statusColor: getLevelColor(statusLabel),
    currentLabel: formatBloodPressureCurrentLabel(
      range,
      point.dataTime ? { dataTime: point.dataTime } : undefined,
      point.customerLocalDate ? { customerLocalDate: point.customerLocalDate } : undefined,
    ),
  };
}

export function mapDetailChartRangeToVitalsRange(range: BloodPressureDetailChartRange): VitalsRange {
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

function isAbnormalBloodPressureLevel(label: string) {
  return /高血压|偏高|高度|中度|轻度|正常高值/.test(label);
}

function isAbnormalBloodPressureItem(item: Pick<MeasureDataItem, 'isHigh' | 'level'>) {
  if (item.isHigh === 1) return true;
  const level = getLevelLabel(item);
  return isAbnormalBloodPressureLevel(level);
}

export function buildBloodPressureChartFromStatisGroups(
  groups: MeasureDataStatisDayGroup[],
  range: 'week' | 'month',
): BloodPressureDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const groupByDate = new Map(
    groups
      .filter(group => group.customerLocalDate)
      .map(group => [moment(group.customerLocalDate).format('YYYY-MM-DD'), group]),
  );

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const group = groupByDate.get(day.format('YYYY-MM-DD'));
    const values = parseStatisBloodPressureValues(group);
    return {
      high: Math.round(values?.high ?? 0),
      low: Math.round(values?.low ?? 0),
      hour: day.format('M/D'),
      statusLabel: getStatisLevelLabel(group?.statisLevelResult) || '正常',
      customerLocalDate: day.format('YYYY-MM-DD'),
    };
  });
}

export function calcBloodPressurePeriodAverage(groups: MeasureDataStatisDayGroup[]) {
  const valid = groups
    .map(group => parseStatisBloodPressureValues(group))
    .filter((values): values is { high: number; low: number } => values != null);
  if (!valid.length) return null;

  const high = Math.round(valid.reduce((sum, item) => sum + item.high, 0) / valid.length);
  const low = Math.round(valid.reduce((sum, item) => sum + item.low, 0) / valid.length);
  return { high, low };
}

export function formatBloodPressureFromStatisGroups(groups: MeasureDataStatisDayGroup[]) {
  const latest = [...groups]
    .filter(group => parseStatisBloodPressureValues(group) != null)
    .sort((a, b) => moment(b.customerLocalDate).valueOf() - moment(a.customerLocalDate).valueOf())[0];

  if (!latest) {
    return { value: '--', status: '', statusColor: '#999999', latestGroup: undefined as MeasureDataStatisDayGroup | undefined };
  }

  const values = parseStatisBloodPressureValues(latest)!;
  const levelLabel = getStatisLevelLabel(latest.statisLevelResult) || '正常';
  return {
    value: `${Math.round(values.high)}/${Math.round(values.low)}`,
    status: levelLabel ? `・${levelLabel}` : '',
    statusColor: getLevelColor(levelLabel),
    latestGroup: latest,
  };
}

export function formatBloodPressurePeriodDisplay(groups: MeasureDataStatisDayGroup[]) {
  const average = calcBloodPressurePeriodAverage(groups);
  if (!average) {
    return { value: '--', status: '', statusColor: '#999999', latestGroup: undefined as MeasureDataStatisDayGroup | undefined };
  }

  const latest = [...groups]
    .filter(group => parseStatisBloodPressureValues(group) != null)
    .sort((a, b) => moment(b.customerLocalDate).valueOf() - moment(a.customerLocalDate).valueOf())[0];
  const levelLabel = latest ? getStatisLevelLabel(latest.statisLevelResult) || '正常' : '正常';

  return {
    value: `${average.high}/${average.low}`,
    status: levelLabel ? `・${levelLabel}` : '',
    statusColor: getLevelColor(levelLabel),
    latestGroup: latest,
  };
}

export function calcTodayBloodPressureAverage(items: MeasureDataItem[]) {
  const valid = items.filter(item => item.val != null && item.val2 != null);
  if (!valid.length) return null;

  const high = Math.round(valid.reduce((sum, item) => sum + (parseMeasureNumber(item.val) ?? 0), 0) / valid.length);
  const low = Math.round(valid.reduce((sum, item) => sum + (parseMeasureNumber(item.val2) ?? 0), 0) / valid.length);
  return { high, low };
}

export function countBloodPressureAbnormalItems(items: MeasureDataItem[]) {
  return items.filter(isAbnormalBloodPressureItem).length;
}

export function countBloodPressureAbnormalDays(groups: MeasureDataStatisDayGroup[]) {
  return groups.filter(group => {
    const label = getStatisLevelLabel(group.statisLevelResult);
    return isAbnormalBloodPressureLevel(label);
  }).length;
}

export const BLOOD_PRESSURE_ANALYSIS_CATEGORIES = [
  { title: '正常', color: '#6D925E' },
  { title: '中度高血压', color: '#FA7355' },
  { title: '正常高值', color: '#FFB900' },
  { title: '高度高血压', color: '#FB4550' },
  { title: '轻度高血压', color: '#EE9C44' },
  { title: '低血压', color: '#37B8F2' },
] as const;

export type BloodPressureAnalysisItem = {
  title: string;
  value: number;
  color: string;
};

function normalizeBloodPressureAnalysisCategory(
  label: string,
  item?: Pick<MeasureDataItem, 'isHigh' | 'isLow'>,
) {
  const trimmed = label.trim();
  if (!trimmed) {
    if (item?.isLow === 1) return '低血压';
    if (item?.isHigh === 1) return '正常高值';
    return '正常';
  }
  if (/低血压|偏低/.test(trimmed)) return '低血压';
  if (/高度|重度/.test(trimmed)) return '高度高血压';
  if (/中度/.test(trimmed)) return '中度高血压';
  if (/轻度/.test(trimmed)) return '轻度高血压';
  if (/正常高值|边缘升高|偏高/.test(trimmed)) return '正常高值';
  if (/正常|理想/.test(trimmed)) return '正常';
  if (/高血压/.test(trimmed)) return '轻度高血压';
  return '正常';
}

const BLOOD_PRESSURE_HYPERTENSION_CATEGORIES = new Set(['轻度高血压', '中度高血压', '高度高血压']);

function isHypertensionBloodPressureItem(item: Pick<MeasureDataItem, 'level' | 'isHigh' | 'isLow'>) {
  const category = normalizeBloodPressureAnalysisCategory(getLevelLabel(item), item);
  return BLOOD_PRESSURE_HYPERTENSION_CATEGORIES.has(category);
}

/** 统计轻度 / 中度 / 重度高血压次数 */
export function countBloodPressureHypertensionItems(items: MeasureDataItem[]) {
  return items.filter(isHypertensionBloodPressureItem).length;
}

export function flattenStatisChildItems(groups: MeasureDataStatisDayGroup[]): MeasureDataItem[] {
  return groups.flatMap(group => {
    if (group.childList?.length) {
      return group.childList.map(item => ({
        ...item,
        customerLocalDate: item.customerLocalDate || group.customerLocalDate,
      }));
    }

    const values = parseStatisBloodPressureValues(group);
    if (!values) return [];

    return [{
      val: values.high,
      val2: values.low,
      customerLocalDate: group.customerLocalDate,
      level: group.statisLevelResult?.level,
      isHigh: group.statisLevelResult?.isHigh ? 1 : 0,
      isLow: group.statisLevelResult?.isLow ? 1 : 0,
    } as MeasureDataItem];
  });
}

export function buildBloodPressureAnalysisData(items: MeasureDataItem[]): BloodPressureAnalysisItem[] {
  const counts = new Map<string, number>(
    BLOOD_PRESSURE_ANALYSIS_CATEGORIES.map(category => [category.title, 0]),
  );

  items.forEach(item => {
    const label = getLevelLabel(item);
    const category = normalizeBloodPressureAnalysisCategory(label, item);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  });

  return BLOOD_PRESSURE_ANALYSIS_CATEGORIES.map(category => ({
    title: category.title,
    color: category.color,
    value: counts.get(category.title) ?? 0,
  }));
}

export function formatBloodPressureCurrentLabel(
  range: BloodPressureDetailChartRange,
  latestItem?: MeasureDataItem,
  latestGroup?: MeasureDataStatisDayGroup,
) {
  if (range === 'today') {
    if (!latestItem?.dataTime) return '当前：今天';
    return `当前：今天 ${latestItem.dataTime}`;
  }

  const date = latestGroup?.customerLocalDate ?? latestItem?.customerLocalDate;
  if (!date) return '当前：--';

  return `当前：${moment(date).format('M/D')}`;
}

export type BloodSugarDetailChartRange = 'today' | 'week' | 'month';

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
  const readings = collectHeartRateReadings(dayItems);
  if (readings.length) {
    const values = readings.map(reading => reading.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  const mins: number[] = [];
  const maxs: number[] = [];
  dayItems.forEach(item => {
    const min = parseMeasureNumber(item.minHeartRate);
    const max = parseMeasureNumber(item.maxHeartRate);
    const single = parseWearableHeartRateValue(item);
    if (min != null && min > 0) mins.push(Math.round(min));
    if (max != null && max > 0) maxs.push(Math.round(max));
    if (single != null && single > 0) {
      mins.push(single);
      maxs.push(single);
    }
  });

  if (!mins.length && !maxs.length) return null;
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
  return {
    value: `${point!.min}-${point!.max}`,
    status: statusLabel,
    statusColor: getLevelColor(statusLabel),
    currentLabel: formatHeartRateCurrentLabel(range, point),
  };
}

export function calcHeartRateDetailStats(items: WearableDataItem[], range: HeartRateDetailChartRange) {
  const vitalsRange = mapDetailChartRangeToVitalsRange(range);
  const rangedItems = filterWearableItemsInRange(items, vitalsRange);
  const readings = collectHeartRateReadings(rangedItems);
  const values = readings.map(reading => reading.value);

  rangedItems.forEach(item => {
    const min = parseMeasureNumber(item.minHeartRate);
    const max = parseMeasureNumber(item.maxHeartRate);
    if (min != null && min > 0) values.push(Math.round(min));
    if (max != null && max > 0) values.push(Math.round(max));
  });

  const latestItem = range === 'today'
    ? getTodayWearableItem(rangedItems) ?? getLatestWearableItem(rangedItems)
    : getLatestWearableItem(rangedItems);
  const restingHeartRate = parseMeasureNumber(latestItem?.restingHeartRate);

  if (!values.length && restingHeartRate == null) {
    return null;
  }

  const minValue = values.length ? Math.min(...values) : null;
  const maxValue = values.length ? Math.max(...values) : null;

  return {
    rangeText: minValue != null && maxValue != null ? `${minValue}-${maxValue}` : '--',
    restingHeartRate: restingHeartRate != null ? String(Math.round(restingHeartRate)) : '--',
    highCount: readings.filter(reading => reading.value > 100).length,
    lowCount: readings.filter(reading => reading.value < 60).length,
    periodLabel: getHeartRateStatsPeriodLabel(range),
  };
}

export type StepsDetailChartRange = 'today' | 'week' | 'month';

export type StepsDetailPoint = {
  hour: string;
  value: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
  stepGoals?: number;
};

function collectStepsReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => parseMeasureNumber(reading.value));
}

export function getStepsDetailGoal(items: WearableDataItem[], goalOverride?: number) {
  const item = getTodayWearableItem(items) ?? getLatestWearableItem(items);
  return parseMeasureNumber(item?.stepGoals) ?? goalOverride ?? 10000;
}

function getStepsStatusDisplay(steps: number, goal: number) {
  if (steps <= 0) {
    return { status: '--', statusColor: '#999999' };
  }
  if (steps >= goal) {
    return { status: '达标', statusColor: '#00C950' };
  }
  const remaining = Math.max(0, Math.round(goal - steps));
  const ratio = goal > 0 ? steps / goal : 0;
  return {
    status: `距目标还有${remaining.toLocaleString('en-US')}步`,
    statusColor: ratio >= 0.6 ? '#00C950' : '#FFBA1D',
  };
}

function isValidStepsDetailPoint(point?: StepsDetailPoint) {
  return point != null && point.value > 0;
}

export function buildStepsDetailTodaySeries(
  items: WearableDataItem[],
  goalOverride?: number,
): StepsDetailPoint[] {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const goal = getStepsDetailGoal(todayItems.length ? todayItems : items, goalOverride);
  const readings = collectStepsReadings(todayItems);

  if (readings.length) {
    let cumulative = 0;
    return readings.map(({ ts, value }) => {
      cumulative += value;
      return {
        hour: ts.format('HH:mm'),
        value: cumulative,
        x: ts.hour() + ts.minute() / 60,
        dataTime: ts.format('HH:mm'),
        customerLocalDate: ts.format('YYYY-MM-DD'),
        stepGoals: goal,
      };
    });
  }

  const latest = getLatestWearableItem(todayItems);
  const steps = parseStepsFromItem(latest);
  const ts = latest ? getWearableTimestamp(latest) : moment();

  if (steps <= 0) return [];

  return [{
    hour: ts.format('HH:mm'),
    value: steps,
    x: ts.hour() + ts.minute() / 60,
    dataTime: ts.format('HH:mm'),
    customerLocalDate: ts.format('YYYY-MM-DD'),
    stepGoals: parseMeasureNumber(latest?.stepGoals) ?? goal,
  }];
}

export function buildStepsDetailPeriodSeries(
  items: WearableDataItem[],
  range: 'week' | 'month',
  goalOverride?: number,
): StepsDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const defaultGoal = getStepsDetailGoal(items, goalOverride);

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const dayItems = items.filter(item => getWearableDate(item).isSame(day, 'day'));
    const latest = getLatestWearableItem(dayItems);
    const steps = parseStepsFromItem(latest);
    const goal = parseMeasureNumber(latest?.stepGoals) ?? defaultGoal;

    return {
      hour: day.format('M/D'),
      value: steps,
      customerLocalDate: day.format('YYYY-MM-DD'),
      stepGoals: goal,
    };
  });
}

function formatStepsCurrentLabel(range: StepsDetailChartRange, point?: StepsDetailPoint) {
  if (range === 'today') {
    const time = point?.dataTime?.trim() || point?.hour?.trim();
    return time ? `当前：今天 ${time}` : '当前：今天';
  }

  const date = point?.customerLocalDate;
  if (!date) return point?.hour ? `当前：${point.hour}` : '当前：--';
  return `当前：${moment(date).format('M/D')}`;
}

export function formatStepsDetailPointDisplay(
  range: StepsDetailChartRange,
  point?: StepsDetailPoint,
  goalOverride?: number,
) {
  if (!isValidStepsDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
      suggestionLabel: `目标：${goalOverride ?? 10000}`,
    };
  }

  const goal = point!.stepGoals ?? goalOverride ?? 10000;
  const { status, statusColor } = getStepsStatusDisplay(point!.value, goal);

  return {
    value: Math.round(point!.value).toLocaleString('en-US'),
    status,
    statusColor,
    currentLabel: formatStepsCurrentLabel(range, point),
    suggestionLabel: `目标：${Math.round(goal).toLocaleString('en-US')}`,
  };
}

export function calcStepsDetailOverview(
  items: WearableDataItem[],
  range: StepsDetailChartRange,
  goalOverride?: number,
) {
  const dayCount = range === 'today' ? 1 : range === 'week' ? 7 : 30;
  const defaultGoal = getStepsDetailGoal(items, goalOverride);
  const dailySteps: number[] = [];
  let compliantDays = 0;

  for (let index = 0; index < dayCount; index += 1) {
    const day = range === 'today'
      ? moment()
      : moment().subtract(dayCount - 1 - index, 'days');
    const dayItems = range === 'today'
      ? items.filter(item => getWearableDate(item).isSame(moment(), 'day'))
      : items.filter(item => getWearableDate(item).isSame(day, 'day'));
    const latest = getLatestWearableItem(dayItems);
    const steps = parseStepsFromItem(latest);
    const goal = parseMeasureNumber(latest?.stepGoals) ?? defaultGoal;

    if (steps > 0) {
      dailySteps.push(steps);
    }
    if (steps >= goal && goal > 0) {
      compliantDays += 1;
    }
  }

  if (!dailySteps.length) {
    return null;
  }

  const totalSteps = dailySteps.reduce((sum, value) => sum + value, 0);
  const dailyAverage = Math.round(totalSteps / dailySteps.length);

  return {
    totalSteps,
    dailyAverage,
    compliantDays,
    periodLabel: range === 'week' ? '近7天' : range === 'month' ? '近30天' : '今日',
  };
}

export type EnergyDetailChartRange = 'today' | 'week' | 'month';

export type EnergyDetailPoint = {
  hour: string;
  value: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
  energyGoals?: number;
};

function collectEnergyReadings(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  const parseValue = (reading: WearableOriginalReading) => parseMeasureNumber(reading.value);
  const readings = [
    ...collectWearableReadings(activeItems, parseValue),
    ...collectWearableReadings(basalItems, parseValue),
  ].sort((a, b) => a.ts.valueOf() - b.ts.valueOf());

  let cumulative = 0;
  return readings.map(({ ts, value }) => {
    cumulative += value;
    return { ts, value: Math.round(cumulative) };
  });
}

function getDayEnergyTotals(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  day: moment.Moment,
) {
  const activeDayItems = activeItems.filter(item => getWearableDate(item).isSame(day, 'day'));
  const basalDayItems = basalItems.filter(item => getWearableDate(item).isSame(day, 'day'));
  const active = Math.round(sumEnergyFromItem(getLatestWearableItem(activeDayItems), 'activeEnergyBurned'));
  const basal = Math.round(sumEnergyFromItem(getLatestWearableItem(basalDayItems), 'basalEnergyBurned'));
  return { active, basal, total: active + basal };
}

export function getEnergyDetailGoal(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  goalOverride?: number,
) {
  const item =
    getTodayWearableItem(activeItems) ??
    getLatestWearableItem(activeItems) ??
    getTodayWearableItem(basalItems) ??
    getLatestWearableItem(basalItems);
  return parseMeasureNumber(item?.energyGoals) ?? goalOverride ?? 2000;
}

function getEnergyStatusDisplay(total: number, goal: number) {
  if (total <= 0) {
    return { status: '--', statusColor: '#999999' };
  }
  if (goal <= 0) {
    return { status: '正常', statusColor: '#6D925E' };
  }
  const ratio = total / goal;
  if (ratio >= 1) {
    return { status: '达标', statusColor: '#00C950' };
  }
  if (ratio >= 0.6) {
    return { status: '进行中', statusColor: '#00C950' };
  }
  return { status: '偏少', statusColor: '#FFBA1D' };
}

function isValidEnergyDetailPoint(point?: EnergyDetailPoint) {
  return point != null && point.value > 0;
}

export function buildEnergyDetailTodaySeries(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  goalOverride?: number,
): EnergyDetailPoint[] {
  const todayActiveItems = activeItems.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const todayBasalItems = basalItems.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const goal = getEnergyDetailGoal(
    todayActiveItems.length ? todayActiveItems : activeItems,
    todayBasalItems.length ? todayBasalItems : basalItems,
    goalOverride,
  );
  const readings = collectEnergyReadings(todayActiveItems, todayBasalItems);

  if (readings.length) {
    return readings.map(({ ts, value }) => ({
      hour: ts.format('HH:mm'),
      value,
      x: ts.hour() + ts.minute() / 60,
      dataTime: ts.format('HH:mm'),
      customerLocalDate: ts.format('YYYY-MM-DD'),
      energyGoals: goal,
    }));
  }

  const totals = getDayEnergyTotals(activeItems, basalItems, moment());
  if (totals.total <= 0) return [];

  const latest =
    getLatestWearableItem(todayActiveItems) ??
    getLatestWearableItem(todayBasalItems) ??
    getLatestWearableItem(activeItems) ??
    getLatestWearableItem(basalItems);
  const ts = latest ? getWearableTimestamp(latest) : moment();

  return [{
    hour: ts.format('HH:mm'),
    value: totals.total,
    x: ts.hour() + ts.minute() / 60,
    dataTime: ts.format('HH:mm'),
    customerLocalDate: ts.format('YYYY-MM-DD'),
    energyGoals: goal,
  }];
}

export function buildEnergyDetailPeriodSeries(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  range: 'week' | 'month',
  goalOverride?: number,
): EnergyDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const defaultGoal = getEnergyDetailGoal(activeItems, basalItems, goalOverride);

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const totals = getDayEnergyTotals(activeItems, basalItems, day);
    const dayItem =
      getLatestWearableItem(activeItems.filter(item => getWearableDate(item).isSame(day, 'day'))) ??
      getLatestWearableItem(basalItems.filter(item => getWearableDate(item).isSame(day, 'day')));
    const goal = parseMeasureNumber(dayItem?.energyGoals) ?? defaultGoal;

    return {
      hour: day.format('M/D'),
      value: totals.total,
      customerLocalDate: day.format('YYYY-MM-DD'),
      energyGoals: goal,
    };
  });
}

function formatEnergyCurrentLabel(range: EnergyDetailChartRange, point?: EnergyDetailPoint) {
  if (range === 'today') {
    const time = point?.dataTime?.trim() || point?.hour?.trim();
    return time ? `当前：今天 ${time}` : '当前：今天';
  }

  const date = point?.customerLocalDate;
  if (!date) return point?.hour ? `当前：${point.hour}` : '当前：--';
  return `当前：${moment(date).format('M/D')}`;
}

export function formatEnergyDetailPointDisplay(
  range: EnergyDetailChartRange,
  point?: EnergyDetailPoint,
  goalOverride?: number,
) {
  if (!isValidEnergyDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: range === 'today' ? '当前：今天' : '当前：--',
      suggestionLabel: `目标：${(goalOverride ?? 2000).toLocaleString('en-US')}`,
    };
  }

  const goal = point!.energyGoals ?? goalOverride ?? 2000;
  const { status, statusColor } = getEnergyStatusDisplay(point!.value, goal);

  return {
    value: Math.round(point!.value).toLocaleString('en-US'),
    status,
    statusColor,
    currentLabel: formatEnergyCurrentLabel(range, point),
    suggestionLabel: `目标：${Math.round(goal).toLocaleString('en-US')}`,
  };
}

function averagePositiveValues(values: number[]) {
  const validValues = values.filter(value => value > 0);
  if (!validValues.length) return 0;
  return Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
}

export function calcEnergyDetailOverview(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  range: EnergyDetailChartRange,
  goalOverride?: number,
) {
  const dayCount = range === 'today' ? 1 : range === 'week' ? 7 : 30;
  const dailyTotals: number[] = [];
  const dailyActive: number[] = [];
  const dailyBasal: number[] = [];

  for (let index = 0; index < dayCount; index += 1) {
    const day = range === 'today'
      ? moment()
      : moment().subtract(dayCount - 1 - index, 'days');
    const totals = getDayEnergyTotals(activeItems, basalItems, day);
    if (totals.total > 0) dailyTotals.push(totals.total);
    if (totals.active > 0) dailyActive.push(totals.active);
    if (totals.basal > 0) dailyBasal.push(totals.basal);
  }

  if (!dailyTotals.length && !dailyActive.length && !dailyBasal.length) {
    return null;
  }

  return {
    avgTotal: averagePositiveValues(dailyTotals),
    avgActive: averagePositiveValues(dailyActive),
    avgBasal: averagePositiveValues(dailyBasal),
    periodLabel: range === 'week' ? '近7天' : range === 'month' ? '近30天' : '今日',
    goal: getEnergyDetailGoal(activeItems, basalItems, goalOverride),
  };
}
