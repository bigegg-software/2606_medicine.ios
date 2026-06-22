import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '@/css/vitals/index';
import SleepRulerSlider from './SleepRulerSlider';

export type GoalTargetModalProps = {
  visible: boolean;
  title: string;
  label: string;
  unit: string;
  initialValue: number;
  saving: boolean;
  min: number;
  max: number;
  step: number;
  formatLabel?: (value: number) => string;
  formatDisplay?: (value: number) => string;
  patternUnitSize?: number;
  onCancel: () => void;
  onConfirm: (value: number) => void;
};

export default function GoalTargetModal({
  visible,
  title,
  label,
  unit,
  initialValue,
  saving,
  min,
  max,
  step,
  formatLabel,
  formatDisplay,
  patternUnitSize,
  onCancel,
  onConfirm,
}: GoalTargetModalProps) {
  const [draftValue, setDraftValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setDraftValue(initialValue);
    }
  }, [initialValue, visible]);

  const displayValue = formatDisplay ? formatDisplay(draftValue) : String(draftValue);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LinearGradient
            colors={['#C1C8E3', '#FAF9FA']}
            locations={[0, 0.1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.leftText}>{label}</Text>

            <Flex style={styles.sliderValueBox}>
              <Text style={styles.sliderValueDisplay}>
                {displayValue} {unit}
              </Text>
            </Flex>

            <View style={styles.sliderSection}>
              {visible ? (
                <SleepRulerSlider
                  key={`goal-target-${title}-${initialValue}`}
                  min={min}
                  max={max}
                  step={step}
                  initialValue={initialValue}
                  formatLabel={formatLabel}
                  patternUnitSize={patternUnitSize}
                  onValueChange={setDraftValue}
                />
              ) : null}
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={saving}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, saving && { opacity: 0.6 }]}
                onPress={() => onConfirm(draftValue)}
                activeOpacity={0.7}
                disabled={saving}>
                <Text style={styles.modalConfirmText}>{saving ? '保存中...' : '确定'}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}
