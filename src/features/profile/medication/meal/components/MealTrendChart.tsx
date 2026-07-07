import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { G, Line, Polyline } from 'react-native-svg';
import { Flex } from '@ant-design/react-native';
import type { MealExecutionTrendItem } from '@/api/meal';
import styles from '@/css/medication/mealHistory';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const CHART_PADDING = { top: 12, right: 12, bottom: 24, left: 28 };
const BASELINE = 90;

const SERIES = [
  { key: 'energyRate' as const, label: '热量', color: '#FF8B07' },
  { key: 'proteinRate' as const, label: '蛋白', color: '#0951AE' },
  { key: 'waterRate' as const, label: '饮水', color: '#34B69F' },
];

const MAX_X_LABELS = 7;

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

function getChartXPercent(index: number, total: number) {
  const leftPadRatio = CHART_PADDING.left / CHART_WIDTH;
  const plotWidthRatio = (CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) / CHART_WIDTH;
  if (total <= 1) {
    return (leftPadRatio + plotWidthRatio / 2) * 100;
  }
  const xInPlot = index / (total - 1);
  return (leftPadRatio + xInPlot * plotWidthRatio) * 100;
}

type Props = {
  trendList?: MealExecutionTrendItem[];
};

function buildPoints(
  trendList: MealExecutionTrendItem[],
  key: keyof MealExecutionTrendItem,
  plotWidth: number,
  plotHeight: number,
) {
  if (trendList.length === 0) return '';

  return trendList
    .map((item, index) => {
      const x = trendList.length === 1
        ? plotWidth / 2
        : (index / (trendList.length - 1)) * plotWidth;
      const raw = Number(item[key]);
      const value = Number.isFinite(raw) ? Math.max(0, Math.min(120, raw)) : 0;
      const y = plotHeight - (value / 120) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');
}

export default function MealTrendChart({ trendList = [] }: Props) {
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const baselineY = CHART_PADDING.top + plotHeight - (BASELINE / 120) * plotHeight;

  const labels = useMemo(
    () => trendList.map(item => formatChartDateLabel(item.date)),
    [trendList],
  );

  const labelIndices = useMemo(
    () => getChartLabelIndices(trendList.length),
    [trendList.length],
  );

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
        <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          {[0, 30, 60, 90, 120].map(value => {
            const y = CHART_PADDING.top + plotHeight - (value / 120) * plotHeight;
            return (
              <Line
                key={value}
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={y}
                stroke="rgba(23,63,125,0.06)"
                strokeWidth={1}
              />
            );
          })}

          <Line
            x1={CHART_PADDING.left}
            y1={baselineY}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={baselineY}
            stroke="rgba(153,153,153,0.6)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          <G x={CHART_PADDING.left} y={CHART_PADDING.top}>
            {SERIES.map(item => (
              <Polyline
                key={item.key}
                points={buildPoints(trendList, item.key, plotWidth, plotHeight)}
                fill="none"
                stroke={item.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </G>
        </Svg>

        <View style={styles.chartLabels}>
          {labelIndices.map(index => (
            <Text
              key={`${labels[index]}-${index}`}
              style={[
                styles.chartLabelText,
                { left: `${getChartXPercent(index, trendList.length)}%` },
              ]}
              numberOfLines={1}>
              {labels[index]}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.baselineHint}>虚线为达标基准线（90%）</Text>
    </View>
  );
}
