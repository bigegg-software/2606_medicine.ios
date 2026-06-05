import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';

export type SleepPieSegment = { name: string; value: number; color: string };

export const CHART_SIZE = 72;

echarts.use([SkiaRenderer, PieChart]);

type Props = {
  data?: SleepPieSegment[];
};

function buildOption(segments: SleepPieSegment[]) {
  const data = segments.filter(item => item.value > 0);

  return {
    animation: false,
    series: [
      {
        type: 'pie',
        radius: ['58%', '88%'],
        center: ['50%', '50%'],
        label: { show: false },
        labelLine: { show: false },
        silent: true,
        data: data.length
          ? data.map(item => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: item.color },
            }))
          : [{ name: '暂无', value: 1, itemStyle: { color: '#E8EEF5' } }],
      },
    ],
  };
}

export default function SleepPieChart({ data = [] }: Props) {
  const skiaRef = useRef<any>(null);
  const option = useMemo(() => buildOption(data), [data]);

  useEffect(() => {
    let chart: ReturnType<typeof echarts.init> | undefined;
    const frame = requestAnimationFrame(() => {
      if (!skiaRef.current) return;

      chart = echarts.init(skiaRef.current, 'light', {
        renderer: 'skia' as 'canvas',
        width: CHART_SIZE,
        height: CHART_SIZE,
      });
      chart.setOption(option);
    });

    return () => {
      cancelAnimationFrame(frame);
      chart?.dispose();
    };
  }, [option]);

  return (
    <View style={{ width: CHART_SIZE, height: CHART_SIZE }}>
      <SkiaChart
        ref={skiaRef}
        style={{ width: CHART_SIZE, height: CHART_SIZE }}
        handleGesture={false}
      />
    </View>
  );
}
