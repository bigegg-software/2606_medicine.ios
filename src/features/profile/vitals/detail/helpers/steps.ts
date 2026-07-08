import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import {
  collectWearableReadings,
  getLatestWearableItem,
  getWearableDate,
  getWearableTimestamp,
  parseMeasureNumber,
  parseStepsFromItem,
} from './shared';
import { getTodayWearableItem } from '../../vitalsHelpers';

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
