import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Keyboard } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import SpeechToText, { type SpeechToTextRef } from '@/src/features/assistant/components/SpeechToText';
import styles from '@/css/nutrition/dietManualAddModal';

const MAX_LENGTH = 100;
const PLACEHOLDER = '请输入如：一杯牛奶，一个苹果，一份卤肉饭...';
const EMPTY_TIP = '请输入或录入食物描述';

export type DietManualAddModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
};

export default function DietManualAddModal({
  visible,
  onClose,
  onSave,
}: DietManualAddModalProps) {
  const insets = useSafeAreaInsets();
  const [mealNote, setMealNote] = useState('');
  const [tipVisible, setTipVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const speechToTextRef = useRef<SpeechToTextRef>(null);
  const voiceBaseTextRef = useRef('');

  const clearTipTimer = useCallback(() => {
    if (tipTimerRef.current) {
      clearTimeout(tipTimerRef.current);
      tipTimerRef.current = null;
    }
  }, []);

  const showTip = useCallback(() => {
    clearTipTimer();
    setTipVisible(true);
    tipTimerRef.current = setTimeout(() => {
      setTipVisible(false);
      tipTimerRef.current = null;
    }, 1800);
  }, [clearTipTimer]);

  useEffect(() => {
    if (!visible) {
      void speechToTextRef.current?.stopListening();
      setMealNote('');
      voiceBaseTextRef.current = '';
      setTipVisible(false);
      setInputFocused(false);
      clearTipTimer();
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
      return;
    }
    // 等弹层滑入后再聚焦，避免键盘与动画抢节奏
    focusTimerRef.current = setTimeout(() => {
      inputRef.current?.focus();
      focusTimerRef.current = null;
    }, 320);
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [clearTipTimer, visible]);

  useEffect(() => () => clearTipTimer(), [clearTipTimer]);

  const handleClose = useCallback(() => {
    void speechToTextRef.current?.stopListening();
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handleChangeText = useCallback((text: string) => {
    setMealNote(text.slice(0, MAX_LENGTH));
    if (text.trim()) setTipVisible(false);
  }, []);

  const handleVoiceStart = useCallback(() => {
    voiceBaseTextRef.current = mealNote;
  }, [mealNote]);

  const handleVoiceTextChange = useCallback((text: string) => {
    const next = `${voiceBaseTextRef.current}${text}`.slice(0, MAX_LENGTH);
    setMealNote(next);
    if (next.trim()) setTipVisible(false);
  }, []);

  const handleMicPress = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleSave = useCallback(() => {
    const text = mealNote.trim();
    if (!text) {
      showTip();
      inputRef.current?.focus();
      return;
    }
    void speechToTextRef.current?.stopListening();
    Keyboard.dismiss();
    onSave(text);
  }, [mealNote, onSave, showTip]);

  const hasText = mealNote.trim().length > 0;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      dismissOnBackdropPress
      overlayOpacity={0.45}
      sheetStyle={styles.sheetOuter}
    >
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />

        <Flex justify="between" align="center" style={styles.header}>
          <Text style={styles.title}>记录食物</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleClose}
          >
            <Image
              style={styles.closeIcon}
              source={require('@/assets/images/schedule/close.png')}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Flex>

        <Text style={styles.tip}>可以一次记录多种食物，更高效哦~</Text>

        <View
          style={[
            styles.inputBox,
            tipVisible && styles.inputBoxError,
          ]}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={mealNote}
            onChangeText={handleChangeText}
            placeholder={PLACEHOLDER}
            placeholderTextColor="#B0B0B0"
            multiline
            maxLength={MAX_LENGTH}
            textAlignVertical="top"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <Flex justify="between" align="center" style={styles.inputFooter}>
            <Text style={[styles.countText, mealNote.length >= MAX_LENGTH && styles.countTextFull]}>
              {mealNote.length}/{MAX_LENGTH}
            </Text>
            <SpeechToText
              ref={speechToTextRef}
              onMicPress={handleMicPress}
              onStart={handleVoiceStart}
              onTextChange={handleVoiceTextChange}
              idleIcon={require('@/assets/images/nutrition/icon_audio.png')}
              activeIcon={require('@/assets/images/nutrition/icon_audio1.png')}
              iconSize={20}
              style={styles.micWrap}
            />
          </Flex>
        </View>

        {tipVisible ? <Text style={styles.errorTip}>{EMPTY_TIP}</Text> : <View style={styles.errorTipPlaceholder} />}

        <TouchableOpacity
          style={[styles.saveBtn, !hasText && styles.saveBtnIdle]}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <LinearGradient
            colors={hasText ? ['#9BBD8E', '#6D925E'] : ['#C5D6BE', '#A3B89A']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>识别</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
