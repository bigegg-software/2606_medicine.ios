import type { ExRecordTrainingPhase } from '@/api/exRecord';
import type { InUseExPatientRule } from '@/api/schedule';
import type { RootStackParamList } from '@/route/router';
import { fetchExPatientRuleForDate } from './exerciseRuleDateHelpers';
import {
  isGroupCountDone,
  normalizeGroupCounts,
} from './exercisePlayerHelpers';
import {
  attachTrainingPhaseCompleteInfo,
  buildMainTrainingModules,
  buildTrainingPhaseCards,
  flattenMainTrainingPlayCards,
  formatTrainingPhaseSubtitle,
  getCooldownColdList,
  getWarmupHotList,
  isTrainingPhaseItemSkipable,
  type MainTrainingPlayCard,
  type TrainingPhaseExerciseCard,
} from './trainingPhaseHelpers';
import {
  mapRecordPhaseToTrainingTab,
  setPendingTrainingPhaseTab,
  type TrainingPhaseTabKey,
} from './trainingPhaseTabSync';

export type ExercisePlayerRouteParams = NonNullable<
  RootStackParamList['ExercisePlayerPage']
>;

/** 视频时长（秒）：优先播放器，其次接口字段 */
export function resolveVideoDurationSeconds(
  playerDuration?: number | null,
  apiDuration?: number | null,
) {
  const fromPlayer = Math.round(Number(playerDuration) || 0);
  // expo-video duration 单位为秒
  if (Number.isFinite(fromPlayer) && fromPlayer > 0 && fromPlayer <= 7200) {
    return fromPlayer;
  }

  const fromApi = Math.round(Number(apiDuration) || 0);
  if (!Number.isFinite(fromApi) || fromApi <= 0) return 0;
  // 后端偶发毫秒（如 30000 → 30 秒）
  if (fromApi >= 10000) {
    const asSeconds = Math.round(fromApi / 1000);
    if (asSeconds > 0 && asSeconds <= 7200) return asSeconds;
    return 0;
  }
  if (fromApi > 7200) return 0;
  return fromApi;
}

/**
 * 组训每组计时目标（秒）：
 * - keep_second_number（如 20秒 x 组）→ keepSecondVal
 * - group_number（如 2次 x 组）及其他组训 → 视频时长
 */
export function resolveGroupSessionTargetSeconds(params: {
  timerType?: string | null;
  keepSecondVal?: number | null;
  playerDuration?: number | null;
  apiDuration?: number | null;
}) {
  const timerType = params.timerType?.trim() || '';
  if (timerType === 'keep_second_number') {
    const keepSeconds = Math.round(Number(params.keepSecondVal) || 0);
    if (keepSeconds > 0) return keepSeconds;
  }
  return resolveVideoDurationSeconds(params.playerDuration, params.apiDuration);
}

/** 按秒计进度条（组训：每组目标秒） */
export function calcTrainingProgressPercentBySeconds(
  elapsedSeconds: number,
  targetSeconds: number,
) {
  const target = Math.round(Number(targetSeconds) || 0);
  if (target <= 0) return 0;
  return Math.min(100, (Math.max(0, elapsedSeconds) / target) * 100);
}

/** 下一个未达最大完成度的组下标；全部达标返回 -1 */
export function findNextIncompleteGroupIndex(
  counts: number[],
  totalGroups: number,
  target: number,
) {
  const list = normalizeGroupCounts(counts, totalGroups);
  const safeTarget = Math.max(0, Math.round(Number(target) || 0));
  for (let index = 0; index < list.length; index += 1) {
    if (!isGroupCountDone(list[index] || 0, safeTarget)) return index;
  }
  return -1;
}

/** 本组自动提交时写入的最大完成度 */
export function resolveGroupAutoMaxCount(targetCount: number) {
  const target = Math.max(0, Math.round(Number(targetCount) || 0));
  return target > 0 ? target : 1;
}

/** 当前项是否已全部录入完毕（再次进入不自动跳转） */
export function isExercisePlayerFullyCompleted(params: {
  isDurationTimer: boolean;
  completedMinutes: number;
  targetMinutes: number;
  groupCounts: number[];
  groupTotal: number;
  groupTarget: number;
}) {
  if (params.isDurationTimer) {
    const target = Math.max(0, Math.round(Number(params.targetMinutes) || 0));
    const done = Math.max(0, Math.round(Number(params.completedMinutes) || 0));
    return target > 0 && done >= target;
  }
  const total = Math.max(0, Math.round(Number(params.groupTotal) || 0));
  if (total <= 0) return false;
  // 组别：每一组只要有进度（含半完成 1/3）即视为已录入；全部有进度则不再自动跳
  const counts = normalizeGroupCounts(params.groupCounts, total);
  return counts.every(count => count > 0);
}

