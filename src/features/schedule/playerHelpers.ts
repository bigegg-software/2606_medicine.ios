import moment from 'moment';
import type { DayTypeDetailItem, ExPatientRuleRatio } from '@/api/schedule';
import { getDayTypeListDetailByCustomerLocalDate } from '@/api/schedule';
import { getExVideoFrontList, type ExVideoInfo } from '@/api/exVideo';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type TodayExerciseDuration = {
  completedMinutes: number;
  targetMinutes: number;
};

function toQueryId(id?: string | number | null) {
  if (id == null || id === '') return undefined;
  return String(id);
}

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

export async function loadTodayExerciseDuration(
  exPatientRuleId?: string | number,
  exerciseType?: string,
  fallbackTargetMinutes?: number,
): Promise<TodayExerciseDuration> {
  const ruleId = toQueryId(exPatientRuleId);
  const typeKey = exerciseType?.trim();
  const fallback = fallbackTargetMinutes ?? 0;

  if (!ruleId || !typeKey) {
    return { completedMinutes: 0, targetMinutes: fallback };
  }

  try {
    const res = await getDayTypeListDetailByCustomerLocalDate({
      exPatientRuleId: ruleId,
      customerLocalDate: moment().format('YYYY-MM-DD'),
    });
    if (!isResourceApiOk(res)) {
      return { completedMinutes: 0, targetMinutes: fallback };
    }

    const list = apiResourceData<DayTypeDetailItem[]>(res as any) ?? [];
    const item = list.find(entry => entry.exerciseType?.trim() === typeKey);
    return {
      completedMinutes: item?.typeSumExerciseDuration ?? 0,
      targetMinutes: item?.typeNeedExerciseDuration ?? fallback,
    };
  } catch {
    return { completedMinutes: 0, targetMinutes: fallback };
  }
}

export function formatDurationFromSeconds(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
