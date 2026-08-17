import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/** 首页摘要卡片迷你柱状图（对齐 VitalsPage StepsChart / 消耗） */
export const MINI_VITAL_BARS_WIDTH = 72;
export const MINI_VITAL_BARS_HEIGHT = 30;
/** 与 profile StepsChart 默认柱色一致 */
const DEFAULT_COLOR = '#EE9C44';
const BAR_RADIUS = 1.5;
const BAR_GAP = 2;

type MiniVitalBarsProps = {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
};

function buildBars(
  values: number[],
  width: number,
  height: number,
) {
  const valid = values.filter(value => Number.isFinite(value) && value > 0);
  if (!valid.length) return [] as Array<{ x: number; y: number; w: number; h: number }>;

  const max = Math.max(...valid);
  const count = valid.length;
  const gap = count > 1 ? BAR_GAP : 0;
  const barWidth = Math.max(
    2,
    Math.min(8, (width - gap * Math.max(count - 1, 0)) / count),
  );
  const totalWidth = barWidth * count + gap * Math.max(count - 1, 0);
  const startX = Math.max(0, (width - totalWidth) / 2);

  return valid.map((value, index) => {
    const h = Math.max(2, (value / max) * height);
    return {
      x: startX + index * (barWidth + gap),
      y: height - h,
      w: barWidth,
      h,
    };
  });
}

export default function MiniVitalBars({
  data = [],
  width = MINI_VITAL_BARS_WIDTH,
  height = MINI_VITAL_BARS_HEIGHT,
  color = DEFAULT_COLOR,
}: MiniVitalBarsProps) {
  const bars = useMemo(() => buildBars(data, width, height), [data, width, height]);

  if (bars.length === 0) return null;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {bars.map((bar, index) => (
          <Rect
            key={`b-${index}`}
            x={bar.x}
            y={bar.y}
            width={bar.w}
            height={bar.h}
            rx={BAR_RADIUS}
            ry={BAR_RADIUS}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
});