function resolveMainTaskIndex(
  dayRule: InUseExPatientRule | null | undefined,
  exerciseType: string,
) {
  const list = dayRule?.ruleRatioList ?? [];
  const matched = list.findIndex(item => item.exerciseType?.trim() === exerciseType);
  return matched >= 0 ? matched : undefined;
}

function toRouteParams(options: {
  card: TrainingPhaseExerciseCard;
  trainingPhase: ExRecordTrainingPhase;
  exerciseType?: string;
  dayRule?: InUseExPatientRule | null;
  customerLocalDate: string;
  readOnly?: boolean;
}): ExercisePlayerRouteParams {
  const { card, trainingPhase, exerciseType, dayRule, customerLocalDate, readOnly } = options;
  const type = exerciseType?.trim() || undefined;
  const rule = type
    ? dayRule?.ruleRatioList?.find(item => item.exerciseType?.trim() === type)
    : undefined;

  return {
    exerciseType: type,
    exerciseChildType: rule?.exerciseChildType,
    strengthLevel: rule?.strengthLevel,
    taskIndex: type ? resolveMainTaskIndex(dayRule, type) : undefined,
    exVideoId: card.exVideoId,
    title: card.title,
    ruleSubtitle: formatTrainingPhaseSubtitle(card),
    trainingPhase,
    groupVal: card.groupVal,
    numberVal: card.numberVal,
    keepSecondVal: card.keepSecondVal,
    durationMinutes: card.durationMinutes,
    timerType: card.timerType || undefined,
    readOnly: Boolean(readOnly),
    customerLocalDate,
  };
}

function pickNextCard(
  cards: TrainingPhaseExerciseCard[],
  currentExVideoId: string,
  /** 跨阶段进入时从列表头开始找未播放项 */
  fromStart: boolean,
) {
  if (!cards.length) return null;
  if (fromStart) {
    return cards.find(card => !isTrainingPhaseItemSkipable(card)) ?? null;
  }
  const currentIndex = currentExVideoId
    ? cards.findIndex(card => String(card.exVideoId) === currentExVideoId)
    : -1;
  const from = currentIndex >= 0 ? currentIndex + 1 : 0;
  return cards.slice(from).find(card => !isTrainingPhaseItemSkipable(card)) ?? null;
}

async function resolveInWarmupPhase(options: {
  dayRule: InUseExPatientRule;
  customerLocalDate: string;
  currentExVideoId: string;
  fromStart: boolean;
  readOnly?: boolean;
}): Promise<ExercisePlayerRouteParams | null> {
  const { dayRule, customerLocalDate, currentExVideoId, fromStart, readOnly } = options;
  const phaseBundle = getWarmupHotList(dayRule, customerLocalDate);
  if (phaseBundle.isRest || phaseBundle.hotList.length === 0) return null;
  const baseCards = await buildTrainingPhaseCards(phaseBundle.hotList);
  const cards = await attachTrainingPhaseCompleteInfo(baseCards, {
    exPatientRuleId: dayRule.exPatientRuleId,
    customerLocalDate,
    trainingPhase: 'hot',
  });
  const next = pickNextCard(cards, currentExVideoId, fromStart);
  if (!next) return null;
  return toRouteParams({
    card: next,
    trainingPhase: 'hot',
    dayRule,
    customerLocalDate,
    readOnly,
  });
}

async function resolveInMainPhase(options: {
  dayRule: InUseExPatientRule;
  customerLocalDate: string;
  currentExVideoId: string;
  fromStart: boolean;
  readOnly?: boolean;
}): Promise<ExercisePlayerRouteParams | null> {
  const { dayRule, customerLocalDate, currentExVideoId, fromStart, readOnly } = options;
  const { isRest, modules } = await buildMainTrainingModules(dayRule, customerLocalDate);
  if (isRest) return null;
  const cards = flattenMainTrainingPlayCards(modules);
  const next = pickNextCard(cards, currentExVideoId, fromStart) as MainTrainingPlayCard | null;
  if (!next) return null;
  return toRouteParams({
    card: next,
    trainingPhase: 'main',
    exerciseType: next.exerciseType,
    dayRule,
    customerLocalDate,
    readOnly,
  });
}

