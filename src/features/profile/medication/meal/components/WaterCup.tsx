import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

const CUP_W = 147;
const CUP_H = 209;
const CUP_TOP = 8;
const CUP_BOTTOM = 209;
const WATER_REF_SURFACE_Y = 132;

/** Group_437.svg — 杯身填充 */
const CUP_BODY_FILL =
    'M0.561264 15.5209C0.258283 11.461 3.47063 8 7.54185 8H139.421C143.506 8 146.723 11.4834 146.399 15.5555L132.832 185.984C131.798 198.98 120.949 209 107.911 209H38.2038C25.1185 209 14.247 198.91 13.2732 185.861L0.561264 15.5209Z';

/** Group_437.svg — 杯身边框 */
const CUP_BODY_STROKE =
    'M7.54199 8.5H139.421C143.214 8.50015 146.201 11.7346 145.9 15.5156L132.334 185.944C131.32 198.681 120.688 208.5 107.911 208.5H38.2041C25.3804 208.5 14.7258 198.611 13.7715 185.823L1.05957 15.4834C0.778441 11.7136 3.76168 8.5 7.54199 8.5Z';

/** Group_437.svg — 杯口描边 */
const RIM_STROKE =
    'M73.5 0.5C93.7773 0.5 112.123 1.89824 125.389 4.1543C132.025 5.28298 137.366 6.62274 141.037 8.09863C142.875 8.83755 144.265 9.59896 145.188 10.3652C146.114 11.1357 146.5 11.8512 146.5 12.5C146.5 13.1488 146.114 13.8643 145.188 14.6348C144.265 15.401 142.875 16.1624 141.037 16.9014C137.366 18.3773 132.025 19.717 125.389 20.8457C112.123 23.1018 93.7773 24.5 73.5 24.5C53.2227 24.5 34.8769 23.1018 21.6113 20.8457C14.9747 19.717 9.63356 18.3773 5.96289 16.9014C4.12517 16.1624 2.7345 15.401 1.8125 14.6348C0.885503 13.8643 0.5 13.1488 0.5 12.5C0.5 11.8512 0.885503 11.1357 1.8125 10.3652C2.7345 9.59896 4.12517 8.83755 5.96289 8.09863C9.63356 6.62274 14.9747 5.28298 21.6113 4.1543C34.8769 1.89824 53.2227 0.5 73.5 0.5Z';

function clampPercent(value: number) {
    return Math.min(100, Math.max(0, value));
}

function getWaterSurfaceY(fillPercent: number) {
    const ratio = clampPercent(fillPercent) / 100;
    return CUP_BOTTOM - (CUP_BOTTOM - CUP_TOP) * ratio;
}

function buildFullWaterPath() {
    return `M0 ${CUP_TOP} H${CUP_W} V${CUP_BOTTOM} H0 Z`;
}

/** Group_437.svg Vector 27 — 液面随 surfaceY 平移 */
function buildWaterPath(surfaceY: number) {
    const dy = surfaceY - WATER_REF_SURFACE_Y;
    const y = (base: number) => base + dy;
    return [
        `M151.5 ${y(132)}V212H11`,
        `L5 ${y(132)}`,
        `C5 ${y(132)} 29.0637 ${y(138.5)} 43.3667 ${y(138.5)}`,
        `C57.6696 ${y(138.5)} 64.428 ${y(131.012)} 78.25 ${y(132)}`,
        `C93.4549 ${y(133.087)} 100.572 ${y(145.5)} 114.875 ${y(145.5)}`,
        `C129.178 ${y(145.5)} 151.5 ${y(132)} 151.5 ${y(132)}Z`,
    ].join('');
}

export type WaterCupProps = {
    /** 液面高度 0–100 */
    fillPercent?: number;
};

export default function WaterCup({ fillPercent = 38 }: WaterCupProps) {
    const percent = clampPercent(fillPercent);
    const waterPath = useMemo(() => {
        if (percent <= 0) return null;
        if (percent >= 100) return buildFullWaterPath();
        return buildWaterPath(getWaterSurfaceY(percent));
    }, [percent]);

    return (
        <View style={styles.wrap}>
            <Svg width={CUP_W} height={CUP_H} viewBox={`0 0 ${CUP_W} ${CUP_H}`}>
                <Defs>
                    <ClipPath id="waterCupClip">
                        <Path d={CUP_BODY_FILL} />
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
                    <RadialGradient
                        id="cupRightHighlight"
                        gradientUnits="userSpaceOnUse"
                        cx={98}
                        cy={109}
                        rx={38}
                        ry={68}
                        fx={98}
                        fy={109}>
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.92} />
                        <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.82} />
                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                    </RadialGradient>
                    <LinearGradient
                        id="cupLeftHighlight"
                        gradientUnits="userSpaceOnUse"
                        x1={12}
                        y1={112.041}
                        x2={32}
                        y2={112.041}>
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
                        <Stop offset="30%" stopColor="#FFFFFF" stopOpacity={0.1} />
                        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.58} />
                        <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.1} />
                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                    </LinearGradient>
                </Defs>

                <Path d={CUP_BODY_FILL} fill="url(#waterCupBodyGradient)" />
                <Path
                    d={CUP_BODY_STROKE}
                    stroke="#C7DAFF"
                    strokeOpacity={0.28}
                    fill="none"
                />

                {waterPath && (
                    <G clipPath="url(#waterCupClip)">
                        <Path d={waterPath} fill="#55B3FF" />
                    </G>
                )}

                <Ellipse cx={73.5} cy={12.5} rx={73.5} ry={12.5} fill="#D8ECFC" />
                <Path d={RIM_STROKE} stroke="#C7DAFF" fill="none" />

                <G clipPath="url(#waterCupClip)">
                    <Ellipse cx={98} cy={109} rx={38} ry={68} fill="url(#cupRightHighlight)" />
                    <G rotation={-5.45547} origin="22.1203, 112.041">
                        <Ellipse cx={22.1203} cy={112.041} rx={8} ry={58} fill="url(#cupLeftHighlight)" />
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
