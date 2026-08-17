import moment from 'moment';
import {
  getUserBaseInfo,
  updateUserBaseInfo,
  type UpdateUserBaseInfoParams,
  type UserBaseInfo,
} from '@/api/patient';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { maskPhoneNumber } from '@/src/utils/userHelpers';

export type FamilyMemberProfileForm = {
  avatarOssId?: string;
  avatarOssUrl: string;
  name: string;
  gender: string;
  birthDate: string;
  phone: string;
};

function normalizeBirthDate(value?: string) {
  if (!value) return '';
  const m = moment(value, ['YYYY-MM-DD', 'YYYYMMDD'], true);
  return m.isValid() ? m.format('YYYY-MM-DD') : value;
}

export function emptyFamilyMemberProfileForm(phone?: string): FamilyMemberProfileForm {
  return {
    avatarOssId: undefined,
    avatarOssUrl: '',
    name: '',
    gender: '',
    birthDate: '',
    phone: maskPhoneNumber(phone),
  };
}

/** 拉取本人基础资料（头像/姓名/性别/出生日期） */
export async function loadFamilyMemberProfileForm(
  phone?: string,
): Promise<FamilyMemberProfileForm> {
  const fallback = emptyFamilyMemberProfileForm(phone);

  try {
    const res = await getUserBaseInfo();
    const data = apiResourceData<UserBaseInfo>(
      res as { code?: number; data?: UserBaseInfo },
    );
    if (!data) return fallback;
    return {
      avatarOssId: data.avatarOssId != null ? String(data.avatarOssId) : undefined,
      avatarOssUrl: data.avatarOssUrl?.trim() || '',
      name: data.name?.trim() || '',
      gender: data.gender?.trim() || '',
      birthDate: normalizeBirthDate(data.birthDate),
      phone: maskPhoneNumber(phone),
    };
  } catch {
    return fallback;
  }
}

/** 保存本人基础资料 */
export async function saveFamilyMemberProfileForm(
  form: FamilyMemberProfileForm,
): Promise<{ ok: boolean; msg?: string }> {
  const payload: UpdateUserBaseInfoParams = {
    avatarOssId: form.avatarOssId,
    name: form.name.trim(),
    gender: form.gender,
    birthDate: form.birthDate || undefined,
  };

  try {
    const res = await updateUserBaseInfo(payload);
    if (!isResourceApiOk(res as { code?: number })) {
      const r = res as { msg?: string; message?: string };
      return { ok: false, msg: r.msg ?? r.message ?? '请稍后重试' };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}

export function parseBirthDate(value?: string) {
  if (!value) return undefined;
  const m = moment(value, ['YYYY-MM-DD', 'YYYYMMDD'], true);
  return m.isValid() ? m.toDate() : undefined;
}
