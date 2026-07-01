import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    Platform,
    Text,
    View,
    Image,
    ScrollView,
    TextInput,
    TouchableOpacity,
    type KeyboardEvent,
    type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { Flex, Toast } from '@ant-design/react-native';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import styles from '@/css/medication/meal';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import MiniProgressRing from '@/src/features/home/components/MiniProgressRing';
import SpeechToText, { type SpeechToTextRef } from '@/src/features/assistant/components/SpeechToText';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
    calcNutritionPercent,
    calcNutritionProgress,
    getCalorieNutritionDisplay,
    getDietRuleSummary,
    getProteinNutritionDisplay,
    getWaterNutritionDisplay,
    NUTRITION_COLOR,
    type MealCardData,
    type NutritionDisplay,
} from '@/src/features/profile/medication/meal/dietRuleHelpers';
import {
    formatMealServingText,
    formatNutritionInteger,
    getFoodRecordsByCategory,
    getMealNotePlaceholder,
    getWaterRecords,
    sumCalories,
    sumProtein,
    sumWaterIntake,
} from '@/src/features/profile/medication/meal/mealDetailHelpers';
import { consumeMealInputReset } from '@/src/features/profile/medication/meal/mealInputReset';
import Svg, { ClipPath, Defs, G, Path, Polygon } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function NutritionStatusTag({ display }: { display: NutritionDisplay }) {
    const color = NUTRITION_COLOR[display.tone];
    return (
        <Flex align="center" style={{ marginTop: 6 }}>
            <Text style={[styles.statusText, { color }]}>{display.label}</Text>
            {display.arrow !== 'none' ? (
                <Image
                    style={[styles.statusIcon, { tintColor: color }]}
                    source={
                        display.arrow === 'up'
                            ? require('@/assets/images/medication/up.png')
                            : require('@/assets/images/medication/down.png')
                    }
                />
            ) : null}
        </Flex>
    );
}

function MealCardContent({ meal }: { meal: MealCardData }) {
    return (
        <Flex style={styles.ysBox}>
            <View>
                <Flex justify='center'>
                    <Image style={styles.ysIcon} source={meal.icon} />
                    <Text style={styles.ysText}>{meal.title}</Text>
                </Flex>
                <Flex justify="center" style={styles.wlrBox}>
                    <Text style={styles.wlrText}>{meal.time}</Text>
                </Flex>
            </View>
            <View style={styles.line}>
                {Array.from({ length: 5 }, (_, index) => (
                    <View key={index} style={styles.lineDash} />
                ))}
            </View>
            <View style={styles.ysRight}>
                <View style={styles.foodList}>
                    {meal.foods.map((food, index) => (
                        <View key={`${food}-${index}`} style={styles.foodBox}>
                            <Text style={styles.foodText}>{food}</Text>
                        </View>
                    ))}
                </View>
                <Flex justify="center" style={styles.jyBox}>
                    <Image tintColor={"#FF8B07"} source={require('@/assets/images/home/jy.png')} style={styles.jyIcon} />
                    <Text style={styles.jyText}>建议热量：{meal.calories}千卡</Text>
                </Flex>
            </View>
        </Flex>
    );
}

const SWIPE_THRESHOLD = 40;
const SWIPE_MAX_DRAG = 28;
const SWIPE_TRANSITION = 16;
const SWIPE_ANIM_DURATION = 180;
const MEAL_KEYBOARD_GAP = 12;

