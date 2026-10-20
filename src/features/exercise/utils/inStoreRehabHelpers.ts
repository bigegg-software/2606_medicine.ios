import { getExVideoInfo } from '@/api/exVideo';
import type { ExWeekTrainingItem, ExWeekTrainingSchedule } from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import {
  buildTrainingPhaseCards,
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
 * 到店日课表：快照优先；快照为空或无 weekTrainingScheduleList 时回退进行中处方
 *（与居家 TrainingPage `rule ?? inUseRule` 对齐，并补课表缺失场景）
 */
export function resolveInStoreDayRule(
  snapshot: InUseExPatientRule | null | undefined,
  inUseRule: InUseExPatientRule | null | undefined,
): InUseExPatientRule | null {
  const snap = snapshot ?? null;
  const inUse = inUseRule ?? null;
  const snapHasSchedule = (snap?.weekTrainingScheduleList?.length ?? 0) > 0;
  if (snapHasSchedule) return snap;
  const inUseHasSchedule = (inUse?.weekTrainingScheduleList?.length ?? 0) > 0;
  if (inUseHasSchedule) {
    if (!snap) return inUse;
    return {
      ...inUse,
      ...snap,
      weekTrainingScheduleList: inUse.weekTrainingScheduleList,
    };
  }
  return snap ?? inUse;
}

function isScheduleFlagOn(value?: number | boolean | null) {
  return value === true || Number(value) === 1;
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
    // mainList 直接是动作数组（空数组字段不能误判成分块）
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
    if (!schedule || schedule.isRest || isScheduleFlagOn(schedule.isPostponedAway)) {
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
 * 汇总周课表全部动作（跳过休息日 / 被顺延腾空日），按 exVideoId 去重。
 * 到店 Tab 日历收起后仍按「本周专项」展示，避免只取当天导致列表一直为空。
 */
export function collectWeekScheduleTrainingItems(
  rule: InUseExPatientRule | null | undefined,
): ExWeekTrainingItem[] {
  const list = rule?.weekTrainingScheduleList ?? [];
  const seen = new Set<string>();
  const items: ExWeekTrainingItem[] = [];

  for (let day = 1; day <= 7; day += 1) {
    const schedule = list.find(item => Number(item.day) === day) ?? null;
    if (!schedule || schedule.isRest || isScheduleFlagOn(schedule.isPostponedAway)) {
      continue;
    }
    for (const row of collectScheduleItems(schedule)) {
      const id = row.exVideoId != null ? String(row.exVideoId).trim() : '';
      if (!id || seen.has(id)) continue;
      seen.add(id);
      items.push(row);
    }
  }
  return items;
}

/** 本周到店专项视频列表（actionType=in_store；按周去重） */
export async function buildInStoreRehabCards(
  rule: InUseExPatientRule | null | undefined,
  _customerLocalDate?: string,
): Promise<{
  isRest: boolean;
  isPostponedAway: boolean;
  cards: TrainingPhaseExerciseCard[];
}> {
  const items = collectWeekScheduleTrainingItems(rule);
  if (items.length === 0) {
    return { isRest: false, isPostponedAway: false, cards: [] };
  }
  const cards = await buildTrainingPhaseCards(items, undefined, {
    defaultThumbKey: 'main',
    actionType: 'in_store',
  });
  return { isRest: false, isPostponedAway: false, cards };
}
