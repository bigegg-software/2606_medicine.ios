import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildChartXAxis, toChartValuePairs } from './chartAxis';

export type HeartRatePoint = { hour: string; value: number; x?: number };

const HOUR_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, GridComponent, TooltipComponent]);

type Props = {
  data?: HeartRatePoint[];
};

function buildOption(points: HeartRatePoint[]) {
  const values = toChartValuePairs(points);
  const validValues = points.filter(point => point.value > 0).map(point => point.value);
  let yMin: number | undefined;
  let yMax: number | undefined;
  if (validValues.length) {
    yMin = Math.max(40, Math.min(...validValues) - 10);
    yMax = Math.min(200, Math.max(...validValues) + 10);
  }

  return {
    animation: false,
    tooltip: {
      trigger: 'axis',
      triggerOn: 'click',
      confine: true,
      backgroundColor: 'rgba(51,51,51,0.9)',
      borderWidth: 0,
      padding: [4, 8],
      textStyle: { color: '#fff', fontSize: 10, lineHeight: 14 },
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params;
        const title = item?.data?.name || item?.name || item?.axisValueLabel || '';
        const raw = item?.data?.value ?? item?.value;
        const value = Array.isArray(raw) ? raw[1] : raw;
        if (value == null || value === '') return title;
        return `${title}\n心率 ${value}次/分钟`;
      },
    },
    grid: {
      top: 4,
      right: 0,
      bottom: 0,
      left: 0,
    },
    xAxis: buildChartXAxis(points, [], false),
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
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
        connectNulls: true,
        showSymbol: validValues.length > 0 && validValues.length <= 8,
        symbol: 'circle',
        symbolSize: 5,
        data: values,
        lineStyle: { color: '#FF2056', width: 2 },
        itemStyle: { color: '#FF2056' },
      },
    ],
  };
}

export default function HeartRateChart({ data }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [
    { hour: '01:00', value: 68 },
    { hour: '07:00', value: 72 },
    { hour: '12:00', value: 75 },
    { hour: '18:00', value: 70 },
    { hour: '24:00', value: 72 },
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
      <SkiaChart ref={skiaRef} style={styles.chart} />
    </View>
  );
}

export { HOUR_LABELS };