function MealStackSwiper({ meals, initialIndex = 0 }: { meals: MealCardData[]; initialIndex?: number }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const translateY = useSharedValue(0);
    const isAnimating = useSharedValue(false);

    useEffect(() => {
        if (meals.length === 0) {
            setActiveIndex(0);
            return;
        }
        setActiveIndex(Math.min(Math.max(initialIndex, 0), meals.length - 1));
    }, [meals, initialIndex]);

    const changeIndex = useCallback((direction: 1 | -1) => {
        if (meals.length === 0) return;
        setActiveIndex(prev => {
            if (direction === 1) return (prev + 1) % meals.length;
            return (prev - 1 + meals.length) % meals.length;
        });
    }, [meals.length]);

    const panGesture = Gesture.Pan()
        .activeOffsetY([-12, 12])
        .failOffsetX([-24, 24])
        .onUpdate(event => {
            if (isAnimating.value) return;
            const next = event.translationY * 0.45;
            translateY.value = Math.max(-SWIPE_MAX_DRAG, Math.min(SWIPE_MAX_DRAG, next));
        })
        .onEnd(event => {
            if (isAnimating.value) return;

            const shouldNext = event.translationY <= -SWIPE_THRESHOLD || event.velocityY < -500;
            const shouldPrev = event.translationY >= SWIPE_THRESHOLD || event.velocityY > 500;

            if (shouldNext) {
                isAnimating.value = true;
                translateY.value = withTiming(-SWIPE_TRANSITION, { duration: SWIPE_ANIM_DURATION }, finished => {
                    if (!finished) return;
                    runOnJS(changeIndex)(1);
                    translateY.value = SWIPE_TRANSITION * 0.5;
                    translateY.value = withTiming(0, { duration: SWIPE_ANIM_DURATION }, () => {
                        isAnimating.value = false;
                    });
                });
                return;
            }

            if (shouldPrev) {
                isAnimating.value = true;
                translateY.value = withTiming(SWIPE_TRANSITION, { duration: SWIPE_ANIM_DURATION }, finished => {
                    if (!finished) return;
                    runOnJS(changeIndex)(-1);
                    translateY.value = -SWIPE_TRANSITION * 0.5;
                    translateY.value = withTiming(0, { duration: SWIPE_ANIM_DURATION }, () => {
                        isAnimating.value = false;
                    });
                });
                return;
            }

            translateY.value = withTiming(0, { duration: SWIPE_ANIM_DURATION });
        });

    const mainCardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const peek1Style = useAnimatedStyle(() => ({
        marginHorizontal: interpolate(
            translateY.value,
            [-SWIPE_MAX_DRAG, 0, SWIPE_MAX_DRAG],
            [12, 14, 12],
            Extrapolation.CLAMP,
        ),
    }));

    const peek2Style = useAnimatedStyle(() => ({
        marginHorizontal: interpolate(
            translateY.value,
            [-SWIPE_MAX_DRAG, 0, SWIPE_MAX_DRAG],
            [26, 28, 26],
            Extrapolation.CLAMP,
        ),
    }));

    const nextCardStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    translateY.value,
                    [-SWIPE_MAX_DRAG, 0, SWIPE_MAX_DRAG],
                    [-4, 0, 0],
                    Extrapolation.CLAMP,
                ),
            },
        ],
    }));

    const activeMeal = meals[activeIndex];
    const nextMeal = meals.length > 1 ? meals[(activeIndex + 1) % meals.length] : null;

    if (meals.length === 0) {
        return (
            <View style={styles.stackWrap}>
                <View style={styles.stackMainCard}>
                    <View style={styles.mealSuggestEmpty}>
                        <Image
                            style={styles.mealSuggestEmptyIcon}
                            source={require('@/assets/images/medication/icon.png')}
                        />
                        <Text style={styles.mealSuggestEmptyText}>今日暂无餐食建议</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <GestureDetector gesture={panGesture}>
            <View style={styles.stackWrap}>
                {nextMeal ? (
                    <Animated.View
                        style={[styles.stackLayerCard, styles.stackLayerMiddle, nextCardStyle]}
                        pointerEvents="none">
                        <MealCardContent meal={nextMeal} />
                    </Animated.View>
                ) : null}
                <Animated.View style={[styles.stackMainCard, mainCardStyle]}>
                    <MealCardContent meal={activeMeal} />
                </Animated.View>
                {meals.length >= 2 ? (
                    <>
                        <Animated.View style={[styles.stackPeek, styles.stackPeekFirst, peek1Style]} />
                        <Animated.View style={[styles.stackPeek, styles.stackPeekSecond, peek2Style]} />
                    </>
                ) : null}
            </View>
        </GestureDetector>
    );
}

const MEAL_LABELS: Record<string, string> = {
    breakfast: '早餐',
    lunch: '中餐',
    dinner: '晚餐',
    snack: '加餐',
};

