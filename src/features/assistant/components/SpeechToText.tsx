import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import Voice from 'react-native-voice';
import * as RNLocalize from 'react-native-localize';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { AppTheme } from '@/common/theme';

export interface SpeechToTextRef {
  stopListening: () => Promise<void>;
}

interface SpeechToTextProps {
  onTextChange?: (text: string) => void;
  onStart?: () => void;
  onMicPress?: () => void;
  onListeningChange?: (listening: boolean) => void;
  disabled?: boolean;
  idleIcon?: ImageSourcePropType;
  activeIcon?: ImageSourcePropType;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

const SPEECH_ICON = require('@/assets/images/assistant/speech.png');
const SPEECH_ACTIVE_ICON = require('@/assets/images/assistant/speech1.png');
const RIPPLE_COLOR = AppTheme.primaryColor;
const RIPPLE_DURATION = 1600;
const RIPPLE_DELAYS = [0, 520, 1040];
const RIPPLE_MIN_SCALE = 0.9;
const RIPPLE_MAX_SCALE = 2.35;
const RIPPLE_SCALE_RANGE = RIPPLE_MAX_SCALE - RIPPLE_MIN_SCALE;

const BENIGN_SPEECH_ERROR_CODES = new Set(['1110', '7', '216']);
const BENIGN_SPEECH_ERROR_KEYWORDS = ['no speech detected', 'no match', 'speech timeout'];

function isBenignSpeechError(error: unknown): boolean {
  const payload = error as { error?: { message?: string; code?: string | number }; message?: string; code?: string | number };
  const nested = payload?.error;
  const code = String(nested?.code ?? payload?.code ?? '');
  const message = String(nested?.message ?? payload?.message ?? error ?? '').toLowerCase();

  if (BENIGN_SPEECH_ERROR_CODES.has(code)) return true;
  return BENIGN_SPEECH_ERROR_KEYWORDS.some(keyword => message.includes(keyword));
}

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.replace('#', '').trim();
  const full = cleaned.length === 3
    ? cleaned.split('').map(char => `${char}${char}`).join('')
    : cleaned;
  if (full.length !== 6) return `rgba(109,146,94,${alpha})`;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function RippleRings({
  active,
  color,
  size,
}: {
  active: boolean;
  color: string;
  size: number;
}) {
  const elapsed = useSharedValue(0);
  const running = useSharedValue(false);

  const frameCallback = useFrameCallback(frame => {
    'worklet';
    if (!running.value) return;
    elapsed.value += frame.timeSincePreviousFrame ?? 16;
  }, false);

  useEffect(() => {
    if (!active) {
      running.value = false;
      elapsed.value = 0;
      frameCallback.setActive(false);
      return;
    }

    elapsed.value = 0;
    running.value = true;
    frameCallback.setActive(true);

    return () => {
      running.value = false;
      frameCallback.setActive(false);
    };
  }, [active, elapsed, frameCallback, running]);

  return (
    <>
      {RIPPLE_DELAYS.map(delay => (
        <RippleRing
          key={delay}
          elapsed={elapsed}
          delay={delay}
          color={color}
          size={size}
        />
      ))}
    </>
  );
}

function RippleRing({
  elapsed,
  delay,
  color,
  size,
}: {
  elapsed: SharedValue<number>;
  delay: number;
  color: string;
  size: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const phase = ((elapsed.value + delay) % RIPPLE_DURATION) / RIPPLE_DURATION;
    const fade = 1 - phase;
    return {
      opacity: fade * fade * 0.42,
      transform: [{ scale: RIPPLE_MIN_SCALE + phase * RIPPLE_SCALE_RANGE }],
    };
  });

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.ripple,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.1),
        },
        animatedStyle,
      ]}
    />
  );
}

async function resetVoiceSession() {
  try {
    await Voice.cancel();
  } catch {
    try {
      await Voice.stop();
    } catch {
      // ignore
    }
  }
}

