import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/syncModal';

export type AutoSyncPromptModalProps = {
  visible: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AutoSyncPromptModal({ visible, onClose, onCancel, onConfirm }: AutoSyncPromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.autoSyncDialogOverlay}>
        <View style={styles.autoSyncDialogBox}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <MaterialIcons name="close" size={22} color={AppTheme.textSecondary} />
          </TouchableOpacity>
          <Image style={styles.autoSyncDialogLogo} source={require('@/assets/images/login/logo.png')} />
          <Text style={styles.autoSyncDialogTitle}>是否自动同步数据？</Text>
          <Text style={styles.autoSyncDialogDesc}>
            每天首次打开应用时，自动同步可穿戴设备数据。您可以在「设置 → 数据管理」中关闭此功能。
          </Text>
          <Flex justify="between" style={styles.autoSyncDialogBtnBox}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.8} style={{ width: '48%' }}>
              <Flex justify="center" style={[styles.autoSyncLeftBtn, { width: '100%' }]}>
                <Text style={styles.autoSyncLeftText}>取消</Text>
              </Flex>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.8} style={{ width: '48%' }}>
              <Flex justify="center" style={[styles.autoSyncRightBtn, { width: '100%' }]}>
                <Text style={styles.autoSyncRightText}>确定</Text>
              </Flex>
            </TouchableOpacity>
          </Flex>
        </View>
      </View>
    </Modal>
  );
}
