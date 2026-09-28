import moment from 'moment';

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
    const m = start.clone().add(i, 'days');
    const isToday = m.isSame(today, 'day');
    list.push({
      key: m.format('YYYY-MM-DD'),
      weekdayLabel: isToday ? '今天' : WEEKDAY_SHORT[m.day()] || '',
      dayLabel: String(m.date()),
      isToday,
    });
  }
  return list;
}

/** 保证选中日在条内：若不在则以其为起点重建 */
export function ensureAdjustDateInStrip(
  items: AdjustDateItem[],
  selectedDate: string,
  dayCount = DEFAULT_DAY_COUNT,
): AdjustDateItem[] {
  const key = selectedDate?.trim() || '';
  if (!key) return items;
  if (items.some(item => item.key === key)) return items;
  return buildAdjustDateItems(dayCount, key);
}

export type AdjustTimeSlotItem = {
  key: string;
  label: string;
  startTime: string;
  endTime: string;
};

function formatHourDisplay(hour: number) {
  return `${hour}:00`;
}

/** 9:00–21:00 整点时段，展示如 9:00-10:00 */
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

/** 每行 3 个切分 */
export function chunkAdjustTimeSlots<T>(list: T[], size = 3): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size));
  }
  return rows;
}
