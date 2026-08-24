import type { FamilyBindItem } from '@/api/familyBind';
import type { FamilyPermissionKey } from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';
import { isChildFamilyBindVisible } from './familyBindNoticeHelpers';

export function validateFamilyBindAddInput(input: {
  name: string;
  relation: string;
  phone: string;
  permissions: FamilyPermissionKey[];
}): string | null {
  if (!input.name.trim()) return '请输入家人姓名';
  if (!input.relation.trim()) return '请选择关系';
  if (!input.phone.trim()) return '请输入手机号';
  if (!/^1\d{10}$/.test(input.phone.trim())) return '请输入正确的手机号';
  if (input.permissions.length === 0) return '请至少选择一项申请权限';
  return null;
}

/** 重复提交待确认邀请时的提示文案 */
export const FAMILY_BIND_DUPLICATE_PENDING_ALERT = {
  title: '申请已提交',
  message: '您提交的家人邀请正在申请中，请耐心等待结果，无需重复提交。',
  buttonText: '好的',
} as const;

/** 已绑定该家人时的提示文案 */
export const FAMILY_BIND_ALREADY_BOUND_ALERT = {
  title: '已绑定该家人',
  message: '该家人已完成绑定，无需重复提交申请。',
  buttonText: '好的',
} as const;

function normalizePhone(phone: string) {
  return phone.trim();
}

function familyBindPhoneMatches(
  item: FamilyBindItem,
  phone: string,
): boolean {
  return String(item.patientPhonenumber ?? '').trim() === phone;
}

/** 列表中是否已有该手机号的待确认邀请 */
export function hasPendingFamilyBindByPhone(
  list: FamilyBindItem[] | null | undefined,
  phone: string,
): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  return (list ?? []).some(item => {
    if (!isChildFamilyBindVisible(item)) return false;
    if (Number(item.bindStatus) !== 0) return false;
    return familyBindPhoneMatches(item, normalized);
  });
}

/** 列表中是否已有该手机号的已通过绑定 */
export function hasApprovedFamilyBindByPhone(
  list: FamilyBindItem[] | null | undefined,
  phone: string,
): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  return (list ?? []).some(item => {
    if (!isChildFamilyBindVisible(item)) return false;
    if (Number(item.bindStatus) !== 1) return false;
    return familyBindPhoneMatches(item, normalized);
  });
}

function getApiErrorText(res?: {
  code?: number;
  msg?: string;
  message?: string;
} | null) {
  return `${res?.msg ?? ''}${res?.message ?? ''}`.trim();
}

/** 接口是否返回「已绑定该家人」 */
export function isFamilyBindAlreadyBoundError(res?: {
  code?: number;
  msg?: string;
  message?: string;
} | null): boolean {
  const text = getApiErrorText(res);
  if (!text) return false;
  return /已绑定该家人|已绑定|已经绑定/.test(text);
}

/** 接口是否返回「不可重复提交待确认申请」 */
export function isFamilyBindDuplicatePendingError(res?: {
  code?: number;
  msg?: string;
  message?: string;
} | null): boolean {
  if (isFamilyBindAlreadyBoundError(res)) return false;
  const text = getApiErrorText(res);
  if (!text) return false;
  return /重复|已申请|申请中|待确认|已存在|无需重复|正在申请|不能再次/.test(text);
}

