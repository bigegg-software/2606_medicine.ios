import React, { useCallback, useMemo, useState } from 'react';
import { Text, View, Image, ScrollView, TouchableOpacity, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/medication/meal';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import MiniProgressRing from '@/src/features/home/components/MiniProgressRing';
import Svg, { Polygon } from 'react-native-svg';

type NutritionStatus = '明显不足' | '基本达标';

function NutritionStatusTag({ status }: { status: NutritionStatus }) {
    const isMet = status === '基本达标';
    return (
        <Flex align="center" style={{ marginTop: 6 }}>
            <Text style={isMet ? styles.statusUpText : styles.downText}>{status}</Text>
            <Image
                style={styles.statusIcon}
                source={
                    isMet
                        ? require('@/assets/images/medication/up.png')
                        : require('@/assets/images/medication/down.png')
                }
            />
        </Flex>
    );
}

type MealCardData = {
    key: string;
    title: string;
    time: string;
    icon: ImageSourcePropType;
    foods: string[];
    calories: number;
};

const MEAL_CARDS: MealCardData[] = [
    {
        key: 'breakfast',
        title: '早餐',
        time: '6:00-9:00',
        icon: require('@/assets/images/home/zao.png'),
        foods: ['小米粥', '鸡蛋', '玉米'],
        calories: 523,
    },
    {
        key: 'lunch',
        title: '午餐',
        time: '11:00-13:00',
        icon: require('@/assets/images/home/sun.png'),
        foods: ['糙米饭', '清蒸鱼', '西兰花'],
        calories: 650,
    },
    {
        key: 'dinner',
        title: '晚餐',
        time: '17:00-19:00',
        icon: require('@/assets/images/home/yl.png'),
        foods: ['杂粮粥', '素炒三丝', '酸奶'],
        calories: 480,
    },
];

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
                <Flex justify="between">
                    {meal.foods.map(food => (
                        <Flex key={food} style={styles.foodBox} justify="center">
                            <Text style={styles.foodText}>{food}</Text>
                        </Flex>
                    ))}
                </Flex>
                <Flex style={styles.jyBox} justify="center">
                    <Image source={require('@/assets/images/home/jy.png')} style={styles.jyIcon} />
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

function MealStackSwiper() {
    const [activeIndex, setActiveIndex] = useState(0);
    const translateY = useSharedValue(0);
    const isAnimating = useSharedValue(false);

    const changeIndex = useCallback((direction: 1 | -1) => {
        setActiveIndex(prev => {
            if (direction === 1) return (prev + 1) % MEAL_CARDS.length;
            return (prev - 1 + MEAL_CARDS.length) % MEAL_CARDS.length;
        });
    }, []);

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

    const activeMeal = MEAL_CARDS[activeIndex];

    return (
        <GestureDetector gesture={panGesture}>
            <View style={styles.stackWrap}>
                <Animated.View style={[styles.stackMainCard, mainCardStyle]}>
                    <MealCardContent meal={activeMeal} />
                </Animated.View>
                <Animated.View style={[styles.stackPeek, styles.stackPeekFirst, peek1Style]} />
                <Animated.View style={[styles.stackPeek, styles.stackPeekSecond, peek2Style]} />
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

export default function MealTab() {
    const navigation: any = useNavigation();
    const [selectedMeal, setSelectedMeal] = useState('breakfast');
    const [selectorWidth, setSelectorWidth] = useState(0);

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

    return (
        <ScrollView style={{ padding: 18, paddingTop: 0 }}>
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
                            <MiniProgressRing progress={65} />
                        </Flex>
                        <Flex align="center" style={{ marginTop: 6 }}>
                            <Text style={styles.yyValue}>300</Text>
                            <Text style={styles.yyUnit}> /1200千卡</Text>
                        </Flex>
                        <NutritionStatusTag status="明显不足" />
                    </View>
                    <View style={styles.yyItem}>
                        <Flex align="center">
                            <Text style={styles.yyTitle}>蛋白</Text>
                            <MiniProgressRing progress={40} />
                        </Flex>
                        <Flex align="center" style={{ marginTop: 6 }}>
                            <Text style={styles.yyValue}>30</Text>
                            <Text style={styles.yyUnit}> /70克</Text>
                        </Flex>
                        <NutritionStatusTag status="基本达标" />
                    </View>
                    <View style={styles.yyItem}>
                        <Flex align="center">
                            <Text style={styles.yyTitle}>饮水</Text>
                            <MiniProgressRing progress={80} />
                        </Flex>
                        <Flex align="center" style={{ marginTop: 6 }}>
                            <Text style={styles.yyValue}>1300</Text>
                            <Text style={styles.yyUnit}> /1600毫升</Text>
                        </Flex>
                        <NutritionStatusTag status="基本达标" />
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
                <MealStackSwiper />
            </View>

            <Flex justify='between' style={{ marginTop: 19 }}>
                <Text style={styles.mealTitle}>今日摄入</Text>
                <Text style={styles.mealValue}><Text style={styles.mealValueNum}>350</Text>/2300千卡</Text>
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
                    <Flex>
                        <Image style={styles.mealIcon} source={require("@/assets/images/medication/icon.png")} />
                        <View style={styles.mealCol}>
                            <Text style={styles.mealColTitle}>豆浆</Text>
                            <Text style={styles.mealColText}>1杯  约450毫升</Text>
                        </View>
                        <Flex>
                            <Text style={styles.kllText}>140千卡</Text>
                            <MaterialIcons name="arrow-forward-ios" size={16} color="#173F7D" />
                        </Flex>
                    </Flex>
                    <Flex style={{ marginTop: 12 }}>
                        <Image style={styles.mealIcon} source={require("@/assets/images/medication/icon.png")} />
                        <View style={styles.mealCol}>
                            <Text style={styles.mealColTitle}>豆浆</Text>
                            <Text style={styles.mealColText}>1杯  约450毫升</Text>
                        </View>
                        <Flex>
                            <Text style={styles.kllText}>140千卡</Text>
                            <MaterialIcons name="arrow-forward-ios" size={16} color="#173F7D" />
                        </Flex>
                    </Flex>
                </View>
                </View>
            </View>
        </ScrollView>
    );
}
