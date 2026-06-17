import {
  getIndexMedicationPlanGroupByTime,
  type IndexMedicationPlanGroupItem,
} from '@/api/medicationPlan';
import { buildSignedChatPayload, saveChatAction } from '@/api/assistant';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  loadMedicationDictMaps,
  mapIndexPlanGroups,
  type MedicationDictMaps,
  type MedicationPlanGroupView,
} from '@/src/features/profile/medication/medicationHelpers';
import type { ChatGuideState } from './types';

export const MEDICATION_REMINDER_QUESTION = '帮我看看今天要吃什么药';
export const MEDICATION_REMINDER_ANSWER = '您今天需要服用的药物如下:';
export const MEDICATION_REMINDER_ACTION = 'reminder';
const INDEX_PLAN_GROUP_PATH = '/patient/medicationPlan/indexPlanGroupByTime';

export function buildMedicationReminderAnswer(_groups: MedicationPlanGroupView[]): string {
  return MEDICATION_REMINDER_ANSWER;
}

export function parseMedicationGroupsFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
  dictMaps?: MedicationDictMaps,
): MedicationPlanGroupView[] {
  const respData = interfaceData?.respData as { data?: IndexMedicationPlanGroupItem[] } | undefined;
  const rawGroups = Array.isArray(respData?.data) ? respData.data : [];
  return mapIndexPlanGroups(rawGroups, dictMaps);
}

export async function requestMedicationReminderQuickAction(params: {
  chatId: string;
  chatGuide: ChatGuideState;
}) {
  const dictMaps = await loadMedicationDictMaps();
  const planRes = await getIndexMedicationPlanGroupByTime();
  const rawGroups = isResourceApiOk(planRes as { code?: number })
    ? apiResourceData<IndexMedicationPlanGroupItem[]>(
        planRes as unknown as { code?: number; data?: IndexMedicationPlanGroupItem[] },
      ) ?? []
    : [];
  const groups = mapIndexPlanGroups(rawGroups, dictMaps);
  const answer = buildMedicationReminderAnswer(groups);

  const interfaceData = {
    reqParams: { url: INDEX_PLAN_GROUP_PATH },
    respData: {
      code: (planRes as { code?: number })?.code,
      msg: (planRes as { msg?: string })?.msg,
      data: rawGroups,
    },
  };

  const saveRes = await saveChatAction(
    buildSignedChatPayload({
      chatId: params.chatId,
      question: MEDICATION_REMINDER_QUESTION,
      answer,
      action: MEDICATION_REMINDER_ACTION,
      userChatGuideId: params.chatGuide.userChatGuideId,
      userChatGuideText: params.chatGuide.userChatGuideText,
      interfaceData,
      deepMode: 'quick',
    }),
  );

  return {
    saveRes,
    groups,
    answer,
    interfaceData,
    question: MEDICATION_REMINDER_QUESTION,
  };
}
