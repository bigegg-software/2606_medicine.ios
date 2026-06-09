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
};

export type DisplayItem =
  | { type: 'time'; key: string; label: string }
  | { type: 'user'; key: string; text: string }
  | { type: 'ai'; key: string; text: string; streaming?: boolean };
