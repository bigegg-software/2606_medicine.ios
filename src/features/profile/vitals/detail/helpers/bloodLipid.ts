import moment from 'moment';
import type { HealthGoalTarget } from '@/api/healthGoal';
import {
  getMeasureDataDetailByDateRange,
  type MeasureDataAllRecordsMonthGroup,
  type MeasureDataItem,
} from '@/api/measureData';
import { getInUseExPatientRuleInfo, type InUseExPatientRule, type ProgressInfo } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { flattenMeasureItems } from '../../vitalsHelpers';
import { getLevelColor } from '../../vitalLevelColors';
import { getItemTimestamp, parseMeasureNumber } from './shared';
import { enrichHealthGoalTargets, toHealthGoalDisplayItem } from '@/src/features/schedule/scheduleHelpers';

export const BLOOD_LIPID_RECENT_PAGE_SIZE = 10;

export type BloodLipidMetricKey = 'TC' | 'TG' | 'LDL-C' | 'HDL-C';

export type BloodLipidDetailPoint = {
  hour: string;
  min: number;
  max: number;
  dataTime?: string;
  customerLocalDate?: string;
  statusLabel?: string;
  recordLabel?: string;
};

export type BloodLipidGoalRow = {
  shortLabel: string;
  fullLabel: string;
  currentAmountText: string;
  icon: 'up' | 'down' | null;
};

export type BloodLipidCompareRow = {
  key: BloodLipidMetricKey;
  shortLabel: string;
  fullLabel: string;
  initialText: string;
  recentText: string;
  diffText: string;
  outcome: 'improved' | 'worsened' | 'unchanged';
};

export type BloodLipidCompareSummary = {
  initialDateText: string;
  recentDateText: string;
  rows: BloodLipidCompareRow[];
};

export type BloodLipidPrescriptionGoalSummary = {
  rule: InUseExPatientRule;
  target: HealthGoalTarget;
  statusText: string;
  statusColor: string;
  rows: BloodLipidGoalRow[];
  periodItems: MeasureDataItem[];
};

const LIPID_METRICS: Array<{
  key: BloodLipidMetricKey;
  goalType: string;
  shortLabel: string;
  fullLabel: string;
  normalRangeText: string;
  higherIsBetter: boolean;
  rateKey: keyof HealthGoalTarget;
  dirKey: keyof HealthGoalTarget;
}> = [
    {
      key: 'TC',
      goalType: 'xuezhiTc',
      shortLabel: 'TC',
      fullLabel: '总胆固醇',
      normalRangeText: '< 5.2 mmol/L',
      higherIsBetter: false,
      rateKey: 'xuezhiTcRate',
      dirKey: 'xuezhiTcImproveDirection',
    },
    {
      key: 'TG',
      goalType: 'xuezhiTg',
      shortLabel: 'TG',
      fullLabel: '甘油三酯',
      normalRangeText: '< 1.7 mmol/L',
      higherIsBetter: false,
      rateKey: 'xuezhiTgRate',
      dirKey: 'xuezhiTgImproveDirection',
    },
    {
      key: 'LDL-C',
      goalType: 'xuezhiLdlC',
      shortLabel: 'LDL-C',
      fullLabel: '低密度脂蛋白',
      normalRangeText: '< 3.4 mmol/L',
      higherIsBetter: false,
      rateKey: 'xuezhiLdlCRate',
      dirKey: 'xuezhiLdlCImproveDirection',
    },
    {
      key: 'HDL-C',
      goalType: 'xuezhiHdlC',
      shortLabel: 'HDL-C',
      fullLabel: '高密度脂蛋白',
      normalRangeText: '≥ 1.0 mmol/L',
      higherIsBetter: true,
      rateKey: 'xuezhiHdlCRate',
      dirKey: 'xuezhiHdlCImproveDirection',
    },
  ];

function formatLipidDecimal(value: number) {
  return Number(value.toFixed(2)).toFixed(2);
}

function getMetricConfig(key: BloodLipidMetricKey) {
  return LIPID_METRICS.find(metric => metric.key === key)!;
}

export function getBloodLipidMetricTabs() {
  return LIPID_METRICS.map(metric => ({
    label: metric.shortLabel,
    value: metric.key,
  }));
}

