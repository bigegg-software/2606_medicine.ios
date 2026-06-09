import request from '@/utils/axios';
import { smsClientId, smsGrantType } from '@/utils/config';
import getSignature from '@/utils/signature';

export const sendSmsCode = (phone: string) => {
  const { timestamp, signature } = getSignature();
  return request.post('/resource/sms/code', {
    phonenumber: phone,
    timestamp: String(timestamp),
    signature,
  });
};
export type LoginParams = {
  phonenumber: string;
  smsCode: string;
  regUseInviteCode?: string;
};

export const login = ({ phonenumber, smsCode, regUseInviteCode }: LoginParams) =>
  request.post('/auth/login', {
    phonenumber,
    smsCode,
    clientId: smsClientId,
    grantType: smsGrantType,
    ...(regUseInviteCode ? { regUseInviteCode } : {}),
  });

export const register = (params: LoginParams & { regUseInviteCode: string }) => login(params);

export const logout = () => request.post('/auth/logout');