import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import type { SleepPieSegment } from '@/src/features/profile/components/SleepPieChart';
import {
  SLEEP_STAGE_CONFIG,
  buildSleepHoursSeries,
  buildSleepPieSegments,
  formatSleepDuration,
  getSleepDurationMinutes,
  getSleepQuality,
  getSleepScoreQuality,
  type VitalsRange,
} from '../../vitalsHelpers';
import { getLatestWearableItem, parseMeasureNumber } from './shared';

export type SleepDetailChartRange = 'today' | 'week' | 'month';

export type SleepDetailBarPoint = {
  label: string;
  value: number;
};

export type SleepStageDisplay = {
  key: string;
  label: string;
  color: string;
  duration: string;
};

export type SleepDetailStats = {
  totalSleep: string;
  dailyAverage: string;
  avgWakeTime: string;
  avgBedTime: string;
};

const STAGE_DISPLAY_LABEL: Record<string, string> = {
  awakeSleepTime: '清醒',
  remSleepTime: '快速眼动',
  coreSleepTime: '浅睡',
  deepSleepTime: '深睡',
};

function mapDetailRangeToVitalsRange(range: SleepDetailChartRange): VitalsRange {
  if (range === 'week') return '7Days';
  if (range === 'month') return '30Days';
  return 'today';
}

