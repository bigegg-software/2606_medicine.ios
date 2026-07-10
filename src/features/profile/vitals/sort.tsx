import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/vitals/sort';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import { updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    formatVitalsSortStatus,
    normalizeVitalsSortItems,
    VITAL_INDEX_ICONS,
    type VitalsSortItem,
} from './vitalsSortHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'SortPage'>;

const DEFAULT_ROW_HEIGHT = 66;
const RELEASE_SPRING = { damping: 22, stiffness: 280, mass: 0.8 };
const SNAP_DURATION_MS = 120;

function moveSortItem(items: VitalsSortItem[], fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
        return items;
    }
    const next = [...items];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    return next;
}

function clampIndex(index: number, count: number) {
    'worklet';
    return Math.max(0, Math.min(count - 1, index));
}

function getHoverIndex(fromIndex: number, translateY: number, rowHeight: number, count: number) {
    'worklet';
    return clampIndex(Math.round(fromIndex + translateY / rowHeight), count);
}

function getRowOffset(index: number, fromIndex: number, hoverIndex: number, rowHeight: number) {
    'worklet';
    if (fromIndex < 0 || fromIndex === hoverIndex) {
        return 0;
    }
    if (fromIndex < hoverIndex && index > fromIndex && index <= hoverIndex) {
        return -rowHeight;
    }
    if (fromIndex > hoverIndex && index < fromIndex && index >= hoverIndex) {
        return rowHeight;
    }
    return 0;
}

type SortRowProps = {
    item: VitalsSortItem;
    index: number;
    itemCount: number;
    rowHeight: number;
    dragItemKey: SharedValue<string | null>;
    dragFromIndex: SharedValue<number>;
    dragHoverIndex: SharedValue<number>;
    dragTranslateY: SharedValue<number>;
    onDragStart: () => void;
    onDragRelease: (fromIndex: number, toIndex: number) => void;
    onDragCancel: () => void;
    onMeasureRowHeight?: (height: number) => void;
};

