import moment, { type Moment } from 'moment';

/** 周一到周日 */
export const DIET_WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export type DietWeekDayItem = {
  key: string;
  date: Moment;
  label: string;
  day: number;
};

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
