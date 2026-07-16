import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';
import { getVitalInfoContent } from '../utils/vitalInfoContent';

export type VitalInfoModalProps = {
  vitalKey: string | null;
  onClose: () => void;
};

export default function VitalInfoModal({ vitalKey, onClose }: VitalInfoModalProps) {
  const content = vitalKey ? getVitalInfoContent(vitalKey) : null;
  const visible = Boolean(content);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <MaterialIcons name="close" size={22} color={AppTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>{content?.title ?? ''}</Text>
          <Text style={styles.body}>{content?.body ?? ''}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.confirmText}>知道了</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  box: {
    width: '100%',
    backgroundColor: '#FEFFFF',
    borderRadius: 12,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  title: {
    fontWeight: '500',
    fontSize: 17,
    color: AppTheme.textPrimary,
    lineHeight: 24,
    paddingRight: 28,
  },
  body: {
    marginTop: 12,
    fontWeight: '400',
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 22,
  },
  confirmBtn: {
    marginTop: 20,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppTheme.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontWeight: '500',
    fontSize: 16,
    color: AppTheme.onPrimaryColor ?? '#FFFFFF',
  },
});
