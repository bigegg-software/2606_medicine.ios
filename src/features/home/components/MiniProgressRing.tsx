import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';

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

function getProgressDotPosition(progressPercent: number) {
  const angleRad = ((-90 + (360 * progressPercent) / 100) * Math.PI) / 180;
  return {
    x: CANVAS_CENTER + RING_RADIUS * Math.cos(angleRad),
    y: CANVAS_CENTER + RING_RADIUS * Math.sin(angleRad),
  };
}

type MiniProgressRingProps = {
  progress: number;
};

export default function MiniProgressRing({ progress }: MiniProgressRingProps) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  const isComplete = value >= 100;
  const progressColor = isComplete ? COMPLETE_COLOR : PROGRESS_COLOR;
  const progressSweep = value >= 100 ? 360 : (360 * value) / 100;

  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      {
        x: CANVAS_CENTER - RING_RADIUS,
        y: CANVAS_CENTER - RING_RADIUS,
        width: RING_RADIUS * 2,
        height: RING_RADIUS * 2,
      },
      -90,
      progressSweep,
    );
    return path;
  }, [progressSweep]);

  const dotPosition = getProgressDotPosition(value);

  return (
    <View style={styles.ring}>
      <Canvas style={styles.canvas}>
        <Circle
          cx={CANVAS_CENTER}
          cy={CANVAS_CENTER}
          r={RING_RADIUS}
          color={TRACK_COLOR}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
        />
        {value > 0 ? (
          <Path
            path={progressPath}
            color={progressColor}
            style="stroke"
            strokeWidth={STROKE_WIDTH}
            strokeCap="round"
          />
        ) : (
          <Circle
            cx={dotPosition.x}
            cy={dotPosition.y}
            r={STROKE_WIDTH / 2}
            color={progressColor}
          />
        )}
        <Circle cx={dotPosition.x} cy={dotPosition.y} r={DOT_SIZE / 2} color="#FFFFFF" />
      </Canvas>
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
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    position: 'absolute',
    left: -STROKE_INSET,
    top: -STROKE_INSET,
  },
});
