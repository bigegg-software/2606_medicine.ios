import request from '@/utils/axios';
import { aiBaseURL } from '@/utils/config';
import getSignature from '@/utils/signature';

export type ChatDetailItem = {
  id?: number;
  chatId?: number;
  question?: string;
  answer?: string;
  reasoningContent?: string;
  createTime?: string;
  frontId?: string;
  userChatGuideId?: number;
  userChatGuideText?: string;
  thinkList?: { name?: string; text?: string }[];
  action?: string;
  deepMode?: string;
  uploadFile?: string | {
    type?: string;
    fileList?: {
      ossId?: number | string;
      url?: string;
      originalName?: string;
      length?: number;
    }[];
  };
  interfaceData?: {
    reqParams?: Record<string, unknown>;
    respData?: unknown;
  };
};

export type ChatGuideInfo = {
  userChatGuideId?: number;
  userId?: number;
  customerLocalDate?: string;
  userChatGuideText?: string;
  md5?: string;
  bizId?: number;
  aiTipParams?: Record<string, unknown>;
  type?: number;
};

/** 类型 0=首页 1=聊天；新对话且记录为空时拉取引导语 */
export const getNewChatGuide = (type: 0 | 1) =>
  request.get('/patient/chatGuide/getNewGuide', { params: { type } });

export type ChatStreamBody = {
  chatId: string | number;
  question: string;
  isNew?: boolean;
  frontId?: string;
  deepMode?: string;
  appType?: number;
  bizType?: number;
};

export const getChatId = () => request.get('/patient/chat/getChatId');

export const getChatDetail = (chatId: string | number) =>
  request.get(`/patient/chat/${chatId}/detail`);

export const deleteChat = (chatId: string | number) =>
  request.delete(`/patient/chat/${chatId}`);

export type UserChatListItem = {
  id?: number;
  chatId?: number;
  question?: string;
  createTime?: string;
  reportsId?: string;
  bizId?: string;
  appType?: number;
  bizType?: number;
  type?: string;
  deepMode?: string;
};

export type UserChatPageListParams = {
  type?: number;
  appType?: number;
  bizType?: number;
  pageSize?: number;
  pageNum?: number;
};

export const getUserChatPageList = (params: UserChatPageListParams = {}) =>
  request.get('/patient/chat/userChatPageList', {
    params: {
      type: params.type ?? 1,
      appType: params.appType ?? 0,
      bizType: params.bizType ?? 0,
      pageSize: params.pageSize ?? 20,
      pageNum: params.pageNum ?? 1,
    },
  });

export function buildSignedChatPayload(extra: Record<string, unknown> = {}) {
  const { timestamp, signature } = getSignature();
  return {
    timestamp: String(timestamp),
    signature,
    answer: '',
    reasoningContent: '',
    reportsId: null,
    id: null,
    appType: 0,
    bizType: 0,
    bizId: null,
    userChatGuideId: null,
    userChatGuideText: '',
    thinkList: [{ name: '', text: '' }],
    params: { language: 'zh_CN' },
    uploadFile: { type: '', fileList: [] },
    action: 'ai_chat',
    interfaceData: { reqParams: {}, respData: {} },
    operationResult: '',
    operationBizId: '',
    deepMode: 'quick',
    ...extra,
  };
}

export const saveChatMessage = (payload: Record<string, unknown>) =>
  request.post('/patient/chat/stop/saveMessage', payload);

export const saveChatAction = (payload: Record<string, unknown>) =>
  request.post('/patient/chat/saveAction', payload);

export async function disconnectChatStream(chatId: string) {
  try {
    await fetch(`${aiBaseURL}pensionAiApi/chat/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });
  } catch {
    /* ignore */
  }
}

export const CHAT_SSE_URL = `${aiBaseURL}pensionAiApi/chat/v4`;
