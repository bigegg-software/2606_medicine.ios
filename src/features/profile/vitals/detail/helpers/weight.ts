import moment from 'moment';
import type { HealthGoalTarget } from '@/api/healthGoal';
import type { MeasureDataItem, MeasureDataStatisDayGroup } from '@/api/measureData';
import type { InUseExPatientRule } from '@/api/schedule';
import { filterMeasureItemsInRange, getLevelLabel, type VitalsRange } from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import {
  getItemTimestamp,
  getStatisLevelLabel,
  parseMeasureNumber,
} from './shared';

export type WeightDetailChartRange = 'today' | 'week' | 'month';

export type WeightDetailPoint = {
  hour: string;
  min: number;
  max: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
  statusLabel?: string;
  bmi?: number;
};

function formatWeightValue(min: number, max: number) {
  if (min === max) return formatGoalWeightValue(min);
  return `${formatGoalWeightValue(min)}-${formatGoalWeightValue(max)}`;
}

function normalizeWeightLevelLabel(label?: string): BmiCategory | '' {
  const trimmed = label?.split(',')[0]?.trim();
  if (!trimmed) return '';
  if (/偏瘦|过轻|消瘦/.test(trimmed)) return '偏瘦';
  if (/超重/.test(trimmed)) return '超重';
  if (/肥胖|过重/.test(trimmed)) return '肥胖';
  if (/正常/.test(trimmed)) return '正常';
  if (/偏高|偏低|高血压|低血压|高血糖|低血糖|正常高值/.test(trimmed)) return '';
  return '';
}

function getWeightStatusFromBmi(bmi?: number | null): BmiCategory | null {
  if (bmi == null || bmi <= 0) return null;
  return getBmiCategory(bmi);
}

function getWeightStatusColor(label: string) {
  if (label in BMI_CATEGORY_COLORS) {
    return BMI_CATEGORY_COLORS[label as BmiCategory];
  }
  return getLevelColor(label);
}

function getWeightItemLevelLabel(item: MeasureDataItem, heightCm?: number | null) {
  const fromBmi = getWeightStatusFromBmi(resolveItemBmi(item, heightCm));
  if (fromBmi) return fromBmi;
  return normalizeWeightLevelLabel(getLevelLabel(item)) || '正常';
}

export function calcBmiFromWeight(weightKg?: number | null, heightCm?: number | null) {
  const weight = weightKg != null && weightKg > 0 ? weightKg : null;
  const height = heightCm != null && heightCm > 0 ? heightCm : null;
  if (weight == null || height == null) return null;

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  return Number(bmi.toFixed(1));
}

/** Prefer API-provided BMI, otherwise derive from weight + height. */
function resolveItemBmi(item?: MeasureDataItem | null, heightCm?: number | null) {
  if (!item) return null;
  const fromApi = parseMeasureNumber(item.bmi);
  if (fromApi != null && fromApi > 0) return Number(fromApi.toFixed(1));
  return calcBmiFromWeight(parseMeasureNumber(item.val), heightCm);
}

export function formatWeightVitalsDisplay(item?: MeasureDataItem, heightCm?: number | null) {
  if (!item) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  const parsed = parseMeasureNumber(item.val);
  const value = parsed != null && parsed > 0
    ? formatGoalWeightValue(parsed)
    : '--';
  const statusLabel = getWeightItemLevelLabel(item, heightCm);

  return {
    value,
    status: statusLabel,
    statusColor: getWeightStatusColor(statusLabel),
  };
}

export function formatWeightFromItemsForVitals(items: MeasureDataItem[], range: VitalsRange = 'today') {
  const rangedItems = filterMeasureItemsInRange(items, range);
  if (!rangedItems.length) {
    return formatWeightVitalsDisplay();
  }
  const latest = [...rangedItems].sort(
    (a, b) => getItemTimestamp(b).valueOf() - getItemTimestamp(a).valueOf(),
  )[0];
  return formatWeightVitalsDisplay(latest);
}

function getWeightStatisLevelLabel(group?: MeasureDataStatisDayGroup, heightCm?: number | null) {
  const fromBmi = getWeightStatusFromBmi(getBmiFromGroup(group, heightCm));
  if (fromBmi) return fromBmi;
  return normalizeWeightLevelLabel(getStatisLevelLabel(group?.statisLevelResult)) || '正常';
}

