import moment from 'moment';
import { buildSignedChatPayload, saveChatAction } from '@/api/assistant';
import type { ChatGuideState } from './types';
import { loadTodayHealthStatusVitals } from './healthStatusVitals';
import {
  buildHealthStatusVitalsSlides,
  parseHealthStatusSlidesFromInterfaceData,
  type HealthStatusVitalSlide,
} from './healthStatusSnapshot';

export const HEALTH_STATUS_QUESTION = '健康状况';
export const HEALTH_STATUS_ANSWER = '好的，为您发送今日健康状况卡片，请查看。';
export const HEALTH_STATUS_ACTION = 'health_status';

function getTodayDate() {
  return moment().format('YYYY-MM-DD');
}

export { parseHealthStatusSlidesFromInterfaceData };

export async function requestHealthStatusQuickAction(params: {
  chatId: string;
  chatGuide: ChatGuideState;
  question?: string;
  stepTarget: number;
  energyTarget: number;
  gender?: string | null;
}) {
  const rawData = await loadTodayHealthStatusVitals();
  const slides = buildHealthStatusVitalsSlides(rawData, {
    stepTarget: params.stepTarget,
    energyTarget: params.energyTarget,
    gender: params.gender,
  });
  const question = params.question?.trim() || HEALTH_STATUS_QUESTION;
  const interfaceData = {
    reqParams: {
      customerLocalDate: getTodayDate(),
    },
    respData: {
      slides,
    },
  };

  const saveRes = await saveChatAction(
    buildSignedChatPayload({
      chatId: params.chatId,
      question,
      answer: HEALTH_STATUS_ANSWER,
      action: HEALTH_STATUS_ACTION,
      userChatGuideId: params.chatGuide.userChatGuideId,
      userChatGuideText: params.chatGuide.userChatGuideText,
      interfaceData,
      deepMode: 'quick',
    }),
  );

  return {
    saveRes,
    slides,
    answer: HEALTH_STATUS_ANSWER,
    interfaceData,
    question,
  };
}

export type { HealthStatusVitalSlide };
