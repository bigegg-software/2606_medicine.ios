import request from '@/utils/axios';

export const getActivities = (params?: { limit?: number; type?: string }) =>
  request.get('/community/activities', { params });
export const getActivityDetail = (id: number | string) => request.get(`/community/activities/${id}`);
export const registerForActivity = (id: number | string) =>
  request.post(`/community/activities/${id}/register`);
export const cancelRegistration = (id: number | string) =>
  request.delete(`/community/activities/${id}/register`);
