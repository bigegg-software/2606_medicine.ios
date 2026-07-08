import type { ImageSourcePropType } from 'react-native';
import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser } from '@/api/user';

export const DEFAULT_AVATAR = require('@/assets/images/default/default_avatar.png');
export const DEFAULT_AVATAR1 = require('@/assets/images/default/default1.png');
export const DEFAULT_AVATAR2 = require('@/assets/images/default/default2.png');

type DisplayUserSource = Pick<UserBaseInfo, 'name' | 'userId'> | null | undefined;
type SystemUserNameSource = Pick<SystemUser, 'realName' | 'nickName' | 'userName' | 'userId'> | null | undefined;

function pickName(...candidates: (string | undefined)[]) {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return '';
}

export function getDisplayUserName(
  user?: DisplayUserSource,
  systemUser?: SystemUserNameSource,
): string {
  const name = pickName(user?.name, systemUser?.realName, systemUser?.nickName, systemUser?.userName);
  if (name) return name;

  const userId = user?.userId ?? systemUser?.userId;
  if (userId != null) {
    const idStr = String(userId);
    const suffix = idStr.length >= 4 ? idStr.slice(-4) : idStr.padStart(4, '0');
    return `用户${suffix}`;
  }

  return '用户';
}

export function isFemaleGender(gender?: string | null) {
  return gender === '女' || gender === '1';
}

export function isMaleGender(gender?: string | null) {
  return gender === '男' || gender === '0' || gender === '2';
}

export function getDefaultAvatarByGender(gender?: string | null): ImageSourcePropType {
  if (isFemaleGender(gender)) return DEFAULT_AVATAR1;
  if (isMaleGender(gender)) return DEFAULT_AVATAR2;
  return DEFAULT_AVATAR;
}

export function maskPhoneNumber(phone?: string | null): string {
  if (!phone?.trim()) {
    return '--';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) {
    return phone;
  }
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}