function getWeightDetailStatusLabel(
  point?: WeightDetailPoint,
  latestItem?: MeasureDataItem,
  heightCm?: number | null,
) {
  const activePoint = isValidWeightDetailPoint(point) ? point : undefined;
  const fromPointBmi = getWeightStatusFromBmi(activePoint?.bmi);
  if (fromPointBmi) return fromPointBmi;

  if (activePoint?.statusLabel) {
    const normalized = normalizeWeightLevelLabel(activePoint.statusLabel);
    if (normalized) return normalized;
  }

  if (latestItem && Object.keys(latestItem).length) {
    return getWeightItemLevelLabel(latestItem, heightCm);
  }

  return '--';
}

function isValidWeightDetailPoint(point?: WeightDetailPoint): point is WeightDetailPoint {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

function getWeightDayMinMax(dayItems: MeasureDataItem[]) {
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

export type BmiCategory = '偏瘦' | '正常' | '超重' | '肥胖';

export const BMI_CATEGORY_COLORS: Record<BmiCategory, string> = {
  偏瘦: '#72A1C5',
  正常: '#6D925E',
  超重: '#EE9C44',
  肥胖: '#FB4550',
};

const BMI_SEGMENTS: Array<{ key: BmiCategory; min: number; max: number }> = [
  { key: '偏瘦', min: 15, max: 18.5 },
  { key: '正常', min: 18.5, max: 24 },
  { key: '超重', min: 24, max: 28 },
  { key: '肥胖', min: 28, max: 35 },
];

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
}

export function getBmiMarkerPercent(bmi: number) {
  const clamped = Math.max(BMI_SEGMENTS[0].min, Math.min(BMI_SEGMENTS[3].max, bmi));

  for (let index = 0; index < BMI_SEGMENTS.length; index += 1) {
    const segment = BMI_SEGMENTS[index];
    if (clamped >= segment.max && index < BMI_SEGMENTS.length - 1) continue;

    const segmentSpan = segment.max - segment.min;
    const localRatio = segmentSpan > 0
      ? (clamped - segment.min) / segmentSpan
      : 0;
    return index * 25 + Math.max(0, Math.min(1, localRatio)) * 25;
  }

  return 100;
}

export function resolveWeightDetailBmi(
  point?: WeightDetailPoint,
  latestItem?: MeasureDataItem,
  heightCm?: number | null,
) {
  if (isValidWeightDetailPoint(point) && point.bmi != null && point.bmi > 0) {
    return point.bmi;
  }

  if (isValidWeightDetailPoint(point)) {
    const weight = getPointWeightValue(point);
    const fromPoint = calcBmiFromWeight(weight, heightCm);
    if (fromPoint != null) return fromPoint;
  }

  return resolveItemBmi(latestItem, heightCm);
}

function getBmiFromGroup(group?: MeasureDataStatisDayGroup, heightCm?: number | null) {
  const bmiValues = (group?.childList ?? [])
    .map(item => resolveItemBmi(item, heightCm))
    .filter((value): value is number => value != null && value > 0);

  if (bmiValues.length) {
    const total = bmiValues.reduce((sum, value) => sum + value, 0);
    return Number((total / bmiValues.length).toFixed(1));
  }

  // Statis groups may only carry avgVal without childList.
  return calcBmiFromWeight(parseMeasureNumber(group?.avgVal), heightCm) ?? undefined;
}

function getWeightValuesFromGroup(group?: MeasureDataStatisDayGroup) {
  if (group?.childList?.length) {
    return getWeightDayMinMax(group.childList);
  }

  const avg = parseMeasureNumber(group?.avgVal);
  if (avg != null && avg > 0) {
    const value = Number(avg.toFixed(1));
    return { min: value, max: value };
  }

  return null;
}

export function buildWeightDetailTodaySeries(
  items: MeasureDataItem[],
  heightCm?: number | null,
): WeightDetailPoint[] {
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
      statusLabel: getWeightItemLevelLabel(item, heightCm),
      bmi: resolveItemBmi(item, heightCm) ?? undefined,
    };
  });
}

export function buildWeightChartFromStatisGroups(
  groups: MeasureDataStatisDayGroup[],
  range: 'week' | 'month',
  heightCm?: number | null,
): WeightDetailPoint[] {
  const dayCount = range === 'week' ? 7 : 30;
  const groupByDate = new Map(
    groups
      .filter(group => group.customerLocalDate)
      .map(group => [moment(group.customerLocalDate).format('YYYY-MM-DD'), group]),
  );

  return Array.from({ length: dayCount }, (_, index) => {
    const day = moment().subtract(dayCount - 1 - index, 'days');
    const group = groupByDate.get(day.format('YYYY-MM-DD'));
    const minMax = getWeightValuesFromGroup(group);

    return {
      hour: day.format('M/D'),
      min: minMax?.min ?? 0,
      max: minMax?.max ?? 0,
      statusLabel: getWeightStatisLevelLabel(group, heightCm),
      customerLocalDate: day.format('YYYY-MM-DD'),
      bmi: getBmiFromGroup(group, heightCm),
    };
  });
}

