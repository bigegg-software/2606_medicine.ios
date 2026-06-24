import request from '@/utils/axios';

export const submitPatientTrainingRecord = (data: {
  prescriptionId: number;
  exerciseId?: number;
  durationSeconds: number;
  completed: boolean;
  note?: string;
}) => {
  const body: Record<string, unknown> = {
    prescriptionId: data.prescriptionId,
    duration: data.durationSeconds,
    completed: data.completed,
  };
  if (data.exerciseId != null && data.exerciseId > 0) body.exerciseId = data.exerciseId;
  if (data.note?.trim()) body.note = data.note.trim();
  return request.post('/patient/training-records', body);
};
export const getAppTrainingHistory = (days = 7) =>
  request.get('/patient/training-records', { params: { days } });
