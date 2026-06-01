import request from '@/utils/axios';

export const getLatestMetrics = () => request.get('/health/metrics/latest');
export const getHealthMetrics = (params?: { type?: string; days?: number }) =>
  request.get('/health/metrics', { params });
export const getHealthProfileSummary = () => request.get('/health/profile/summary');
export const getHealthProfile = () => request.get('/health/profile');
export const getMedications = () => request.get('/medications');
export const takeMedication = (id: number, scheduledTime?: string) =>
  request.post(`/medications/${id}/take`, scheduledTime ? { scheduledTime } : {});
export const getAllergies = () => request.get('/health/allergies');
export const deleteAllergy = (id: number) => request.delete(`/health/allergies/${id}`);
export const getFamilyHistory = () => request.get('/health/family-history');
export const deleteFamilyHistory = (id: number) => request.delete(`/health/family-history/${id}`);
export const getEmergencyContacts = () => request.get('/health/emergency-contacts');
export const deleteEmergencyContact = (id: number) => request.delete(`/health/emergency-contacts/${id}`);
