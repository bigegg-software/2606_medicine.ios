import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RING_SIZE = 110;
const STROKE_WIDTH = 7;
const TRACK_COLOR = '#E8EBF5';
const PROGRESS_COLOR = '#6D925E';

type Props = {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  trackColor?: string;
};

export default function TrainingPlayerRing({
  progress = 0,
  size = RING_SIZE,
  strokeWidth = STROKE_WIDTH,
  progressColor = PROGRESS_COLOR,
  trackColor = TRACK_COLOR,
}: Props) {
  const value = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = (circumference * value) / 100;
  const gapLength = Math.max(0, circumference - dashLength);

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {value > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
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
