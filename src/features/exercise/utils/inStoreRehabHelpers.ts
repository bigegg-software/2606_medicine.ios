import { getExVideoInfo } from '@/api/exVideo';
import type { ExWeekTrainingItem, ExWeekTrainingSchedule } from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildTrainingPhaseCards,
  getCooldownColdList,
  getWarmupHotList,
  getWeekScheduleForDate,
  resolveExVideoActionType,
  type TrainingPhaseExerciseCard,
} from './trainingPhaseHelpers';

/** labels 英文逗号 → 展示用间隔符 */
export function formatInStoreRehabLabels(labels?: string | null): string {
  const parts = String(labels ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '--';
}

function isScheduleFlagOn(value?: number | boolean | null) {
  return value === true || Number(value) === 1;
}

function collectScheduleItems(schedule: ExWeekTrainingSchedule | null | undefined): ExWeekTrainingItem[] {
  if (!schedule) return [];
  const mainItems: ExWeekTrainingItem[] = [];
  for (const block of schedule.mainList ?? []) {
    mainItems.push(
      ...(block.cardioList ?? []),
      ...(block.strengthList ?? []),
      ...(block.flexibilityList ?? []),
      ...(block.balanceList ?? []),
    );
  }
  return [...(schedule.hotList ?? []), ...mainItems, ...(schedule.coldList ?? [])];
}

function collectDayTrainingItems(
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
  const mainItems: ExWeekTrainingItem[] = [];
  for (const block of schedule?.mainList ?? []) {
    mainItems.push(
      ...(block.cardioList ?? []),
      ...(block.strengthList ?? []),
      ...(block.flexibilityList ?? []),
      ...(block.balanceList ?? []),
    );
  }
  return {
    isRest: false,
    isPostponedAway: false,
    items: [...hotList, ...mainItems, ...(coldList ?? [])],
  };
}

async function fetchVideoActionIsInStore(exVideoId: string): Promise<boolean> {
  try {
    const res = await getExVideoInfo(exVideoId);
    if (!isResourceApiOk(res as unknown as { code?: number })) return false;
    const data = apiResourceData(res as unknown as { code?: number; data?: { actionType?: string } });
    return resolveExVideoActionType(data?.actionType) === 'in_store';
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

/** 本周到店建议文案 */
export function formatWeeklyInStoreTip(count: number): string {
  if (count <= 0) return '本周暂无到店安排';
  return `建议每周到店${count}次`;
}

/** 当日到店专项视频列表（actionType=in_store） */
export async function buildInStoreRehabCards(
  rule: InUseExPatientRule | null | undefined,
  customerLocalDate: string,
): Promise<{
  isRest: boolean;
  isPostponedAway: boolean;
  cards: TrainingPhaseExerciseCard[];
}> {
  const { isRest, isPostponedAway, items } = collectDayTrainingItems(rule, customerLocalDate);
  if (isRest || isPostponedAway || items.length === 0) {
    return { isRest, isPostponedAway, cards: [] };
  }
  const cards = await buildTrainingPhaseCards(items, undefined, {
    defaultThumbKey: 'main',
    actionType: 'in_store',
  });
  return { isRest: false, isPostponedAway: false, cards };
}
