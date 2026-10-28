import { getExVideoInfo } from '@/api/exVideo';
import type { ExWeekTrainingItem, ExWeekTrainingSchedule } from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { resolveExerciseDayRule } from './exerciseRuleDateHelpers';
import {
  buildTrainingPhaseCards,
  collectDayScheduleTrainingItems,
  isExVideoInStore,
  pickExVideoInfo,
  type TrainingPhaseExerciseCard,
} from './trainingPhaseHelpers';

/** labels 英文逗号 → 展示用间隔符；无标签时用到店默认文案 */
export function formatInStoreRehabLabels(labels?: string | null): string {
  const parts = String(labels ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '器械辅助·需要老师在场';
}

/**
 * 到店日课表：与居家一致（快照优先，无周课表时回退进行中处方，保证休息日 isRest 不丢）。
 * 列表仍按选中日过滤，不会把其它天的到店动作汇总进来。
 */
export function resolveInStoreDayRule(
  snapshot: InUseExPatientRule | null | undefined,
  inUseRule: InUseExPatientRule | null | undefined,
): InUseExPatientRule | null {
  return resolveExerciseDayRule(snapshot, inUseRule);
}

function isScheduleFlagOn(value?: number | boolean | string | null) {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0' || value == null || value === '') return false;
  const num = Number(value);
  return Number.isFinite(num) ? num === 1 : false;
}

function scheduleBlockHasNestedLists(row: Record<string, unknown> | null | undefined) {
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

function collectMainListsFromSchedule(schedule: ExWeekTrainingSchedule): ExWeekTrainingItem[] {
  const mainList = schedule.mainList as unknown;
  if (!mainList) return [];
  if (Array.isArray(mainList)) {
    if (mainList.length === 0) return [];
    const first = mainList[0] as Record<string, unknown> | null;
    if (
      first
      && typeof first === 'object'
      && first.exVideoId != null
      && !scheduleBlockHasNestedLists(first)
    ) {
      return mainList as ExWeekTrainingItem[];
    }
    return (mainList as Array<{
      cardioList?: ExWeekTrainingItem[];
      strengthList?: ExWeekTrainingItem[];
      flexibilityList?: ExWeekTrainingItem[];
      balanceList?: ExWeekTrainingItem[];
      cardio?: ExWeekTrainingItem[];
      strength?: ExWeekTrainingItem[];
      flexibility?: ExWeekTrainingItem[];
      balance?: ExWeekTrainingItem[];
    }>).flatMap(block => [
      ...(block.cardioList ?? block.cardio ?? []),
      ...(block.strengthList ?? block.strength ?? []),
      ...(block.flexibilityList ?? block.flexibility ?? []),
      ...(block.balanceList ?? block.balance ?? []),
    ]);
  }
  if (typeof mainList === 'object') {
    const block = mainList as {
      cardioList?: ExWeekTrainingItem[];
      strengthList?: ExWeekTrainingItem[];
      flexibilityList?: ExWeekTrainingItem[];
      balanceList?: ExWeekTrainingItem[];
      cardio?: ExWeekTrainingItem[];
      strength?: ExWeekTrainingItem[];
      flexibility?: ExWeekTrainingItem[];
      balance?: ExWeekTrainingItem[];
    };
    return [
      ...(block.cardioList ?? block.cardio ?? []),
      ...(block.strengthList ?? block.strength ?? []),
      ...(block.flexibilityList ?? block.flexibility ?? []),
      ...(block.balanceList ?? block.balance ?? []),
    ];
  }
  return [];
}

function collectScheduleItems(schedule: ExWeekTrainingSchedule | null | undefined): ExWeekTrainingItem[] {
  if (!schedule) return [];
  return [
    ...(schedule.hotList ?? []),
    ...collectMainListsFromSchedule(schedule),
    ...(schedule.coldList ?? []),
  ];
}

async function fetchVideoActionIsInStore(exVideoId: string): Promise<boolean> {
  try {
    const res = await getExVideoInfo(exVideoId);
    return isExVideoInStore(pickExVideoInfo(res)?.actionType);
  } catch {
    return false;
  }
}

/**
 * 统计周课表（day 1–7）中含到店视频的天数。
 * 休息日 / 被顺延腾空日不计。
 */
export async function countWeeklyInStoreDays(
  rule: InUseExPatientRule | null | undefined,
): Promise<number> {
  const list = rule?.weekTrainingScheduleList ?? [];
  const dayVideoIds: string[][] = [];
  const uniqueIds = new Set<string>();

  for (let day = 1; day <= 7; day += 1) {
    const schedule = list.find(item => Number(item.day) === day) ?? null;
    if (!schedule || isScheduleFlagOn(schedule.isRest) || isScheduleFlagOn(schedule.isPostponedAway)) {
      dayVideoIds.push([]);
      continue;
    }
    const ids = collectScheduleItems(schedule)
      .map(item => (item.exVideoId != null ? String(item.exVideoId).trim() : ''))
      .filter(Boolean);
    dayVideoIds.push(ids);
    ids.forEach(id => uniqueIds.add(id));
  }

  if (uniqueIds.size === 0) return 0;

  const inStoreMap = new Map<string, boolean>();
  await Promise.all(
    [...uniqueIds].map(async id => {
      inStoreMap.set(id, await fetchVideoActionIsInStore(id));
    }),
  );

  return dayVideoIds.reduce((sum, ids) => {
    if (ids.some(id => inStoreMap.get(id))) return sum + 1;
    return sum;
  }, 0);
}

/** 本周到店建议文案：安排 N 次展示 (N-1)-N，最低 1-2 次 */
export function formatWeeklyInStoreTip(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const high = Math.max(2, safe);
  const low = Math.max(1, high - 1);
  return `建议每周到店${low}-${high}次`;
}

/**
 * 当日到店专项视频列表（actionType=in_store；休息日 / 顺延日 / 当日无到店为空）。
 * 与右上角日历选中日联动，不跨天汇总。
 */
export async function buildInStoreRehabCards(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate?: string,
): Promise<{
  isRest: boolean;
  isPostponedAway: boolean;
  cards: TrainingPhaseExerciseCard[];
}> {
  const date = String(customerLocalDate ?? '').trim();
  const { isRest, isPostponedAway, items } = collectDayScheduleTrainingItems(rule, date);
  if (isRest || isPostponedAway || items.length === 0) {
    return { isRest, isPostponedAway, cards: [] };
  }
  const cards = await buildTrainingPhaseCards(items, undefined, {
    defaultThumbKey: 'main',
    actionType: 'in_store',
  });
  return { isRest: false, isPostponedAway: false, cards };
}
