import React from 'react';
import { Image, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/exercise';
import { isGroupDisplayDone } from '../../utils/exercisePlayerHelpers';
import { formatChineseGroupLabel } from '../../utils/trainingPhaseHelpers';

type Props = {
  totalGroups: number;
  targetCount: number;
  groupCounts: number[];
  /** 接口 complateGroups；为空时按次数推断完成态 */
  complateGroups?: number[] | null;
  /** 列表只读展示时不响应点击 */
  readOnly?: boolean;
  onPressGroup?: (groupIndex: number) => void;
  onLongPressGroup?: (groupIndex: number) => void;
  style?: StyleProp<ViewStyle>;
};

/** 组别标签：无记录「第N组」；有次数显示 10/12；完成显示 icon（complateGroups 空时按最后非0前的组推断） */
export default function GroupCountTags({
  totalGroups,
  targetCount,
  groupCounts,
  complateGroups,
  readOnly = false,
  onPressGroup,
  onLongPressGroup,
  style,
}: Props) {
  const safeTotal = Math.max(0, Math.round(Number(totalGroups) || 0));
  if (safeTotal <= 0) return null;

  const target = Math.max(0, Math.round(Number(targetCount) || 0));

  return (
    <Flex align="center" style={[styles.mainTrainingSetRow, style]} wrap="wrap">
      {Array.from({ length: safeTotal }, (_, index) => {
        const count = Math.max(0, Math.round(Number(groupCounts[index]) || 0));
        const hasProgress = count > 0;
        const done = isGroupDisplayDone(index, groupCounts, target, complateGroups);
        const label = hasProgress
          ? (target > 0 ? `${count}/${target}` : String(count))
          : formatChineseGroupLabel(index + 1);
        const content = (
          <Flex
            align="center"
            style={[
              styles.mainTrainingSetTag,
              hasProgress && !done && styles.mainTrainingSetTagProgress,
              done && styles.mainTrainingSetTagDone,
            ]}>
            {done ? (
              <Image
                style={styles.groupCountTagIcon}
                source={require('@/assets/images/exercise/icon_wc.png')}
              />
            ) : null}
            <Text
              style={[
                styles.mainTrainingSetTagText,
                (hasProgress || done) && styles.mainTrainingSetTagTextDone,
              ]}>
              {label}
            </Text>
          </Flex>
        );

        if (readOnly || !onPressGroup) {
          return <View key={`group-count-${index}`}>{content}</View>;
        }

        return (
          <TouchableOpacity
            key={`group-count-${index}`}
            activeOpacity={0.75}
            onPress={() => onPressGroup(index)}
            onLongPress={onLongPressGroup ? () => onLongPressGroup(index) : undefined}>
            {content}
          </TouchableOpacity>
        );
      })}
    </Flex>
  );
}
