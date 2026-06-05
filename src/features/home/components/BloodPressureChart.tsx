import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildChartXAxis, toBloodPressureSeriesData } from './chartAxis';

export type BloodPressurePoint = { high: number; low: number; hour?: string; x?: number };

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

echarts.use([SkiaRenderer, LineChart, GridComponent, TooltipComponent]);

type Props = {
  data?: BloodPressurePoint[];
  labels?: string[];
};

function buildOption(points: BloodPressurePoint[], labels: string[]) {
  const { chartPoints, high: highData, low: lowData } = toBloodPressureSeriesData(points);

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
      bottom: 0,
      left: 0,
    },
    xAxis: buildChartXAxis(points, labels, false),
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
      <SkiaChart ref={skiaRef} style={styles.chart} />
    </View>
  );
}
