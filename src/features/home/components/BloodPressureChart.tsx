import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';

export type BloodPressurePoint = { high: number; low: number };

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, GridComponent]);

type Props = {
  data?: BloodPressurePoint[];
};

function buildOption(points: BloodPressurePoint[]) {
  const highData = points.map(p => p.high);
  const lowData = points.map(p => p.low);

  return {
    animation: false,
    tooltip: { show: false },
    grid: {
      top: 4,
      right: 0,
      bottom: 0,
      left: 0,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: WEEK_LABELS,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        show: true,
        fontSize: 10,
        color: '#999999',
        margin: 4,
        interval: 0,
      },
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

export default function BloodPressureChart({ data }: Props) {
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

  const option = useMemo(() => buildOption(points), [points]);

  useEffect(() => {
    if (!skiaRef.current) return;

    const chart = echarts.init(skiaRef.current, 'light', {
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
    });
    chart.setOption(option);

    return () => chart.dispose();
  }, [option]);

  return (
    <View style={styles.container}>
      <SkiaChart ref={skiaRef} style={styles.chart} handleGesture={false} />
    </View>
  );
}