export function getBloodLipidMetricTitle(key: BloodLipidMetricKey) {
  return getMetricConfig(key).fullLabel;
}

export function getBloodLipidNormalRangeText(key: BloodLipidMetricKey) {
  return getMetricConfig(key).normalRangeText;
}

export function getLipidValueFromItem(item: MeasureDataItem | undefined, key: BloodLipidMetricKey) {
  if (!item) return null;
  switch (key) {
    case 'TC':
      return parseMeasureNumber(item.xuezhiTc ?? item.val);
    case 'TG':
      return parseMeasureNumber(item.xuezhiTg);
    case 'HDL-C':
      return parseMeasureNumber(item.xuezhiHdlC);
    case 'LDL-C':
      return parseMeasureNumber(item.xuezhiLdlC);
    default:
      return null;
  }
}

function getTcStatusLabel(value: number) {
  if (value < 5.2) return '正常';
  if (value < 6.2) return '偏高';
  return '异常偏高';
}

function getLdlStatusLabel(value: number) {
  if (value < 3.4) return '正常';
  if (value < 4.1) return '偏高';
  return '异常偏高';
}

function getTgStatusLabel(value: number) {
  if (value < 1.7) return '正常';
  if (value < 2.3) return '偏高';
  return '异常偏高';
}

function getHdlStatusLabel(value: number) {
  if (value >= 1.0) return '正常';
  return '偏低';
}

export function getBloodLipidStatusLabel(key: BloodLipidMetricKey, value: number) {
  switch (key) {
    case 'TC':
      return getTcStatusLabel(value);
    case 'TG':
      return getTgStatusLabel(value);
    case 'HDL-C':
      return getHdlStatusLabel(value);
    case 'LDL-C':
      return getLdlStatusLabel(value);
    default:
      return '正常';
  }
}

