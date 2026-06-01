import request from '@/utils/axios';

export const getFamilyMembers = () => request.get('/family/members');
export const inviteFamilyMember = (phone: string, relationType: string) =>
  request.post('/family/invite', { phone, relationType });
export const unbindFamily = (id: number) => request.delete(`/family/${id}`);
export const getMyBed = () => request.get('/admissions/my-bed');
