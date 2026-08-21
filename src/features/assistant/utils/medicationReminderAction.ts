import {
  getIndexMedicationPlanGroupByTime,
  postMedicationAiAdvice,
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
import moment from 'moment';

export const MEDICATION_REMINDER_QUESTION = '帮我看看今天要吃什么药';
export const MEDICATION_REMINDER_ANSWER = '您今天需要服用的药物如下:';
export const MEDICATION_REMINDER_EMPTY_ANSWER = '您还没有加任何用药计划。';
export const MEDICATION_REMINDER_ACTION = 'reminder';
const INDEX_PLAN_GROUP_PATH = '/patient/medicationPlan/indexPlanGroupByTime';
const AI_ADVICE_PATH = '/patient/medicationPlan/aiAdvice';

export function buildMedicationReminderAnswer(groups: MedicationPlanGroupView[]): string {
  return groups.length > 0 ? MEDICATION_REMINDER_ANSWER : MEDICATION_REMINDER_EMPTY_ANSWER;
}

export function buildMedicationAdviceParamJson(rawGroups: IndexMedicationPlanGroupItem[]) {
  return {
    date: moment().format('YYYY-MM-DD'),
    groups: (rawGroups ?? []).map(group => ({
      time: group.medicationPlanTime,
      medications: (group.list ?? []).map(item => {
        const plan = item.healthMedicationPlan;
        return {
          medicationPlanId:
            plan?.medicationPlanId != null ? String(plan.medicationPlanId) : '',
          name: plan?.name?.trim() ?? '',
          amount: plan?.amount?.trim() ?? '',
          amountUnit: plan?.amountUnit?.trim() ?? '',
          medicationPlanTime: item.medicationPlanTime ?? group.medicationPlanTime ?? '',
          eventBased: plan?.eventBased?.trim() ?? '',
          planType: plan?.planType ?? 0,
          taken: item.action === 1,
        };
      }),
    })),
  };
}

export function parseMedicationAdviceFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
): string {
  const respData = interfaceData?.respData as { aiAdvice?: string } | undefined;
  return respData?.aiAdvice?.trim() ?? '';
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
  const paramJson = buildMedicationAdviceParamJson(rawGroups);

  let aiAdvice = '';
  let aiAdviceMeta: { paramsMd5?: string; cached?: boolean } | undefined;
  if (groups.length > 0) {
    try {
      const adviceRes = await postMedicationAiAdvice(paramJson);
      if (isResourceApiOk(adviceRes as { code?: number })) {
        const adviceData = apiResourceData<{
          aiAdvice?: string;
          paramsMd5?: string;
          cached?: boolean;
        }>(adviceRes as { code?: number; data?: { aiAdvice?: string; paramsMd5?: string; cached?: boolean } });
        aiAdvice = adviceData?.aiAdvice?.trim() ?? '';
        aiAdviceMeta = {
          paramsMd5: adviceData?.paramsMd5,
          cached: adviceData?.cached,
        };
      }
    } catch (error) {
      console.error('postMedicationAiAdvice failed:', error);
    }
  }

  const interfaceData = {
    reqParams: {
      url: INDEX_PLAN_GROUP_PATH,
      aiAdviceUrl: AI_ADVICE_PATH,
      paramJson,
    },
    respData: {
      code: (planRes as { code?: number })?.code,
      msg: (planRes as { msg?: string })?.msg,
      data: rawGroups,
      aiAdvice,
      aiAdviceMeta,
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
    aiAdvice,
    interfaceData,
    question: MEDICATION_REMINDER_QUESTION,
  };
}
