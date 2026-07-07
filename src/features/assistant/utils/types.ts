import type { MedicationPlanGroupView } from '@/src/features/profile/medication/medicationHelpers';
import type { AssistantQuestionnaireItem } from './questionnaireQuickAction';
import type { HealthStatusCardItem } from './healthStatusAction';
import type { TodaySchedulePayload } from './todayScheduleAction';

export type ChatGuideState = {
  userChatGuideId: number | null;
  userChatGuideText: string;
};

export type UploadPreviewFile = {
  ossId?: string | number;
  url: string;
  originalName?: string;
  length?: number;
};

export type UploadPreview = {
  type: 'image' | 'file' | '';
  fileList: UploadPreviewFile[];
};

export type AssistantMessage = {
  id?: string | number;
  frontId?: string;
  question?: string;
  answer?: string;
  createTime?: string;
  streaming?: boolean;
  userChatGuideId?: number;
  userChatGuideText?: string;
  action?: string;
  uploadPreview?: UploadPreview;
  interfaceData?: {
    reqParams?: Record<string, unknown>;
    respData?: unknown;
  };
  medicationGroups?: MedicationPlanGroupView[];
  medicationAdvice?: string;
  questionnaireItems?: AssistantQuestionnaireItem[];
  questionnaireSuggestion?: string;
  healthStatusCards?: HealthStatusCardItem[];
  todaySchedule?: TodaySchedulePayload;
};

export type DisplayItem =
  | { type: 'time'; key: string; label: string }
  | { type: 'user'; key: string; text: string; uploadPreview?: UploadPreview }
  | { type: 'ai'; key: string; text: string; streaming?: boolean }
  | {
      type: 'medication_cards';
      key: string;
      groups: MedicationPlanGroupView[];
      advice?: string;
    }
  | {
      type: 'questionnaire_cards';
      key: string;
      items: AssistantQuestionnaireItem[];
      suggestion?: string;
    }
  | {
      type: 'health_status_cards';
      key: string;
      cards: HealthStatusCardItem[];
    }
  | {
      type: 'today_schedule_cards';
      key: string;
      payload: TodaySchedulePayload;
    };
