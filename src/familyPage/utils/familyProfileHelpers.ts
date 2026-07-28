import type { FamilyBindItem } from '@/api/familyBind';
import { maskFamilyPhone } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';

/** 子女端展示绑定的老人姓名 */
export function getChildFamilyDisplayName(item: FamilyBindItem): string {
  return item.remarkName?.trim() || item.patientName?.trim() || item.childRemarkName?.trim() || '未命名';
}

export function getChildFamilySubtitle(item: FamilyBindItem): string {
  return maskFamilyPhone(item.patientPhonenumber);
}
