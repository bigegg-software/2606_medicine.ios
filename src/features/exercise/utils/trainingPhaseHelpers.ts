import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import type { ExRecordTrainingPhase } from '@/api/exRecord';
import { getExVideoInfo, type ExVideoInfo } from '@/api/exVideo';
import type {
  ExWeekTrainingItem,
  ExWeekTrainingMainBlock,
  ExWeekTrainingSchedule,
} from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { EXERCISE_TYPE_META, type ExerciseTypeKey } from './prescriptionHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  loadExRecordVideoCompleteInfo,
  normalizeCompleteGroups,
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

/** 列表副标题：类型在前，组数在后（不含部位） */
export function formatTrainingPhaseSubtitle(card: TrainingPhaseExerciseCard) {
  if (card.timerType === 'group_number') {
    if (card.numberVal > 0 && card.groupVal > 0) {
      return `${card.numberVal}次 x ${card.groupVal}组`;
    }
    if (card.numberVal > 0) return `${card.numberVal}次`;
    if (card.groupVal > 0) return `${card.groupVal}组`;
  }
  if (card.timerType === 'keep_second_number') {
    if (card.keepSecondVal > 0 && card.groupVal > 0) {
      return `${card.keepSecondVal}秒 x ${card.groupVal}组`;
    }
    if (card.keepSecondVal > 0 && card.numberVal > 0) {
      return `${card.keepSecondVal}秒 x ${card.numberVal}组`;
    }
    if (card.keepSecondVal > 0) return `${card.keepSecondVal}秒`;
  }
  if (card.timerType === 'duration_min' && card.durationMinutes > 0) {
    if (card.groupVal > 0) {
      return `${card.durationMinutes}分钟 x ${card.groupVal}组`;
    }
    return `${card.durationMinutes}分钟`;
  }
  return card.ruleText.split(' · ')[0] || '--';
}

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 组序号文案：第一组、第二组… */
export function formatChineseGroupLabel(index: number) {
  const n = Math.round(index);
  if (!Number.isFinite(n) || n <= 0) return '第一组';
  if (n < 10) return `第${CN_DIGITS[n]}组`;
  if (n === 10) return '第十组';
  if (n < 20) return `第十${CN_DIGITS[n - 10]}组`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones === 0
      ? `第${CN_DIGITS[tens]}十组`
      : `第${CN_DIGITS[tens]}十${CN_DIGITS[ones]}组`;
  }
  return `第${n}组`;
}

function formatBodyPartText(parts?: string[]) {
  if (!Array.isArray(parts) || parts.length === 0) return '';
  return parts.map(item => String(item).trim()).filter(Boolean).join(' · ');
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
): Promise<TrainingPhaseExerciseCard[]> {
  const list = items ?? [];
  if (list.length === 0) return [];

  const videos = await Promise.all(
    list.map(item => {
      const id = item.exVideoId != null ? String(item.exVideoId) : '';
      return id ? fetchVideoInfo(id) : Promise.resolve(null);
    }),
  );

  return list.map((item, index) => {
    const exVideoId = item.exVideoId != null ? String(item.exVideoId) : `idx-${index}`;
    const video = videos[index];
    const coverUrl = video?.coverOssUrl?.trim();
    const bodyPartText = formatBodyPartText(video?.exerciseBodyParts);
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
    };
  });
}

/** 为列表卡片批量回填当日完成组数 */
export async function attachTrainingPhaseCompleteInfo(
  cards: TrainingPhaseExerciseCard[],
  options: {
    exPatientRuleId?: string | number | null;
    customerLocalDate: string;
    trainingPhase: ExRecordTrainingPhase;
    exerciseType?: string;
  },
): Promise<TrainingPhaseExerciseCard[]> {
  const exPatientRuleId = options.exPatientRuleId != null
    ? String(options.exPatientRuleId).trim()
    : '';
  if (!exPatientRuleId || cards.length === 0) {
    return cards.map(card => ({
      ...card,
      completedGroups: normalizeCompleteGroups(card.completedGroups),
    }));
  }

  const infos = await Promise.all(
    cards.map(card =>
      loadExRecordVideoCompleteInfo({
        exPatientRuleId,
        customerLocalDate: options.customerLocalDate,
        trainingPhase: options.trainingPhase,
        exerciseType: options.exerciseType,
        exVideoId: String(card.exVideoId),
      }),
    ),
  );

  return cards.map((card, index) => ({
    ...card,
    completedGroups: normalizeCompleteGroups(infos[index]?.complateGroups),
  }));
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
): Promise<{ isRest: boolean; modules: MainTrainingTypeModule[] }> {
  const { isRest, schedule } = getDaySchedulePhase(rule, customerLocalDate);
  if (isRest) return { isRest: true, modules: [] };

  const merged = mergeMainBlocks(schedule?.mainList);
  const modules: MainTrainingTypeModule[] = [];
  const exPatientRuleId = rule?.exPatientRuleId;

  for (const typeKey of MAIN_TYPE_ORDER) {
    const items = merged[typeKey];
    if (!items.length) continue;
    const baseCards = await buildTrainingPhaseCards(items);
    if (!baseCards.length) continue;
    const cards = await attachTrainingPhaseCompleteInfo(baseCards, {
      exPatientRuleId,
      customerLocalDate,
      trainingPhase: 'main',
      exerciseType: typeKey,
    });
    modules.push({
      key: typeKey,
      title: EXERCISE_TYPE_META[typeKey].title,
      icon: EXERCISE_TYPE_META[typeKey].icon,
      tipText: MAIN_TYPE_TIP[typeKey] ?? '',
      cards,
    });
  }

  return { isRest: false, modules };
}

export function formatMainTrainingFittTip(rule?: InUseExPatientRule | null) {
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
  return parts.join('\n') || '本方案依据 ACSM FITT-VP 框架制定，按处方执行即可。';
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
