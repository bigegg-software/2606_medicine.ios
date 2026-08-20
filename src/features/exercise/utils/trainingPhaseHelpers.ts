import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import {
  buildDictLabelMap,
  DICT_TYPES,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import type { ExRecordTrainingPhase } from '@/api/exRecord';
import { getExVideoInfo, type ExVideoInfo } from '@/api/exVideo';
import type {
  ExWeekTrainingItem,
  ExWeekTrainingMainBlock,
  ExWeekTrainingSchedule,
} from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { EXERCISE_TYPE_META, getPrescribedExerciseTypeKeys, type ExerciseTypeKey } from './prescriptionHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  isGroupDisplayDone,
  loadExRecordVideoCompleteInfo,
  normalizeCompleteGroups,
  normalizeGroupCounts,
  resolveDisplayCompleteGroups,
  resolveDurationSaveGroupTotal,
  resolveGroupTargetCount,
  resolveScheduleGroupVal,
} from './exercisePlayerHelpers';

const DEFAULT_THUMB = require('@/assets/images/exercise/ydkz.png');

export type TrainingPhaseExerciseCard = {
  key: string;
  exVideoId: string;
  title: string;
  ruleText: string;
  coverSource: ImageSourcePropType;
  durationMinutes: number;
  kcal: number;
  timerType: string;
  groupVal: number;
  numberVal: number;
  keepSecondVal: number;
  restBetweenGroupSeconds: number;
  bodyPartText: string;
  /** 当日已完成组号列表 */
  completedGroups: number[];
  /** 每组完成次数，下标 0 对应第 1 组 */
  groupCounts: number[];
  /** 当日该视频累计锻炼分钟 */
  completedMinutes: number;
};

export type MainTrainingTypeModule = {
  key: ExerciseTypeKey;
  title: string;
  icon: ImageSourcePropType;
  tipText: string;
  cards: TrainingPhaseExerciseCard[];
};

const MAIN_TYPE_ORDER: ExerciseTypeKey[] = ['cardio', 'strength', 'flexibility', 'balance'];

const MAIN_TYPE_TIP: Partial<Record<ExerciseTypeKey, string>> = {
  flexibility: '拉伸至轻微紧绷感',
  balance: '安全第一，可扶墙保护',
};

/** 主训练类型旁提示：优先显示处方强度，超出由 UI 省略 */
export function resolveMainTrainingModuleTipText(
  typeKey: ExerciseTypeKey,
  rule?: InUseExPatientRule | null,
  strengthLevelMap?: Record<string, string>,
) {
  const ratio = (rule?.ruleRatioList ?? []).find(
    item => item.exerciseType?.trim() === typeKey,
  );
  const fitt = ratio?.fittVp ?? {};
  const intensity = String(fitt.I ?? fitt.intensity ?? fitt['强度'] ?? '').trim();
  if (intensity) return intensity;

  const levelKey = ratio?.strengthLevel?.trim();
  if (levelKey) {
    const label = strengthLevelMap?.[levelKey]?.trim() || levelKey;
    if (label) return label;
  }

  return MAIN_TYPE_TIP[typeKey] ?? '';
}

/** 取选中日期对应的周训练安排（day: 1=周一 ... 7=周日） */
export function getWeekScheduleForDate(
  list: ExWeekTrainingSchedule[] | undefined,
  customerLocalDate: string,
): ExWeekTrainingSchedule | null {
  const day = moment(customerLocalDate, 'YYYY-MM-DD').isoWeekday();
  if (!Number.isFinite(day) || day < 1 || day > 7) return null;
  return (list ?? []).find(item => Number(item.day) === day) ?? null;
}

