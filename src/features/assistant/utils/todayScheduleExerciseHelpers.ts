import type { InUseExPatientRule } from '@/api/schedule';
import {
  buildMainTrainingModules,
  type TrainingPhaseExerciseCard,
} from '@/src/features/exercise/utils/trainingPhaseHelpers';

/** 动作参数紧凑文案：30×4组 / 20秒×3组 / 2分钟 */
export function formatCompactExerciseActionParam(item: {
  timerType?: string;
  groupVal?: number;
  numberVal?: number;
  keepSecondVal?: number;
  durationMinutes?: number;
  duration?: number;
  durationMinVal?: number;
}) {
  const timerType = item.timerType?.trim() ?? '';
  const group = Math.round(Number(item.groupVal) || 0);
  const times = Math.round(Number(item.numberVal) || 0);
  const seconds = Math.round(Number(item.keepSecondVal) || 0);
  const minutes = Math.round(
    Number(item.durationMinutes ?? item.durationMinVal ?? item.duration) || 0,
  );

  if (timerType === 'group_number') {
    if (times > 0 && group > 0) return `${times}×${group}组`;
    if (times > 0) return `${times}次`;
    if (group > 0) return `${group}组`;
  }
  if (timerType === 'keep_second_number') {
    if (seconds > 0 && group > 0) return `${seconds}秒×${group}组`;
    if (seconds > 0 && times > 0) return `${seconds}秒×${times}组`;
    if (seconds > 0) return `${seconds}秒`;
  }
  if (timerType === 'duration_min' || minutes > 0) {
    if (minutes > 0 && group > 0) return `${minutes}分钟×${group}组`;
    if (minutes > 0) return `${minutes}分钟`;
  }
  return '';
}

export function formatExerciseCourseSnippet(card: TrainingPhaseExerciseCard) {
  const title = card.title?.trim() || '';
  const param = formatCompactExerciseActionParam(card);
  if (title && param) return `${title}${param}`;
  return title || param || '';
}

/** 课程名称+动作参数，顿号拼接（例：开合跳30×4组、全身舒展2分钟） */
export function formatExerciseCourseDesc(cards: TrainingPhaseExerciseCard[]) {
  const parts = cards.map(formatExerciseCourseSnippet).filter(Boolean);
  return parts.length > 0 ? parts.join('、') : '--';
}

export function formatExerciseDurationLabel(duration?: number | null) {
  const minutes = Math.round(Number(duration) || 0);
  if (minutes > 0) return `${minutes}分钟`;
  return '--';
}

/** 今日主训课程总时长（分钟） */
export function sumMainTrainingDurationMinutes(cards: TrainingPhaseExerciseCard[]) {
  return cards.reduce((sum, card) => {
    const minutes = Math.round(Number(card.durationMinutes) || 0);
    return sum + (minutes > 0 ? minutes : 0);
  }, 0);
}

export type TodayExerciseTypeMeta = {
  desc: string;
  /** 今日该类型主训合计时长；无则 0 */
  durationMinutes: number;
};

/** 按运动类型取今日主训摘要（有安排的类型才有 key） */
export async function loadTodayExerciseMainMetaByType(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): Promise<Record<string, TodayExerciseTypeMeta>> {
  try {
    const { isRest, modules } = await buildMainTrainingModules(rule, customerLocalDate);
    if (isRest) return {};
    const map: Record<string, TodayExerciseTypeMeta> = {};
    for (const module of modules) {
      if (!module.cards.length) continue;
      map[module.key] = {
        desc: formatExerciseCourseDesc(module.cards),
        durationMinutes: sumMainTrainingDurationMinutes(module.cards),
      };
    }
    return map;
  } catch {
    return {};
  }
}
