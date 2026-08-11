import type { ExUserSignInfo } from '@/api/exUserSignInfo';

/** 主训练是否已完成（接口认定；半完成也算完成） */
export function isExerciseMainTrainingCompleted(info?: ExUserSignInfo | null) {
  if (info?.mainTrainingCompleted) return true;
  if (info?.canSign) return true;
  const total = Math.max(0, Math.round(Number(info?.mainTotalCount) || 0));
  const done = Math.max(0, Math.round(Number(info?.mainCompleteCount) || 0));
  return total > 0 && done >= total;
}

export function getExerciseSignButtonLabel(info?: ExUserSignInfo | null) {
  if (info?.signedToday) return '已完成今日打卡';
  return '完成今日打卡';
}

/** 不可打卡时的提示；可打卡返回 null */
export function getExerciseSignBlockedMessage(
  info?: ExUserSignInfo | null,
  options?: { mainProgressed?: boolean },
) {
  if (info?.signedToday) return '今日已打卡';
  if (options?.mainProgressed || isExerciseMainTrainingCompleted(info)) return null;
  return '请先完成主训练后再打卡（每项有进度即可）';
}
