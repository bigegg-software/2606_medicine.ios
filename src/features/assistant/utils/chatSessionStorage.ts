import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  oldChatId: 'medicine_assistant_old_chat_id',
  oldChatTs: 'medicine_assistant_old_chat_ts',
  incomplete: 'medicine_assistant_incomplete_session',
} as const;

export const SESSION_TTL_MS = 10 * 60 * 1000;

export type IncompleteSession = {
  frontId: string;
  question: string;
  chatId: string;
};

export async function saveOldChatSession(chatId: string) {
  await AsyncStorage.multiSet([
    [KEYS.oldChatId, chatId],
    [KEYS.oldChatTs, String(Date.now())],
  ]);
}

export async function getOldChatSession() {
  const pairs = await AsyncStorage.multiGet([KEYS.oldChatId, KEYS.oldChatTs]);
  const chatId = pairs[0]?.[1] ?? '';
  const timestamp = pairs[1]?.[1] ? Number(pairs[1][1]) : 0;
  return { chatId, timestamp };
}

export async function saveIncompleteSession(session: IncompleteSession) {
  await AsyncStorage.setItem(KEYS.incomplete, JSON.stringify(session));
}

export async function getIncompleteSession(): Promise<IncompleteSession | null> {
  const raw = await AsyncStorage.getItem(KEYS.incomplete);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IncompleteSession;
  } catch {
    return null;
  }
}

export async function clearIncompleteSession() {
  await AsyncStorage.removeItem(KEYS.incomplete);
}
