import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';
import moment from 'moment';
import type { MedicalRecordAttachment } from '@/api/medicalRecord';
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
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { consumePendingAttachments, pushPendingAttachments } from '@/src/utils/attachmentUploadSession';
import {
  clearIncompleteSession,
  getIncompleteSession,
  getOldChatSession,
  saveIncompleteSession,
  saveOldChatSession,
  SESSION_TTL_MS,
  type IncompleteSession,
} from './chatSessionStorage';
import { loadMedicationDictMaps } from '@/src/features/profile/medication/medicationHelpers';
import type { AssistantMessage, ChatGuideState, DisplayItem, UploadPreview } from './types';

export type PendingAssistantNavigation = {
  startNew?: boolean;
  chatId?: string;
};

let pendingAssistantNavigation: PendingAssistantNavigation | null = null;

export function queueAssistantNavigation(action: PendingAssistantNavigation) {
  pendingAssistantNavigation = action;
}

export function consumePendingAssistantNavigation() {
  const action = pendingAssistantNavigation;
  pendingAssistantNavigation = null;
  return action;
}
import {
  buildUploadFilePayloadFromAttachments,
  buildUploadPreviewFromAttachments,
  inferUploadPreviewType,
} from './uploadPreviewHelpers';
import { decodeAttachmentName } from '@/src/features/profile/healthRecord/medicalRecordAttachmentHelpers';
import {
  MEDICATION_REMINDER_ACTION,
  parseMedicationAdviceFromInterfaceData,
  parseMedicationGroupsFromInterfaceData,
  requestMedicationReminderQuickAction,
} from './medicationReminderAction';
import {
  QUESTIONNAIRE_QUICK_ACTION,
  parseQuestionnaireItemsFromInterfaceData,
  parseQuestionnaireSuggestionFromInterfaceData,
  requestQuestionnaireQuickAction,
} from './questionnaireQuickAction';
import {
  HEALTH_STATUS_ACTION,
  HEALTH_STATUS_QUESTION,
  parseHealthStatusCardsFromInterfaceData,
  requestHealthStatusQuickAction,
} from './healthStatusAction';
import {
  TODAY_SCHEDULE_ACTION,
  TODAY_SCHEDULE_QUESTION,
  parseTodayScheduleFromInterfaceData,
  requestTodayScheduleQuickAction,
} from './todayScheduleAction';

function parseInterfaceData(raw: unknown) {
  if (raw == null) return undefined;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as { reqParams?: Record<string, unknown>; respData?: unknown };
    } catch {
      return undefined;
    }
  }
  if (typeof raw === 'object') {
    return raw as { reqParams?: Record<string, unknown>; respData?: unknown };
  }
  return undefined;
}

const WELCOME_TEXT = '您好，我是 AI 健康管家，有什么可以帮您？';
const CHAT_GUIDE_TYPE = 1;

function normalizeUploadFileType(type: unknown): 'image' | 'file' | '' {
  if (type === 'image') return 'image';
  if (type === 'file' || type === 'document') return 'file';
  return '';
}

function parseUploadFile(raw: ChatDetailItem['uploadFile']): UploadPreview | undefined {
  if (raw == null) return undefined;
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as NonNullable<ChatDetailItem['uploadFile']>;
    } catch {
      return undefined;
    }
  }
  if (typeof parsed !== 'object' || !parsed) return undefined;
  const fileList = (Array.isArray(parsed.fileList) ? parsed.fileList : [])
    .map(item => ({
      ossId: item.ossId,
      url: String(item.url ?? ''),
      originalName: decodeAttachmentName(item.originalName ?? ''),
      length: Number(item.length) || 0,
    }))
    .filter(item => item.url);
  if (!fileList.length) return undefined;
  const preview: UploadPreview = {
    type: normalizeUploadFileType(parsed.type),
    fileList,
  };
  return {
    ...preview,
    type: preview.type || inferUploadPreviewType(preview),
  };
}

function buildUploadFilePayload(attachments?: MedicalRecordAttachment[]) {
  if (!attachments?.length) {
    return { type: '', fileList: [] as Record<string, unknown>[] };
  }
  return buildUploadFilePayloadFromAttachments(attachments);
}

function buildUploadPreview(attachments: MedicalRecordAttachment[]): UploadPreview {
  return buildUploadPreviewFromAttachments(attachments);
}

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

