import type { ImageSourcePropType } from 'react-native';
import type { WearableDataItem } from '@/api/wearableData';

export type AllDataGoalSummaryRow = {
  key: string;
  label: string;
  color: string;
  valueText: string;
  percent: number;
};

export type AllDataGoalSummaryCardData = {
  title: string;
  icon: ImageSourcePropType;
  timeText: string;
  valueText: string;
  unit: string;
  metricLabel: string;
  statusLabel: string;
  statusColor: string;
  rows: AllDataGoalSummaryRow[];
  /** 步数卡：左标签右数值，进度条在下；消耗卡默认左右分栏 */
  variant?: 'energy' | 'steps';
  progressPercent?: number;
  progressColor?: string;
  goalLabel?: string;
  goalValueText?: string;
};

const STATUS_COLOR_ACHIEVED = '#6D925E';
const STATUS_COLOR_MISS = '#EE9C44';
const STATUS_COLOR_EMPTY = '#999999';

function formatClockHm(timeText?: string) {
  if (!timeText?.trim()) return '--';
  if (/^\d{2}:\d{2}/.test(timeText)) return timeText.slice(0, 5);
  const matched = timeText.match(/T(\d{2}:\d{2})/);
  return matched?.[1] ?? '--';
}

export function getGoalAchievedStatus(value: number, goal?: number) {
  if (value <= 0) {
    return { statusLabel: '--', statusColor: STATUS_COLOR_EMPTY };
  }
  if (goal == null || goal <= 0) {
    return { statusLabel: '正常', statusColor: '#6D925E' };
  }
  if (value >= goal) {
    return { statusLabel: '达标', statusColor: STATUS_COLOR_ACHIEVED };
  }
  return { statusLabel: '未达标', statusColor: STATUS_COLOR_MISS };
}

export function buildStepsGoalSummaryCardData(params: {
  steps: number;
  goal?: number;
  timeText?: string;
}): AllDataGoalSummaryCardData | null {
  const { steps, goal, timeText } = params;
  if (steps <= 0) return null;

  const { statusLabel, statusColor } = getGoalAchievedStatus(steps, goal);
  const hasGoal = goal != null && goal > 0;

  return {
    title: '步数状态',
    icon: require('@/assets/images/vitals/icon_bs.png'),
    timeText: formatClockHm(timeText),
    valueText: steps.toLocaleString('en-US'),
    unit: '步',
    metricLabel: '总步数',
    statusLabel,
    statusColor,
    rows: [],
    variant: 'steps',
    goalLabel: hasGoal ? '目标步数' : undefined,
    goalValueText: hasGoal ? `${goal.toLocaleString('en-US')}步` : undefined,
    progressPercent: hasGoal ? Math.min(100, Math.round((steps / goal) * 100)) : undefined,
    progressColor: hasGoal
      ? steps >= goal
        ? STATUS_COLOR_ACHIEVED
        : STATUS_COLOR_MISS
      : undefined,
  };
}

export function buildEnergyGoalSummaryCardData(params: {
  total: number;
  active: number;
  basal: number;
  goal?: number;
  timeText?: string;
}): AllDataGoalSummaryCardData | null {
  const { total, active, basal, goal, timeText } = params;
  if (total <= 0) return null;

  const { statusLabel, statusColor } = getGoalAchievedStatus(total, goal);
  const rows: AllDataGoalSummaryRow[] = [];
  if (active > 0 || basal > 0) {
    const partTotal = Math.max(active + basal, 1);
    if (active > 0) {
      rows.push({
        key: 'active',
        label: '活动消耗',
        color: '#EE9C44',
        valueText: `${active}千卡`,
        percent: Math.round((active / partTotal) * 100),
      });
    }
    if (basal > 0) {
      rows.push({
        key: 'basal',
        label: '静息消耗',
        color: '#6D925E',
        valueText: `${basal}千卡`,
        percent: Math.round((basal / partTotal) * 100),
      });
    }
  }

  return {
    title: '消耗状态',
    icon: require('@/assets/images/vitals/icon_xh.png'),
    timeText: formatClockHm(timeText),
    valueText: String(total),
    unit: '千卡',
    metricLabel: '总消耗',
    statusLabel,
    statusColor,
    rows,
  };
}
