import moment from 'moment';
import type {
  MeasureDataItem,
  MeasureDataStatisDayGroup,
} from '@/api/measureData';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import {
  filterMeasureItemsInRange,
  getDateRange,
  getLevelLabel,
  isFemaleGender,
} from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  getItemTimestamp,
  getStatisLevelLabel,
  mapDetailChartRangeToVitalsRange,
  parseMeasureNumber,
  type DetailChartRange,
} from './shared';

function parseStatisBloodPressureValues(group?: MeasureDataStatisDayGroup) {
  if (!group) return null;
  const high = parseMeasureNumber(group.avgVal);
  const low = parseMeasureNumber(group.avgVal2);
  if (high == null || low == null) return null;
  return { high, low };
}

export type BloodPressureNormalRange = {
  highMin: number;
  highMax: number;
  lowMin: number;
  lowMax: number;
};

export function getBloodPressureNormalRange(gender?: string | null): BloodPressureNormalRange {
  if (isFemaleGender(gender)) {
    return { highMin: 90, highMax: 130, lowMin: 60, lowMax: 85 };
  }
  return { highMin: 90, highMax: 140, lowMin: 60, lowMax: 90 };
}

export function getBloodPressureReferenceLineY(gender?: string | null) {
  const range = getBloodPressureNormalRange(gender);
  return { high: range.highMax, low: range.lowMax };
}

export function formatBloodPressureNormalRangeText(gender?: string | null) {
  const range = getBloodPressureNormalRange(gender);
  return `${range.highMin}-${range.highMax}/${range.lowMin}-${range.lowMax}`;
}

export function getBloodPressureDetailQueryRange(range: DetailChartRange) {
  if (range === 'today') {
    const today = moment().format('YYYY-MM-DD');
    return { startDate: today, endDate: today };
  }
  return getDateRange(mapDetailChartRangeToVitalsRange(range));
}

export function buildBloodPressureStatsFromItems(items: MeasureDataItem[]) {
  const average = calcTodayBloodPressureAverage(items);
  return {
    average,
    abnormalCount: countBloodPressureHypertensionItems(items),
    analysisData: buildBloodPressureAnalysisData(items),
  };
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
  { title: '重度高血压', color: '#FB4550' },
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
  if (/高度|重度/.test(trimmed)) return '重度高血压';
  if (/中度/.test(trimmed)) return '中度高血压';
  if (/轻度/.test(trimmed)) return '轻度高血压';
  if (/正常高值|边缘升高|偏高/.test(trimmed)) return '正常高值';
  if (/正常|理想/.test(trimmed)) return '正常';
  if (/高血压/.test(trimmed)) return '轻度高血压';
  return '正常';
}

const BLOOD_PRESSURE_HYPERTENSION_CATEGORIES = new Set(['轻度高血压', '中度高血压', '重度高血压']);

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
