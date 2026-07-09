import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import type { GlucoseStatus } from '@/src/features/profile/vitals/vitalsHelpers';
import { buildGlucoseStatus } from '@/src/features/profile/vitals/vitalsHelpers';
import { buildChartXAxis, hasTodayChartX } from './chartAxis';

export type BloodGlucosePoint = {
  hour: string;
  value: number;
  x?: number;
  status?: GlucoseStatus;
  isHigh?: number;
  isLow?: number;
};

const HOUR_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

const GLUCOSE_POINT_COLORS: Record<GlucoseStatus, string> = {
  low: '#0951AE',
  normal: '#6D925E',
  high: '#EE9C44',
};

const POINT_SHADOW = {
  shadowBlur: 3,
  shadowColor: 'rgba(0,0,0,0.2)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

echarts.use([SkiaRenderer, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
  data?: BloodGlucosePoint[];
  labels?: string[];
  hideXAxis?: boolean;
};

function getPointStatus(point: BloodGlucosePoint): GlucoseStatus {
  if (point.status) return point.status;
  if (point.isLow === 1) return 'low';
  if (point.isHigh === 1) return 'high';
  return buildGlucoseStatus(point.value);
}

function getPointStyle(point: BloodGlucosePoint) {
  return {
    color: GLUCOSE_POINT_COLORS[getPointStatus(point)],
    borderColor: '#FFFFFF',
    borderWidth: 1,
    ...POINT_SHADOW,
  };
}

function buildScatterData(points: BloodGlucosePoint[]) {
  if (hasTodayChartX(points)) {
    return points
      .filter(point => point.value > 0 && point.x != null)
      .map(point => ({
        value: [point.x as number, point.value] as [number, number],
        name: point.hour,
        symbolSize: 6,
        itemStyle: getPointStyle(point),
      }));
  }

  return points
    .map(point => {
      if (point.value <= 0) return null;
      return {
        value: point.value,
        name: point.hour,
        symbolSize: 6,
        itemStyle: getPointStyle(point),
      };
    })
    .filter(item => item != null);
}

function buildOption(points: BloodGlucosePoint[], labels: string[], hideXAxis = false) {
  const scatterData = buildScatterData(points);
  const validValues = points.filter(point => point.value > 0).map(point => point.value);
  const xAxis = buildChartXAxis(points, labels, false);

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
        return `${title}\n血糖 ${value}`;
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
      scale: validValues.length > 0,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        symbol: 'circle',
        z: 10,
      },
    ],
  };
}

export default function BloodGlucoseChart({ data, labels, hideXAxis }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [
    { hour: '01:00', value: 5.2, status: 'normal' as const },
    { hour: '07:00', value: 6.1, status: 'high' as const },
    { hour: '12:00', value: 7.2, status: 'high' as const },
    { hour: '18:00', value: 3.5, status: 'low' as const },
    { hour: '24:00', value: 5.9, status: 'normal' as const },
  ];
  const xLabels = labels ?? HOUR_LABELS.slice(0, points.length);

  const option = useMemo(() => buildOption(points, xLabels, hideXAxis), [points, xLabels, hideXAxis]);

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