export function formatWeightDetailPointDisplay(
  range: WeightDetailChartRange,
  point?: WeightDetailPoint,
  latestItem?: MeasureDataItem,
  heightCm?: number | null,
) {
  const activePoint = isValidWeightDetailPoint(point) ? point : undefined;
  const latestValue = parseMeasureNumber(latestItem?.val);
  const value = activePoint
    ? formatWeightValue(activePoint.min, activePoint.max)
    : latestValue != null && latestValue > 0
      ? formatGoalWeightValue(latestValue)
      : '--';

  const statusLabel = getWeightDetailStatusLabel(activePoint, latestItem, heightCm);
  const statusColor = statusLabel === '--'
    ? '#999999'
    : getWeightStatusColor(statusLabel);

  if (range === 'today') {
    const time = activePoint?.dataTime?.trim() || latestItem?.dataTime?.trim();
    return {
      value,
      status: statusLabel,
      statusColor,
      currentLabel: time ? `当前：今天 ${time}` : '当前：今天',
    };
  }

  const date = activePoint?.customerLocalDate ?? latestItem?.customerLocalDate;
  return {
    value,
    status: statusLabel,
    statusColor,
    currentLabel: date ? `当前：${moment(date).format('M/D')}` : '当前：--',
  };
}

export type WeightTrendDirection = 'up' | 'down' | 'flat';

export type WeightTrendSummary = {
  rangeText: string;
  changeText: string;
  direction: WeightTrendDirection;
  changeColor: string;
};

const WEIGHT_TREND_DOWN_COLOR = '#6D925E';
const WEIGHT_TREND_UP_COLOR = '#FB4550';

function getPointWeightValue(point: WeightDetailPoint) {
  if (!isValidWeightDetailPoint(point)) return null;
  return point.min === point.max
    ? point.min
    : Number(((point.min + point.max) / 2).toFixed(1));
}

export function calcWeightTrendFromPoints(
  points: WeightDetailPoint[],
  type: 'weight' | 'bmi',
): WeightTrendSummary {
  const empty: WeightTrendSummary = {
    rangeText: '--',
    changeText: '--',
    direction: 'flat',
    changeColor: '#999999',
  };

  const validPoints = points.filter(point => {
    if (type === 'weight') return isValidWeightDetailPoint(point);
    return point.bmi != null && point.bmi > 0;
  });

  if (validPoints.length < 2) return empty;

  const getValue = (point: WeightDetailPoint) => (
    type === 'weight' ? getPointWeightValue(point)! : point.bmi!
  );

  const first = getValue(validPoints[0]);
  const last = getValue(validPoints[validPoints.length - 1]);
  const diff = Number((last - first).toFixed(1));
  const absDiff = Math.abs(diff);

  let direction: WeightTrendDirection = 'flat';
  if (diff > 0) direction = 'up';
  else if (diff < 0) direction = 'down';

  const unit = type === 'weight' ? 'kg' : '';
  let changeText = '持平';
  let changeColor = '#999999';

  if (direction === 'down') {
    changeText = `下降${absDiff}${unit}`;
    changeColor = WEIGHT_TREND_DOWN_COLOR;
  } else if (direction === 'up') {
    changeText = `增长${absDiff}${unit}`;
    changeColor = WEIGHT_TREND_UP_COLOR;
  }

  return {
    rangeText: `${formatGoalWeightValue(first)}-${formatGoalWeightValue(last)}`,
    changeText,
    direction,
    changeColor,
  };
}

export type TodayWeightOverview = {
  changeText: string;
  avgText: string;
};

function formatWeightOverviewNumber(value: number) {
  // 最多保留两位小数，末尾 0 不显示（45.00→45，-0.60→-0.6）
  return String(Number(value.toFixed(2)));
}

function formatSignedWeightDiff(diff: number) {
  const fixed = formatWeightOverviewNumber(Math.abs(diff));
  if (diff === 0) return formatWeightOverviewNumber(0);
  return diff > 0 ? `+${fixed}` : `-${fixed}`;
}

