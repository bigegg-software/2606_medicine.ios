import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/schedule/schedule';
import type { ScheduleHistoryArchiveItem } from './scheduleHelpers';

type Props = {
  item: ScheduleHistoryArchiveItem;
  onPress: () => void;
};

export default function HistoryArchiveCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.historyItem}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Flex justify="between">
        <Text style={styles.historyItemTitle}>{item.title}</Text>
        <Flex style={[
          styles.historyItemStatus,
          item.isDone && styles.historyItemStatusDone,
          item.isInProgress && styles.historyItemStatusActive,
        ]}>
          <Text style={[
            styles.historyItemStatusText,
            item.isDone && styles.historyItemStatusTextDone,
            item.isInProgress && styles.historyItemStatusTextActive,
          ]}>
            {item.statusLabel}
          </Text>
        </Flex>
      </Flex>
      <Flex style={styles.historyItemTextWrap}>
        <Image style={styles.historyItemIcon} source={require('@/assets/images/schedule/icon_rl.png')} />
        <Text style={styles.historyItemText}>{item.dateText}</Text>
      </Flex>

      <Flex style={styles.historyRow}>
        <View>
          <Flex>
            <View style={styles.historyLine} />
            <Text style={styles.historyTitle}>总课(次)</Text>
          </Flex>
          <Text style={styles.historyValue}>{item.sessionCountText}</Text>
        </View>
        <View>
          <Flex>
            <View style={[styles.historyLine, { backgroundColor: '#72A1C5' }]} />
            <Text style={styles.historyTitle}>累计时长(h)</Text>
          </Flex>
          <Text style={styles.historyValue}>{item.durationHoursText}</Text>
        </View>
        <View>
          <Flex>
            <View style={[styles.historyLine, { backgroundColor: '#FB4550' }]} />
            <Text style={styles.historyTitle}>完成率(%)</Text>
          </Flex>
          <Text style={styles.historyValue}>{item.completeRateText}</Text>
        </View>
      </Flex>
      {item.summaryText ? (
        <Flex style={styles.historyInfo}>
          <Image style={styles.statusIcon} source={require('@/assets/images/schedule/wc.png')} />
          <Text style={styles.historyInfoText}>{item.summaryText}</Text>
        </Flex>
      ) : null}
    </TouchableOpacity>
  );
}
