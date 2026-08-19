import type { FamilyPermissionKey } from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';

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
