import React, { useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/exercise';
import type { InUseExPatientRule } from '@/api/schedule';
import type { RootStackParamList } from '@/route/router';
import TrainingPlayerRing from './TrainingPlayerRing';
import {
  buildMainTrainingModules,
  formatChineseGroupLabel,
  formatClockFromMinutes,
  formatGoalMinutesText,
  formatMainTrainingFittTip,
  formatTrainingPhaseSubtitle,
  type MainTrainingTypeModule,
  type TrainingPhaseExerciseCard,
} from '../../utils/trainingPhaseHelpers';

type Props = {
  dayRule?: InUseExPatientRule | null;
  selectedDate: string;
  readOnly?: boolean;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function resolveTaskIndex(dayRule: InUseExPatientRule | null | undefined, exerciseType: string) {
  const list = dayRule?.ruleRatioList ?? [];
  const matched = list.findIndex(item => item.exerciseType?.trim() === exerciseType);
  return matched >= 0 ? matched : undefined;
}

function StrengthSetRow({ card }: { card: TrainingPhaseExerciseCard }) {
  const totalGroups = Math.max(0, card.groupVal || 0);
  if (totalGroups <= 0) return null;

  return (
    <Flex align="center" style={styles.mainTrainingSetRow} wrap="wrap">
      {Array.from({ length: totalGroups }, (_, index) => {
        const groupNo = index + 1;
        const done = card.completedGroups.includes(groupNo);
        return (
          <View
            key={`${card.key}-set-${index}`}
            style={[styles.mainTrainingSetTag, done && styles.mainTrainingSetTagDone]}>
            <Text
              style={[
                styles.mainTrainingSetTagText,
                done && styles.mainTrainingSetTagTextDone,
              ]}>
              {formatChineseGroupLabel(groupNo)}
            </Text>
          </View>
        );
      })}
    </Flex>
  );
}

function ActionCardRow({
  card,
  onPressTimer,
  readOnly = false,
}: {
  card: TrainingPhaseExerciseCard;
  onPressTimer: (card: TrainingPhaseExerciseCard) => void;
  readOnly?: boolean;
}) {
  const showSets = card.groupVal > 0;
  const allGroupsDone = card.groupVal > 0
    && Array.from({ length: card.groupVal }, (_, index) => index + 1)
      .every(groupNo => card.completedGroups.includes(groupNo));

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
        <TouchableOpacity activeOpacity={0.75} onPress={() => onPressTimer(card)}>
          <Flex align="center" style={styles.mainTrainingActionTimer}>
            <Image
              style={styles.mainTrainingActionTimerIcon}
              source={
                readOnly || allGroupsDone
                  ? require('@/assets/images/exercise/icon_wc.png')
                  : require('@/assets/images/exercise/icon_jsq.png')
              }
            />
            <Text style={styles.mainTrainingActionTimerText}>
              {readOnly ? '查看' : allGroupsDone ? '完成' : '开始'}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
      {showSets ? <StrengthSetRow card={card} /> : null}
    </View>
  );
}

function CardioModule({
  module,
  onOpenPlayer,
  readOnly = false,
}: {
  module: MainTrainingTypeModule;
  onOpenPlayer: (card?: TrainingPhaseExerciseCard) => void;
  readOnly?: boolean;
}) {
  const primary = module.cards[0];
  const goalMinutes = primary?.durationMinutes ?? 0;

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
        </Flex>
      </Flex>

      {primary?.timerType === 'duration_min' ? (
        <>
          <View style={styles.mainTrainingDivider} />
          <Flex justify="center" align="center" style={styles.mainTrainingPlayerRow}>
            <Image
              style={styles.mainTrainingPlayerSideIcon}
              source={require('@/assets/images/exercise/icon_refresh.png')}
            />
            <View style={styles.mainTrainingPlayerCenter}>
              <TrainingPlayerRing progress={0} />
              <View style={styles.mainTrainingPlayerCenterText} pointerEvents="none">
                <Text style={styles.mainTrainingPlayerTime}>
                  {formatClockFromMinutes(goalMinutes)}
                </Text>
                <Text style={styles.mainTrainingPlayerGoal}>
                  {formatGoalMinutesText(goalMinutes)}
                </Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.75} onPress={() => onOpenPlayer(primary)}>
              <Image
                style={styles.mainTrainingPlayerSideIcon}
                source={require('@/assets/images/exercise/icon_start.png')}
              />
            </TouchableOpacity>
          </Flex>
        </>
      ) : null}

      {module.cards.map((card, index) => (
        <View key={card.key}>
          {index > 0 || primary?.timerType === 'duration_min' ? (
            <View style={styles.mainTrainingActionDivider} />
          ) : null}
          <ActionCardRow card={card} onPressTimer={onOpenPlayer} readOnly={readOnly} />
        </View>
      ))}
    </View>
  );
}

function TypeModule({
  module,
  onOpenPlayer,
  readOnly = false,
}: {
  module: MainTrainingTypeModule;
  onOpenPlayer: (card?: TrainingPhaseExerciseCard) => void;
  readOnly?: boolean;
}) {
  if (module.key === 'cardio') {
    return <CardioModule module={module} onOpenPlayer={onOpenPlayer} readOnly={readOnly} />;
  }

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
          <ActionCardRow card={card} onPressTimer={onOpenPlayer} readOnly={readOnly} />
        </View>
      ))}
    </View>
  );
}

export default function MainTrainingPhase({ dayRule = null, selectedDate, readOnly = false }: Props) {
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
      timerType: card?.timerType,
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
