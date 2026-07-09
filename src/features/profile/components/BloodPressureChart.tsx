import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import {
  buildChartXAxis,
  buildLineScatterData,
  toBloodPressureSeriesData,
} from './chartAxis';

export type BloodPressurePoint = { high: number; low: number; hour?: string; x?: number };

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const HIGH_COLOR = '#EE9C44';
const LOW_COLOR = '#6D925E';
const POINT_SHADOW = {
  shadowBlur: 3,
  shadowColor: 'rgba(0,0,0,0.2)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};
const HIGH_POINT_STYLE = {
  color: HIGH_COLOR,
  borderColor: '#FFFFFF',
  borderWidth: 1,
  ...POINT_SHADOW,
};
const LOW_POINT_STYLE = {
  color: LOW_COLOR,
  borderColor: '#FFFFFF',
  borderWidth: 1,
  ...POINT_SHADOW,
};
const LOW_AREA_STYLE = {
  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: LOW_COLOR },
    { offset: 1, color: 'rgba(109,146,94,0)' },
  ]),
};
const HIGH_AREA_STYLE = {
  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: HIGH_COLOR },
    { offset: 1, color: 'rgba(238,156,68,0)' },
  ]),
};
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
  data?: BloodPressurePoint[];
  labels?: string[];
  hideXAxis?: boolean;
};

function buildOption(points: BloodPressurePoint[], labels: string[], hideXAxis = false) {
  const { chartPoints, high: highData, low: lowData } = toBloodPressureSeriesData(points);
  const highScatter = buildLineScatterData(highData);
  const lowScatter = buildLineScatterData(lowData);
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
        const items = Array.isArray(params) ? params : [params];
        const dataIndex = items[0]?.dataIndex;
        const point = dataIndex != null ? chartPoints[dataIndex] : undefined;
        const title = point?.hour || items[0]?.name || items[0]?.axisValueLabel || '';
        if (point && point.high > 0 && point.low > 0) {
          return `${title}\n血压 ${point.high}/${point.low}`;
        }
        if (point && point.high > 0) return `${title}\n血压 ${point.high}`;
        if (point && point.low > 0) return `${title}\n血压 ${point.low}`;
        return title;
      },
    },
    grid: {
      top: 4,
      right: 0,
      bottom: 4,
      left: 0,
    },
    xAxis: hideXAxis
      ? { ...xAxis, axisLabel: { show: false } }
      : xAxis,
    yAxis: {
      type: 'value',
      scale: true,
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
        connectNulls: false,
        showSymbol: false,
        data: lowData,
        lineStyle: { color: LOW_COLOR, width: 2 },
        itemStyle: { color: LOW_COLOR },
        areaStyle: LOW_AREA_STYLE,
      },
      {
        name: 'high',
        type: 'line',
        smooth: true,
        connectNulls: false,
        showSymbol: false,
        data: highData,
        lineStyle: { color: HIGH_COLOR, width: 2 },
        itemStyle: { color: HIGH_COLOR },
        areaStyle: HIGH_AREA_STYLE,
      },
      {
        name: 'low-scatter',
        type: 'scatter',
        data: lowScatter,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: LOW_POINT_STYLE,
        z: 10,
      },
      {
        name: 'high-scatter',
        type: 'scatter',
        data: highScatter,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: HIGH_POINT_STYLE,
        z: 10,
      },
    ],
  };
}

export default function BloodPressureChart({ data, labels, hideXAxis }: Props) {
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