function SortRow({
    item,
    index,
    itemCount,
    rowHeight,
    dragItemKey,
    dragFromIndex,
    dragHoverIndex,
    dragTranslateY,
    onDragStart,
    onDragRelease,
    onDragCancel,
    onMeasureRowHeight,
}: SortRowProps) {
    const statusText = formatVitalsSortStatus(item.status);
    const rowHeightShared = useSharedValue(rowHeight);

    React.useEffect(() => {
        rowHeightShared.value = rowHeight;
    }, [rowHeight, rowHeightShared]);

    const gesture = Gesture.Pan()
        .activateAfterLongPress(200)
        .activeOffsetY([-4, 4])
        .failOffsetX([-16, 16])
        .onStart(() => {
            cancelAnimation(dragTranslateY);
            dragItemKey.value = item.key;
            dragFromIndex.value = index;
            dragHoverIndex.value = -1;
            dragTranslateY.value = 0;
            runOnJS(onDragStart)();
        })
        .onUpdate(event => {
            dragTranslateY.value = event.translationY;
        })
        .onEnd(() => {
            const fromIndex = dragFromIndex.value;
            const rowH = rowHeightShared.value;
            const toIndex = getHoverIndex(fromIndex, dragTranslateY.value, rowH, itemCount);
            const targetY = (toIndex - fromIndex) * rowH;

            dragHoverIndex.value = toIndex;
            dragTranslateY.value = withTiming(
                targetY,
                { duration: SNAP_DURATION_MS, easing: Easing.out(Easing.cubic) },
                finished => {
                    if (finished) {
                        runOnJS(onDragRelease)(fromIndex, toIndex);
                    }
                },
            );
        })
        .onFinalize((_event, success) => {
            if (!success && dragItemKey.value === item.key) {
                cancelAnimation(dragTranslateY);
                dragFromIndex.value = -1;
                dragHoverIndex.value = -1;
                dragTranslateY.value = withSpring(0, RELEASE_SPRING, finished => {
                    if (finished) {
                        dragItemKey.value = null;
                        dragTranslateY.value = 0;
                    }
                });
                runOnJS(onDragCancel)();
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const fromIndex = dragFromIndex.value;
        const isActive = dragItemKey.value === item.key;
        const hoverIndex = dragHoverIndex.value >= 0
            ? dragHoverIndex.value
            : getHoverIndex(fromIndex, dragTranslateY.value, rowHeightShared.value, itemCount);
        const rowOffset = getRowOffset(index, fromIndex, hoverIndex, rowHeightShared.value);

        if (isActive) {
            return {
                transform: [
                    { translateY: dragTranslateY.value },
                    { scale: 1.02 },
                ],
                zIndex: 20,
                opacity: 0.98,
            };
        }

        return {
            transform: [{ translateY: rowOffset }],
            zIndex: 1,
            opacity: 1,
        };
    }, [index, item.key, itemCount]);

    const cardAnimatedStyle = useAnimatedStyle(() => {
        const isActive = dragItemKey.value === item.key;
        return {
            shadowOpacity: isActive ? 0.18 : 0.1,
            elevation: isActive ? 6 : 2,
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                style={[styles.rowWrap, animatedStyle]}
                onLayout={index === 0 && onMeasureRowHeight
                    ? event => {
                        const height = event.nativeEvent.layout.height;
                        if (height > 0) {
                            onMeasureRowHeight(height);
                        }
                    }
                    : undefined}
            >
                <Animated.View style={[styles.rowBox, cardAnimatedStyle]}>
                    <Flex justify="between" align="center">
                        <Flex align="center">
                            <Image source={require('@/assets/images/vitals/move.png')} style={styles.iconSize} />
                            <Image source={VITAL_INDEX_ICONS[item.key]} style={styles.iconSize1} />
                            <Text style={styles.textTitle}>{item.key}</Text>
                        </Flex>
                        {statusText ? (
                            <Flex justify="center" style={[styles.statusWrap, { borderColor: item.statusColor }]}>
                                <Text style={[styles.statusText, { color: item.statusColor }]}>{statusText}</Text>
                            </Flex>
                        ) : null}
                    </Flex>
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
}

export default function SortPage({ route }: Props) {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const userExtr = useSelector((state: RootState) => state.user.userExtr);
    const [items, setItems] = useState(() => normalizeVitalsSortItems(route.params?.items as VitalsSortItem[] | undefined));
    const [saving, setSaving] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
    const dragItemKey = useSharedValue<string | null>(null);
    const dragFromIndex = useSharedValue(-1);
    const dragHoverIndex = useSharedValue(-1);
    const dragTranslateY = useSharedValue(0);
    const pendingCommitRef = useRef(false);

    const resetDragState = useCallback(() => {
        dragFromIndex.value = -1;
        dragHoverIndex.value = -1;
        dragTranslateY.value = 0;
        dragItemKey.value = null;
    }, [dragFromIndex, dragHoverIndex, dragItemKey, dragTranslateY]);

    const handleDragStart = useCallback(() => {
        setDragging(true);
    }, []);

    const handleDragRelease = useCallback((fromIndex: number, toIndex: number) => {
        setDragging(false);

        if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
            pendingCommitRef.current = true;
            setItems(prev => moveSortItem(prev, fromIndex, toIndex));
            return;
        }

        resetDragState();
    }, [resetDragState]);

    useLayoutEffect(() => {
        if (!pendingCommitRef.current) return;
        pendingCommitRef.current = false;
        resetDragState();
    }, [items, resetDragState]);

    const handleDragCancel = useCallback(() => {
        setDragging(false);
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const healthIndexShowList = items.map(item => item.key);
            const res = await updateExtrInfo({ healthIndexShowList });
            if (!isResourceApiOk(res as { code?: number })) {
                Alert.alert('失败', (res as { msg?: string }).msg || '保存失败');
                return;
            }
            if (userExtr) {
                dispatch({
                    type: SET_USER_EXTR,
                    payload: { ...userExtr, healthIndexShowList },
                });
            }
            navigation.goBack();
        } catch {
            Alert.alert('错误', '保存失败');
        } finally {
            setSaving(false);
        }
    }, [dispatch, items, navigation, userExtr]);

    const handleFirstRowLayout = useCallback((height: number) => {
        setRowHeight(current => (Math.abs(current - height) > 1 ? height : current));
    }, []);

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <View style={styles.pageContent}>
                <ScrollView
                    contentContainerStyle={styles.body}
                    scrollEnabled={!dragging}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* <Text style={styles.textTip}>长按并拖动指标名称可调整顺序，前三个将会推送到首页</Text> */}
                    {items.map((item, index) => (
                        <SortRow
                            key={item.key}
                            item={item}
                            index={index}
                            itemCount={items.length}
                            rowHeight={rowHeight}
                            dragItemKey={dragItemKey}
                            dragFromIndex={dragFromIndex}
                            dragHoverIndex={dragHoverIndex}
                            dragTranslateY={dragTranslateY}
                            onDragStart={handleDragStart}
                            onDragRelease={handleDragRelease}
                            onDragCancel={handleDragCancel}
                            onMeasureRowHeight={index === 0 ? handleFirstRowLayout : undefined}
                        />
                    ))}
                </ScrollView>
                <Flex
                    justify="between"
                    style={[
                        styles.bottomBar,
                        { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.bottomBarButtonLeft, { flex: 1 }, saving && { opacity: 0.5 }]}
                        onPress={() => { void handleSave(); }}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        <Flex justify="center" style={{ flex: 1 }}>
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Image
                                        style={styles.bottomBarButtonImg}
                                        source={require('@/assets/images/schedule/save.png')}
                                    />
                                    <Text style={styles.bottomBarButtonTextLeft}>保存</Text>
                                </>
                            )}
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </View>
        </PageLayout>
    );
}
