import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildChartXAxis, buildIsolatedLineScatterData, toChartValuePairs, type LineChartSeriesItem } from './chartAxis';

export type BloodGlucosePoint = { hour: string; value: number; x?: number };

const HOUR_LABELS = ['01:00', '07:00', '12:00', '18:00', '24:00'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;
const GLUCOSE_COLOR = '#06BDFF';

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
  data?: BloodGlucosePoint[];
  labels?: string[];
};

function buildOption(points: BloodGlucosePoint[], labels: string[]) {
  const values = toChartValuePairs(points) as LineChartSeriesItem[];
  const scatterData = buildIsolatedLineScatterData(values);

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
    xAxis: buildChartXAxis(points, labels, false),
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
        type: 'line',
        smooth: true,
        connectNulls: false,
        showSymbol: false,
        data: values,
        lineStyle: { color: GLUCOSE_COLOR, width: 2 },
        itemStyle: { color: GLUCOSE_COLOR },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: GLUCOSE_COLOR },
            { offset: 1, color: 'rgba(6,189,255,0)' },
          ]),
        },
      },
      {
        type: 'scatter',
        data: scatterData,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: GLUCOSE_COLOR },
        z: 10,
      },
    ],
  };
}

export default function BloodGlucoseChart({ data, labels }: Props) {
  const skiaRef = useRef<any>(null);
  const points = data ?? [
    { hour: '01:00', value: 5.2 },
    { hour: '07:00', value: 6.1 },
    { hour: '12:00', value: 7.2 },
    { hour: '18:00', value: 6.8 },
    { hour: '24:00', value: 5.9 },
  ];
  const xLabels = labels ?? HOUR_LABELS.slice(0, points.length);

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
      <SkiaChart ref={skiaRef} style={styles.chart} />
    </View>
  );
}

export { HOUR_LABELS };