function mapDetailItem(
  item: ChatDetailItem,
  extras?: {
    medicationGroups?: AssistantMessage['medicationGroups'];
    questionnaireItems?: AssistantMessage['questionnaireItems'];
    healthStatusCards?: AssistantMessage['healthStatusCards'];
    todaySchedule?: AssistantMessage['todaySchedule'];
  },
): AssistantMessage {
  const parsedInterfaceData = parseInterfaceData(item.interfaceData);

  return {
    id: item.id,
    frontId: item.frontId,
    question: item.question,
    answer: item.answer,
    createTime: item.createTime,
    action: item.action,
    uploadPreview: parseUploadFile(item.uploadFile),
    interfaceData: parsedInterfaceData,
    medicationGroups:
      item.action === MEDICATION_REMINDER_ACTION
        ? extras?.medicationGroups ?? parseMedicationGroupsFromInterfaceData(parsedInterfaceData)
        : undefined,
    medicationAdvice:
      item.action === MEDICATION_REMINDER_ACTION
        ? parseMedicationAdviceFromInterfaceData(parsedInterfaceData)
        : undefined,
    questionnaireItems:
      item.action === QUESTIONNAIRE_QUICK_ACTION
        ? extras?.questionnaireItems ?? parseQuestionnaireItemsFromInterfaceData(parsedInterfaceData)
        : undefined,
    questionnaireSuggestion:
      item.action === QUESTIONNAIRE_QUICK_ACTION
        ? parseQuestionnaireSuggestionFromInterfaceData(parsedInterfaceData)
        : undefined,
    healthStatusCards:
      item.action === HEALTH_STATUS_ACTION
        ? extras?.healthStatusCards ?? parseHealthStatusCardsFromInterfaceData(parsedInterfaceData)
        : undefined,
    todaySchedule:
      item.action === TODAY_SCHEDULE_ACTION
        ? extras?.todaySchedule ?? parseTodayScheduleFromInterfaceData(parsedInterfaceData)
        : undefined,
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
    if (msg.question?.trim() || msg.uploadPreview?.fileList?.length) {
      items.push({
        type: 'user',
        key: `user-${msg.frontId ?? msg.id ?? index}`,
        text: msg.question?.trim() ?? '',
        uploadPreview: msg.uploadPreview,
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
    if (msg.action === MEDICATION_REMINDER_ACTION && msg.medicationGroups?.length) {
      items.push({
        type: 'medication_cards',
        key: `medication-${msg.frontId ?? msg.id ?? index}`,
        groups: msg.medicationGroups,
        advice: msg.medicationAdvice,
      });
    }
    if (msg.action === QUESTIONNAIRE_QUICK_ACTION && msg.questionnaireItems?.length) {
      items.push({
        type: 'questionnaire_cards',
        key: `questionnaire-${msg.frontId ?? msg.id ?? index}`,
        items: msg.questionnaireItems,
        suggestion: msg.questionnaireSuggestion,
      });
    }
    if (msg.action === HEALTH_STATUS_ACTION && msg.healthStatusCards?.length) {
      items.push({
        type: 'health_status_cards',
        key: `health-status-${msg.frontId ?? msg.id ?? index}`,
        cards: msg.healthStatusCards,
      });
    }
    if (msg.action === TODAY_SCHEDULE_ACTION && msg.todaySchedule && !msg.todaySchedule.isEmpty) {
      items.push({
        type: 'today_schedule_cards',
        key: `today-schedule-${msg.frontId ?? msg.id ?? index}`,
        payload: msg.todaySchedule,
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
  const hasInitializedRef = useRef(false);
  const initializingRef = useRef(true);

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

  useEffect(() => {
    initializingRef.current = initializing;
  }, [initializing]);

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
    async (
      question: string,
      isResume = false,
      resumeFrontId = '',
      attachments: MedicalRecordAttachment[] = [],
    ) => {
      const currentChatId = chatIdRef.current;
      const trimmedQuestion = question.trim();
      if (!currentChatId || (!trimmedQuestion && attachments.length === 0)) return;

      cleanupStream();
      setLoading(true);

      const frontId = isResume && resumeFrontId ? resumeFrontId : generateUUID();
      frontIdRef.current = frontId;
      const uploadPreview = attachments.length > 0 ? buildUploadPreview(attachments) : undefined;

      if (!isResume) {
        setMessages(prev => [
          ...prev,
          {
            frontId,
            question: trimmedQuestion,
            uploadPreview,
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
            question: trimmedQuestion,
            frontId,
            action: 'ai_chat',
            userChatGuideId: guide.userChatGuideId,
            userChatGuideText: guide.userChatGuideText,
            uploadFile: buildUploadFilePayload(attachments),
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

        es.addEventListener('error', () => {
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

        const dictMaps = await loadMedicationDictMaps();
        const mapped = detailList.map(item => {
          const parsedInterface = parseInterfaceData(item.interfaceData);
          return mapDetailItem(item, {
            medicationGroups:
              item.action === MEDICATION_REMINDER_ACTION
                ? parseMedicationGroupsFromInterfaceData(parsedInterface, dictMaps)
                : undefined,
            questionnaireItems:
              item.action === QUESTIONNAIRE_QUICK_ACTION
                ? parseQuestionnaireItemsFromInterfaceData(parsedInterface)
                : undefined,
            healthStatusCards:
              item.action === HEALTH_STATUS_ACTION
                ? parseHealthStatusCardsFromInterfaceData(parsedInterface)
                : undefined,
            todaySchedule:
              item.action === TODAY_SCHEDULE_ACTION
                ? parseTodayScheduleFromInterfaceData(parsedInterface)
                : undefined,
          });
        });
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

  const startNewChat = useCallback(async () => {
    cleanupStream();
    setLoading(false);
    await clearIncompleteSession();

    setInitializing(true);
    try {
      const res = await getChatId();
      const newChatId = apiResourceData<string | number>(res);
      if (newChatId != null) {
        await loadChat(String(newChatId), null);
      } else {
        setInitializing(false);
      }
    } catch (error) {
      console.error('startNewChat failed:', error);
      setInitializing(false);
    }
  }, [cleanupStream, loadChat]);

  const openChat = useCallback(
    async (targetChatId: string) => {
      if (!targetChatId || targetChatId === chatIdRef.current) return;

      cleanupStream();
      setLoading(false);
      await clearIncompleteSession();
      await loadChat(targetChatId, null);
    },
    [cleanupStream, loadChat],
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

  const sendAttachments = useCallback(async (
    attachments: MedicalRecordAttachment[],
    question = '',
  ) => {
    if (!attachments.length || loadingRef.current || !chatIdRef.current) return false;
    const text = question.trim();
    if (text) {
      setInput('');
    }
    await sendStream(text, false, '', attachments);
    return true;
  }, [sendStream]);

  const handlePendingAttachments = useCallback(async () => {
    const attachments = consumePendingAttachments();
    if (!attachments.length) return;

    if (!chatIdRef.current || loadingRef.current || initializingRef.current) {
      pushPendingAttachments(attachments);
      return;
    }

    const text = input.replace(/^\s+|\s+$/g, '');
    if (text) {
      setInput('');
    }
    await sendStream(text, false, '', attachments);
  }, [input, sendStream]);

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
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        void initChatSession().finally(() => {
          void handlePendingAttachments();
        });
      } else {
        void handlePendingAttachments();
      }

      return () => {
        void handleCleanup();
      };
    }, [handleCleanup, handlePendingAttachments, initChatSession]),
  );

  const runHealthStatusQuickAction = useCallback(async (question?: string) => {
    if (loadingRef.current || initializing || !chatIdRef.current) return false;

    setLoading(true);
    try {
      const result = await requestHealthStatusQuickAction({
        chatId: chatIdRef.current,
        chatGuide: chatGuideRef.current,
        question,
      });

      if (!isResourceApiOk(result.saveRes as { code?: number })) {
        const msg =
          (result.saveRes as { msg?: string; message?: string })?.msg ??
          (result.saveRes as { message?: string })?.message ??
          '健康状况加载失败';
        console.error('health status saveAction failed:', msg);
        return false;
      }

      const savedId = apiResourceData<number | string>(result.saveRes as { code?: number; data?: number | string });
      setMessages(prev => [
        ...prev,
        {
          id: savedId ?? undefined,
          frontId: generateUUID(),
          question: result.question,
          answer: result.answer,
          action: HEALTH_STATUS_ACTION,
          interfaceData: result.interfaceData,
          healthStatusCards: result.cards,
          createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      ]);
      scrollEndRef.current?.();
      return true;
    } catch (error) {
      console.error('runHealthStatusQuickAction failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [initializing]);

  const runTodayScheduleQuickAction = useCallback(async (question?: string) => {
    if (loadingRef.current || initializing || !chatIdRef.current) return false;

    setLoading(true);
    try {
      const result = await requestTodayScheduleQuickAction({
        chatId: chatIdRef.current,
        chatGuide: chatGuideRef.current,
        question,
      });

      if (!isResourceApiOk(result.saveRes as { code?: number })) {
        const msg =
          (result.saveRes as { msg?: string; message?: string })?.msg ??
          (result.saveRes as { message?: string })?.message ??
          '今日安排加载失败';
        console.error('today schedule saveAction failed:', msg);
        return false;
      }

      const savedId = apiResourceData<number | string>(result.saveRes as { code?: number; data?: number | string });
      setMessages(prev => [
        ...prev,
        {
          id: savedId ?? undefined,
          frontId: generateUUID(),
          question: result.question,
          answer: result.answer,
          action: TODAY_SCHEDULE_ACTION,
          interfaceData: result.interfaceData,
          todaySchedule: result.payload,
          createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      ]);
      scrollEndRef.current?.();
      return true;
    } catch (error) {
      console.error('runTodayScheduleQuickAction failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [initializing]);

  const sendMessage = useCallback(async () => {
    const text = input.replace(/^\s+|\s+$/g, '');
    if (!text || loadingRef.current || !chatIdRef.current) return;
    setInput('');
    if (text === TODAY_SCHEDULE_QUESTION) {
      const ok = await runTodayScheduleQuickAction(text);
      if (!ok) {
        console.error('today schedule quick action failed');
      }
      return;
    }
    if (text === HEALTH_STATUS_QUESTION) {
      const ok = await runHealthStatusQuickAction(text);
      if (!ok) {
        console.error('health status quick action failed');
      }
      return;
    }
    await sendStream(text, false);
  }, [input, runHealthStatusQuickAction, runTodayScheduleQuickAction, sendStream]);

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

    if (row?.question || row?.uploadPreview?.fileList?.length) {
      try {
        const guide = chatGuideRef.current;
        await saveChatMessage(
          buildSignedChatPayload({
            chatId: chatIdRef.current,
            frontId: fid,
            question: row.question ?? '',
            answer: row.answer ?? fullTextRef.current ?? '',
            action: 'ai_chat',
            userChatGuideId: guide.userChatGuideId,
            userChatGuideText: guide.userChatGuideText,
            uploadFile: row.uploadPreview
              ? { type: row.uploadPreview.type, fileList: row.uploadPreview.fileList }
              : { type: '', fileList: [] },
          }),
        );
      } catch (error) {
        console.error('saveChatMessage failed:', error);
      }
    }
    await clearIncompleteSession();
  }, [cleanupStream]);

  const runMedicationReminder = useCallback(async () => {
    if (loadingRef.current || initializing || !chatIdRef.current) return false;

    setLoading(true);
    try {
      const result = await requestMedicationReminderQuickAction({
        chatId: chatIdRef.current,
        chatGuide: chatGuideRef.current,
      });

      if (!isResourceApiOk(result.saveRes as { code?: number })) {
        const msg =
          (result.saveRes as { msg?: string; message?: string })?.msg ??
          (result.saveRes as { message?: string })?.message ??
          '用药提醒加载失败';
        console.error('medication reminder saveAction failed:', msg);
        return false;
      }

      const savedId = apiResourceData<number | string>(result.saveRes as { code?: number; data?: number | string });
      setMessages(prev => [
        ...prev,
        {
          id: savedId ?? undefined,
          frontId: generateUUID(),
          question: result.question,
          answer: result.answer,
          action: MEDICATION_REMINDER_ACTION,
          interfaceData: result.interfaceData,
          medicationGroups: result.groups,
          medicationAdvice: result.aiAdvice,
          createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      ]);
      scrollEndRef.current?.();
      return true;
    } catch (error) {
      console.error('runMedicationReminder failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [initializing]);

  const runQuestionnaireQuickAction = useCallback(async () => {
    if (loadingRef.current || initializing || !chatIdRef.current) return false;

    setLoading(true);
    try {
      const result = await requestQuestionnaireQuickAction({
        chatId: chatIdRef.current,
        chatGuide: chatGuideRef.current,
      });

      if (!isResourceApiOk(result.saveRes as { code?: number })) {
        const msg =
          (result.saveRes as { msg?: string; message?: string })?.msg ??
          (result.saveRes as { message?: string })?.message ??
          '评估量表加载失败';
        console.error('questionnaire saveAction failed:', msg);
        return false;
      }

      const savedId = apiResourceData<number | string>(result.saveRes as { code?: number; data?: number | string });
      setMessages(prev => [
        ...prev,
        {
          id: savedId ?? undefined,
          frontId: generateUUID(),
          question: result.question,
          answer: result.answer,
          action: QUESTIONNAIRE_QUICK_ACTION,
          interfaceData: result.interfaceData,
          questionnaireItems: result.items,
          questionnaireSuggestion: result.questionAiSuggestion,
          createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      ]);
      scrollEndRef.current?.();
      return true;
    } catch (error) {
      console.error('runQuestionnaireQuickAction failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [initializing]);

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
    sendAttachments,
    runMedicationReminder,
    runQuestionnaireQuickAction,
    runHealthStatusQuickAction,
    runTodayScheduleQuickAction,
    startNewChat,
    openChat,
    scrollEndRef,
  };
}
