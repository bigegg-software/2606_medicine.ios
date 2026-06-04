import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildCategoryAxisLabel } from './chartAxis';

export type BloodPressurePoint = { high: number; low: number };

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, GridComponent]);

type Props = {
  data?: BloodPressurePoint[];
  labels?: string[];
};

function buildOption(points: BloodPressurePoint[], labels: string[]) {
  const highData = points.map(p => p.high);
  const lowData = points.map(p => p.low);

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
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        name: 'low',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: lowData,
        lineStyle: { color: '#06BDFF', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#06BDFF' },
            { offset: 1, color: 'rgba(6,189,255,0)' },
          ]),
        },
      },
      {
        name: 'high',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: highData,
        lineStyle: { color: '#FF8B07', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#FF8B07' },
            { offset: 1, color: 'rgba(255,139,7,0)' },
          ]),
        },
      },
    ],
  };
}

export default function BloodPressureChart({ data, labels }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [
    { high: 142, low: 92 },
    { high: 138, low: 88 },
    { high: 145, low: 94 },
    { high: 140, low: 90 },
    { high: 136, low: 86 },
    { high: 143, low: 91 },
    { high: 142, low: 92 },
  ];
  const xLabels = labels ?? WEEK_LABELS.slice(0, points.length);

  const option = useMemo(() => buildOption(points, xLabels), [points, xLabels]);

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
