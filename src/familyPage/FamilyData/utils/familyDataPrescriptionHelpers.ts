import moment from 'moment';
import { loadCalendarDayCompleteRateProgressMap } from '@/src/features/schedule/calendarDayCompleteRateHelpers';
import {
  FAMILY_PRESCRIPTION_TYPES,
  type FamilyPrescriptionTypeItem,
} from './familyDataHelpers';

/** 无选中家人 / 加载失败时的空进度列表 */
export function emptyFamilyPrescriptionItems(): FamilyPrescriptionTypeItem[] {
  return FAMILY_PRESCRIPTION_TYPES.map(item => ({ ...item, progress: 0 }));
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
      progress: progressMap[item.key] ?? 0,
    }));
  } catch {
    return emptyFamilyPrescriptionItems();
  }
}
