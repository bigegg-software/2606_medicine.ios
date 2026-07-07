import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import styles from '@/css/vitals/bloodPage';

const RING_SIZE = 50;
const STROKE_WIDTH = 6;
const STROKE_INSET = STROKE_WIDTH / 2;
const CANVAS_SIZE = RING_SIZE + STROKE_INSET * 2;
const TRACK_COLOR = 'rgba(131,174,255,0.14)';
const PROGRESS_COLOR = '#6D925E';

const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CANVAS_CENTER = CANVAS_SIZE / 2;
const TIP_DOT_SIZE = 4;
const TIP_DOT_RADIUS = TIP_DOT_SIZE / 2;

function getProgressTipPosition(progress: number) {
    const angleRad = ((-90 + (360 * progress) / 100) * Math.PI) / 180;
    return {
        x: CANVAS_CENTER + RING_RADIUS * Math.cos(angleRad),
        y: CANVAS_CENTER + RING_RADIUS * Math.sin(angleRad),
    };
}

type VitalsProgressRingProps = {
    progress: number;
};

export default function VitalsProgressRing({ progress }: VitalsProgressRingProps) {
    const value = Math.min(100, Math.max(0, Math.round(progress)));
    const tipPosition = useMemo(() => getProgressTipPosition(value), [value]);
    const progressSweep = value >= 100 ? 360 : (360 * value) / 100;

    const progressPath = useMemo(() => {
        const path = Skia.Path.Make();
        path.addArc(
            {
                x: CANVAS_CENTER - RING_RADIUS,
                y: CANVAS_CENTER - RING_RADIUS,
                width: RING_RADIUS * 2,
                height: RING_RADIUS * 2,
            },
            -90,
            progressSweep,
        );
        return path;
    }, [progressSweep]);

    return (
        <View style={styles.progressRing}>
            <Canvas style={ringStyles.canvas}>
                <Circle
                    cx={CANVAS_CENTER}
                    cy={CANVAS_CENTER}
                    r={RING_RADIUS}
                    color={TRACK_COLOR}
                    style="stroke"
                    strokeWidth={STROKE_WIDTH}
                />
                {value > 0 ? (
                    <Path
                        path={progressPath}
                        color={PROGRESS_COLOR}
                        style="stroke"
                        strokeWidth={STROKE_WIDTH}
                        strokeCap="round"
                    />
                ) : null}
                {value > 0 ? (
                    <Circle
                        cx={tipPosition.x}
                        cy={tipPosition.y}
                        r={TIP_DOT_RADIUS}
                        color="#FFFFFF"
                    />
                ) : null}
            </Canvas>
            <Text style={styles.progressText}>{value}%</Text>
        </View>
    );
}

const ringStyles = StyleSheet.create({
    canvas: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        position: 'absolute',
        left: -STROKE_INSET,
        top: -STROKE_INSET,
    },
});
