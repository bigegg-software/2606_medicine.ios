import moment from 'moment';
import type {
  AiMakeRemainCountByMealCategory,
  DietMealDayItem,
  DietMealItem,
  DietPatientRuleInfo,
} from '@/api/dietPatientRule';

export type MealRefreshPeriodKey = 'today' | 'thisWeek' | 'thisWeekAndNext';

/** 按日食谱异步强制更新完成（档案「立即更新」或换一换 V2 多日；仅 SSE，不落站内信） */
export const DIET_MEAL_DAY_ARCHIVE_REFRESH_TYPE = 'diet_meal_day_archive_refresh';
export const DIET_MEAL_DAY_ARCHIVE_REFRESH_EVENT = 'DIET_MEAL_DAY_ARCHIVE_REFRESH';

export type MealRefreshDateRange = {
  startDate: string;
  endDate: string;
};

function normalizeRemainCount(raw: unknown): number | null {
  const count = Number(raw);
  if (!Number.isFinite(count)) return null;
  return Math.max(0, Math.floor(count));
}

/**
 * 按餐次取换一换剩余次数。
 * mealCategory：1早餐 2午餐 3晚餐；加餐(4)忽略，返回 null。
 */
export function getMealCategoryRemainCount(
  counts: AiMakeRemainCountByMealCategory | null | undefined,
  mealCategory: number,
): number | null {
  if (!counts) return null;
  if (mealCategory === 1) return normalizeRemainCount(counts.breakfast);
  if (mealCategory === 2) return normalizeRemainCount(counts.lunch);
  if (mealCategory === 3) return normalizeRemainCount(counts.dinner);
  return null;
}

/** 按换一换周期计算 startDate / endDate（含），可裁剪至处方结束日 */
export function resolveMealRefreshDateRange(
  period: MealRefreshPeriodKey,
  options?: { today?: string; prescriptionEndDate?: string },
): MealRefreshDateRange {
  const today = options?.today?.trim() || moment().format('YYYY-MM-DD');
  const startDate = today;
  let endDate = today;

  if (period === 'thisWeek') {
    endDate = moment(today, 'YYYY-MM-DD').endOf('isoWeek').format('YYYY-MM-DD');
  } else if (period === 'thisWeekAndNext') {
    endDate = moment(today, 'YYYY-MM-DD').endOf('isoWeek').add(1, 'week').format('YYYY-MM-DD');
  }

  const prescriptionEnd = options?.prescriptionEndDate?.trim();
  if (prescriptionEnd && endDate > prescriptionEnd) {
    endDate = prescriptionEnd;
  }
  if (endDate < startDate) {
    endDate = startDate;
  }

  return { startDate, endDate };
}

/** 仅「今天」同步；「本周 / 本周及下周」一律异步（含周日选本周、日期区间退化为当天） */
export function isMealRefreshPeriodAsync(period: MealRefreshPeriodKey) {
  return period !== 'today';
}

/** 从 listMealDay 结果中取指定日期的餐次项 */
export function pickMealDayItem(
  mealDayList: DietMealDayItem[] | undefined,
  customerLocalDate: string,
): DietMealDayItem | undefined {
  const date = customerLocalDate.trim();
  if (!date || !mealDayList?.length) return undefined;
  return (
    mealDayList.find(item => item.customerLocalDate?.trim() === date)
    ?? (mealDayList.length === 1 ? mealDayList[0] : undefined)
  );
}

/** 从 listMealDay 结果中取指定日期的餐次（不再使用周模板 mealList） */
export function pickMealListFromMealDayList(
  mealDayList: DietMealDayItem[] | undefined,
  customerLocalDate: string,
): DietMealItem[] {
  return pickMealDayItem(mealDayList, customerLocalDate)?.mealList ?? [];
}

/** 用指定日期的按日食谱替换展示用 mealList / dietTags（无数据则为空，不回退老周模板） */
export function applyMealDayForDateToRule(
  rule: DietPatientRuleInfo,
  mealDayList: DietMealDayItem[] | undefined,
  customerLocalDate: string,
): DietPatientRuleInfo {
  const dayItem = pickMealDayItem(mealDayList, customerLocalDate);
  return {
    ...rule,
    mealList: dayItem?.mealList ?? [],
    dietTags: dayItem?.dietTags?.trim() || undefined,
  };
}
