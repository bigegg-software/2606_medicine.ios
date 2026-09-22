import type { ExWeekTrainingItem } from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';
import {
  buildTrainingPhaseCards,
  getCooldownColdList,
  getWarmupHotList,
  getWeekScheduleForDate,
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