async function resolveInCooldownPhase(options: {
  dayRule: InUseExPatientRule;
  customerLocalDate: string;
  currentExVideoId: string;
  fromStart: boolean;
  readOnly?: boolean;
}): Promise<ExercisePlayerRouteParams | null> {
  const { dayRule, customerLocalDate, currentExVideoId, fromStart, readOnly } = options;
  const phaseBundle = getCooldownColdList(dayRule, customerLocalDate);
  if (phaseBundle.isRest || phaseBundle.coldList.length === 0) return null;
  const baseCards = await buildTrainingPhaseCards(phaseBundle.coldList);
  const cards = await attachTrainingPhaseCompleteInfo(baseCards, {
    exPatientRuleId: dayRule.exPatientRuleId,
    customerLocalDate,
    trainingPhase: 'cold',
  });
  const next = pickNextCard(cards, currentExVideoId, fromStart);
  if (!next) return null;
  return toRouteParams({
    card: next,
    trainingPhase: 'cold',
    dayRule,
    customerLocalDate,
    readOnly,
  });
}

async function resolveInPhase(
  phase: ExRecordTrainingPhase,
  options: {
    dayRule: InUseExPatientRule;
    customerLocalDate: string;
    currentExVideoId: string;
    fromStart: boolean;
    readOnly?: boolean;
  },
) {
  if (phase === 'main') return resolveInMainPhase(options);
  if (phase === 'cold') return resolveInCooldownPhase(options);
  return resolveInWarmupPhase(options);
}

/** 当前阶段播完且无下阶段内容时，返回列表应落在的页签 */
export function resolveReturnTabAfterPhaseComplete(
  phase: ExRecordTrainingPhase,
): TrainingPhaseTabKey {
  if (phase === 'hot') return 'main';
  return 'cooldown';
}

/**
 * 解析下一项播放参数：
 * 1. 同阶段按序找未播放项
 * 2. 热身播完 → 主训练；主训练播完 → 冷身
 * 同时写入返回列表时要切换的页签。
 */
export async function resolveNextExercisePlayerParams(params: {
  currentExVideoId?: string;
  trainingPhase: ExRecordTrainingPhase;
  exerciseType?: string;
  customerLocalDate: string;
  exPatientRuleId?: string | number | null;
  readOnly?: boolean;
}): Promise<ExercisePlayerRouteParams | null> {
  const customerLocalDate = params.customerLocalDate?.trim() || '';
  if (!customerLocalDate) return null;

  const dayRule = await fetchExPatientRuleForDate(customerLocalDate, {
    exPatientRuleId: params.exPatientRuleId,
  });
  if (!dayRule) return null;

  const currentId = params.currentExVideoId?.trim() || '';
  const trainingPhase = params.trainingPhase;
  const shared = {
    dayRule,
    customerLocalDate,
    currentExVideoId: currentId,
    readOnly: params.readOnly,
  };

  // 同阶段下一项
  const samePhase = await resolveInPhase(trainingPhase, {
    ...shared,
    fromStart: false,
  });
  if (samePhase) {
    setPendingTrainingPhaseTab(mapRecordPhaseToTrainingTab(samePhase.trainingPhase || trainingPhase));
    return samePhase;
  }

  // 跨阶段：热身 → 主训练 → 冷身
  if (trainingPhase === 'hot') {
    const mainNext = await resolveInMainPhase({ ...shared, fromStart: true });
    if (mainNext) {
      setPendingTrainingPhaseTab('main');
      return mainNext;
    }
    const coldNext = await resolveInCooldownPhase({ ...shared, fromStart: true });
    if (coldNext) {
      setPendingTrainingPhaseTab('cooldown');
      return coldNext;
    }
    setPendingTrainingPhaseTab('main');
    return null;
  }

  if (trainingPhase === 'main') {
    const coldNext = await resolveInCooldownPhase({ ...shared, fromStart: true });
    if (coldNext) {
      setPendingTrainingPhaseTab('cooldown');
      return coldNext;
    }
    setPendingTrainingPhaseTab('cooldown');
    return null;
  }

  // 冷身全部完成
  setPendingTrainingPhaseTab('cooldown');
  return null;
}
