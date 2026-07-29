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

/** 信息栏时段文案，如：2026-07-31 10:46  直播 */
export function formatLiveDailySchedule(start?: string | null) {
  if (!start?.trim()) return '';
  const startMoment = moment(start);
  if (!startMoment.isValid()) return '';
  return `${startMoment.format('YYYY-MM-DD HH:mm')}  直播`;
}

export function formatLiveViewCount(count?: number | null) {
  const value = Number(count ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '0人次观看';
  return `${value}人次观看`;
}

export function formatLiveWatchingCount(count?: number | null) {
  const value = Number(count ?? 0);
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return `${safe.toLocaleString('en-US')}人次观看`;
}

/** 预约人数展示用数字 */
export function formatLiveReserveCount(count?: number | null) {
  const value = Number(count ?? 0);
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return safe.toLocaleString('en-US');
}

export function getLiveStatusText(status?: number, statusName?: string) {
  if (statusName?.trim()) return statusName.trim();
  if (status === 1) return '直播中';
  if (status === 2) return '已结束';
  return '未开始';
}

export function getLiveStatusStyle(status?: number) {
  if (status === 1) {
    return { bg: '#6D925E', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  if (status === 2) {
    return { bg: '#FB4550', text: '#FFFFFF', dot: '#FFFFFF' };
  }
  return { bg: '#EE9C44', text: '#FFFFFF', dot: '#FFFFFF' };
}

/** 第三方观看链接 */
export function getLiveWatchUrl(live: {
  liveLink?: string | null;
  watchUrl?: string | null;
} | null | undefined) {
  const url = live?.liveLink?.trim() || live?.watchUrl?.trim() || '';
  return url;
}

/** 观看方式文案：跳转第三方平台 小鹅通 观看 */
export function formatLiveWatchMethodText(platformLabel?: string | null) {
  const platform = platformLabel?.trim() || '第三方平台';
  return `跳转第三方平台 ${platform} 观看`;
}
