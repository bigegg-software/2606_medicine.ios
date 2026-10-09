import moment from 'moment';
import type { CourseSessionType } from '@/api/courseSession';
import { getCourseSessionDateHasList } from '@/api/courseSession';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

/** 解析周条日期范围（周一～周日） */
export function resolveWeekDateRange(anchorDate: string) {
  const start = moment(anchorDate, 'YYYY-MM-DD').startOf('isoWeek');
  const end = start.clone().endOf('isoWeek');
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}

/** 拉取有场次的日期集合（yyyy-MM-dd） */
export async function fetchCourseSessionDateHasSet(options: {
  courseType: CourseSessionType;
  startDate: string;
  endDate: string;
  stationId?: string;
  coachUserId?: string;
}): Promise<Set<string>> {
  const startDate = options.startDate?.trim() || '';
  const endDate = options.endDate?.trim() || '';
  const courseType = options.courseType?.trim() || '';
  if (!startDate || !endDate || !courseType) return new Set();

  try {
    const stationId = options.stationId != null ? String(options.stationId).trim() : '';
    const coachUserId =
      options.coachUserId != null ? String(options.coachUserId).trim() : '';
    const res = await getCourseSessionDateHasList({
      startDate,
      endDate,
      courseType,
      ...(stationId ? { stationId } : {}),
      ...(coachUserId ? { coachUserId } : {}),
    });
    if (!isResourceApiOk(res)) return new Set();
    const rows = apiResourceData(res);
    const set = new Set<string>();
    if (!Array.isArray(rows)) return set;
    for (const item of rows) {
      const date = item?.date?.trim() || '';
      if (date && item.hasCourseSession) {
        set.add(date);
      }
    }
    return set;
  } catch {
    return new Set();
  }
}

/** 按年拉取有场次日期 map（供日历 dayRecordMarker） */
export async function fetchCourseSessionDateHasMapByYear(options: {
  year: number;
  courseType: CourseSessionType;
  stationId?: string;
}): Promise<Record<string, boolean> | null> {
  const year = Math.round(Number(options.year));
  if (!Number.isFinite(year) || year < 1970) return null;
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const set = await fetchCourseSessionDateHasSet({
    courseType: options.courseType,
    startDate,
    endDate,
    stationId: options.stationId,
  });
  const map: Record<string, boolean> = {};
  set.forEach(date => {
    map[date] = true;
  });
  return map;
}
