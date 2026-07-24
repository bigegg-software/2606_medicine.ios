import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
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
  /** 兼容旧调用；等同 patternUnitSize */
  majorStep?: number;
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
  majorStep,
  onCancel,
  onConfirm,
}: GoalTargetModalProps) {
  const [draftValue, setDraftValue] = useState(initialValue);
  const resolvedPatternUnitSize = patternUnitSize ?? majorStep;

  useEffect(() => {
    if (visible) {
      setDraftValue(initialValue);
    }
  }, [initialValue, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LinearGradient
            colors={['#D4E0CF', '#FAF9FA']}
            locations={[0, 0.12]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.leftText}>{label}</Text>

            <View style={styles.sliderSection}>
              {visible ? (
                <SleepRulerSlider
                  key={`goal-target-${title}-${initialValue}`}
                  min={min}
                  max={max}
                  step={step}
                  initialValue={initialValue}
                  unit={unit}
                  formatLabel={formatLabel}
                  formatDisplay={formatDisplay}
                  patternUnitSize={resolvedPatternUnitSize}
                  showValue
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
