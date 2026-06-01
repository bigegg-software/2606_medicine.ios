import request from '@/utils/axios';

export const getSchedules = (date?: string) =>
  request.get('/schedule', { params: date ? { date } : undefined });
export const getScheduleMonthlyOverview = (month: string) =>
  request.get('/schedule/monthly-overview', { params: { month } });
export const createSchedule = (data: Record<string, unknown>) => request.post('/schedule', data);
export const completeSchedule = (id: number | string) => request.put(`/schedule/${id}/complete`);
export const uncompleteSchedule = (id: number | string) => request.put(`/schedule/${id}/uncomplete`);
export const deleteSchedule = (id: number | string) => request.delete(`/schedule/${id}`);
