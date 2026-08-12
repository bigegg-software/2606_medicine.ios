import moment from 'moment';
import {
  getExRecordVideoCompleteInfo,
  type ExRecordTrainingPhase,
  type ExRecordVideoCompleteInfo,
} from '@/api/exRecord';
import { getExVideoInfo, type ExVideoInfo } from '@/api/exVideo';
import { getInUseExPatientRuleInfo, type ExPatientRuleRatio } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { EXERCISE_TYPE_META, type ExerciseTypeKey } from './prescriptionHelpers';

export type ExercisePlayerDuration = {
  completedMinutes: number;
  targetMinutes: number;
};

export type ExercisePlayerContext = {
  exPatientRuleId?: string;
  rule?: ExPatientRuleRatio;
  video: ExVideoInfo | null;
  todayDuration: ExercisePlayerDuration;
  completeInfo: ExRecordVideoCompleteInfo | null;
  completedGroups: number[];
  /** 每组完成次数，下标 0 对应第 1 组 */
  groupCounts: number[];
};

export type ExitConfirmContent = {
  title: string;
  message: string;
};

/** 目标每组次数/秒数（处方规则优先） */
export function resolveGroupTargetCount(params: {
  numberVal?: number;
  keepSecondVal?: number;
  timerType?: string;
}) {
  const numberVal = Math.round(Number(params.numberVal) || 0);
  const keepSecond = Math.round(Number(params.keepSecondVal) || 0);
  const timerType = params.timerType?.trim();
  if (timerType === 'keep_second_number' && keepSecond > 0) return keepSecond;
  if (numberVal > 0) return numberVal;
  if (keepSecond > 0) return keepSecond;
  return 0;
}

/**
 * 处方安排的组数（与训练列表一致）：
 * 优先 groupVal；keep_second_number 且无 groupVal 时，numberVal 表示组数。
 */
export function resolveScheduleGroupVal(params: {
  groupVal?: number;
  numberVal?: number;
  timerType?: string;
}) {
  const group = Math.round(Number(params.groupVal) || 0);
  if (group > 0) return group;
  if (params.timerType?.trim() === 'keep_second_number') {
    const times = Math.round(Number(params.numberVal) || 0);
    if (times > 0) return times;
  }
  return 0;
}

/** 播放页规则取值：有列表传入的处方字段时，不以视频详情覆盖 */
export function resolvePlayerScheduleRule(params: {
  routeGroupVal?: number;
  routeNumberVal?: number;
  routeKeepSecondVal?: number;
  routeTimerType?: string;
  videoGroupVal?: number;
  videoNumberVal?: number;
  videoKeepSecondVal?: number;
  videoTimerType?: string;
}) {
  const hasRouteRule = [params.routeGroupVal, params.routeNumberVal, params.routeKeepSecondVal]
    .some(value => value != null && Number.isFinite(Number(value)))
    || Boolean(params.routeTimerType?.trim());

  const groupVal = hasRouteRule ? params.routeGroupVal : params.videoGroupVal;
  const numberVal = hasRouteRule ? params.routeNumberVal : params.videoNumberVal;
  const keepSecondVal = hasRouteRule ? params.routeKeepSecondVal : params.videoKeepSecondVal;
  const timerType = hasRouteRule
    ? (params.routeTimerType?.trim() || params.videoTimerType?.trim() || '')
    : (params.videoTimerType?.trim() || '');

  return {
    timerType,
    groupVal: resolveScheduleGroupVal({ groupVal, numberVal, timerType }),
    numberVal: Math.round(Number(numberVal) || 0),
    keepSecondVal: Math.round(Number(keepSecondVal) || 0),
    targetCount: resolveGroupTargetCount({ numberVal, keepSecondVal, timerType }),
  };
}

/** 组别录入弹窗标题与单位 */
export function resolveGroupInputMeta(timerType?: string) {
  const type = timerType?.trim();
  if (type === 'keep_second_number') {
    return { title: '保持时长', unit: '秒' };
  }
  if (type === 'duration_min') {
    return { title: '训练时长', unit: '分钟' };
  }
  return { title: '完成次数', unit: '次' };
}

/** 计时类型：无组时按 1 组写入分钟数 */
export function resolveDurationSaveGroupTotal(groupVal: number, timerType?: string) {
  const total = Math.max(0, Math.round(Number(groupVal) || 0));
  if (timerType?.trim() === 'duration_min') return Math.max(total, 1);
  return total;
}

