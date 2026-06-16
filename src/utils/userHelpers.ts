import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser } from '@/api/user';

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
