import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import {
  getLatestWearableItem,
  getWearableDate,
  parseMeasureNumber,
  parseStepsFromItem,
} from './shared';
import { getTodayWearableItem, buildStepsTodayBarSeries } from '../../vitalsHelpers';

export type StepsDetailChartRange = 'today' | 'week' | 'month';

export type StepsDetailPoint = {
  hour: string;
  value: number;
  x?: number;
  dataTime?: string;
  customerLocalDate?: string;
  stepGoals?: number;
};

function mapStepsBarLabelToPoint(
  label: string,
  value: number,
  goal: number,
): StepsDetailPoint {
  const parsed = moment(label, 'HH:mm', true);
  const x = parsed.isValid() ? parsed.hour() + parsed.minute() / 60 : 0;

  return {
    hour: label,
    value,
    x,
    dataTime: label,
    customerLocalDate: moment().format('YYYY-MM-DD'),
    stepGoals: goal,
  };
}

function resolveStepsYAxisInterval(peak: number, range: StepsDetailChartRange) {
  const candidates = range === 'today'
    ? [500, 1000, 2000, 3000, 5000]
    : [2000, 5000, 10000, 15000, 20000];

  for (const interval of candidates) {
    if (peak <= interval * 5) return interval;
  }

  return candidates[candidates.length - 1];
}

export function buildStepsDetailYAxis(
  points: StepsDetailPoint[],
  range: StepsDetailChartRange,
) {
  const values = points.map(point => point.value).filter(value => value > 0);
  const peak = values.length ? Math.max(...values) : range === 'today' ? 1000 : 10000;
  const interval = resolveStepsYAxisInterval(peak, range);
  const tickCount = range === 'today' ? 4 : 5;

  return {
    min: 0,
    max: Math.max(interval * tickCount, Math.ceil(peak / interval) * interval),
    interval,
  };
}

export function getStepsDetailDayTotal(items: WearableDataItem[]) {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const sourceItems = todayItems.length ? todayItems : items;
  return parseStepsFromItem(getLatestWearableItem(sourceItems));
}

export function getStepsDetailGoal(items: WearableDataItem[], goalOverride?: number) {
  if (goalOverride != null && Number.isFinite(goalOverride) && goalOverride >= 0) {
    return Math.round(goalOverride);
  }
  const item = getTodayWearableItem(items) ?? getLatestWearableItem(items);
  return parseMeasureNumber(item?.stepGoals) ?? 10000;
}

export function formatStepsGoalLabel(goal: number) {
  return `目标：${Math.round(goal).toLocaleString('en-US')}`;
}

function getStepsStatusDisplay(steps: number, goal: number) {
  if (steps <= 0) {
    return { status: '--', statusColor: '#999999' };
  }
  if (steps >= goal) {
    return { status: '达标', statusColor: '#6D925E' };
  }
  const remaining = Math.max(0, Math.round(goal - steps));
  return {
    status: `距目标还有${remaining.toLocaleString('en-US')}步`,
    statusColor: '#EE9C44',
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
  const bars = buildStepsTodayBarSeries(items);

  if (bars.length) {
    return bars.map(bar => mapStepsBarLabelToPoint(bar.label, bar.value, goal));
  }

  return [];
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
      suggestionLabel: formatStepsGoalLabel(goalOverride ?? 10000),
    };
  }

  const goal = point!.stepGoals ?? goalOverride ?? 10000;
  const { status, statusColor } = getStepsStatusDisplay(point!.value, goal);

  return {
    value: Math.round(point!.value).toLocaleString('en-US'),
    status,
    statusColor,
    currentLabel: formatStepsCurrentLabel(range, point),
    suggestionLabel: formatStepsGoalLabel(goal),
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
