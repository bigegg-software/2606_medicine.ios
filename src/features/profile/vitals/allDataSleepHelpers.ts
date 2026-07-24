import moment from 'moment';
import type { WearableDataItem } from '@/api/wearableData';
import type { SleepPieSegment } from '@/src/features/profile/components/SleepPieChart';
import {
  formatSleepDuration,
  getSleepDurationMinutes,
  getSleepQuality,
  SLEEP_STAGE_CONFIG,
  buildSleepPieSegments,
} from './vitalsHelpers';
import { buildSleepScoreSummary } from './detail/helpers/sleep';

const ALL_DATA_SLEEP_STAGE_ROWS = [
  { key: 'awakeSleepTime', label: '清醒', color: '#CFC9FF' },
  { key: 'remSleepTime', label: '快速眼动', color: '#C4B5FD' },
  { key: 'coreSleepTime', label: '浅睡', color: '#8F85F5' },
  { key: 'deepSleepTime', label: '深睡', color: '#5430C8' },
] as const;

function parseClockHm(value?: string) {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = moment(normalized);
  return parsed.isValid() ? parsed.format('HH:mm') : null;
}

function formatSleepTimeRange(item?: WearableDataItem) {
  const bed = parseClockHm(item?.bedTimeStr ?? item?.startTimeStr);
  const wake = parseClockHm(item?.wakeUpTimeStr ?? item?.endTimeStr);
  if (bed && wake) return `${bed}-${wake}`;
  if (bed) return bed;
  if (wake) return wake;
  return '--';
}

export type AllDataSleepStageRow = {
  key: string;
  label: string;
  color: string;
  duration: string;
  percent: number;
};

export type AllDataSleepCardData = {
  timeRange: string;
  duration: string;
  scoreText: string;
  statusLabel: string;
  statusColor: string;
  stages: AllDataSleepStageRow[];
  pieSegments: SleepPieSegment[];
};

function formatSleepStageDuration(minutes: number) {
  if (minutes <= 0) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分`;
}

export function buildAllDataSleepCardData(item?: WearableDataItem): AllDataSleepCardData | null {
  if (!item) return null;

  const durationMinutes = getSleepDurationMinutes(item);
  if (durationMinutes == null || durationMinutes <= 0) return null;

  const segments = buildSleepPieSegments(item);
  const minutesByKey = new Map(
    SLEEP_STAGE_CONFIG.map((stage, index) => [stage.key, segments[index]?.value ?? 0]),
  );
  const stageTotalMinutes = ALL_DATA_SLEEP_STAGE_ROWS.reduce(
    (sum, row) => sum + (minutesByKey.get(row.key) ?? 0),
    0,
  );

  const quality = getSleepQuality(item);
  const scoreSummary = buildSleepScoreSummary(item);
  const colorByKey = new Map(ALL_DATA_SLEEP_STAGE_ROWS.map(row => [row.key, row.color]));

  return {
    timeRange: formatSleepTimeRange(item),
    duration: formatSleepDuration(durationMinutes),
    scoreText: scoreSummary.scoreText,
    statusLabel: quality.label ? `状态${quality.label}` : '--',
    statusColor: quality.color,
    pieSegments: segments.map((segment, index) => {
      const stageKey = SLEEP_STAGE_CONFIG[index]?.key;
      return {
        ...segment,
        color: (stageKey && colorByKey.get(stageKey)) || segment.color,
      };
    }),
    stages: ALL_DATA_SLEEP_STAGE_ROWS.map(row => {
      const minutes = minutesByKey.get(row.key) ?? 0;
      return {
        key: row.key,
        label: row.label,
        color: row.color,
        duration: formatSleepStageDuration(minutes),
        percent: stageTotalMinutes > 0 ? Math.round((minutes / stageTotalMinutes) * 100) : 0,
      };
    }),
  };
}
