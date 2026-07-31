/** 日常活动水平（运动水平）选项，与 /patient/userBaseInfo 字段 dailyActivityLevel 一致 */
export const DAILY_ACTIVITY_LEVEL_OPTIONS = [
  { label: '卧床/久坐不动', value: '1.1' },
  { label: '可行走/低活动量', value: '1.2' },
  { label: '轻度活动', value: '1.3' },
  { label: '中度活动', value: '1.4' },
  { label: '非常活跃活动', value: '1.5' },
] as const;

export type DailyActivityLevelValue = (typeof DAILY_ACTIVITY_LEVEL_OPTIONS)[number]['value'];

export const DAILY_ACTIVITY_LEVEL_PICKER_DATA = DAILY_ACTIVITY_LEVEL_OPTIONS.map(item => ({
  label: item.label,
  value: item.value,
}));

export function resolveDailyActivityLevelLabel(value?: string | null): string {
  if (!value) return '';
  const found = DAILY_ACTIVITY_LEVEL_OPTIONS.find(item => item.value === value);
  return found?.label ?? value;
}
