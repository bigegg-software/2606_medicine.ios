export const SPEECH_SPEED_OPTIONS = [
  { key: 'slow', label: '慢' },
  { key: 'normal', label: '正常' },
  { key: 'fast', label: '快' },
] as const;

export type SpeechSpeed = (typeof SPEECH_SPEED_OPTIONS)[number]['key'];

export const SYNC_RANGE_OPTIONS = [
  { key: '7d', label: '最近7天' },
  { key: '1m', label: '最近1个月' },
  { key: '2m', label: '最近2个月' },
  { key: '3m', label: '最近3个月' },
] as const;

export type SyncRange = (typeof SYNC_RANGE_OPTIONS)[number]['key'];

export const SYNC_RANGE_DAYS: Record<SyncRange, number> = {
  '7d': 7,
  '1m': 30,
  '2m': 60,
  '3m': 90,
};

export function syncRangeFromDays(days?: number): SyncRange {
  if (days == null) return '7d';
  const matched = (Object.entries(SYNC_RANGE_DAYS) as [SyncRange, number][]).find(
    ([, value]) => value === days,
  );
  return matched?.[0] ?? '7d';
}

export function formatSyncRangeLabel(days?: number, autoSyncData?: number): string {
  const range = syncRangeFromDays(days);
  const label = SYNC_RANGE_OPTIONS.find(item => item.key === range)?.label ?? '最近7天';
  const daysText = label.replace('最近', '');
  if (autoSyncData === 0) return `手动同步・${daysText}`;
  return `自动同步・${daysText}`;
}
