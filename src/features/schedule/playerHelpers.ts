import type { ExPatientRuleRatio } from '@/api/schedule';
import { getExVideoFrontList, type ExVideoInfo } from '@/api/exVideo';
import { apiResourceData } from '@/src/utils/apiHelpers';

export type TodayExerciseDuration = {
  completedMinutes: number;
  targetMinutes: number;
};

function parseStrengthLevelValue(value?: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : -1;
}

export function findRuleRatio(
  ruleRatioList: ExPatientRuleRatio[] | undefined,
  exerciseType?: string,
  taskIndex?: number,
): ExPatientRuleRatio | undefined {
  if (taskIndex != null && taskIndex >= 0 && ruleRatioList?.[taskIndex]) {
    return ruleRatioList[taskIndex];
  }

  const typeKey = exerciseType?.trim();
  if (!typeKey) {
    return ruleRatioList?.[0];
  }

  return ruleRatioList?.find(rule => rule.exerciseType?.trim() === typeKey) ?? ruleRatioList?.[0];
}

function dedupeVideos(videos: ExVideoInfo[]) {
  const map = new Map<number, ExVideoInfo>();
  for (const video of videos) {
    if (video.displayStatus != null && video.displayStatus !== 1) continue;
    if (video.exVideoId == null) continue;
    map.set(video.exVideoId, video);
  }
  return [...map.values()];
}

export function sortVideosForRule(videos: ExVideoInfo[], strengthLevel?: string) {
  const targetStrength = strengthLevel?.trim() ?? '';

  return [...videos].sort((left, right) => {
    const leftStrength = left.strengthLevel?.trim() ?? '';
    const rightStrength = right.strengthLevel?.trim() ?? '';

    if (leftStrength === targetStrength && rightStrength !== targetStrength) return -1;
    if (rightStrength === targetStrength && leftStrength !== targetStrength) return 1;

    return parseStrengthLevelValue(rightStrength) - parseStrengthLevelValue(leftStrength);
  });
}

export async function loadPlayerVideos(rule?: ExPatientRuleRatio): Promise<ExVideoInfo[]> {
  const exerciseType = rule?.exerciseType?.trim();
  if (!exerciseType || !rule) return [];

  const childTypes = (rule.exerciseChildType ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const childTypeQueries = childTypes.length > 0 ? childTypes : [''];

  const responses = await Promise.all(
    childTypeQueries.map(exerciseChildType =>
      getExVideoFrontList({
        exerciseType,
        exerciseChildType,
        strengthLevel: rule.strengthLevel?.trim() ?? '',
      }).catch(() => null),
    ),
  );

  const videos = responses.flatMap(res => apiResourceData<ExVideoInfo[]>(res as any) ?? []);
  return sortVideosForRule(dedupeVideos(videos), rule.strengthLevel);
}

/** dayTypeListDetailByCustomerLocalDate 已下线，暂用处方目标时长兜底 */
export async function loadTodayExerciseDuration(
  _exPatientRuleId?: string | number,
  _exerciseType?: string,
  fallbackTargetMinutes?: number,
): Promise<TodayExerciseDuration> {
  return {
    completedMinutes: 0,
    targetMinutes: fallbackTargetMinutes ?? 0,
  };
}

export function formatDurationFromSeconds(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatSessionDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function calcTrainingProgressPercent(elapsedSeconds: number, targetMinutes: number) {
  const targetSeconds = Math.max(targetMinutes * 60, 1);
  return Math.min(100, (Math.max(0, elapsedSeconds) / targetSeconds) * 100);
}

/** 接口 exerciseDuration 单位为分钟，仅统计完整分钟（不足 1 分钟返回 0）。 */
export function sessionSecondsToRecordMinutes(sessionSeconds: number) {
  const seconds = Math.max(0, Math.floor(sessionSeconds));
  if (seconds < 60) return 0;
  return Math.floor(seconds / 60);
}

export type ExitConfirmContent = {
  title: string;
  message: string;
};

export function getExitConfirmContent(
  sessionSeconds: number,
  completedMinutes: number,
  targetMinutes: number,
): ExitConfirmContent {
  const sessionMinutes = Math.floor(Math.max(0, sessionSeconds) / 60);
  const totalMinutes = completedMinutes + sessionMinutes;
  const target = Math.max(targetMinutes, 0);

  if (sessionSeconds < 60) {
    return {
      title: '时间太短，不计入记录',
      message: '您运动了不足1分钟，本次暂不计入有效时长。建议每次至少坚持1分钟，才能获得更好的运动效果哦！',
    };
  }

  if (target > 0 && totalMinutes >= target) {
    return {
      title: '目标达成！',
      message: `你已完成今日${target}分钟运动目标，实际运动 ${totalMinutes}分，为坚持点赞！`,
    };
  }

  const remaining = Math.max(0, target - totalMinutes);
  return {
    title: '今日目标未完成',
    message: `您已坚持 ${totalMinutes}分，距离${target || 0}分钟还差 ${remaining}分。确定要现在结束吗？`,
  };
}

export function formatVideoDuration(durationMs?: number) {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function splitMultilineText(text?: string) {
  if (!text?.trim()) return [];

  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^\d+[.、．)\]]\s*/, ''));
}
