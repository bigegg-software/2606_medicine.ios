import type { DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getInUseDietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  calcNutritionPercent,
  calcNutritionProgress,
  getCalorieNutritionDisplay,
  getProteinNutritionDisplay,
} from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  formatNutritionInteger,
  sumCalories,
  sumCarbs,
  sumFat,
  sumProtein,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
  FAMILY_MEAL_NUTRITION_ITEMS,
  type FamilyMealNutritionItem,
  type FamilyMealStatusKey,
} from './familyDataHelpers';

function toFamilyMealStatus(label: string): FamilyMealStatusKey {
  if (label === '达标') return '达标';
  if (label === '基本达标') return '基本达标';
  if (label === '偏低') return '偏低';
  if (label === '偏高') return '偏高';
  if (label === '未达标') return '未达标';
  if (label === '明显不足') return '明显不足';
  return '明显不足';
}

function emptyMealItem(base: FamilyMealNutritionItem): FamilyMealNutritionItem {
  return {
    ...base,
    currentValue: '--',
    targetValue: base.key === 'calorie' ? '--千卡' : '--克',
    progress: 0,
    status: '明显不足',
  };
}

export function emptyFamilyMealNutritionItems(): FamilyMealNutritionItem[] {
  return FAMILY_MEAL_NUTRITION_ITEMS.map(emptyMealItem);
}

/** 拉取指定家人今日用餐营养进度（X-Patient-User-Id） */
export async function loadFamilyMealNutritionItems(
  patientUserId: string,
): Promise<FamilyMealNutritionItem[]> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyMealNutritionItems();

  try {
    const [ruleRes, mealRes] = await Promise.all([
      getInUseDietPatientRuleInfo({ patientUserId: id }),
      getTodayMealDetailList({ patientUserId: id }),
    ]);

    const rule = isResourceApiOk(ruleRes as { code?: number })
      ? apiResourceData<DietPatientRuleInfo>(ruleRes as { data?: DietPatientRuleInfo })
      : null;
    const meals = isResourceApiOk(mealRes as { code?: number })
      ? (apiResourceData<MealDetailItem[]>(mealRes as { data?: MealDetailItem[] }) ?? [])
      : [];
    const list = Array.isArray(meals) ? meals : [];

    const currentCalories = sumCalories(list);
    const currentProtein = sumProtein(list);
    const currentCarbs = sumCarbs(list);
    const currentFat = sumFat(list);

    const targetCalories = rule?.targetCalories;
    const targetProtein = rule?.targetProtein;
    const targetCarbs = rule?.targetCarbs;
    const targetFat = rule?.targetFat;

    const caloriePercent = calcNutritionPercent(currentCalories, targetCalories);
    const proteinPercent = calcNutritionPercent(currentProtein, targetProtein);
    const carbsPercent = calcNutritionPercent(currentCarbs, targetCarbs);
    const fatPercent = calcNutritionPercent(currentFat, targetFat);

    const byKey: Record<string, Omit<FamilyMealNutritionItem, 'key' | 'title' | 'titleColor' | 'progressColor' | 'icon'>> = {
      calorie: {
        currentValue: formatNutritionInteger(currentCalories),
        targetValue: targetCalories != null ? `${formatNutritionInteger(targetCalories)}千卡` : '--千卡',
        progress: calcNutritionProgress(currentCalories, targetCalories),
        status: toFamilyMealStatus(getCalorieNutritionDisplay(caloriePercent).label),
      },
      protein: {
        currentValue: formatNutritionInteger(currentProtein),
        targetValue: targetProtein != null ? `${formatNutritionInteger(targetProtein)}克` : '--克',
        progress: calcNutritionProgress(currentProtein, targetProtein),
        status: toFamilyMealStatus(getProteinNutritionDisplay(proteinPercent).label),
      },
      carbs: {
        currentValue: formatNutritionInteger(currentCarbs),
        targetValue: targetCarbs != null ? `${formatNutritionInteger(targetCarbs)}克` : '--克',
        progress: calcNutritionProgress(currentCarbs, targetCarbs),
        status: toFamilyMealStatus(getProteinNutritionDisplay(carbsPercent).label),
      },
      fat: {
        currentValue: formatNutritionInteger(currentFat),
        targetValue: targetFat != null ? `${formatNutritionInteger(targetFat)}克` : '--克',
        progress: calcNutritionProgress(currentFat, targetFat),
        status: toFamilyMealStatus(getProteinNutritionDisplay(fatPercent).label),
      },
    };

    return FAMILY_MEAL_NUTRITION_ITEMS.map(item => ({
      ...item,
      ...(byKey[item.key] ?? emptyMealItem(item)),
    }));
  } catch {
    return emptyFamilyMealNutritionItems();
  }
}
