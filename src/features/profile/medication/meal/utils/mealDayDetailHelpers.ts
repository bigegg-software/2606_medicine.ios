import moment from 'moment';
import {
  getMealDetailByMealId,
  getMealListByDate,
  type MealRecordDetail,
  type MealRecordItem,
} from '@/api/meal';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type MealDayDetailPayload = {
  meals: MealRecordItem[];
  foodDetails: MealDetailItem[];
  detailsByMealId: Record<string, MealDetailItem[]>;
};

function isMealCategoryRecord(meal: MealRecordItem) {
  const category = meal.mealCategory ?? 0;
  return category >= 1 && category <= 4;
}

function buildDetailsByMealId(
  meals: MealRecordItem[],
  foodDetails: MealDetailItem[],
): Record<string, MealDetailItem[]> {
  const detailMap: Record<string, MealDetailItem[]> = {};
  meals.forEach(meal => {
    if (meal.mealId == null || meal.mealId === '') return;
    const category = Number(meal.mealCategory);
    detailMap[String(meal.mealId)] = foodDetails.filter(
      item => Number(item.mealCategory) === category,
    );
  });
  return detailMap;
}

async function loadMealList(customerLocalDate: string): Promise<MealRecordItem[]> {
  const listRes = await getMealListByDate({ customerLocalDate });
  if (!isResourceApiOk(listRes)) return [];
  return (apiResourceData<MealRecordItem[]>(listRes as never) ?? [])
    .filter(isMealCategoryRecord)
    .sort((left, right) => (left.mealCategory ?? 0) - (right.mealCategory ?? 0));
}

async function loadTodayFoodDetails(): Promise<MealDetailItem[]> {
  const res = await getTodayMealDetailList();
  if (!isResourceApiOk(res as unknown as { code?: number })) return [];
  return (
    apiResourceData<MealDetailItem[]>(
      res as unknown as { code?: number; data?: MealDetailItem[] },
    ) ?? []
  );
}

async function loadHistoryFoodDetails(meals: MealRecordItem[]): Promise<{
  foodDetails: MealDetailItem[];
  detailsByMealId: Record<string, MealDetailItem[]>;
}> {
  const detailGroups = await Promise.all(
    meals.map(async meal => {
      if (meal.mealId == null || meal.mealId === '') {
        return { mealId: '', list: [] as MealDetailItem[] };
      }
      try {
        const detailRes = await getMealDetailByMealId(String(meal.mealId));
        if (!isResourceApiOk(detailRes)) {
          return { mealId: String(meal.mealId), list: [] as MealDetailItem[] };
        }
        const detail = apiResourceData<MealRecordDetail>(detailRes as never);
        return { mealId: String(meal.mealId), list: detail?.mealDetailList ?? [] };
      } catch {
        return { mealId: String(meal.mealId), list: [] as MealDetailItem[] };
      }
    }),
  );

  const detailsByMealId: Record<string, MealDetailItem[]> = {};
  detailGroups.forEach(group => {
    if (group.mealId) detailsByMealId[group.mealId] = group.list;
  });

  return {
    foodDetails: detailGroups.flatMap(group => group.list),
    detailsByMealId,
  };
}

/** 加载某日饮食详情；今日走单接口，避免 N+1 */
export async function loadMealDayDetailPayload(
  customerLocalDate: string,
): Promise<MealDayDetailPayload> {
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');

  if (isToday) {
    const [meals, foodDetails] = await Promise.all([
      loadMealList(customerLocalDate),
      loadTodayFoodDetails(),
    ]);
    return {
      meals,
      foodDetails,
      detailsByMealId: buildDetailsByMealId(meals, foodDetails),
    };
  }

  const meals = await loadMealList(customerLocalDate);
  if (meals.length === 0) {
    return { meals: [], foodDetails: [], detailsByMealId: {} };
  }
  const { foodDetails, detailsByMealId } = await loadHistoryFoodDetails(meals);
  return { meals, foodDetails, detailsByMealId };
}
