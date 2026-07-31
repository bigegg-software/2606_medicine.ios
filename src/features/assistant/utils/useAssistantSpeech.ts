import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toast } from '@ant-design/react-native';
import { updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import {
  isVoiceBroadcastOn,
  parseVoiceSpeed,
} from '@/src/features/profile/settingPage/utils/settingsHelpers';
import {
  isAssistantSpeaking,
  resolveSpeechRate,
  speakPlainText,
  stopAssistantSpeech,
} from './assistantSpeechHelpers';

export function useAssistantSpeech() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(() => isVoiceBroadcastOn(userExtr?.isVoiceBroadcast));
  const [savingEnabled, setSavingEnabled] = useState(false);
  const rateRef = useRef(parseVoiceSpeed(userExtr?.voiceSpeed));
  const speakingKeyRef = useRef<string | null>(null);
  const speechEnabledRef = useRef(isVoiceBroadcastOn(userExtr?.isVoiceBroadcast));
  const userExtrRef = useRef(userExtr);
  userExtrRef.current = userExtr;

  useEffect(() => {
    speakingKeyRef.current = speakingKey;
  }, [speakingKey]);

  useEffect(() => {
    const enabled = isVoiceBroadcastOn(userExtr?.isVoiceBroadcast);
    const rate = resolveSpeechRate(userExtr?.voiceSpeed);
    speechEnabledRef.current = enabled;
    rateRef.current = rate;
    setSpeechEnabled(enabled);
  }, [userExtr?.isVoiceBroadcast, userExtr?.voiceSpeed]);

  useEffect(() => {
    return () => {
      void stopAssistantSpeech();
    };
  }, []);

  const refreshSettings = useCallback(async () => {
    const extr = userExtrRef.current;
    const rate = resolveSpeechRate(extr?.voiceSpeed);
    const enabled = isVoiceBroadcastOn(extr?.isVoiceBroadcast);
    rateRef.current = rate;
    speechEnabledRef.current = enabled;
    setSpeechEnabled(enabled);
    return { rate, enabled };
  }, []);

  const stop = useCallback(async () => {
    await stopAssistantSpeech();
    setSpeakingKey(null);
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    if (savingEnabled) return speechEnabledRef.current;
    setSavingEnabled(true);
    try {
      const isVoiceBroadcast = enabled ? 1 : 0;
      const res = await updateExtrInfo({ isVoiceBroadcast });
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '保存失败，请稍后重试', 1.5);
        return speechEnabledRef.current;
      }

      speechEnabledRef.current = enabled;
      setSpeechEnabled(enabled);
      const extr = userExtrRef.current;
      if (extr) {
        dispatch({
          type: SET_USER_EXTR,
          payload: {
            ...extr,
            isVoiceBroadcast,
          },
        });
      }
      if (!enabled) {
        await stopAssistantSpeech();
        setSpeakingKey(null);
      }
      return enabled;
    } catch {
      Toast.show('保存失败，请稍后重试', 1.5);
      return speechEnabledRef.current;
    } finally {
      setSavingEnabled(false);
    }
  }, [dispatch, savingEnabled]);

  const toggleEnabled = useCallback(async () => {
    return setEnabled(!speechEnabledRef.current);
  }, [setEnabled]);

  const speak = useCallback(async (key: string, text: string, options?: { force?: boolean }) => {
    const plainReady = text?.trim();
    if (!plainReady) return;
    if (!options?.force && !speechEnabledRef.current) return;

    await stopAssistantSpeech();
    setSpeakingKey(key);
    speakingKeyRef.current = key;

    const rate = resolveSpeechRate(userExtrRef.current?.voiceSpeed);
    rateRef.current = rate;

    await speakPlainText(plainReady, {
      rate,
      onDone: () => {
        if (speakingKeyRef.current === key) {
          setSpeakingKey(null);
        }
      },
      onStopped: () => {
        if (speakingKeyRef.current === key) {
          setSpeakingKey(null);
        }
      },
      onError: () => {
        if (speakingKeyRef.current === key) {
          setSpeakingKey(null);
        }
      },
    });
  }, []);

  const toggle = useCallback(
    async (key: string, text: string) => {
      if (speakingKeyRef.current === key) {
        const stillSpeaking = await isAssistantSpeaking();
        if (stillSpeaking || speakingKeyRef.current === key) {
          await stop();
          return;
        }
      }
      // 气泡手动播报不受总开关限制
      await speak(key, text, { force: true });
    },
    [speak, stop],
  );

  return {
    speakingKey,
    speechEnabled,
    speak,
    stop,
    toggle,
    setEnabled,
    toggleEnabled,
    refreshSettings,
  };
}
