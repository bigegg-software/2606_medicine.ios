import type { ImageSourcePropType } from 'react-native';
import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';
import { getUserQuestionNewList, type UserQuestionNewListResult } from '@/api/questionTemplate';
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
const USER_QUESTION_NEW_LIST_PATH = '/patient/userQuestion/newList';

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
  const respData = interfaceData?.respData as { data?: UserQuestionRecord[] } | undefined;
  const records = Array.isArray(respData?.data) ? respData.data : [];
  return buildAssistantQuestionnaireItems(records);
}

export async function requestQuestionnaireQuickAction(params: {
  chatId: string;
  chatGuide: ChatGuideState;
}) {
  const listRes = await getUserQuestionNewList();
  const records = isResourceApiOk(listRes as { code?: number })
    ? apiResourceData<UserQuestionRecord[]>(listRes as unknown as UserQuestionNewListResult) ?? []
    : [];
  const items = buildAssistantQuestionnaireItems(records);

  const interfaceData = {
    reqParams: { url: USER_QUESTION_NEW_LIST_PATH },
    respData: {
      code: (listRes as { code?: number })?.code,
      msg: (listRes as { msg?: string })?.msg,
      data: records,
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
    answer: QUESTIONNAIRE_QUICK_ANSWER,
    interfaceData,
    question: QUESTIONNAIRE_QUICK_QUESTION,
  };
}
