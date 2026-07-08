import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, Text, View } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import { Flex } from '@ant-design/react-native';
import type { MealExecutionTrendItem } from '@/api/meal';
import styles from '@/css/medication/mealHistory';
import { formatMealHistoryRate } from '../utils/mealHistoryHelpers';

const CHART_WIDTH = Dimensions.get('window').width - 76;
const CHART_HEIGHT = 168;
const BASELINE = 90;
const MAX_X_LABELS = 7;

const SERIES = [
  { key: 'energyRate' as const, label: '热量', color: '#FF8B07' },
  { key: 'proteinRate' as const, label: '蛋白', color: '#0951AE' },
  { key: 'waterRate' as const, label: '饮水', color: '#34B69F' },
];

echarts.use([SkiaRenderer, LineChart, GridComponent, TooltipComponent, MarkLineComponent]);

function formatChartDateLabel(date?: string) {
  const value = date?.trim();
  if (!value) return '';
  const parts = value.split('-');
  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
}

function formatTooltipDateLabel(date?: string) {
  const value = date?.trim();
  if (!value) return '--';
  const parts = value.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return value;
}

function getChartLabelIndices(count: number, maxLabels = MAX_X_LABELS) {
  if (count <= 0) return [];
  if (count <= maxLabels) {
    return Array.from({ length: count }, (_, index) => index);
  }
  return Array.from({ length: maxLabels }, (_, index) =>
    Math.round((index / (maxLabels - 1)) * (count - 1)),
  );
}

function normalizeRate(value?: number | null) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return null;
  const clamped = Math.max(0, Math.min(120, raw));
  return Math.round(clamped * 100) / 100;
}

function buildOption(trendList: MealExecutionTrendItem[]) {
  const dates = trendList.map(item => item.date?.trim() || '');
  const labelIndices = new Set(getChartLabelIndices(trendList.length));

  return {
    animation: false,
    tooltip: {
      trigger: 'axis',
      triggerOn: 'click',
      confine: true,
      backgroundColor: 'rgba(51,51,51,0.9)',
      borderWidth: 0,
      padding: [6, 10],
      textStyle: { color: '#fff', fontSize: 11, lineHeight: 16 },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params];
        const first = items[0] as { dataIndex?: number; axisValueLabel?: string; name?: string };
        const dateKey = dates[first?.dataIndex ?? 0] || first?.axisValueLabel || first?.name || '';
        const title = formatTooltipDateLabel(dateKey);
        const lines = SERIES.map(series => {
          const item = items.find(entry => (entry as { seriesName?: string }).seriesName === series.label);
          const raw = (item as { data?: number | null; value?: number | null } | undefined)?.data
            ?? (item as { value?: number | null } | undefined)?.value;
          const value = normalizeRate(raw as number | null | undefined);
          return `${series.label} ${value == null ? '--' : `${formatMealHistoryRate(value)}%`}`;
        });
        return [title, ...lines].join('\n');
      },
    },
    grid: {
      top: 12,
      right: 12,
      bottom: 24,
      left: 28,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        show: true,
        color: '#999999',
        fontSize: 10,
        interval: (index: number) => labelIndices.has(index),
        formatter: (value: string) => formatChartDateLabel(value),
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 120,
      interval: 30,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        show: true,
        color: '#999999',
        fontSize: 10,
        formatter: (value: number) => `${value}`,
      },
      splitLine: {
        show: true,
        lineStyle: { color: 'rgba(23,63,125,0.06)' },
      },
    },
    series: SERIES.map((series, index) => ({
      name: series.label,
      type: 'line',
      smooth: true,
      connectNulls: true,
      showSymbol: trendList.length <= 8,
      symbol: 'circle',
      symbolSize: 5,
      data: trendList.map(item => normalizeRate(item[series.key])),
      lineStyle: { color: series.color, width: 2 },
      itemStyle: { color: series.color },
      markLine: index === 0
        ? {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: {
            type: 'dashed',
            color: 'rgba(153,153,153,0.6)',
            width: 1,
          },
          data: [{ yAxis: BASELINE }],
        }
        : undefined,
    })),
  };
}

type Props = {
  trendList?: MealExecutionTrendItem[];
};

export default function MealTrendChart({ trendList = [] }: Props) {
  const skiaRef = useRef<any>(null);
  const option = useMemo(() => buildOption(trendList), [trendList]);

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

  if (trendList.length === 0) {
    return (
      <View style={styles.trendEmpty}>
        <Text style={styles.trendEmptyText}>暂无趋势数据</Text>
      </View>
    );
  }

  return (
    <View>
      <Flex style={styles.legendRow}>
        {SERIES.map(item => (
          <Flex key={item.key} align="center" style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </Flex>
        ))}
      </Flex>

      <View style={styles.chartWrap}>
        <SkiaChart ref={skiaRef} style={styles.trendChart} />
      </View>

      <Text style={styles.baselineHint}>虚线为达标基准线（90%），点击折线查看详情</Text>
    </View>
  );
}
