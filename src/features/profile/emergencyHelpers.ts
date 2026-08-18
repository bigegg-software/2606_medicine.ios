import { buildDictLabelMap, getDictDataByType, DICT_TYPES, type DictDataItem } from '@/api/dict';
import {
  getEmergencyContactList,
  type EmergencyContact,
  type EmergencyContactListParams,
} from '@/api/emergencyContact';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';

export const RELATION_TYPE_OPTIONS: DictDataItem[] = [
  { dictLabel: '儿子', dictValue: '儿子' },
  { dictLabel: '女儿', dictValue: '女儿' },
  { dictLabel: '配偶', dictValue: '配偶' },
  { dictLabel: '兄弟', dictValue: '兄弟' },
  { dictLabel: '姐妹', dictValue: '姐妹' },
  { dictLabel: '朋友', dictValue: '朋友' },
  { dictLabel: '邻居', dictValue: '邻居' },
  { dictLabel: '其他', dictValue: '其他' },
];

export async function loadRelationTypeOptions(): Promise<DictDataItem[]> {
  try {
    const res = await getDictDataByType(DICT_TYPES.relationType);
    const items = apiResourceData<DictDataItem[]>(
      res as unknown as { code?: number; data?: DictDataItem[] },
    );
    if (Array.isArray(items) && items.length > 0) {
      return [...items].sort((a, b) => (a.dictSort ?? 0) - (b.dictSort ?? 0));
    }
  } catch {
    // fall through to static options
  }
  return RELATION_TYPE_OPTIONS;
}

export async function loadRelationTypeLabelMap(): Promise<Record<string, string>> {
  const options = await loadRelationTypeOptions();
  return buildDictLabelMap(options);
}

export async function loadEmergencyContacts(
  params?: EmergencyContactListParams,
  options?: { patientUserId?: string | number | null },
): Promise<EmergencyContact[]> {
  try {
    const res = await getEmergencyContactList(params, options);
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