type CurrentMealKey = 'breakfast' | 'lunch' | 'dinner';

function getCurrentMealKey(date = new Date()): CurrentMealKey {
    const hour = date.getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 16) return 'lunch';
    return 'dinner';
}

const MEAL_LABEL_KEYS = Object.keys(MEAL_LABELS);
const MEAL_ARROW_WIDTH = 22;
const MEAL_ARROW_HALF = MEAL_ARROW_WIDTH / 2;

function MealSelectorArrow() {
    return (
        <Svg width={MEAL_ARROW_WIDTH} height={12} viewBox="0 0 22 12">
            <Polygon points="11,0 0,12 22,12" fill="#F1F6FF" />
        </Svg>
    );
}

const WATER_CUP_PATH =
    'M 5 0 L 49 0 Q 54 0 54 5 L 46 55 Q 46 60 41 60 L 13 60 Q 8 60 8 55 L 0 5 Q 0 0 5 0 Z';

function buildWaveLiquidPath(baseY: number, phase: number, amplitude: number, frequency: number) {
    'worklet';
    const parts: string[] = [];
    const step = 2;
    for (let x = 0; x <= 54; x += step) {
        const y = baseY + Math.sin(x * frequency + phase) * amplitude;
        parts.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return `${parts.join(' ')} L 54 60 L 0 60 Z`;
}

function WaterCupIcon({ fillRatio = 0 }: { fillRatio?: number }) {
    const targetRatio = Math.min(1, Math.max(0, fillRatio));
    const hasWater = targetRatio > 0;
    const fillProgress = useSharedValue(targetRatio);
    const wavePhase = useSharedValue(0);
    const ripplePhase = useSharedValue(0);

    useEffect(() => {
        fillProgress.value = withTiming(targetRatio, {
            duration: hasWater ? 900 : 0,
            easing: Easing.out(Easing.cubic),
        });

        if (hasWater) {
            wavePhase.value = withRepeat(
                withTiming(Math.PI * 2, { duration: 2200, easing: Easing.linear }),
                -1,
                false,
            );
            ripplePhase.value = withRepeat(
                withTiming(Math.PI * 2, { duration: 1600, easing: Easing.linear }),
                -1,
                false,
            );
            return;
        }

        cancelAnimation(wavePhase);
        cancelAnimation(ripplePhase);
        wavePhase.value = 0;
        ripplePhase.value = 0;
    }, [fillProgress, hasWater, ripplePhase, targetRatio, wavePhase]);

    const liquidProps = useAnimatedProps(() => ({
        d: buildWaveLiquidPath(60 * (1 - fillProgress.value), wavePhase.value, 1.4, 0.38),
    }));

    const rippleProps = useAnimatedProps(() => ({
        d: buildWaveLiquidPath(
            60 * (1 - fillProgress.value),
            ripplePhase.value + Math.PI / 3,
            0.9,
            0.52,
        ),
    }));

    return (
        <Svg width={54} height={60} viewBox="0 0 54 60">
            <Defs>
                <ClipPath id="waterCupClip">
                    <Path d={WATER_CUP_PATH} />
                </ClipPath>
            </Defs>
            <Path d={WATER_CUP_PATH} fill="#E2F2FF" />
            {hasWater ? (
                <G clipPath="url(#waterCupClip)">
                    <AnimatedPath animatedProps={liquidProps} fill="#4F86EE" />
                    <AnimatedPath animatedProps={rippleProps} fill="rgba(255,255,255,0.22)" />
                </G>
            ) : null}
        </Svg>
    );
}

export default function MealTab({ resetToken = 0 }: { resetToken?: number }) {
    const navigation: any = useNavigation();
    const insets = useSafeAreaInsets();
    const [selectedMeal, setSelectedMeal] = useState<string>(getCurrentMealKey);
    const [selectorWidth, setSelectorWidth] = useState(0);
    const [nutritionExpanded, setNutritionExpanded] = useState(false);
    const [dinnerNote, setDinnerNote] = useState('');
    const [mealNotePlaceholder, setMealNotePlaceholder] = useState(() => getMealNotePlaceholder());
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [loading, setLoading] = useState(true);
    const speechToTextRef = useRef<SpeechToTextRef>(null);
    const voiceBaseTextRef = useRef('');
    const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
    const [todayMealList, setTodayMealList] = useState<MealDetailItem[]>([]);

    const dietSummary = useMemo(() => getDietRuleSummary(dietRule), [dietRule]);
    const currentMealKey = getCurrentMealKey();
    const mealSuggestionInitialIndex = useMemo(() => {
        const index = dietSummary.mealCards.findIndex(meal => meal.key.startsWith(currentMealKey));
        return index >= 0 ? index : 0;
    }, [currentMealKey, dietSummary.mealCards]);
    const todayWaterMl = useMemo(() => sumWaterIntake(todayMealList), [todayMealList]);
    const todayCalories = useMemo(() => sumCalories(todayMealList), [todayMealList]);
    const todayProtein = useMemo(() => sumProtein(todayMealList), [todayMealList]);
    const waterRecords = useMemo(() => getWaterRecords(todayMealList), [todayMealList]);
    const selectedMealRecords = useMemo(
        () => getFoodRecordsByCategory(todayMealList, selectedMeal),
        [todayMealList, selectedMeal],
    );

    const loadMealData = useCallback(async () => {
        setLoading(true);
        try {
            const [ruleRes, todayRes] = await Promise.all([
                getInUseDietPatientRuleInfo(),
                getTodayMealDetailList(),
            ]);
            setDietRule(apiResourceData<DietPatientRuleInfo>(ruleRes as unknown as ApiResult<DietPatientRuleInfo>) ?? null);
            setTodayMealList(
                apiResourceData<MealDetailItem[]>(todayRes as unknown as ApiResult<MealDetailItem[]>) ?? [],
            );
        } catch {
            setDietRule(null);
            setTodayMealList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const resetMealInputState = useCallback(() => {
        setDinnerNote('');
        voiceBaseTextRef.current = '';
        setIsVoiceListening(false);
        void speechToTextRef.current?.stopListening();
        Keyboard.dismiss();
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadMealData();
            setMealNotePlaceholder(getMealNotePlaceholder());
            setSelectedMeal(getCurrentMealKey());
            if (consumeMealInputReset()) {
                resetMealInputState();
            }
        }, [loadMealData, resetMealInputState]),
    );

    useEffect(() => {
        const onShow = (event: KeyboardEvent) => {
            setKeyboardHeight(event.endCoordinates.height);
        };
        const onHide = () => {
            setKeyboardHeight(0);
        };

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const bottomBarBottom = useMemo(() => {
        if (keyboardHeight <= 0) return 16;
        const adjusted = Math.max(0, keyboardHeight - insets.bottom);
        return adjusted + MEAL_KEYBOARD_GAP;
    }, [insets.bottom, keyboardHeight]);

    const showMealActionButtons = dinnerNote.trim().length > 0 || isVoiceListening;

    const caloriePercent = calcNutritionPercent(todayCalories, dietSummary.targetCalories);
    const proteinPercent = calcNutritionPercent(todayProtein, dietSummary.targetProtein);
    const waterPercent = calcNutritionPercent(todayWaterMl, dietSummary.targetWater);
    const calorieProgress = calcNutritionProgress(todayCalories, dietSummary.targetCalories);
    const proteinProgress = calcNutritionProgress(todayProtein, dietSummary.targetProtein);
    const waterProgress = calcNutritionProgress(todayWaterMl, dietSummary.targetWater);
    const calorieDisplay = getCalorieNutritionDisplay(caloriePercent);
    const proteinDisplay = getProteinNutritionDisplay(proteinPercent);
    const waterDisplay = getWaterNutritionDisplay(waterPercent);

    const selectedMealIndex = useMemo(
        () => Math.max(0, MEAL_LABEL_KEYS.indexOf(selectedMeal)),
        [selectedMeal],
    );

    const arrowLeft = selectorWidth > 0
        ? ((selectedMealIndex + 0.5) / MEAL_LABEL_KEYS.length) * selectorWidth - MEAL_ARROW_HALF
        : 0;

    const handleSelectorLayout = useCallback((event: LayoutChangeEvent) => {
        setSelectorWidth(event.nativeEvent.layout.width);
    }, []);

    const handleOpenMealRecord = useCallback(
        (item: MealDetailItem) => {
            if (!item.mealDetailId) {
                Toast.fail('无法查看详情');
                return;
            }
            navigation.navigate('MealRecordDetailPage', { mealDetailId: item.mealDetailId });
        },
        [navigation],
    );

    const handleVoiceStart = useCallback(() => {
        voiceBaseTextRef.current = dinnerNote;
    }, [dinnerNote]);

    const handleVoiceTextChange = useCallback((text: string) => {
        setDinnerNote(voiceBaseTextRef.current + text);
    }, []);

    const handleMicPress = useCallback(() => {
        Keyboard.dismiss();
    }, []);

    const handleKeyboardClose = useCallback(() => {
        void speechToTextRef.current?.stopListening();
        Keyboard.dismiss();
    }, []);

    useEffect(() => {
        if (resetToken > 0) {
            resetMealInputState();
        }
    }, [resetToken, resetMealInputState]);

    const handleClearInput = useCallback(() => {
        resetMealInputState();
    }, [resetMealInputState]);

    const handleTextRecognize = useCallback(() => {
        const text = dinnerNote.trim();
        if (!text) {
            Toast.fail('请输入或录入食物描述');
            return;
        }

        void speechToTextRef.current?.stopListening();
        Keyboard.dismiss();
        resetMealInputState();
        navigation.navigate('MealRecognizingPage', { mode: 'text', text });
    }, [dinnerNote, navigation, resetMealInputState]);

    return (
        <View style={styles.mealTabContainer}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color="#173F7D" />
                </View>
            ) : (
                <ScrollView
                    style={styles.mealScroll}
                    contentContainerStyle={styles.mealScrollContent}>
                    <View style={styles.scheduleBox}>
                        <TouchableOpacity onPress={() => navigation.navigate('MealDetailPage')}>
                            <Flex justify='between'>
                                <Text style={styles.cfIconText}>营养目标</Text>
                                <Flex>
                                    <Text style={styles.leftText}>详情</Text>
                                    <MaterialIcons name="arrow-forward-ios" size={16} color="#333333" />
                                </Flex>
                            </Flex>
                        </TouchableOpacity>
                        <Flex justify='between' style={styles.yyContent}>
                            <View style={styles.yyItem}>
                                <Flex align="center">
                                    <Text style={styles.yyTitle}>热量</Text>
                                    <MiniProgressRing
                                        size={30}
                                        progress={calorieProgress}
                                        trackColor="rgba(131,174,255,0.14)"
                                        color="#6D925E"
                                    />
                                </Flex>
                                <Flex align="center" style={{ marginTop: 6 }}>
                                    <Text style={styles.yyValue}>{formatNutritionInteger(todayCalories)}</Text>
                                    <Text style={styles.yyUnit}> /{dietSummary.targetCalories ?? '--'}千卡</Text>
                                </Flex>
                                <NutritionStatusTag display={calorieDisplay} />
                            </View>
                            <View style={styles.yyItem}>
                                <Flex align="center">
                                    <Text style={styles.yyTitle}>蛋白</Text>
                                    <MiniProgressRing
                                        size={30}
                                        progress={proteinProgress}
                                        trackColor="rgba(131,174,255,0.14)"
                                        color="#0951AE"
                                    />
                                </Flex>
                                <Flex align="center" style={{ marginTop: 6 }}>
                                    <Text style={styles.yyValue}>{formatNutritionInteger(todayProtein)}</Text>
                                    <Text style={styles.yyUnit}> /{dietSummary.targetProtein ?? '--'}克</Text>
                                </Flex>
                                <NutritionStatusTag display={proteinDisplay} />
                            </View>
                            <View style={styles.yyItem}>
                                <Flex align="center">
                                    <Text style={styles.yyTitle}>饮水</Text>
                                    <MiniProgressRing
                                        size={30}
                                        progress={waterProgress}
                                        trackColor="rgba(131,174,255,0.14)"
                                        color="#EE9C44"
                                    />
                                </Flex>
                                <Flex align="center" style={{ marginTop: 6 }}>
                                    <Text style={styles.yyValue}>{formatNutritionInteger(todayWaterMl)}</Text>
                                    <Text style={styles.yyUnit}> /{dietSummary.targetWater ?? '--'}毫升</Text>
                                </Flex>
                                <NutritionStatusTag display={waterDisplay} />
                            </View>
                        </Flex>
                    </View>
                    <View style={styles.scheduleBox}>
                        <Flex>
                            <Image source={require('@/assets/images/medication/icon.png')} style={styles.cfIcon} />
                            <Text style={styles.cfIconText1}>管家建议</Text>
                        </Flex>
                        <View style={styles.suggestBox}>
                            <View>
                                <Flex align="center">
                                    <Image source={require('@/assets/images/medication/kl.png')} style={styles.suggestIcon} />
                                    <View style={styles.suggestTag}>
                                        <Text style={styles.suggestTagText}>管家建议</Text>
                                    </View>
                                </Flex>
                                <Text style={styles.aiSuggest}>盐摄入超标0.1g，建议减少</Text>
                            </View>
                            <View style={{ marginTop: 12 }}>
                                <Flex align="center">
                                    <Image source={require('@/assets/images/medication/kl.png')} style={styles.suggestIcon} />
                                    <View style={styles.suggestTag}>
                                        <Text style={styles.suggestTagText}>管家建议</Text>
                                    </View>
                                </Flex>
                                <Text style={styles.aiSuggest}>盐摄入超标0.1g，建议减少</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.mealBox}>
                        <Flex justify='between'>
                            <Text style={[styles.cfIconText, { marginLeft: 9 }]}>餐食建议</Text>
                        </Flex>
                        <MealStackSwiper
                            meals={dietSummary.mealCards}
                            initialIndex={mealSuggestionInitialIndex}
                        />
                    </View>

                    <Flex justify='between' style={{ marginTop: 19 }}>
                        <Text style={styles.mealTitle}>今日摄入</Text>
                        <Text style={styles.mealValue}><Text style={styles.mealValueNum}>{formatNutritionInteger(todayCalories)}</Text>/{dietSummary.targetCalories ?? '--'}千卡</Text>
                    </Flex>
                    <View style={styles.scheduleBox}>
                        <Flex style={styles.mealSelector} justify="between">
                            {Object.entries(MEAL_LABELS).map(([key, label]) => {
                                const isSelected = selectedMeal === key;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => setSelectedMeal(key)}
                                        style={styles.mealOption}
                                        activeOpacity={0.8}>
                                        <Text style={[styles.mealOptionText, isSelected && styles.mealOptionTextActive]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </Flex>

                        <View style={styles.mealRowWrap} onLayout={handleSelectorLayout}>
                            {selectorWidth > 0 ? (
                                <View style={[styles.mealArrowPointer, { left: arrowLeft }]}>
                                    <MealSelectorArrow />
                                </View>
                            ) : null}
                            <View style={styles.mealRow}>
                                {selectedMealRecords.length > 0 ? (
                                    selectedMealRecords.map((item, index) => (
                                        <TouchableOpacity
                                            key={item.mealDetailId ?? `${item.mealName}-${index}`}
                                            activeOpacity={0.7}
                                            onPress={() => handleOpenMealRecord(item)}
                                            style={index > 0 ? { marginTop: 12 } : undefined}>
                                            <Flex>
                                                <Image
                                                    style={styles.mealIcon}
                                                    source={
                                                        item.ossUrl
                                                            ? { uri: item.ossUrl }
                                                            : require('@/assets/images/medication/icon.png')
                                                    }
                                                />
                                                <View style={styles.mealCol}>
                                                    <Text style={styles.mealColTitle}>{item.mealName || '--'}</Text>
                                                    <Text style={styles.mealColText}>{formatMealServingText(item)}</Text>
                                                </View>
                                                <Flex>
                                                    <Text style={styles.kllText}>{formatNutritionInteger(item.calorie)}千卡</Text>
                                                    <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(23,63,125,0.66)" />
                                                </Flex>
                                            </Flex>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.mealColText}>暂无记录</Text>
                                )}
                            </View>
                        </View>
                    </View>
                    <View style={styles.scheduleBox}>
                        <Flex justify='between'>
                            <Text style={styles.cfIconText}>饮水</Text>
                            <TouchableOpacity onPress={() => setNutritionExpanded(prev => !prev)} activeOpacity={0.7}>
                                <Flex align="center">
                                    <Text style={styles.leftText}>{nutritionExpanded ? '收起' : '展开'}</Text>
                                    <MaterialIcons
                                        name={nutritionExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                        size={20}
                                        color="rgba(23,63,125,0.66)"
                                    />
                                </Flex>
                            </TouchableOpacity>
                        </Flex>

                        <Flex justify='between' align='end' style={styles.waterRow}>
                            <Flex direction='column' style={styles.waterTextCol}>
                                <Text style={styles.waterValue}>{formatNutritionInteger(todayWaterMl)}ml</Text>
                                <Text style={styles.waterTarget}>目标{dietSummary.targetWater ?? '--'}ml</Text>
                            </Flex>
                            <View style={styles.waterCupWrap}>
                                <WaterCupIcon fillRatio={waterProgress / 100} />
                            </View>
                        </Flex>
                        {nutritionExpanded && (
                            <View>
                                {waterRecords.length > 0 ? (
                                    waterRecords.map((item, index) => (
                                        <Flex
                                            key={item.mealDetailId ?? `${item.timeStr}-${index}`}
                                            justify="between"
                                            style={index > 0 ? { marginTop: 12 } : undefined}>
                                            <Flex style={styles.rowBox}>
                                                <Image style={styles.colImg} source={require('@/assets/images/medication/meal/time.png')} />
                                                <Text style={styles.colText}>{item.timeStr || '--'}</Text>
                                            </Flex>
                                            <Flex>
                                                <Image style={styles.colImg} source={require('@/assets/images/medication/meal/sd.png')} />
                                                <Text style={styles.colText}>{formatNutritionInteger(item.waterIntake)}ml</Text>
                                            </Flex>
                                        </Flex>
                                    ))
                                ) : (
                                    <Text style={styles.colText}>暂无饮水记录</Text>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
            <Flex
                justify="between"
                style={[
                    styles.mealBottomBar,
                    { bottom: bottomBarBottom },
                    keyboardHeight > 0 ? { zIndex: 20, elevation: 20 } : null,
                ]}>
                <Flex style={styles.bottomInputWrapper}>
                    <SpeechToText
                        ref={speechToTextRef}
                        onMicPress={handleMicPress}
                        onStart={handleVoiceStart}
                        onTextChange={handleVoiceTextChange}
                        onListeningChange={setIsVoiceListening}
                    />
                    <TextInput
                        style={styles.dinnerInput}
                        value={dinnerNote}
                        onChangeText={setDinnerNote}
                        placeholder={mealNotePlaceholder}
                        placeholderTextColor="#999999"
                        returnKeyType="done"
                        onSubmitEditing={handleKeyboardClose}
                    />
                </Flex>
                <Flex>
                    {showMealActionButtons ? (
                        <>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handleTextRecognize}>
                                <Image
                                    style={styles.btmIconBox}
                                    source={require('@/assets/images/medication/meal/dui.png')}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handleClearInput}>
                                <Image style={[styles.btmIconBox, { marginLeft: 4 }]}
                                    source={require('@/assets/images/medication/meal/cuo.png')}
                                />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => { navigation.navigate('MealWaterPage') }}>
                                <Flex justify='center' style={styles.btmIconBox}>
                                    <Image style={styles.btmIcon} source={require('@/assets/images/medication/meal/shui.png')} />
                                </Flex>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('MealRecognitionPage', { text: dinnerNote })}>
                                <Flex justify='center' style={[styles.btmIconBox, { marginLeft: 6 }]}>
                                    <Image style={styles.btmIcon} source={require('@/assets/images/medication/meal/camera.png')} />
                                </Flex>
                            </TouchableOpacity>
                        </>
                    )}
                </Flex>
            </Flex>
        </View>
    );
}
