import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/syncModal';

export type RevokeAiPromptModalProps = {
  visible: boolean;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function RevokeAiPromptModal({
  visible,
  saving = false,
  onCancel,
  onConfirm,
}: RevokeAiPromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.autoSyncDialogOverlay}>
        <View style={styles.autoSyncDialogBox}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onCancel}
            activeOpacity={0.8}
            disabled={saving}>
            <MaterialIcons name="close" size={22} color={AppTheme.textSecondary} />
          </TouchableOpacity>
          <Image style={styles.autoSyncDialogLogo} source={require('@/assets/images/login/logo.png')} />
          <Text style={styles.autoSyncDialogTitle}>关闭 AI 数据处理授权？</Text>
          <Text style={[styles.autoSyncDialogDesc, { textAlign: 'left' }]}>关闭后：</Text>
          <Text style={[styles.autoSyncDialogDesc, { textAlign: 'left', marginTop: 4 }]}>
            • AI 生成的分析功能将不可用
          </Text>
          <Text style={[styles.autoSyncDialogDesc, { textAlign: 'left', marginTop: 4 }]}>
            • 不会再向 AI 服务提供商发送新的数据
          </Text>
          <Text style={[styles.autoSyncDialogDesc, { textAlign: 'left', marginTop: 8 }]}>
            您可以随时在设置中重新开启。
          </Text>
          <Flex justify="between" style={styles.autoSyncDialogBtnBox}>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              disabled={saving}
              style={{ width: '48%' }}>
              <Flex justify="center" style={[styles.autoSyncLeftBtn, { width: '100%' }]}>
                <Text style={styles.autoSyncLeftText}>取消</Text>
              </Flex>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={saving}
              style={{ width: '48%', opacity: saving ? 0.6 : 1 }}>
              <Flex justify="center" style={[styles.autoSyncRightBtn, { width: '100%' }]}>
                <Text style={styles.autoSyncRightText}>
                  {saving ? '保存中...' : '撤销授权'}
                </Text>
              </Flex>
            </TouchableOpacity>
          </Flex>
        </View>
      </View>
    </Modal>
  );
}
