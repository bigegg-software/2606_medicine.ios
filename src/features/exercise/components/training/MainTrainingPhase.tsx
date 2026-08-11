import React, { useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/exercise';
import type { InUseExPatientRule } from '@/api/schedule';
import type { RootStackParamList } from '@/route/router';
import GroupCountTags from './GroupCountTags';
import {
  buildMainTrainingModules,
  canPressTrainingAction,
  formatMainTrainingFittTip,
  formatTrainingActionButtonText,
  formatTrainingPhaseSubtitle,
  isTrainingActionCompleted,
  shouldShowTrainingActionIcon,
  type MainTrainingTypeModule,
  type TrainingActionDateMode,
  type TrainingPhaseExerciseCard,
} from '../../utils/trainingPhaseHelpers';
import {
  resolveGroupTargetCount,
  resolveScheduleGroupVal,
} from '../../utils/exercisePlayerHelpers';

type Props = {
  dayRule?: InUseExPatientRule | null;
  selectedDate: string;
  readOnly?: boolean;
  dateMode?: TrainingActionDateMode;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function resolveTaskIndex(dayRule: InUseExPatientRule | null | undefined, exerciseType: string) {
  const list = dayRule?.ruleRatioList ?? [];
  const matched = list.findIndex(item => item.exerciseType?.trim() === exerciseType);
  return matched >= 0 ? matched : undefined;
}

function ActionCardRow({
  card,
  onPressTimer,
  readOnly = false,
  dateMode = 'today',
}: {
  card: TrainingPhaseExerciseCard;
  onPressTimer: (card: TrainingPhaseExerciseCard) => void;
  readOnly?: boolean;
  dateMode?: TrainingActionDateMode;
}) {
  const scheduleGroupVal = resolveScheduleGroupVal(card);
  // 计时类型仅多组时展示组别；单组不显示
  const showSets = card.timerType === 'duration_min'
    ? scheduleGroupVal > 1
    : scheduleGroupVal > 0;
  const targetCount = card.timerType === 'duration_min' ? 0 : resolveGroupTargetCount(card);
  const actionCompleted = isTrainingActionCompleted(card);
  const actionText = formatTrainingActionButtonText(card, { dateMode });
  const showActionIcon = shouldShowTrainingActionIcon(card, { dateMode });
  const actionPressable = canPressTrainingAction(card, dateMode);

  return (
    <View style={styles.mainTrainingActionRow}>
      <Flex align="center">
        <Image style={styles.mainTrainingActionThumb} source={card.coverSource} />
        <View style={styles.mainTrainingActionInfo}>
          <Text style={styles.mainTrainingActionTitle} numberOfLines={1}>
            {card.title}
          </Text>
          <Text style={styles.mainTrainingActionDesc} numberOfLines={2}>
            {card.ruleText}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={actionPressable ? 0.75 : 1}
          disabled={!actionPressable}
          onPress={() => onPressTimer(card)}>
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
          groupCounts={card.groupCounts}
          complateGroups={card.completedGroups}
          readOnly
        />
      ) : null}
    </View>
  );
}

function TypeModule({
  module,
  onOpenPlayer,
  readOnly = false,
  dateMode = 'today',
}: {
  module: MainTrainingTypeModule;
  onOpenPlayer: (card?: TrainingPhaseExerciseCard) => void;
  readOnly?: boolean;
  dateMode?: TrainingActionDateMode;
}) {
  return (
    <View style={styles.mainTrainingModule}>
      <Flex align="center" justify="between">
        <Flex align="center" style={{ flexShrink: 1 }}>
          <Image
            style={styles.mainTrainingModuleIcon}
            tintColor="#333"
            source={module.icon}
          />
          <View style={styles.mainTrainingModuleTitleWrap}>
            <LinearGradient
              colors={['#6D925E', 'rgba(109,146,94,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mainTrainingModuleUnderline}
            />
            <Text style={styles.mainTrainingModuleTitle}>{module.title}</Text>
          </View>
          {module.tipText ? (
            <Text style={styles.mainTrainingModuleTipText}>{module.tipText}</Text>
          ) : null}
        </Flex>
      </Flex>

      {module.cards.map((card, index) => (
        <View key={card.key}>
          {index > 0 ? <View style={styles.mainTrainingActionDivider} /> : null}
          <ActionCardRow
            card={card}
            onPressTimer={onOpenPlayer}
            readOnly={readOnly}
            dateMode={dateMode}
          />
        </View>
      ))}
    </View>
  );
}

export default function MainTrainingPhase({
  dayRule = null,
  selectedDate,
  readOnly = false,
  dateMode = 'today',
}: Props) {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [isRest, setIsRest] = useState(false);
  const [modules, setModules] = useState<MainTrainingTypeModule[]>([]);
  const fittTip = formatMainTrainingFittTip(dayRule);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void buildMainTrainingModules(dayRule, selectedDate)
        .then(result => {
          if (cancelled) return;
          setIsRest(result.isRest);
          setModules(result.modules);
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setIsRest(false);
          setModules([]);
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [dayRule, selectedDate]),
  );

  const openPlayer = (exerciseType: string, card?: TrainingPhaseExerciseCard) => {
    if (card && !canPressTrainingAction(card, dateMode)) return;
    const rule = dayRule?.ruleRatioList?.find(item => item.exerciseType?.trim() === exerciseType);
    navigation.navigate('ExercisePlayerPage', {
      exerciseType,
      exerciseChildType: rule?.exerciseChildType,
      strengthLevel: rule?.strengthLevel,
      taskIndex: resolveTaskIndex(dayRule, exerciseType),
      exVideoId: card?.exVideoId,
      title: card?.title,
      ruleSubtitle: card ? formatTrainingPhaseSubtitle(card) : undefined,
      trainingPhase: 'main',
      groupVal: card?.groupVal,
      numberVal: card?.numberVal,
      keepSecondVal: card?.keepSecondVal,
      durationMinutes: card?.durationMinutes,
      timerType: card?.timerType || undefined,
      readOnly,
      customerLocalDate: selectedDate,
    });
  };

  if (loading) {
    return (
      <View style={[styles.trainingPhaseContent, { paddingVertical: 28, alignItems: 'center' }]}>
        <ActivityIndicator color="#6D925E" />
      </View>
    );
  }

  if (isRest) {
    return (
      <View style={styles.trainingPhaseContent}>
        <Text style={[styles.trainingExerciseDuration, { marginTop: 16, textAlign: 'center' }]}>
          今日为休息日，暂无主训练安排
        </Text>
      </View>
    );
  }

  if (modules.length === 0) {
    return (
      <View style={styles.trainingPhaseContent}>
        <Text style={[styles.trainingExerciseDuration, { marginTop: 16, textAlign: 'center' }]}>
          暂无主训练项目
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.trainingPhaseContent}>
      {modules.map(module => (
        <TypeModule
          key={module.key}
          module={module}
          onOpenPlayer={card => openPlayer(module.key, card)}
          readOnly={readOnly}
          dateMode={dateMode}
        />
      ))}

      <View style={styles.mainTrainingTipBox}>
        <Flex align="center">
          <Image
            style={styles.mainTrainingTipIcon}
            source={require('@/assets/images/exercise/icon_warn.png')}
          />
          <Text style={styles.mainTrainingTipTitle}>处方依据（ACSM FITT-VP）</Text>
        </Flex>
        <Text style={styles.mainTrainingTipText}>{fittTip}</Text>
      </View>
    </View>
  );
}
