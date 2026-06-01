import request from '@/utils/axios';

export const sendAssistantMessage = (message: string) =>
  request.post('/assistant/chat', { message });
