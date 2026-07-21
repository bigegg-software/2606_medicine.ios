import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RING_SIZE = 120;
const STROKE_WIDTH = 8;
const TRACK_COLOR = '#ECEDF1';
const PROGRESS_COLOR = '#6D925E';
const CENTER_FILL = '#FEFFFF';

type DietProgressRingProps = {
  progress?: number;
  size?: number;
};

export default function DietProgressRing({
  progress = 0,
  size = RING_SIZE,
}: DietProgressRingProps) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - STROKE_WIDTH) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = (circumference * value) / 100;
  const gapLength = circumference - dashLength;
  const innerRadius = radius - STROKE_WIDTH / 2;

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill={CENTER_FILL}
        />
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
            stroke={PROGRESS_COLOR}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${dashLength} ${gapLength}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
