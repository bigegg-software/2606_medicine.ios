import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const MAJOR_TICK_HEIGHT = 24;
const MINOR_TICK_HEIGHT = 18;
const CENTER_LINE_WIDTH = 3;
const CENTER_TRIANGLE_WIDTH = 10;
const CENTER_TRIANGLE_HEIGHT = 6;
const TRIANGLE_TO_TICK_GAP = 8;
const LABEL_WIDTH = 40;
/** 小量程（如 0–10）刻度间距 */
const SMALL_RANGE_TICK_WIDTH = 44;

type TickKind = 'major' | 'minor';

export type QuestionnaireRulerSliderProps = {
  min?: number;
  max?: number;
  step?: number;
  /** 大刻度间隔；不传时沿用 1–100 百分比刻度规则 */
  majorStep?: number;
  /** 相邻刻度间距（像素），默认 10 */
  tickWidth?: number;
  initialValue?: number;
  unit?: string;
  /** 是否展示顶部数值，默认 true */
  showValue?: boolean;
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
  tickWidth: tickWidthProp,
  initialValue = 50,
  unit,
  showValue = true,
  onValueChange,
}: QuestionnaireRulerSliderProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const valueRef = useRef(0);
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  const totalSnapSteps = Math.round((max - min) / step);
  const tickCount = totalSnapSteps + 1;
  const lastTickIndex = totalSnapSteps;
  const isSmallRange = totalSnapSteps <= 20;
  const tickWidth = tickWidthProp
    ?? (isSmallRange ? SMALL_RANGE_TICK_WIDTH : VISUAL_TICK_WIDTH);
  const centerOffset = RULER_WIDTH / 2 - tickWidth / 2;
  const maxScrollX = totalSnapSteps * tickWidth;
  const decimals = getDecimalPlaces(step);

  const snapToStepValue = useCallback(
    (val: number) => snapToStep(val, min, max, step),
    [min, max, step],
  );

  const [value, setValue] = useState<number>(() => snapToStepValue(initialValue));
  valueRef.current = value;

  /** 大量程窗口中心；小量程直接渲染全部刻度 */
  const [windowCenter, setWindowCenter] = useState(() =>
    Math.round((snapToStepValue(initialValue) - min) / step),
  );

  const valueFromX = useCallback((x: number) => {
    const bounded = Math.max(0, Math.min(x, maxScrollX));
    const snapIndex = Math.round(bounded / tickWidth);
    return parseFloat((min + snapIndex * step).toFixed(decimals));
  }, [decimals, maxScrollX, min, step, tickWidth]);

  const scrollXFromValue = useCallback((val: number) => {
    const snapIndex = Math.round((snapToStepValue(val) - min) / step);
    return Math.max(0, Math.min(snapIndex * tickWidth, maxScrollX));
  }, [maxScrollX, min, snapToStepValue, step, tickWidth]);

  const commitValue = useCallback((next: number) => {
    const snapped = snapToStepValue(next);
    setValue(snapped);
    valueRef.current = snapped;
    onValueChangeRef.current?.(snapped);
  }, [snapToStepValue]);

  const alignToNearest = useCallback((x: number) => {
    const next = valueFromX(x);
    const alignedX = scrollXFromValue(next);
    commitValue(next);
    if (!isSmallRange) {
      setWindowCenter(Math.round((next - min) / step));
    }
    if (Math.abs(alignedX - x) > 0.5) {
      scrollRef.current?.scrollTo({ x: alignedX, animated: true });
    }
  }, [commitValue, isSmallRange, min, scrollXFromValue, step, valueFromX]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const next = valueFromX(x);
    if (Math.abs(next - valueRef.current) > 1e-9) {
      valueRef.current = next;
      setValue(next);
    }
    if (!isSmallRange) {
      const centerIdx = Math.round(Math.max(0, Math.min(x, maxScrollX)) / tickWidth);
      setWindowCenter(prev => (Math.abs(centerIdx - prev) >= 8 ? centerIdx : prev));
    }
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityX = event.nativeEvent.velocity?.x ?? 0;
    // 有惯性时交给 onMomentumScrollEnd，避免打断滑动
    if (Math.abs(velocityX) > 0.05) return;
    alignToNearest(event.nativeEvent.contentOffset.x);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    alignToNearest(event.nativeEvent.contentOffset.x);
  };

  useEffect(() => {
    const x = scrollXFromValue(initialValue);
    const rafId = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x, animated: false });
    });
    return () => cancelAnimationFrame(rafId);
    // 仅挂载时定位
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { startIndex, endIndex, leftSpacerWidth, rightSpacerWidth } = useMemo(() => {
    if (isSmallRange) {
      return {
        startIndex: 0,
        endIndex: lastTickIndex,
        leftSpacerWidth: 0,
        rightSpacerWidth: 0,
      };
    }
    const visibleCount = Math.ceil(RULER_WIDTH / tickWidth) + 24;
    const half = Math.ceil(visibleCount / 2);
    const start = Math.max(0, windowCenter - half);
    const end = Math.min(lastTickIndex, windowCenter + half);
    return {
      startIndex: start,
      endIndex: end,
      leftSpacerWidth: start * tickWidth,
      rightSpacerWidth: (lastTickIndex - end) * tickWidth,
    };
  }, [isSmallRange, lastTickIndex, tickWidth, windowCenter]);

  const renderIndices = useMemo(() => {
    const list: number[] = [];
    for (let i = startIndex; i <= endIndex; i += 1) list.push(i);
    return list;
  }, [endIndex, startIndex]);

  const renderTickColumn = (visualIndex: number) => {
    const tickValue = parseFloat((min + visualIndex * step).toFixed(decimals));
    const kind = getTickKind(tickValue, majorStep);
    const label = kind === 'major' ? formatDisplayValue(tickValue, majorStep ?? 1) : '';

    return (
      <View key={visualIndex} style={[styles.tickColumn, { width: tickWidth }]}>
        <View style={[styles.tickSlot, { width: tickWidth }]}>
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
      {showValue ? (
        <Text style={styles.valueText}>
          {displayValue}
          {unit ? <Text style={styles.unitText}> {unit}</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.triangleRow, !showValue ? { marginTop: 8 } : null]}>
        <View style={styles.centerTriangle} />
      </View>
      <View style={styles.rulerContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: centerOffset }]}
        >
          <View style={[styles.ticksTrack, { width: tickCount * tickWidth }]}>
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
    minHeight: TICK_TRACK_HEIGHT + LABEL_ROW_HEIGHT + 8,
  },
  tickColumn: {
    overflow: 'visible',
    alignItems: 'center',
    zIndex: 1,
  },
  tickSlot: {
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
