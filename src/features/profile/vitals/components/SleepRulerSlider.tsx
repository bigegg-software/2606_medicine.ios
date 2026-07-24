import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const RULER_WIDTH = 277;
const RULER_TRACK_WIDTH = RULER_WIDTH;
const TICK_COLOR = '#E4E4E4';
const ACCENT_COLOR = '#6D925E';
const EDGE_FADE_WIDTH = 30;
const EDGE_FADE_COLOR = '#FAF9FA';
const EDGE_FADE_TRANSPARENT = 'rgba(250, 249, 250, 0)';
const TICK_TRACK_HEIGHT = 24;
const LABEL_ROW_HEIGHT = 24;
const VISUAL_TICK_WIDTH = 10;
const SUBDIVISIONS_PER_UNIT = 6;
const VISUAL_TICKS_PER_SNAP = SUBDIVISIONS_PER_UNIT / 2;

const TICK_KINDS = ['major', 'minor', 'minor', 'medium', 'minor', 'minor'] as const;
type TickKind = (typeof TICK_KINDS)[number];

const TICK_HEIGHT: Record<TickKind, number> = {
  major: 24,
  medium: 18,
  minor: 14,
};

const CENTER_LINE_WIDTH = 3;
const CENTER_TRIANGLE_WIDTH = 10;
const CENTER_TRIANGLE_HEIGHT = 6;
const TRIANGLE_TO_TICK_GAP = 8;

