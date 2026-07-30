import type { DietUserSignInfo } from '@/api/dietUserSignInfo';

export function getDietSignButtonLabel(info?: DietUserSignInfo | null) {
  if (info?.signedToday) return '已完成今日打卡';
  return '完成今日打卡';
}

/** 历史日期：展示当日打卡结果文案 */
export function getDietHistorySignButtonLabel(signed?: boolean | null) {
  return signed ? '已完成今日打卡' : '未完成今日打卡';
}

/** 不可打卡时的提示；可打卡返回 null */
export function getDietSignBlockedMessage(info?: DietUserSignInfo | null) {
  if (info?.signedToday) return '今日已打卡';
  if (!info?.fullDayMealRecorded) return '请先记录早中晚三餐后再打卡';
  if (!info?.canSign) return '当前不可打卡';
  return null;
}