export function formatTrainingItemRuleText(item: ExWeekTrainingItem) {
  const timerType = item.timerType?.trim();
  const group = Number(item.groupVal);
  const hasGroup = Number.isFinite(group) && group > 0;

  if (timerType === 'duration_min') {
    const minutes = Number(item.durationMinVal ?? item.duration);
    if (Number.isFinite(minutes) && minutes > 0) {
      const minuteText = `${Math.round(minutes)}分钟`;
      return hasGroup ? `${minuteText} x ${Math.round(group)}组` : minuteText;
    }
  }
  if (timerType === 'group_number') {
    const times = Number(item.numberVal);
    if (Number.isFinite(times) && times > 0 && hasGroup) {
      return `${Math.round(times)}次 x ${Math.round(group)}组`;
    }
    if (Number.isFinite(times) && times > 0) return `${Math.round(times)}次`;
    if (hasGroup) return `${Math.round(group)}组`;
  }
  if (timerType === 'keep_second_number') {
    const seconds = Number(item.keepSecondVal);
    const times = Number(item.numberVal);
    if (Number.isFinite(seconds) && seconds > 0) {
      const secondText = `${Math.round(seconds)}秒`;
      if (hasGroup) return `${secondText} x ${Math.round(group)}组`;
      if (Number.isFinite(times) && times > 0) return `${secondText} x ${Math.round(times)}组`;
      return secondText;
    }
  }

  const fallbackMinutes = Number(item.duration ?? item.durationMinVal);
  if (Number.isFinite(fallbackMinutes) && fallbackMinutes > 0) {
    return `${Math.round(fallbackMinutes)}分钟`;
  }
  return '--';
}

/** 列表副标题：分钟/次数/组别，后接部位类型（与主训练卡片一致） */
export function formatTrainingPhaseSubtitle(card: TrainingPhaseExerciseCard) {
  let base = '';
  if (card.timerType === 'group_number') {
    if (card.numberVal > 0 && card.groupVal > 0) {
      base = `${card.numberVal}次 x ${card.groupVal}组`;
    } else if (card.numberVal > 0) {
      base = `${card.numberVal}次`;
    } else if (card.groupVal > 0) {
      base = `${card.groupVal}组`;
    }
  } else if (card.timerType === 'keep_second_number') {
    if (card.keepSecondVal > 0 && card.groupVal > 0) {
      base = `${card.keepSecondVal}秒 x ${card.groupVal}组`;
    } else if (card.keepSecondVal > 0 && card.numberVal > 0) {
      base = `${card.keepSecondVal}秒 x ${card.numberVal}组`;
    } else if (card.keepSecondVal > 0) {
      base = `${card.keepSecondVal}秒`;
    }
  } else if (card.timerType === 'duration_min' && card.durationMinutes > 0) {
    base = card.groupVal > 0
      ? `${card.durationMinutes}分钟 x ${card.groupVal}组`
      : `${card.durationMinutes}分钟`;
  } else {
    base = card.ruleText.split(' · ')[0] || '--';
  }

  if (!base || base === '--') return card.ruleText || '--';
  return card.bodyPartText ? `${base} · ${card.bodyPartText}` : base;
}

/** 列表右侧操作文案：计时类型显示进度分钟，其它按组完成态 */
export type TrainingActionDateMode = 'today' | 'past' | 'future';

export function formatTrainingActionButtonText(
  card: TrainingPhaseExerciseCard,
  options?: { dateMode?: TrainingActionDateMode },
) {
  const dateMode = options?.dateMode ?? 'today';

  // 未来：展示「开始」，由列表侧禁用点击
  if (dateMode === 'future') return '开始';

  if (card.timerType === 'duration_min') {
    const done = Math.max(0, Math.round(Number(card.completedMinutes) || 0));
    const target = Math.max(0, Math.round(Number(card.durationMinutes) || 0));
    if (target > 0 && done >= target) return '完成';
    if (done > 0) return `${done}/${target}分钟`;
    // 过去未开始：显示 0/目标
    if (dateMode === 'past' && target > 0) return `0/${target}分钟`;
    return '开始';
  }

  const scheduleGroupVal = resolveScheduleGroupVal(card);
  if (scheduleGroupVal <= 0) return '开始';
  const target = resolveGroupTargetCount(card);
  const allDone = Array.from({ length: scheduleGroupVal }, (_, index) =>
    isGroupDisplayDone(index, card.groupCounts, target, card.completedGroups),
  ).every(Boolean);
  // 过去未全部完成：统一展示「开始」（列表侧置灰不可点）
  if (dateMode === 'past' && !allDone) return '开始';
  return allDone ? '完成' : '开始';
}

