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
  isAssistantSpeechPaused,
  pauseOrStopAssistantSpeech,
  resolveSpeechRate,
  resumeAssistantSpeech,
  speakPlainText,
  stopAssistantSpeech,
  stripMarkdownForSpeech,
  type SpeakProgress,
} from './assistantSpeechHelpers';

type ResumeState = {
  key: string;
  plain: string;
  chunkIndex: number;
};

type PausedState = {
  key: string;
  plain: string;
};

export function useAssistantSpeech() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(() => isVoiceBroadcastOn(userExtr?.isVoiceBroadcast));
  const [savingEnabled, setSavingEnabled] = useState(false);
  const rateRef = useRef(parseVoiceSpeed(userExtr?.voiceSpeed));
  const speakingKeyRef = useRef<string | null>(null);
  const speechEnabledRef = useRef(isVoiceBroadcastOn(userExtr?.isVoiceBroadcast));
  const resumeRef = useRef<ResumeState | null>(null);
  const pausedRef = useRef<PausedState | null>(null);
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

  const clearResume = useCallback(() => {
    resumeRef.current = null;
  }, []);

  const clearPaused = useCallback(() => {
    pausedRef.current = null;
  }, []);

  const saveResume = useCallback((key: string, progress: SpeakProgress | null) => {
    if (!progress?.plain) {
      resumeRef.current = null;
      return;
    }
    // chunkIndex=0 表示停在首句，续播仍从头句开始（与重新播放一致）
    if (progress.chunkIndex <= 0) {
      resumeRef.current = null;
      return;
    }
    resumeRef.current = {
      key,
      plain: progress.plain,
      chunkIndex: progress.chunkIndex,
    };
  }, []);

  const stop = useCallback(async () => {
    const key = speakingKeyRef.current;
    const result = await pauseOrStopAssistantSpeech();

    if (key) {
      if (result.mode === 'paused' && result.progress) {
        pausedRef.current = {
          key,
          plain: result.progress.plain,
        };
        clearResume();
      } else {
        clearPaused();
        saveResume(key, result.progress);
      }
    }

    setSpeakingKey(null);
    speakingKeyRef.current = null;
  }, [clearPaused, clearResume, saveResume]);

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
        clearResume();
        clearPaused();
        await stopAssistantSpeech();
        setSpeakingKey(null);
        speakingKeyRef.current = null;
      }
      return enabled;
    } catch {
      Toast.show('保存失败，请稍后重试', 1.5);
      return speechEnabledRef.current;
    } finally {
      setSavingEnabled(false);
    }
  }, [clearPaused, clearResume, dispatch, savingEnabled]);

  const toggleEnabled = useCallback(async () => {
    return setEnabled(!speechEnabledRef.current);
  }, [setEnabled]);

  const speak = useCallback(async (key: string, text: string, options?: { force?: boolean }) => {
    const plainReady = text?.trim();
    if (!plainReady) return;
    if (!options?.force && !speechEnabledRef.current) return;

    const plain = stripMarkdownForSpeech(plainReady);
    const resume = resumeRef.current;
    const canResume =
      resume != null
      && resume.key === key
      && resume.plain === plain
      && resume.chunkIndex > 0;
    const startChunkIndex = canResume ? resume.chunkIndex : 0;
    clearResume();
    clearPaused();

    await stopAssistantSpeech();
    setSpeakingKey(key);
    speakingKeyRef.current = key;

    const rate = resolveSpeechRate(userExtrRef.current?.voiceSpeed);
    rateRef.current = rate;

    await speakPlainText(plainReady, {
      rate,
      startChunkIndex,
      onDone: () => {
        clearResume();
        clearPaused();
        if (speakingKeyRef.current === key) {
          setSpeakingKey(null);
          speakingKeyRef.current = null;
        }
      },
      onStopped: progress => {
        saveResume(key, progress);
        if (speakingKeyRef.current === key) {
          setSpeakingKey(null);
          speakingKeyRef.current = null;
        }
      },
      onError: () => {
        clearResume();
        clearPaused();
        if (speakingKeyRef.current === key) {
          setSpeakingKey(null);
          speakingKeyRef.current = null;
        }
      },
    });
  }, [clearPaused, clearResume, saveResume]);

  const toggle = useCallback(
    async (key: string, text: string) => {
      const plain = stripMarkdownForSpeech(text);

      // 正在播报同一条 → 暂停/停止并记进度
      if (speakingKeyRef.current === key) {
        await stop();
        return;
      }

      // iOS/Web：同一条处于暂停 → 原生 resume（精确续播）
      if (
        pausedRef.current?.key === key
        && pausedRef.current.plain === plain
        && isAssistantSpeechPaused()
      ) {
        const ok = await resumeAssistantSpeech();
        if (ok) {
          setSpeakingKey(key);
          speakingKeyRef.current = key;
          clearPaused();
          return;
        }
        clearPaused();
      }

      // Android 或 pause 失败：按句子分片续播
      await speak(key, text, { force: true });
    },
    [clearPaused, speak, stop],
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
