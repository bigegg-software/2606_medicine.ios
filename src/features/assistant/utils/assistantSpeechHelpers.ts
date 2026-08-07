import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import {
  parseVoiceSpeed,
  snapSpeechSpeedRate,
  SPEECH_SPEED_OPTIONS,
} from '@/src/features/profile/settingPage/utils/settingsHelpers';

const DEFAULT_SPEECH_RATE = SPEECH_SPEED_OPTIONS[1].rate;

/** 去除 markdown / emoji，供语音播报 */
export function stripMarkdownForSpeech(text?: string | null) {
  if (!text?.trim()) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~|>]+/g, ' ')
    // emoji 及相关修饰符不播报
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0E\uFE0F\u200D\u20E3]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveSpeechRate(voiceSpeed?: number | null): number {
  return parseVoiceSpeed(voiceSpeed);
}

/** 按句拆分，便于停止后从下一句续播 */
function chunkSpeechText(text: string, maxLen: number): string[] {
  const limit = Math.max(40, Math.floor(maxLen * 0.9));
  const rawParts = text
    .split(/(?<=[。！？；\n])/)
    .map(part => part.trim())
    .filter(Boolean);
  const source = rawParts.length > 0 ? rawParts : [text];
  const chunks: string[] = [];

  for (const part of source) {
    if (part.length <= limit) {
      chunks.push(part);
      continue;
    }
    let remaining = part;
    while (remaining.length > limit) {
      let cut = remaining.lastIndexOf('，', limit);
      if (cut < limit * 0.4) cut = remaining.lastIndexOf('、', limit);
      if (cut < limit * 0.4) cut = remaining.lastIndexOf(' ', limit);
      if (cut < limit * 0.4) cut = limit;
      const piece = remaining.slice(0, cut + (cut < limit ? 1 : 0)).trim();
      if (piece) chunks.push(piece);
      remaining = remaining.slice(cut + (cut < limit ? 1 : 0)).trim();
    }
    if (remaining) chunks.push(remaining);
  }

  return chunks.length > 0 ? chunks : [text];
}

export type SpeakProgress = {
  /** 下一句起播的 chunk 下标 */
  chunkIndex: number;
  plain: string;
};

export type SpeakPlainTextOptions = {
  rate?: number;
  /** 从第几个分片继续播报 */
  startChunkIndex?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: (progress: SpeakProgress) => void;
  onError?: () => void;
};

type SpeakSession = {
  cancelled: boolean;
  plain: string;
  chunkIndex: number;
  totalChunks: number;
  onStopped?: (progress: SpeakProgress) => void;
};

let activeSession: SpeakSession | null = null;
let isPaused = false;

function supportsNativePauseResume() {
  return Platform.OS === 'ios' || Platform.OS === 'web';
}

/** 中文播报纯文本；按句分段，支持暂停续播 / 分片续播 */
export async function speakPlainText(text: string, options: SpeakPlainTextOptions = {}) {
  const plain = stripMarkdownForSpeech(text);
  if (!plain) {
    options.onError?.();
    return;
  }

  const rate = snapSpeechSpeedRate(options.rate ?? DEFAULT_SPEECH_RATE);
  const chunks = chunkSpeechText(plain, Speech.maxSpeechInputLength || 3000);
  const startChunkIndex = Math.max(0, Math.min(options.startChunkIndex ?? 0, chunks.length));

  if (startChunkIndex >= chunks.length) {
    options.onDone?.();
    return;
  }

  const session: SpeakSession = {
    cancelled: false,
    plain,
    chunkIndex: startChunkIndex,
    totalChunks: chunks.length,
    onStopped: options.onStopped,
  };
  activeSession = session;
  isPaused = false;

  let started = false;

  const speakNext = () => {
    if (session.cancelled || activeSession !== session) return;
    if (session.chunkIndex >= chunks.length) {
      options.onDone?.();
      return;
    }

    const chunk = chunks[session.chunkIndex];
    Speech.speak(chunk, {
      language: 'zh-CN',
      rate,
      onStart: () => {
        if (!started) {
          started = true;
          options.onStart?.();
        }
      },
      onDone: () => {
        if (session.cancelled || activeSession !== session || isPaused) return;
        session.chunkIndex += 1;
        speakNext();
      },
      onStopped: () => {
        if (activeSession !== session) return;
        // 暂停不走分片续播逻辑
        if (isPaused) return;
        options.onStopped?.({
          chunkIndex: session.chunkIndex,
          plain,
        });
      },
      onError: () => {
        if (activeSession !== session) return;
        options.onError?.();
      },
    });
  };

  await Speech.stop();
  isPaused = false;
  if (session.cancelled || activeSession !== session) return;
  speakNext();
}

/** 停止并返回续播进度（当前分片起） */
export async function stopAssistantSpeech(): Promise<SpeakProgress | null> {
  const session = activeSession;
  const progress = session
    ? {
        chunkIndex: session.chunkIndex,
        plain: session.plain,
      }
    : null;

  if (session) {
    session.cancelled = true;
  }
  isPaused = false;
  await Speech.stop();
  activeSession = null;
  return progress;
}

/** 优先原生暂停（iOS/Web）；Android 回退为 stop 并返回分片进度 */
export async function pauseOrStopAssistantSpeech(): Promise<{
  mode: 'paused' | 'stopped';
  progress: SpeakProgress | null;
}> {
  const session = activeSession;
  if (!session) {
    isPaused = false;
    await Speech.stop().catch(() => undefined);
    return { mode: 'stopped', progress: null };
  }

  if (supportsNativePauseResume()) {
    try {
      await Speech.pause();
      isPaused = true;
      return {
        mode: 'paused',
        progress: {
          chunkIndex: session.chunkIndex,
          plain: session.plain,
        },
      };
    } catch {
      // fall through to stop
    }
  }

  const progress = await stopAssistantSpeech();
  return { mode: 'stopped', progress };
}

export async function resumeAssistantSpeech(): Promise<boolean> {
  if (!supportsNativePauseResume() || !isPaused || !activeSession) {
    return false;
  }
  try {
    await Speech.resume();
    isPaused = false;
    return true;
  } catch {
    isPaused = false;
    return false;
  }
}

export function isAssistantSpeechPaused() {
  return isPaused && activeSession != null;
}

export async function isAssistantSpeaking() {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
