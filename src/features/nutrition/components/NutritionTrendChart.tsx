import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/nutrition/foodRecording';
import { readSelectionPixelX } from '@/src/features/profile/vitals/detail/components/detailChartSelection';
import {
  formatFoodRecordingDayTitle,
  formatFoodRecordingRate,
} from './utils/foodRecordingHelpers';

const CHART_WIDTH = Dimensions.get('window').width - 48;
const CHART_HEIGHT = 210;
const MAX_X_LABELS = 7;
const SELECT_LINE_COLOR = '#6D925E';
const BASELINE = 90;
const BASELINE_LINE_COLOR = 'rgba(109,146,94,0.14)';
const POINT_OUTER_SIZE = 12;
const POINT_INNER_SIZE = 8;

const CHART_GRID = {
  top: 12,
  right: 12,
  bottom: 40,
  left: 28,
};

const PLOT_LEFT = CHART_GRID.left;
const PLOT_WIDTH = CHART_WIDTH - CHART_GRID.left - CHART_GRID.right;
const GRID_TOP_Y = CHART_GRID.top;
const CHART_TOUCH_HEIGHT = CHART_HEIGHT - GRID_TOP_Y;

const SLIDER_THUMB_WIDTH = 37;
const SLIDER_THUMB_HEIGHT = 27;
const SLIDER_THUMB_TOP = 25;
const SLIDER_TRACK_HEIGHT = SLIDER_THUMB_TOP + SLIDER_THUMB_HEIGHT;
const SLIDER_BOTTOM_OFFSET = -38;

export type NutritionTrendItem = {
  date: string;
  caloriesRate?: number;
  proteinRate?: number;
  carbsRate?: number;
  fatRate?: number;
};

export const NUTRITION_TREND_SERIES = [
  { key: 'caloriesRate' as const, label: '热量', color: '#6D925E' },
  { key: 'proteinRate' as const, label: '蛋白质', color: '#0951AE' },
  { key: 'carbsRate' as const, label: '碳水', color: '#72A1C5' },
  { key: 'fatRate' as const, label: '脂肪', color: '#FB4550' },
];

const SERIES = NUTRITION_TREND_SERIES;

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent]);

function formatChartDateLabel(date?: string) {
  const value = date?.trim();
  if (!value) return '';
  const parts = value.split('-');
  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
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
  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

function dataIndexToPixelLeft(index: number, count: number) {
  if (count <= 1) return PLOT_LEFT + PLOT_WIDTH / 2;
  const clamped = Math.max(0, Math.min(count - 1, index));
  return PLOT_LEFT + (clamped / (count - 1)) * PLOT_WIDTH;
}

function findNearestIndex(pixelX: number, count: number) {
  if (count <= 0) return null;
  if (count === 1) return 0;
  const clamped = Math.max(PLOT_LEFT, Math.min(PLOT_LEFT + PLOT_WIDTH, pixelX));
  const ratio = (clamped - PLOT_LEFT) / PLOT_WIDTH;
  return Math.round(ratio * (count - 1));
}

function getSliderThumbLeft(thumbCenterX: number | null) {
  if (thumbCenterX == null) {
    return PLOT_LEFT - SLIDER_THUMB_WIDTH / 2;
  }
  const minLeft = PLOT_LEFT - SLIDER_THUMB_WIDTH / 2;
  const maxLeft = PLOT_LEFT + PLOT_WIDTH - SLIDER_THUMB_WIDTH / 2;
  return Math.max(minLeft, Math.min(thumbCenterX - SLIDER_THUMB_WIDTH / 2, maxLeft));
}

const SELECTION_CARD_WIDTH = 118;
const SELECTION_CARD_GAP = 10;

function getSelectionCardLeft(pixelX: number | null) {
  if (pixelX == null) return PLOT_LEFT;
  const preferLeft = pixelX > CHART_WIDTH / 2;
  if (preferLeft) {
    return Math.max(0, pixelX - SELECTION_CARD_WIDTH - SELECTION_CARD_GAP);
  }
  return Math.min(CHART_WIDTH - SELECTION_CARD_WIDTH, pixelX + SELECTION_CARD_GAP);
}

function SelectionTipCard({
  item,
  pixelX,
}: {
  item: NutritionTrendItem;
  pixelX: number | null;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.selectionCard,
        {
          left: getSelectionCardLeft(pixelX),
          width: SELECTION_CARD_WIDTH,
        },
      ]}
    >
      <Text style={styles.selectionCardTitle}>{formatFoodRecordingDayTitle(item.date)}</Text>
      {SERIES.map(series => (
        <Flex key={series.key} align="center" justify="between" style={styles.selectionCardRow}>
          <Flex align="center">
            <View style={[styles.selectionCardDot, { backgroundColor: series.color }]} />
            <Text style={styles.selectionCardLabel}>{series.label}</Text>
          </Flex>
          <Text style={styles.selectionCardValue}>{formatFoodRecordingRate(item[series.key])}</Text>
        </Flex>
      ))}
    </View>
  );
}

