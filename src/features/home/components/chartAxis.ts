export const TODAY_AXIS_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];

/** 172px 宽图表下，类目轴标签配置 */
export function formatTimeLabel(value: string) {
  const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const [, h, m] = match;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

export function buildCategoryAxisLabel(labels: string[]) {
  const isTimeLabel = labels.some(l => /^\d{1,2}:\d{2}$/.test(l));
  const interval =
    labels.length > 20
      ? Math.max(0, Math.floor(labels.length / 6) - 1)
      : labels.length > 6
        ? 1
        : 0;

  return {
    show: true,
    fontSize: isTimeLabel ? 9 : 9,
    color: '#999999',
    margin: 4,
    hideOverlap: true,
    interval,
    ...(isTimeLabel ? { formatter: formatTimeLabel } : {}),
  };
}

export function hasTodayChartX<T extends { x?: number }>(points: T[]) {
  return points.some(point => point.x != null);
}

export function buildTodayValueAxis(boundaryGap = false) {
  const max = TODAY_AXIS_LABELS.length - 1;

  return {
    type: 'value' as const,
    min: 0,
    max,
    boundaryGap,
    axisTick: { show: false },
    axisLine: { show: false },
    splitLine: { show: false },
    axisLabel: {
      show: true,
      fontSize: 8,
      color: '#999999',
      margin: 2,
      hideOverlap: true,
      formatter: (value: number) => {
        const index = Math.round(value);
        if (Math.abs(value - index) > 0.01 || index < 0 || index > max) return '';
        if (index !== 0 && index !== 2 && index !== max) return '';
        const label = TODAY_AXIS_LABELS[index];
        return label ? formatTimeLabel(label) : '';
      },
    },
  };
}

export function buildChartXAxis<T extends { x?: number; hour?: string }>(
  points: T[],
  categoryLabels: string[],
  boundaryGap = false,
) {
  if (hasTodayChartX(points)) {
    return buildTodayValueAxis(boundaryGap);
  }

  const labels = categoryLabels.length
    ? categoryLabels
    : points.map(point => point.hour ?? '').filter(Boolean);

  return {
    type: 'category' as const,
    boundaryGap,
    data: labels,
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: buildCategoryAxisLabel(labels),
    splitLine: { show: false },
  };
}

export function toChartValuePairs<T extends { x?: number; value: number; hour?: string }>(
  points: T[],
  isValid: (value: number) => boolean = value => value > 0,
) {
  if (!hasTodayChartX(points)) {
    return points.map(point => ({
      value: isValid(point.value) ? point.value : null,
      name: point.hour,
    }));
  }

  return points
    .filter(point => point.x != null && isValid(point.value))
    .sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
    .map(point => ({
      value: [point.x as number, point.value],
      name: point.hour,
    }));
}

export function normalizeBloodPressureChartPoints<
  T extends { x?: number; high: number; low: number; hour?: string },
>(points: T[]) {
  if (!hasTodayChartX(points)) return points;
  return points
    .filter(point => point.x != null && (point.high > 0 || point.low > 0))
    .sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
}

export type LineChartSeriesItem = {
  value: number | null | [number, number | null];
  name?: string;
  symbol?: string;
  symbolSize?: number;
  itemStyle?: { color?: string };
};

function hasLineChartValue(value: LineChartSeriesItem['value']) {
  const raw = Array.isArray(value) ? value[1] : value;
  return raw != null && Number(raw) > 0;
}

/** 连不成线的孤立点，供 scatter 层渲染 */
export function buildIsolatedLineScatterData(
  data: LineChartSeriesItem[],
): Array<number | [number, number] | null> {
  const hasValue = data.map(item => hasLineChartValue(item.value));

  return data.map((item, index) => {
    if (!hasValue[index]) return null;

    const hasPrev = index > 0 && hasValue[index - 1];
    const hasNext = index < data.length - 1 && hasValue[index + 1];
    if (hasPrev || hasNext) return null;

    const raw = item.value;
    if (Array.isArray(raw)) {
      const [x, y] = raw;
      return y != null && Number(y) > 0 ? ([x, Number(y)] as [number, number]) : null;
    }
    return Number(raw);
  });
}

/** @deprecated 使用 buildIsolatedLineScatterData */
export const buildIsolatedBloodPressureScatterData = buildIsolatedLineScatterData;

type BloodPressureSeriesItem = LineChartSeriesItem;

export function toBloodPressureSeriesData<T extends { x?: number; high: number; low: number; hour?: string }>(
  points: T[],
) {
  const chartPoints = normalizeBloodPressureChartPoints(points);

  if (!hasTodayChartX(chartPoints)) {
    return {
      chartPoints,
      high: chartPoints.map(point => ({
        value: point.high > 0 ? point.high : null,
        name: point.hour,
      })),
      low: chartPoints.map(point => ({
        value: point.low > 0 ? point.low : null,
        name: point.hour,
      })),
    };
  }

  return {
    chartPoints,
    high: chartPoints.map(point => ({
      value: [point.x as number, point.high > 0 ? point.high : null] as [number, number | null],
      name: point.hour,
    })),
    low: chartPoints.map(point => ({
      value: [point.x as number, point.low > 0 ? point.low : null] as [number, number | null],
      name: point.hour,
    })),
  };
}
