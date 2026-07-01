import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const MINI_SPARKLINE_WIDTH = 73;
export const MINI_SPARKLINE_HEIGHT = 18;
const STROKE_WIDTH = 2;
const STROKE_COLOR = '#6D925E';
const STROKE_INSET = STROKE_WIDTH / 2;

type Point = { x: number; y: number };

type MiniSparklineProps = {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

function buildChartPoints(values: number[], width: number, height: number): Point[] {
  if (!values.length) return [];

  const innerWidth = width - STROKE_INSET * 2;
  const innerHeight = height - STROKE_INSET * 2;

  if (values.length === 1) {
    const y = height / 2;
    return [
      { x: STROKE_INSET, y },
      { x: width - STROKE_INSET, y },
    ];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => ({
    x: STROKE_INSET + (index / (values.length - 1)) * innerWidth,
    y: STROKE_INSET + innerHeight - ((value - min) / range) * innerHeight,
  }));
}

function buildSmoothPath(points: Point[]) {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

export default function MiniSparkline({
  data = [68, 72, 75, 70, 72],
  width = MINI_SPARKLINE_WIDTH,
  height = MINI_SPARKLINE_HEIGHT,
  color = STROKE_COLOR,
  strokeWidth = STROKE_WIDTH,
}: MiniSparklineProps) {
  const path = useMemo(() => {
    const points = buildChartPoints(data, width, height);
    return buildSmoothPath(points);
  }, [data, width, height]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
