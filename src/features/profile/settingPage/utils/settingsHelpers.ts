export const SPEECH_SPEED_OPTIONS = [
  { key: 'slow', label: '慢', rate: 0.5, rateLabel: '0.5' },
  { key: 'normal', label: '正常', rate: 1.0, rateLabel: '1.0' },
  { key: 'fast', label: '快', rate: 1.5, rateLabel: '1.5' },
] as const;

export type SpeechSpeed = (typeof SPEECH_SPEED_OPTIONS)[number]['key'];

export const SPEECH_SPEED_MIN = 0.5;
export const SPEECH_SPEED_MAX = 1.5;
export const SPEECH_SPEED_STEP = 0.1;
/** 两大刻度之间的小刻度数量 */
export const SPEECH_SPEED_MINOR_BETWEEN = 4;

export function snapSpeechSpeedRate(rate: number): number {
  const clamped = Math.max(SPEECH_SPEED_MIN, Math.min(SPEECH_SPEED_MAX, rate));
  const steps = Math.round((clamped - SPEECH_SPEED_MIN) / SPEECH_SPEED_STEP);
  return Number((SPEECH_SPEED_MIN + steps * SPEECH_SPEED_STEP).toFixed(1));
}

/** 从 userExtr.voiceSpeed 解析语速，缺省 1.0 */
export function parseVoiceSpeed(voiceSpeed?: number | null): number {
  if (voiceSpeed == null || !Number.isFinite(Number(voiceSpeed))) {
    return SPEECH_SPEED_OPTIONS[1].rate;
  }
  return snapSpeechSpeedRate(Number(voiceSpeed));
}

/** 是否开启语音播报：仅 isVoiceBroadcast === 1 为开（默认关闭） */
export function isVoiceBroadcastOn(isVoiceBroadcast?: number | null): boolean {
  return isVoiceBroadcast === 1;
}

export function getSpeechSpeedTickCount(): number {
  return Math.round((SPEECH_SPEED_MAX - SPEECH_SPEED_MIN) / SPEECH_SPEED_STEP) + 1;
}

export function speechSpeedRateToIndex(rate: number): number {
  const snapped = snapSpeechSpeedRate(rate);
  return Math.round((snapped - SPEECH_SPEED_MIN) / SPEECH_SPEED_STEP);
}

export function speechSpeedIndexToRate(index: number): number {
  const maxIndex = getSpeechSpeedTickCount() - 1;
  const safe = Math.max(0, Math.min(maxIndex, index));
  return Number((SPEECH_SPEED_MIN + safe * SPEECH_SPEED_STEP).toFixed(1));
}

/** 最近的档位标签（慢/正常/快） */
export function nearestSpeechSpeedOption(rate: number) {
  const snapped = snapSpeechSpeedRate(rate);
  let best: (typeof SPEECH_SPEED_OPTIONS)[number] = SPEECH_SPEED_OPTIONS[1];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const item of SPEECH_SPEED_OPTIONS) {
    const dist = Math.abs(item.rate - snapped);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}

/** 个人中心展示：精确命中慢/正常/快时用文案，否则显示数值 */
export function formatVoiceSpeedLabel(voiceSpeed?: number | null): string {
  const rate = parseVoiceSpeed(voiceSpeed);
  const exact = SPEECH_SPEED_OPTIONS.find(item => item.rate === rate);
  return exact?.label ?? rate.toFixed(1);
}

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
