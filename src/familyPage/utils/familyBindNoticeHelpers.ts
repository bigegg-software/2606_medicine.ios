import type { FamilyBindItem } from '@/api/familyBind';
import { isFamilyAccountStatusAbnormal } from '@/src/features/profile/utils/profileFamilyUnbindHelpers';
import { removeFamilyBindById } from './familyProfileRemoveHelpers';

function isDeletedFlag(value?: string | number | null) {
  return String(value ?? '').trim() === '1';
}

/** 绑定时填写的姓名：家属备注优先，其次患者名 */
export function getChildFamilyBindTimeName(item: FamilyBindItem): string {
  return item.remarkName?.trim() || item.patientName?.trim() || '家人';
}

/** 老人端已解绑、家属端尚未确认移除 */
export function isFamilyUnbindPendingByOld(item: FamilyBindItem): boolean {
  return isDeletedFlag(item.delFlagByOld) && !isDeletedFlag(item.delFlagByJs);
}

/** 患者账号异常，家属端需确认后移除绑定 */
export function isPatientAccountAbnormalPending(item: FamilyBindItem): boolean {
  if (isDeletedFlag(item.delFlagByJs)) return false;
  return isFamilyAccountStatusAbnormal(item.patientAccountStatus);
}

export type ChildFamilyBindNoticeKind = 'unbindByOld' | 'accountAbnormal';

export type ChildFamilyBindNoticeItem = {
  kind: ChildFamilyBindNoticeKind;
  item: FamilyBindItem;
};

/** 家人端打开后需弹窗确认的绑定项 */
export function listChildFamilyBindNotices(
  list: FamilyBindItem[],
): ChildFamilyBindNoticeItem[] {
  const notices: ChildFamilyBindNoticeItem[] = [];
  list.forEach(item => {
    if (isDeletedFlag(item.delFlagByJs)) return;
    if (isFamilyUnbindPendingByOld(item)) {
      notices.push({ kind: 'unbindByOld', item });
      return;
    }
    if (isPatientAccountAbnormalPending(item)) {
      notices.push({ kind: 'accountAbnormal', item });
    }
  });
  return notices;
}

/** 家人端列表可见（排除待确认解绑 / 账号异常待确认 / 家属已删） */
export function isChildFamilyBindVisible(item: FamilyBindItem): boolean {
  if (isDeletedFlag(item.delFlagByJs)) return false;
  if (isFamilyUnbindPendingByOld(item)) return false;
  if (isPatientAccountAbnormalPending(item)) return false;
  return true;
}

/** 【绑定时填写的姓名】已经解除了与您的家人绑定关系，请知悉 */
export function buildFamilyUnbindByOldNoticeMessage(item: FamilyBindItem) {
  const name = getChildFamilyBindTimeName(item);
  return `【${name}】已经解除了与您的家人绑定关系，请知悉`;
}

/** 【绑定时填写的姓名】账号异常，将自动取消家人关系绑定 */
export function buildPatientAccountAbnormalNoticeMessage(item: FamilyBindItem) {
  const name = getChildFamilyBindTimeName(item);
  return `【${name}】账号异常，将自动取消家人关系绑定`;
}

export function buildChildFamilyBindNoticeMessage(notice: ChildFamilyBindNoticeItem) {
  return notice.kind === 'accountAbnormal'
    ? buildPatientAccountAbnormalNoticeMessage(notice.item)
    : buildFamilyUnbindByOldNoticeMessage(notice.item);
}

/** 家属确认后移除绑定（设置 delFlagByJs=1） */
export async function confirmChildFamilyBindNoticeRemove(bindId: string) {
  return removeFamilyBindById(bindId);
}
