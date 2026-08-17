import { getExPatientRuleDayCompleteRate, type ExPatientRuleDayCompleteRate } from '@/api/exPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { normalizeProgress } from './scheduleHelpers';

const DAY_COMPLETE_RATE_TYPE_FIELDS = [
  ['cardio', 'cardioCompleteRate'],
  ['strength', 'strengthCompleteRate'],
  ['flexibility', 'flexibilityCompleteRate'],
  ['balance', 'balanceCompleteRate'],
] as const;

/** 当日有安排的模块才写入；null / 非数字表示当日无该模块 */
export function toDayCompleteRateProgressMap(
  data?: ExPatientRuleDayCompleteRate | null,
): Record<string, number> {
  if (!data) return {};
  const map: Record<string, number> = {};
  for (const [typeKey, field] of DAY_COMPLETE_RATE_TYPE_FIELDS) {
    const raw = data[field];
    if (raw == null) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    map[typeKey] = normalizeProgress(value);
  }
  return map;
}

/** 查询指定日期四模块完成率；无运动安排时返回空 map */
export async function loadCalendarDayCompleteRateProgressMap(
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<Record<string, number>> {
  const date = customerLocalDate?.trim();
  if (!date) return {};

  try {
    const res = await getExPatientRuleDayCompleteRate(date, options);
    if (!isResourceApiOk(res as { code?: number })) return {};
    return toDayCompleteRateProgressMap(
      apiResourceData<ExPatientRuleDayCompleteRate>(
        res as { data?: ExPatientRuleDayCompleteRate },
      ),
    );
  } catch {
    return {};
  }
}
