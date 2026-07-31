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

function chunkSpeechText(text: string, maxLen: number): string[] {
  const limit = Math.max(80, Math.floor(maxLen * 0.9));
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf('。', limit);
    if (cut < limit * 0.4) cut = remaining.lastIndexOf('！', limit);
    if (cut < limit * 0.4) cut = remaining.lastIndexOf('？', limit);
    if (cut < limit * 0.4) cut = remaining.lastIndexOf('，', limit);
    if (cut < limit * 0.4) cut = remaining.lastIndexOf(' ', limit);
    if (cut < limit * 0.4) cut = limit;
    const piece = remaining.slice(0, cut + (cut < limit ? 1 : 0)).trim();
    if (piece) chunks.push(piece);
    remaining = remaining.slice(cut + (cut < limit ? 1 : 0)).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export type SpeakPlainTextOptions = {
  rate?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: () => void;
};

/** 中文播报纯文本；自动分段以适配平台长度限制 */
export async function speakPlainText(text: string, options: SpeakPlainTextOptions = {}) {
  const plain = stripMarkdownForSpeech(text);
  if (!plain) {
    options.onError?.();
    return;
  }

  const rate = snapSpeechSpeedRate(options.rate ?? DEFAULT_SPEECH_RATE);
  const chunks = chunkSpeechText(plain, Speech.maxSpeechInputLength || 3000);
  let index = 0;
  let started = false;

  const speakNext = () => {
    if (index >= chunks.length) {
      options.onDone?.();
      return;
    }
    const chunk = chunks[index++];
    Speech.speak(chunk, {
      language: 'zh-CN',
      rate,
      onStart: () => {
        if (!started) {
          started = true;
          options.onStart?.();
        }
      },
      onDone: speakNext,
      onStopped: () => options.onStopped?.(),
      onError: () => options.onError?.(),
    });
  };

  await Speech.stop();
  speakNext();
}

export async function stopAssistantSpeech() {
  await Speech.stop();
}

export async function isAssistantSpeaking() {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
