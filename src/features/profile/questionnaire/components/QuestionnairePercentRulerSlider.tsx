import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const RULER_WIDTH = Dimensions.get('window').width - 72;
const TICK_COLOR = '#E4E4E4';
const EDGE_FADE_WIDTH = 30;
const EDGE_FADE_COLOR = '#FFFFFF';
const EDGE_FADE_TRANSPARENT = 'rgba(255, 255, 255, 0)';
const TICK_TRACK_HEIGHT = 24;
const LABEL_ROW_HEIGHT = 24;
const VISUAL_TICK_WIDTH = 10;
const VISUAL_TICKS_PER_SNAP = 1;
const MAJOR_TICK_HEIGHT = 24;
const MINOR_TICK_HEIGHT = 18;
const CENTER_LINE_WIDTH = 3;
const CENTER_TRIANGLE_WIDTH = 10;
const CENTER_TRIANGLE_HEIGHT = 6;
const TRIANGLE_TO_TICK_GAP = 8;
const LABEL_WIDTH = 40;

type TickKind = 'major' | 'minor';

export type QuestionnaireRulerSliderProps = {
  min?: number;
  max?: number;
  step?: number;
  /** 大刻度间隔；不传时沿用 1–100 百分比刻度规则 */
  majorStep?: number;
  initialValue?: number;
  unit?: string;
  onValueChange?: (value: number) => void;
};

function getDecimalPlaces(n: number) {
  const match = `${n}`.match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) return 0;
  const fraction = match[1] ? match[1].length : 0;
  const exponent = match[2] ? parseInt(match[2], 10) : 0;
  return Math.max(0, fraction - exponent);
}

function snapToStep(val: number, min: number, max: number, step: number) {
  const clamped = Math.max(min, Math.min(val, max));
  const steps = Math.round((clamped - min) / step);
  const snapped = min + steps * step;
  return parseFloat(snapped.toFixed(getDecimalPlaces(step)));
}

function isPercentMajorTickValue(value: number) {
  const rounded = Math.round(value);
  return rounded === 1
    || rounded === 100
    || (rounded >= 10 && rounded <= 90 && rounded % 10 === 0);
}

function isMajorTickValue(value: number, majorStep?: number) {
  if (majorStep == null) return isPercentMajorTickValue(value);
  const ratio = value / majorStep;
  return Math.abs(ratio - Math.round(ratio)) < 1e-6;
}

function getTickKind(value: number, majorStep?: number): TickKind {
  return isMajorTickValue(value, majorStep) ? 'major' : 'minor';
}

