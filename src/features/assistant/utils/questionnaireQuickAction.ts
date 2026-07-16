import type { ImageSourcePropType } from 'react-native';
import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';
import { getUserQuestionNewList, type UserQuestionNewListResult } from '@/api/questionTemplate';
import { getUserInfo } from '@/api/user';
import { buildSignedChatPayload, saveChatAction } from '@/api/assistant';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildLastAssessmentMap,
  canStartAssessment,
  getNextAssessmentDate,
  QUESTIONNAIRE_CONFIG,
  QUESTIONNAIRE_TITLES,
} from '@/src/features/profile/questionnaire/utils/helpers';
import type { ChatGuideState } from './types';

export const QUESTIONNAIRE_QUICK_QUESTION = '评估量表';
export const QUESTIONNAIRE_QUICK_ANSWER = '没问题，评估量表已发送，请点击查看。';
export const QUESTIONNAIRE_QUICK_ACTION = 'assessment';

export const QUESTIONNAIRE_ASSISTANT_ICONS: ImageSourcePropType[] = [
  require('@/assets/images/assistant/icon1.png'),
  require('@/assets/images/assistant/icon3.png'),
  require('@/assets/images/assistant/icon2.png'),
];

export type AssistantQuestionnaireItem = {
  type: QuestionnaireType;
  title: string;
  duration: string;
  iconIndex: number;
  canStart: boolean;
  nextAssessmentDate?: string;
};

type QuestionnaireInterfaceRespData = {
  items?: AssistantQuestionnaireItem[];
  questionAiSuggestion?: string;
  data?: UserQuestionRecord[];
};

export function buildAssistantQuestionnaireItems(records: UserQuestionRecord[]): AssistantQuestionnaireItem[] {
  const lastMap = buildLastAssessmentMap(records);
  return QUESTIONNAIRE_CONFIG.map((item, index) => {
    const lastDate = lastMap[item.type]?.date;
    return {
      type: item.type,
      title: QUESTIONNAIRE_TITLES[item.type],
      duration: item.duration,
      iconIndex: index % QUESTIONNAIRE_ASSISTANT_ICONS.length,
      canStart: canStartAssessment(item.type, lastDate),
      nextAssessmentDate: getNextAssessmentDate(item.type, lastDate),
    };
  });
}

export function parseQuestionnaireItemsFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
): AssistantQuestionnaireItem[] {
  const respData = interfaceData?.respData as QuestionnaireInterfaceRespData | undefined;
  if (Array.isArray(respData?.items)) {
    return respData.items;
  }
  const records = Array.isArray(respData?.data) ? respData.data : [];
  return buildAssistantQuestionnaireItems(records);
}

export function parseQuestionnaireSuggestionFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
): string {
  const respData = interfaceData?.respData as QuestionnaireInterfaceRespData | undefined;
  return respData?.questionAiSuggestion?.trim() ?? '';
}

async function loadQuestionAiSuggestion() {
  try {
    const res = await getUserInfo();
    if (!isResourceApiOk(res as { code?: number })) return '';
    const data = apiResourceData<{ userExtr?: { questionAiSuggestion?: string } }>(res as {
      code?: number;
      data?: { userExtr?: { questionAiSuggestion?: string } };
    });
    return data?.userExtr?.questionAiSuggestion?.trim() ?? '';
  } catch (error) {
    console.error('loadQuestionAiSuggestion failed:', error);
    return '';
  }
}

export async function requestQuestionnaireQuickAction(params: {
  chatId: string;
  chatGuide: ChatGuideState;
}) {
  const [listRes, questionAiSuggestion] = await Promise.all([
    getUserQuestionNewList(),
    loadQuestionAiSuggestion(),
  ]);
  const records = isResourceApiOk(listRes as { code?: number })
    ? apiResourceData<UserQuestionRecord[]>(listRes as unknown as UserQuestionNewListResult) ?? []
    : [];
  const items = buildAssistantQuestionnaireItems(records);

  const interfaceData = {
    respData: {
      items,
      questionAiSuggestion,
    },
  };

  const saveRes = await saveChatAction(
    buildSignedChatPayload({
      chatId: params.chatId,
      question: QUESTIONNAIRE_QUICK_QUESTION,
      answer: QUESTIONNAIRE_QUICK_ANSWER,
      action: QUESTIONNAIRE_QUICK_ACTION,
      userChatGuideId: params.chatGuide.userChatGuideId,
      userChatGuideText: params.chatGuide.userChatGuideText,
      interfaceData,
      deepMode: 'quick',
    }),
  );

  return {
    saveRes,
    items,
    questionAiSuggestion,
    answer: QUESTIONNAIRE_QUICK_ANSWER,
    interfaceData,
    question: QUESTIONNAIRE_QUICK_QUESTION,
  };
}

/** 点击开始评估时实时拉取最新评估记录，判定是否可开始 */
export async function checkQuestionnaireStartAvailability(type: QuestionnaireType) {
  const listRes = await getUserQuestionNewList();
  if (!isResourceApiOk(listRes as { code?: number })) {
    throw new Error(
      (listRes as { msg?: string; message?: string })?.msg ??
        (listRes as { message?: string })?.message ??
        '评估状态校验失败',
    );
  }
  const records =
    apiResourceData<UserQuestionRecord[]>(listRes as unknown as UserQuestionNewListResult) ?? [];
  const item = buildAssistantQuestionnaireItems(records).find(row => row.type === type);
  return {
    canStart: item?.canStart ?? true,
    nextAssessmentDate: item?.nextAssessmentDate,
  };
}
