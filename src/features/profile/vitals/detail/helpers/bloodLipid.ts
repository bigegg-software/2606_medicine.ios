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
import { getItemTimestamp, parseMeasureNumber, pickLatestMeasureRecords } from './shared';
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

export type BloodLipidGoalDisplay = {
  key: BloodLipidMetricKey;
  shortLabel: string;
  title: string;
  planLabel: string;
  targetText: string;
  remainingLabel: string;
  remainingText: string;
  progressPercent: number;
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
  displays: BloodLipidGoalDisplay[];
  periodItems: MeasureDataItem[];
};

const LIPID_METRICS: Array<{
  key: BloodLipidMetricKey;
  goalType: string;
  pairKey: 'tc' | 'tg' | 'ldlC' | 'hdlC';
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
      pairKey: 'tc',
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
      pairKey: 'tg',
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
      pairKey: 'ldlC',
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
      pairKey: 'hdlC',
      shortLabel: 'HDL-C',
      fullLabel: '高密度脂蛋白',
      normalRangeText: '≥ 1.0 mmol/L',
      higherIsBetter: true,
      rateKey: 'xuezhiHdlCRate',
      dirKey: 'xuezhiHdlCImproveDirection',
    },
  ];

function formatLipidDecimal(value: number) {
  return String(Number(value.toFixed(2)));
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

const BLOOD_LIPID_REFERENCE: Record<
  BloodLipidMetricKey,
  { value: number; labelPrefix: '上限' | '下限' }
> = {
  TC: { value: 5.2, labelPrefix: '上限' },
  TG: { value: 1.7, labelPrefix: '上限' },
  'LDL-C': { value: 3.4, labelPrefix: '上限' },
  'HDL-C': { value: 1.0, labelPrefix: '下限' },
};

export function getBloodLipidChartReferenceLines(metricKey: BloodLipidMetricKey) {
  const { value, labelPrefix } = BLOOD_LIPID_REFERENCE[metricKey];
  const formatted = formatLipidDecimal(value);
  return {
    safetyLineY: value,
    safetyLineLabel: `${labelPrefix}${formatted}`,
  };
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

export function getBloodLipidRecentItems(items: MeasureDataItem[]) {
  return pickLatestMeasureRecords(items, BLOOD_LIPID_RECENT_PAGE_SIZE);
}

export function buildBloodLipidDetailSeries(
  items: MeasureDataItem[],
  metricKey: BloodLipidMetricKey,
) {
  return [...items]
    .sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf())
    .map(item => buildRecordPoint(item, metricKey))
    .filter((point): point is BloodLipidDetailPoint => point != null)
    .slice(-BLOOD_LIPID_RECENT_PAGE_SIZE);
}

export function buildBloodLipidDetailYAxis(
  points: BloodLipidDetailPoint[],
  metricKey: BloodLipidMetricKey = 'TC',
) {
  const values = points
    .flatMap(point => [point.min, point.max])
    .filter(value => value > 0);
  const { safetyLineY } = getBloodLipidChartReferenceLines(metricKey);
  const peak = values.length ? Math.max(...values, safetyLineY) : safetyLineY;
  const floor = values.length ? Math.min(...values, safetyLineY) : 0;
  const padding = Math.max(0.5, (peak - floor) * 0.08);
  const span = Math.max(peak - floor + padding * 2, 1);
  const interval = resolveBloodLipidYAxisInterval(span);
  const min = Math.max(0, Math.floor((floor - padding) / interval) * interval);
  const max = Math.max(min + interval * 4, Math.ceil((peak + padding) / interval) * interval);

  return { min, max, interval };
}

/** 按跨度选择刻度间隔，避免极值（如 100）导致 Y 轴标签堆叠 */
function resolveBloodLipidYAxisInterval(span: number) {
  const candidates = [0.5, 1, 2, 5, 10, 20, 25, 50, 100];
  for (const interval of candidates) {
    if (span <= interval * 5) return interval;
  }
  return candidates[candidates.length - 1];
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
      const pair = target.bloodLipid?.[metric.pairKey];
      if (pair?.target != null && Number.isFinite(Number(pair.target))) return true;
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

function toFiniteLipidNumber(value?: number | null) {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function calcLipidAbsoluteTarget(
  baseline: number,
  ratePercent: number,
  isGain: boolean,
) {
  const factor = ratePercent / 100;
  const target = isGain
    ? baseline * (1 + factor)
    : baseline * (1 - factor);
  return Number(Math.max(0, target).toFixed(2));
}

function calcLipidGoalProgressPercent(
  baseline: number,
  current: number | null,
  targetValue: number,
  isGain: boolean,
) {
  const totalChange = Math.abs(targetValue - baseline);
  if (totalChange <= 0) {
    if (current == null) return 0;
    return isGain
      ? (current >= targetValue ? 100 : 0)
      : (current <= targetValue ? 100 : 0);
  }
  if (current == null) return 0;
  const achieved = isGain ? current - baseline : baseline - current;
  if (achieved <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((achieved / totalChange) * 100)));
}

export function buildBloodLipidGoalDisplays(
  target: HealthGoalTarget,
  periodItems: MeasureDataItem[] = [],
): BloodLipidGoalDisplay[] {
  return resolveConfiguredLipidTypes(target)
    .map(type => {
      const metric = LIPID_METRICS.find(item => item.goalType === type);
      if (!metric) return null;

      const pair = target.bloodLipid?.[metric.pairKey];
      const direction = target[metric.dirKey] as number | undefined;
      const ratePercent = target[metric.rateKey] as number | undefined;
      const isGain = direction === 1
        || (direction !== -1 && metric.higherIsBetter);

      const baseline = toFiniteLipidNumber(pair?.baseline)
        ?? getBaselineLipidValue(periodItems, metric.key);
      if (baseline == null) return null;

      const absoluteTarget = toFiniteLipidNumber(pair?.target)
        ?? (
          ratePercent != null && !Number.isNaN(Number(ratePercent))
            ? calcLipidAbsoluteTarget(baseline, Number(ratePercent), isGain)
            : null
        );
      if (absoluteTarget == null || absoluteTarget <= 0) return null;

      const current = getLatestLipidValue(periodItems, metric.key);
      let remaining = 0;
      if (current != null) {
        remaining = isGain
          ? Math.max(0, absoluteTarget - current)
          : Math.max(0, current - absoluteTarget);
      }

      return {
        key: metric.key,
        shortLabel: metric.shortLabel,
        title: `${metric.shortLabel}目标`,
        planLabel: isGain ? '提升计划' : '降脂计划',
        targetText: formatLipidDecimal(absoluteTarget),
        remainingLabel: isGain ? '还需上升 (mmol/L)' : '还需下降 (mmol/L)',
        remainingText: current != null ? formatLipidDecimal(remaining) : '--',
        progressPercent: calcLipidGoalProgressPercent(
          baseline,
          current,
          absoluteTarget,
          isGain,
        ),
      };
    })
    .filter((row): row is BloodLipidGoalDisplay => row != null);
}

/** @deprecated 使用 buildBloodLipidGoalDisplays */
export function buildBloodLipidGoalRows(
  target: HealthGoalTarget,
  periodItems: MeasureDataItem[] = [],
) {
  return buildBloodLipidGoalDisplays(target, periodItems).map(item => ({
    shortLabel: item.shortLabel,
    fullLabel: `${item.title} (mmol/L)`,
    currentAmountText: item.targetText,
    icon: item.planLabel === '提升计划' ? 'up' as const : 'down' as const,
  }));
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
    const displays = buildBloodLipidGoalDisplays(target, baselineItems);
    const statusText = formatBloodLipidGoalStatusText(target, rule.progressInfo);

    return {
      rule,
      target,
      statusText,
      statusColor: formatBloodLipidGoalStatusColor(statusText),
      displays,
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
  const sourceItems = startDate?.trim() && endDate?.trim()
    ? items
    : getBloodLipidRecentItems(items);
  const rangedItems = filterItemsInDateRange(sourceItems, startDate, endDate);
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