/** 计时类型：某组有分钟即视为完成（不与目标次数比较） */
export function resolveSaveGroupTargetCount(timerType: string | undefined, targetCount: number) {
  if (timerType?.trim() === 'duration_min') return 0;
  return Math.max(0, Math.round(Number(targetCount) || 0));
}

/** 不足 1 分钟提示（仅计时类型） */
export function getShortSessionConfirmContent(): ExitConfirmContent {
  return {
    title: '时间太短，不计入记录',
    message:
      '您运动了不足1分钟，本次暂不计入有效时长。建议每次至少坚持1分钟，才能获得更好的运动效果哦！',
  };
}

/** 设置某一组完成次数（覆盖写入） */
export function setGroupCountAtIndex(
  counts: number[],
  index: number,
  totalGroups: number,
  value: number,
) {
  const next = normalizeGroupCounts(counts, totalGroups);
  if (index < 0 || index >= next.length) return next;
  const n = Math.round(Number(value));
  next[index] = Number.isFinite(n) && n > 0 ? n : 0;
  return next;
}

/** 查找第一个尚未录入次数的组下标；全部已录入则返回 -1 */
export function findFirstUnsetGroupIndex(counts: number[], totalGroups: number) {
  const list = normalizeGroupCounts(counts, totalGroups);
  for (let index = 0; index < list.length; index += 1) {
    if ((list[index] || 0) <= 0) return index;
  }
  return -1;
}

/** 从 startIndex 起查找下一个尚未录入的组下标；没有则返回 -1 */
export function findNextUnsetGroupIndex(
  counts: number[],
  totalGroups: number,
  startIndex: number,
) {
  const list = normalizeGroupCounts(counts, totalGroups);
  const from = Math.max(0, Math.round(Number(startIndex) || 0));
  for (let index = from; index < list.length; index += 1) {
    if ((list[index] || 0) <= 0) return index;
  }
  return -1;
}