export type SleepRulerSliderProps = {
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
  unit?: string;
  formatLabel?: (value: number) => string;
  formatDisplay?: (value: number) => string;
  patternUnitSize?: number;
  /** 是否展示顶部大数字，目标设置弹窗开启 */
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

function resolvePatternUnitSize(step: number, patternUnitSize?: number) {
  if (patternUnitSize != null) return patternUnitSize;
  return SUBDIVISIONS_PER_UNIT * (step / VISUAL_TICKS_PER_SNAP);
}

function getTickKind(visualIndex: number): TickKind {
  return TICK_KINDS[((visualIndex % SUBDIVISIONS_PER_UNIT) + SUBDIVISIONS_PER_UNIT) % SUBDIVISIONS_PER_UNIT];
}

function getSnapScrollX(snapIndex: number) {
  return snapIndex * VISUAL_TICKS_PER_SNAP * VISUAL_TICK_WIDTH;
}

function getMajorLabelText(value: number, formatLabel?: (value: number) => string) {
  return formatLabel ? formatLabel(value) : String(Math.round(value));
}

function getMajorLabelWidth(
  min: number,
  max: number,
  patternUnitSize: number,
  formatLabel?: (value: number) => string,
) {
  let maxLabelLen = 1;
  for (let value = min; value <= max + 1e-9; value += patternUnitSize) {
    maxLabelLen = Math.max(maxLabelLen, getMajorLabelText(value, formatLabel).length);
  }
  // fontSize 15 下数字约 9–10px，需给足宽度避免「20000」被裁成「200..」
  return Math.max(48, maxLabelLen * 10 + 12);
}

function formatValueText(
  value: number,
  step: number,
  formatDisplay?: (value: number) => string,
) {
  if (formatDisplay) return formatDisplay(value);
  const decimals = getDecimalPlaces(step);
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function TickMark({ kind }: { kind: TickKind }) {
  return (
    <View
      style={[
        styles.tickMark,
        { height: TICK_HEIGHT[kind] },
      ]}
    />
  );
}

function MajorTickLabel({
  value,
  formatLabel,
  labelWidth,
}: {
  value: number;
  formatLabel?: (value: number) => string;
  labelWidth: number;
}) {
  const label = getMajorLabelText(value, formatLabel);
  return (
    <View
      style={[
        styles.labelSlot,
        {
          width: labelWidth,
          left: (VISUAL_TICK_WIDTH - labelWidth) / 2,
        },
      ]}>
      <Text style={styles.tickLabel}>{label}</Text>
    </View>
  );
}

const SleepRulerSlider: React.FC<SleepRulerSliderProps> = ({
  min = 1,
  max = 3,
  step = 0.5,
  initialValue = 2,
  unit,
  formatLabel,
  formatDisplay,
  patternUnitSize: patternUnitSizeProp,
  showValue = false,
  onValueChange,
}) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const ticking = useRef(false);
  const centerOffset = RULER_TRACK_WIDTH / 2 - VISUAL_TICK_WIDTH / 2;

  const patternUnitSize = resolvePatternUnitSize(step, patternUnitSizeProp);
  const majorLabelWidth = getMajorLabelWidth(min, max, patternUnitSize, formatLabel);
  const visualStep = patternUnitSize / SUBDIVISIONS_PER_UNIT;
  const totalSnapSteps = Math.round((max - min) / step);
  const totalVisualSteps = totalSnapSteps * VISUAL_TICKS_PER_SNAP;
  const maxScrollX = getSnapScrollX(totalSnapSteps);
  const snapPixelWidth = VISUAL_TICKS_PER_SNAP * VISUAL_TICK_WIDTH;

  const snapToStepValue = (val: number) => snapToStep(val, min, max, step);

  const [value, setValue] = useState<number>(() => snapToStepValue(initialValue));

  const calculateValueFromX = (x: number) => {
    const bounded = Math.max(0, Math.min(x, maxScrollX));
    const snapIndex = Math.round(bounded / snapPixelWidth);
    const nextValue = min + snapIndex * step;
    return parseFloat(nextValue.toFixed(getDecimalPlaces(step)));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    if (ticking.current) {
      return;
    }
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

  const visibleCount = Math.ceil(RULER_TRACK_WIDTH / VISUAL_TICK_WIDTH) + 10;
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
    const tickValue = parseFloat((min + visualIndex * visualStep).toFixed(getDecimalPlaces(visualStep)));
    const kind = getTickKind(visualIndex);
    const isMajor = kind === 'major';
    // 靠近尺左右边缘的大刻度数字易被 overflow 裁切，直接不渲染
    const labelCenterX =
      (visualIndex - centerVisualIndex) * VISUAL_TICK_WIDTH + RULER_TRACK_WIDTH / 2;
    const labelHalf = majorLabelWidth / 2;
    const labelVisible =
      labelCenterX - labelHalf >= -4 && labelCenterX + labelHalf <= RULER_TRACK_WIDTH + 4;

    return (
      <View key={visualIndex} style={styles.tickColumn}>
        <View style={styles.tickSlot}>
          <TickMark kind={kind} />
        </View>
        <View style={styles.labelRowSlot}>
          {isMajor && labelVisible ? (
            <MajorTickLabel value={tickValue} formatLabel={formatLabel} labelWidth={majorLabelWidth} />
          ) : null}
        </View>
      </View>
    );
  };

  const displayValue = formatValueText(value, step, formatDisplay);

  return (
    <View style={styles.container}>
      {showValue ? (
        <Text style={styles.valueText}>
          {displayValue}
          {unit ? <Text style={styles.unitText}> {unit}</Text> : null}
        </Text>
      ) : null}
      <View style={styles.triangleRow}>
        <View style={styles.centerTriangle} />
      </View>
      <View style={styles.rulerContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: centerOffset }]}>
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
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: RULER_WIDTH,
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'visible',
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
    borderTopColor: ACCENT_COLOR,
  },
  rulerContainer: {
    width: '100%',
    maxWidth: RULER_WIDTH,
    position: 'relative',
    overflow: 'visible',
  },
  scrollView: {
    width: RULER_TRACK_WIDTH,
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
    width: VISUAL_TICK_WIDTH,
    height: LABEL_ROW_HEIGHT,
    marginTop: 8,
    overflow: 'visible',
    zIndex: 2,
  },
  labelSlot: {
    position: 'absolute',
    top: 0,
    height: LABEL_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tickLabel: {
    fontSize: 15,
    color: '#999999',
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    left: RULER_TRACK_WIDTH / 2 - CENTER_LINE_WIDTH / 2,
    width: CENTER_LINE_WIDTH,
    height: TICK_HEIGHT.major,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 1,
    zIndex: 4,
  },
});

export default SleepRulerSlider;
