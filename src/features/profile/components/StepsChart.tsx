import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/home/bloodPressureChart';
import { buildCategoryAxisLabel } from './chartAxis';

export type StepsBarPoint = { label: string; value: number };

export const CHART_WIDTH = 172;
export const CHART_HEIGHT = 60;

const BAR_COLOR = '#EE9C44';

echarts.use([SkiaRenderer, BarChart, GridComponent, TooltipComponent]);

type Props = {
  data?: StepsBarPoint[];
  hideXAxis?: boolean;
  metricLabel?: string;
  valueUnit?: string;
};

function buildOption(
  points: StepsBarPoint[],
  hideXAxis = false,
  metricLabel = '步数',
  valueUnit = '步',
) {
  const labels = points.map(point => point.label);
  const values = points.map(point => ({
    value: point.value,
    name: point.label,
  }));

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
        return `${title}\n${metricLabel} ${value}${valueUnit}`;
      },
    },
    grid: {
      top: 4,
      right: 0,
      bottom: 0,
      left: 0,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: hideXAxis ? { show: false } : buildCategoryAxisLabel(labels),
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
        type: 'bar',
        data: values,
        barWidth: labels.length > 20 ? 3 : labels.length > 7 ? 6 : 8,
        itemStyle: {
          color: BAR_COLOR,
          borderRadius: [2, 2, 0, 0],
        },
      },
    ],
  };
}

export default function StepsChart({
  data = [],
  hideXAxis,
  metricLabel = '步数',
  valueUnit = '步',
}: Props) {
  const skiaRef = useRef<any>(null);
  const option = useMemo(
    () => buildOption(data, hideXAxis, metricLabel, valueUnit),
    [data, hideXAxis, metricLabel, valueUnit],
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
    <View style={styles.container}>
      <SkiaChart ref={skiaRef} style={styles.chart} />
    </View>
  );
}