/** 规范化每组次数数组，长度对齐总组数 */
export function normalizeGroupCounts(value?: number[] | null, totalGroups = 0) {
  const len = Math.max(0, Math.round(Number(totalGroups) || 0));
  const raw = Array.isArray(value) ? value : [];
  return Array.from({ length: len }, (_, index) => {
    const n = Math.round(Number(raw[index]));
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
}

/** 最后一个非 0 次数的下标；全 0 返回 -1 */
export function findLastNonZeroGroupIndex(counts: number[]) {
  for (let index = counts.length - 1; index >= 0; index -= 1) {
    if ((counts[index] || 0) > 0) return index;
  }
  return -1;
}

/** 某组是否已完成（达到目标次数；无目标时次数>0 即完成） */
export function isGroupCountDone(count: number, target: number) {
  const safeCount = Math.max(0, Math.round(Number(count) || 0));
  const safeTarget = Math.max(0, Math.round(Number(target) || 0));
  if (safeTarget > 0) return safeCount >= safeTarget;
  return safeCount > 0;
}

/**
 * 由每组次数推导完成组号（仅次数达标）。
 * 提交 markCompleteGroups 时使用：未达标不传。
 */
export function deriveCompleteGroupsFromCounts(counts: number[], target: number) {
  return counts
    .map((count, index) => ({ groupNo: index + 1, count }))
    .filter(item => isGroupCountDone(item.count, target))
    .map(item => item.groupNo);
}

/**
 * 展示用完成组号：
 * - complateGroups 有值时优先使用
 * - 为空时：截至「最后非 0」的组都视为已完成（进度取最后非 0 的次数）
 * 例：[11,11] → 第1/2组已完成展示，下次保存第3组
 */
export function resolveDisplayCompleteGroups(
  counts: number[],
  target: number,
  complateGroups?: number[] | null,
) {
  const fromApi = normalizeCompleteGroups(complateGroups);
  if (fromApi.length > 0) return fromApi;

  const last = findLastNonZeroGroupIndex(counts);
  if (last < 0) return [];

  const result: number[] = [];
  for (let index = 0; index <= last; index += 1) {
    result.push(index + 1);
  }
  // 兼容：次数已达标但尚未写入 complateGroups 的组
  counts.forEach((count, index) => {
    if (isGroupCountDone(count, target) && !result.includes(index + 1)) {
      result.push(index + 1);
    }
  });
  return result.sort((a, b) => a - b);
}

/** 列表/详情：该组是否展示为已完成 */
export function isGroupDisplayDone(
  groupIndex: number,
  counts: number[],
  target: number,
  complateGroups?: number[] | null,
) {
  const completed = resolveDisplayCompleteGroups(counts, target, complateGroups);
  if (completed.includes(groupIndex + 1)) return true;
  return isGroupCountDone(counts[groupIndex] || 0, target);
}

/**
 * 下一个待录入组（按序推进，不回改已保存组）：
 * - 全 0 → 第 1 组
 * - 已有 [11] → 第 2 组；[11,11] → 第 3 组
 * - 没有下一组 → -1（返回上一页）
 */
export function findNextGroupInputIndex(counts: number[], totalGroups: number) {
  const list = normalizeGroupCounts(counts, totalGroups);
  if (totalGroups <= 0) return -1;
  const last = findLastNonZeroGroupIndex(list);
  if (last < 0) return 0;
  const next = last + 1;
  return next < totalGroups ? next : -1;
}

/**
 * 组别标签是否可点：
 * - 已达标（10/10）不可点
 * - 未达标进度（1/10）可再编辑
 * - 无进度时仅「当前待录入组」可点（如全 0 可点第1组）
 */
export function canPressGroupCountTag(
  index: number,
  counts: number[],
  totalGroups: number,
  targetCount: number,
) {
  const list = normalizeGroupCounts(counts, totalGroups);
  if (index < 0 || index >= list.length) return false;
  const count = list[index] || 0;
  const target = Math.max(0, Math.round(Number(targetCount) || 0));
  if (isGroupCountDone(count, target)) return false;
  if (count > 0) return true;
  return index === findNextGroupInputIndex(list, totalGroups);
}

/** 点击累加某一组完成次数 */
export function bumpGroupCountAtIndex(counts: number[], index: number, totalGroups: number) {
  const next = normalizeGroupCounts(counts, totalGroups);
  if (index < 0 || index >= next.length) return next;
  next[index] = (next[index] || 0) + 1;
  return next;
}

/** 长按清零某一组完成次数 */
export function resetGroupCountAtIndex(counts: number[], index: number, totalGroups: number) {
  const next = normalizeGroupCounts(counts, totalGroups);
  if (index < 0 || index >= next.length) return next;
  next[index] = 0;
  return next;
}

/** @deprecated 保留兼容；新逻辑请使用 groupCounts */
export function toggleCompleteGroup(completedGroups: number[], groupNo: number) {
  const set = new Set(completedGroups.filter(item => Number.isFinite(item) && item > 0));
  if (set.has(groupNo)) {
    set.delete(groupNo);
  } else {
    set.add(groupNo);
  }
  return [...set].sort((a, b) => a - b);
}

export function normalizeCompleteGroups(value?: number[] | null) {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map(item => Math.round(Number(item)))
      .filter(item => Number.isFinite(item) && item > 0),
  )].sort((a, b) => a - b);
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

/** 组间休息秒数；无效或 ≤0 返回 0（跳过休息） */
export function resolveRestBetweenGroupSeconds(
  restBetweenGroupSeconds?: number | string | null,
) {
  const seconds = Math.round(Number(restBetweenGroupSeconds) || 0);
  return seconds > 0 ? seconds : 0;
}

/** 组间休息进度：已休息占比 */
export function calcGroupRestProgressPercent(remainingSeconds: number, totalSeconds: number) {
  const total = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (total <= 0) return 0;
  const remaining = Math.max(0, Math.round(Number(remainingSeconds) || 0));
  return Math.min(100, ((total - remaining) / total) * 100);
}

/** 接口 exerciseDuration 单位为分钟，仅统计完整分钟（不足 1 分钟返回 0）。 */
export function sessionSecondsToRecordMinutes(sessionSeconds: number) {
  const seconds = Math.max(0, Math.floor(sessionSeconds));
  if (seconds < 60) return 0;
  return Math.floor(seconds / 60);
}

/** 消耗 kcal = kcalPerMinute × 本次锻炼分钟；无效入参返回 0。 */
export function calcExerciseKcal(
  kcalPerMinute: number | string | null | undefined,
  exerciseMinutes: number,
) {
  const perMin = Number(kcalPerMinute);
  const minutes = Math.max(0, Math.floor(Number(exerciseMinutes) || 0));
  if (!Number.isFinite(perMin) || perMin <= 0 || minutes <= 0) return 0;
  return Math.round(perMin * minutes * 10) / 10;
}

export function getExitConfirmContent(
  sessionSeconds: number,
  completedMinutes: number,
  targetMinutes: number,
): ExitConfirmContent {
  const sessionMinutes = Math.floor(Math.max(0, sessionSeconds) / 60);
  const totalMinutes = completedMinutes + sessionMinutes;
  const target = Math.max(targetMinutes, 0);

  if (sessionSeconds < 60) {
    return getShortSessionConfirmContent();
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

export function getExercisePlayerTypeLabel(type?: string) {
  const key = type?.trim() as ExerciseTypeKey | undefined;
  if (key && EXERCISE_TYPE_META[key]) return EXERCISE_TYPE_META[key].title;
  return type?.trim() || '训练';
}

export async function loadExercisePlayerVideo(exVideoId?: string): Promise<ExVideoInfo | null> {
  const id = exVideoId?.trim();
  if (!id) return null;

  try {
    const res = await getExVideoInfo(id);
    console.log(res)
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return (
      apiResourceData<ExVideoInfo>(
        res as unknown as { code?: number; data?: ExVideoInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

function resolveExercisePlayerDuration(
  completeInfo: ExRecordVideoCompleteInfo | null | undefined,
  fallbackTargetMinutes?: number,
): ExercisePlayerDuration {
  const completed = Number(completeInfo?.exerciseDuration);
  return {
    completedMinutes: Number.isFinite(completed) && completed > 0 ? Math.round(completed) : 0,
    targetMinutes: fallbackTargetMinutes ?? 0,
  };
}

export async function refreshExercisePlayerDuration(params: {
  exPatientRuleId?: string;
  trainingPhase?: ExRecordTrainingPhase;
  exerciseType?: string;
  exVideoId?: string;
  fallbackTargetMinutes?: number;
}): Promise<ExercisePlayerDuration> {
  const completeInfo = await loadExRecordVideoCompleteInfo({
    exPatientRuleId: params.exPatientRuleId,
    trainingPhase: params.trainingPhase,
    exerciseType: params.exerciseType,
    exVideoId: params.exVideoId,
  });
  return resolveExercisePlayerDuration(completeInfo, params.fallbackTargetMinutes);
}

function resolveRuleFromParams(
  rules: ExPatientRuleRatio[],
  params: {
    exerciseType?: string;
    exerciseChildType?: string;
    strengthLevel?: string;
    taskIndex?: number;
  },
  video?: ExVideoInfo | null,
): ExPatientRuleRatio {
  const typeKey = params.exerciseType?.trim() || video?.exerciseType?.trim();
  let rule: ExPatientRuleRatio | undefined;

  if (params.taskIndex != null && params.taskIndex >= 0 && rules[params.taskIndex]) {
    rule = rules[params.taskIndex];
  } else if (typeKey) {
    rule = rules.find(item => item.exerciseType?.trim() === typeKey);
  }

  return {
    ...(rule ?? {}),
    exerciseType: rule?.exerciseType?.trim()
      || params.exerciseType?.trim()
      || video?.exerciseType?.trim(),
    exerciseChildType: rule?.exerciseChildType?.trim()
      || params.exerciseChildType?.trim()
      || video?.exerciseChildType?.trim(),
    strengthLevel: rule?.strengthLevel?.trim()
      || params.strengthLevel?.trim()
      || video?.strengthLevel?.trim(),
    duration: rule?.duration,
  };
}

export async function loadExRecordVideoCompleteInfo(params: {
  exPatientRuleId?: string;
  customerLocalDate?: string;
  trainingPhase?: ExRecordTrainingPhase;
  exerciseType?: string;
  exVideoId?: string;
}): Promise<ExRecordVideoCompleteInfo | null> {
  const exPatientRuleId = params.exPatientRuleId?.trim();
  const exVideoId = params.exVideoId?.trim();
  const trainingPhase = params.trainingPhase;
  if (!exPatientRuleId || !exVideoId || !trainingPhase) return null;

  try {
    const res = await getExRecordVideoCompleteInfo({
      exPatientRuleId: String(exPatientRuleId),
      customerLocalDate: params.customerLocalDate?.trim() || moment().format('YYYY-MM-DD'),
      trainingPhase,
      exerciseType: trainingPhase === 'main' ? params.exerciseType?.trim() || undefined : undefined,
      exVideoId: String(exVideoId),
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return (
      apiResourceData<ExRecordVideoCompleteInfo>(
        res as unknown as { code?: number; data?: ExRecordVideoCompleteInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/** 运动训练播放器启动数据：视频详情 + 在用处方 + 当日完成组数。 */
export async function loadExercisePlayerContext(params: {
  exVideoId?: string;
  exerciseType?: string;
  exerciseChildType?: string;
  strengthLevel?: string;
  taskIndex?: number;
  trainingPhase?: ExRecordTrainingPhase;
  customerLocalDate?: string;
  groupVal?: number;
  numberVal?: number;
  keepSecondVal?: number;
  timerType?: string;
}): Promise<ExercisePlayerContext> {
  const [video, prescriptionRes] = await Promise.all([
    loadExercisePlayerVideo(params.exVideoId),
    getInUseExPatientRuleInfo().catch(() => null),
  ]);

  const payload = prescriptionRes as unknown as {
    code?: number;
    data?: {
      exPatientRuleId?: string | number;
      ruleRatioList?: ExPatientRuleRatio[];
    };
  };
  const prescription = isResourceApiOk(payload) ? apiResourceData(payload) : undefined;
  const rules = prescription?.ruleRatioList ?? [];
  const exPatientRuleId = prescription?.exPatientRuleId != null
    ? String(prescription.exPatientRuleId)
    : undefined;
  const rule = resolveRuleFromParams(rules, params, video);
  const exVideoId = video?.exVideoId != null
    ? String(video.exVideoId)
    : params.exVideoId?.trim();

  const completeInfo = await loadExRecordVideoCompleteInfo({
    exPatientRuleId,
    customerLocalDate: params.customerLocalDate,
    trainingPhase: params.trainingPhase,
    exerciseType: rule.exerciseType,
    exVideoId,
  });

  const scheduleRule = resolvePlayerScheduleRule({
    routeGroupVal: params.groupVal,
    routeNumberVal: params.numberVal,
    routeKeepSecondVal: params.keepSecondVal,
    routeTimerType: params.timerType,
    videoGroupVal: video?.groupVal,
    videoNumberVal: video?.numberVal,
    videoKeepSecondVal: video?.keepSecondVal,
    videoTimerType: video?.timerType,
  });
  const totalGroups = resolveDurationSaveGroupTotal(scheduleRule.groupVal, scheduleRule.timerType);
  const target = resolveSaveGroupTargetCount(scheduleRule.timerType, scheduleRule.targetCount);
  let groupCounts = normalizeGroupCounts(completeInfo?.complateGroupCounts, totalGroups);
  // 兼容旧数据：仅有完成组号时，按目标次数回填
  if (groupCounts.every(count => count <= 0)) {
    const legacyGroups = normalizeCompleteGroups(completeInfo?.complateGroups);
    if (legacyGroups.length > 0) {
      groupCounts = normalizeGroupCounts([], totalGroups);
      for (const groupNo of legacyGroups) {
        if (groupNo >= 1 && groupNo <= totalGroups) {
          groupCounts[groupNo - 1] = target > 0 ? target : 1;
        }
      }
    }
  }
  const completedGroups = resolveDisplayCompleteGroups(
    groupCounts,
    target,
    completeInfo?.complateGroups,
  );

  return {
    exPatientRuleId,
    rule,
    video,
    todayDuration: resolveExercisePlayerDuration(completeInfo, rule.duration),
    completeInfo,
    completedGroups,
    groupCounts,
  };
}

/** 训练播放页建议目标心率默认范围 */
export const EXERCISE_HR_RANGE = { min: 100, max: 130 } as const;

export type ExerciseHeartRateZone = 'low' | 'normal' | 'high';

export function getExerciseHeartRateZone(
  heartRate: number,
  min = EXERCISE_HR_RANGE.min,
  max = EXERCISE_HR_RANGE.max,
): ExerciseHeartRateZone {
  if (heartRate < min) return 'low';
  if (heartRate > max) return 'high';
  return 'normal';
}

export function getExerciseHeartRateZoneLabel(zone: ExerciseHeartRateZone) {
  if (zone === 'low') return '心率偏低';
  if (zone === 'high') return '心率偏高';
  return '正常';
}

export function getExerciseHeartRateBadgeLabel(zone: ExerciseHeartRateZone) {
  if (zone === 'low') return '偏低';
  if (zone === 'high') return '偏高';
  return '正常';
}