function getItemLocalDate(item: WearableDataItem) {
  const date = item.customerLocalDate ?? item.dataDate?.slice(0, 10);
  const parsed = moment(date, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : moment();
}

function getItemSleepMinutes(item: WearableDataItem) {
  return getSleepDurationMinutes(item) ?? 0;
}

function parseClockTime(value?: string) {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const normalized = trimmed.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = moment(normalized);
  if (parsed.isValid()) return parsed;

  const strictParsed = moment(
    trimmed,
    [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', 'HH:mm:ss', 'HH:mm'],
    true,
  );
  return strictParsed.isValid() ? strictParsed : null;
}

function getSleepBedTimeStr(item?: WearableDataItem) {
  return item?.bedTimeStr?.trim() || item?.startTimeStr?.trim();
}

function getSleepWakeTimeStr(item?: WearableDataItem) {
  return item?.wakeUpTimeStr?.trim() || item?.endTimeStr?.trim();
}

function formatClockHm(value?: string) {
  const parsed = parseClockTime(value);
  return parsed ? parsed.format('HH:mm') : null;
}

/** 就寝时间跨午夜：凌晨 0-12 点按「前一晚」计入（+24h），再参与平均 */
function toBedtimeMinutesForAverage(parsed: moment.Moment) {
  let minutes = parsed.hour() * 60 + parsed.minute();
  if (minutes < 12 * 60) {
    minutes += 24 * 60;
  }
  return minutes;
}

function averageClockMinutes(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatAverageClockMinutes(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return moment().startOf('day').add(normalized, 'minutes').format('HH:mm');
}

function dedupeDailySleepItems(items: WearableDataItem[]) {
  const byDate = new Map<string, WearableDataItem>();

  for (const item of items) {
    if (getItemSleepMinutes(item) <= 0) continue;
    const dateKey = getItemLocalDate(item).format('YYYY-MM-DD');
    const existing = byDate.get(dateKey);
    if (!existing || getItemLocalDate(item).isAfter(getItemLocalDate(existing))) {
      byDate.set(dateKey, item);
    }
  }

  return [...byDate.values()].sort(
    (left, right) => getItemLocalDate(left).valueOf() - getItemLocalDate(right).valueOf(),
  );
}

function filterSleepItemsForRange(items: WearableDataItem[], range: SleepDetailChartRange) {
  if (range === 'today') {
    return items.filter(item => {
      const date = getItemLocalDate(item);
      return (
        getItemSleepMinutes(item) > 0
        && (date.isSame(moment(), 'day') || date.isSame(moment().subtract(1, 'day'), 'day'))
      );
    });
  }

  const vitalsRange = mapDetailRangeToVitalsRange(range);
  const start = vitalsRange === '7Days'
    ? moment().subtract(6, 'days').startOf('day')
    : moment().subtract(29, 'days').startOf('day');
  const end = moment().endOf('day');

  return items.filter(item => {
    const date = getItemLocalDate(item);
    return getItemSleepMinutes(item) > 0 && date.isBetween(start, end, 'day', '[]');
  });
}

export function buildSleepDetailBarSeries(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
): SleepDetailBarPoint[] {
  if (range === 'today') {
    return [moment().subtract(1, 'day'), moment()].map(day => {
      const dayItems = items.filter(item => getItemLocalDate(item).isSame(day, 'day'));
      const latest = getLatestWearableItem(dayItems);
      const minutes = latest ? getItemSleepMinutes(latest) : 0;
      return {
        label: day.format('M/D'),
        value: minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : 0,
      };
    }).filter(point => point.value > 0);
  }

  return buildSleepHoursSeries(items, mapDetailRangeToVitalsRange(range)).map(point => ({
    label: point.label,
    value: point.value,
  }));
}

export function getSleepDetailDisplayItem(items: WearableDataItem[], range: SleepDetailChartRange) {
  const filtered = filterSleepItemsForRange(items, range);
  if (!filtered.length) return undefined;

  if (range === 'today') {
    return [...filtered].sort(
      (left, right) => getItemLocalDate(right).valueOf() - getItemLocalDate(left).valueOf(),
    )[0];
  }

  return getLatestWearableItem(filtered);
}

export function getSleepDetailHeaderSummary(items: WearableDataItem[], range: SleepDetailChartRange) {
  const displayItem = getSleepDetailDisplayItem(items, range);
  const minutes = displayItem ? getItemSleepMinutes(displayItem) : null;

  return {
    duration: formatSleepDuration(minutes),
    quality: getSleepQuality(displayItem),
    currentLabel: formatSleepCurrentLabel(displayItem),
  };
}

function formatSleepCurrentLabel(item?: WearableDataItem) {
  if (!item) return '当前：--';

  const bedMoment = parseClockTime(getSleepBedTimeStr(item));
  const date = bedMoment ?? getItemLocalDate(item);
  const dateLabel = date.isSame(moment(), 'day')
    ? '今天'
    : date.isSame(moment().subtract(1, 'day'), 'day')
      ? '昨晚'
      : date.format('M/D');

  const start = formatClockHm(getSleepBedTimeStr(item));
  const end = formatClockHm(getSleepWakeTimeStr(item));
  if (start && end) {
    return `当前：${dateLabel} ${start}-${end}`;
  }

  return `当前：${dateLabel}`;
}

export function formatSleepSuggestionText(_goalHours?: number | null) {
  return '建议时长：7-9小时';
}

export function formatSleepSuggestionTimeText(goalHours?: number | null, wakeMinutes = 7 * 60) {
  const goal = goalHours ?? 8;
  const goalMinutes = Math.round(goal * 60);
  let bedMinutes = wakeMinutes - goalMinutes;
  if (bedMinutes < 0) bedMinutes += 24 * 60;

  const formatHm = (minutes: number) =>
    moment().startOf('day').add(minutes, 'minutes').format('HH:mm');

  return `建议时间：${formatHm(bedMinutes)}-${formatHm(wakeMinutes)}`;
}

function formatSleepSuggestionLabel(range: SleepDetailChartRange, goalHours?: number | null) {
  if (range === 'today') return formatSleepSuggestionTimeText(goalHours);
  return formatSleepSuggestionText(goalHours);
}

export function buildSleepAnalysisStages(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
): SleepStageDisplay[] {
  const segments = getSleepAnalysisPieSegments(items, range);

  return SLEEP_STAGE_CONFIG.map((stage, index) => ({
    key: stage.key,
    label: STAGE_DISPLAY_LABEL[stage.key] ?? stage.name,
    color: stage.color,
    duration: formatSleepDuration(segments[index]?.value ?? null),
  }));
}

export function buildSleepAnalysisPieSegments(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
): SleepPieSegment[] {
  return getSleepAnalysisPieSegments(items, range);
}

function getSleepAnalysisPieSegments(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
): SleepPieSegment[] {
  if (range === 'today') {
    return buildSleepPieSegments(getSleepDetailDisplayItem(items, range));
  }

  const rangedItems = dedupeDailySleepItems(filterSleepItemsForRange(items, range));
  if (!rangedItems.length) {
    return SLEEP_STAGE_CONFIG.map(stage => ({
      name: stage.name,
      value: 0,
      color: stage.color,
    }));
  }

  const totals = SLEEP_STAGE_CONFIG.map(() => 0);
  for (const item of rangedItems) {
    const segments = buildSleepPieSegments(item);
    segments.forEach((segment, index) => {
      totals[index] += segment.value;
    });
  }

  const dayCount = rangedItems.length;
  return SLEEP_STAGE_CONFIG.map((stage, index) => ({
    name: stage.name,
    value: Math.round(totals[index] / dayCount),
    color: stage.color,
  }));
}

export function calcSleepDetailStats(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
): SleepDetailStats | null {
  const rangedItems = dedupeDailySleepItems(filterSleepItemsForRange(items, range));
  if (!rangedItems.length) return null;

  const totalMinutes = rangedItems.reduce((sum, item) => sum + getItemSleepMinutes(item), 0);
  const wakeMinutes: number[] = [];
  const bedMinutes: number[] = [];

  for (const item of rangedItems) {
    const wake = parseClockTime(getSleepWakeTimeStr(item));
    const bed = parseClockTime(getSleepBedTimeStr(item));
    if (wake) wakeMinutes.push(wake.hour() * 60 + wake.minute());
    if (bed) bedMinutes.push(toBedtimeMinutesForAverage(bed));
  }

  const avgWake = averageClockMinutes(wakeMinutes);
  const avgBed = averageClockMinutes(bedMinutes);

  return {
    totalSleep: formatSleepDuration(totalMinutes),
    dailyAverage: formatSleepDuration(Math.round(totalMinutes / rangedItems.length)),
    avgWakeTime: avgWake != null ? formatAverageClockMinutes(avgWake) : '--',
    avgBedTime: avgBed != null ? formatAverageClockMinutes(avgBed) : '--',
  };
}

export type SleepDetailPoint = {
  hour: string;
  value: number;
  sleepGoalHours?: number;
};

function isValidSleepDetailPoint(point?: SleepDetailPoint) {
  return point != null && point.value > 0;
}

function getSleepQualityForHours(hours: number, goalHours: number) {
  if (hours >= goalHours) return { label: '良好', color: '#6D925E' };
  if (hours >= goalHours * 0.75) return { label: '一般', color: '#EE9C44' };
  return { label: '偏低', color: '#72A1C5' };
}

export function resolveStoreSleepGoal(sleepGoalsMinutes?: number) {
  if (sleepGoalsMinutes != null && sleepGoalsMinutes > 0) {
    return Math.round((sleepGoalsMinutes / 60) * 2) / 2;
  }
  return 8;
}

export function buildSleepDetailTodaySeries(
  items: WearableDataItem[],
  goalHours?: number,
): SleepDetailPoint[] {
  return [moment().subtract(1, 'day'), moment()].map(day => {
    const dayItems = items.filter(item => getItemLocalDate(item).isSame(day, 'day'));
    const latest = getLatestWearableItem(dayItems);
    const minutes = latest ? getItemSleepMinutes(latest) : 0;
    const label = day.isSame(moment(), 'day') ? '今天' : '昨晚';

    return {
      hour: label,
      value: minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : 0,
      sleepGoalHours: goalHours,
    };
  });
}

export function buildSleepDetailPeriodSeries(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
  goalHours?: number,
): SleepDetailPoint[] {
  return buildSleepHoursSeries(items, mapDetailRangeToVitalsRange(range)).map(point => ({
    hour: point.label,
    value: point.value,
    sleepGoalHours: goalHours,
  }));
}

export function formatSleepDetailPointDisplay(
  range: SleepDetailChartRange,
  point?: SleepDetailPoint,
  goalHours?: number,
) {
  const goal = goalHours ?? 8;

  if (!isValidSleepDetailPoint(point)) {
    return {
      duration: '--',
      quality: { label: '--', color: '#999999' },
      currentLabel: '当前：--',
      suggestionLabel: formatSleepSuggestionLabel(range, goal),
    };
  }

  const minutes = Math.round(point!.value * 60);

  return {
    duration: formatSleepDuration(minutes),
    quality: getSleepQualityForHours(point!.value, goal),
    currentLabel: `当前：${point!.hour}`,
    suggestionLabel: formatSleepSuggestionLabel(range, goal),
  };
}

export function getSleepDetailInitialDisplay(
  items: WearableDataItem[],
  range: SleepDetailChartRange,
  goalHours?: number,
) {
  const summary = getSleepDetailHeaderSummary(items, range);

  return {
    duration: summary.duration,
    quality: summary.quality,
    currentLabel: summary.currentLabel,
    suggestionLabel: formatSleepSuggestionLabel(range, goalHours),
  };
}

export type SleepGoalProgress = {
  met: boolean;
  statusLabel: string;
  statusColor: string;
  borderColor: string;
  message: string;
};

function formatSleepGoalHoursLabel(goalHours: number) {
  if (Number.isInteger(goalHours)) return `${goalHours}小时`;
  return `${goalHours}小时`;
}

export function buildSleepGoalProgress(
  item: WearableDataItem | undefined,
  goalHours: number,
): SleepGoalProgress | null {
  if (!item) return null;

  const totalMinutes = getItemSleepMinutes(item);
  if (totalMinutes <= 0) return null;

  const goalMinutes = Math.round(goalHours * 60);
  const goalLabel = formatSleepGoalHoursLabel(goalHours);

  if (totalMinutes >= goalMinutes) {
    const excessMinutes = totalMinutes - goalMinutes;
    return {
      met: true,
      statusLabel: '已达标',
      statusColor: '#6D925E',
      borderColor: '#6D925E',
      message: `目标${goalLabel}，超出${
        excessMinutes > 0 ? formatSleepDuration(excessMinutes) : '0分钟'
      }`,
    };
  }

  const diffMinutes = goalMinutes - totalMinutes;
  return {
    met: false,
    statusLabel: '未达标',
    statusColor: '#EE9C44',
    borderColor: '#EE9C44',
    message: `目标${goalLabel}，还差${formatSleepDuration(diffMinutes)}`,
  };
}

export type SleepStageBoundaryLabels = {
  sleepDate: string;
  sleepTime: string;
  wakeDate: string;
  wakeTime: string;
};

export function formatSleepStageBoundaryLabels(item?: WearableDataItem): SleepStageBoundaryLabels {
  if (!item) {
    return {
      sleepDate: '--',
      sleepTime: '--入睡',
      wakeDate: '--',
      wakeTime: '--醒来',
    };
  }

  const fallbackDate = getItemLocalDate(item);
  const bedTimeStr = getSleepBedTimeStr(item);
  const wakeTimeStr = getSleepWakeTimeStr(item);
  const startMoment = parseClockTime(bedTimeStr);
  const endMoment = parseClockTime(wakeTimeStr);
  const sleepDateLabel = (startMoment ?? fallbackDate).format('M/D');
  const wakeDateLabel = (endMoment ?? fallbackDate).format('M/D');
  const start = formatClockHm(bedTimeStr);
  const end = formatClockHm(wakeTimeStr);

  return {
    sleepDate: sleepDateLabel,
    sleepTime: start ? `${start}入睡` : '--入睡',
    wakeDate: wakeDateLabel,
    wakeTime: end ? `${end}醒来` : '--醒来',
  };
}

export function parseSleepSqsScore(item?: WearableDataItem) {
  const score = parseMeasureNumber(item?.sqsScore);
  if (score == null || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

export function getSleepScoreDescription(score?: number | null) {
  return getSleepScoreQuality(score).description;
}

export function getSleepScoreMarkerPercent(score?: number | null) {
  if (score == null) return 0;
  return Math.max(2, Math.min(98, score));
}

export function buildSleepScoreSummary(item?: WearableDataItem) {
  const score = parseSleepSqsScore(item);
  const quality = getSleepScoreQuality(score);

  return {
    score,
    scoreText: score != null ? String(Math.round(score)) : '--',
    markerPercent: getSleepScoreMarkerPercent(score),
    description: quality.description,
    qualityLabel: quality.label || '--',
    qualityColor: quality.color,
  };
}
