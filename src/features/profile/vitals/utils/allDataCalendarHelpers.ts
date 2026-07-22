import moment, { type Moment } from 'moment';

/** 周一到周日 */
export const ALL_DATA_WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export type AllDataWeekDayItem = {
  key: string;
  date: Moment;
  label: string;
  day: number;
};

export function buildAllDataWeekDays(anchor: Moment | string = moment()): AllDataWeekDayItem[] {
  const start = moment(anchor).startOf('isoWeek');
  return Array.from({ length: 7 }, (_, index) => {
    const date = moment(start).add(index, 'day');
    return {
      key: date.format('YYYY-MM-DD'),
      date,
      label: ALL_DATA_WEEK_LABELS[index],
      day: date.date(),
    };
  });
}
