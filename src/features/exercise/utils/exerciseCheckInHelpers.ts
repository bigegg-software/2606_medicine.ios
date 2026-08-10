import moment from 'moment';
import {
  getExRecordVideoIsExerciseByDateRange,
  type ExRecordVideoIsExerciseByDateItem,
} from '@/api/exRecord';
import { AppTheme } from '@/common/theme';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

/** dateKey(yyyy-MM-dd) → 当日是否运动过 */
export type ExerciseCheckInMap = Record<string, boolean>;

export const EXERCISE_CHECK_IN_DOT_COLOR = AppTheme.primaryColor;

function applyExerciseExists(
  map: ExerciseCheckInMap,
  items: ExRecordVideoIsExerciseByDateItem[] | undefined,
) {
  (items ?? []).forEach(item => {
    const date = item.customerLocalDate?.trim();
    if (!date) return;
    map[date] = Boolean(item.exists);
  });
}

/** 按年计算请求区间：当年/往年 → 1.1–12.31；未来年不请求 */
export function getExerciseCheckInYearRange(year: number, today = moment()) {
  if (!Number.isFinite(year)) return null;
  if (year > today.year()) return null;
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

export async function loadExerciseCheckInMapByDateRange(
  startDate: string,
  endDate: string,
): Promise<ExerciseCheckInMap> {
  const map: ExerciseCheckInMap = {};
  try {
    const res = await getExRecordVideoIsExerciseByDateRange({ startDate, endDate });
    if (isResourceApiOk(res as unknown as { code?: number })) {
      applyExerciseExists(
        map,
        apiResourceData<ExRecordVideoIsExerciseByDateItem[]>(
          res as unknown as { code?: number; data?: ExRecordVideoIsExerciseByDateItem[] },
        ),
      );
    }
  } catch {
    /* ignore */
  }
  return map;
}

/** 按年懒加载运动打卡标记（未来年直接跳过） */
export async function loadExerciseCheckInMapByYear(
  year: number,
): Promise<ExerciseCheckInMap | null> {
  const range = getExerciseCheckInYearRange(year);
  if (!range) return null;
  return loadExerciseCheckInMapByDateRange(range.startDate, range.endDate);
}
