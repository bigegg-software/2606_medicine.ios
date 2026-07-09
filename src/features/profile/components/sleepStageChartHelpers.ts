import moment from 'moment';
import type { WearableDataItem, WearableOriginalReading } from '@/api/wearableData';

export type SleepStageType = 'AWAKE' | 'REM' | 'CORE' | 'DEEP';

export type SleepStageTimelineSegment = {
  stage: SleepStageType;
  startMs: number;
  endMs: number;
  color: string;
  name: string;
  band: number;
};

export const SLEEP_STAGE_CHART_CONFIG: Array<{
  stage: SleepStageType;
  name: string;
  color: string;
  band: number;
  fieldKey: 'awakeSleepTime' | 'remSleepTime' | 'coreSleepTime' | 'deepSleepTime';
  stages: string[];
}> = [
  { stage: 'AWAKE', name: '清醒', color: '#CFC9FF', band: 0, fieldKey: 'awakeSleepTime', stages: ['AWAKE'] },
  { stage: 'REM', name: '快速眼动', color: '#c4b5fd', band: 1, fieldKey: 'remSleepTime', stages: ['REM'] },
  { stage: 'CORE', name: '核心睡眠', color: '#8f85f5', band: 2, fieldKey: 'coreSleepTime', stages: ['CORE', 'LIGHT', 'ASLEEP'] },
  { stage: 'DEEP', name: '深度睡眠', color: '#542fc8', band: 3, fieldKey: 'deepSleepTime', stages: ['DEEP'] },
];

function parseMeasureNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function flattenWearableOriginalData(item: WearableDataItem): WearableOriginalReading[] {
  const data = item.originalData;
  if (!data?.length) return [];
  if (Array.isArray(data[0])) {
    return (data as WearableOriginalReading[][]).flat();
  }
  return data as WearableOriginalReading[];
}

function readingDurationMinutes(reading: WearableOriginalReading) {
  const start = reading.startDate ? moment(reading.startDate) : null;
  const end = reading.endDate ? moment(reading.endDate) : null;
  if (!start?.isValid() || !end?.isValid()) return 0;
  return Math.max(0, end.diff(start, 'minutes'));
}

function normalizeSleepStage(value?: string | number) {
  const stage = String(value ?? '').toUpperCase();
  if (stage === 'AWAKE' || stage === 'INBED') return 'AWAKE' as const;
  if (stage === 'REM') return 'REM' as const;
  if (stage === 'CORE' || stage === 'LIGHT' || stage === 'ASLEEP') return 'CORE' as const;
  if (stage === 'DEEP') return 'DEEP' as const;
  return null;
}

function getStageConfig(stage: SleepStageType) {
  return SLEEP_STAGE_CHART_CONFIG.find(item => item.stage === stage);
}

function parseSleepStageMinutes(
  item: WearableDataItem | undefined,
  fieldKey: (typeof SLEEP_STAGE_CHART_CONFIG)[number]['fieldKey'],
) {
  const fromField = parseMeasureNumber(item?.[fieldKey]);
  if (fromField != null && fromField > 0) return fromField;

  if (!item) return null;
  const stageConfig = SLEEP_STAGE_CHART_CONFIG.find(stage => stage.fieldKey === fieldKey);
  if (!stageConfig) return null;

  let total = 0;
  for (const reading of flattenWearableOriginalData(item)) {
    const stage = String(reading.value ?? '').toUpperCase();
    if (!stageConfig.stages.includes(stage)) continue;
    const minutes = readingDurationMinutes(reading);
    if (minutes > 0) total += minutes;
  }

  return total > 0 ? Math.round(total) : null;
}

function buildSleepStageTimelineFromOriginalData(item: WearableDataItem) {
  const segments = flattenWearableOriginalData(item)
    .map(reading => {
      const stage = normalizeSleepStage(reading.value);
      if (!stage) return null;

      const start = reading.startDate ? moment(reading.startDate) : null;
      const end = reading.endDate ? moment(reading.endDate) : null;
      if (!start?.isValid() || !end?.isValid()) return null;

      const config = getStageConfig(stage);
      if (!config) return null;

      return {
        stage,
        startMs: start.valueOf(),
        endMs: end.valueOf(),
        color: config.color,
        name: config.name,
        band: config.band,
      };
    })
    .filter((segment): segment is SleepStageTimelineSegment => segment != null)
    .sort((a, b) => a.startMs - b.startMs);

  return segments;
}

function buildSleepStageTimelineFallback(item?: WearableDataItem) {
  let cursor = 0;
  const segments: SleepStageTimelineSegment[] = [];

  SLEEP_STAGE_CHART_CONFIG.forEach(config => {
    const minutes = parseSleepStageMinutes(item, config.fieldKey) ?? 0;
    if (minutes <= 0) return;

    const durationMs = minutes * 60 * 1000;
    segments.push({
      stage: config.stage,
      startMs: cursor,
      endMs: cursor + durationMs,
      color: config.color,
      name: config.name,
      band: config.band,
    });
    cursor += durationMs;
  });

  return segments;
}

export function buildSleepStageTimeline(item?: WearableDataItem): SleepStageTimelineSegment[] {
  if (!item) return [];

  const timeline = buildSleepStageTimelineFromOriginalData(item);
  if (timeline.length) return timeline;

  return buildSleepStageTimelineFallback(item);
}
