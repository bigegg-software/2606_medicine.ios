import moment from 'moment';
import { getInUseExPatientRuleInfo } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { InUseExPatientRule } from '@/api/schedule';
import { loadCalendarDayCompleteRateProgressMap } from '@/src/features/schedule/calendarDayCompleteRateHelpers';
import {
  loadHomePrescriptionGoalDisplay,
  type HomePrescriptionGoalDisplay,
} from '@/src/features/home/homePrescriptionGoalHelpers';
import {
  FAMILY_PRESCRIPTION_TYPES,
  type FamilyPrescriptionTypeItem,
} from './familyDataHelpers';

/** 无选中家人 / 加载失败时的空进度列表 */
export function emptyFamilyPrescriptionItems(): FamilyPrescriptionTypeItem[] {
  return FAMILY_PRESCRIPTION_TYPES.map(item => ({ ...item, progress: null }));
}

/** 拉取指定家人今日四模块运动处方进度（X-Patient-User-Id） */
export async function loadFamilyPrescriptionItems(
  patientUserId: string,
): Promise<FamilyPrescriptionTypeItem[]> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyPrescriptionItems();

  try {
    const progressMap = await loadCalendarDayCompleteRateProgressMap(
      moment().format('YYYY-MM-DD'),
      { patientUserId: id },
    );
    return FAMILY_PRESCRIPTION_TYPES.map(item => ({
      ...item,
      // 接口未返回该模块代表当天没有安排；与已安排但完成率为 0 区分开。
      progress: progressMap[item.key] ?? null,
    }));
  } catch {
    return emptyFamilyPrescriptionItems();
  }
}

/** 拉取家人在用运动处方（用于底部目标条） */
export async function loadFamilyInUsePrescription(
  patientUserId: string,
): Promise<InUseExPatientRule | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;
  try {
    const res = await getInUseExPatientRuleInfo({ patientUserId: id });
    if (!isResourceApiOk(res as { code?: number })) return null;
    return apiResourceData<InUseExPatientRule>(
      res as { code?: number; data?: InUseExPatientRule },
    ) ?? null;
  } catch {
    return null;
  }
}

/** 家人运动处方底部目标文案（对齐首页） */
export async function loadFamilyPrescriptionGoalDisplay(
  patientUserId: string,
): Promise<HomePrescriptionGoalDisplay | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;
  const prescription = await loadFamilyInUsePrescription(id);
  if (!prescription) return null;
  return loadHomePrescriptionGoalDisplay(prescription, id, { patientUserId: id });
}
