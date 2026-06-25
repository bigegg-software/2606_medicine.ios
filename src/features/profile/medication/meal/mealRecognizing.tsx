import React, { useEffect, useRef } from 'react';
import { Image, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Toast } from '@ant-design/react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/medication/deal/recognition';
import MealRecognizingLoader from './components/MealRecognizingLoader';
import {
    uploadFoodIdentifyImage,
    uploadFoodIdentifyText,
    type FoodIdentifyResult,
} from '@/api/mealRecognition';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

const SCAN_DURATION = 2131;
const OUTER_RING_SIZE = 100;
const INNER_RING_SIZE = 88;
const RING_COLOR = 'rgba(79, 134, 238, 0.14)';

function AvatarRingRipple({ size, index }: { size: number; index: number }) {
    const progress = useSharedValue(0);
    const delay = (SCAN_DURATION / 2) * index;

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, {
                    duration: SCAN_DURATION,
                    easing: Easing.out(Easing.cubic),
                }),
                -1,
                false,
            ),
        );
    }, [delay, progress]);

    const animatedStyle = useAnimatedStyle(() => {
        const scale = 0.82 + progress.value * 0.18;
        const opacity = (1 - progress.value) * 1;
        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.avatarRing,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: RING_COLOR,
                },
                animatedStyle,
            ]}
        />
    );
}

export default function MealRecognizingPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'MealRecognizingPage'>>();
    const startedRef = useRef(false);
    const imageUri = route.params.mode === 'image' ? route.params.imageUri : undefined;

    useEffect(() => {
        navigation.setOptions({ gestureEnabled: false });
    }, [navigation]);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const run = async () => {
            const params = route.params;
            try {
                const res = (
                    params.mode === 'text'
                        ? await uploadFoodIdentifyText(params.text)
                        : await uploadFoodIdentifyImage(params.imageUri, params.text)
                ) as FoodIdentifyResult;

                if (isResourceApiOk(res) && res.data) {
                    const hasFood =
                        Array.isArray(res.data.analysisResult) && res.data.analysisResult.length > 0;
                    navigation.replace('MealResultPage', { ...res.data, hasFood });
                    return;
                }

                Toast.fail(res?.msg || res?.message || '识别失败');
                navigation.goBack();
            } catch {
                Toast.fail('识别失败');
                navigation.goBack();
            }
        };

        void run();
    }, [navigation, route.params]);

    return (
        <PageLayout>
            <View style={styles.recognizingPage}>
                <View style={styles.iconArea}>
                    <AvatarRingRipple size={OUTER_RING_SIZE} index={0} />
                    <AvatarRingRipple size={INNER_RING_SIZE} index={1} />
                    <View style={styles.iconWrap}>
                        <Image
                            source={imageUri ? { uri: imageUri } : require('@/assets/icon.png')}
                            style={styles.icon}
                        />
                    </View>
                </View>
                <View style={styles.scanTextWrap}>
                    <MealRecognizingLoader />
                </View>
            </View>
        </PageLayout>
    );
}