const SpeechToText = forwardRef<SpeechToTextRef, SpeechToTextProps>(
  (
    {
      onTextChange,
      onStart,
      onMicPress,
      onListeningChange,
      disabled,
      idleIcon = SPEECH_ICON,
      activeIcon = SPEECH_ACTIVE_ICON,
      iconSize = 28,
      style,
    },
    ref,
  ) => {
    const [isListening, setIsListening] = useState(false);
    const [language, setLanguage] = useState('zh-CN');
    const onTextChangeRef = useRef(onTextChange);
    const onStartRef = useRef(onStart);
    const isListeningRef = useRef(false);
    const acceptResultsRef = useRef(false);

    useEffect(() => {
      onTextChangeRef.current = onTextChange;
    }, [onTextChange]);

    useEffect(() => {
      onStartRef.current = onStart;
    }, [onStart]);

    useEffect(() => {
      isListeningRef.current = isListening;
      onListeningChange?.(isListening);
    }, [isListening, onListeningChange]);

    useEffect(() => {
      Voice.onSpeechStart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };
      Voice.onSpeechEnd = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };
      Voice.onSpeechResults = (event: { value?: string[] }) => {
        if (!acceptResultsRef.current) return;
        const text = event.value?.[0];
        if (text) onTextChangeRef.current?.(text);
      };
      Voice.onSpeechPartialResults = (event: { value?: string[] }) => {
        if (!acceptResultsRef.current) return;
        const text = event.value?.[0];
        if (text) onTextChangeRef.current?.(text);
      };
      Voice.onSpeechError = (event: { error?: { message?: string; code?: string } }) => {
        acceptResultsRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
        if (!isBenignSpeechError(event)) {
          console.error('语音识别错误:', event?.error?.message ?? event);
        }
      };

      const locales = RNLocalize.getLocales();
      const langMap: Record<string, string> = {
        zh: 'zh-CN',
        en: 'en-US',
        ko: 'ko-KR',
        ja: 'ja-JP',
        th: 'th-TH',
      };
      const code = locales[0]?.languageCode || 'zh';
      setLanguage(langMap[code] || 'zh-CN');

      return () => {
        void resetVoiceSession();
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, []);

    const showPermissionAlert = () => {
      Alert.alert('提示', '请授予麦克风和语音识别权限以使用语音输入', [
        { text: '知道了', style: 'cancel' },
        { text: '去设置', onPress: () => Linking.openSettings() },
      ]);
    };

    const ensureSpeechPermission = async (): Promise<boolean> => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          if (granted) return true;
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: '语音识别权限',
              message: '应用需要麦克风权限以进行语音识别',
              buttonNeutral: '稍后询问',
              buttonNegative: '取消',
              buttonPositive: '确定',
            },
          );
          if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            showPermissionAlert();
            return false;
          }
          return true;
        } catch (err) {
          console.warn(err);
          showPermissionAlert();
          return false;
        }
      }

      try {
        const current = await getRecordingPermissionsAsync();
        if (current.status !== 'granted' && !current.granted) {
          const requested = await requestRecordingPermissionsAsync();
          if (requested.status !== 'granted' && !requested.granted) {
            showPermissionAlert();
            return false;
          }
        }
        return true;
      } catch (e) {
        showPermissionAlert();
        return false;
      }
    };

    const stopListening = async () => {
      acceptResultsRef.current = false;
      try {
        await Voice.stop();
      } catch (error) {
        if (!isBenignSpeechError(error)) {
          console.error('停止语音识别失败:', error);
        }
      } finally {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    const startListening = async () => {
      if (isListeningRef.current || disabled) return;
      const hasPermission = await ensureSpeechPermission();
      if (!hasPermission) return;

      onStartRef.current?.();

      try {
        await resetVoiceSession();
        acceptResultsRef.current = true;
        await Voice.start(language);
        isListeningRef.current = true;
        setIsListening(true);
      } catch (error) {
        if (!isBenignSpeechError(error)) {
          console.error('开始语音识别失败:', error);
        }
        acceptResultsRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    useImperativeHandle(ref, () => ({ stopListening }), []);

    const handleMicPress = () => {
      if (disabled) return;
      onMicPress?.();
      if (isListeningRef.current) {
        void stopListening();
      } else {
        void startListening();
      }
    };

    return (
      <View style={[styles.controls, { width: Math.max(40, iconSize + 12), height: Math.max(40, iconSize + 12) }, style]}>
        {isListening && (
          <RippleRings
            active={isListening}
            color={RIPPLE_COLOR}
            size={iconSize}
          />
        )}
        <TouchableOpacity
          onPress={handleMicPress}
          disabled={disabled}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.micButton, { width: iconSize, height: iconSize }]}>
          <Image
            source={isListening ? activeIcon : idleIcon}
            style={[
              styles.micIcon,
              { width: iconSize, height: iconSize },
              disabled && styles.micIconDisabled,
            ]}
          />
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  controls: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  micButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  micIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  micIconDisabled: {
    opacity: 0.45,
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.2,
  },
});

SpeechToText.displayName = 'SpeechToText';

export default SpeechToText;
