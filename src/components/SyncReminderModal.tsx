import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTheme } from '@/common/theme';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/vitals/syncModal';

export type SyncReminderModalProps = {
  visible: boolean;
  syncing: boolean;
  onLater: () => void;
  onSync: () => void;
};

export default function SyncReminderModal({ visible, syncing, onLater, onSync }: SyncReminderModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal visible={visible} onClose={onLater} dismissOnBackdropPress={!syncing}>
      <View style={[styles.sheetBox, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.sheetTitle}>今天还未同步数据</Text>
        <Text style={styles.sheetDesc}>同步完成即可签到成功</Text>
        <Flex justify="between" style={styles.autoSyncBtnBox}>
          <TouchableOpacity onPress={onLater} activeOpacity={0.8} disabled={syncing} style={{ width: '48%' }}>
            <Flex justify="center" style={[styles.autoSyncLeftBtn, { width: '100%' }]}>
              <Text style={styles.autoSyncLeftText}>稍后</Text>
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSync} activeOpacity={0.8} disabled={syncing} style={{ width: '48%' }}>
            <Flex justify="center" style={[styles.autoSyncRightBtn, { width: '100%' }]}>
              {syncing ? (
                <ActivityIndicator color={AppTheme.onPrimaryColor} />
              ) : (
                <Text style={styles.autoSyncRightText}>同步数据</Text>
              )}
            </Flex>
          </TouchableOpacity>
        </Flex>
      </View>
    </BottomSheetModal>
  );
}
