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

function aggregatePlanItems(items: MedicationPlanItemView[]): FamilyMedicationItem | null {
  if (!items.length) return null;
  const first = items[0];
  const allTaken = items.every(item => item.taken);
  const missed = items.some(item => item.action === 0);
  return {
    key: first.medicationPlanId,
    title: first.name,
    missed,
    action: allTaken ? 'taken' : 'remind',
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

    const byPlan = new Map<string, MedicationPlanItemView[]>();
    groups.forEach(group => {
      group.items.forEach(item => {
        const list = byPlan.get(item.medicationPlanId) ?? [];
        list.push(item);
        byPlan.set(item.medicationPlanId, list);
      });
    });

    return [...byPlan.values()]
      .map(aggregatePlanItems)
      .filter((item): item is FamilyMedicationItem => item != null);
  } catch {
    return emptyFamilyMedicationItems();
  }
}