/** 非今日：仅「全部完成」可点进只读详情；未来与未完成均不可点（显示置灰开始）
 * 家人只读（今日）：同过去日规则，「开始」置灰不可点
 */
export function canPressTrainingAction(
  card: TrainingPhaseExerciseCard,
  dateMode: TrainingActionDateMode = 'today',
  options?: { readOnly?: boolean },
) {
  if (options?.readOnly && dateMode === 'today') {
    return isTrainingActionCompleted(card);
  }
  if (dateMode === 'today') return true;
  if (dateMode === 'future') return false;
  // 过去：有部分进度（如 10/12 + 第二组/第三组）仍视为未完成，按钮为置灰「开始」
  return isTrainingActionCompleted(card);
}

/** 列表右侧是否显示完成图标 */
export function isTrainingActionCompleted(card: TrainingPhaseExerciseCard) {
  if (card.timerType === 'duration_min') {
    const done = Math.max(0, Math.round(Number(card.completedMinutes) || 0));
    const target = Math.max(0, Math.round(Number(card.durationMinutes) || 0));
    return target > 0 && done >= target;
  }
  const scheduleGroupVal = resolveScheduleGroupVal(card);
  if (scheduleGroupVal <= 0) return false;
  const target = resolveGroupTargetCount(card);
  return Array.from({ length: scheduleGroupVal }, (_, index) =>
    isGroupDisplayDone(index, card.groupCounts, target, card.completedGroups),
  ).every(Boolean);
}

/**
 * 单项是否已有进度（半完成）：
 * - 计时：已锻炼分钟 > 0（如目标 12 分已练 2 分）
 * - 组别：任一组次数 > 0（如 1/10、6/10、8/10）
 */
export function isTrainingActionProgressStarted(card: TrainingPhaseExerciseCard) {
  if (card.timerType === 'duration_min') {
    return Math.max(0, Math.round(Number(card.completedMinutes) || 0)) > 0;
  }
  if ((card.groupCounts ?? []).some(count => Math.max(0, Math.round(Number(count) || 0)) > 0)) {
    return true;
  }
  return (card.completedGroups ?? []).length > 0;
}

/** 主训练全部项目均至少有进度（半完成即可参与今日打卡） */
export function isMainTrainingAllProgressStarted(modules: MainTrainingTypeModule[]) {
  const cards = (modules ?? []).flatMap(module => module.cards ?? []);
  if (cards.length === 0) return false;
  return cards.every(isTrainingActionProgressStarted);
}

/**
 * 热身 / 主训练「开始」跳过判定：
 * - 计时：已提交过任意分钟（如 1/20）→ 跳过，播下一项
 * - 组别：每一组都提交过（次数>0 或已标记完成）→ 跳过；否则进入该项继续未完成组
 */
export function isTrainingPhaseItemSkipable(card: TrainingPhaseExerciseCard) {
  if (card.timerType === 'duration_min') {
    return Math.max(0, Math.round(Number(card.completedMinutes) || 0)) > 0;
  }
  const scheduleGroupVal = resolveScheduleGroupVal(card);
  if (scheduleGroupVal <= 0) {
    return isTrainingActionProgressStarted(card);
  }
  const target = resolveGroupTargetCount(card);
  const counts = card.groupCounts ?? [];
  return Array.from({ length: scheduleGroupVal }, (_, index) => {
    const count = Math.max(0, Math.round(Number(counts[index]) || 0));
    if (count > 0) return true;
    return isGroupDisplayDone(index, counts, target, card.completedGroups);
  }).every(Boolean);
}

