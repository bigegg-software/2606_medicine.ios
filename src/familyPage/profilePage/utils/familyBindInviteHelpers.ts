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
  updateOldFamilyBindAuth,
} from '@/api/oldFamilyBind';
import { getChildFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';
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
  /** 老人通过 invite 发起（有 childRemarkName）；子女发起则为 false */
  initiatedByElder: boolean;
};

/** 老人邀请家人会写入 childRemarkName，子女申请绑定则写入 remarkName */
export function isElderInitiatedFamilyBind(item: FamilyBindInviteBindVo): boolean {
  return Boolean(item.childRemarkName?.trim());
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
      ? item.jsUserName?.trim() || item.childRemarkName?.trim() || '未命名'
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
