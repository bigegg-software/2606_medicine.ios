import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** 首页摘要卡片迷你散点图 */
export const MINI_VITAL_SCATTER_WIDTH = 72;
export const MINI_VITAL_SCATTER_HEIGHT = 30;
const POINT_RADIUS = 2.5;
const DEFAULT_COLOR = '#6D925E';

type MiniVitalScatterProps = {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
  /** 按点着色；不传则统一用 color */
  pointColors?: string[];
};

function buildPoints(
  values: number[],
  width: number,
  height: number,
  radius: number,
) {
  const valid = values.filter(value => Number.isFinite(value) && value > 0);
  if (!valid.length) return [] as Array<{ x: number; y: number; colorIndex: number }>;

  const inset = radius + 1;
  const innerWidth = Math.max(width - inset * 2, 1);
  const innerHeight = Math.max(height - inset * 2, 1);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;

  const indexed = values
    .map((value, colorIndex) => ({ value, colorIndex }))
    .filter(item => Number.isFinite(item.value) && item.value > 0);

  if (indexed.length === 1) {
    return [{
      x: width / 2,
      y: height / 2,
      colorIndex: indexed[0].colorIndex,
    }];
  }

  return indexed.map((item, index) => ({
    x: inset + (index / (indexed.length - 1)) * innerWidth,
    y: inset + innerHeight - ((item.value - min) / range) * innerHeight,
    colorIndex: item.colorIndex,
  }));
}

export default function MiniVitalScatter({
  data = [],
  width = MINI_VITAL_SCATTER_WIDTH,
  height = MINI_VITAL_SCATTER_HEIGHT,
  color = DEFAULT_COLOR,
  pointColors,
}: MiniVitalScatterProps) {
  const points = useMemo(
    () => buildPoints(data, width, height, POINT_RADIUS),
    [data, width, height],
  );

  if (points.length === 0) return null;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {points.map((point, index) => (
          <Circle
            key={`p-${index}`}
            cx={point.x}
            cy={point.y}
            r={POINT_RADIUS}
            fill={pointColors?.[point.colorIndex] ?? color}
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