function formatDisplayValue(value: number, step: number) {
  const decimals = getDecimalPlaces(step);
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function getSnapScrollX(snapIndex: number) {
  return snapIndex * VISUAL_TICKS_PER_SNAP * VISUAL_TICK_WIDTH;
}

function TickMark({ kind }: { kind: TickKind }) {
  return (
    <View
      style={[
        styles.tickMark,
        {
          height: kind === 'major' ? MAJOR_TICK_HEIGHT : MINOR_TICK_HEIGHT,
        },
      ]}
    />
  );
}

function TickLabel({ label }: { label: string }) {
  return (
    <Text style={styles.tickLabel} numberOfLines={1}>
      {label}
    </Text>
  );
}

export default function QuestionnairePercentRulerSlider({
  min = 1,
  max = 100,
  step = 1,
  majorStep,
  initialValue = 50,
  unit,
  onValueChange,
}: QuestionnaireRulerSliderProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const ticking = useRef(false);
  const centerOffset = RULER_WIDTH / 2 - VISUAL_TICK_WIDTH / 2;
  const totalSnapSteps = Math.round((max - min) / step);
  const totalVisualSteps = totalSnapSteps;
  const maxScrollX = getSnapScrollX(totalSnapSteps);
  const snapPixelWidth = VISUAL_TICKS_PER_SNAP * VISUAL_TICK_WIDTH;
  const decimals = getDecimalPlaces(step);

  const snapToStepValue = (val: number) => snapToStep(val, min, max, step);
  const [value, setValue] = useState<number>(() => snapToStepValue(initialValue));

  const calculateValueFromX = (x: number) => {
    const bounded = Math.max(0, Math.min(x, maxScrollX));
    const snapIndex = Math.round(bounded / snapPixelWidth);
    const nextValue = min + snapIndex * step;
    return parseFloat(nextValue.toFixed(decimals));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const newValue = calculateValueFromX(x);
      setValue(prev => {
        if (Math.abs(newValue - prev) > 1e-9) {
          onValueChange?.(newValue);
          return newValue;
        }
        return prev;
      });
      ticking.current = false;
    });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    let x = event.nativeEvent.contentOffset.x;
    x = Math.max(0, Math.min(x, maxScrollX));
    const snapIndex = Math.round(x / snapPixelWidth);
    const alignedX = getSnapScrollX(snapIndex);
    if (Math.abs(alignedX - x) > 1) {
      scrollRef.current?.scrollTo({ x: alignedX, animated: true });
    }
  };

  useEffect(() => {
    const snapIndex = Math.round((snapToStepValue(initialValue) - min) / step);
    const x = getSnapScrollX(snapIndex);
    const rafId = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: false });
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const visibleCount = Math.ceil(RULER_WIDTH / VISUAL_TICK_WIDTH) + 10;
  const centerSnapIndex = Math.round((value - min) / step);
  const centerVisualIndex = centerSnapIndex * VISUAL_TICKS_PER_SNAP;
  const half = Math.ceil(visibleCount / 2);
  const startIndex = Math.max(0, centerVisualIndex - half);
  const endIndex = Math.min(totalVisualSteps, centerVisualIndex + half);
  const leftSpacerWidth = startIndex * VISUAL_TICK_WIDTH;
  const rightSpacerWidth = (totalVisualSteps - endIndex) * VISUAL_TICK_WIDTH;

  const renderIndices: number[] = [];
  for (let i = startIndex; i <= endIndex; i += 1) {
    renderIndices.push(i);
  }

  const renderTickColumn = (visualIndex: number) => {
    const tickValue = parseFloat((min + visualIndex * step).toFixed(decimals));
    const kind = getTickKind(tickValue, majorStep);
    const label = kind === 'major' ? formatDisplayValue(tickValue, majorStep ?? 1) : '';

    return (
      <View key={visualIndex} style={styles.tickColumn}>
        <View style={styles.tickSlot}>
          <TickMark kind={kind} />
        </View>
        <View style={styles.labelRowSlot}>
          {label ? <TickLabel label={label} /> : null}
        </View>
      </View>
    );
  };

  const displayValue = formatDisplayValue(value, step);

  return (
    <View style={styles.container}>
      <Text style={styles.valueText}>
        {displayValue}
        {unit ? <Text style={styles.unitText}> {unit}</Text> : null}
      </Text>
      <View style={styles.triangleRow}>
        <View style={styles.centerTriangle} />
      </View>
      <View style={styles.rulerContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: centerOffset }]}
        >
          <View style={styles.ticksTrack}>
            {leftSpacerWidth > 0 ? <View style={{ width: leftSpacerWidth }} /> : null}
            {renderIndices.map(renderTickColumn)}
            {rightSpacerWidth > 0 ? <View style={{ width: rightSpacerWidth }} /> : null}
          </View>
        </ScrollView>

        <LinearGradient
          pointerEvents="none"
          colors={[EDGE_FADE_COLOR, EDGE_FADE_TRANSPARENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftEdgeFade}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[EDGE_FADE_TRANSPARENT, EDGE_FADE_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightEdgeFade}
        />

        <View style={styles.centerLine} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  valueText: {
    fontWeight: 'bold',
    fontSize: 32,
    color: '#333333',
    lineHeight: 40,
    marginBottom: 4,
    textAlign: 'center',
  },
  unitText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#666666',
  },
  triangleRow: {
    width: RULER_WIDTH,
    alignItems: 'center',
    marginBottom: TRIANGLE_TO_TICK_GAP,
  },
  centerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: CENTER_TRIANGLE_WIDTH / 2,
    borderRightWidth: CENTER_TRIANGLE_WIDTH / 2,
    borderTopWidth: CENTER_TRIANGLE_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#6D925E',
  },
  rulerContainer: {
    width: RULER_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollView: {
    width: RULER_WIDTH,
    overflow: 'visible',
  },
  leftEdgeFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: EDGE_FADE_WIDTH,
    height: TICK_TRACK_HEIGHT,
    zIndex: 3,
  },
  rightEdgeFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: EDGE_FADE_WIDTH,
    height: TICK_TRACK_HEIGHT,
    zIndex: 3,
  },
  scrollContent: {
    alignItems: 'flex-start',
    paddingBottom: 2,
  },
  ticksTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'visible',
    minHeight: TICK_TRACK_HEIGHT + LABEL_ROW_HEIGHT + 8,
  },
  tickColumn: {
    width: VISUAL_TICK_WIDTH,
    overflow: 'visible',
    alignItems: 'center',
    zIndex: 1,
  },
  tickSlot: {
    width: VISUAL_TICK_WIDTH,
    height: TICK_TRACK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tickMark: {
    width: 1,
    backgroundColor: TICK_COLOR,
  },
  labelRowSlot: {
    marginTop: 8,
    height: LABEL_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tickLabel: {
    width: LABEL_WIDTH,
    fontSize: 15,
    color: '#999999',
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    left: RULER_WIDTH / 2 - CENTER_LINE_WIDTH / 2,
    width: CENTER_LINE_WIDTH,
    height: MAJOR_TICK_HEIGHT,
    backgroundColor: '#6D925E',
    borderRadius: 1,
    zIndex: 5,
  },
});
