import { FAMILY_PERMISSION_OPTIONS } from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';

export function validateFamilyBindAddInput(input: {
  name: string;
  relation: string;
  phone: string;
}): string | null {
  if (!input.name.trim()) return '请输入家人姓名';
  if (!input.relation.trim()) return '请选择关系';
  if (!input.phone.trim()) return '请输入手机号';
  if (!/^1\d{10}$/.test(input.phone.trim())) return '请输入正确的手机号';
  return null;
}

/** 子女添加家人时默认携带全部授权权限 */
export function getAllFamilyBindAuthPermissions(): string[] {
  return FAMILY_PERMISSION_OPTIONS.map(item => item.key);
}
