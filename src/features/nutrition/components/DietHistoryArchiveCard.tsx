import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/schedule/schedule';
import type { DietHistoryArchiveItem } from './utils/dietHistoryArchiveHelpers';

type Props = {
  item: DietHistoryArchiveItem;
  onPress: () => void;
};

export default function DietHistoryArchiveCard({ item, onPress }: Props) {
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
            <Text style={styles.historyTitle}>执行率(%)</Text>
          </Flex>
          <Text style={styles.historyValue}>{item.executionRateText}</Text>
        </View>
        <View>
          <Flex>
            <View style={[styles.historyLine, { backgroundColor: '#72A1C5' }]} />
            <Text style={styles.historyTitle}>热量达标(%)</Text>
          </Flex>
          <Text style={styles.historyValue}>{item.calorieRateText}</Text>
        </View>
        <View style={{ flexShrink: 1 }}>
          <Flex>
            <View style={[styles.historyLine, { backgroundColor: '#FB4550' }]} />
            <Text style={styles.historyTitle} numberOfLines={1}>蛋白达标(%)</Text>
          </Flex>
          <Text style={styles.historyValue}>{item.proteinRateText}</Text>
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
