import moment, { type Moment } from 'moment';

/** 周一到周日 */
export const DIET_WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export type DietWeekDayItem = {
  key: string;
  date: Moment;
  label: string;
  day: number;
};

export type DietCalendarDayCell = {
  key: string;
  day: number;
  inCurrentMonth: boolean;
};

/** 饮食日历最早可选月份 */
export const DIET_CALENDAR_MIN_MONTH = '2026-06';
/** 饮食日历最早可选日期 */
export const DIET_CALENDAR_MIN_DATE = `${DIET_CALENDAR_MIN_MONTH}-01`;

export function clampDietCalendarDate(date: string): string {
  const value = date?.trim() || '';
  if (!value) return DIET_CALENDAR_MIN_DATE;
  return value < DIET_CALENDAR_MIN_DATE ? DIET_CALENDAR_MIN_DATE : value;
}

export function buildDietWeekDays(anchor: Moment | string = moment()): DietWeekDayItem[] {
  const start = moment(anchor).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, index) => {
    const date = moment(start).add(index, 'day');
    return {
      key: date.format('YYYY-MM-DD'),
      date,
      label: DIET_WEEK_LABELS[index],
      day: date.date(),
    };
  });
}

/** 当月实际周数（周一开头，4~6） */
export function getDietMonthWeekCount(month: string): number {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const startPad = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.ceil((startPad + daysInMonth) / 7);
}

/** 周一开头的月历网格（仅当月日期，按实际周数） */
export function buildDietMonthCells(month: string): DietCalendarDayCell[] {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const startPad = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weekCount = Math.ceil((startPad + daysInMonth) / 7);
  const cells: DietCalendarDayCell[] = [];

  for (let index = 0; index < weekCount * 7; index += 1) {
    const dayNum = index - startPad + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({
        key: `pad-${month}-${index}`,
        day: 0,
        inCurrentMonth: false,
      });
      continue;
    }
    const dayText = dayNum < 10 ? `0${dayNum}` : String(dayNum);
    cells.push({
      key: `${month}-${dayText}`,
      day: dayNum,
      inCurrentMonth: true,
    });
  }

  return cells;
}

export function buildDietMonthKeys(center: Moment | string, before = 6, after = 6): string[] {
  const base = moment(center).startOf('month');
  return Array.from({ length: before + after + 1 }, (_, index) =>
    moment(base).add(index - before, 'month').format('YYYY-MM'),
  ).filter(monthKey => monthKey >= DIET_CALENDAR_MIN_MONTH);
}

export function shiftDietMonthKeys(keys: string[], direction: 'before' | 'after', count = 6): string[] {
  if (keys.length === 0) return keys;
  if (direction === 'before') {
    const first = moment(keys[0], 'YYYY-MM');
    if (keys[0] <= DIET_CALENDAR_MIN_MONTH) return keys;
    const prepend = Array.from({ length: count }, (_, index) =>
      moment(first).subtract(count - index, 'month').format('YYYY-MM'),
    ).filter(monthKey => monthKey >= DIET_CALENDAR_MIN_MONTH);
    if (prepend.length === 0) return keys;
    return [...prepend, ...keys];
  }
  const last = moment(keys[keys.length - 1], 'YYYY-MM');
  const append = Array.from({ length: count }, (_, index) =>
    moment(last).add(index + 1, 'month').format('YYYY-MM'),
  );
  return [...keys, ...append];
}
