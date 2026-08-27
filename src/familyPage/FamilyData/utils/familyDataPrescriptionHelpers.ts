import moment from 'moment';
import { getInUseExPatientRuleInfo } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { InUseExPatientRule } from '@/api/schedule';
import { loadCalendarDayCompleteRateProgressMap } from '@/src/features/schedule/calendarDayCompleteRateHelpers';
import {
  buildExercisePrescriptionMetrics,
  enrichHealthGoalTargets,
  loadScheduleDictMaps,
} from '@/src/features/schedule/scheduleHelpers';
import {
  loadHomePrescriptionGoalDisplay,
  type HomePrescriptionGoalDisplay,
} from '@/src/features/home/homePrescriptionGoalHelpers';
import {
  FAMILY_PRESCRIPTION_TYPES,
  type FamilyPrescriptionTypeItem,
} from './familyDataHelpers';

export type FamilyPrescriptionSection = {
  items: FamilyPrescriptionTypeItem[];
  goal: HomePrescriptionGoalDisplay | null;
};

/** 无选中家人 / 加载失败时的空进度列表 */
export function emptyFamilyPrescriptionItems(): FamilyPrescriptionTypeItem[] {
  return FAMILY_PRESCRIPTION_TYPES.map(item => ({ ...item, progress: null }));
}

export function emptyFamilyPrescriptionSection(): FamilyPrescriptionSection {
  return { items: emptyFamilyPrescriptionItems(), goal: null };
}

/** 拉取家人在用运动处方（对齐首页：补充健康目标详情） */
export async function loadFamilyInUsePrescription(
  patientUserId: string,
): Promise<InUseExPatientRule | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;
  try {
    const res = await getInUseExPatientRuleInfo({ patientUserId: id });
    if (!isResourceApiOk(res as { code?: number })) return null;
    let current =
      apiResourceData<InUseExPatientRule>(
        res as { code?: number; data?: InUseExPatientRule },
      ) ?? null;
    if (!current) return null;

    if (current.healthGoalTargetList?.length) {
      const enrichedTargets = await enrichHealthGoalTargets(current.healthGoalTargetList);
      current = { ...current, healthGoalTargetList: enrichedTargets };
    }
    return current;
  } catch {
    return null;
  }
}

/**
 * 家人运动处方区块：进度 + 底部目标
 * 逻辑对齐首页 HomeTab.loadExercisePrescription
 */
export async function loadFamilyPrescriptionSection(
  patientUserId: string,
): Promise<FamilyPrescriptionSection> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyPrescriptionSection();

  try {
    const [dictMaps, prescription] = await Promise.all([
      loadScheduleDictMaps().catch(() => null),
      loadFamilyInUsePrescription(id),
    ]);

    if (!prescription) {
      return emptyFamilyPrescriptionSection();
    }

    const progressMap = await loadCalendarDayCompleteRateProgressMap(
      moment().format('YYYY-MM-DD'),
      { patientUserId: id },
    );

    const metrics = buildExercisePrescriptionMetrics(
      prescription.ruleRatioList,
      dictMaps ?? undefined,
      progressMap,
      { availableTypeKeys: new Set(Object.keys(progressMap)) },
    );

    const colorByKey = Object.fromEntries(
      FAMILY_PRESCRIPTION_TYPES.map(item => [item.key, item.progressColor]),
    );
    const iconByKey = Object.fromEntries(
      FAMILY_PRESCRIPTION_TYPES.map(item => [item.key, item.icon]),
    );

    const items: FamilyPrescriptionTypeItem[] = metrics.map(item => ({
      key: item.key,
      title: item.label,
      progress: item.value,
      progressColor: colorByKey[item.key] ?? item.color,
      icon: iconByKey[item.key] ?? FAMILY_PRESCRIPTION_TYPES[0]!.icon,
    }));

    const goal = await loadHomePrescriptionGoalDisplay(prescription, id, {
      patientUserId: id,
    });

    return { items, goal };
  } catch {
    return emptyFamilyPrescriptionSection();
  }
}
