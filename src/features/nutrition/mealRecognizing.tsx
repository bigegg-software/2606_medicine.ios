import React, { useEffect } from 'react';
import { Dimensions, Image, Text, View } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/nutrition/recognition';
import moment from 'moment';
import {
    uploadFoodIdentifyImage,
    uploadFoodIdentifyText,
    type FoodIdentifyResult,
} from '@/api/mealRecognition';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { createFoodItemState } from '@/src/features/profile/medication/meal/components/FoodDetailCard';

const CYCLE_MS = 2000;
const SEGMENT_RATIO = 0.38;
const SECOND_DELAY_MS = 780;
const SWEEP_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const PAGE_PADDING_H = 27;
const TRACK_WIDTH = Math.max(200, Dimensions.get('window').width - PAGE_PADDING_H * 2);

function ProgressSweepSegment({
    progress,
    trackWidth,
}: {
    progress: SharedValue<number>;
    trackWidth: number;
}) {
    const segmentWidth = Math.max(48, trackWidth * SEGMENT_RATIO);

    const style = useAnimatedStyle(() => {
        const p = progress.value;
        const travel = trackWidth + segmentWidth;
        const translateX = -segmentWidth + p * travel;
        const scaleX = interpolate(p, [0, 0.18, 0.5, 0.82, 1], [0.28, 0.9, 1, 0.9, 0.28]);
        const opacity = interpolate(p, [0, 0.06, 0.9, 1], [0, 1, 1, 0]);

        return {
            width: segmentWidth,
            opacity,
            transform: [{ translateX }, { scaleX }],
        };
    }, [segmentWidth, trackWidth]);

    return <Animated.View style={[styles.loadingTextInner, style]} />;
}

function RecognizingProgressBar() {
    const primary = useSharedValue(0);
    const secondary = useSharedValue(0);

    useEffect(() => {
        primary.value = 0;
        secondary.value = 0;

        primary.value = withRepeat(
            withTiming(1, { duration: CYCLE_MS, easing: SWEEP_EASING }),
            -1,
            false,
        );
        secondary.value = withDelay(
            SECOND_DELAY_MS,
            withRepeat(
                withTiming(1, { duration: CYCLE_MS, easing: SWEEP_EASING }),
                -1,
                false,
            ),
        );
    }, [primary, secondary]);

    return (
        <View style={[styles.loadingTextWrap, { width: TRACK_WIDTH }]}>
            <ProgressSweepSegment progress={primary} trackWidth={TRACK_WIDTH} />
            <ProgressSweepSegment progress={secondary} trackWidth={TRACK_WIDTH} />
        </View>
    );
}

export default function MealRecognizingPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'MealRecognizingPage'>>();
    const imageUri = route.params.mode === 'image' ? route.params.imageUri : undefined;

    useEffect(() => {
        navigation.setOptions({ gestureEnabled: false });
    }, [navigation]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            const params = route.params;
            try {
                const res = (
                    params.mode === 'text'
                        ? await uploadFoodIdentifyText(params.text)
                        : await uploadFoodIdentifyImage(params.imageUri, params.text)
                ) as FoodIdentifyResult;

                if (cancelled) return;
        
                if (isResourceApiOk(res) && res.data) {
                    const foods = Array.isArray(res.data.analysisResult) ? res.data.analysisResult : [];
                    const hasFood = foods.length > 0;

                    // 单种食物：进入食物详情并直接保存；多种仍走识别结果页
                    if (foods.length === 1) {
                        const item = foods[0];
                        navigation.replace('FoodDetailPage', {
                            mode: 'recognizeSave',
                            itemIndex: 0,
                            item,
                            state: createFoodItemState(item),
                            recordTime: moment().format('HH:mm'),
                            mealCategory: params.mealCategory,
                            ossId: res.data.ossId,
                            ossUrl: res.data.ossUrl,
                            foodIdentifyId: res.data.foodIdentifyId,
                        });
                        return;
                    }

                    navigation.replace('MealResultPage', {
                        ...res.data,
                        hasFood,
                        mealCategory: params.mealCategory,
                    });
                    return;
                }

                Toast.show(res?.msg || res?.message || '识别失败');
                if (!cancelled) {
                    navigation.goBack();
                }
            } catch {
                if (cancelled) return;
                Toast.show('识别失败');
                navigation.goBack();
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [navigation, route.params]);

    return (
        <PageLayout>
            <View style={styles.recognizingPage}>
                <Image
                    source={imageUri ? { uri: imageUri } : require('@/assets/images/medication/default1.png')}
                    style={styles.iconWrap}
                />
                <Flex style={styles.recognizingBottom} direction="column" justify='center'>
                    <Image style={styles.btmImg} source={require('@/assets/images/medication/btmImg.png')} />
                    <RecognizingProgressBar />
                    <Text style={styles.loadingText}>AI正在识别营养成分...</Text>
                </Flex>
            </View>
        </PageLayout>
    );
}
