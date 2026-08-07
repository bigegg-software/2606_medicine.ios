import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  PanResponder,
  Animated,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import {
  SPEECH_SPEED_OPTIONS,
  SPEECH_SPEED_MINOR_BETWEEN,
  getSpeechSpeedTickCount,
  speechSpeedIndexToRate,
  speechSpeedRateToIndex,
  snapSpeechSpeedRate,
} from '../utils/settingsHelpers';
import styles from '@/css/profile/settings';

type Props = {
  value: number;
  onChange: (rate: number) => void;
};

const THUMB_WIDTH = 14;
const THUMB_SCALE_IDLE = 1;
const THUMB_SCALE_DRAG = 1.45;
const LABEL_SCALE_ACTIVE = 1.2;

export default function SpeechSpeedStepSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const thumbScale = useRef(new Animated.Value(THUMB_SCALE_IDLE)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const floatScale = useRef(new Animated.Value(0.85)).current;

  const tickCount = getSpeechSpeedTickCount();
  const lastIndex = tickCount - 1;
  const stepsPerSegment = SPEECH_SPEED_MINOR_BETWEEN + 1;

  const snapped = useMemo(() => snapSpeechSpeedRate(value), [value]);
  const index = useMemo(() => speechSpeedRateToIndex(snapped), [snapped]);
  const indexRef = useRef(index);
  indexRef.current = index;

  const exactMajor = useMemo(
    () => SPEECH_SPEED_OPTIONS.find(item => item.rate === snapped),
    [snapped],
  );
  const showFloatValue = !exactMajor;

  useEffect(() => {
    Animated.spring(thumbScale, {
      toValue: dragging ? THUMB_SCALE_DRAG : showFloatValue ? 1.2 : THUMB_SCALE_IDLE,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [dragging, showFloatValue, thumbScale]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(floatOpacity, {
        toValue: showFloatValue ? 1 : 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(floatScale, {
        toValue: showFloatValue ? (dragging ? 1.25 : 1.1) : 0.85,
        useNativeDriver: true,
        friction: 7,
        tension: 140,
      }),
    ]).start();
  }, [dragging, floatOpacity, floatScale, showFloatValue]);

  const updateByPageX = useCallback((pageX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;
    const x = pageX - trackPageXRef.current;
    const ratio = Math.max(0, Math.min(1, x / width));
    const nextIndex = Math.round(ratio * lastIndex);
    if (nextIndex === indexRef.current) return;
    onChangeRef.current(speechSpeedIndexToRate(nextIndex));
  }, [lastIndex]);

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      trackWidthRef.current = width;
      setTrackWidth(width);
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          setDragging(true);
          measureTrack();
          updateByPageX(e.nativeEvent.pageX);
        },
        onPanResponderMove: (e: GestureResponderEvent, _g: PanResponderGestureState) => {
          updateByPageX(e.nativeEvent.pageX);
        },
        onPanResponderRelease: () => {
          setDragging(false);
        },
        onPanResponderTerminate: () => {
          setDragging(false);
        },
      }),
    [measureTrack, updateByPageX],
  );

  const tickMarks = useMemo(() => {
    const marks: { key: string; left: number; major: boolean }[] = [];
    if (trackWidth <= 0) return marks;
    for (let i = 0; i <= lastIndex; i += 1) {
      const major = i % stepsPerSegment === 0;
      const left = (i / lastIndex) * trackWidth - 1.5;
      marks.push({ key: `tick-${i}`, left, major });
    }
    return marks;
  }, [lastIndex, stepsPerSegment, trackWidth]);

  const thumbCenterX =
    trackWidth > 0 ? (index / lastIndex) * trackWidth : 0;
  const thumbLeft = thumbCenterX - THUMB_WIDTH / 2;

  return (
    <View style={styles.speechSpeedSliderWrap}>
      <View style={styles.speechSpeedLabelRow}>
        <View style={styles.speechSpeedRateLabels}>
          {SPEECH_SPEED_OPTIONS.map(item => {
            const majorIndex = speechSpeedRateToIndex(item.rate);
            const centerX = trackWidth > 0 ? (majorIndex / lastIndex) * trackWidth : 0;
            const active = exactMajor?.key === item.key;
            return (
              <Animated.View
                key={`rate-${item.key}`}
                style={[
                  styles.speechSpeedRateLabelWrap,
                  trackWidth > 0 ? { left: centerX } : null,
                  active
                    ? {
                        transform: [{ scale: dragging ? LABEL_SCALE_ACTIVE * 1.08 : LABEL_SCALE_ACTIVE }],
                      }
                    : { opacity: showFloatValue ? 0.45 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.speechSpeedRateLabel,
                    active ? styles.speechSpeedRateLabelActive : null,
                  ]}
                >
                  {item.rateLabel}
                </Text>
              </Animated.View>
            );
          })}

          {trackWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.speechSpeedFloatValueWrap,
                {
                  left: thumbCenterX,
                  opacity: floatOpacity,
                  transform: [{ scale: floatScale }, { translateY: dragging ? -2 : 0 }],
                },
              ]}
            >
              <Text style={styles.speechSpeedFloatValueText}>{snapped.toFixed(1)}</Text>
            </Animated.View>
          ) : null}
        </View>
      </View>

      <View style={styles.speechSpeedSliderTrackHit} {...panResponder.panHandlers}>
        <View
          ref={trackRef}
          style={styles.speechSpeedSliderTrack}
          onLayout={measureTrack}
          pointerEvents="box-none"
        >
          {tickMarks.map(mark => (
            <View
              key={mark.key}
              pointerEvents="none"
              style={[
                mark.major ? styles.speechSpeedTickMajor : styles.speechSpeedTickMinor,
                { left: mark.left },
              ]}
            />
          ))}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.speechSpeedSliderThumb,
              {
                left: thumbLeft,
                transform: [{ scale: thumbScale }],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.speechSpeedLabelRow}>
        <View style={styles.speechSpeedBottomLabels}>
          {SPEECH_SPEED_OPTIONS.map(item => {
            const majorIndex = speechSpeedRateToIndex(item.rate);
            const centerX = trackWidth > 0 ? (majorIndex / lastIndex) * trackWidth : 0;
            const active = exactMajor?.key === item.key;
            return (
              <Animated.View
                key={`label-${item.key}`}
                style={[
                  styles.speechSpeedBottomLabelWrap,
                  trackWidth > 0 ? { left: centerX } : null,
                  active
                    ? {
                        transform: [{ scale: dragging ? LABEL_SCALE_ACTIVE * 1.08 : LABEL_SCALE_ACTIVE }],
                      }
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.speechSpeedBottomLabel,
                    active ? styles.speechSpeedBottomLabelActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
