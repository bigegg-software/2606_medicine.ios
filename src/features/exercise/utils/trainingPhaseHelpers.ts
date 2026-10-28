import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import {
  buildDictLabelMap,
  DICT_TYPES,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import type { ExRecordTrainingPhase } from '@/api/exRecord';
import { getExVideoInfo, type ExVideoActionType, type ExVideoInfo } from '@/api/exVideo';

import type {
  ExWeekTrainingItem,
  ExWeekTrainingMainBlock,
  ExWeekTrainingSchedule,
} from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import store from '@/store/store';
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

const DEFAULT_TRAINING_THUMB_BY_KEY = {
  cardio: require('@/assets/images/exercise/thumb_cardio.png'),
  strength: require('@/assets/images/exercise/thumb_strength.png'),
  flexibility: require('@/assets/images/exercise/thumb_flexibility.png'),
  balance: require('@/assets/images/exercise/thumb_balance.png'),
  hot: require('@/assets/images/exercise/thumb_hot.png'),
  cold: require('@/assets/images/exercise/thumb_cold.png'),
} as const;

type DefaultTrainingThumbKey = keyof typeof DEFAULT_TRAINING_THUMB_BY_KEY;

/** 无封面时按训练类型 / 阶段使用默认缩略图 */
export function resolveDefaultTrainingThumb(
  key?: string | null,
): ImageSourcePropType {
  const normalized = String(key ?? '').trim() as DefaultTrainingThumbKey;
  if (normalized && DEFAULT_TRAINING_THUMB_BY_KEY[normalized]) {
    return DEFAULT_TRAINING_THUMB_BY_KEY[normalized];
  }
  return DEFAULT_TRAINING_THUMB_BY_KEY.cardio;
}

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
  /** 标签，英文逗号分割 */
  labels: string;
  /** 单次预计时长（秒）；group_number 估算用 */
  estimatedSingleSeconds: number;
  /** 当日已完成组号列表 */
  completedGroups: number[];
  /** 每组完成次数，下标 0 对应第 1 组 */
  groupCounts: number[];
  /** 当日该视频累计锻炼分钟 */
  completedMinutes: number;
  /** 接口原始 actionType（home / in_store / cert_unlock） */
  actionType?: string;
  /** 认证解锁组且未解锁：列表展示锁 +「待认证」，不可练习 */
  certPending?: boolean;
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

/** 下一个未完成组号（1-based）；全部完成返回 null */
export function resolveNextIncompleteGroupNo(card: TrainingPhaseExerciseCard) {
  const scheduleGroupVal = resolveScheduleGroupVal(card);
  if (scheduleGroupVal <= 0) return null;
  const target = resolveGroupTargetCount(card);
  for (let index = 0; index < scheduleGroupVal; index += 1) {
    if (!isGroupDisplayDone(index, card.groupCounts, target, card.completedGroups)) {
      return index + 1;
    }
  }
  return null;
}

/** 已完成组数（1-based 展示用，如完成第 1 组 → 1） */
export function resolveCompletedGroupCount(card: TrainingPhaseExerciseCard) {
  const scheduleGroupVal = resolveScheduleGroupVal(card);
  if (scheduleGroupVal <= 0) return 0;
  const target = resolveGroupTargetCount(card);
  let count = 0;
  for (let index = 0; index < scheduleGroupVal; index += 1) {
    if (isGroupDisplayDone(index, card.groupCounts, target, card.completedGroups)) {
      count += 1;
    }
  }
  return count;
}

/** 接口原始 actionType 是否为认证解锁组 */
export function isExVideoCertUnlock(actionType?: string | null) {
  const raw = String(actionType ?? '').trim().toLowerCase().replace(/-/g, '_');
  return raw === 'cert_unlock' || raw === 'certunlock';
}

/** 用户详情：认证解锁动作是否已有权限练习（1=已解锁） */
export function isCertUnlockActionUnlocked(value?: number | boolean | null) {
  return Number(value) === 1 || value === true;
}

/** 优先入参，否则取 getInfo → systemUser.certUnlockActionUnlocked */
export function resolveCertUnlockActionUnlocked(
  override?: number | boolean | null,
) {
  if (override !== undefined && override !== null) {
    return isCertUnlockActionUnlocked(override);
  }
  return isCertUnlockActionUnlocked(
    store.getState().user.systemUser?.certUnlockActionUnlocked,
  );
}

/** 列表项：认证解锁组且当前未解锁 */
export function isCertUnlockPending(card: Pick<TrainingPhaseExerciseCard, 'certPending'>) {
  return Boolean(card.certPending);
}

/**
 * 待认证项：教练端已全部完成 → 显示完成图标/文案
 * 仅有部分进度（如第1/2组）不走完成，走下方普通进度文案
 */
export function shouldShowCertUnlockAsCompleted(card: TrainingPhaseExerciseCard) {
  if (!isCertUnlockPending(card)) return false;
  return isTrainingActionCompleted(card);
}

/** 待认证但已有进度：不再显示锁/待认证，按普通进度（第1/2组）或完成展示 */
export function shouldBypassCertUnlockPending(card: TrainingPhaseExerciseCard) {
  if (!isCertUnlockPending(card)) return false;
  return isTrainingActionProgressStarted(card);
}

/** 右侧按钮图标：待认证用锁，否则完成/开始 */
export function resolveTrainingActionButtonIconSource(
  card: TrainingPhaseExerciseCard,
  actionCompleted: boolean,
): ImageSourcePropType {
  if (shouldShowCertUnlockAsCompleted(card)) {
    return require('@/assets/images/exercise/icon_wc.png');
  }
  if (isCertUnlockPending(card) && !shouldBypassCertUnlockPending(card)) {
    return require('@/assets/images/exercise/icon_lock.png');
  }
  return actionCompleted
    ? require('@/assets/images/exercise/icon_wc.png')
    : require('@/assets/images/exercise/icon_jsq.png');
}

export function formatTrainingActionButtonText(
  card: TrainingPhaseExerciseCard,
  options?: { dateMode?: TrainingActionDateMode },
) {
  // 无进度才显示待认证；有进度（含第1/2组）走普通进度/完成文案
  if (isCertUnlockPending(card) && !shouldBypassCertUnlockPending(card)) {
    return '待认证';
  }

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
  if (allDone) return '完成';
  // 过去未全部完成：统一展示「开始」（列表侧置灰不可点）
  if (dateMode === 'past') return '开始';
  // 有进度：显示已完成组数 / 总组数（完成第1组 → 第1/2组，不是下一组第2/2组）
  if (isTrainingActionProgressStarted(card)) {
    const completedCount = resolveCompletedGroupCount(card);
    const nextGroupNo = resolveNextIncompleteGroupNo(card);
    // 半完成当前组（尚未整组完成）时用当前组号；整组完成后用已完成数
    const displayNo =
      completedCount > 0 ? completedCount : (nextGroupNo ?? 0);
    if (displayNo > 0) {
      return `第${displayNo}/${scheduleGroupVal}组`;
    }
  }
  return '开始';
}

/** 非今日：仅「全部完成」可点进只读详情；未来与未完成均不可点（显示置灰开始）
 * 家人只读（今日）：同过去日规则，「开始」置灰不可点
 * 历史计划：disablePlayer 时全部不可进播放页
 */
export function canPressTrainingAction(
  card: TrainingPhaseExerciseCard,
  dateMode: TrainingActionDateMode = 'today',
  options?: { readOnly?: boolean; disablePlayer?: boolean },
) {
  if (isCertUnlockPending(card)) return false;
  if (options?.disablePlayer) return false;
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
 * 单项是否已有进度（半完成，可参与今日打卡）：
 * - 时长：已锻炼分钟 > 0（如 1/15）
 * - 时长×组 / 次×组 / 秒×组：任一组有进度（如 1/10、2/10）；全 0/10 不算
 */
export function isTrainingActionProgressStarted(card: TrainingPhaseExerciseCard) {
  if (card.timerType === 'duration_min') {
    if (Math.max(0, Math.round(Number(card.completedMinutes) || 0)) > 0) return true;
  }
  if ((card.groupCounts ?? []).some(count => Math.max(0, Math.round(Number(count) || 0)) > 0)) {
    return true;
  }
  return (card.completedGroups ?? []).length > 0;
}

/** 主训练全部项目均至少有进度（半完成即可参与今日打卡；待认证项不计入） */
export function isMainTrainingAllProgressStarted(modules: MainTrainingTypeModule[]) {
  const cards = (modules ?? [])
    .flatMap(module => module.cards ?? [])
    .filter(card => !isCertUnlockPending(card));
  if (cards.length === 0) return false;
  return cards.every(isTrainingActionProgressStarted);
}

/**
 * 热身 / 主训练「开始」跳过判定：
 * - 计时：已提交过任意分钟（如 1/20）→ 跳过，播下一项
 * - 组别：每一组都提交过（次数>0 或已标记完成）→ 跳过；否则进入该项继续未完成组
 */
export function isTrainingPhaseItemSkipable(card: TrainingPhaseExerciseCard) {
  // 未解锁认证动作：自动连播时跳过
  if (isCertUnlockPending(card)) return true;
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

/** 计时/组别进度文案不显示 icon，开始/完成/待认证才显示 */
export function shouldShowTrainingActionIcon(
  card: TrainingPhaseExerciseCard,
  options?: { dateMode?: TrainingActionDateMode },
) {
  if (shouldShowCertUnlockAsCompleted(card)) return true;
  if (isCertUnlockPending(card) && !shouldBypassCertUnlockPending(card)) return true;
  const dateMode = options?.dateMode ?? 'today';
  if (dateMode === 'future') return true;
  if (isTrainingActionCompleted(card)) return true;

  if (card.timerType === 'duration_min') {
    // 过去未开始的 0/N、进行中的 N/M 都不显示 icon
    if (dateMode === 'past') return false;
    const done = Math.max(0, Math.round(Number(card.completedMinutes) || 0));
    return done <= 0;
  }

  // 组别：进行中显示「第X/Y组」不带 icon；未开始/过去置灰「开始」带 icon
  if (dateMode === 'past') return true;
  return !isTrainingActionProgressStarted(card);
}

/** 组序号文案：第1组、第2组… */
export function formatChineseGroupLabel(index: number) {
  const n = Math.round(index);
  if (!Number.isFinite(n) || n <= 0) return '第1组';
  return `第${n}组`;
}

/** 部位/区域标签：仅展示字典命中项；匹配不上不回落原始 code */
function formatBodyPartText(parts?: string[], labelMap?: Record<string, string>) {
  if (!Array.isArray(parts) || parts.length === 0) return '';
  return parts
    .map(item => {
      const key = String(item).trim();
      if (!key) return '';
      return labelMap?.[key]?.trim() || '';
    })
    .filter(Boolean)
    .join(' · ');
}

/** 优先 regionBlock（逗号分割），兼容旧字段 exerciseBodyParts */
export function resolveExVideoBodyPartKeys(video?: ExVideoInfo | null): string[] {
  const block = String(video?.regionBlock ?? '').trim();
  if (block) {
    return block.split(/[,，]/).map(item => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(video?.exerciseBodyParts)) return [];
  return video.exerciseBodyParts.map(item => String(item).trim()).filter(Boolean);
}

async function loadDictLabelMap(dictType: string): Promise<Record<string, string>> {
  try {
    const res = await getDictDataByType(dictType);
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

/**
 * 锻炼部位字典：优先 region_block，空则回落 exercise_body_part
 */
export async function loadExerciseBodyPartLabelMap(): Promise<Record<string, string>> {
  const regionMap = await loadDictLabelMap(DICT_TYPES.regionBlock);
  if (Object.keys(regionMap).length > 0) return regionMap;
  return loadDictLabelMap(DICT_TYPES.exerciseBodyPart);
}

function resolveDurationMinutes(item: ExWeekTrainingItem) {
  const fromTimer = Number(item.durationMinVal);
  if (Number.isFinite(fromTimer) && fromTimer > 0) return Math.round(fromTimer);
  const fromDuration = Number(item.duration);
  if (Number.isFinite(fromDuration) && fromDuration > 0) return Math.round(fromDuration);
  return 0;
}

/** getInfo 成功码：与教练端一致，兼容 0 / 1 / 200 */
function isExVideoInfoResponseOk(res: { code?: number | string } | null | undefined) {
  if (res == null || res.code == null || res.code === '') return false;
  const code = Number(res.code);
  return code === 0 || code === 1 || code === 200;
}

function isExVideoInfoLike(row: Record<string, unknown>) {
  return (
    row.exVideoId != null
    || row.actionType != null
    || row.title != null
    || row.videoOssUrl != null
    || row.coverOssUrl != null
  );
}

/** 解析 getInfo 响应：兼容 {code,data} 或直接返回视频对象 */
export function pickExVideoInfo(res: unknown): ExVideoInfo | null {
  if (!res || typeof res !== 'object') return null;
  const row = res as Record<string, unknown>;
  if (row.data != null && typeof row.data === 'object' && !Array.isArray(row.data)) {
    const data = row.data as Record<string, unknown>;
    // 标准成功码，或 data 已是视频详情时兜底（避免 code 形态差异导致到店筛选全空）
    if (isExVideoInfoResponseOk(res as { code?: number | string }) || isExVideoInfoLike(data)) {
      return data as ExVideoInfo;
    }
    return null;
  }
  // 已解包的视频详情
  if (isExVideoInfoLike(row)) {
    return res as ExVideoInfo;
  }
  return null;
}

const exVideoInfoCache = new Map<string, ExVideoInfo>();

function hasUsableActionType(info?: ExVideoInfo | null) {
  return Boolean(info?.actionType != null && String(info.actionType).trim());
}

async function fetchVideoInfo(exVideoId: string): Promise<ExVideoInfo | null> {
  const id = String(exVideoId ?? '').trim();
  if (!id) return null;
  const cached = exVideoInfoCache.get(id);
  // 无 actionType 的旧缓存会把到店视频误判为居家，需重拉
  if (cached && hasUsableActionType(cached)) return cached;
  try {
    const res = await getExVideoInfo(id);
    const info = pickExVideoInfo(res);
    // 仅缓存成功结果，避免一次失败永久挡住到店筛选
    if (info) exVideoInfoCache.set(id, info);
    return info ?? cached ?? null;
  } catch {
    return cached ?? null;
  }
}

/**
 * 根据视频 actionType 归类居家 / 到店：
 * - in_store → 到店
 * - home / cert_unlock（认证解锁组归居家）/ 空 / 未知 → 居家
 */
export function resolveExVideoActionType(actionType?: string | null): ExVideoActionType {
  const raw = String(actionType ?? '').trim().toLowerCase().replace(/-/g, '_');
  if (raw === 'in_store' || raw === 'instore') return 'in_store';
  return 'home';
}

/** 是否到店动作（actionType=in_store） */
export function isExVideoInStore(actionType?: string | null) {
  return resolveExVideoActionType(actionType) === 'in_store';
}

function mainBlockHasNestedLists(row: Record<string, unknown> | null | undefined) {
  if (!row || typeof row !== 'object') return false;
  return [
    row.cardioList,
    row.flexibilityList,
    row.strengthList,
    row.balanceList,
    row.cardio,
    row.flexibility,
    row.strength,
    row.balance,
  ].some(list => Array.isArray(list) && list.length > 0);
}

function normalizeMainBlocks(mainList: unknown): ExWeekTrainingMainBlock[] {
  if (!mainList) return [];
  if (Array.isArray(mainList)) {
    if (mainList.length === 0) return [];
    const first = mainList[0] as Record<string, unknown> | null;
    // 兼容 mainList 直接是动作数组（带 exVideoId；空数组字段不能误判成分块）
    if (
      first
      && typeof first === 'object'
      && first.exVideoId != null
      && !mainBlockHasNestedLists(first)
    ) {
      return [{ flexibilityList: mainList as ExWeekTrainingItem[] }];
    }
    return mainList as ExWeekTrainingMainBlock[];
  }
  if (typeof mainList === 'object') {
    return [mainList as ExWeekTrainingMainBlock];
  }
  return [];
}

function collectMainBlockItems(block: ExWeekTrainingMainBlock | null | undefined): ExWeekTrainingItem[] {
  if (!block) return [];
  const row = block as ExWeekTrainingMainBlock & {
    cardio?: ExWeekTrainingItem[];
    strength?: ExWeekTrainingItem[];
    flexibility?: ExWeekTrainingItem[];
    balance?: ExWeekTrainingItem[];
  };
  return [
    ...(row.cardioList ?? row.cardio ?? []),
    ...(row.strengthList ?? row.strength ?? []),
    ...(row.flexibilityList ?? row.flexibility ?? []),
    ...(row.balanceList ?? row.balance ?? []),
  ];
}

/** 汇总某日课表全部动作（热身 + 主训 + 冷身） */
export function collectDayScheduleTrainingItems(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): {
  isRest: boolean;
  isPostponedAway: boolean;
  items: ExWeekTrainingItem[];
} {
  const { isRest, isPostponedAway, hotList } = getWarmupHotList(rule, customerLocalDate);
  if (isRest || isPostponedAway) {
    return { isRest, isPostponedAway, items: [] };
  }
  const schedule = getWeekScheduleForDate(rule?.weekTrainingScheduleList, customerLocalDate);
  const { coldList } = getCooldownColdList(rule, customerLocalDate);
  const mainItems = normalizeMainBlocks(schedule?.mainList).flatMap(collectMainBlockItems);
  return {
    isRest: false,
    isPostponedAway: false,
    items: [...hotList, ...mainItems, ...(coldList ?? [])],
  };
}

export async function buildTrainingPhaseCards(
  items: ExWeekTrainingItem[] | undefined,
  bodyPartLabelMap?: Record<string, string>,
  options?: {
    defaultThumbKey?: string | null;
    /** 按视频 actionType 过滤；默认不过滤 */
    actionType?: ExVideoActionType;
    /** 覆盖用户详情中的认证解锁状态（默认读 systemUser） */
    certUnlockActionUnlocked?: number | boolean | null;
  },
): Promise<TrainingPhaseExerciseCard[]> {
  const list = items ?? [];
  if (list.length === 0) return [];

  const defaultThumb = resolveDefaultTrainingThumb(options?.defaultThumbKey);
  const actionFilter = options?.actionType;
  const certUnlocked = resolveCertUnlockActionUnlocked(options?.certUnlockActionUnlocked);

  const [videos, labelMap] = await Promise.all([
    Promise.all(
      list.map(item => {
        const id = item.exVideoId != null ? String(item.exVideoId).trim() : '';
        return id ? fetchVideoInfo(id) : Promise.resolve(null);
      }),
    ),
    bodyPartLabelMap
      ? Promise.resolve(bodyPartLabelMap)
      : loadExerciseBodyPartLabelMap(),
  ]);

  return list.flatMap((item, index) => {
    const video = videos[index];
    // 优先详情 actionType；空字符串视为无效，回退课表项；仍无则按居家
    const resolvedActionType = hasUsableActionType(video)
      ? video?.actionType
      : item.actionType;
    if (
      actionFilter
      && resolveExVideoActionType(resolvedActionType) !== actionFilter
    ) {
      return [];
    }
    const actionTypeRaw = String(resolvedActionType ?? '').trim();
    const exVideoId = item.exVideoId != null ? String(item.exVideoId) : `idx-${index}`;
    const coverUrl = video?.coverOssUrl?.trim();
    const bodyPartKeys = resolveExVideoBodyPartKeys(video);
    // 仅展示字典已翻译的标签；匹配不上的不显示，动作本身仍正常展示
    const bodyPartText = formatBodyPartText(bodyPartKeys, labelMap);
    const ruleText = formatTrainingItemRuleText(item);
    return [{
      key: `${exVideoId}-${index}`,
      exVideoId,
      title: video?.title?.trim() || '训练动作',
      ruleText: bodyPartText ? `${ruleText} · ${bodyPartText}` : ruleText,
      coverSource: coverUrl ? { uri: coverUrl } : defaultThumb,
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
      labels: video?.labels?.trim() || '',
      estimatedSingleSeconds: Number.isFinite(Number(video?.estimatedSingleSeconds))
        ? Math.round(Number(video?.estimatedSingleSeconds))
        : 0,
      completedGroups: [],
      groupCounts: [],
      completedMinutes: 0,
      actionType: actionTypeRaw || undefined,
      certPending: isExVideoCertUnlock(actionTypeRaw) && !certUnlocked,
    }];
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

/** 单动作预估分钟：duration_min 用时长；group_number 用单次秒×次数×组；keep_second 用秒×组 */
export function resolveCardEstimatedMinutes(card: TrainingPhaseExerciseCard): number {
  const timerType = card.timerType?.trim() || '';
  const groupVal = Math.round(Number(card.groupVal) || 0);
  const sets = groupVal > 0 ? groupVal : 1;

  if (timerType === 'group_number') {
    const perRep = Math.round(Number(card.estimatedSingleSeconds) || 0);
    const times = Math.round(Number(card.numberVal) || 0);
    if (perRep > 0 && times > 0) {
      return (perRep * times * sets) / 60;
    }
    return 0;
  }

  if (timerType === 'keep_second_number') {
    const seconds = Math.round(Number(card.keepSecondVal) || 0);
    if (seconds > 0) return (seconds * sets) / 60;
    return 0;
  }

  return Math.max(0, Number(card.durationMinutes) || 0);
}

export function sumTrainingPhaseMinutes(cards: TrainingPhaseExerciseCard[]) {
  const total = cards.reduce((sum, item) => sum + resolveCardEstimatedMinutes(item), 0);
  return Math.max(0, Math.round(total));
}

/** 居家自主训练摘要：热身 + 主训 + 冷身总时长与动作数（一视频一动作） */
export function formatMainTrainingSummaryText(cards: TrainingPhaseExerciseCard[]) {
  const count = cards.length;
  if (count <= 0) return '暂无训练动作';
  const minutes = sumTrainingPhaseMinutes(cards);
  return `约${minutes}分钟 · ${count}个动作`;
}

export function formatWarmupBannerTitle(totalMinutes: number) {
  if (totalMinutes > 0) return `热身·${totalMinutes} 分钟`;
  return '热身·5–10 分钟';
}

export function formatCooldownBannerTitle(totalMinutes: number) {
  if (totalMinutes > 0) return `冷身放松·${totalMinutes} 分钟`;
  return '冷身放松·5–10 分钟';
}

/** 课表开关：兼容 true / 1 / "1"（接口偶发数字或字符串） */
function isScheduleFlagOn(value?: number | boolean | string | null) {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0' || value == null || value === '') return false;
  const num = Number(value);
  return Number.isFinite(num) ? num === 1 : false;
}

function getDaySchedulePhase(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): {
  isRest: boolean;
  isPostponedAway: boolean;
  schedule: ExWeekTrainingSchedule | null;
} {
  const schedule = getWeekScheduleForDate(rule?.weekTrainingScheduleList, customerLocalDate);
  if (!schedule) return { isRest: false, isPostponedAway: false, schedule: null };
  // 被顺延腾空日优先于休息日文案
  if (isScheduleFlagOn(schedule.isPostponedAway)) {
    return { isRest: false, isPostponedAway: true, schedule };
  }
  if (isScheduleFlagOn(schedule.isRest as number | boolean | string | null | undefined)) {
    return { isRest: true, isPostponedAway: false, schedule };
  }
  return { isRest: false, isPostponedAway: false, schedule };
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
): { isRest: boolean; isPostponedAway: boolean; hotList: ExWeekTrainingItem[] } {
  const { isRest, isPostponedAway, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest || isPostponedAway) return { isRest, isPostponedAway, hotList: [] };
  return { isRest: false, isPostponedAway: false, hotList: schedule?.hotList ?? [] };
}

export function getCooldownColdList(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): { isRest: boolean; isPostponedAway: boolean; coldList: ExWeekTrainingItem[] } {
  const { isRest, isPostponedAway, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest || isPostponedAway) return { isRest, isPostponedAway, coldList: [] };
  return { isRest: false, isPostponedAway: false, coldList: schedule?.coldList ?? [] };
}

function mergeMainBlocks(blocks: ExWeekTrainingMainBlock[] | unknown) {
  const merged: Record<ExerciseTypeKey, ExWeekTrainingItem[]> = {
    cardio: [],
    strength: [],
    flexibility: [],
    balance: [],
  };
  for (const block of normalizeMainBlocks(blocks)) {
    const row = block as ExWeekTrainingMainBlock & {
      cardio?: ExWeekTrainingItem[];
      strength?: ExWeekTrainingItem[];
      flexibility?: ExWeekTrainingItem[];
      balance?: ExWeekTrainingItem[];
    };
    merged.cardio.push(...(row.cardioList ?? row.cardio ?? []));
    merged.strength.push(...(row.strengthList ?? row.strength ?? []));
    merged.flexibility.push(...(row.flexibilityList ?? row.flexibility ?? []));
    merged.balance.push(...(row.balanceList ?? row.balance ?? []));
  }
  return merged;
}

export async function buildMainTrainingModules(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
  patientUserId?: string | number | null,
  options?: { certUnlockActionUnlocked?: number | boolean | null },
): Promise<{ isRest: boolean; isPostponedAway: boolean; modules: MainTrainingTypeModule[] }> {
  const { isRest, isPostponedAway, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest || isPostponedAway) return { isRest, isPostponedAway, modules: [] };

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
    const baseCards = await buildTrainingPhaseCards(items, bodyPartLabelMap, {
      defaultThumbKey: typeKey,
      actionType: 'home',
      certUnlockActionUnlocked: options?.certUnlockActionUnlocked,
    });
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

  return { isRest: false, isPostponedAway: false, modules };
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
