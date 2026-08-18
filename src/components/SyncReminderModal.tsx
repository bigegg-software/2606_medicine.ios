import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/syncModal';

export type SyncReminderModalProps = {
  visible: boolean;
  syncing: boolean;
  onLater: () => void;
  onSync: () => void;
};

export default function SyncReminderModal({ visible, syncing, onLater, onSync }: SyncReminderModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!syncing) onLater();
      }}
    >
      <View style={styles.autoSyncDialogOverlay}>
        <View style={styles.autoSyncDialogBox}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onLater}
            activeOpacity={0.8}
            disabled={syncing}
          >
            <MaterialIcons name="close" size={22} color={AppTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.autoSyncDialogTitle}>今天还未同步数据</Text>
          <Text style={styles.autoSyncDialogDesc}>同步完成即可签到成功</Text>
          <Flex justify="between" style={styles.autoSyncDialogBtnBox}>
            <TouchableOpacity
              onPress={onLater}
              activeOpacity={0.8}
              disabled={syncing}
              style={{ width: '48%' }}
            >
              <Flex justify="center" style={[styles.autoSyncLeftBtn, { width: '100%' }]}>
                <Text style={styles.autoSyncLeftText}>稍后</Text>
              </Flex>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSync}
              activeOpacity={0.8}
              disabled={syncing}
              style={{ width: '48%', opacity: syncing ? 0.6 : 1 }}
            >
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
      </View>
    </Modal>
  );
}
