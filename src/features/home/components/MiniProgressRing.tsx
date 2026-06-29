import React, { useId, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const RING_SIZE = 28;
const STROKE_WIDTH = 4;
const STROKE_INSET = STROKE_WIDTH / 2;
const CANVAS_SIZE = RING_SIZE + STROKE_INSET * 2;
const TRACK_COLOR = '#FFECD7';
const PROGRESS_COLOR = '#FF8B07';
const COMPLETE_COLOR = '#00B388';
const DOT_SIZE = 4;

const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CANVAS_CENTER = CANVAS_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function cssAngleToGradientPoints(angleDeg: number, cx: number, cy: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x1: cx - Math.cos(rad) * radius,
    y1: cy - Math.sin(rad) * radius,
    x2: cx + Math.cos(rad) * radius,
    y2: cy + Math.sin(rad) * radius,
  };
}

function getProgressDotPosition(progressPercent: number) {
  const angleRad = ((-90 + (360 * progressPercent) / 100) * Math.PI) / 180;
  return {
    x: CANVAS_CENTER + RING_RADIUS * Math.cos(angleRad),
    y: CANVAS_CENTER + RING_RADIUS * Math.sin(angleRad),
  };
}

type MiniProgressRingProps = {
  progress: number;
  color?: string;
  trackColor?: string;
  progressColors?: [string, string];
  gradientAngle?: number;
};

export default function MiniProgressRing({
  progress,
  color,
  trackColor = TRACK_COLOR,
  progressColors,
  gradientAngle = 90,
}: MiniProgressRingProps) {
  const gradientId = useId().replace(/:/g, '');
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  const isComplete = value >= 100;
  const progressColor = color ?? (isComplete ? COMPLETE_COLOR : PROGRESS_COLOR);
  const clampedProgress = value / 100;
  const dashLength = CIRCUMFERENCE * clampedProgress;
  const gapLength = CIRCUMFERENCE - dashLength;
  const dotPosition = getProgressDotPosition(value);

  const gradientPoints = useMemo(
    () => cssAngleToGradientPoints(gradientAngle, CANVAS_CENTER, CANVAS_CENTER, RING_RADIUS),
    [gradientAngle],
  );

  const progressStroke = progressColors ? `url(#${gradientId})` : progressColor;
  const idleDotColor = progressColors?.[0] ?? progressColor;

  return (
    <View style={styles.ring}>
      <Svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        style={styles.canvas}>
        {progressColors ? (
          <Defs>
            <LinearGradient
              id={gradientId}
              x1={gradientPoints.x1}
              y1={gradientPoints.y1}
              x2={gradientPoints.x2}
              y2={gradientPoints.y2}
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={progressColors[0]} />
              <Stop offset="1" stopColor={progressColors[1]} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={CANVAS_CENTER}
          cy={CANVAS_CENTER}
          r={RING_RADIUS}
          stroke={trackColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {value > 0 ? (
          <>
            <Circle
              cx={CANVAS_CENTER}
              cy={CANVAS_CENTER}
              r={RING_RADIUS}
              stroke={progressStroke}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${CANVAS_CENTER} ${CANVAS_CENTER})`}
            />
            <Circle
              cx={dotPosition.x}
              cy={dotPosition.y}
              r={DOT_SIZE / 2}
              fill="#FFFFFF"
            />
          </>
        ) : (
          <>
            <Circle
              cx={dotPosition.x}
              cy={dotPosition.y}
              r={STROKE_WIDTH / 2}
              fill={idleDotColor}
            />
            <Circle
              cx={dotPosition.x}
              cy={dotPosition.y}
              r={DOT_SIZE / 2}
              fill="#FFFFFF"
            />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    overflow: 'visible',
  },
  canvas: {
    position: 'absolute',
    left: -STROKE_INSET,
    top: -STROKE_INSET,
  },
});
