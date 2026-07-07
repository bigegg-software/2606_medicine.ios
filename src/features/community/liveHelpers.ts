import moment from 'moment';

export function toLiveId(value?: number | string | null) {
  if (value == null || value === '') return '';
  return String(value);
}

export function formatLiveStartTime(time?: string | null) {
  if (!time?.trim()) return '--';
  const target = moment(time);
  if (!target.isValid()) return time;
  const today = moment().startOf('day');
  const dayDiff = target.clone().startOf('day').diff(today, 'day');
  if (dayDiff === 0) return `今天 ${target.format('HH:mm')}`;
  if (dayDiff === 1) return `明天 ${target.format('HH:mm')}`;
  return target.format('M月D日 HH:mm');
}

export function formatLiveViewCount(count?: number | null) {
  const value = Number(count ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0人次观看';
  return `${value}人次观看`;
}

export function getLiveStatusText(status?: number, statusName?: string) {
  if (statusName?.trim()) return statusName.trim();
  if (status === 1) return '直播中';
  if (status === 2) return '已结束';
  return '未开始';
}