/** 今日体重总览：较上次体重（最近两条）+ 日均体重（仅日历今天，无数据为 --） */
export function calcTodayWeightOverview(
  todayItems: MeasureDataItem[],
  latestTwoItems: MeasureDataItem[] = [],
): TodayWeightOverview {
  const empty: TodayWeightOverview = { changeText: '--', avgText: '--' };
  const todayDate = moment().format('YYYY-MM-DD');

  const toEntries = (items: MeasureDataItem[]) => items
    .map(item => ({
      value: parseMeasureNumber(item.val),
      timestamp: getItemTimestamp(item).valueOf(),
    }))
    .filter((entry): entry is { value: number; timestamp: number } => (
      entry.value != null && entry.value > 0
    ))
    .sort((left, right) => left.timestamp - right.timestamp);

  const calendarTodayItems = todayItems.filter(item => {
    const date = item.customerLocalDate?.trim();
    if (date) return date === todayDate;
    return getItemTimestamp(item).format('YYYY-MM-DD') === todayDate;
  });

  const todayEntries = toEntries(calendarTodayItems);
  const avgText = todayEntries.length
    ? formatWeightOverviewNumber(
      todayEntries.reduce((sum, entry) => sum + entry.value, 0) / todayEntries.length,
    )
    : '--';

  const latestTwo = toEntries(latestTwoItems);
  let changeText = '--';
  if (latestTwo.length >= 2) {
    const latest = latestTwo[latestTwo.length - 1].value;
    const previous = latestTwo[latestTwo.length - 2].value;
    changeText = formatSignedWeightDiff(Number((latest - previous).toFixed(2)));
  }

  if (avgText === '--' && changeText === '--') return empty;

  return {
    changeText,
    avgText,
  };
}

export type WeightGoalSummary = {
  ratePercent: number;
  planLabel: string;
  isGain: boolean;
  improvePercent: number;
};

export type WeightGoalDisplay = {
  targetWeightText: string;
  remainingLabel: string;
  remainingText: string;
  progressPercent: number;
  planLabel?: string;
};

function formatGoalWeightValue(value: number) {
  const fixed = Number(value.toFixed(1));
  return Number.isInteger(fixed) ? String(fixed) : fixed.toFixed(1);
}

