import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import {
  getLatestWearableItem,
  getWearableDate,
  parseMeasureNumber,
  roundEnergyValue,
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
  const active = roundEnergyValue(sumEnergyFromItem(getLatestWearableItem(activeDayItems), 'activeEnergyBurned'));
  const basal = roundEnergyValue(sumEnergyFromItem(getLatestWearableItem(basalDayItems), 'basalEnergyBurned'));
  return { active, basal, total: roundEnergyValue(active + basal) };
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
  if (total >= goal) {
    return { status: '达标', statusColor: '#6D925E' };
  }
  const remaining = Math.max(0, roundEnergyValue(goal - total));
  return {
    status: `距目标还差${formatEnergyDetailNumber(remaining)}千卡`,
    statusColor: '#EE9C44',
  };
}

function isValidEnergyDetailPoint(point?: EnergyDetailPoint) {
  return point != null && point.value > 0;
}

function formatEnergyDetailNumber(value: number) {
  return roundEnergyValue(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function buildEnergyDetailTodaySeries(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  goalOverride?: number,
): EnergyDetailPoint[] {
  const goal = getEnergyDetailGoal(activeItems, basalItems, goalOverride);
  // 详情图表仅展示活动消耗，不计入静息消耗
  const bars = buildEnergyTodayBarSeries(activeItems, []);

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
      // 详情图表仅展示活动消耗，不计入静息消耗
      value: totals.active,
      customerLocalDate: day.format('YYYY-MM-DD'),
      energyGoals: goal,
    };
  });
}

function resolveEnergyYAxisInterval(peak: number) {
  // 按活动消耗峰值自适应，覆盖亚千卡（如 0.04）到全天大量消耗
  const candidates = [
    0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
    1, 2, 5, 10, 20, 50,
    100, 200, 500, 1000, 2000, 3000, 5000,
  ];

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
  const tickCount = range === 'today' ? 4 : 5;
  // 无数据时给可读默认轴；有数据则严格跟活动消耗峰值走
  const peak = values.length
    ? Math.max(...values)
    : range === 'today'
      ? 100
      : 2000;
  const paddedPeak = peak * 1.2;
  const interval = resolveEnergyYAxisInterval(paddedPeak);
  const rawMax = Math.max(
    interval * tickCount,
    Math.ceil(paddedPeak / interval) * interval,
  );
  const max = roundEnergyValue(rawMax) || rawMax;

  return {
    min: 0,
    max,
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
    value: formatEnergyDetailNumber(point!.value),
    status,
    statusColor,
    currentLabel: formatEnergyCurrentLabel(range, point),
    suggestionLabel: `目标：${Math.round(goal).toLocaleString('en-US')}`,
  };
}

function averagePositiveValues(values: number[]) {
  const validValues = values.filter(value => value > 0);
  if (!validValues.length) return 0;
  return roundEnergyValue(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
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
