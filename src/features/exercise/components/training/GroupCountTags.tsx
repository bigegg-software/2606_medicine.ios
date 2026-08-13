import React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/exercise';
import {
  canPressGroupCountTag,
  isGroupCountDone,
} from '../../utils/exercisePlayerHelpers';
import { formatChineseGroupLabel } from '../../utils/trainingPhaseHelpers';

type Props = {
  totalGroups: number;
  targetCount: number;
  groupCounts: number[];
  /** 接口 complateGroups；保留入参兼容 */
  complateGroups?: number[] | null;
  /** 组间休息秒数；>0 时展示在组别末尾 */
  restBetweenGroupSeconds?: number | null;
  /** 列表只读展示时不响应点击 */
  readOnly?: boolean;
  onPressGroup?: (groupIndex: number) => void;
  onLongPressGroup?: (groupIndex: number) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * 组别标签：无记录「第N组」；有次数显示 3/10（无 icon）；达标才显示完成 icon。
 * 可点：当前待录入组、未达标进度；不可点：已达标、未到序的空组。
 * 末尾可展示组间休息时长（如 icon + 60s）。
 * 组数较多时横向滑动。
 */
export default function GroupCountTags({
  totalGroups,
  targetCount,
  groupCounts,
  restBetweenGroupSeconds,
  readOnly = false,
  onPressGroup,
  onLongPressGroup,
  style,
}: Props) {
  const safeTotal = Math.max(0, Math.round(Number(totalGroups) || 0));
  if (safeTotal <= 0) return null;

  const target = Math.max(0, Math.round(Number(targetCount) || 0));
  const restSeconds = Math.max(0, Math.round(Number(restBetweenGroupSeconds) || 0));

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.mainTrainingSetRow, style]}
      contentContainerStyle={styles.mainTrainingSetRowContent}
      bounces={false}>
      {Array.from({ length: safeTotal }, (_, index) => {
        const count = Math.max(0, Math.round(Number(groupCounts[index]) || 0));
        const hasProgress = count > 0;
        const targetMet = isGroupCountDone(count, target);
        const canEdit = Boolean(onPressGroup)
          && !readOnly
          && canPressGroupCountTag(index, groupCounts, safeTotal, target);
        const label = hasProgress
          ? (target > 0 ? `${count}/${target}` : String(count))
          : formatChineseGroupLabel(index + 1);
        const content = (
          <Flex
            align="center"
            style={[
              styles.mainTrainingSetTag,
              hasProgress && !targetMet && styles.mainTrainingSetTagProgress,
              targetMet && styles.mainTrainingSetTagDone,
            ]}>
            {targetMet ? (
              <Image
                style={styles.groupCountTagIcon}
                source={require('@/assets/images/exercise/icon_wc.png')}
              />
            ) : null}
            <Text
              style={[
                styles.mainTrainingSetTagText,
                (hasProgress || targetMet) && styles.mainTrainingSetTagTextDone,
              ]}>
              {label}
            </Text>
          </Flex>
        );

        if (!canEdit) {
          return <View key={`group-count-${index}`}>{content}</View>;
        }

        return (
          <TouchableOpacity
            key={`group-count-${index}`}
            activeOpacity={0.75}
            onPress={() => onPressGroup?.(index)}
            onLongPress={onLongPressGroup ? () => onLongPressGroup(index) : undefined}>
            {content}
          </TouchableOpacity>
        );
      })}
      {restSeconds > 0 ? (
        <View key="group-rest" style={styles.groupRestTagWrap}>
          <Flex align="center" style={styles.groupRestTag}>
            <Image
              style={styles.groupRestTagIcon}
              source={require('@/assets/images/exercise/icon_time.png')}
            />
            <Text style={styles.groupRestTagText}>{`${restSeconds}s`}</Text>
          </Flex>
        </View>
      ) : null}
    </ScrollView>
  );
}
