import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

const RING_SIZE = 46;
const STROKE_WIDTH = 5;
const TRACK_COLOR = '#ECF3FF';
const PROGRESS_COLORS = ['#2B8DD8', '#0B52AE'] as const;
const DOT_SIZE = 3;
const DOT_RADIUS = DOT_SIZE / 2;
const EDGE_MARGIN = 20;
const TOP_MARGIN = 100;

const ringRadius = (RING_SIZE - STROKE_WIDTH) / 2;
const ringCenter = RING_SIZE / 2;
const circumference = 2 * Math.PI * ringRadius;
const innerSize = RING_SIZE - STROKE_WIDTH * 2;

const SNAP_DURATION = 140;

function cssAngleToGradientPoints(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x1: ringCenter - Math.cos(rad) * ringRadius,
    y1: ringCenter - Math.sin(rad) * ringRadius,
    x2: ringCenter + Math.cos(rad) * ringRadius,
    y2: ringCenter + Math.sin(rad) * ringRadius,
  };
}

function SyncProgressRing({ progress }: { progress: number }) {
  const gradientId = useId().replace(/:/g, '');
  const value = Math.min(100, Math.max(0, Math.round(progress)));
  const dashLength = circumference * (value / 100);
  const gapLength = circumference - dashLength;

  const dotPosition = useMemo(() => {
    const angleRad = ((-90 + (360 * value) / 100) * Math.PI) / 180;
    return {
      x: ringCenter + ringRadius * Math.cos(angleRad),
      y: ringCenter + ringRadius * Math.sin(angleRad),
    };
  }, [value]);

  const gradientPoints = useMemo(() => cssAngleToGradientPoints(135), []);

  return (
    <Animated.View style={styles.ringWrap}>
      <Animated.View style={styles.innerFrost}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="light" style={styles.innerFrostBlur} />
        ) : null}
      </Animated.View>

      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <Defs>
          <SvgLinearGradient
            id={gradientId}
            x1={gradientPoints.x1}
            y1={gradientPoints.y1}
            x2={gradientPoints.x2}
            y2={gradientPoints.y2}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={PROGRESS_COLORS[0]} />
            <Stop offset="1" stopColor={PROGRESS_COLORS[1]} />
          </SvgLinearGradient>
        </Defs>

        <Circle
          cx={ringCenter}
          cy={ringCenter}
          r={ringRadius}
          stroke={TRACK_COLOR}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />

        {value > 0 ? (
          <>
            <Circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
            />
            <Circle cx={dotPosition.x} cy={dotPosition.y} r={DOT_RADIUS} fill="#FFFFFF" />
          </>
        ) : null}
      </Svg>

      <Animated.View style={styles.percentWrap} pointerEvents="none">
        <Text style={styles.percentText}>{value}%</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function UploadProgressBar() {
  const uploading = useSelector((state: RootState) => state.upload.uploading);
  const progress = useSelector((state: RootState) => state.upload.progress);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const bounds = useSharedValue({
    minY: EDGE_MARGIN,
    maxY: screenHeight - RING_SIZE - EDGE_MARGIN,
    screenWidth,
  });
  const initialized = useRef(false);

  useEffect(() => {
    const minY = insets.top + EDGE_MARGIN;
    const maxY = screenHeight - RING_SIZE - insets.bottom - EDGE_MARGIN;
    bounds.value = { minY, maxY, screenWidth };

    if (!initialized.current) {
      posX.value = screenWidth - RING_SIZE - EDGE_MARGIN;
      const defaultY = insets.top + TOP_MARGIN;
      posY.value = Math.min(Math.max(defaultY, minY), maxY);
      initialized.current = true;
      return;
    }

    const snapLeft = EDGE_MARGIN;
    const snapRight = screenWidth - RING_SIZE - EDGE_MARGIN;
    const centerX = posX.value + RING_SIZE / 2;
    posX.value = centerX < screenWidth / 2 ? snapLeft : snapRight;
    posY.value = Math.min(Math.max(posY.value, minY), maxY);
  }, [screenWidth, screenHeight, insets.top, insets.bottom, bounds, posX, posY]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          dragStartX.value = posX.value;
          dragStartY.value = posY.value;
        })
        .onUpdate(event => {
          const { minY, maxY, screenWidth: width } = bounds.value;
          const minX = EDGE_MARGIN;
          const maxX = width - RING_SIZE - EDGE_MARGIN;
          const nextX = dragStartX.value + event.translationX;
          const nextY = dragStartY.value + event.translationY;
          posX.value = Math.min(Math.max(nextX, minX), maxX);
          posY.value = Math.min(Math.max(nextY, minY), maxY);
        })
        .onEnd(() => {
          const { screenWidth: width } = bounds.value;
          const snapLeft = EDGE_MARGIN;
          const snapRight = width - RING_SIZE - EDGE_MARGIN;
          const centerX = posX.value + RING_SIZE / 2;
          const targetX = centerX < width / 2 ? snapLeft : snapRight;
          posX.value = withTiming(targetX, {
            duration: SNAP_DURATION,
            easing: Easing.out(Easing.quad),
          });
        }),
    [bounds, dragStartX, dragStartY, posX, posY],
  );

  const containerStyle = useAnimatedStyle(() => ({
    left: posX.value,
    top: posY.value,
  }));

  if (!uploading) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, containerStyle]}>
        <SyncProgressRing progress={progress} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFrost: {
    position: 'absolute',
    width: innerSize,
    height: innerSize,
    borderRadius: innerSize / 2,
    overflow: 'hidden',
  },
  innerFrostBlur: {
    flex: 1,
  },
  percentWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(11, 82, 174, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
