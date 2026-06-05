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

  return {
    show: true,
    fontSize: isTimeLabel ? 9 : 10,
    color: '#999999',
    margin: 4,
    hideOverlap: true,
    interval: labels.length > 6 ? 1 : 0,
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

export function toBloodPressureSeriesData<T extends { x?: number; high: number; low: number; hour?: string }>(
  points: T[],
) {
  const chartPoints = normalizeBloodPressureChartPoints(points);

  if (!hasTodayChartX(chartPoints)) {
    return {
      chartPoints,
      high: chartPoints.map(point => ({
        value: point.high,
        name: point.hour,
      })),
      low: chartPoints.map(point => ({
        value: point.low,
        name: point.hour,
      })),
    };
  }

  return {
    chartPoints,
    high: chartPoints.map(point => ({
      value: [point.x as number, point.high > 0 ? point.high : null],
      name: point.hour,
    })),
    low: chartPoints.map(point => ({
      value: [point.x as number, point.low > 0 ? point.low : null],
      name: point.hour,
    })),
  };
}
