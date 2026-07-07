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
    () => trendList.map(item => {
      const date = item.date?.trim();
      if (!date) return '';
      const parts = date.split('-');
      return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : date;
    }),
    [trendList],
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

        <Flex justify="between" style={styles.chartLabels}>
          {labels.map((label, index) => (
            <Text key={`${label}-${index}`} style={styles.chartLabelText} numberOfLines={1}>
              {label}
            </Text>
          ))}
        </Flex>
      </View>

      <Text style={styles.baselineHint}>虚线为达标基准线（90%）</Text>
    </View>
  );
}
