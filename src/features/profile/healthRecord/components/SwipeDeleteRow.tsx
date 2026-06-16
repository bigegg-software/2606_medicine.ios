import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Image, Pressable, type ImageStyle, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { AppTheme } from '@/common/theme';
import baseStyles from '@/css/profile/healthRecord';

const ACTION_WIDTH = 72;
const SNAP_SPRING = { damping: 22, stiffness: 240 };

let activeCloser: (() => void) | null = null;

export function closeActiveSwipeRow() {
    activeCloser?.();
}

export type SwipeDeleteRowStyleOverrides = {
    swipeRow?: ViewStyle;
    swipeAction?: ViewStyle;
    swipeForeground?: ViewStyle;
    swipeDeleteBtn?: ViewStyle;
    editIcon?: ImageStyle;
};

type Props = {
    children: React.ReactNode;
    onDelete: () => void;
    styleOverrides?: SwipeDeleteRowStyleOverrides;
};

export default function SwipeDeleteRow({ children, onDelete, styleOverrides }: Props) {
    const styles = useMemo(
        () => ({ ...baseStyles, ...styleOverrides }),
        [styleOverrides],
    );
    const translateX = useSharedValue(0);
    const startX = useSharedValue(0);

    const close = useCallback(() => {
        translateX.value = withSpring(0, SNAP_SPRING);
    }, [translateX]);

    useEffect(() => {
        return () => {
            if (activeCloser === close) {
                activeCloser = null;
            }
        };
    }, [close]);

    const openRow = useCallback(() => {
        if (activeCloser && activeCloser !== close) {
            activeCloser();
        }
        activeCloser = close;
    }, [close]);

    const pan = Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-10, 10])
        .onStart(() => {
            startX.value = translateX.value;
        })
        .onUpdate(e => {
            const next = startX.value + e.translationX;
            if (next > 0) {
                translateX.value = next * 0.15;
                return;
            }
            translateX.value = Math.max(next, -ACTION_WIDTH * 1.15);
        })
        .onEnd(e => {
            const shouldOpen =
                translateX.value < -ACTION_WIDTH / 2 ||
                (e.velocityX < -500 && translateX.value < 0);

            if (shouldOpen) {
                translateX.value = withSpring(-ACTION_WIDTH, SNAP_SPRING);
                runOnJS(openRow)();
            } else {
                translateX.value = withSpring(0, SNAP_SPRING);
            }
        });

    const foregroundStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        overflow: "hidden"
    }));

    const onDeletePress = () => {
        close();
        if (activeCloser === close) {
            activeCloser = null;
        }
        onDelete();
    };

    return (
        <View style={styles.swipeRow}>
            <View style={styles.swipeAction}>
                <Pressable style={styles.swipeDeleteBtn} onPress={onDeletePress}>
                    <Image tintColor={AppTheme.primaryColor} style={styles.editIcon} source={require('@/assets/images/user/del.png')} />
                </Pressable>
            </View>
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.swipeForeground, foregroundStyle]}>{children}</Animated.View>
            </GestureDetector>
        </View>
    );
}
