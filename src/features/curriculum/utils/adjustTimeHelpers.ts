import moment from 'moment';
import type { CourseSessionItem, CourseSessionType } from '@/api/courseSession';
import { getCourseSessionPage } from '@/api/courseSession';
import { getResourceRows } from '@/src/utils/apiHelpers';

const WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export type AdjustDateItem = {
  /** yyyy-MM-dd */
  key: string;
  /** 上：今天 / 五 */
  weekdayLabel: string;
  /** 下：25 */
  dayLabel: string;
  isToday: boolean;
};

const DEFAULT_DAY_COUNT = 14;
/** 滑到末尾时每次追加天数 */
export const ADJUST_DATE_APPEND_COUNT = 14;

/** 日期条单元格宽度 / 间距（与 css/curriculum/adjustTime 一致） */
export const ADJUST_DATE_CELL_WIDTH = 58;
export const ADJUST_DATE_CELL_GAP = 9;

/** 日期条滚到指定下标，使该项尽量落在可视区左侧附近 */
export function resolveAdjustDateStripScrollX(index: number) {
  if (index <= 0) return 0;
  return index * (ADJUST_DATE_CELL_WIDTH + ADJUST_DATE_CELL_GAP);
}

/** 右侧「全部」按钮占用宽度（与 dateScrollContent.paddingRight 一致） */
export const ADJUST_DATE_STRIP_RIGHT_OVERLAY = 56;

/** 指定下标日期是否已在横向可视区内（不含右侧遮挡） */
export function isAdjustDateStripItemVisible(options: {
  index: number;
  scrollX: number;
  viewportWidth: number;
  rightOverlay?: number;
}) {
  const {
    index,
    scrollX,
    viewportWidth,
    rightOverlay = ADJUST_DATE_STRIP_RIGHT_OVERLAY,
  } = options;
  if (index < 0 || viewportWidth <= 0) return false;
  const itemLeft = resolveAdjustDateStripScrollX(index);
  const itemRight = itemLeft + ADJUST_DATE_CELL_WIDTH;
  const visibleLeft = Math.max(0, scrollX);
  const visibleRight = scrollX + Math.max(0, viewportWidth - rightOverlay);
  return itemLeft >= visibleLeft - 1 && itemRight <= visibleRight + 1;
}

function buildOneAdjustDateItem(m: moment.Moment, today: moment.Moment): AdjustDateItem {
  const isToday = m.isSame(today, 'day');
  return {
    key: m.format('YYYY-MM-DD'),
    weekdayLabel: isToday ? '今天' : WEEKDAY_SHORT[m.day()] || '',
    dayLabel: String(m.date()),
    isToday,
  };
}

/** 仅保留今天及以后的有场次日期 */
export function filterDateHasSetFromToday(set: Set<string>): Set<string> {
  const today = moment().startOf('day');
  const next = new Set<string>();
  set.forEach(date => {
    const m = moment(date, 'YYYY-MM-DD');
    if (m.isValid() && !m.isBefore(today, 'day')) {
      next.add(date);
    }
  });
  return next;
}

/** 从今日起连续若干天，用于调整时间横向日期条 */
export function buildAdjustDateItems(
  dayCount = DEFAULT_DAY_COUNT,
  fromDate?: string,
): AdjustDateItem[] {
  const start = fromDate
    ? moment(fromDate, 'YYYY-MM-DD').startOf('day')
    : moment().startOf('day');
  const today = moment().startOf('day');
  const list: AdjustDateItem[] = [];
  for (let i = 0; i < dayCount; i += 1) {
    list.push(buildOneAdjustDateItem(start.clone().add(i, 'days'), today));
  }
  return list;
}

/**
 * 在现有日期条末尾追加若干天（用于横向继续滑动加载）
 */
export function appendAdjustDateItems(
  items: AdjustDateItem[],
  appendCount = ADJUST_DATE_APPEND_COUNT,
): AdjustDateItem[] {
  if (appendCount <= 0) return items;
  const today = moment().startOf('day');
  const lastKey = items[items.length - 1]?.key?.trim() || '';
  const start = lastKey
    ? moment(lastKey, 'YYYY-MM-DD').startOf('day').add(1, 'days')
    : today.clone();
  if (!start.isValid()) return items;
  const extra: AdjustDateItem[] = [];
  for (let i = 0; i < appendCount; i += 1) {
    extra.push(buildOneAdjustDateItem(start.clone().add(i, 'days'), today));
  }
  return [...items, ...extra];
}

/**
 * 保证选中日在条内：始终从今天起向后扩展，不改成以选中日为起点
 * （避免选 10.8 后条从 10.8 开始、滑不到今天）
 */