function ChartSelectionSlider({
  thumbCenterX,
  onSelectAtX,
}: {
  thumbCenterX: number | null;
  onSelectAtX: (chartX: number) => void;
}) {
  const sliderGesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(event => {
      runOnJS(onSelectAtX)(event.x);
    });
    const pan = Gesture.Pan()
      .activeOffsetX([-2, 2])
      .failOffsetY([-20, 20])
      .onStart(event => {
        runOnJS(onSelectAtX)(event.x);
      })
      .onUpdate(event => {
        runOnJS(onSelectAtX)(event.x);
      });
    return Gesture.Exclusive(pan, tap);
  }, [onSelectAtX]);

  return (
    <GestureDetector gesture={sliderGesture}>
      <Animated.View
        style={[
          styles.chartSliderTrack,
          {
            width: CHART_WIDTH,
            height: SLIDER_TRACK_HEIGHT,
            bottom: SLIDER_BOTTOM_OFFSET,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.chartSliderThumb,
            {
              left: getSliderThumbLeft(thumbCenterX),
              top: SLIDER_THUMB_TOP,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/vitals/hk.png')}
            style={{
              width: SLIDER_THUMB_WIDTH,
              height: SLIDER_THUMB_HEIGHT,
            }}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function buildOption(trendList: NutritionTrendItem[], selectedIndex: number | null) {
  const dates = trendList.map(item => item.date);
  const labelIndices = new Set(getChartLabelIndices(trendList.length));
  const markLineData: Array<Record<string, unknown>> = [{
    yAxis: BASELINE,
    lineStyle: {
      type: 'dashed',
      color: BASELINE_LINE_COLOR,
      width: 2,
    },
    label: { show: false },
  }];

  if (selectedIndex != null) {
    markLineData.push({
      xAxis: selectedIndex,
      lineStyle: {
        color: SELECT_LINE_COLOR,
        width: 1,
      },
      label: { show: false },
    });
  }

  const markLine = {
    silent: true,
    symbol: ['none', 'none'],
    data: markLineData,
    z: 1,
  };

  const lineSeries = SERIES.map((series, index) => ({
    name: series.label,
    type: 'line' as const,
    smooth: true,
    connectNulls: true,
    showSymbol: false,
    data: trendList.map(item => normalizeRate(item[series.key])),
    lineStyle: { color: series.color, width: 3 },
    itemStyle: { color: series.color },
    markLine: index === 0 ? markLine : undefined,
    z: 5,
  }));

  const pointSeries = SERIES.flatMap(series => {
    const scatterData = trendList
      .map((item, dataIndex) => {
        const value = normalizeRate(item[series.key]);
        if (value == null) return null;
        return {
          value: [dates[dataIndex], value] as [string, number],
          name: series.label,
        };
      })
      .filter(Boolean);

    return [
      {
        name: `${series.label}-outer`,
        type: 'scatter' as const,
        symbol: 'circle',
        symbolSize: POINT_OUTER_SIZE,
        data: scatterData,
        itemStyle: {
          color: '#FFFFFF',
          borderColor: series.color,
          borderWidth: 1,
          shadowBlur: 3,
          shadowColor: 'rgba(0,0,0,0.2)',
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        z: 10,
      },
      {
        name: `${series.label}-inner`,
        type: 'scatter' as const,
        symbol: 'circle',
        symbolSize: POINT_INNER_SIZE,
        data: scatterData,
        itemStyle: {
          color: series.color,
          borderColor: series.color,
          borderWidth: 1,
        },
        z: 11,
      },
    ];
  });

  return {
    animation: false,
    tooltip: { show: false },
    grid: CHART_GRID,
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
      max: 100,
      interval: 25,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        show: true,
        color: '#999999',
        fontSize: 10,
      },
      splitLine: {
        show: true,
        lineStyle: { color: 'rgba(23,63,125,0.06)' },
      },
    },
    series: [...lineSeries, ...pointSeries],
  };
}

type Props = {
  trendList?: NutritionTrendItem[];
};

export default function NutritionTrendChart({ trendList = [] }: Props) {
  const skiaRef = useRef<any>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectionPixelX, setSelectionPixelX] = useState<number | null>(null);

  const dates = useMemo(() => trendList.map(item => item.date), [trendList]);

  useEffect(() => {
    setSelectedIndex(trendList.length ? trendList.length - 1 : null);
  }, [trendList]);

  const fallbackPixelX = useMemo(() => {
    if (selectedIndex == null) return null;
    return dataIndexToPixelLeft(selectedIndex, trendList.length);
  }, [selectedIndex, trendList.length]);

  const displayPixelX = selectionPixelX ?? fallbackPixelX;
  const selectedItem = useMemo(() => {
    if (selectedIndex == null) return null;
    return trendList[selectedIndex] ?? null;
  }, [selectedIndex, trendList]);
  const option = useMemo(
    () => buildOption(trendList, selectedIndex),
    [selectedIndex, trendList],
  );

  const selectAtChartX = useCallback((chartX: number) => {
    const nearest = findNearestIndex(chartX, trendList.length);
    if (nearest == null) return;
    setSelectedIndex(nearest);
  }, [trendList.length]);

  const selectAtPlotX = useCallback((plotX: number) => {
    selectAtChartX(PLOT_LEFT + plotX);
  }, [selectAtChartX]);

  const chartGesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(event => {
      runOnJS(selectAtPlotX)(event.x);
    });
    const pan = Gesture.Pan()
      .activeOffsetX([-4, 4])
      .failOffsetY([-12, 12])
      .onStart(event => {
        runOnJS(selectAtPlotX)(event.x);
      })
      .onUpdate(event => {
        runOnJS(selectAtPlotX)(event.x);
      });
    return Gesture.Exclusive(pan, tap);
  }, [selectAtPlotX]);

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
      chartRef.current = chart;
      requestAnimationFrame(() => {
        setSelectionPixelX(readSelectionPixelX(
          chart,
          'week',
          selectedIndex,
          dates,
          fallbackPixelX,
        ));
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      chart?.dispose();
      chartRef.current = null;
    };
  }, [dates, fallbackPixelX, option, selectedIndex]);

  if (!trendList.length) {
    return (
      <View style={styles.trendEmpty}>
        <Text style={styles.trendEmptyText}>暂无趋势数据</Text>
      </View>
    );
  }

  return (
    <View style={styles.trendSection}>
      <View style={styles.chartWrap}>
        <SkiaChart
          ref={skiaRef}
          style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
        />
        <GestureDetector gesture={chartGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: PLOT_LEFT,
              top: GRID_TOP_Y,
              width: PLOT_WIDTH,
              height: CHART_TOUCH_HEIGHT,
              zIndex: 15,
            }}
          />
        </GestureDetector>
        <ChartSelectionSlider
          thumbCenterX={displayPixelX}
          onSelectAtX={selectAtChartX}
        />
        {selectedItem ? (
          <SelectionTipCard item={selectedItem} pixelX={displayPixelX} />
        ) : null}
      </View>
    </View>
  );
}
