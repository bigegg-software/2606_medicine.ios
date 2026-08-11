import React, { useEffect, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import styles from '@/css/exercise';
import { formatChineseGroupLabel } from '../../utils/trainingPhaseHelpers';

type Props = {
  visible: boolean;
  groupIndex: number;
  title: string;
  unit: string;
  /** 当前已记录值，用于回填 */
  initialValue?: number;
  onClose: () => void;
  onSave: (value: number) => void;
};

/** 组别完成次数 / 保持时长录入弹窗（底部弹出） */
export default function GroupCountInputModal({
  visible,
  groupIndex,
  title,
  unit,
  initialValue = 0,
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!visible) return;
    setText(initialValue > 0 ? String(initialValue) : '');
  }, [groupIndex, initialValue, visible]);

  const handleSave = () => {
    const n = Math.round(Number(text));
    onSave(Number.isFinite(n) && n > 0 ? n : 0);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      overlayOpacity={0.45}
      sheetStyle={styles.groupCountModalSheet}>
      <View style={styles.groupCountModalCard}>
        <View style={styles.groupCountModalHeader}>
          <Text style={styles.groupCountModalTitle}>{title}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.groupCountModalCloseBtn}
            onPress={onClose}>
            <Image
              style={styles.groupCountModalClose}
              source={require('@/assets/images/schedule/close.png')}
            />
          </TouchableOpacity>
        </View>

        <Flex align="center" style={styles.groupCountModalInputRow}>
          <Text style={styles.groupCountModalGroupLabel}>
            {formatChineseGroupLabel(groupIndex + 1)}
          </Text>
          <TextInput
            key={`group-input-${groupIndex}`}
            style={styles.groupCountModalInput}
            value={text}
            onChangeText={value => setText(value.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            placeholder="请输入"
            placeholderTextColor="#999999"
            maxLength={5}
            autoFocus={visible}
          />
          <Text style={styles.groupCountModalUnit}>{unit}</Text>
        </Flex>

        <View
          style={[
            styles.groupCountModalSaveBtnBox,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.groupCountModalSaveBtn}
            onPress={handleSave}>
            <Flex justify="center" align="center">
              <Image
                style={styles.groupCountModalSaveIcon}
                source={require('@/assets/images/schedule/save.png')}
              />
              <Text style={styles.groupCountModalSaveText}>保存记录</Text>
            </Flex>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}
