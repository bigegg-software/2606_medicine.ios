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

/** 统一为 YYYY-MM-DD；兼容 ISO 等后端格式 */
function normalizeBirthDate(value?: string | null) {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const strict = moment(raw, ['YYYY-MM-DD', 'YYYYMMDD', 'YYYY/MM/DD'], true);
  if (strict.isValid()) return strict.format('YYYY-MM-DD');
  const loose = moment(raw);
  return loose.isValid() ? loose.format('YYYY-MM-DD') : '';
}

/** 接口可能返回 birthDate / birthday 等字段 */
function pickBirthDateRaw(data?: UserBaseInfo | null): string {
  if (!data) return '';
  const extra = data as UserBaseInfo & {
    birthday?: string;
    birthDay?: string;
    birth_date?: string;
  };
  const candidates = [extra.birthDate, extra.birthday, extra.birthDay, extra.birth_date];
  for (const item of candidates) {
    const normalized = normalizeBirthDate(item);
    if (normalized) return normalized;
  }
  return '';
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
  cachedUser?: UserBaseInfo | null,
): Promise<FamilyMemberProfileForm> {
  const fallback = emptyFamilyMemberProfileForm(phone);
  const cachedBirthDate = pickBirthDateRaw(cachedUser);

  try {
    const res = await getUserBaseInfo();
    const data = apiResourceData<UserBaseInfo>(
      res as { code?: number; data?: UserBaseInfo },
    );
    if (!data) {
      return cachedBirthDate ? { ...fallback, birthDate: cachedBirthDate } : fallback;
    }
    return {
      avatarOssId: data.avatarOssId != null ? String(data.avatarOssId) : undefined,
      avatarOssUrl: data.avatarOssUrl?.trim() || '',
      name: data.name?.trim() || '',
      gender: data.gender?.trim() || '',
      birthDate: pickBirthDateRaw(data) || cachedBirthDate,
      phone: maskPhoneNumber(phone),
    };
  } catch {
    return cachedBirthDate ? { ...fallback, birthDate: cachedBirthDate } : fallback;
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
  const normalized = normalizeBirthDate(value);
  if (!normalized) return undefined;
  return moment(normalized, 'YYYY-MM-DD', true).toDate();
}