export function flattenBloodLipidAllRecords(rows?: MeasureDataAllRecordsMonthGroup[] | null) {
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

function formatChartDateLabel(item: MeasureDataItem) {
  const date = item.customerLocalDate?.trim();
  if (date) {
    const parsed = moment(date, 'YYYY-MM-DD', true);
    if (parsed.isValid()) return parsed.format('M/D');
  }
  return getItemTimestamp(item).format('M/D');
}

function formatRecordLabel(item?: MeasureDataItem) {
  if (!item) return '--';

  const ts = getItemTimestamp(item);
  const datePart = item.customerLocalDate?.trim()
    ? moment(item.customerLocalDate).format('YYYY/MM/DD')
    : ts.format('YYYY/MM/DD');
  const timePart = item.dataTime?.trim() || ts.format('HH:mm');
  return `${datePart} ${timePart}`;
}

function formatDisplayDate(item?: MeasureDataItem) {
  if (!item?.customerLocalDate?.trim()) return '--';
  const parsed = moment(item.customerLocalDate, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed.format('YYYY/MM/DD') : item.customerLocalDate;
}

function buildRecordPoint(
  item: MeasureDataItem,
  metricKey: BloodLipidMetricKey,
): BloodLipidDetailPoint | null {
  const value = getLipidValueFromItem(item, metricKey);
  if (value == null || value <= 0) return null;

  const rounded = Number(value.toFixed(2));
  return {
    hour: formatChartDateLabel(item),
    min: rounded,
    max: rounded,
    dataTime: item.dataTime,
    customerLocalDate: item.customerLocalDate,
    statusLabel: getBloodLipidStatusLabel(metricKey, rounded),
    recordLabel: formatRecordLabel(item),
  };
}

export function buildBloodLipidDetailSeries(
  items: MeasureDataItem[],
  metricKey: BloodLipidMetricKey,
) {
  return items
    .map(item => buildRecordPoint(item, metricKey))
    .filter((point): point is BloodLipidDetailPoint => point != null);
}

export function buildBloodLipidDetailYAxis(points: BloodLipidDetailPoint[]) {
  const values = points
    .flatMap(point => [point.min, point.max])
    .filter(value => value > 0);
  const peak = values.length ? Math.max(...values) : 6;
  const floor = values.length ? Math.min(...values) : 0;
  const padding = 0.5;
  const span = peak - floor + padding * 2;
  const interval = span > 3 ? 1 : 0.5;
  const min = Math.max(0, Math.floor((floor - padding) / interval) * interval);
  const max = Math.max(min + interval * 4, Math.ceil((peak + padding) / interval) * interval);

  return { min, max, interval };
}

function isValidDetailPoint(point?: BloodLipidDetailPoint) {
  return !!point && point.min > 0 && point.max > 0 && point.max >= point.min;
}

export function formatBloodLipidDetailPointDisplay(
  point?: BloodLipidDetailPoint,
  metricKey: BloodLipidMetricKey = 'TC',
) {
  if (!isValidDetailPoint(point)) {
    return {
      value: '--',
      status: '--',
      statusColor: '#999999',
      currentLabel: '--',
    };
  }

  const value = Number(((point!.min + point!.max) / 2).toFixed(2));
  const statusLabel = point!.statusLabel || getBloodLipidStatusLabel(metricKey, value);

  return {
    value: formatLipidDecimal(value),
    status: statusLabel,
    statusColor: getLevelColor(statusLabel),
    currentLabel: point!.recordLabel || '--',
  };
}

function resolveConfiguredLipidTypes(target: HealthGoalTarget) {
  const fromList = (target.compliantTypes ?? []).filter(type =>
    LIPID_METRICS.some(metric => metric.goalType === type),
  );
  if (fromList.length) return fromList;

  return LIPID_METRICS
    .map(metric => metric.goalType)
    .filter(type => {
      const metric = LIPID_METRICS.find(item => item.goalType === type)!;
      const rate = target[metric.rateKey] as number | undefined;
      return rate != null && !Number.isNaN(Number(rate));
    });
}

export function findBloodLipidHealthGoal(targets?: HealthGoalTarget[]) {
  const list = targets ?? [];
  const matched = list.find(target => {
    const goal = target.healthGoalVo;
    return goal?.assessmentType === 'health_indicator_type'
      && goal?.assessmentValue === 'xueZhi';
  });
  if (matched) return matched;

  return list.find(target => resolveConfiguredLipidTypes(target).length > 0);
}

export function hasBloodLipidHealthGoal(rule?: InUseExPatientRule | null) {
  return Boolean(findBloodLipidHealthGoal(rule?.healthGoalTargetList));
}

async function loadPrescriptionPeriodItems(startDate?: string, endDate?: string) {
  if (!startDate?.trim() || !endDate?.trim()) return [];

  try {
    const res = (await getMeasureDataDetailByDateRange({
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      type: '血脂',
    })) as unknown as { code?: number; data?: MeasureDataItem[] };

    if (!isResourceApiOk(res)) return [];
    return flattenMeasureItems(apiResourceData<MeasureDataItem[]>(res));
  } catch {
    return [];
  }
}

function calcLipidGoalTargetAmount(baseline: number, ratePercent: number) {
  return Number((baseline * ratePercent / 100).toFixed(2));
}

function getBaselineLipidValue(items: MeasureDataItem[], metricKey: BloodLipidMetricKey) {
  return getLipidValueFromItem(findBoundaryRecord(items, metricKey, 'first'), metricKey);
}

function getLatestLipidValue(items: MeasureDataItem[], metricKey: BloodLipidMetricKey) {
  return getLipidValueFromItem(findBoundaryRecord(items, metricKey, 'last'), metricKey);
}

function resolveTcBaselineItems(
  periodItems: MeasureDataItem[],
  fallbackItems: MeasureDataItem[] = [],
) {
  if (getBaselineLipidValue(periodItems, 'TC') != null) return periodItems;
  return fallbackItems;
}

function resolveGoalBaselineItems(
  periodItems: MeasureDataItem[],
  fallbackItems: MeasureDataItem[] = [],
) {
  const hasBaseline = (items: MeasureDataItem[]) =>
    LIPID_METRICS.some(metric => getBaselineLipidValue(items, metric.key) != null);

  if (hasBaseline(periodItems)) return periodItems;
  if (hasBaseline(fallbackItems)) return fallbackItems;
  return periodItems;
}

function calcTcImprovePercentFromMeasure(
  target: HealthGoalTarget,
  items: MeasureDataItem[],
) {
  const metric = getMetricConfig('TC');
  const baseline = getBaselineLipidValue(items, 'TC');
  const latest = getLatestLipidValue(items, 'TC');
  const ratePercent = target[metric.rateKey] as number | undefined;
  const direction = target[metric.dirKey] as number | undefined;

  if (baseline == null || latest == null || ratePercent == null || ratePercent <= 0) {
    return null;
  }

  const targetDelta = calcLipidGoalTargetAmount(baseline, Number(ratePercent));
  if (targetDelta <= 0) return null;

  const rawChange = latest - baseline;
  let achieved = metric.higherIsBetter ? rawChange : -rawChange;
  if (direction === 1) achieved = rawChange;
  else if (direction === -1) achieved = -rawChange;

  if (achieved <= 0) return 0;

  return Math.min(100, Math.round((achieved / targetDelta) * 100));
}

function formatBloodLipidProgressStatusText(progress: number) {
  if (progress >= 80) return '接近目标达成';
  if (progress >= 60) return '改善明显';
  if (progress >= 40) return '改善情况良好';
  if (progress >= 20) return '持续改善中';
  return '已开始改善';
}

export function buildBloodLipidGoalRows(
  target: HealthGoalTarget,
  periodItems: MeasureDataItem[] = [],
): BloodLipidGoalRow[] {
  return resolveConfiguredLipidTypes(target)
    .map(type => {
      const metric = LIPID_METRICS.find(item => item.goalType === type);
      if (!metric) return null;

      const ratePercent = target[metric.rateKey] as number | undefined;
      const direction = target[metric.dirKey] as number | undefined;
      if (ratePercent == null || Number.isNaN(Number(ratePercent))) return null;

      const baseline = getBaselineLipidValue(periodItems, metric.key);
      if (baseline == null || baseline <= 0) return null;

      const displayAmount = calcLipidGoalTargetAmount(baseline, Number(ratePercent));
      if (displayAmount <= 0) return null;

      return {
        shortLabel: metric.shortLabel,
        fullLabel: `${metric.fullLabel} (mmol/L)`,
        currentAmountText: formatLipidDecimal(displayAmount),
        icon: direction === 1 ? 'up' : direction === -1 ? 'down' : null,
      };
    })
    .filter((row): row is BloodLipidGoalRow => row != null);
}

export async function loadBloodLipidPrescriptionGoalSummary(
  fallbackItems: MeasureDataItem[] = [],
): Promise<BloodLipidPrescriptionGoalSummary | null> {
  try {
    const res = await getInUseExPatientRuleInfo();
    const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
    if (!isResourceApiOk(payload)) return null;

    let rule = apiResourceData<InUseExPatientRule>(payload);
    if (!rule) return null;

    if (rule.healthGoalTargetList?.length) {
      const enrichedTargets = await enrichHealthGoalTargets(rule.healthGoalTargetList);
      rule = { ...rule, healthGoalTargetList: enrichedTargets };
    }

    const target = findBloodLipidHealthGoal(rule.healthGoalTargetList);
    if (!target || !hasBloodLipidHealthGoal(rule)) return null;

    const periodItems = await loadPrescriptionPeriodItems(rule.startDate, rule.endDate);
    const baselineItems = resolveGoalBaselineItems(periodItems, fallbackItems);
    const rows = buildBloodLipidGoalRows(target, baselineItems);
    const statusText = formatBloodLipidGoalStatusText(target, rule.progressInfo);

    return {
      rule,
      target,
      statusText,
      statusColor: formatBloodLipidGoalStatusColor(statusText),
      rows,
      periodItems: baselineItems,
    };
  } catch {
    return null;
  }
}

export function formatBloodLipidGoalStatusText(
  target: HealthGoalTarget,
  progressInfo?: ProgressInfo,
) {
  return toHealthGoalDisplayItem(target, 0, progressInfo).statusText;
}

export function formatBloodLipidGoalStatusColor(statusText: string) {
  if (statusText.includes('需关注') || statusText.includes('等待评估')) {
    return '#EE9C44';
  }
  if (statusText.includes('接近目标') || statusText.includes('改善明显')) {
    return '#6D925E';
  }
  return '#EE9C44';
}

export type BloodLipidGoalProgressStatus = {
  text: string;
  color: string;
};

export function formatBloodLipidTcGoalProgressStatus(
  target?: HealthGoalTarget | null,
  periodItems: MeasureDataItem[] = [],
  fallbackItems: MeasureDataItem[] = [],
): BloodLipidGoalProgressStatus {
  const waitStatus = {
    text: '等待评估',
    color: formatBloodLipidGoalStatusColor('等待评估'),
  };

  if (!target) return waitStatus;

  const baselineItems = resolveTcBaselineItems(periodItems, fallbackItems);
  const baseline = getBaselineLipidValue(baselineItems, 'TC');
  if (baseline == null || baseline <= 0) return waitStatus;

  if (target.indicatorDeclined === 1) {
    const text = '指标下降需关注';
    return { text, color: formatBloodLipidGoalStatusColor(text) };
  }

  const rawProgress = target.improvePercent;
  let progress = rawProgress != null && !Number.isNaN(Number(rawProgress))
    ? Number(rawProgress)
    : calcTcImprovePercentFromMeasure(target, baselineItems);

  if (progress == null || Number.isNaN(progress)) return waitStatus;

  if (progress < 0) {
    const text = '指标下降需关注';
    return { text, color: formatBloodLipidGoalStatusColor(text) };
  }

  const text = formatBloodLipidProgressStatusText(progress);
  return { text, color: formatBloodLipidGoalStatusColor(text) };
}

function filterItemsInDateRange(
  items: MeasureDataItem[],
  startDate?: string,
  endDate?: string,
) {
  if (!startDate?.trim() || !endDate?.trim()) return items;

  const start = moment(startDate, 'YYYY-MM-DD', true);
  const end = moment(endDate, 'YYYY-MM-DD', true);
  if (!start.isValid() || !end.isValid()) return items;

  return items.filter(item => {
    const ts = getItemTimestamp(item);
    return ts.isSameOrAfter(start, 'day') && ts.isSameOrBefore(end, 'day');
  });
}

function findBoundaryRecord(
  items: MeasureDataItem[],
  metricKey: BloodLipidMetricKey,
  boundary: 'first' | 'last',
) {
  const validItems = items.filter(item => {
    const value = getLipidValueFromItem(item, metricKey);
    return value != null && value > 0;
  });

  if (!validItems.length) return undefined;
  return boundary === 'first' ? validItems[0] : validItems[validItems.length - 1];
}

function buildCompareRow(
  metricKey: BloodLipidMetricKey,
  initialItem?: MeasureDataItem,
  recentItem?: MeasureDataItem,
): BloodLipidCompareRow | null {
  const metric = getMetricConfig(metricKey);
  const initialValue = getLipidValueFromItem(initialItem, metricKey);
  const recentValue = getLipidValueFromItem(recentItem, metricKey);
  if (initialValue == null || recentValue == null) return null;

  const diff = Number((recentValue - initialValue).toFixed(2));
  let outcome: BloodLipidCompareRow['outcome'] = 'unchanged';
  if (diff !== 0) {
    const improved = metric.higherIsBetter ? diff > 0 : diff < 0;
    outcome = improved ? 'improved' : 'worsened';
  }

  const diffPrefix = diff > 0 ? '+' : '';
  return {
    key: metricKey,
    shortLabel: metric.shortLabel,
    fullLabel: metric.fullLabel,
    initialText: formatLipidDecimal(initialValue),
    recentText: formatLipidDecimal(recentValue),
    diffText: `${diffPrefix}${formatLipidDecimal(diff)}`,
    outcome,
  };
}

export function buildBloodLipidCompareSummary(
  items: MeasureDataItem[],
  startDate?: string,
  endDate?: string,
): BloodLipidCompareSummary | null {
  const rangedItems = filterItemsInDateRange(items, startDate, endDate);
  if (!rangedItems.length) return null;

  const rows = LIPID_METRICS
    .map(metric => buildCompareRow(
      metric.key,
      findBoundaryRecord(rangedItems, metric.key, 'first'),
      findBoundaryRecord(rangedItems, metric.key, 'last'),
    ))
    .filter((row): row is BloodLipidCompareRow => row != null);

  if (!rows.length) return null;

  const initialItem = rangedItems[0];
  const recentItem = rangedItems[rangedItems.length - 1];

  return {
    initialDateText: formatDisplayDate(initialItem),
    recentDateText: formatDisplayDate(recentItem),
    rows,
  };
}
