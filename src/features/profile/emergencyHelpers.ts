import { getDictDataByType, DICT_TYPES, type DictDataItem } from '@/api/dict';
import {
  getEmergencyContactList,
  type EmergencyContact,
  type EmergencyContactListParams,
} from '@/api/emergencyContact';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

export async function loadRelationTypeOptions(): Promise<DictDataItem[]> {
  try {
    const res = await getDictDataByType(DICT_TYPES.relationType);
    const items = isResourceApiOk(res as { code?: number })
      ? apiResourceData<DictDataItem[]>(res as { code?: number; data?: DictDataItem[] })
      : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function loadEmergencyContacts(params?: EmergencyContactListParams): Promise<EmergencyContact[]> {
  try {
    const res = await getEmergencyContactList(params);
    return getResourceRows(res as { code?: number; rows?: EmergencyContact[] });
  } catch {
    return [];
  }
}

export function formatEmergencyContactName(
  contact: EmergencyContact,
  relationMap?: Record<string, string>,
): string {
  const name = contact.contactName?.trim() || '—';
  const relation = contact.relationType
    ? relationMap?.[contact.relationType] ?? contact.relationType
    : '';
  return relation ? `${name}（${relation}）` : name;
}
