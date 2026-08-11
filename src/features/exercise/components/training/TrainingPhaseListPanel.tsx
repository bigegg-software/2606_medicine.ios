import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExRecordTrainingPhase } from '@/api/exRecord';
import styles from '@/css/exercise';
import type { InUseExPatientRule } from '@/api/schedule';
import type { RootStackParamList } from '@/route/router';
import {
  attachTrainingPhaseCompleteInfo,
  buildTrainingPhaseCards,
  canPressTrainingAction,
  formatTrainingActionButtonText,
  formatTrainingPhaseSubtitle,
  isTrainingActionCompleted,
  shouldShowTrainingActionIcon,
  sumTrainingPhaseMinutes,
  type TrainingActionDateMode,
  type TrainingPhaseExerciseCard,
} from '../../utils/trainingPhaseHelpers';
import {
  resolveGroupTargetCount,
  resolveScheduleGroupVal,
} from '../../utils/exercisePlayerHelpers';
import type { ExWeekTrainingItem } from '@/api/exPatientRule';
import GroupCountTags from './GroupCountTags';

const BANNER_ASPECT = 351 / 104;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type TrainingPhaseListConfig = {
  trainingPhase: ExRecordTrainingPhase;
  bannerSource: ImageSourcePropType;
  bannerDesc: string;
  restEmptyText: string;
  emptyText: string;
  formatBannerTitle: (totalMinutes: number) => string;
  getList: (
    rule: InUseExPatientRule | null | undefined,
    customerLocalDate: string,
  ) => { isRest: boolean; items: ExWeekTrainingItem[] };
};

type Props = {
  dayRule?: InUseExPatientRule | null;
  selectedDate: string;
  config: TrainingPhaseListConfig;
  /** 非今日只读，不可执行 */
  readOnly?: boolean;
  dateMode?: TrainingActionDateMode;
};

export default function TrainingPhaseListPanel({
  dayRule = null,
  selectedDate,
  config,
  readOnly = false,
  dateMode = 'today',
}: Props) {
  const navigation = useNavigation<Nav>();
  const [bannerWidth, setBannerWidth] = useState(0);
  const [cards, setCards] = useState<TrainingPhaseExerciseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRest, setIsRest] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const { isRest: restDay, items } = config.getList(dayRule, selectedDate);

      setIsRest(restDay);

      if (restDay || items.length === 0) {
        setCards([]);
        setLoading(false);
        return () => {
          cancelled = true;
        };
      }

      setLoading(true);
      void buildTrainingPhaseCards(items)
        .then(nextCards =>
          attachTrainingPhaseCompleteInfo(nextCards, {
            exPatientRuleId: dayRule?.exPatientRuleId,
            customerLocalDate: selectedDate,
            trainingPhase: config.trainingPhase,
          }),
        )
        .then(nextCards => {
          if (cancelled) return;
          setCards(nextCards);
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setCards([]);
          setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [config, dayRule, selectedDate]),
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== bannerWidth) {
      setBannerWidth(nextWidth);
    }
  };

  const openPlayer = (card: TrainingPhaseExerciseCard) => {
    if (!canPressTrainingAction(card, dateMode)) return;
    navigation.navigate('ExercisePlayerPage', {
      exVideoId: card.exVideoId,
      title: card.title,
      ruleSubtitle: formatTrainingPhaseSubtitle(card),
      trainingPhase: config.trainingPhase,
      groupVal: card.groupVal,
      numberVal: card.numberVal,
      keepSecondVal: card.keepSecondVal,
      durationMinutes: card.durationMinutes,
      timerType: card.timerType,
      readOnly,
      customerLocalDate: selectedDate,
    });
  };

  const totalMinutes = sumTrainingPhaseMinutes(cards);

  return (
    <View style={styles.trainingPhaseContent} onLayout={handleLayout}>
      {bannerWidth > 0 ? (
        <View
          style={[
            styles.trainingPhaseBannerWrap,
            {
              width: bannerWidth,
              height: bannerWidth / BANNER_ASPECT,
            },
          ]}>
          <Image
            style={[
              styles.trainingPhaseBanner,
              {
                width: bannerWidth,
                height: bannerWidth / BANNER_ASPECT,
              },
            ]}
            source={config.bannerSource}
            resizeMode="cover"
          />
          <View style={styles.trainingPhaseBannerBox}>
            <Text style={styles.trainingPhaseBannerTitle}>
              {config.formatBannerTitle(totalMinutes)}
            </Text>
            <Text style={styles.trainingPhaseBannerValue}>{config.bannerDesc}</Text>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: 28, alignItems: 'center' }}>
          <ActivityIndicator color="#6D925E" />
        </View>
      ) : isRest ? (
        <Text style={[styles.trainingExerciseDuration, { marginTop: 16, textAlign: 'center' }]}>
          {config.restEmptyText}
        </Text>
      ) : cards.length === 0 ? (
        <Text style={[styles.trainingExerciseDuration, { marginTop: 16, textAlign: 'center' }]}>
          {config.emptyText}
        </Text>
      ) : (
        cards.map(item => {
          const scheduleGroupVal = resolveScheduleGroupVal(item);
          const targetCount = item.timerType === 'duration_min' ? 0 : resolveGroupTargetCount(item);
          // 计时类型仅多组时展示组别；单组不显示
          const showSets = item.timerType === 'duration_min'
            ? scheduleGroupVal > 1
            : scheduleGroupVal > 0;
          const actionCompleted = isTrainingActionCompleted(item);
          const actionText = formatTrainingActionButtonText(item, { dateMode });
          const showActionIcon = shouldShowTrainingActionIcon(item, { dateMode });
          const actionPressable = canPressTrainingAction(item, dateMode);
          return (
            <View key={item.key} style={styles.trainingExerciseCard}>
              <Flex align="center">
                <Image style={styles.trainingExerciseThumb} source={item.coverSource} />
                <View style={styles.trainingExerciseInfo}>
                  <Text style={styles.trainingExerciseTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.trainingExerciseDuration} numberOfLines={1}>
                    {formatTrainingPhaseSubtitle(item)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={actionPressable ? 0.75 : 1}
                  disabled={!actionPressable}
                  onPress={() => openPlayer(item)}>
                  <Flex
                    align="center"
                    style={[
                      styles.mainTrainingActionTimer,
                      !actionPressable ? { opacity: 0.45 } : null,
                    ]}>
                    {showActionIcon ? (
                      <Image
                        style={styles.mainTrainingActionTimerIcon}
                        source={
                          actionCompleted
                            ? require('@/assets/images/exercise/icon_wc.png')
                            : require('@/assets/images/exercise/icon_jsq.png')
                        }
                      />
                    ) : null}
                    <Text style={styles.mainTrainingActionTimerText}>{actionText}</Text>
                  </Flex>
                </TouchableOpacity>
              </Flex>
              {showSets ? (
                <GroupCountTags
                  totalGroups={scheduleGroupVal}
                  targetCount={targetCount}
                  groupCounts={item.groupCounts}
                  complateGroups={item.completedGroups}
                  readOnly
                />
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}
