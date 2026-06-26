import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, {
    ClipPath,
    Defs,
    Ellipse,
    FeGaussianBlur,
    Filter,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop,
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CUP_W = 147;
const CUP_H = 209;
const CUP_TOP = 8;
const CUP_BOTTOM = 209;
const RIM_CX = 73.5;
const RIM_CY = 12.5;
const RIM_RX = 73.5;
const RIM_RY = 12.5;
const LEFT_HIGHLIGHT_W = 4;
const LEFT_HIGHLIGHT_H = 108;
const LEFT_HIGHLIGHT_CX = 22.1203;
const LEFT_HIGHLIGHT_CY = 112.041;
const LEFT_HIGHLIGHT_X = LEFT_HIGHLIGHT_CX - LEFT_HIGHLIGHT_W / 2;
const LEFT_HIGHLIGHT_Y = LEFT_HIGHLIGHT_CY - LEFT_HIGHLIGHT_H / 2;

/** Group_437.svg — 杯身填充 */
const CUP_BODY_FILL =
    'M0.561264 15.5209C0.258283 11.461 3.47063 8 7.54185 8H139.421C143.506 8 146.723 11.4834 146.399 15.5555L132.832 185.984C131.798 198.98 120.949 209 107.911 209H38.2038C25.1185 209 14.247 198.91 13.2732 185.861L0.561264 15.5209Z';

/** Group_437.svg — 杯身侧壁描边（不含顶部横线，避免接缝） */
const CUP_SIDE_STROKE =
    'M7.54199 8.5C3.76168 8.5 0.778441 11.7136 1.05957 15.4834L13.7715 185.823C14.7258 198.611 25.3804 208.5 38.2041 208.5H107.911C120.688 208.5 131.32 198.681 132.334 185.944L145.9 15.5156C146.201 11.7346 143.214 8.50015 139.421 8.5';

/** 杯口与杯身连接侧壁 */
const CUP_NECK_CONNECTOR =
    'M5.96289 8.09863C9.63356 6.62274 14.9747 5.28298 21.6113 4.1543C34.8769 1.89824 53.2227 0.5 73.5 0.5C93.7773 0.5 112.123 1.89824 125.389 4.1543C132.025 5.28298 137.366 6.62274 141.037 8.09863L139.421 8H7.54185L5.96289 8.09863Z';

/** Group_437.svg — 杯口描边 */
const RIM_STROKE =
    'M73.5 0.5C93.7773 0.5 112.123 1.89824 125.389 4.1543C132.025 5.28298 137.366 6.62274 141.037 8.09863C142.875 8.83755 144.265 9.59896 145.188 10.3652C146.114 11.1357 146.5 11.8512 146.5 12.5C146.5 13.1488 146.114 13.8643 145.188 14.6348C144.265 15.401 142.875 16.1624 141.037 16.9014C137.366 18.3773 132.025 19.717 125.389 20.8457C112.123 23.1018 93.7773 24.5 73.5 24.5C53.2227 24.5 34.8769 23.1018 21.6113 20.8457C14.9747 19.717 9.63356 18.3773 5.96289 16.9014C4.12517 16.1624 2.7345 15.401 1.8125 14.6348C0.885503 13.8643 0.5 13.1488 0.5 12.5C0.5 11.8512 0.885503 11.1357 1.8125 10.3652C2.7345 9.59896 4.12517 8.83755 5.96289 8.09863C9.63356 6.62274 14.9747 5.28298 21.6113 4.1543C34.8769 1.89824 53.2227 0.5 73.5 0.5Z';

function clampPercent(value: number) {
    'worklet';
    return Math.min(100, Math.max(0, value));
}

function getWaterSurfaceY(fillPercent: number) {
    'worklet';
    const ratio = clampPercent(fillPercent) / 100;
    return CUP_BOTTOM - (CUP_BOTTOM - CUP_TOP) * ratio;
}

function buildWaveWaterPath(
    surfaceY: number,
    phase: number,
    amplitude: number,
    waveCount: number,
) {
    'worklet';
    if (surfaceY >= CUP_BOTTOM - 1) {
        return '';
    }

    const segments = 32;
    let path = '';
    for (let i = 0; i <= segments; i += 1) {
        const x = (CUP_W / segments) * i;
        const waveY =
            surfaceY + Math.sin((x / CUP_W) * Math.PI * waveCount + phase) * amplitude;
        path += i === 0 ? `M ${x} ${waveY}` : ` L ${x} ${waveY}`;
    }
    path += ` L ${CUP_W} ${CUP_BOTTOM} L 0 ${CUP_BOTTOM} Z`;
    return path;
}

export type WaterCupProps = {
    /** 液面高度 0–100 */
    fillPercent?: number;
};

export default function WaterCup({ fillPercent = 0 }: WaterCupProps) {
    const surfaceY = useSharedValue(getWaterSurfaceY(fillPercent));
    const wavePhase = useSharedValue(0);
    const waveAmplitude = useSharedValue(0);
    const prevFillRef = React.useRef(fillPercent);

    useEffect(() => {
        wavePhase.value = withRepeat(
            withTiming(Math.PI * 2, { duration: 2600, easing: Easing.linear }),
            -1,
            false,
        );
    }, [wavePhase]);

    useEffect(() => {
        const nextSurfaceY = getWaterSurfaceY(fillPercent);
        const delta = fillPercent - prevFillRef.current;
        prevFillRef.current = fillPercent;

        surfaceY.value = withSpring(nextSurfaceY, {
            damping: 16,
            stiffness: 110,
            mass: 0.85,
        });

        if (delta > 0) {
            waveAmplitude.value = withSequence(
                withTiming(5.5, { duration: 180, easing: Easing.out(Easing.quad) }),
                withSpring(2.4, { damping: 12, stiffness: 90 }),
            );
        } else if (delta < 0) {
            waveAmplitude.value = withSequence(
                withTiming(3.8, { duration: 140, easing: Easing.out(Easing.quad) }),
                withSpring(2.4, { damping: 14, stiffness: 100 }),
            );
        } else if (waveAmplitude.value === 0) {
            waveAmplitude.value = withTiming(2.4, { duration: 300 });
        }
    }, [fillPercent, surfaceY, waveAmplitude]);

    const mainWaterProps = useAnimatedProps(() => ({
        d: buildWaveWaterPath(surfaceY.value, wavePhase.value, waveAmplitude.value, 3),
        opacity: surfaceY.value >= CUP_BOTTOM - 1 ? 0 : 1,
    }));

    const rippleWaterProps = useAnimatedProps(() => ({
        d: buildWaveWaterPath(
            surfaceY.value + 1.5,
            wavePhase.value + Math.PI * 0.55,
            waveAmplitude.value * 0.55,
            4,
        ),
        opacity: surfaceY.value >= CUP_BOTTOM - 1 ? 0 : 0.42,
    }));

    return (
        <View style={styles.wrap}>
            <Svg width={CUP_W} height={CUP_H} viewBox={`0 0 ${CUP_W} ${CUP_H}`}>
                <Defs>
                    <ClipPath id="waterCupClip">
                        <Path d={CUP_BODY_FILL} />
                        <Path d={CUP_NECK_CONNECTOR} />
                    </ClipPath>
                    <LinearGradient
                        id="waterCupBodyGradient"
                        x1={0}
                        y1={108.5}
                        x2={CUP_W}
                        y2={108.5}
                        gradientUnits="userSpaceOnUse">
                        <Stop stopColor="#D4EBFF" />
                        <Stop offset={0.709408} stopColor="#FFFFFF" />
                        <Stop offset={1} stopColor="#DDEFFF" />
                    </LinearGradient>
                    <LinearGradient
                        id="cupNeckGradient"
                        x1={RIM_CX}
                        y1={0}
                        x2={RIM_CX}
                        y2={26}
                        gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor="#EAF5FF" />
                        <Stop offset="100%" stopColor="#D4EBFF" />
                    </LinearGradient>
                    <LinearGradient
                        id="waterFillGradient"
                        x1={0}
                        y1={CUP_TOP}
                        x2={0}
                        y2={CUP_BOTTOM}
                        gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor="#7EC8FF" />
                        <Stop offset="100%" stopColor="#3D9EEF" />
                    </LinearGradient>
                    <RadialGradient
                        id="cupRightHighlight"
                        gradientUnits="userSpaceOnUse"
                        cx={98}
                        cy={109}
                        rx={38}
                        ry={68}
                        fx={98}
                        fy={109}>
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.38} />
                        <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.28} />
                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                    </RadialGradient>
                    <Filter
                        id="cupLeftHighlightBlur"
                        x="-200%"
                        y="-20%"
                        width="500%"
                        height="140%">
                        <FeGaussianBlur in="SourceGraphic" stdDeviation={4} />
                    </Filter>
                </Defs>

                {/* 杯身 */}
                <Path d={CUP_BODY_FILL} fill="url(#waterCupBodyGradient)" />

                {/* 杯口内腔 + 颈部连接 */}
                <Path d={CUP_NECK_CONNECTOR} fill="url(#cupNeckGradient)" />
                <Ellipse cx={RIM_CX} cy={RIM_CY} rx={RIM_RX} ry={RIM_RY} fill="#D8ECFC" />

                {/* 水体 */}
                <G clipPath="url(#waterCupClip)">
                    <AnimatedPath animatedProps={mainWaterProps} fill="url(#waterFillGradient)" />
                    <AnimatedPath animatedProps={rippleWaterProps} fill="#A8DCFF" />
                </G>

                {/* 结构描边：侧壁 + 杯口，不含顶部横切线 */}
                <Path
                    d={CUP_SIDE_STROKE}
                    stroke="#C7DAFF"
                    strokeOpacity={0.28}
                    fill="none"
                />
                <Path
                    d={RIM_STROKE}
                    stroke="#C7DAFF"
                    strokeWidth={0.6}
                    fill="none"
                />

                {/* 高光 */}
                <G clipPath="url(#waterCupClip)">
                    <Ellipse cx={98} cy={109} rx={38} ry={68} fill="url(#cupRightHighlight)" />
                    <G rotation={-5.45547} origin={`${LEFT_HIGHLIGHT_CX}, ${LEFT_HIGHLIGHT_CY}`}>
                        <Rect
                            x={LEFT_HIGHLIGHT_X}
                            y={LEFT_HIGHLIGHT_Y}
                            width={LEFT_HIGHLIGHT_W}
                            height={LEFT_HIGHLIGHT_H}
                            fill="#FFFFFF"
                            filter="url(#cupLeftHighlightBlur)"
                        />
                    </G>
                </G>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
    },
});
