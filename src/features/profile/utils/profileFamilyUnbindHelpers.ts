import type { OldFamilyBindItem } from '@/api/oldFamilyBind';
import { removeOldFamilyBind } from '@/api/oldFamilyBind';
import { isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import { getFamilyDisplayName } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';

function isDeletedFlag(value?: string | number | null) {
  return String(value ?? '').trim() === '1';
}

/** 账号状态：0.正常 1.禁用 2.已注销 — 仅已注销弹窗/隐藏；禁用不弹窗、不按异常展示 */
export function isFamilyAccountStatusAbnormal(status?: number | null) {
  return Number(status) === 2;
}

/** 家属端已解绑、老人端尚未确认移除 */
export function isFamilyUnbindPendingByJs(item: OldFamilyBindItem): boolean {
  return isDeletedFlag(item.delFlagByJs) && !isDeletedFlag(item.delFlagByOld);
}

/** 家属账号异常，老人端需确认后移除绑定 */
export function isFamilyAccountAbnormalPending(item: OldFamilyBindItem): boolean {
  if (isDeletedFlag(item.delFlagByOld)) return false;
  return isFamilyAccountStatusAbnormal(item.jsAccountStatus);
}

export type OldFamilyBindNoticeKind = 'unbindByJs' | 'accountAbnormal';

export type OldFamilyBindNoticeItem = {
  kind: OldFamilyBindNoticeKind;
  item: OldFamilyBindItem;
};

/** 老人端打开「我的」需弹窗确认的绑定项 */
export function listOldFamilyBindNotices(
  list: OldFamilyBindItem[],
): OldFamilyBindNoticeItem[] {
  const notices: OldFamilyBindNoticeItem[] = [];
  list.forEach(item => {
    if (isDeletedFlag(item.delFlagByOld)) return;
    if (isFamilyUnbindPendingByJs(item)) {
      notices.push({ kind: 'unbindByJs', item });
      return;
    }
    if (isFamilyAccountAbnormalPending(item)) {
      notices.push({ kind: 'accountAbnormal', item });
    }
  });
  return notices;
}

/** 老人端「我的」可见家人列表（排除待确认解绑 / 账号异常待确认 / 已删） */
export function filterVisibleOldFamilyBindList(
  list: OldFamilyBindItem[],
): OldFamilyBindItem[] {
  return list.filter(item => {
    if (isDeletedFlag(item.delFlagByOld)) return false;
    if (isFamilyUnbindPendingByJs(item)) return false;
    if (isFamilyAccountAbnormalPending(item)) return false;
    return true;
  });
}

/** 【绑定时填写的姓名】已经解除了与您的家人绑定关系，请知悉 */
export function buildFamilyUnbindByJsNoticeMessage(item: OldFamilyBindItem) {
  const name = getFamilyDisplayName(item).trim() || '家人';
  return `【${name}】已经解除了与您的家人绑定关系，请知悉`;
}

/** 【绑定时填写的姓名】账号异常，将自动取消家人关系绑定 */
export function buildFamilyAccountAbnormalNoticeMessage(item: OldFamilyBindItem) {
  const name = getFamilyDisplayName(item).trim() || '家人';
  return `【${name}】账号异常，将自动取消家人关系绑定`;
}

export function buildOldFamilyBindNoticeMessage(notice: OldFamilyBindNoticeItem) {
  return notice.kind === 'accountAbnormal'
    ? buildFamilyAccountAbnormalNoticeMessage(notice.item)
    : buildFamilyUnbindByJsNoticeMessage(notice.item);
}

/** 老人确认后移除绑定（设置 delFlagByOld=1） */
export async function confirmOldFamilyBindNoticeRemove(
  bindId: string,
): Promise<{ ok: boolean; msg?: string }> {
  const id = String(bindId ?? '').trim();
  if (!id) return { ok: false, msg: '家人信息无效' };
  try {
    const res = await removeOldFamilyBind(id);
    if (!isResourceApiOk(res as ApiResult)) {
      const r = res as ApiResult;
      return { ok: false, msg: r.msg ?? r.message ?? '操作失败，请稍后重试' };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}

/** @deprecated 使用 confirmOldFamilyBindNoticeRemove */
export const confirmOldFamilyUnbindByJs = confirmOldFamilyBindNoticeRemove;