/** @deprecated 使用 isTrainingPhaseItemSkipable */
export function isWarmupItemSkipable(card: TrainingPhaseExerciseCard) {
  return isTrainingPhaseItemSkipable(card);
}

/** 按顺序找第一个尚未跳过的项目（进入播放页） */
export function findNextTrainingPhasePlayCard<T extends TrainingPhaseExerciseCard>(
  cards: T[],
): T | null {
  return (cards ?? []).find(card => !isTrainingPhaseItemSkipable(card)) ?? null;
}

/** @deprecated 使用 findNextTrainingPhasePlayCard */
export function findNextWarmupPlayCard(cards: TrainingPhaseExerciseCard[]) {
  return findNextTrainingPhasePlayCard(cards);
}

/** 阶段内全部项目都已播放/提交过 */
export function isTrainingPhaseAllPlayed(cards: TrainingPhaseExerciseCard[]) {
  if (!cards.length) return true;
  return cards.every(isTrainingPhaseItemSkipable);
}

/** @deprecated 使用 isTrainingPhaseAllPlayed */
export function isWarmupPhaseAllPlayed(cards: TrainingPhaseExerciseCard[]) {
  return isTrainingPhaseAllPlayed(cards);
}

/** 主训练模块展平为播放顺序（按模块顺序 + 卡片顺序） */
export type MainTrainingPlayCard = TrainingPhaseExerciseCard & {
  exerciseType: ExerciseTypeKey;
};

export function flattenMainTrainingPlayCards(
  modules: MainTrainingTypeModule[],
): MainTrainingPlayCard[] {
  return (modules ?? []).flatMap(module =>
    (module.cards ?? []).map(card => ({
      ...card,
      exerciseType: module.key,
    })),
  );
}

/** 计时进度（如 1/2分钟、0/12分钟）不显示 icon，开始/完成才显示 */
export function shouldShowTrainingActionIcon(
  card: TrainingPhaseExerciseCard,
  options?: { dateMode?: TrainingActionDateMode },
) {
  const dateMode = options?.dateMode ?? 'today';
  if (dateMode === 'future') return true;
  if (isTrainingActionCompleted(card)) return true;

  if (card.timerType === 'duration_min') {
    // 过去未开始的 0/N、进行中的 N/M 都不显示 icon
    if (dateMode === 'past') return false;
    const done = Math.max(0, Math.round(Number(card.completedMinutes) || 0));
    return done <= 0;
  }

  // 组别：过去未完成也显示「开始」icon（置灰）
  return true;
}

/** 组序号文案：第1组、第2组… */
export function formatChineseGroupLabel(index: number) {
  const n = Math.round(index);
  if (!Number.isFinite(n) || n <= 0) return '第1组';
  return `第${n}组`;
}

function formatBodyPartText(parts?: string[], labelMap?: Record<string, string>) {
  if (!Array.isArray(parts) || parts.length === 0) return '';
  return parts
    .map(item => {
      const key = String(item).trim();
      if (!key) return '';
      return labelMap?.[key] ?? key;
    })
    .filter(Boolean)
    .join(' · ');
}

/** 加载运动部位字典 exercise_body_part → { dictValue: dictLabel } */
export async function loadExerciseBodyPartLabelMap(): Promise<Record<string, string>> {
  try {
    const res = await getDictDataByType(DICT_TYPES.exerciseBodyPart);
    if (!isResourceApiOk(res as unknown as { code?: number })) return {};
    return buildDictLabelMap(
      apiResourceData<DictDataItem[]>(
        res as unknown as { code?: number; data?: DictDataItem[] },
      ),
    );
  } catch {
    return {};
  }
}

