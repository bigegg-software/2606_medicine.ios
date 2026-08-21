import moment from 'moment';
import {
  getInUseDietPatientRuleInfo,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { isDietRuleActiveOnDate } from '@/src/features/nutrition/components/utils/dietMealHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { resolveTodayExerciseMetricTypeKeys } from '../scheduleHelpers';

/** 日程月历：拉取在用营养处方（含家人 patientUserId） */
export async function loadCalendarInUseDietRule(
  options?: { patientUserId?: string | number | null },
): Promise<DietPatientRuleInfo | null> {
  try {
    const res = await getInUseDietPatientRuleInfo(options);
    if (!isResourceApiOk(res as { code?: number })) return null;
    return apiResourceData<DietPatientRuleInfo>(
      res as { code?: number; data?: DietPatientRuleInfo },
    ) ?? null;
  } catch {
    return null;
  }
}

function isDateInRuleRange(
  customerLocalDate: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  const day = moment(customerLocalDate, 'YYYY-MM-DD', true);
  if (!day.isValid()) return false;

  const start = startDate?.trim();
  if (start) {
    const startDay = moment(start, ['YYYY-MM-DD', 'YYYY/MM/DD', moment.ISO_8601], true);
    if (startDay.isValid() && day.isBefore(startDay, 'day')) return false;
  }

  const end = endDate?.trim();
  if (end) {
    const endDay = moment(end, ['YYYY-MM-DD', 'YYYY/MM/DD', moment.ISO_8601], true);
    if (endDay.isValid() && day.isAfter(endDay, 'day')) return false;
  }

  return true;
}

/** 选中日期是否在运动处方起止范围内 */
export function isExPatientRuleActiveOnDate(
  rule: Pick<InUseExPatientRule, 'startDate' | 'endDate'> | null | undefined,
  customerLocalDate: string,
) {
  if (!rule) return false;
  return isDateInRuleRange(customerLocalDate, rule.startDate, rule.endDate);
}

/**
 * 今天及之后：按营养处方起止打「用餐」点；
 * 过去日期不覆盖 listByDateRange 的 isDiet。
 */
export function shouldForceScheduleDietDot(
  dateKey: string,
  dietRule: DietPatientRuleInfo | null | undefined,
  todayKey = moment().format('YYYY-MM-DD'),
): boolean {
  if (!dietRule) return false;
  if (dateKey < todayKey) return false;
  return isDietRuleActiveOnDate(dietRule, dateKey);
}

/**
 * 今天及之后：按运动处方起止打「运动」点；
 * 过去日期不覆盖 listByDateRange 的 isEx。
 */
export function shouldForceScheduleExDot(
  dateKey: string,
  prescription: InUseExPatientRule | null | undefined,
  todayKey = moment().format('YYYY-MM-DD'),
): boolean {
  if (!prescription?.exPatientRuleId && !prescription?.ruleRatioList?.length) return false;
  if (dateKey < todayKey) return false;
  return isExPatientRuleActiveOnDate(prescription, dateKey);
}

/**
 * 今天/未来某日无完成率数据时：按周训练安排生成进度 map（未练为 0），
 * 休息日为空。
 */
export function buildUpcomingExerciseProgressMapFallback(
  prescription: InUseExPatientRule | null | undefined,
  dateKey: string,
): Record<string, number> {
  const keys = resolveTodayExerciseMetricTypeKeys(prescription, dateKey);
  const map: Record<string, number> = {};
  keys.forEach(typeKey => {
    map[typeKey] = 0;
  });
  return map;
}
