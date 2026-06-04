import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildCategoryAxisLabel } from './chartAxis';

export type BloodOxygenPoint = { hour: string; value: number };

const HOUR_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, BarChart, GridComponent]);

type Props = {
  data?: BloodOxygenPoint[];
};

function buildOption(points: BloodOxygenPoint[]) {
  const labels = points.map(p => p.hour);
  const values = points.map(p => p.value);

  return {
    animation: false,
    grid: {
      top: 4,
      right: 0,
      bottom: 0,
      left: 0,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: buildCategoryAxisLabel(labels),
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 100,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 8,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00C950' },
            { offset: 1, color: 'rgba(0,201,80,0.35)' },
          ]),
          borderRadius: [2, 2, 0, 0],
        },
      },
    ],
  };
}

export default function BloodOxygenChart({ data }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [
    { hour: '01:00', value: 97 },
    { hour: '07:00', value: 98 },
    { hour: '12:00', value: 99 },
    { hour: '18:00', value: 98 },
    { hour: '24:00', value: 98 },
  ];

  const option = useMemo(() => buildOption(points), [points]);

  useEffect(() => {
    let chart: ReturnType<typeof echarts.init> | undefined;
    const frame = requestAnimationFrame(() => {
      if (!skiaRef.current) return;

      chart = echarts.init(skiaRef.current, 'light', {
        renderer: 'skia' as 'canvas',
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
      });
      chart.setOption(option);
    });

    return () => {
      cancelAnimationFrame(frame);
      chart?.dispose();
    };
  }, [option]);

  return (
    <View style={styles.container}>
      <SkiaChart ref={skiaRef} style={styles.chart} handleGesture={false} />
    </View>
  );
}

export { HOUR_LABELS };
