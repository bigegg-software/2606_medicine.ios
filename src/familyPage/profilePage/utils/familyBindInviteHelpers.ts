import type { FamilyBindItem } from '@/api/familyBind';
import {
  acceptFamilyBindInvite,
  acceptFamilyBindInviteByBind,
  getFamilyBindMyList,
  rejectFamilyBindInvite,
  rejectFamilyBindInviteByBind,
} from '@/api/familyBind';
import type { PatientMessageItem } from '@/api/message';
import { getMessageInfo } from '@/api/message';
import type { OldFamilyBindItem } from '@/api/oldFamilyBind';
import {
  approveOldFamilyBindByBind,
  approveOldFamilyBindByMessage,
  getOldFamilyBindMyList,
  rejectOldFamilyBindByBind,
  rejectOldFamilyBindByMessage,
  removeOldFamilyBind,
  updateOldFamilyBindAuth,
} from '@/api/oldFamilyBind';
import {
  getChildFamilyDisplayName,
  maskFamilyDisplayName,
} from '@/src/familyPage/utils/familyProfileHelpers';
import {
  FAMILY_PERMISSION_OPTIONS,
  type FamilyPermissionKey,
} from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';
import {
  parseFamilyPermissionKeys,
  toFamilyPermissionApiCodes,
} from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';

export const FAMILY_BIND_INVITE_MESSAGE_TYPE = 'family_bind_invite_request';
export const FAMILY_BIND_INVITE_ACCEPTED_MESSAGE_TYPE = 'family_bind_invite_accepted';

export type FamilyBindInviteBindVo = FamilyBindItem | OldFamilyBindItem;

export type FamilyBindInviteView = {
  id: string;
  name: string;
  relationType: string;
  phone: string;
  permissions: FamilyPermissionKey[];
  bindStatus?: number;
  /** 老人通过 invite 发起（仅有 childRemarkName）；子女发起则会写入 remarkName */
  initiatedByElder: boolean;
};

/** 子女申请绑定写入 remarkName；老人邀请写入 childRemarkName。remarkName 优先视为子女发起 */
export function isElderInitiatedFamilyBind(item: FamilyBindInviteBindVo): boolean {
  if (item.remarkName?.trim()) return false;
  return Boolean(item.childRemarkName?.trim());
}

function isDeletedFlag(value?: string | number | null) {
  return String(value ?? '').trim() === '1';
}

/** 邀请链接是否仍有效（撤销/删除/拒绝后失效） */
export function isFamilyBindInviteLinkValid(
  item?: FamilyBindInviteBindVo | null,
): boolean {
  if (!item || item.id == null || String(item.id).trim() === '') return false;
  if (isDeletedFlag(item.delFlag)) return false;
  if (isDeletedFlag(item.delFlagByOld)) return false;
  if (isDeletedFlag(item.delFlagByJs)) return false;
  if (Number(item.bindStatus) === 2) return false;
  return true;
}

export const FAMILY_BIND_INVITE_INVALID_TOAST = '邀请已失效';

/** 已邀请未绑定：仅老人自己发出的邀请可取消 */
export function canCancelElderFamilyInvite(
  view: Pick<FamilyBindInviteView, 'bindStatus' | 'initiatedByElder'> | null | undefined,
) {
  if (!view) return false;
  return view.initiatedByElder && Number(view.bindStatus) === 0;
}

/** 邀请页底部操作：子女申请给老人看「拒绝/接受」；老人自己发出的待确认邀请看「取消邀请」 */
export function resolveFamilyBindInviteActionState(
  view: Pick<FamilyBindInviteView, 'bindStatus' | 'initiatedByElder'> | null | undefined,
  isElder: boolean,
  options?: { fromIncomingMessage?: boolean },
) {
  const showActionButtons = view != null && Number(view.bindStatus) !== 1;
  const initiatedByElder = Boolean(view?.initiatedByElder) && !options?.fromIncomingMessage;
  const showCancelInvite = isElder && initiatedByElder && Number(view?.bindStatus) === 0;
  const showRejectButton = showActionButtons && !showCancelInvite && !(isElder && initiatedByElder);
  const showAcceptButton = showActionButtons && !showCancelInvite;
  return {
    showActionButtons,
    showCancelInvite,
    showRejectButton,
    showAcceptButton,
  };
}

/** 家人接受邀请后：待确认进邀请页，其余进家人详情 */
export function resolveFamilyBindAcceptedTarget(
  bindStatus?: number | null,
): 'invite' | 'detail' {
  return Number(bindStatus) === 0 ? 'invite' : 'detail';
}

const FAMILY_BIND_RESULT_MESSAGE_TYPES = new Set([
  'family_bind_auth_approved',
  'family_bind_auth_rejected',
  FAMILY_BIND_INVITE_ACCEPTED_MESSAGE_TYPE,
]);

export function isFamilyBindInviteMessageType(type?: string | null): boolean {
  const value = String(type ?? '').trim();
  if (!value) return false;
  if (FAMILY_BIND_RESULT_MESSAGE_TYPES.has(value)) return false;
  return value === FAMILY_BIND_INVITE_MESSAGE_TYPE || value.startsWith('family_bind_');
}

export function extractBindVoFromMessageParams(
  params?: Record<string, unknown> | null,
): FamilyBindInviteBindVo | null {
  if (!params || typeof params !== 'object') return null;
  const bindVo = (params as { bindVo?: unknown }).bindVo;
  if (!bindVo || typeof bindVo !== 'object') return null;
  return bindVo as FamilyBindInviteBindVo;
}

