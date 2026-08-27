import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { SleepStageTimelineSegment } from '@/src/features/profile/components/sleepStageChartHelpers';

/** 首页摘要卡片迷你睡眠阶段图（对齐 VitalsPage SleepStageChart） */
export const MINI_SLEEP_STAGE_WIDTH = 72;
export const MINI_SLEEP_STAGE_HEIGHT = 30;

const BAND_COUNT = 4;
const BAND_GAP = 1;
const CONNECTOR_WIDTH = 1;

type Props = {
  data?: SleepStageTimelineSegment[];
  width?: number;
  height?: number;
};

function mergeAdjacentStages(segments: SleepStageTimelineSegment[]) {
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

function buildChartItems(
  segments: SleepStageTimelineSegment[],
  width: number,
  height: number,
) {
  const bandHeight = (height - BAND_GAP * (BAND_COUNT - 1)) / BAND_COUNT;
  if (!segments.length) {
    return {
      bars: [] as Array<{ key: string; left: number; top: number; width: number; color: string }>,
      connectors: [] as Array<{ key: string; left: number; top: number; height: number; color: string }>,
      bandHeight,
    };
  }

  const getBandTop = (band: number) => band * (bandHeight + BAND_GAP);
  const minStart = segments[0]!.startMs;
  const maxEnd = Math.max(...segments.map(segment => segment.endMs));
  const total = maxEnd - minStart || 1;
  const bars: Array<{ key: string; left: number; top: number; width: number; color: string }> = [];
  const connectors: Array<{ key: string; left: number; top: number; height: number; color: string }> = [];

  segments.forEach((segment, index) => {
    const left = ((segment.startMs - minStart) / total) * width;
    const right = ((segment.endMs - minStart) / total) * width;
    const barWidth = Math.max(right - left, 1);
    const top = getBandTop(segment.band);

    bars.push({
      key: `bar-${segment.stage}-${segment.startMs}`,
      left,
      top,
      width: barWidth,
      color: segment.color,
    });

    const next = segments[index + 1];
    if (!next || next.band === segment.band) return;

    const nextTop = getBandTop(next.band);
    const currentBottom = top + bandHeight;
    const nextBottom = nextTop + bandHeight;
    connectors.push({
      key: `connector-${index}-${segment.endMs}`,
      left: right - CONNECTOR_WIDTH / 2,
      top: Math.min(top, nextTop),
      height: Math.max(currentBottom, nextBottom) - Math.min(top, nextTop),
      color: next.color,
    });
  });

  return { bars, connectors, bandHeight };
}

export default function MiniSleepStageChart({
  data = [],
  width = MINI_SLEEP_STAGE_WIDTH,
  height = MINI_SLEEP_STAGE_HEIGHT,
}: Props) {
  const segments = useMemo(() => mergeAdjacentStages(data), [data]);
  const { bars, connectors, bandHeight } = useMemo(
    () => buildChartItems(segments, width, height),
    [height, segments, width],
  );

  if (!segments.length) {
    return <View style={[styles.empty, { width, height }]} />;
  }

  return (
    <View style={{ width, height, position: 'relative' }}>
      {connectors.map(item => (
        <View
          key={item.key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: item.left,
            top: item.top,
            width: CONNECTOR_WIDTH,
            height: item.height,
            backgroundColor: item.color,
          }}
        />
      ))}
      {bars.map(item => (
        <View
          key={item.key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: item.left,
            top: item.top,
            width: item.width,
            height: bandHeight,
            backgroundColor: item.color,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: '#F5F8FB',
    borderRadius: 4,
  },
});
