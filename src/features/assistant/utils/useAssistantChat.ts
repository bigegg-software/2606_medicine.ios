import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';
import moment from 'moment';
import {
  buildSignedChatPayload,
  CHAT_SSE_URL,
  disconnectChatStream,
  getChatDetail,
  getChatId,
  getNewChatGuide,
  saveChatMessage,
  type ChatDetailItem,
  type ChatGuideInfo,
} from '@/api/assistant';
import { apiResourceData } from '@/src/utils/apiHelpers';
import {
  clearIncompleteSession,
  getIncompleteSession,
  getOldChatSession,
  saveIncompleteSession,
  saveOldChatSession,
  SESSION_TTL_MS,
  type IncompleteSession,
} from './chatSessionStorage';
import type { AssistantMessage, ChatGuideState, DisplayItem } from './types';

const WELCOME_TEXT = '您好，我是 AI 健康管家，有什么可以帮您？';
const CHAT_GUIDE_TYPE = 1;

function createDefaultGuide(): ChatGuideState {
  return { userChatGuideId: null, userChatGuideText: WELCOME_TEXT };
}

async function resolveChatGuide(list: ChatDetailItem[]): Promise<ChatGuideState> {
  if (list.length > 0) {
    const first = list[0];
    return {
      userChatGuideId: first.userChatGuideId ?? null,
      userChatGuideText: first.userChatGuideText?.trim() || WELCOME_TEXT,
    };
  }

  try {
    const res = await getNewChatGuide(CHAT_GUIDE_TYPE);
    const data = apiResourceData<ChatGuideInfo>(res);
    return {
      userChatGuideId: data?.userChatGuideId ?? null,
      userChatGuideText: data?.userChatGuideText?.trim() || WELCOME_TEXT,
    };
  } catch (error) {
    console.error('getNewChatGuide failed:', error);
    return createDefaultGuide();
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatTimeLabel(value?: string) {
  if (!value) return moment().format('HH:mm');
  const parsed = moment(value, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format('HH:mm') : moment().format('HH:mm');
}

function mapDetailItem(item: ChatDetailItem): AssistantMessage {
  return {
    id: item.id,
    frontId: item.frontId,
    question: item.question,
    answer: item.answer,
    createTime: item.createTime,
  };
}

function buildDisplayItems(messages: AssistantMessage[], welcomeText: string): DisplayItem[] {
  const items: DisplayItem[] = [];
  const guideText = welcomeText.trim() || WELCOME_TEXT;
  const guideTimeLabel = messages[0]?.createTime
    ? formatTimeLabel(messages[0].createTime)
    : moment().format('HH:mm');

  items.push({ type: 'time', key: 'guide-time', label: guideTimeLabel });
  items.push({ type: 'ai', key: 'guide', text: guideText });

  let lastTime = guideTimeLabel;

  messages.forEach((msg, index) => {
    const timeLabel = formatTimeLabel(msg.createTime);
    if (timeLabel !== lastTime) {
      items.push({ type: 'time', key: `time-${index}-${timeLabel}`, label: timeLabel });
      lastTime = timeLabel;
    }
    if (msg.question?.trim()) {
      items.push({
        type: 'user',
        key: `user-${msg.frontId ?? msg.id ?? index}`,
        text: msg.question.trim(),
      });
    }
    if (msg.streaming || msg.answer?.trim()) {
      items.push({
        type: 'ai',
        key: `ai-${msg.frontId ?? msg.id ?? index}`,
        text: msg.answer?.trim() ?? '',
        streaming: msg.streaming,
      });
    }
  });

  return items;
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [chatGuide, setChatGuide] = useState<ChatGuideState>(createDefaultGuide);

  const chatIdRef = useRef('');
  const chatGuideRef = useRef<ChatGuideState>(createDefaultGuide());
  const messagesRef = useRef<AssistantMessage[]>([]);
  const loadingRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  const frontIdRef = useRef('');
  const fullTextRef = useRef('');
  const scrollEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    chatGuideRef.current = chatGuide;
  }, [chatGuide]);

  const cleanupStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    fullTextRef.current = '';
  }, []);

  const updateLastAnswer = useCallback((answer: string, streaming?: boolean) => {
    setMessages(prev => {
      if (!prev.length) return prev;
      const next = [...prev];
      const last = {
        ...next[next.length - 1],
        answer,
        streaming: streaming ?? next[next.length - 1].streaming,
      };
      next[next.length - 1] = last;
      return next;
    });
    scrollEndRef.current?.();
  }, []);

  const sendStream = useCallback(
    async (question: string, isResume = false, resumeFrontId = '') => {
      const currentChatId = chatIdRef.current;
      if (!currentChatId || !question.trim()) return;
      console.log(question)
      cleanupStream();
      setLoading(true);

      const frontId = isResume && resumeFrontId ? resumeFrontId : generateUUID();
      frontIdRef.current = frontId;

      if (!isResume) {
        setMessages(prev => [
          ...prev,
          {
            frontId,
            question: question.trim(),
            answer: '',
            createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            streaming: true,
          },
        ]);
      } else {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last) {
            next[next.length - 1] = { ...last, answer: '', streaming: true };
          }
          return next;
        });
      }

      try {
        const token = await AsyncStorage.getItem('token');
        const clientId = await AsyncStorage.getItem('clientId');
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          'content-language': 'zh_CN',

        };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (clientId) headers.clientId = clientId;

        const guide = chatGuideRef.current;
        const body = JSON.stringify(
          buildSignedChatPayload({
            chatId: currentChatId,
            isNew: !isResume,
            question: question.trim(),
            frontId,
            action: 'ai_chat',
            userChatGuideId: guide.userChatGuideId,
            userChatGuideText: guide.userChatGuideText,
          }),
        );

        let finalized = false;
        const finalize = async (finalText: string) => {
          if (finalized) return;
          finalized = true;
          updateLastAnswer(finalText, false);
          setLoading(false);
          cleanupStream();
          await clearIncompleteSession();
        };
        console.log(CHAT_SSE_URL)
        console.log(JSON.stringify({
          method: 'POST',
          headers,
          body,
        }))
        console.log(JSON.stringify(body))
        const es = new EventSource(CHAT_SSE_URL, {
          method: 'POST',
          headers,
          body,
        });
        esRef.current = es;

        es.addEventListener('message', (event: { data?: any }) => {
          try {
            if (!event.data || event.data === '[DONE]') {
              void finalize(fullTextRef.current);
              return;
            }
            const data = JSON.parse(event.data);
            const content = data?.choices?.[0]?.delta?.content;
            if (typeof content === 'string' && content.length > 0) {
              fullTextRef.current += content;
              updateLastAnswer(fullTextRef.current, true);
            }
          } catch (error) {
            console.error('SSE parse error:', error);
          }
        });

        es.addEventListener('error', (err) => {
          console.log(err)
          void finalize(fullTextRef.current || '回复失败，请稍后重试');
        });

        es.addEventListener('close', () => {
          void finalize(fullTextRef.current);
        });
      } catch (error) {
        console.error('sendStream failed:', error);
        updateLastAnswer('发送失败，请稍后重试', false);
        setLoading(false);
        cleanupStream();
      }
    },
    [cleanupStream, updateLastAnswer],
  );

  const loadChat = useCallback(
    async (nextChatId: string, incomplete?: IncompleteSession | null) => {
      setInitializing(true);
      setChatId(nextChatId);
      chatIdRef.current = nextChatId;
      await saveOldChatSession(nextChatId);

      try {
        const res = await getChatDetail(nextChatId);
        const list = apiResourceData<ChatDetailItem[]>(res) ?? [];
        const detailList = Array.isArray(list) ? list : [];
        const guide = await resolveChatGuide(detailList);
        setChatGuide(guide);
        chatGuideRef.current = guide;

        const mapped = detailList.map(mapDetailItem);
        setMessages(mapped.length > 0 ? mapped : []);

        if (incomplete && incomplete.chatId === nextChatId && incomplete.question) {
          const ended = mapped.some(item => item.frontId === incomplete.frontId && item.answer);
          if (!ended) {
            setMessages(prev => [
              ...prev,
              {
                frontId: incomplete.frontId,
                question: incomplete.question,
                answer: '',
                createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                streaming: true,
              },
            ]);
            frontIdRef.current = incomplete.frontId;
            await sendStream(incomplete.question, true, incomplete.frontId);
          } else {
            await clearIncompleteSession();
          }
        }
      } catch (error) {
        console.error('loadChat failed:', error);
        setMessages([]);
      } finally {
        setInitializing(false);
      }
    },
    [sendStream],
  );

  const initChatSession = useCallback(async () => {
    setInitializing(true);

    const incomplete = await getIncompleteSession();
    const { chatId: oldChatId, timestamp } = await getOldChatSession();
    const withinTenMinutes = oldChatId && Date.now() - timestamp < SESSION_TTL_MS;

    if (withinTenMinutes && oldChatId) {
      await loadChat(oldChatId, incomplete);
      return;
    }

    try {
      const res = await getChatId();
      const newChatId = apiResourceData<string | number>(res);
      if (newChatId != null) {
        await loadChat(String(newChatId), null);
      } else {
        setInitializing(false);
      }
    } catch (error) {
      console.error('getChatId failed:', error);
      setInitializing(false);
    }
  }, [loadChat]);

  const handleCleanup = useCallback(async () => {
    if (loadingRef.current) {
      const last = messagesRef.current[messagesRef.current.length - 1];
      if (last?.question && frontIdRef.current && chatIdRef.current) {
        await saveIncompleteSession({
          frontId: frontIdRef.current,
          question: last.question,
          chatId: chatIdRef.current,
        });
      }
    } else {
      await clearIncompleteSession();
    }
    cleanupStream();
    setLoading(false);
  }, [cleanupStream]);

  useFocusEffect(
    useCallback(() => {
      void initChatSession();
      return () => {
        void handleCleanup();
      };
    }, [initChatSession, handleCleanup]),
  );

  const sendMessage = useCallback(async () => {
    const text = input.replace(/^\s+|\s+$/g, '');
    if (!text || loadingRef.current || !chatIdRef.current) return;
    setInput('');
    await sendStream(text, false);
  }, [input, sendStream]);

  const stopMessage = useCallback(async () => {
    if (!loadingRef.current) return;
    const list = messagesRef.current;
    const fid = frontIdRef.current;
    let row = list[list.length - 1];
    if (fid) {
      const matched = [...list].reverse().find(item => item.frontId === fid);
      if (matched) row = matched;
    }

    cleanupStream();
    setLoading(false);
    await disconnectChatStream(chatIdRef.current);

    if (row?.question) {
      try {
        const guide = chatGuideRef.current;
        await saveChatMessage(
          buildSignedChatPayload({
            chatId: chatIdRef.current,
            frontId: fid,
            question: row.question,
            answer: row.answer ?? fullTextRef.current ?? '',
            action: 'ai_chat',
            userChatGuideId: guide.userChatGuideId,
            userChatGuideText: guide.userChatGuideText,
          }),
        );
      } catch (error) {
        console.error('saveChatMessage failed:', error);
      }
    }
    await clearIncompleteSession();
  }, [cleanupStream]);

  const displayItems = buildDisplayItems(messages, chatGuide.userChatGuideText);

  return {
    chatId,
    input,
    setInput,
    loading,
    initializing,
    displayItems,
    sendMessage,
    stopMessage,
    scrollEndRef,
  };
}