export async function loadFamilyBindInviteById(
  id: string,
  options?: { isElder?: boolean },
): Promise<FamilyBindInviteBindVo | null> {
  if (options?.isElder) {
    const res = await getOldFamilyBindMyList();
    const list = apiResourceData(res as unknown as ApiResult<OldFamilyBindItem[]>) ?? [];
    if (!Array.isArray(list)) return null;
    return list.find(item => String(item.id) === String(id)) ?? null;
  }
  const res = await getFamilyBindMyList();
  const list = apiResourceData(res as unknown as ApiResult<FamilyBindItem[]>) ?? [];
  if (!Array.isArray(list)) return null;
  return list.find(item => String(item.id) === String(id)) ?? null;
}

export async function loadFamilyBindInviteByMessageId(
  messageId: string,
): Promise<FamilyBindInviteBindVo | null> {
  const res = await getMessageInfo(messageId);
  const data = apiResourceData(res as unknown as ApiResult<PatientMessageItem>);
  if (!data) return null;
  return extractBindVoFromMessageParams(data.params ?? null);
}

/** 以当前绑定记录为准校验邀请是否仍有效；消息里的 bindVo 只用于取 id */
export async function loadLiveFamilyBindInvite(options: {
  messageId?: string;
  bindId?: string;
  isElder?: boolean;
}): Promise<FamilyBindInviteBindVo | null> {
  let bindId = String(options.bindId ?? '').trim();
  const messageId = String(options.messageId ?? '').trim();
  if (!bindId && messageId) {
    const snapshot = await loadFamilyBindInviteByMessageId(messageId);
    bindId = snapshot?.id != null ? String(snapshot.id).trim() : '';
  }
  if (!bindId) return null;

  const loadByRole = async (isElder: boolean) => {
    const live = await loadFamilyBindInviteById(bindId, { isElder });
    return isFamilyBindInviteLinkValid(live) ? live : null;
  };

  if (options.isElder === true) return loadByRole(true);
  if (options.isElder === false) return loadByRole(false);
  return (await loadByRole(true)) ?? (await loadByRole(false));
}

export function buildFamilyBindInviteView(
  item: FamilyBindInviteBindVo,
  options?: { isElder?: boolean },
): FamilyBindInviteView {
  const isElder = options?.isElder === true;
  const parsedPermissions = parseFamilyPermissionKeys(item.authPermissions);
  const initiatedByElder = isElderInitiatedFamilyBind(item);
  const defaultPermissions = FAMILY_PERMISSION_OPTIONS.map(option => option.key);
  return {
    id: item.id != null ? String(item.id) : '',
    name: isElder
      ? maskFamilyDisplayName(item.jsUserName) ||
        maskFamilyDisplayName(item.childRemarkName) ||
        maskFamilyDisplayName(item.remarkName) ||
        '未命名'
      : getChildFamilyDisplayName(item as FamilyBindItem),
    relationType: String(item.relationType ?? ''),
    phone: isElder
      ? item.jsPhonenumber?.trim() || '--'
      : (item as FamilyBindItem).patientPhonenumber?.trim() || '--',
    permissions:
      parsedPermissions.length > 0
        ? parsedPermissions
        : initiatedByElder
          ? defaultPermissions
          : parsedPermissions,
    bindStatus: item.bindStatus,
    initiatedByElder,
  };
}

export async function respondToFamilyBindInvite(options: {
  isElder: boolean;
  action: 'accept' | 'reject';
  messageId?: string;
  bindId: string;
  authPermissions?: FamilyPermissionKey[];
}): Promise<{ ok: boolean; msg?: string }> {
  const { isElder, action, messageId, bindId, authPermissions } = options;
  const hasMessageId = Boolean(messageId);

  if (isElder) {
    const res =
      action === 'accept'
        ? hasMessageId
          ? await approveOldFamilyBindByMessage(messageId as string)
          : await approveOldFamilyBindByBind(bindId)
        : hasMessageId
          ? await rejectOldFamilyBindByMessage(messageId as string)
          : await rejectOldFamilyBindByBind(bindId);
    if (!isResourceApiOk(res as ApiResult)) {
      const r = res as ApiResult;
      return { ok: false, msg: r.msg ?? r.message };
    }
    if (action === 'accept' && bindId) {
      const authRes = await updateOldFamilyBindAuth({
        id: bindId,
        authPermissions: toFamilyPermissionApiCodes(authPermissions ?? []),
      });
      if (!isResourceApiOk(authRes as ApiResult)) {
        const r = authRes as ApiResult;
        return { ok: false, msg: r.msg ?? r.message };
      }
    }
    return { ok: true };
  }

  const res =
    action === 'accept'
      ? hasMessageId
        ? await acceptFamilyBindInvite(messageId as string)
        : await acceptFamilyBindInviteByBind(bindId)
      : hasMessageId
        ? await rejectFamilyBindInvite(messageId as string)
        : await rejectFamilyBindInviteByBind(bindId);
  if (!isResourceApiOk(res as ApiResult)) {
    const r = res as ApiResult;
    return { ok: false, msg: r.msg ?? r.message };
  }
  return { ok: true };
}

/** 老人取消未绑定的家人邀请 */
export async function cancelElderFamilyBindInvite(
  bindId: string,
): Promise<{ ok: boolean; msg?: string }> {
  const id = String(bindId ?? '').trim();
  if (!id) return { ok: false, msg: '邀请信息无效' };
  try {
    const res = await removeOldFamilyBind(id);
    if (!isResourceApiOk(res as ApiResult)) {
      const r = res as ApiResult;
      return { ok: false, msg: r.msg ?? r.message ?? '取消失败，请稍后重试' };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}
