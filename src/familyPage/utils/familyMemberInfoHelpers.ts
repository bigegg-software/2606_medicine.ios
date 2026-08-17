import type { AllergyItem } from '@/api/allergy';
import { getAllergyInfo } from '@/api/allergy';
import type { EmergencyContact } from '@/api/emergencyContact';
import { getEmergencyContactList } from '@/api/emergencyContact';
import type { FamilyMedicalItem } from '@/api/familyMedical';
import { getFamilyMedicalInfo } from '@/api/familyMedical';
import type { MedicalRecord } from '@/api/medicalRecord';
import { getMedicalRecordFrontList } from '@/api/medicalRecord';
import { loadRelationTypeLabelMap } from '@/src/features/profile/emergencyHelpers';
import { maskFamilyPhone } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';
import type { FamilyMemberInfoRow } from './familyProfileHelpers';

const EMPTY_VALUE = '--';

const FAMILY_MEMBER_INFO_ICONS = {
  emergency: require('@/assets/family/profile/info_emergency.png'),
  allergy: require('@/assets/family/profile/info_allergy.png'),
  'family-history': require('@/assets/family/profile/info_family_history.png'),
  case: require('@/assets/family/profile/info_case.png'),
} as const;

export function emptyFamilyMemberInfoRows(): FamilyMemberInfoRow[] {
  return [
    {
      key: 'emergency',
      title: '紧急联系人：',
      value: EMPTY_VALUE,
      icon: FAMILY_MEMBER_INFO_ICONS.emergency,
    },
    {
      key: 'allergy',
      title: '过敏史：',
      value: EMPTY_VALUE,
      icon: FAMILY_MEMBER_INFO_ICONS.allergy,
    },
    {
      key: 'family-history',
      title: '家族病史：',
      value: EMPTY_VALUE,
      icon: FAMILY_MEMBER_INFO_ICONS['family-history'],
    },
    {
      key: 'case',
      title: '病历记录：',
      value: EMPTY_VALUE,
      icon: FAMILY_MEMBER_INFO_ICONS.case,
    },
  ];
}

function pickDefaultEmergency(list: EmergencyContact[]): EmergencyContact | null {
  if (list.length === 0) return null;
  const preferred = list.find(item => Number(item.isDefault) === 1);
  return preferred ?? list[0] ?? null;
}

function formatEmergencyValue(
  contact: EmergencyContact | null,
  relationMap: Record<string, string>,
): string {
  if (!contact) return EMPTY_VALUE;
  const name = contact.contactName?.trim() || '';
  const phone = maskFamilyPhone(contact.contactPhone);
  const relationRaw = contact.relationType?.trim() || '';
  const relation = relationRaw ? relationMap[relationRaw] || relationRaw : '';
  const namePart = relation ? `${name}（${relation}）` : name;
  const text = `${namePart}${phone && phone !== '--' ? phone : ''}`.trim();
  return text || EMPTY_VALUE;
}

function formatAllergyValue(list: AllergyItem[]): string {
  const names = list
    .map(item => item.allergenName?.trim())
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return EMPTY_VALUE;
  return names.join('、');
}

function formatFamilyHistoryValue(list: FamilyMedicalItem[]): string {
  const parts: string[] = [];
  list.forEach(item => {
    const relation = item.familyRelationships?.trim() || '';
    const conditions = (item.medicalCondition ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (conditions.length === 0) return;
    conditions.forEach(condition => {
      parts.push(relation ? `${condition} (${relation})` : condition);
    });
  });
  if (parts.length === 0) return EMPTY_VALUE;
  return parts.join(' ·');
}

function formatCaseValue(record: MedicalRecord | null): string {
  if (!record) return EMPTY_VALUE;
  const yearMatch = record.recordDate?.match(/^(\d{4})/);
  const yearText = yearMatch?.[1] ? `${yearMatch[1]}年` : '';
  const typeText = record.medicalRecordType?.trim() || '';
  const diagnosis = record.diagnosticResult?.trim() || '';
  const head = [yearText, typeText].filter(Boolean).join('');
  if (head && diagnosis) return `${head} (${diagnosis})`;
  if (head) return head;
  if (diagnosis) return diagnosis;
  return record.hospital?.trim() || EMPTY_VALUE;
}

/** 拉取指定家人资料卡健康信息摘要（X-Patient-User-Id） */
export async function loadFamilyMemberInfoRows(
  patientUserId: string,
): Promise<FamilyMemberInfoRow[]> {
  const id = String(patientUserId).trim();
  const empty = emptyFamilyMemberInfoRows();
  if (!id) return empty;

  const [emergencyRes, allergyRes, familyMedicalRes, caseRes, relationMap] =
    await Promise.all([
      getEmergencyContactList({ pageNum: 1, pageSize: 10 }, { patientUserId: id }).catch(
        () => null,
      ),
      getAllergyInfo({ patientUserId: id }).catch(() => null),
      getFamilyMedicalInfo({ patientUserId: id }).catch(() => null),
      getMedicalRecordFrontList({ pageNum: 1, pageSize: 1 }, { patientUserId: id }).catch(
        () => null,
      ),
      loadRelationTypeLabelMap().catch(() => ({}) as Record<string, string>),
    ]);

  const emergencyList = emergencyRes
    ? getResourceRows(emergencyRes as { code?: number; rows?: EmergencyContact[] })
    : [];
  const allergyData = allergyRes
    ? apiResourceData<{ allergyList?: AllergyItem[] }>(
        allergyRes as { code?: number; data?: { allergyList?: AllergyItem[] } },
      )
    : undefined;
  const allergyList = Array.isArray(allergyData?.allergyList) ? allergyData!.allergyList! : [];
  const familyMedicalData = familyMedicalRes
    ? apiResourceData<{ familyMedicalList?: FamilyMedicalItem[] }>(
        familyMedicalRes as {
          code?: number;
          data?: { familyMedicalList?: FamilyMedicalItem[] };
        },
      )
    : undefined;
  const familyMedicalList = Array.isArray(familyMedicalData?.familyMedicalList)
    ? familyMedicalData!.familyMedicalList!
    : [];
  const caseList = caseRes
    ? getResourceRows(caseRes as { code?: number; rows?: MedicalRecord[] })
    : [];

  return [
    {
      key: 'emergency',
      title: '紧急联系人：',
      value: formatEmergencyValue(pickDefaultEmergency(emergencyList), relationMap),
      icon: FAMILY_MEMBER_INFO_ICONS.emergency,
    },
    {
      key: 'allergy',
      title: '过敏史：',
      value: formatAllergyValue(allergyList),
      icon: FAMILY_MEMBER_INFO_ICONS.allergy,
    },
    {
      key: 'family-history',
      title: '家族病史：',
      value: formatFamilyHistoryValue(familyMedicalList),
      icon: FAMILY_MEMBER_INFO_ICONS['family-history'],
    },
    {
      key: 'case',
      title: '病历记录：',
      value: formatCaseValue(caseList[0] ?? null),
      icon: FAMILY_MEMBER_INFO_ICONS.case,
    },
  ];
}
