import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { getBloodLipidTcPointColor } from '@/src/features/profile/vitals/vitalsHelpers';
import { buildChartXAxis, hasTodayChartX } from './chartAxis';

export type BloodLipidPoint = { hour: string; value: number; x?: number };

export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

const POINT_SHADOW = {
  shadowBlur: 3,
  shadowColor: 'rgba(0,0,0,0.2)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

echarts.use([SkiaRenderer, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
  data?: BloodLipidPoint[];
  labels?: string[];
  hideXAxis?: boolean;
};

function getPointStyle(value: number) {
  return {
    color: getBloodLipidTcPointColor(value),
    borderColor: '#FFFFFF',
    borderWidth: 1,
    ...POINT_SHADOW,
  };
}

function buildScatterData(points: BloodLipidPoint[]) {
  if (hasTodayChartX(points)) {
    return points
      .filter(point => point.x != null && point.value > 0)
      .sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
      .map(point => ({
        value: [point.x as number, point.value] as [number, number],
        name: point.hour,
        symbolSize: 6,
        itemStyle: getPointStyle(point.value),
      }));
  }

  return points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.value > 0)
    .map(({ point, index }) => ({
      value: [index, point.value] as [number, number],
      name: point.hour,
      symbolSize: 6,
      itemStyle: getPointStyle(point.value),
    }));
}

function buildBloodLipidAxisRange(values: number[]) {
  if (!values.length) {
    return { min: 3, max: 7 };
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const spread = maxVal - minVal;
  const padding = Math.max(0.4, spread * 0.25);

  return {
    min: Math.floor((minVal - padding) * 10) / 10,
    max: Math.ceil((maxVal + padding) * 10) / 10,
  };
}

function buildOption(points: BloodLipidPoint[], categoryLabels: string[], hideXAxis = false) {
  const scatterData = buildScatterData(points);
  const validValues = scatterData.map(item => Number(item.value[1]));
  const { min, max } = buildBloodLipidAxisRange(validValues);
  const xAxis = buildChartXAxis(points, categoryLabels);

  return {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'click',
      confine: true,
      backgroundColor: 'rgba(51,51,51,0.9)',
      borderWidth: 0,
      padding: [4, 8],
      textStyle: { color: '#fff', fontSize: 10, lineHeight: 14 },
      formatter: (param: any) => {
        const title = param?.data?.name || param?.name || '';
        const raw = param?.data?.value ?? param?.value;
        const value = Array.isArray(raw) ? raw[1] : raw;
        if (value == null || value === '') return title;
        return `${title}\nTC ${Number(value).toFixed(2)} mmol/L`;
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
        type: 'scatter',
        data: scatterData,
        symbol: 'circle',
        z: 10,
      },
    ],
  };
}

export default function BloodLipidChart({ data, labels, hideXAxis }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [];
  const categoryLabels =
    labels ??
    (hasTodayChartX(points) ? [] : points.map(point => point.hour ?? '').filter(Boolean));
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
      <View style={styles.highlightBar} pointerEvents="none" />
      <SkiaChart ref={skiaRef} style={styles.chart} />
    </View>
  );
}
