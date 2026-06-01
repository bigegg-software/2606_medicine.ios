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
export const login = (phone: string, smsCode: string) =>
  request.post('/auth/login', {
    phonenumber: phone,
    smsCode,
    clientId: smsClientId,
    grantType: smsGrantType,
  });
export const register = (phone: string, code: string, password: string) =>
  request.post('/auth/register', { phone, code, password });
