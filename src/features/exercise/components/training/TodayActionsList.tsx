import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import type { ExRecordTrainingPhase } from '@/api/exRecord';
import styles from '@/css/exercise';
import {
  canPressTrainingAction,
  formatTrainingActionButtonText,
  formatTrainingPhaseSubtitle,
  isCertUnlockPending,
  isTrainingActionCompleted,
  resolveTrainingActionButtonIconSource,
  shouldShowTrainingActionIcon,
  type MainTrainingPlayCard,
  type TrainingActionDateMode,
  type TrainingPhaseExerciseCard,
} from '../../utils/trainingPhaseHelpers';

export type TodayActionListItem = TrainingPhaseExerciseCard & {
  trainingPhase: ExRecordTrainingPhase;
  exerciseType?: MainTrainingPlayCard['exerciseType'];
};

type Props = {
  warmupCards: TrainingPhaseExerciseCard[];
  mainPlayCards: MainTrainingPlayCard[];
  cooldownCards: TrainingPhaseExerciseCard[];
  loading?: boolean;
  readOnly?: boolean;
  disablePlayer?: boolean;
  dateMode?: TrainingActionDateMode;
  isRestOrEmpty?: boolean;
  emptyText?: string;
  onPressItem: (item: TodayActionListItem) => void;
};

function buildMergedItems(
  warmupCards: TrainingPhaseExerciseCard[],
  mainPlayCards: MainTrainingPlayCard[],
  cooldownCards: TrainingPhaseExerciseCard[],
): TodayActionListItem[] {
  const warmup = warmupCards.map(card => ({
    ...card,
    key: `hot-${card.key}`,
    trainingPhase: 'hot' as const,
  }));
  const main = mainPlayCards.map(card => ({
    ...card,
    key: `main-${card.key}`,
    trainingPhase: 'main' as const,
    exerciseType: card.exerciseType,
  }));
  const cooldown = cooldownCards.map(card => ({
    ...card,
    key: `cold-${card.key}`,
    trainingPhase: 'cold' as const,
  }));
  return [...warmup, ...main, ...cooldown];
}

function ActionRow({
  item,
  isFirst,
  readOnly,
  disablePlayer,
  dateMode,
  onPress,
}: {
  item: TodayActionListItem;
  isFirst: boolean;
  readOnly: boolean;
  disablePlayer: boolean;
  dateMode: TrainingActionDateMode;
  onPress: (item: TodayActionListItem) => void;
}) {
  const actionCompleted = isTrainingActionCompleted(item);
  const actionText = formatTrainingActionButtonText(item, { dateMode });
  const showActionIcon = shouldShowTrainingActionIcon(item, { dateMode });
  const actionPressable = canPressTrainingAction(item, dateMode, { readOnly, disablePlayer });
  const certPending = isCertUnlockPending(item);
  // 待认证：家属/历史只读、非今日（含过往）置灰；本人今日不置灰
  const muteAction = !actionPressable && (
    !certPending || readOnly || disablePlayer || dateMode !== 'today'
  );

  return (
    <View style={[styles.todayActionCard, isFirst ? styles.todayActionCardFirst : null]}>
      <Flex align="center">
        <Image style={styles.todayActionThumb} source={item.coverSource} />
        <View style={styles.todayActionInfo}>
          <Text style={styles.todayActionTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.todayActionSubtitle} numberOfLines={1}>
            {formatTrainingPhaseSubtitle(item)}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={actionPressable ? 0.75 : 1}
          disabled={!actionPressable}
          onPress={() => onPress(item)}>
          <Flex
            align="center"
            style={[
              styles.todayActionBtn,
              muteAction ? { opacity: 0.45 } : null,
            ]}>
            {showActionIcon ? (
              <Image
                style={styles.todayActionBtnIcon}
                source={resolveTrainingActionButtonIconSource(item, actionCompleted)}
              />
            ) : null}
            <Text style={styles.todayActionBtnText}>
              {actionText}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </View>
  );
}

export default function TodayActionsList({
  warmupCards,
  mainPlayCards,
  cooldownCards,
  loading = false,
  readOnly = false,
  disablePlayer = false,
  dateMode = 'today',
  isRestOrEmpty = false,
  emptyText = '今日暂无训练安排',
  onPressItem,
}: Props) {
  const items = useMemo(
    () => buildMergedItems(warmupCards, mainPlayCards, cooldownCards),
    [cooldownCards, mainPlayCards, warmupCards],
  );

  return (
    <View style={styles.todayActionsBox}>
      <Flex align="center" justify="between" style={styles.todayActionsHeader}>
        <Text style={styles.todayActionsTitle}>今天的动作</Text>
        <Flex align="center" style={styles.todayActionsBadge}>
          <Image
            style={styles.todayActionsBadgeIcon}
            source={require('@/assets/images/exercise/icon_home.png')}
          />
          <Text style={styles.todayActionsBadgeText}>居家可完成</Text>
        </Flex>
      </Flex>

      {loading ? (
        <View style={{ paddingVertical: 28, alignItems: 'center' }}>
          <ActivityIndicator color="#6D925E" />
        </View>
      ) : isRestOrEmpty || items.length === 0 ? (
        <View style={styles.mainTrainingRestEmpty}>
          <Image
            style={styles.mainTrainingRestIcon}
            source={require('@/assets/images/exercise/icon_empty_training.png')}
          />
          <Text style={styles.mainTrainingRestText}>{emptyText}</Text>
        </View>
      ) : (
        items.map((item, index) => (
          <ActionRow
            key={item.key}
            item={item}
            isFirst={index === 0}
            readOnly={readOnly}
            disablePlayer={disablePlayer}
            dateMode={dateMode}
            onPress={onPressItem}
          />
        ))
      )}
    </View>
  );
}
