import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  PanResponder,
  type LayoutChangeEvent,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { FONT_SIZE_OPTIONS, type FontSizeOption } from '@/common/fontSize';
import styles from '@/css/profile/settings';

type Props = {
  value: FontSizeOption;
  onChange: (option: FontSizeOption) => void;
};

const THUMB_SIZE = 24;
const LAST_INDEX = FONT_SIZE_OPTIONS.length - 1;

export default function FontSizeStepSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const index = useMemo(() => {
    const found = FONT_SIZE_OPTIONS.findIndex(item => item.key === value);
    return found >= 0 ? found : 0;
  }, [value]);
  const indexRef = useRef(index);
  indexRef.current = index;

  const updateByPageX = useCallback((pageX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;
    const x = pageX - trackPageXRef.current;
    const ratio = Math.max(0, Math.min(1, x / width));
    const nextIndex = Math.round(ratio * LAST_INDEX);
    const next = FONT_SIZE_OPTIONS[nextIndex];
    if (next && nextIndex !== indexRef.current) {
      onChangeRef.current(next.key);
    }
  }, []);

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

  const onTrackLayout = (_e: LayoutChangeEvent) => {
    measureTrack();
  };

  const thumbLeft =
    trackWidth > 0 ? (index / LAST_INDEX) * trackWidth - THUMB_SIZE / 2 : -THUMB_SIZE / 2;

  return (
    <View style={styles.fontSizeSliderWrap}>
      <View
        ref={trackRef}
        style={styles.fontSizeSliderTrackHit}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.fontSizeSliderTrack} pointerEvents="none">
          {FONT_SIZE_OPTIONS.map((item, tickIndex) => {
            const left =
              trackWidth > 0
                ? (tickIndex / LAST_INDEX) * trackWidth - 2
                : 0;
            return (
              <View
                key={item.key}
                style={[styles.fontSizeSliderTick, { left }]}
              />
            );
          })}
        </View>
        <View
          style={[styles.fontSizeSliderThumb, { left: thumbLeft }]}
          pointerEvents="none"
        />
      </View>

      <View style={styles.fontSizeSliderLabels}>
        {FONT_SIZE_OPTIONS.map((item, tickIndex) => {
          const centerX =
            trackWidth > 0 ? (tickIndex / LAST_INDEX) * trackWidth : 0;
          return (
            <View
              key={item.key}
              style={[
                styles.fontSizeSliderLabelWrap,
                trackWidth > 0 ? { left: centerX } : null,
              ]}
            >
              <Text
                style={[
                  styles.fontSizeSliderLabel,
                  item.key === value ? styles.fontSizeSliderLabelActive : null,
                ]}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
