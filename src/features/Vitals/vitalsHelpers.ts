import moment from 'moment';
import type { BloodPressurePoint } from '@/src/features/home/components/BloodPressureChart';

export type VitalsRange = 'today' | '7Days' | '30Days';

export const VITALS_NAV_LIST: { label: string; value: VitalsRange }[] = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7Days' },
  { label: '近30天', value: '30Days' },
];

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const TODAY_HOUR_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];

export function getChartLabels(range: VitalsRange): string[] {
  switch (range) {
    case 'today':
      return TODAY_HOUR_LABELS;
    case '7Days':
      return WEEK_LABELS;
    case '30Days':
      return [29, 24, 19, 14, 9, 4, 0].map(d => moment().subtract(d, 'days').format('M/D')).reverse();
    default:
      return TODAY_HOUR_LABELS;
  }
}

export type LabeledValue = { label: string; value: number };

export function buildLabeledSeries(range: VitalsRange, base: number, spread = 3): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, i) => ({
    label,
    value: Math.round((base + Math.sin(i * 0.9) * spread) * 10) / 10,
  }));
}

export function buildBloodPressureSeries(range: VitalsRange): BloodPressurePoint[] {
  const labels = getChartLabels(range);
  return labels.map((_, i) => ({
    high: 138 + (i % 3) * 3,
    low: 86 + (i % 2) * 2,
  }));
}

export function toHourPoints(series: LabeledValue[]) {
  return series.map(({ label, value }) => ({ hour: label, value }));
}

export function formatBloodPressure(latest?: BloodPressurePoint) {
  const point = latest ?? { high: 142, low: 92 };
  const status = point.high >= 140 || point.low >= 90 ? '偏高' : '正常';
  const statusColor = status === '偏高' ? '#FFBA1D' : '#00C950';
  return {
    value: `${point.high}/${point.low}`,
    status: `・${status}`,
    statusColor,
  };
}

export function formatSingleValue(
  value: number,
  opts: { high?: number; low?: number; unit?: string } = {},
) {
  const { high, low } = opts;
  let status = '正常';
  if (high != null && value > high) status = '偏高';
  if (low != null && value < low) status = '偏低';
  const statusColor = status === '正常' ? '#00C950' : '#FFBA1D';
  return {
    value: String(value),
    status: `・${status}`,
    statusColor,
  };
}
