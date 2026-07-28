import type { ImageSourcePropType } from 'react-native';
import type { DayNutritionSummary } from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import type { NutritionDisplay } from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import { formatNutritionInteger } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';

export type NutritionGoalItemView = {
  key: string;
  title: string;
  color: string;
  icon: ImageSourcePropType;
  valueText: string;
  targetText: string;
  unit: string;
  progress: number;
  display: NutritionDisplay;
};

export type NutritionGoalStatusStyle = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};

const STATUS_STYLE_MAP: Record<string, NutritionGoalStatusStyle> = {
  明显不足: {
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
  达标: {
    color: '#6D925E',
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderColor: 'rgba(109,146,94,0.3)',
  },
  偏低: {
    color: '#EE9C44',
    backgroundColor: 'rgba(238,156,68,0.06)',
    borderColor: 'rgba(238,156,68,0.3)',
  },
  基本达标: {
    color: '#56A2D8',
    backgroundColor: 'rgba(86,162,216,0.06)',
    borderColor: 'rgba(86,162,216,0.3)',
  },
  偏高: {
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
  未达标: {
    color: '#FB4550',
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
};

export function getNutritionGoalStatusStyle(label: string): NutritionGoalStatusStyle {
  return STATUS_STYLE_MAP[label] ?? STATUS_STYLE_MAP['明显不足'];
}

const MEAL_SECTION_ICONS: Record<number, ImageSourcePropType> = {
  1: require('@/assets/images/schedule/zc.png'),
  2: require('@/assets/images/schedule/wwc.png'),
  3: require('@/assets/images/schedule/ws.png'),
  4: require('@/assets/images/schedule/wc.png'),
};

export function getMealSectionIcon(category: number): ImageSourcePropType {
  return MEAL_SECTION_ICONS[category] ?? MEAL_SECTION_ICONS[1];
}

export function buildNutritionGoalItems(summary: DayNutritionSummary): NutritionGoalItemView[] {
  return [
    {
      key: 'calorie',
      title: '热量',
      color: '#6D925E',
      icon: require('@/assets/images/nutrition/icon_rl.png'),
      valueText: formatNutritionInteger(summary.calories),
      targetText: summary.targetCalories != null ? String(summary.targetCalories) : '--',
      unit: '千卡',
      progress: summary.calorieProgress,
      display: summary.calorieDisplay,
    },
    {
      key: 'protein',
      title: '蛋白质',
      color: '#0951AE',
      icon: require('@/assets/images/nutrition/icon_dbz.png'),
      valueText: formatNutritionInteger(summary.protein),
      targetText: summary.targetProtein != null ? String(summary.targetProtein) : '--',
      unit: 'g',
      progress: summary.proteinProgress,
      display: summary.proteinDisplay,
    },
    {
      key: 'carbs',
      title: '碳水',
      color: '#72A1C5',
      icon: require('@/assets/images/nutrition/icon_ts.png'),
      valueText: formatNutritionInteger(summary.carbs),
      targetText: summary.targetCarbs != null ? String(summary.targetCarbs) : '--',
      unit: 'g',
      progress: summary.carbsProgress,
      display: summary.carbsDisplay,
    },
    {
      key: 'fat',
      title: '脂肪',
      color: '#FB4550',
      icon: require('@/assets/images/nutrition/icon_zf.png'),
      valueText: formatNutritionInteger(summary.fat),
      targetText: summary.targetFat != null ? String(summary.targetFat) : '--',
      unit: 'g',
      progress: summary.fatProgress,
      display: summary.fatDisplay,
    },
  ];
}
