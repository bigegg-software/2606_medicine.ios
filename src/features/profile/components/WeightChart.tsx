import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildChartXAxis, toChartValuePairs } from './chartAxis';

export type WeightPoint = { hour: string; value: number; x?: number };

export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, GridComponent, TooltipComponent]);

type Props = {
  data?: WeightPoint[];
  hideXAxis?: boolean;
};

function buildWeightAxisRange(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value != null && value > 0);
  if (!valid.length) {
    return { min: 50, max: 80 };
  }

  const minVal = Math.min(...valid);
  const maxVal = Math.max(...valid);
  const padding = Math.max(2, (maxVal - minVal) * 0.2 || 2);

  return {
    min: Math.floor(minVal - padding),
    max: Math.ceil(maxVal + padding),
  };
}

function buildOption(points: WeightPoint[], hideXAxis = false) {
  const chartValues = toChartValuePairs(points);
  const validValues = points.filter(point => point.value > 0).map(point => point.value);
  const validCount = validValues.length;
  const { min, max } = buildWeightAxisRange(validValues);
  const xAxis = buildChartXAxis(points, [], false);

  return {
    animation: false,
    backgroundColor: 'transparent',
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
        return `${title}\n体重 ${value}kg`;
      },
    },
    grid: {
      top: 4,
      right: 0,
      bottom: 0,
      left: 0,
    },
    xAxis: hideXAxis
      ? { ...xAxis, axisLabel: { show: false } }
      : xAxis,
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
        showSymbol: validCount > 0 && validCount <= 8,
        symbol: 'circle',
        symbolSize: 5,
        data: chartValues,
        lineStyle: { color: '#6D925E', width: 2 },
        itemStyle: { color: '#6D925E' },
      },
    ],
  };
}

export default function WeightChart({ data, hideXAxis }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [];

  const option = useMemo(() => buildOption(points, hideXAxis), [points, hideXAxis]);

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
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.highlightBarWeight} pointerEvents="none" />
      <SkiaChart ref={skiaRef} style={styles.chart} />
    </View>
  );
}
