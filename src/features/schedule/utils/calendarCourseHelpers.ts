import moment from 'moment';
import type { CourseSessionBookingItem, CourseSessionType } from '@/api/courseSession';
import { getMyBookingPage } from '@/api/courseSession';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { bookingStatusLabel } from '@/src/features/curriculum/utils/myBookingHelpers';
import type { CalendarTimelineItem } from '../calendarHelpers';

/** 统一解析上课时间，保证同一时刻 time 文案一致以便时间轴合并对齐 */
function parseCourseStartMoment(value?: string) {
  const raw = value?.trim() || '';
  if (!raw) return null;
  const parsed = moment(raw, ['HH:mm:ss', 'HH:mm', 'H:mm:ss', 'H:mm'], true);
  return parsed.isValid() ? parsed : null;
}

function parseHmSortValue(value?: string) {
  const parsed = parseCourseStartMoment(value);
  if (!parsed) return 0;
  return parsed.hours() * 60 + parsed.minutes();
}

function formatHmTimeline(value?: string) {
  const parsed = parseCourseStartMoment(value);
  return parsed ? parsed.format('H:mm') : '—';
}

function formatHm(time?: string) {
  const parsed = parseCourseStartMoment(time);
  return parsed ? parsed.format('HH:mm') : '';
}

function resolveCourseType(item: CourseSessionBookingItem): CourseSessionType | string {
  return (
    item.courseType?.trim() ||
    item.session?.courseType?.trim() ||
    item.session?.template?.courseType?.trim() ||
    ''
  );
}

function courseTypeLabel(courseType?: string) {
  if (courseType === 'group') return '集体课';
  if (courseType === 'online') return '线上课';
  return '私教课';
}

function resolveSessionStatus(item: CourseSessionBookingItem) {
  const sessionStatus = item.session?.status;
  if (sessionStatus != null && String(sessionStatus).trim() !== '') {
    return Number(sessionStatus);
  }
  return undefined;
}

function resolveCourseName(item: CourseSessionBookingItem) {
  const name = item.session?.template?.courseName?.trim() || '';
  const courseType = resolveCourseType(item);
  if (courseType === 'private' && (!name || name === '课程')) {
    return '一对一私教训练';
  }
  return name || courseTypeLabel(String(courseType));
}

/** 将预约映射为日历时间轴课程项 */
export function mapCourseBookingTimelineItem(
  item: CourseSessionBookingItem,
  index: number,
): CalendarTimelineItem | null {
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() : '';
  const sessionId =
    item.sessionId != null && String(item.sessionId).trim()
      ? String(item.sessionId).trim()
      : item.session?.sessionId != null
        ? String(item.session.sessionId).trim()
        : '';
  if (!bookingId && !sessionId) return null;

  // 已取消不展示
  if (Number(item.status) === 2) return null;

  const startTime = formatHm(item.startTime) || formatHm(item.session?.startTime);
  const endTime = formatHm(item.endTime) || formatHm(item.session?.endTime);
  const sortValue = parseHmSortValue(startTime) || index + 300;
  const courseType = String(resolveCourseType(item) || 'private');
  const coachName =
    item.coachRealName?.trim() || item.session?.coachRealName?.trim() || '';
  const stationName =
    item.session?.stationName?.trim() ||
    item.session?.template?.stationName?.trim() ||
    '';
  const timeRange =
    startTime && endTime ? `${startTime}-${endTime}` : startTime || endTime || '';
  const descParts =
    courseType === 'online'
      ? [coachName, item.session?.livePlatformLabel?.trim() || '线上课'].filter(Boolean)
      : [coachName, stationName || timeRange].filter(Boolean);

  return {
    key: `course-${bookingId || sessionId}`,
    time: formatHmTimeline(startTime),
    title: resolveCourseName(item),
    desc: descParts.join(' · '),
    kind: 'course',
    sessionId: sessionId || undefined,
    bookingId: bookingId || undefined,
    courseType,
    courseStatusLabel: bookingStatusLabel(item.status, {
      sessionStatus: resolveSessionStatus(item),
    }),
    courseCoachName: coachName || undefined,
    courseStationName: stationName || undefined,
    bookingStatus: item.status != null ? Number(item.status) : undefined,
    sortValue,
    period: sortValue < 12 * 60 ? 'morning' : 'afternoon',
  };
}

/** 按上课日期拉取当日课程预约（未取消） */
export async function loadCourseTimelineItems(
  sessionDate: string,
): Promise<CalendarTimelineItem[]> {
  const date = sessionDate?.trim() || '';
  if (!date) return [];
  try {
    const res = await getMyBookingPage({
      sessionDate: date,
      // 已预约 / 已核销 / 缺席（排除已取消）
      status: '1,3,4',
      sessionDateOrder: 'asc',
      startTimeOrder: 'asc',
      pageNum: 1,
      pageSize: 50,
    });
    if (!isResourceApiOk(res as { code?: number })) return [];
    return getResourceRows<CourseSessionBookingItem>(res)
      .map(mapCourseBookingTimelineItem)
      .filter((row): row is CalendarTimelineItem => row != null)
      .sort((left, right) => left.sortValue - right.sortValue);
  } catch {
    return [];
  }
}
