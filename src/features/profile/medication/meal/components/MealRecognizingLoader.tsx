import React, { useEffect, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    type SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const SCAN_DURATION = 2131;
const SCAN_EASING = Easing.bezier(0.42, 0, 0.58, 1);
const ICON_WIDTH = 16;
const ICON_HEIGHT = 12;
const CHAR_WIDTH_EST = 16;
const BOUNCE_HEIGHT = 8;
const SINK_HEIGHT = 9;
const ICON_LEAD_GAP = 4;
const ICON_TRAIL_GAP = 4;
const SCAN_TEXT = '正在识别营养成分';

type CharLayout = { x: number; width: number; center: number };

function getAnchorIconX(
    anchorIndex: number,
    total: number,
    centers: number[] | null,
    firstLeft: number,
    lastRight: number,
) {
    'worklet';
    if (anchorIndex <= 0) {
        if (firstLeft >= 0) {
            return firstLeft - ICON_LEAD_GAP - ICON_WIDTH;
        }
        return -ICON_WIDTH - ICON_LEAD_GAP;
    }
    if (anchorIndex <= total) {
        const center = centers
            ? centers[anchorIndex - 1]
            : (anchorIndex - 1) * CHAR_WIDTH_EST + CHAR_WIDTH_EST / 2;
        return center - ICON_WIDTH / 2;
    }
    if (lastRight >= 0) {
        return lastRight + ICON_TRAIL_GAP;
    }
    return total * CHAR_WIDTH_EST + ICON_TRAIL_GAP;
}

function getIconX(
    progress: number,
    total: number,
    centers: number[] | null,
    firstLeft: number,
    lastRight: number,
) {
    'worklet';
    const segmentCount = total + 1;
    const clamped = Math.min(Math.max(progress, 0), segmentCount);
    const idx = Math.min(Math.floor(clamped), segmentCount - 1);
    const frac = clamped - idx;
    const fromX = getAnchorIconX(idx, total, centers, firstLeft, lastRight);
    const toX = getAnchorIconX(idx + 1, total, centers, firstLeft, lastRight);
    return fromX + (toX - fromX) * frac;
}

function getIconOpacity(progress: number, total: number) {
    'worklet';
    if (progress >= total) {
        return interpolate(progress, [total, total + 1], [1, 0], Extrapolation.CLAMP);
    }
    return 1;
}

function ScanIcon() {
    return (
        <Svg width={ICON_WIDTH} height={ICON_HEIGHT} viewBox="0 0 16 12" fill="none">
            <Path
                d="M4.72217 4.517V2.6178L10.3171 6.2622L15.5527 2.6178V11.8058H13.7049V5.9029L10.3171 8.21273L4.72217 4.517Z"
                fill="#6B6F7A"
            />
            <Path
                d="M1.95053 0H0V11.8058H7.69945V10.0606H1.95053V0Z"
                fill="#012257"
            />
        </Svg>
    );
}

function ScanChar({
    char,
    index,
    total,
    scan,
    onLayout,
}: {
    char: string;
    index: number;
    total: number;
    scan: SharedValue<number>;
    onLayout: (event: LayoutChangeEvent) => void;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const progress = scan.value;
        const distance = Math.abs(progress - (index + 1));
        const window = 0.6;
        const sink =
            progress > 0 && progress <= total && distance < window
                ? interpolate(distance, [0, window], [SINK_HEIGHT, 0])
                : 0;
        return {
            transform: [{ translateY: sink }],
        };
    });

    return (
        <View collapsable={false} onLayout={onLayout}>
            <Animated.Text style={[styles.char, animatedStyle]}>{char}</Animated.Text>
        </View>
    );
}

function NutritionScanText() {
    const scan = useSharedValue(0);
    const rotation = useSharedValue(0);
    const charCenters = useSharedValue<number[]>(Array(SCAN_TEXT.length).fill(0));
    const firstCharLeft = useSharedValue(0);
    const lastCharRight = useSharedValue(0);
    const measuredCount = useSharedValue(0);
    const measuredIndices = useRef(new Set<number>());
    const layoutDataRef = useRef<CharLayout[]>(Array(SCAN_TEXT.length).fill({ x: 0, width: 0, center: 0 }));
    const chars = SCAN_TEXT.split('');
    const total = chars.length;
    const cycleEnd = total + 1;

    useEffect(() => {
        scan.value = withRepeat(
            withTiming(cycleEnd, { duration: SCAN_DURATION, easing: Easing.linear }),
            -1,
            false,
        );
        rotation.value = withRepeat(
            withTiming(1, { duration: SCAN_DURATION, easing: SCAN_EASING }),
            -1,
            false,
        );
    }, [cycleEnd, rotation, scan]);

    const onCharLayout = (index: number, event: LayoutChangeEvent) => {
        if (measuredIndices.current.has(index)) {
            return;
        }
        measuredIndices.current.add(index);

        const { x, width } = event.nativeEvent.layout;
        const layout = { x, width, center: x + width / 2 };
        layoutDataRef.current[index] = layout;
        charCenters.value = layoutDataRef.current.map((item) => item.center);

        if (measuredIndices.current.size === total) {
            firstCharLeft.value = layoutDataRef.current[0].x;
            lastCharRight.value =
                layoutDataRef.current[total - 1].x + layoutDataRef.current[total - 1].width;
            measuredCount.value = total;
        }
    };

    const scanIconPositionStyle = useAnimatedStyle(() => {
        const progress = Math.min(scan.value, cycleEnd);
        const segmentCount = total + 1;
        const idx = Math.min(Math.floor(Math.min(progress, segmentCount - 0.001)), segmentCount - 1);
        const frac = progress - idx;
        const bounceY = progress >= total ? 0 : -Math.sin(frac * Math.PI) * BOUNCE_HEIGHT;
        const useMeasured = measuredCount.value >= total;
        const x = getIconX(
            progress,
            total,
            useMeasured ? charCenters.value : null,
            useMeasured ? firstCharLeft.value : -1,
            useMeasured ? lastCharRight.value : -1,
        );

        return {
            opacity: getIconOpacity(progress, total),
            transform: [{ translateX: x }, { translateY: bounceY }],
        };
    });

    const scanIconRotationStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value * 360}deg` }],
    }));

    return (
        <View style={styles.scanRow}>
            <View style={styles.scanTrack}>
                <View style={styles.textLine}>
                    {chars.map((char, index) => (
                        <ScanChar
                            key={`${char}-${index}`}
                            char={char}
                            index={index}
                            total={total}
                            scan={scan}
                            onLayout={(event) => onCharLayout(index, event)}
                        />
                    ))}
                    <Animated.View style={[styles.scanIconWrap, scanIconPositionStyle]}>
                        <Animated.View style={[styles.scanIconInner, scanIconRotationStyle]}>
                            <ScanIcon />
                        </Animated.View>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

export default function MealRecognizingLoader() {
    return <NutritionScanText />;
}

const styles = StyleSheet.create({
    scanRow: {
        alignItems: 'center',
    },
    scanTrack: {
        position: 'relative',
        minHeight: 36,
        justifyContent: 'flex-end',
    },
    textLine: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        position: 'relative',
        paddingTop: 16,
        overflow: 'visible',
    },
    char: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333333',
        fontWeight: '500',
    },
    scanIconWrap: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: ICON_WIDTH,
        height: ICON_HEIGHT,
        zIndex: 3,
    },
    scanIconInner: {
        width: ICON_WIDTH,
        height: ICON_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
