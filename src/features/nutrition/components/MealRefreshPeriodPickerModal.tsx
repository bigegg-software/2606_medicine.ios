import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/syncModal';
import {
  type MealRefreshPeriodKey,
} from './utils/mealRefreshPeriodHelpers';

export type { MealRefreshPeriodKey };

const MEAL_REFRESH_PERIOD_OPTIONS: { label: string; value: MealRefreshPeriodKey }[] = [
  { label: '今天', value: 'today' },
  { label: '本周（从今天开始）', value: 'thisWeek' },
  { label: '本周及下周（从今天开始）', value: 'thisWeekAndNext' },
];

export type MealRefreshPeriodPickerModalProps = {
  visible: boolean;
  initialValue?: MealRefreshPeriodKey;
  onCancel: () => void;
  onConfirm: (period: MealRefreshPeriodKey) => void;
  onDismissed?: () => void;
};

export default function MealRefreshPeriodPickerModal({
  visible,
  initialValue = 'today',
  onCancel,
  onConfirm,
  onDismissed,
}: MealRefreshPeriodPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState<MealRefreshPeriodKey>('today');

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onCancel}
      onDismissed={onDismissed}
      dismissOnBackdropPress>
      <View style={[styles.sheetBox, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.sheetTitle}>选择更新周期</Text>
        <Text style={styles.sheetDesc}>将按所选周期重新生成推荐食谱</Text>

        <View>
          {MEAL_REFRESH_PERIOD_OPTIONS.map(item => {
            const active = value === item.value;
            return (
              <Flex
                key={item.value}
                onPress={() => setValue(item.value)}
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
          style={styles.sheetConfirmBtn}
          onPress={() => onConfirm(value)}
          activeOpacity={0.8}>
          <Text style={styles.sheetConfirmBtnText}>确定</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
