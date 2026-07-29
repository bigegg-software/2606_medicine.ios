import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/syncModal';

const SYNC_DAYS_OPTIONS = [
  { label: '最近7天', value: 7 },
  { label: '最近1个月', value: 30 },
  { label: '最近2个月', value: 60 },
  { label: '最近3个月', value: 90 },
] as const;

export type SyncDaysPickerModalProps = {
  visible: boolean;
  initialValue?: number;
  saving: boolean;
  description?: string;
  onCancel: () => void;
  onConfirm: (days: number) => void;
  onDismissed?: () => void;
};

export default function SyncDaysPickerModal({
  visible,
  initialValue,
  saving,
  description = '可在「设置 → 数据管理」中修改',
  onCancel,
  onConfirm,
  onDismissed,
}: SyncDaysPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(7);

  useEffect(() => {
    if (visible) {
      setValue(initialValue && initialValue > 0 ? initialValue : 7);
    }
  }, [initialValue, visible]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onCancel}
      onDismissed={onDismissed}
      dismissOnBackdropPress={!saving}>
      <View style={[styles.sheetBox, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.sheetTitle}>选择同步周期</Text>
        <Text style={styles.sheetDesc}>{description}</Text>

        <View>
          {SYNC_DAYS_OPTIONS.map(item => {
            const active = value === item.value;
            return (
              <Flex
                key={item.value}
                onPress={() => !saving && setValue(item.value)}
                justify="between"
                align="center"
                style={active ? styles.selectBox : styles.rowBox}>
                <Text style={styles.selectText}>{item.label}</Text>
                <Image
                  style={styles.rowImgSize}
                  tintColor={active ? AppTheme.primaryColor : undefined}
                  source={
                    active
                      ? require('@/assets/images/vitals/icon_completed.png')
                      : require('@/assets/images/vitals/icon_box.png')
                  }
                />
              </Flex>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.sheetConfirmBtn, saving && { opacity: 0.6 }]}
          onPress={() => !saving && onConfirm(value)}
          activeOpacity={0.8}
          disabled={saving}>
          <Text style={styles.sheetConfirmBtnText}>{saving ? '保存中...' : '确定'}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