export function ensureAdjustDateInStrip(
  items: AdjustDateItem[],
  selectedDate: string,
  dayCount = DEFAULT_DAY_COUNT,
): AdjustDateItem[] {
  const key = selectedDate?.trim() || '';
  if (!key) return items;
  if (items.some(item => item.key === key)) return items;

  const today = moment().startOf('day');
  const selected = moment(key, 'YYYY-MM-DD').startOf('day');
  if (!selected.isValid()) return items;

  // 选中日早于今天：仍从今天起默认长度
  if (selected.isBefore(today, 'day')) {
    return buildAdjustDateItems(dayCount);
  }

  const daysFromToday = selected.diff(today, 'days') + 1;
  const nextCount = Math.max(dayCount, daysFromToday, items.length);
  return buildAdjustDateItems(nextCount);
}

export type AdjustTimeSlotItem = {
  key: string;
  label: string;
  startTime: string;
  endTime: string;
  /** 真实场次 id；无则不可提交改约 */
  sessionId?: string;
  /** 场次状态：0.草稿 1.已发布 2.已满员 3.截止报名 4.进行中 5.已结束 6.已取消 */
  status?: number;
  /** 当前已预约 / 非可约状态（置灰不可选） */
  disabled?: boolean;
  isCurrent?: boolean;
  /** 场次已满员（status=2） */
  isFull?: boolean;
  /** 截止报名（status=3） */
  isDeadline?: boolean;
};

function formatHm(time?: string) {
  const raw = time?.trim() || '';
  if (!raw) return '';
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function formatHourDisplay(hour: number) {
  return `${hour}:00`;
}

/** 9:00–21:00 整点时段，展示如 9:00-10:00（无真实场次时的占位） */
export function buildAdjustTimeSlots(
  startHour = 9,
  endHour = 21,
): AdjustTimeSlotItem[] {
  const slots: AdjustTimeSlotItem[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    const startTime = `${hour < 10 ? '0' : ''}${hour}:00`;
    const endTime = `${hour + 1 < 10 ? '0' : ''}${hour + 1}:00`;
    const label = `${formatHourDisplay(hour)}-${formatHourDisplay(hour + 1)}`;
    slots.push({
      key: `${startTime}-${endTime}`,
      label,
      startTime,
      endTime,
    });
  }
  return slots;
}

/**
 * 将接口返回的场次全部映射为时段列表（不做状态过滤）：
 * - status=1 可约
 * - status=2 已满员 / status=3 截止报名：时间下方展示状态
 * - 当前已预约 / 非可约置灰
 */
export function mapSessionsToAdjustSlots(
  rows: CourseSessionItem[],
  options?: { currentSessionId?: string },
): AdjustTimeSlotItem[] {
  const currentId = options?.currentSessionId?.trim() || '';
  return rows
    .map(item => {
      const sessionId =
        item.sessionId != null ? String(item.sessionId).trim() : '';
      if (!sessionId) return null;
      const isCurrent = Boolean(currentId && sessionId === currentId);
      const status = Number(item.status);
      const isFull = status === 2;
      const isDeadline = status === 3;
      const startTime = formatHm(item.startTime);
      const endTime = formatHm(item.endTime);
      if (!startTime) return null;
      const label =
        startTime && endTime ? `${startTime}-${endTime}` : startTime;
      return {
        key: sessionId,
        sessionId,
        label,
        startTime,
        endTime,
        status: Number.isFinite(status) ? status : undefined,
        // 仅已发布可改约；当前已约及其余状态置灰
        disabled: isCurrent || status !== 1,
        isCurrent,
        isFull,
        isDeadline,
      } satisfies AdjustTimeSlotItem;
    })
    .filter((row): row is AdjustTimeSlotItem => row != null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * 拉取本服务站、指定课程类型、某日可改约场次（含当前已预约置灰项）
 * 传入 coachUserId 时仅返回该教练场次
 */
export async function fetchAdjustableSessions(options: {
  stationId: string;
  courseType: CourseSessionType | string;
  sessionDate: string;
  /** 当前教练：仅展示该教练可约时间 */
  coachUserId?: string;
  /** 当前已预约场次：列表中保留并置灰 */
  currentSessionId?: string;
}): Promise<AdjustTimeSlotItem[]> {
  const stationId = String(options.stationId ?? '').trim();
  const courseType = String(options.courseType ?? '').trim();
  const sessionDate = String(options.sessionDate ?? '').trim();
  const coachUserId = String(options.coachUserId ?? '').trim();
  if (!stationId || !courseType || !sessionDate) return [];

  const res = await getCourseSessionPage({
    stationId,
    courseType,
    startDate: sessionDate,
    endDate: sessionDate,
    pageNum: 1,
    pageSize: 50,
    ...(coachUserId ? { coachUserId } : {}),
  });

  return mapSessionsToAdjustSlots(getResourceRows<CourseSessionItem>(res), {
    currentSessionId: options.currentSessionId,
  });
}

/** 每行 3 个切分 */
export function chunkAdjustTimeSlots<T>(list: T[], size = 3): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size));
  }
  return rows;
}