function resolveDurationMinutes(item: ExWeekTrainingItem) {
  const fromTimer = Number(item.durationMinVal);
  if (Number.isFinite(fromTimer) && fromTimer > 0) return Math.round(fromTimer);
  const fromDuration = Number(item.duration);
  if (Number.isFinite(fromDuration) && fromDuration > 0) return Math.round(fromDuration);
  return 0;
}

async function fetchVideoInfo(exVideoId: string): Promise<ExVideoInfo | null> {
  try {
    const res = await getExVideoInfo(exVideoId);
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

export async function buildTrainingPhaseCards(
  items: ExWeekTrainingItem[] | undefined,
  bodyPartLabelMap?: Record<string, string>,
): Promise<TrainingPhaseExerciseCard[]> {
  const list = items ?? [];
  if (list.length === 0) return [];

  const [videos, labelMap] = await Promise.all([
    Promise.all(
      list.map(item => {
        const id = item.exVideoId != null ? String(item.exVideoId) : '';
        return id ? fetchVideoInfo(id) : Promise.resolve(null);
      }),
    ),
    bodyPartLabelMap
      ? Promise.resolve(bodyPartLabelMap)
      : loadExerciseBodyPartLabelMap(),
  ]);

  return list.map((item, index) => {
    const exVideoId = item.exVideoId != null ? String(item.exVideoId) : `idx-${index}`;
    const video = videos[index];
    const coverUrl = video?.coverOssUrl?.trim();
    const bodyPartText = formatBodyPartText(video?.exerciseBodyParts, labelMap);
    const ruleText = formatTrainingItemRuleText(item);
    return {
      key: `${exVideoId}-${index}`,
      exVideoId,
      title: video?.title?.trim() || '训练动作',
      ruleText: bodyPartText ? `${ruleText} · ${bodyPartText}` : ruleText,
      coverSource: coverUrl ? { uri: coverUrl } : DEFAULT_THUMB,
      durationMinutes: resolveDurationMinutes(item),
      kcal: Number.isFinite(Number(item.kcal)) ? Number(item.kcal) : 0,
      timerType: item.timerType?.trim() || '',
      groupVal: Number.isFinite(Number(item.groupVal)) ? Math.round(Number(item.groupVal)) : 0,
      numberVal: Number.isFinite(Number(item.numberVal)) ? Math.round(Number(item.numberVal)) : 0,
      keepSecondVal: Number.isFinite(Number(item.keepSecondVal))
        ? Math.round(Number(item.keepSecondVal))
        : 0,
      restBetweenGroupSeconds: Number.isFinite(Number(video?.restBetweenGroupSeconds))
        ? Math.round(Number(video?.restBetweenGroupSeconds))
        : 0,
      bodyPartText,
      completedGroups: [],
      groupCounts: [],
      completedMinutes: 0,
    };
  });
}

/** 为列表卡片批量回填当日完成组数 / 每组次数 */
export async function attachTrainingPhaseCompleteInfo(
  cards: TrainingPhaseExerciseCard[],
  options: {
    exPatientRuleId?: string | number | null;
    customerLocalDate: string;
    trainingPhase: ExRecordTrainingPhase;
    exerciseType?: string;
    patientUserId?: string | number | null;
  },
): Promise<TrainingPhaseExerciseCard[]> {
  const exPatientRuleId = options.exPatientRuleId != null
    ? String(options.exPatientRuleId).trim()
    : '';
  if (!exPatientRuleId || cards.length === 0) {
    return cards.map(card => {
      const totalGroups = resolveDurationSaveGroupTotal(
        resolveScheduleGroupVal(card),
        card.timerType,
      );
      const groupCounts = normalizeGroupCounts(card.groupCounts, totalGroups);
      const target = card.timerType === 'duration_min' ? 0 : resolveGroupTargetCount(card);
      return {
        ...card,
        groupCounts,
        completedGroups: resolveDisplayCompleteGroups(groupCounts, target, card.completedGroups),
        completedMinutes: Math.max(0, Math.round(Number(card.completedMinutes) || 0)),
      };
    });
  }

  const infos = await Promise.all(
    cards.map(card =>
      loadExRecordVideoCompleteInfo({
        exPatientRuleId,
        customerLocalDate: options.customerLocalDate,
        trainingPhase: options.trainingPhase,
        exerciseType: options.exerciseType,
        exVideoId: String(card.exVideoId),
        patientUserId: options.patientUserId,
      }),
    ),
  );

  return cards.map((card, index) => {
    const info = infos[index];
    const target = card.timerType === 'duration_min' ? 0 : resolveGroupTargetCount(card);
    const totalGroups = resolveDurationSaveGroupTotal(
      resolveScheduleGroupVal(card),
      card.timerType,
    );
    let groupCounts = normalizeGroupCounts(info?.complateGroupCounts, totalGroups);
    if (groupCounts.every(count => count <= 0)) {
      const legacyGroups = normalizeCompleteGroups(info?.complateGroups);
      if (legacyGroups.length > 0) {
        groupCounts = normalizeGroupCounts([], totalGroups);
        for (const groupNo of legacyGroups) {
          if (groupNo >= 1 && groupNo <= totalGroups) {
            groupCounts[groupNo - 1] = target > 0 ? target : 1;
          }
        }
      }
    }
    const completed = Number(info?.exerciseDuration);
    const fromGroupMinutes = groupCounts.reduce((sum, item) => sum + Math.max(0, item), 0);
    const completedMinutes = card.timerType === 'duration_min'
      ? (Number.isFinite(completed) && completed > 0
        ? Math.round(completed)
        : fromGroupMinutes)
      : (Number.isFinite(completed) && completed > 0 ? Math.round(completed) : 0);
    return {
      ...card,
      groupCounts,
      // complateGroups 为空时，按最后非0前的组推断已完成
      completedGroups: resolveDisplayCompleteGroups(groupCounts, target, info?.complateGroups),
      completedMinutes,
    };
  });
}

export function sumTrainingPhaseMinutes(cards: TrainingPhaseExerciseCard[]) {
  return cards.reduce((sum, item) => sum + Math.max(0, item.durationMinutes), 0);
}

export function formatWarmupBannerTitle(totalMinutes: number) {
  if (totalMinutes > 0) return `热身·${totalMinutes} 分钟`;
  return '热身·5–10 分钟';
}

export function formatCooldownBannerTitle(totalMinutes: number) {
  if (totalMinutes > 0) return `冷身放松·${totalMinutes} 分钟`;
  return '冷身放松·5–10 分钟';
}

function getDaySchedulePhase(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): { isRest: boolean; schedule: ExWeekTrainingSchedule | null } {
  const schedule = getWeekScheduleForDate(rule?.weekTrainingScheduleList, customerLocalDate);
  if (!schedule) return { isRest: false, schedule: null };
  if (schedule.isRest) return { isRest: true, schedule };
  return { isRest: false, schedule };
}

/** 指定日期是否为运动处方休息日 */
export function isExerciseRestDay(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
) {
  return getDaySchedulePhase(rule, customerLocalDate).isRest;
}

export function getWarmupHotList(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): { isRest: boolean; hotList: ExWeekTrainingItem[] } {
  const { isRest, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest) return { isRest: true, hotList: [] };
  return { isRest: false, hotList: schedule?.hotList ?? [] };
}

export function getCooldownColdList(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): { isRest: boolean; coldList: ExWeekTrainingItem[] } {
  const { isRest, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest) return { isRest: true, coldList: [] };
  return { isRest: false, coldList: schedule?.coldList ?? [] };
}

function mergeMainBlocks(blocks: ExWeekTrainingMainBlock[] | undefined) {
  const merged: Record<ExerciseTypeKey, ExWeekTrainingItem[]> = {
    cardio: [],
    strength: [],
    flexibility: [],
    balance: [],
  };
  for (const block of blocks ?? []) {
    merged.cardio.push(...(block.cardioList ?? []));
    merged.strength.push(...(block.strengthList ?? []));
    merged.flexibility.push(...(block.flexibilityList ?? []));
    merged.balance.push(...(block.balanceList ?? []));
  }
  return merged;
}

export async function buildMainTrainingModules(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
  patientUserId?: string | number | null,
): Promise<{ isRest: boolean; modules: MainTrainingTypeModule[] }> {
  const { isRest, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest) return { isRest: true, modules: [] };

  const merged = mergeMainBlocks(schedule?.mainList);
  const modules: MainTrainingTypeModule[] = [];
  const prescribedTypes = new Set(getPrescribedExerciseTypeKeys(rule));
  const typeOrder = prescribedTypes.size > 0
    ? MAIN_TYPE_ORDER.filter(typeKey => prescribedTypes.has(typeKey))
    : MAIN_TYPE_ORDER;
  const exPatientRuleId = rule?.exPatientRuleId;
  const bodyPartLabelMap = await loadExerciseBodyPartLabelMap();
  let strengthLevelMap: Record<string, string> = {};
  try {
    const strengthRes = await getDictDataByType(DICT_TYPES.strengthLevel);
    if (isResourceApiOk(strengthRes as unknown as { code?: number })) {
      strengthLevelMap = buildDictLabelMap(
        apiResourceData<DictDataItem[]>(
          strengthRes as unknown as { code?: number; data?: DictDataItem[] },
        ),
      );
    }
  } catch {
    strengthLevelMap = {};
  }

  for (const typeKey of typeOrder) {
    const items = merged[typeKey];
    if (!items.length) continue;
    const baseCards = await buildTrainingPhaseCards(items, bodyPartLabelMap);
    if (!baseCards.length) continue;
    const cards = await attachTrainingPhaseCompleteInfo(baseCards, {
      exPatientRuleId,
      customerLocalDate,
      trainingPhase: 'main',
      exerciseType: typeKey,
      patientUserId,
    });
    modules.push({
      key: typeKey,
      title: EXERCISE_TYPE_META[typeKey].title,
      icon: EXERCISE_TYPE_META[typeKey].icon,
      tipText: resolveMainTrainingModuleTipText(typeKey, rule, strengthLevelMap),
      cards,
    });
  }

  return { isRest: false, modules };
}

export function formatMainTrainingFittTipLines(rule?: InUseExPatientRule | null) {
  const ratios = rule?.ruleRatioList ?? [];
  const parts: string[] = [];
  for (const item of ratios) {
    const typeKey = item.exerciseType?.trim();
    if (!typeKey) continue;
    const fitt = item.fittVp ?? {};
    const f = String(fitt.F ?? fitt.frequency ?? '').trim();
    const i = String(fitt.I ?? fitt.intensity ?? '').trim();
    const t = String(fitt.T ?? fitt.time ?? '').trim();
    const v = String(fitt.V ?? fitt.volume ?? '').trim();
    const p = String(fitt.P ?? fitt.progression ?? '').trim();
    const label = EXERCISE_TYPE_META[typeKey as ExerciseTypeKey]?.title ?? typeKey;
    const detail = [
      f ? `F ${f}` : '',
      i ? `I ${i}` : '',
      t ? `T ${t}` : '',
      v ? `V ${v}` : '',
      p ? `P ${p}` : '',
    ]
      .filter(Boolean)
      .join('·');
    if (detail) parts.push(`${label}：${detail}`);
  }
  return parts.length > 0 ? parts : ['本方案依据 ACSM FITT-VP 框架制定，按处方执行即可。'];
}

export function formatMainTrainingFittTip(rule?: InUseExPatientRule | null) {
  return formatMainTrainingFittTipLines(rule).join('\n');
}

export function formatGoalMinutesText(minutes: number) {
  if (minutes <= 0) return '目标 --';
  return `目标${minutes}分钟`;
}

export function formatClockFromMinutes(minutes: number) {
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
