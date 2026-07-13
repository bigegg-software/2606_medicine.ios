import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import {
  getLatestWearableItem,
  getWearableDate,
  parseMeasureNumber,
  sumEnergyFromItem,
} from './shared';
import { getTodayWearableItem, buildEnergyTodayBarSeries } from '../../vitalsHelpers';

export type EnergyDetailChartRange = 'today' | 'week' | 'month';

export type EnergyDetailPoint = {
  hour: string;
  value: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
  energyGoals?: number;
};

function mapEnergyBarLabelToPoint(
  label: string,
  value: number,
  goal: number,
): EnergyDetailPoint {
  const parsed = moment(label, 'HH:mm', true);
  const x = parsed.isValid() ? parsed.hour() + parsed.minute() / 60 : 0;

  return {
    hour: label,
    value,
    x,
    dataTime: label,
    customerLocalDate: moment().format('YYYY-MM-DD'),
    energyGoals: goal,
  };
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
  if (goalOverride != null && Number.isFinite(goalOverride) && goalOverride >= 0) {
    return Math.round(goalOverride);
  }
  const item =
    getTodayWearableItem(activeItems) ??
    getLatestWearableItem(activeItems) ??
    getTodayWearableItem(basalItems) ??
    getLatestWearableItem(basalItems);
  return parseMeasureNumber(item?.energyGoals) ?? 2000;
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
  const goal = getEnergyDetailGoal(activeItems, basalItems, goalOverride);
  const bars = buildEnergyTodayBarSeries(activeItems, basalItems);

  if (bars.length) {
    return bars.map(bar => mapEnergyBarLabelToPoint(bar.label, bar.value, goal));
  }

  return [];
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

function resolveEnergyYAxisInterval(peak: number, range: EnergyDetailChartRange) {
  const candidates = range === 'today'
    ? [20, 50, 100, 200, 500]
    : [200, 500, 1000, 2000, 3000];

  for (const interval of candidates) {
    if (peak <= interval * 5) return interval;
  }

  return candidates[candidates.length - 1];
}

export function buildEnergyDetailYAxis(
  points: EnergyDetailPoint[],
  range: EnergyDetailChartRange,
) {
  const values = points.map(point => point.value).filter(value => value > 0);
  const peak = values.length ? Math.max(...values) : range === 'today' ? 100 : 2000;
  const interval = resolveEnergyYAxisInterval(peak, range);
  const tickCount = range === 'today' ? 4 : 5;

  return {
    min: 0,
    max: Math.max(interval * tickCount, Math.ceil(peak / interval) * interval),
    interval,
  };
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
