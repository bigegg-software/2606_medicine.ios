import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
  TextInput,
  Keyboard,
  Platform,
  type ImageSourcePropType,
  type KeyboardEvent,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '@/css/nutrition';
import NutrientProgressRing from './NutrientProgressRing';
import { getMealNotePlaceholder } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import type { DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getCaloriesToFoodEquiv, type CaloriesToFoodEquivResult } from '@/api/mealDetail';
import SpeechToText, { type SpeechToTextRef } from '@/src/features/assistant/components/SpeechToText';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildPrescriptionAdviceItems,
  buildPrescriptionCalories,
  buildPrescriptionDietMode,
  buildPrescriptionMacroSources,
  buildPrescriptionMonitorCards,
  buildPrescriptionNutrients,
  formatFoodEquivText,
  nutrientGramsToCalories,
} from './utils/nutritionPrescriptionHelpers';

const ICON_COLLAPSE = require('@/assets/images/nutrition/sq.png');
const ICON_EXPAND = require('@/assets/images/nutrition/dk.png');

type Props = {
  dietRule?: DietPatientRuleInfo | null;
};

function ExpandableMonitorCard({
  title,
  icon,
  badge,
  text,
  colors,
  contentStyle,
}: {
  title: string;
  icon: ImageSourcePropType;
  badge: string | null;
  text: string;
  colors: readonly [string, string, string];
  contentStyle: object | object[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  return (
    <LinearGradient
      colors={[...colors]}
      locations={[0, 0.3, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={contentStyle}
    >
      <Flex justify="between">
        <Flex>
          <Image style={styles.navIcon} source={icon} />
          <Text style={styles.calendarContentTitle}>{title}</Text>
        </Flex>
        {badge ? (
          <Flex style={styles.jcRightBox}>
            <Text style={styles.jcRightText}>{badge}</Text>
          </Flex>
        ) : null}
      </Flex>
      <View style={styles.jcTextWrap}>
        {!expanded ? (
          <Text
            style={[styles.jcText, styles.jcTextMeasure]}
            onTextLayout={e => {
              if (e.nativeEvent.lines.length > 2) {
                setCanExpand(true);
              }
            }}
          >
            {text}
          </Text>
        ) : null}
        <Text style={styles.jcText} numberOfLines={expanded ? undefined : 2}>
          {text}
        </Text>
        {canExpand || expanded ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.jcExpandBtn}
            onPress={() => setExpanded(prev => !prev)}
          >
            <LinearGradient
              colors={['rgba(254,255,255,0)', '#FEFFFF', '#FEFFFF']}
              locations={[0, 0.35, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.jcExpandGradient}
            >
              <Flex align="center">
                <Image
                  tintColor="#6D925E"
                  style={styles.jcExpandIcon}
                  source={expanded ? ICON_EXPAND : ICON_COLLAPSE}
                />
                <Text style={styles.jcExpandText}>{expanded ? '收起' : '展开'}</Text>
              </Flex>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  );
}

export default function NutritionPrescriptionPage({ dietRule = null }: Props) {
  const insets = useSafeAreaInsets();
  const navigation: any = useNavigation();
  const calories = useMemo(() => buildPrescriptionCalories(dietRule), [dietRule]);
  const nutrientItems = useMemo(() => buildPrescriptionNutrients(dietRule), [dietRule]);
  const dietMode = useMemo(() => buildPrescriptionDietMode(dietRule), [dietRule]);
  const macroSources = useMemo(() => buildPrescriptionMacroSources(dietRule), [dietRule]);
  const adviceItems = useMemo(() => buildPrescriptionAdviceItems(dietRule), [dietRule]);
  const monitorCards = useMemo(() => buildPrescriptionMonitorCards(dietRule), [dietRule]);

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [mealNote, setMealNote] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [caloriesFoodEquiv, setCaloriesFoodEquiv] = useState('');
  const [nutrientFoodEquivMap, setNutrientFoodEquivMap] = useState<Record<string, string>>({});
  const speechToTextRef = useRef<SpeechToTextRef>(null);
  const voiceBaseTextRef = useRef('');
  const mealNotePlaceholder = useMemo(() => getMealNotePlaceholder(), []);

  const showSendAction = mealNote.trim().length > 0 || isVoiceListening;

  useEffect(() => {
    setExpandedMap(
      Object.fromEntries(adviceItems.map(item => [item.key, item.defaultExpanded])),
    );
  }, [adviceItems]);

  useEffect(() => {
    let cancelled = false;
    const caloriesValue = Number(calories.calories);

    const loadFoodEquiv = async () => {
      if (!Number.isFinite(caloriesValue) || caloriesValue <= 0) {
        if (!cancelled) setCaloriesFoodEquiv('');
        return;
      }
      try {
        const res = await getCaloriesToFoodEquiv({ calories: caloriesValue });
        if (cancelled) return;
        if (!isResourceApiOk(res as unknown as CaloriesToFoodEquivResult)) {
          setCaloriesFoodEquiv('');
          return;
        }
        setCaloriesFoodEquiv(
          formatFoodEquivText(apiResourceData(res as unknown as CaloriesToFoodEquivResult)),
        );
      } catch {
        if (!cancelled) setCaloriesFoodEquiv('');
      }
    };

    void loadFoodEquiv();
    return () => {
      cancelled = true;
    };
  }, [calories.calories]);

  useEffect(() => {
    let cancelled = false;

    const loadNutrientFoodEquiv = async () => {
      const entries = await Promise.all(
        nutrientItems.map(async item => {
          const nutrientCalories = nutrientGramsToCalories(item.key, item.grams);
          if (nutrientCalories <= 0) return [item.key, ''] as const;
          try {
            const res = await getCaloriesToFoodEquiv({ calories: nutrientCalories });
            const payload = res as unknown as CaloriesToFoodEquivResult;
            if (!isResourceApiOk(payload)) return [item.key, ''] as const;
            return [item.key, formatFoodEquivText(apiResourceData(payload))] as const;
          } catch {
            return [item.key, ''] as const;
          }
        }),
      );
      if (cancelled) return;
      setNutrientFoodEquivMap(Object.fromEntries(entries));
    };

    void loadNutrientFoodEquiv();
    return () => {
      cancelled = true;
    };
  }, [nutrientItems]);

  const toggleAdvice = (key: string) => {
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVoiceStart = useCallback(() => {
    voiceBaseTextRef.current = mealNote;
  }, [mealNote]);

  const handleVoiceTextChange = useCallback((text: string) => {
    setMealNote(voiceBaseTextRef.current + text);
  }, []);

  const handleMicPress = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleKeyboardClose = useCallback(() => {
    void speechToTextRef.current?.stopListening();
    Keyboard.dismiss();
  }, []);

  const handleRightPress = useCallback(() => {
    if (showSendAction) {
      const text = mealNote.trim();
      if (!text) {
        Toast.fail('请输入或录入食物描述');
        return;
      }
      void speechToTextRef.current?.stopListening();
      Keyboard.dismiss();
      setMealNote('');
      navigation.navigate('MealRecognizingPage', { mode: 'text', text });
      return;
    }
    navigation.navigate('MealRecognitionPage', { text: mealNote });
  }, [mealNote, navigation, showSendAction]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomBarBottom = useMemo(() => {
    if (keyboardHeight <= 0) return Math.max(insets.bottom, 16);
    return Math.max(0, keyboardHeight - insets.bottom) + 8;
  }, [insets.bottom, keyboardHeight]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.scroll, { paddingHorizontal: 0 }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.backImageBox}>
          <ImageBackground
            source={require('@/assets/images/nutrition/back.png')}
            style={styles.backImage}
          >
            <Flex>
              <Image
                style={styles.navIcon}
                source={require('@/assets/images/nutrition/kll.png')}
              />
              <Text style={styles.calendarContentTitle}>每日推荐热量</Text>
            </Flex>
            <Flex style={styles.kcalBox}>
              <Text style={styles.kcalValue}>{calories.calories}</Text>
              <Text style={styles.kcalText}>kcal</Text>
            </Flex>
            <Flex align="start" style={styles.kcalInfoBox}>
              <Image
                style={styles.kcalInfoIcon}
                source={require('@/assets/images/nutrition/kllInfo.png')}
              />
              <Text style={styles.kcalInfoText}>
                {caloriesFoodEquiv || calories.energyTip || '换算中...'}
              </Text>
            </Flex>
          </ImageBackground>
        </View>

        <View style={styles.nutritionContent}>
          <Flex justify="between">
            <Text style={styles.calendarContentTitle}>三大营养素目标</Text>
            <Text style={[styles.calendarContentSubtitle, { color: '#999999' }]}>
              克数·生活化翻译
            </Text>
          </Flex>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
            {nutrientItems.map(item => (
              <View key={item.key} style={styles.colBox}>
                <Flex justify="center" style={styles.colValueBox}>
                  <NutrientProgressRing progress={item.progress} color={item.color} />
                  <Text style={styles.colValue}>
                    {item.amountText}
                    <Text style={styles.colValueText}>g</Text>
                  </Text>
                </Flex>
                <Flex style={{ marginTop: 8 }} justify="center">
                  <Image style={styles.colImg} source={item.icon} />
                  <Text style={styles.colTitle}>{item.title}</Text>
                </Flex>
                <Text style={styles.colText}>
                  {nutrientFoodEquivMap[item.key] || item.desc || '换算中...'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {dietMode ? (
          <View style={styles.nutritionContent}>
            <Text style={styles.calendarContentTitle}>推荐饮食模式</Text>
            <View style={styles.modeBox}>
              <Flex>
                <Flex style={styles.tipBox}>
                  <Text style={styles.tipBoxTitle}>{dietMode.code}</Text>
                </Flex>
                <Text style={styles.tipBoxText}>{dietMode.title}</Text>
              </Flex>
              <Text style={styles.tipBoxText1}>{dietMode.reasoning}</Text>
              {dietMode.strategy ? (
                <Flex align="start" style={styles.tipBox1}>
                  <Image
                    source={require('@/assets/images/nutrition/star1.png')}
                    style={styles.tipBox1Img}
                  />
                  <Text style={styles.tipBox1Text}>{dietMode.strategy}</Text>
                </Flex>
              ) : null}
            </View>
          </View>
        ) : null}

        {macroSources.length > 0 ? (
          <>
            <ImageBackground
              source={require('@/assets/images/schedule/calendarBack.png')}
              style={styles.backImage1}
            >
              <Flex align="center" style={{ flex: 1, paddingLeft: 20 }}>
                <Text style={styles.backImage1Text}>三大营养素来源建议</Text>
              </Flex>
            </ImageBackground>
            {macroSources.map(item => (
              <View
                key={item.key}
                style={[
                  styles.nutritionContent,
                  item.key === macroSources[0]?.key ? { marginTop: 0 } : null,
                ]}
              >
                <Flex style={{ marginBottom: 8 }}>
                  <Image style={styles.navIcon} source={item.icon} />
                  <Text style={styles.calendarContentTitle}>{item.title}</Text>
                </Flex>
                <Text style={styles.dietListText}>{item.desc}</Text>
                {item.tags.length > 0 ? (
                  <Flex wrap='wrap' style={styles.tabBox}>
                    {item.tags.map(tag => (
                      <Flex key={`${item.key}-${tag}`} style={styles.tabItem}>
                        <Text style={styles.tabItemText}>{tag}</Text>
                      </Flex>
                    ))}
                  </Flex>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {adviceItems.length > 0 ? (
          <View style={styles.nutritionContent}>
            <Flex>
              <Image
                style={styles.navIcon}
                source={require('@/assets/images/nutrition/icon1.png')}
              />
              <Text style={styles.calendarContentTitle}>分项健康建议</Text>
            </Flex>
            {adviceItems.map(item => {
              const expanded = !!expandedMap[item.key];
              return (
                <View key={item.key}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => toggleAdvice(item.key)}>
                    <Flex justify="between" style={styles.fxBox}>
                      <Flex>
                        <Image style={styles.fxIcon} source={item.icon} />
                        <Text style={styles.fxTitle}>{item.title}</Text>
                      </Flex>
                      <Image
                        style={styles.fxIcon}
                        source={expanded ? ICON_EXPAND : ICON_COLLAPSE}
                      />
                    </Flex>
                  </TouchableOpacity>
                  {expanded ? (
                    <ImageBackground source={item.background} style={styles.fxBackBox}>
                      <View style={styles.fxBackBoxContent}>
                        {item.tips.map((tip, tipIndex) => (
                          <Flex
                            key={`${item.key}-tip-${tipIndex}`}
                            align="start"
                            style={styles.fxTextCol}
                          >
                            <View
                              style={[
                                styles.fxBackBoxContentImg,
                                { backgroundColor: item.dotColor },
                              ]}
                            />
                            <Text style={[styles.fxText, { color: item.color }]}>{tip}</Text>
                          </Flex>
                        ))}
                      </View>
                    </ImageBackground>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {monitorCards.length > 0 ? (
          <>
            <ImageBackground
              source={require('@/assets/images/schedule/calendarBack.png')}
              style={styles.backImage1}
            >
              <Flex align="center" style={{ flex: 1, paddingLeft: 20 }}>
                <Text style={styles.backImage1Text}>药物与监测</Text>
              </Flex>
            </ImageBackground>
            {monitorCards.map((card, index) => (
              <ExpandableMonitorCard
                key={card.key}
                title={card.title}
                icon={card.icon}
                badge={card.badge}
                text={card.text}
                colors={card.colors}
                contentStyle={
                  index === 0 ? [styles.jcContent, { marginTop: 0 }] : styles.jcContent
                }
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <Flex
        justify="between"
        align="center"
        style={[
          styles.mealBottomBar,
          { bottom: bottomBarBottom },
          keyboardHeight > 0 ? { zIndex: 20, elevation: 20 } : null,
        ]}
      >
        <Flex style={styles.bottomInputWrapper}>
          <SpeechToText
            ref={speechToTextRef}
            onMicPress={handleMicPress}
            onStart={handleVoiceStart}
            onTextChange={handleVoiceTextChange}
            onListeningChange={setIsVoiceListening}
            idleIcon={require('@/assets/images/nutrition/icon_audio.png')}
            activeIcon={require('@/assets/images/nutrition/icon_audio1.png')}
            iconSize={20}
            style={styles.mealMicWrap}
          />
          <TextInput
            style={styles.mealInput}
            value={mealNote}
            onChangeText={setMealNote}
            placeholder={mealNotePlaceholder}
            placeholderTextColor="#999999"
            returnKeyType="done"
            onSubmitEditing={handleKeyboardClose}
          />
        </Flex>
        <TouchableOpacity activeOpacity={0.7} onPress={handleRightPress}>
          <Image
            style={styles.mealBtmIcon}
            source={
              showSendAction
                ? require('@/assets/images/nutrition/icon_send.png')
                : require('@/assets/images/nutrition/icon_def.png')
            }
          />
        </TouchableOpacity>
      </Flex>
    </View>
  );
}