function parseWeightNumber(value?: string | number | null) {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function calcTargetWeightFromRate(
  initialWeightKg: number,
  ratePercent: number,
  isGain: boolean,
) {
  const factor = ratePercent / 100;
  const target = isGain
    ? initialWeightKg * (1 + factor)
    : initialWeightKg * (1 - factor);
  return Number(Math.max(0, target).toFixed(1));
}

export function getInitialWeightFromPoints(
  points: WeightDetailPoint[],
  latestItem?: MeasureDataItem,
) {
  const validPoints = points.filter(isValidWeightDetailPoint);
  if (validPoints.length) {
    return validPoints[0].min === validPoints[0].max
      ? validPoints[0].min
      : Number(((validPoints[0].min + validPoints[0].max) / 2).toFixed(1));
  }

  return parseMeasureNumber(latestItem?.val);
}

export function getEarliestWeightFromItems(items: MeasureDataItem[]) {
  const validItems = items
    .map(item => ({
      item,
      value: parseMeasureNumber(item.val),
      timestamp: getItemTimestamp(item).valueOf(),
    }))
    .filter((entry): entry is typeof entry & { value: number } => entry.value != null && entry.value > 0)
    .sort((left, right) => left.timestamp - right.timestamp);

  return validItems.length ? validItems[0].value : null;
}

function calcWeightGoalProgressPercent(
  initial: number,
  current: number | null,
  targetWeightKg: number,
  isGain: boolean,
  apiImprovePercent: number,
) {
  const totalChange = Math.abs(targetWeightKg - initial);
  if (totalChange <= 0) {
    return apiImprovePercent;
  }

  if (current == null) {
    return apiImprovePercent;
  }

  if (isGain) {
    if (current >= targetWeightKg) return 100;
    const completed = Math.max(0, current - initial);
    const calculated = Math.min(100, Math.max(0, Math.round((completed / totalChange) * 100)));
    return Math.max(calculated, apiImprovePercent);
  }

  if (current <= targetWeightKg) return 100;
  const completed = Math.max(0, initial - current);
  const calculated = Math.min(100, Math.max(0, Math.round((completed / totalChange) * 100)));
  return Math.max(calculated, apiImprovePercent);
}

export function resolveWeightGoalDisplay(
  summary: WeightGoalSummary,
  currentWeightKg?: number | null,
  initialWeightKg?: number | null,
): WeightGoalDisplay | null {
  const initial = parseWeightNumber(initialWeightKg);
  if (initial == null) return null;

  const targetWeightKg = calcTargetWeightFromRate(initial, summary.ratePercent, summary.isGain);
  const current = parseWeightNumber(currentWeightKg);

  let remainingKg = 0;
  if (current != null) {
    remainingKg = summary.isGain
      ? Math.max(0, targetWeightKg - current)
      : Math.max(0, current - targetWeightKg);
  }

  const progressPercent = calcWeightGoalProgressPercent(
    initial,
    current,
    targetWeightKg,
    summary.isGain,
    summary.improvePercent,
  );

  return {
    targetWeightText: formatGoalWeightValue(targetWeightKg),
    remainingLabel: summary.isGain ? '还需增重 (kg)' : '还需减重 (kg)',
    remainingText: current != null ? formatGoalWeightValue(remainingKg) : '--',
    progressPercent,
    planLabel: summary.planLabel,
  };
}

export function resolvePersonalWeightGoalDisplay(
  targetWeightKg: number,
  currentWeightKg?: number | null,
): WeightGoalDisplay | null {
  const target = parseWeightNumber(targetWeightKg);
  if (target == null) return null;

  const current = parseWeightNumber(currentWeightKg);
  const isGain = current != null ? current < target : false;
  const remainingKg = current == null
    ? 0
    : Math.max(0, Math.abs(current - target));
  const reached = current != null && remainingKg < 0.05;
  const progressPercent = reached
    ? 100
    : current == null
      ? 0
      : Math.min(99, Math.max(0, Math.round((1 - remainingKg / Math.max(target, 1)) * 100)));

  return {
    targetWeightText: formatGoalWeightValue(target),
    remainingLabel: isGain ? '还需增重 (kg)' : '还需减重 (kg)',
    remainingText: current != null ? formatGoalWeightValue(remainingKg) : '--',
    progressPercent,
    planLabel: isGain ? '增重计划' : '减重计划',
  };
}

export function findWeightHealthGoal(targets?: HealthGoalTarget[]) {
  return (targets ?? []).find(target => {
    const goal = target.healthGoalVo;
    return goal?.assessmentType === 'health_indicator_type'
      && goal?.assessmentValue === 'tiZhong';
  });
}

export function hasWeightHealthGoal(rule?: InUseExPatientRule | null) {
  return Boolean(findWeightHealthGoal(rule?.healthGoalTargetList));
}

export function buildWeightGoalSummary(target?: HealthGoalTarget): WeightGoalSummary | null {
  if (!target) return null;

  const ratePercent = target.tiZhongRate ?? target.improveDirectionVal;
  if (ratePercent == null || Number.isNaN(Number(ratePercent))) return null;

  const rawProgress = target.improvePercent;
  const improvePercent = rawProgress != null && !Number.isNaN(Number(rawProgress))
    ? Math.min(100, Math.max(0, Math.round(Number(rawProgress))))
    : 0;

  return {
    ratePercent: Number(ratePercent),
    planLabel: target.tiZhongImproveDirection === 1 ? '增重计划' : '减重计划',
    isGain: target.tiZhongImproveDirection === 1,
    improvePercent,
  };
}

export function formatWeightCurrentValue(displayValue: string, latestItem?: MeasureDataItem) {
  const fromLatest = parseMeasureNumber(latestItem?.val);
  if (fromLatest != null && fromLatest > 0) {
    return formatGoalWeightValue(fromLatest);
  }
  if (!displayValue || displayValue === '--') return '--';
  const latestPart = displayValue.includes('-')
    ? displayValue.split('-').pop()?.trim()
    : displayValue;
  return latestPart ?? '--';
}

export function calcWeightDetailStats(
  items: MeasureDataItem[],
  range: WeightDetailChartRange,
  groups: MeasureDataStatisDayGroup[] = [],
  heightCm?: number | null,
) {
  const sourceItems = range === 'today'
    ? filterMeasureItemsInRange(items, 'today')
    : groups.flatMap(group => group.childList ?? []);

  const values = sourceItems
    .map(item => parseMeasureNumber(item.val))
    .filter((value): value is number => value != null && value > 0);

  if (!values.length) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bmiValues = sourceItems
    .map(item => resolveItemBmi(item, heightCm))
    .filter((value): value is number => value != null && value > 0);

  return {
    rangeText: min === max ? formatGoalWeightValue(min) : `${formatGoalWeightValue(min)}-${formatGoalWeightValue(max)}`,
    recordCount: sourceItems.length,
    bmiText: bmiValues.length
      ? (() => {
        const bmiMin = Math.min(...bmiValues);
        const bmiMax = Math.max(...bmiValues);
        return bmiMin === bmiMax
          ? String(Number(bmiMin.toFixed(1)))
          : `${String(Number(bmiMin.toFixed(1)))}-${String(Number(bmiMax.toFixed(1)))}`;
      })()
      : '--',
  };
}
