import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import {
  SPEECH_SPEED_OPTIONS,
  SPEECH_SPEED_MINOR_BETWEEN,
  getSpeechSpeedTickCount,
  nearestSpeechSpeedOption,
  speechSpeedIndexToRate,
  speechSpeedRateToIndex,
  snapSpeechSpeedRate,
} from '../utils/settingsHelpers';
import styles from '@/css/profile/settings';

type Props = {
  value: number;
  onChange: (rate: number) => void;
};

const THUMB_WIDTH = 10;

export default function SpeechSpeedStepSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const tickCount = getSpeechSpeedTickCount();
  const lastIndex = tickCount - 1;
  const stepsPerSegment = SPEECH_SPEED_MINOR_BETWEEN + 1;

  const index = useMemo(() => speechSpeedRateToIndex(value), [value]);
  const indexRef = useRef(index);
  indexRef.current = index;

  const activeMajor = useMemo(() => nearestSpeechSpeedOption(value), [value]);
  const exactMajor = useMemo(
    () => SPEECH_SPEED_OPTIONS.find(item => item.rate === snapSpeechSpeedRate(value)),
    [value],
  );

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
          measureTrack();
          updateByPageX(e.nativeEvent.pageX);
        },
        onPanResponderMove: (e: GestureResponderEvent, _g: PanResponderGestureState) => {
          updateByPageX(e.nativeEvent.pageX);
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

  const thumbLeft =
    trackWidth > 0 ? (index / lastIndex) * trackWidth - THUMB_WIDTH / 2 : -THUMB_WIDTH / 2;

  return (
    <View style={styles.speechSpeedSliderWrap}>
      <View style={styles.speechSpeedLabelRow}>
        <View style={styles.speechSpeedRateLabels}>
          {SPEECH_SPEED_OPTIONS.map(item => {
            const majorIndex = speechSpeedRateToIndex(item.rate);
            const centerX = trackWidth > 0 ? (majorIndex / lastIndex) * trackWidth : 0;
            return (
              <View
                key={`rate-${item.key}`}
                style={[
                  styles.speechSpeedRateLabelWrap,
                  trackWidth > 0 ? { left: centerX } : null,
                ]}
              >
                <Text
                  style={[
                    styles.speechSpeedRateLabel,
                    exactMajor?.key === item.key ? styles.speechSpeedRateLabelActive : null,
                  ]}
                >
                  {item.rateLabel}
                </Text>
              </View>
            );
          })}
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
          <View
            pointerEvents="none"
            style={[styles.speechSpeedSliderThumb, { left: thumbLeft }]}
          />
        </View>
      </View>

      <View style={styles.speechSpeedLabelRow}>
        <View style={styles.speechSpeedBottomLabels}>
          {SPEECH_SPEED_OPTIONS.map(item => {
            const majorIndex = speechSpeedRateToIndex(item.rate);
            const centerX = trackWidth > 0 ? (majorIndex / lastIndex) * trackWidth : 0;
            return (
              <View
                key={`label-${item.key}`}
                style={[
                  styles.speechSpeedBottomLabelWrap,
                  trackWidth > 0 ? { left: centerX } : null,
                ]}
              >
                <Text
                  style={[
                    styles.speechSpeedBottomLabel,
                    activeMajor.key === item.key ? styles.speechSpeedBottomLabelActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
