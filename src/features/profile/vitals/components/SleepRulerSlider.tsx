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
const TRACK_COLOR = 'rgba(79,134,238,0.14)';
const EDGE_FADE_WIDTH = 30;
const EDGE_FADE_COLOR = '#FAF9FA';
const EDGE_FADE_TRANSPARENT = 'rgba(250, 249, 250, 0)';
const TICK_TRACK_HEIGHT = 30;
const LABEL_ROW_HEIGHT = 20;
const VISUAL_TICK_WIDTH = 10;
const SUBDIVISIONS_PER_UNIT = 6;
const VISUAL_TICKS_PER_SNAP = SUBDIVISIONS_PER_UNIT / 2;

const TICK_KINDS = ['major', 'minor', 'minor', 'medium', 'minor', 'minor'] as const;
type TickKind = (typeof TICK_KINDS)[number];

const TICK_HEIGHT: Record<TickKind, number> = {
  major: 16,
  medium: 10,
  minor: 7,
};

const CENTER_LINE_WIDTH = 3;
const CENTER_LINE_HEIGHT = 20;

const TICK_GRADIENT = {
  colors: ['rgba(79,134,238,0)', '#FFFFFF', '#FFFFFF', '#FFFFFF', 'rgba(79,134,238,0)'] as const,
  locations: [0, 0.1, 0.5, 0.9, 1] as const,
};

interface SleepRulerSliderProps {
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
  formatLabel?: (value: number) => string;
  patternUnitSize?: number;
  onValueChange?: (value: number) => void;
}

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
  return Math.max(32, maxLabelLen * 8 + 6);
}

function TickMark({ kind }: { kind: TickKind }) {
  return (
    <LinearGradient
      colors={[...TICK_GRADIENT.colors]}
      locations={[...TICK_GRADIENT.locations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.tickGradient, { height: TICK_HEIGHT[kind] }]}
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
          marginLeft: (VISUAL_TICK_WIDTH - labelWidth) / 2,
        },
      ]}>
      <Text style={styles.tickLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const SleepRulerSlider: React.FC<SleepRulerSliderProps> = ({
  min = 1,
  max = 3,
  step = 0.5,
  initialValue = 2,
  formatLabel,
  patternUnitSize: patternUnitSizeProp,
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

    return (
      <View key={visualIndex} style={styles.tickColumn}>
        <View style={styles.tickSlot}>
          <TickMark kind={kind} />
        </View>
        <View style={styles.labelRowSlot}>
          {isMajor ? (
            <MajorTickLabel value={tickValue} formatLabel={formatLabel} labelWidth={majorLabelWidth} />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rulerContainer}>
        <View style={styles.trackFrame} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
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
    overflow: 'visible',
  },
  rulerContainer: {
    width: '100%',
    maxWidth: RULER_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  trackFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RULER_TRACK_WIDTH,
    height: TICK_TRACK_HEIGHT,
    backgroundColor: TRACK_COLOR,
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
    justifyContent: 'center',
  },
  tickGradient: {
    width: 1,
  },
  labelRowSlot: {
    width: VISUAL_TICK_WIDTH,
    height: LABEL_ROW_HEIGHT,
    marginTop: 8,
    overflow: 'visible',
    alignItems: 'center',
    zIndex: 2,
  },
  labelSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickLabel: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
  },
  centerLine: {
    position: 'absolute',
    top: TICK_TRACK_HEIGHT / 2 - CENTER_LINE_HEIGHT / 2,
    left: RULER_TRACK_WIDTH / 2 - CENTER_LINE_WIDTH / 2,
    width: CENTER_LINE_WIDTH,
    height: CENTER_LINE_HEIGHT,
    backgroundColor: '#4F86EE',
    borderRadius: 1,
    zIndex: 4,
  },
});

export default SleepRulerSlider;
