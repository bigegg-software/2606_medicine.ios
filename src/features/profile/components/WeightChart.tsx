import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildChartXAxis, buildLineScatterData, toChartValuePairs } from './chartAxis';

export type WeightPoint = { hour: string; value: number; x?: number };

export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

const LINE_COLOR = '#6D925E';

const OUTER_POINT_STYLE = {
  color: '#FFFFFF',
  borderColor: '#6D925E',
  borderWidth: 1,
  shadowBlur: 3,
  shadowColor: 'rgba(0,0,0,0.2)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

const INNER_POINT_STYLE = {
  color: '#6D925E',
  borderColor: 'transparent',
  borderWidth: 0,
};

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
  data?: WeightPoint[];
  labels?: string[];
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

function buildOption(points: WeightPoint[], labels: string[], hideXAxis = false) {
  const lineData = toChartValuePairs(points);
  const scatterData = buildLineScatterData(lineData);
  const validValues = points.filter(point => point.value > 0).map(point => point.value);
  const { min, max } = buildWeightAxisRange(validValues);
  const xAxis = buildChartXAxis(points, labels, false);

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
        showSymbol: false,
        data: lineData,
        lineStyle: { color: LINE_COLOR, width: 2 },
        itemStyle: { color: LINE_COLOR },
      },
      {
        type: 'scatter',
        data: scatterData,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: OUTER_POINT_STYLE,
        z: 10,
      },
      {
        type: 'scatter',
        data: scatterData,
        symbol: 'circle',
        symbolSize: 4,
        itemStyle: INNER_POINT_STYLE,
        z: 11,
      },
    ],
  };
}

export default function WeightChart({ data, labels, hideXAxis }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [];
  const categoryLabels =
    labels ??
    points.map(point => point.hour ?? '').filter(Boolean);

  const option = useMemo(
    () => buildOption(points, categoryLabels, hideXAxis),
    [points, categoryLabels, hideXAxis],
  );

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
