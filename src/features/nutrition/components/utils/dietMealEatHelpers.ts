import {
  getMealIsEatByDateRange,
  type MealIsEatByDateItem,
} from '@/api/meal';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import moment from 'moment';

export const MEAL_EAT_LEGEND = [
  { category: 1 as const, label: '早餐', color: '#6D925E' },
  { category: 2 as const, label: '午餐', color: '#EE9C44' },
  { category: 3 as const, label: '晚餐', color: '#0951AE' },
] as const;

export type DayMealEatFlags = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

export type MealEatMap = Record<string, DayMealEatFlags>;

const EMPTY_FLAGS: DayMealEatFlags = {
  breakfast: false,
  lunch: false,
  dinner: false,
};

function applyCategoryExists(
  map: MealEatMap,
  items: MealIsEatByDateItem[] | undefined,
  field: keyof DayMealEatFlags,
) {
  (items ?? []).forEach(item => {
    const date = item.customerLocalDate?.trim();
    if (!date) return;
    const prev = map[date] ?? { ...EMPTY_FLAGS };
    map[date] = {
      ...prev,
      [field]: Boolean(item.exists),
    };
  });
}

/**
 * 按年计算请求区间：当年/往年 → 1.1–12.31；未来年不请求。
 */
export function getMealEatYearRange(year: number, today = moment()) {
  if (!Number.isFinite(year)) return null;
  if (year > today.year()) return null;
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

/** 拉取早/午/晚在日期范围内的用餐记录标记 */
export async function loadMealEatMapByDateRange(
  startDate: string,
  endDate: string,
): Promise<MealEatMap> {
  const map: MealEatMap = {};
  try {
    const [breakfastRes, lunchRes, dinnerRes] = await Promise.all([
      getMealIsEatByDateRange({ mealCategory: 1, startDate, endDate }),
      getMealIsEatByDateRange({ mealCategory: 2, startDate, endDate }),
      getMealIsEatByDateRange({ mealCategory: 3, startDate, endDate }),
    ]);

    if (isResourceApiOk(breakfastRes as unknown as { code?: number })) {
      applyCategoryExists(
        map,
        apiResourceData<MealIsEatByDateItem[]>(
          breakfastRes as unknown as { code?: number; data?: MealIsEatByDateItem[] },
        ),
        'breakfast',
      );
    }
    if (isResourceApiOk(lunchRes as unknown as { code?: number })) {
      applyCategoryExists(
        map,
        apiResourceData<MealIsEatByDateItem[]>(
          lunchRes as unknown as { code?: number; data?: MealIsEatByDateItem[] },
        ),
        'lunch',
      );
    }
    if (isResourceApiOk(dinnerRes as unknown as { code?: number })) {
      applyCategoryExists(
        map,
        apiResourceData<MealIsEatByDateItem[]>(
          dinnerRes as unknown as { code?: number; data?: MealIsEatByDateItem[] },
        ),
        'dinner',
      );
    }
  } catch {
    /* ignore */
  }
  return map;
}

/** 按年懒加载餐次记录（未来年直接跳过） */
export async function loadMealEatMapByYear(year: number): Promise<MealEatMap | null> {
  const range = getMealEatYearRange(year);
  if (!range) return null;
  return loadMealEatMapByDateRange(range.startDate, range.endDate);
}

export function getDayMealEatDots(flags?: DayMealEatFlags | null): string[] {
  if (!flags) return [];
  const colors: string[] = [];
  if (flags.breakfast) colors.push(MEAL_EAT_LEGEND[0].color);
  if (flags.lunch) colors.push(MEAL_EAT_LEGEND[1].color);
  if (flags.dinner) colors.push(MEAL_EAT_LEGEND[2].color);
  return colors;
}
