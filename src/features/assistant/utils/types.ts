import type { MedicationPlanGroupView } from '@/src/features/profile/medication/medicationHelpers';
import type { AssistantQuestionnaireItem } from './questionnaireQuickAction';

export type ChatGuideState = {
  userChatGuideId: number | null;
  userChatGuideText: string;
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
  interfaceData?: {
    reqParams?: Record<string, unknown>;
    respData?: unknown;
  };
  medicationGroups?: MedicationPlanGroupView[];
  questionnaireItems?: AssistantQuestionnaireItem[];
};

export type DisplayItem =
  | { type: 'time'; key: string; label: string }
  | { type: 'user'; key: string; text: string }
  | { type: 'ai'; key: string; text: string; streaming?: boolean }
  | { type: 'medication_cards'; key: string; groups: MedicationPlanGroupView[] }
  | { type: 'questionnaire_cards'; key: string; items: AssistantQuestionnaireItem[] };
