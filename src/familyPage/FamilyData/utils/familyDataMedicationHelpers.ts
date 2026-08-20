import moment from 'moment';
import { getIndexMedicationPlanGroupByTime, type IndexMedicationPlanGroupItem } from '@/api/medicationPlan';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  loadMedicationDictMaps,
  mapIndexPlanGroups,
  type MedicationPlanItemView,
} from '@/src/features/profile/medication/medicationHelpers';
import type { FamilyMedicationItem } from './familyDataHelpers';

const MED_ICON = require('@/assets/family/data/med.png');

export function emptyFamilyMedicationItems(): FamilyMedicationItem[] {
  return [];
}

type FamilyMedicationCandidate = MedicationPlanItemView & {
  /** 今日计划服用时间（分钟数） */
  sortMinutes: number;
  /** 是否为已逾期且未服的计划 */
  overdueUntaken: boolean;
};

function getTimeMinutes(time: string) {
  const parsed = moment(time, ['HH:mm', 'H:mm'], true);
  return parsed.isValid() ? parsed.hours() * 60 + parsed.minutes() : Number.POSITIVE_INFINITY;
}

function toFamilyMedicationCandidate(
  item: MedicationPlanItemView,
  nowMinutes: number,
): FamilyMedicationCandidate | null {
  const sortMinutes = getTimeMinutes(item.medicationPlanTime);
  const overdueUntaken =
    !item.taken && (item.action === 0 || sortMinutes < nowMinutes);
  const upcoming = Number.isFinite(sortMinutes) && sortMinutes >= nowMinutes;
  if (!overdueUntaken && !upcoming) return null;

  return {
    ...item,
    sortMinutes,
    overdueUntaken,
  };
}

function toFamilyMedicationItem(
  item: FamilyMedicationCandidate,
): FamilyMedicationItem {
  const doseParts = item.doseText.split('，');
  const dose = doseParts[0]?.trim() || '--';
  const frequency = doseParts.find(part => part.trim().startsWith('每日'))?.trim() || '每日--次';
  const meal = item.eventBasedLabel.trim();
  return {
    key: item.key,
    medicationPlanId: item.medicationPlanId,
    title: item.name,
    time: item.medicationPlanTime,
    meal: meal && meal !== '无' ? meal : '',
    dose,
    frequency,
    missed: item.overdueUntaken,
    action: item.taken ? 'taken' : 'remind',
    icon: MED_ICON,
  };
}

/** 拉取指定家人今日用药记录（X-Patient-User-Id） */
export async function loadFamilyMedicationItems(
  patientUserId: string,
): Promise<FamilyMedicationItem[]> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyMedicationItems();

  try {
    const maps = await loadMedicationDictMaps();
    const res = await getIndexMedicationPlanGroupByTime(
      { customerLocalDate: moment().format('YYYY-MM-DD') },
      { patientUserId: id },
    );
    if (!isResourceApiOk(res as { code?: number })) return emptyFamilyMedicationItems();

    const groups = mapIndexPlanGroups(
      apiResourceData<IndexMedicationPlanGroupItem[]>(res as { data?: IndexMedicationPlanGroupItem[] }),
      maps,
    );

    const now = moment();
    const nowMinutes = now.hours() * 60 + now.minutes();
    const candidates = groups
      .flatMap(group => group.items)
      .map(item => toFamilyMedicationCandidate(item, nowMinutes))
      .filter((item): item is FamilyMedicationCandidate => item != null);
    const overdue = candidates
      .filter(item => item.overdueUntaken)
      .sort((a, b) => a.sortMinutes - b.sortMinutes);
    const upcoming = candidates
      .filter(item => !item.overdueUntaken)
      .sort((a, b) => a.sortMinutes - b.sortMinutes)
      .slice(0, 3);

    return [...overdue, ...upcoming]
      .slice(0, 3)
      .map(toFamilyMedicationItem);
  } catch {
    return emptyFamilyMedicationItems();
  }
}
