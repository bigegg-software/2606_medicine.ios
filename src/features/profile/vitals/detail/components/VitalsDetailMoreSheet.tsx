import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/vitals/syncModal';

export type VitalsDetailMoreAction = {
  key: string;
  label: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  actions: VitalsDetailMoreAction[];
  onClose: () => void;
  onDismissed?: () => void;
};

export default function VitalsDetailMoreSheet({ visible, actions, onClose, onDismissed }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal visible={visible} onClose={onClose} onDismissed={onDismissed}>
      <View style={[styles.sheetBox, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {actions.map(action => (
          <TouchableOpacity
            key={action.key}
            style={styles.detailActionItem}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.detailActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.detailActionCancel}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.detailActionCancelText}>关闭</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
