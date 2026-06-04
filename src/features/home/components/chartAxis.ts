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
