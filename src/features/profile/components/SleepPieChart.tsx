import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';

export type SleepPieSegment = { name: string; value: number; color: string };

export const CHART_SIZE = 72;
const DEFAULT_RING_WIDTH = 12;
const CENTER_FILL_COLOR = '#FEFFFF';

echarts.use([SkiaRenderer, PieChart]);

type Props = {
  data?: SleepPieSegment[];
  size?: number;
  ringWidth?: number;
  /** 是否填充环心白色底 */
  showCenterLabel?: boolean;
};

function getRingRadius(chartSize: number, ringWidth: number) {
  const outer = chartSize / 2;
  const inner = Math.max(0, outer - ringWidth);
  return [inner, outer] as [number, number];
}

function buildOption(
  segments: SleepPieSegment[],
  chartSize: number,
  ringWidth: number,
  showCenterLabel: boolean,
) {
  const data = segments.filter(item => item.value > 0);
  const [innerRadius, outerRadius] = getRingRadius(chartSize, ringWidth);
  const series: Array<Record<string, unknown>> = [];

  if (showCenterLabel && innerRadius > 0) {
    series.push({
      type: 'pie',
      radius: [0, innerRadius],
      center: ['50%', '50%'],
      label: { show: false },
      labelLine: { show: false },
      silent: true,
      z: 1,
      data: [{ value: 1, itemStyle: { color: CENTER_FILL_COLOR } }],
    });
  }

  series.push({
    type: 'pie',
    radius: [innerRadius, outerRadius],
    center: ['50%', '50%'],
    label: { show: false },
    labelLine: { show: false },
    silent: true,
    z: 2,
    data: data.length
      ? data.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color },
        }))
      : [{ name: '暂无', value: 1, itemStyle: { color: '#E8EEF5' } }],
  });

  return {
    animation: false,
    series,
  };
}

export default function SleepPieChart({
  data = [],
  size = CHART_SIZE,
  ringWidth = DEFAULT_RING_WIDTH,
  showCenterLabel = false,
}: Props) {
  const skiaRef = useRef<any>(null);
  const option = useMemo(
    () => buildOption(data, size, ringWidth, showCenterLabel),
    [data, ringWidth, showCenterLabel, size],
  );

  useEffect(() => {
    let chart: ReturnType<typeof echarts.init> | undefined;
    const frame = requestAnimationFrame(() => {
      if (!skiaRef.current) return;

      chart = echarts.init(skiaRef.current, 'light', {
        renderer: 'skia' as 'canvas',
        width: size,
        height: size,
      });
      chart.setOption(option);
    });

    return () => {
      cancelAnimationFrame(frame);
      chart?.dispose();
    };
  }, [option, size]);

  return (
    <View style={{ width: size, height: size }}>
      <SkiaChart
        ref={skiaRef}
        style={{ width: size, height: size }}
        handleGesture={false}
      />
    </View>
  );
}
