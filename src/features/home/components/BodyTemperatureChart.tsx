import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildCategoryAxisLabel } from './chartAxis';

export type BodyTemperaturePoint = { hour: string; value: number };

const HOUR_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, GridComponent]);

type Props = {
  data?: BodyTemperaturePoint[];
};

function buildTemperatureAxisRange(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value != null && value > 0);
  if (!valid.length) {
    return { min: 36, max: 37.5 };
  }

  const minVal = Math.min(...valid);
  const maxVal = Math.max(...valid);
  const spread = maxVal - minVal;
  const padding = Math.max(0.3, spread * 0.25);

  return {
    min: Math.floor((minVal - padding) * 10) / 10,
    max: Math.ceil((maxVal + padding) * 10) / 10,
  };
}

function buildOption(points: BodyTemperaturePoint[]) {
  const labels = points.map(p => p.hour);
  const values = points.map(p => (p.value > 0 ? p.value : null));
  const validCount = values.filter(value => value != null).length;
  const { min, max } = buildTemperatureAxisRange(values);

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
      boundaryGap: false,
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: buildCategoryAxisLabel(labels),
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min,
      max,
      scale: true,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        connectNulls: false,
        showSymbol: validCount > 0 && validCount <= 3,
        symbol: 'circle',
        symbolSize: 6,
        data: values,
        lineStyle: { color: '#FD9A00', width: 2 },
        itemStyle: { color: '#FD9A00' },
      },
    ],
  };
}

export default function BodyTemperatureChart({ data }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [
    { hour: '01:00', value: 36.3 },
    { hour: '07:00', value: 36.4 },
    { hour: '12:00', value: 36.5 },
    { hour: '18:00', value: 36.6 },
    { hour: '24:00', value: 36.5 },
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
