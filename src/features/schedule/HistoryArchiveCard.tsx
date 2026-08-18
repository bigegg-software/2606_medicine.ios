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
  const maxProgress = item.maxProgress;

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
            <Text style={styles.historyTitle}>累计课次</Text>
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
        {maxProgress ? (
          <View style={{ flexShrink: 1 }}>
            <Flex>
              <View style={[styles.historyLine, { backgroundColor: '#FB4550' }]} />
              <Text style={styles.historyTitle} numberOfLines={1}>
                {maxProgress.label}
              </Text>
            </Flex>
            <Flex align="center">
              <Text style={styles.historyValue}>{maxProgress.currentText}</Text>
              {maxProgress.baselineText ? (
                <Text style={styles.historyUnit}>{maxProgress.baselineText}</Text>
              ) : null}
              {maxProgress.trend ? (
                <Image
                  style={styles.historyTrendIcon}
                  source={
                    maxProgress.trend === 'up'
                      ? require('@/assets/images/schedule/icon_gs.png')
                      : require('@/assets/images/schedule/icon_xx.png')
                  }
                />
              ) : null}
            </Flex>
          </View>
        ) : null}
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
