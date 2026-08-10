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
};

export type ExitConfirmContent = {
  title: string;
  message: string;
};

/** 切换某一组的完成状态，返回排序后的整组覆盖数组 */
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

/** 接口 exerciseDuration 单位为分钟，仅统计完整分钟（不足 1 分钟返回 0）。 */
export function sessionSecondsToRecordMinutes(sessionSeconds: number) {
  const seconds = Math.max(0, Math.floor(sessionSeconds));
  if (seconds < 60) return 0;
  return Math.floor(seconds / 60);
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
    return {
      title: '时间太短，不计入记录',
      message:
        '您运动了不足1分钟，本次暂不计入有效时长。建议每次至少坚持1分钟，才能获得更好的运动效果哦！',
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

  return {
    exPatientRuleId,
    rule,
    video,
    todayDuration: resolveExercisePlayerDuration(completeInfo, rule.duration),
    completeInfo,
    completedGroups: normalizeCompleteGroups(completeInfo?.complateGroups),
  };
}
