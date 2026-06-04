import request from '@/utils/axios';

export type UserBaseInfo = {
  userId?: number;
  avatarOssId?: string;
  avatarOssUrl?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
};

export type UpdateUserBaseInfoParams = {
  avatarOssId?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
};

export const getUserBaseInfo = () => request.get('/patient/userBaseInfo/getInfo');

export const updateUserBaseInfo = (data: UpdateUserBaseInfoParams) =>
  request.put('/patient/userBaseInfo/update', data);
