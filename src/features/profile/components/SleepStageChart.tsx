import React, { useMemo } from 'react';
import { View } from 'react-native';
import styles from '@/css/home/bloodPressureChart';
import type { SleepStageTimelineSegment } from './sleepStageChartHelpers';

export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

const BAND_COUNT = 4;
const BAND_GAP = 2;
const CHART_INNER_HEIGHT = 40;
const BAND_HEIGHT = (CHART_INNER_HEIGHT - BAND_GAP * (BAND_COUNT - 1)) / BAND_COUNT;
const CONNECTOR_WIDTH = 2;

type Props = {
  data?: SleepStageTimelineSegment[];
};

function getBandTop(band: number) {
  return band * (BAND_HEIGHT + BAND_GAP);
}

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

function msToX(ms: number, minStart: number, total: number) {
  return ((ms - minStart) / total) * CHART_WIDTH;
}

type ConnectorItem = {
  key: string;
  left: number;
  top: number;
  height: number;
  color: string;
};

type BarItem = {
  key: string;
  left: number;
  top: number;
  width: number;
  color: string;
};

function buildChartItems(segments: SleepStageTimelineSegment[]) {
  if (!segments.length) {
    return { bars: [] as BarItem[], connectors: [] as ConnectorItem[] };
  }

  const minStart = segments[0].startMs;
  const maxEnd = Math.max(...segments.map(segment => segment.endMs));
  const total = maxEnd - minStart || 1;
  const bars: BarItem[] = [];
  const connectors: ConnectorItem[] = [];

  segments.forEach((segment, index) => {
    const left = msToX(segment.startMs, minStart, total);
    const right = msToX(segment.endMs, minStart, total);
    const width = Math.max(right - left, 1);
    const top = getBandTop(segment.band);

    bars.push({
      key: `bar-${segment.stage}-${segment.startMs}`,
      left,
      top,
      width,
      color: segment.color,
    });

    const next = segments[index + 1];
    if (!next || next.band === segment.band) return;

    const nextTop = getBandTop(next.band);
    const currentBottom = top + BAND_HEIGHT;
    const nextBottom = nextTop + BAND_HEIGHT;
    const connectorTop = Math.min(top, nextTop);
    const connectorBottom = Math.max(currentBottom, nextBottom);

    connectors.push({
      key: `connector-${index}-${segment.endMs}`,
      left: right - CONNECTOR_WIDTH / 2,
      top: connectorTop,
      height: connectorBottom - connectorTop,
      color: next.color,
    });
  });

  return { bars, connectors };
}

export default function SleepStageChart({ data = [] }: Props) {
  const segments = useMemo(() => mergeAdjacentStages(data), [data]);
  const { bars, connectors } = useMemo(() => buildChartItems(segments), [segments]);

  if (!segments.length) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#F5F8FB',
            borderRadius: 4,
          },
        ]}
      />
    );
  }

  return (
    <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT, justifyContent: 'center' }}>
      <View style={{ width: CHART_WIDTH, height: CHART_INNER_HEIGHT, position: 'relative' }}>
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
              height: BAND_HEIGHT,
              backgroundColor: item.color,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
}
