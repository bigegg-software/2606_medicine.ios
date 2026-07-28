import type { FamilyBindItem } from '@/api/familyBind';
import { getFamilyBindMyList } from '@/api/familyBind';
import type { PatientMessageItem } from '@/api/message';
import { getMessageInfo } from '@/api/message';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import { parseFamilyPermissionKeys } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';
import type { FamilyPermissionKey } from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';
import { getChildFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';

export const FAMILY_BIND_INVITE_MESSAGE_TYPE = 'family_bind_invite_request';

export type FamilyBindInviteView = {
  id: string;
  name: string;
  relationType: string;
  phone: string;
  permissions: FamilyPermissionKey[];
  bindStatus?: number;
};

export function isFamilyBindInviteMessageType(type?: string | null): boolean {
  return String(type ?? '').trim() === FAMILY_BIND_INVITE_MESSAGE_TYPE;
}

export function extractBindVoFromMessageParams(
  params?: Record<string, unknown> | null,
): FamilyBindItem | null {
  if (!params || typeof params !== 'object') return null;
  const bindVo = (params as { bindVo?: unknown }).bindVo;
  if (!bindVo || typeof bindVo !== 'object') return null;
  return bindVo as FamilyBindItem;
}

export async function loadFamilyBindInviteById(id: string): Promise<FamilyBindItem | null> {
  const res = await getFamilyBindMyList();
  const list = apiResourceData(res as unknown as ApiResult<FamilyBindItem[]>) ?? [];
  if (!Array.isArray(list)) return null;
  return list.find(item => String(item.id) === String(id)) ?? null;
}

export async function loadFamilyBindInviteByMessageId(
  messageId: string,
): Promise<FamilyBindItem | null> {
  const res = await getMessageInfo(messageId);
  const data = apiResourceData(res as unknown as ApiResult<PatientMessageItem>);
  if (!data) return null;
  return extractBindVoFromMessageParams(data.params ?? null);
}

export function buildFamilyBindInviteView(item: FamilyBindItem): FamilyBindInviteView {
  return {
    id: item.id != null ? String(item.id) : '',
    name: getChildFamilyDisplayName(item),
    relationType: String(item.relationType ?? ''),
    phone: item.patientPhonenumber?.trim() || '--',
    permissions: parseFamilyPermissionKeys(item.authPermissions),
    bindStatus: item.bindStatus,
  };
}
