import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RING_SIZE = 45;
const STROKE_WIDTH = 6;
const TRACK_COLOR = '#EAEAEB';
const TIP_DOT_RADIUS = 1.5;

type NutrientProgressRingProps = {
  progress?: number;
  color: string;
  size?: number;
  children?: React.ReactNode;
};

export default function NutrientProgressRing({
  progress = 0,
  color,
  size = RING_SIZE,
  children,
}: NutrientProgressRingProps) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - STROKE_WIDTH) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = (circumference * value) / 100;
  const gapLength = circumference - dashLength;

  const tipPosition = useMemo(() => {
    const angleRad = ((-90 + (360 * value) / 100) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleRad),
      y: center + radius * Math.sin(angleRad),
    };
  }, [center, radius, value]);

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={TRACK_COLOR}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {value > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${dashLength} ${gapLength}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
        <Circle
          cx={tipPosition.x}
          cy={tipPosition.y}
          r={TIP_DOT_RADIUS}
          fill="#FFFFFF"
        />
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
