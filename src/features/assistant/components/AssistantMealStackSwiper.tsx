import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import mealStyles from '@/css/medication/meal';
import type { MealCardData } from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';

const SWIPE_THRESHOLD = 40;
const SWIPE_MAX_DRAG = 28;
const SWIPE_TRANSITION = 16;
const SWIPE_ANIM_DURATION = 180;

function MealCardContent({ meal }: { meal: MealCardData }) {
  return (
    <Flex style={mealStyles.ysBox}>
      <View>
        <Flex justify="center">
          <Image style={mealStyles.ysIcon} source={meal.icon} />
          <Text style={mealStyles.ysText}>{meal.title}</Text>
        </Flex>
        <Flex justify="center" style={mealStyles.wlrBox}>
          <Text style={mealStyles.wlrText}>{meal.time}</Text>
        </Flex>
      </View>
      <View style={mealStyles.line}>
        {Array.from({ length: 5 }, (_, index) => (
          <View key={index} style={mealStyles.lineDash} />
        ))}
      </View>
      <View style={mealStyles.ysRight}>
        <View style={mealStyles.foodList}>
          {meal.foods.map((food, index) => (
            <View key={`${food}-${index}`} style={mealStyles.foodBox}>
              <Text style={mealStyles.foodText}>{food}</Text>
            </View>
          ))}
        </View>
        <Flex justify="center" style={mealStyles.jyBox}>
          <Image
            tintColor="#FF8B07"
            source={require('@/assets/images/home/jy.png')}
            style={mealStyles.jyIcon}
          />
          <Text style={mealStyles.jyText}>建议热量：{meal.calories}千卡</Text>
        </Flex>
      </View>
    </Flex>
  );
}

type Props = {
  meals: MealCardData[];
  initialIndex?: number;
};

export default function AssistantMealStackSwiper({ meals, initialIndex = 0 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  useEffect(() => {
    if (meals.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(Math.min(Math.max(initialIndex, 0), meals.length - 1));
  }, [initialIndex, meals]);

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

  if (meals.length === 0) return null;

  const activeMeal = meals[activeIndex];
  const nextMeal = meals.length > 1 ? meals[(activeIndex + 1) % meals.length] : null;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={mealStyles.stackWrap}>
        {nextMeal ? (
          <Animated.View
            style={[mealStyles.stackLayerCard, mealStyles.stackLayerMiddle, nextCardStyle]}
            pointerEvents="none">
            <MealCardContent meal={nextMeal} />
          </Animated.View>
        ) : null}
        <Animated.View style={[mealStyles.stackMainCard, mainCardStyle]}>
          <MealCardContent meal={activeMeal} />
        </Animated.View>
        {meals.length >= 2 ? (
          <>
            <Animated.View style={[mealStyles.stackPeek, mealStyles.stackPeekFirst, peek1Style]} />
            <Animated.View style={[mealStyles.stackPeek, mealStyles.stackPeekSecond, peek2Style]} />
          </>
        ) : null}
      </View>
    </GestureDetector>
  );
}
