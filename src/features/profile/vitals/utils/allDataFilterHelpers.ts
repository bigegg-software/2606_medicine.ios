export const WEARABLE_STATUS_FILTER_ALL = '全部';

const OXYGEN_STATUS_OPTIONS = ['正常', '较低', '偏低', '异常偏低'] as const;
const HEART_RATE_STATUS_OPTIONS = ['正常', '偏低', '偏高'] as const;

const STATUS_ORDER = ['正常', '偏低', '较低', '偏高', '异常偏低'] as const;

function sortStatusLabels(labels: string[]) {
  return [...labels].sort((left, right) => {
    const leftIndex = STATUS_ORDER.indexOf(left as (typeof STATUS_ORDER)[number]);
    const rightIndex = STATUS_ORDER.indexOf(right as (typeof STATUS_ORDER)[number]);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, 'zh-CN');
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

/** 血氧/心率状态筛选项：全部 + 类型默认状态 + 当前记录中出现的状态 */
export function getWearableStatusFilterOptions(
  type: '血氧' | '心率',
  records: Array<{ level?: string }>,
): string[] {
  const defaults = type === '血氧' ? OXYGEN_STATUS_OPTIONS : HEART_RATE_STATUS_OPTIONS;
  const seen = new Set<string>(defaults);
  const extras: string[] = [];

  records.forEach(record => {
    const level = record.level?.trim();
    if (!level || seen.has(level)) return;
    seen.add(level);
    extras.push(level);
  });

  return [WEARABLE_STATUS_FILTER_ALL, ...defaults, ...sortStatusLabels(extras)];
}

export function buildWearableStatusFilterPickerData(
  type: '血氧' | '心率',
  records: Array<{ level?: string }>,
) {
  return getWearableStatusFilterOptions(type, records).map(option => ({
    label: option,
    value: option,
  }));
}

export function filterWearableRecordsByStatus<T extends { level?: string }>(
  records: T[],
  status: string,
): T[] {
  if (!status || status === WEARABLE_STATUS_FILTER_ALL) return records;
  return records.filter(record => record.level?.trim() === status);
}
