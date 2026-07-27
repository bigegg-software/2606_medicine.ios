import type { SleepStageTimelineSegment } from '@/src/features/profile/components/sleepStageChartHelpers';
import { formatSleepDuration } from '@/src/features/profile/vitals/vitalsHelpers';

export type SleepStageSelection = {
  stageLabel: string;
  durationText: string;
  color: string;
};

const STAGE_UI_LABELS = ['清醒', '快速眼动', '浅睡', '深睡'] as const;

export function mergeAdjacentSleepStages(segments: SleepStageTimelineSegment[]) {
  const merged: SleepStageTimelineSegment[] = [];

  segments.forEach(segment => {
    const last = merged[merged.length - 1];
    if (last && last.stage === segment.stage) {
      last.endMs = Math.max(last.endMs, segment.endMs);
      return;
    }
    merged.push({ ...segment });
  });

  return merged;
}

export function findSleepStageAtPlotX(
  segments: SleepStageTimelineSegment[],
  plotX: number,
  plotWidth: number,
): SleepStageTimelineSegment | null {
  if (!segments.length || plotWidth <= 0) return null;

  const minStart = segments[0].startMs;
  const maxEnd = Math.max(...segments.map(segment => segment.endMs));
  const total = maxEnd - minStart || 1;
  const clampedX = Math.max(0, Math.min(plotX, plotWidth));
  const targetMs = minStart + (clampedX / plotWidth) * total;

  const hit = segments.find(
    segment => targetMs >= segment.startMs && targetMs <= segment.endMs,
  );
  if (hit) return hit;

  let nearest: SleepStageTimelineSegment | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  segments.forEach(segment => {
    const distance =
      targetMs < segment.startMs
        ? segment.startMs - targetMs
        : targetMs - segment.endMs;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = segment;
    }
  });

  return nearest;
}

export function formatSleepStageSelection(
  segment: SleepStageTimelineSegment,
): SleepStageSelection {
  const minutes = Math.max(0, Math.round((segment.endMs - segment.startMs) / 60000));
  return {
    stageLabel: STAGE_UI_LABELS[segment.band] ?? segment.name,
    durationText: formatSleepDuration(minutes),
    color: segment.color,
  };
}

export function getSleepStageSliderThumbLeft(
  thumbCenterX: number | null,
  plotLeft: number,
  plotWidth: number,
  thumbWidth: number,
  edgePadding = 0,
) {
  const center = thumbCenterX ?? plotLeft;
  const clampedCenter = Math.max(plotLeft, Math.min(center, plotLeft + plotWidth));
  return clampedCenter + edgePadding - thumbWidth / 2;
}
