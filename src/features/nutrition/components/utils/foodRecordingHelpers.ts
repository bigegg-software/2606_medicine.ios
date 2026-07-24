import type { MealAllRecordDayItem, MealExecutionStatistics, MealExecutionTrendItem } from '@/api/meal';
import type { NutritionTrendItem } from '../NutritionTrendChart';
import moment from 'moment';
import {
  formatDayListSubtitle,
  formatMealHistoryRate,
  getDayComplianceDisplay,
  getPrescriptionDateRange,
  getTrendDateRange,
  normalizeComplianceRate,
} from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import type { DietPatientRuleInfo } from '@/api/dietPatientRule';

export type FoodRecordingRateTone = 'ok' | 'warn' | 'bad';

export type FoodRecordingRateCard = {
  key: string;
  title: string;
  valueText: string;
  statusLabel: string;
  tone: FoodRecordingRateTone;
};

/** 达标率状态：≥90 达标，≥80 基本达标，≥60 偏低，其余明显不足 */
export function getFoodRecordingRateStatus(rate?: number | null): {
  label: string;
  tone: FoodRecordingRateTone;
} {
  const value = normalizeComplianceRate(rate);
  if (value >= 90) return { label: '达标', tone: 'ok' };
  if (value >= 80) return { label: '基本达标', tone: 'warn' };
  if (value >= 60) return { label: '偏低', tone: 'warn' };
  return { label: '明显不足', tone: 'bad' };
}

export function formatFoodRecordingRate(rate?: number | null) {
  return `${formatMealHistoryRate(normalizeComplianceRate(rate))}%`;
}

export function buildFoodRecordingRateCards(
  statistics?: MealExecutionStatistics | null,
): FoodRecordingRateCard[] {
  const items = [
    { key: 'calorie', title: '热量达标率', rate: statistics?.calorieComplianceRate },
    { key: 'protein', title: '蛋白质达标率', rate: statistics?.proteinComplianceRate },
    { key: 'carbs', title: '碳水达标率', rate: statistics?.carbsComplianceRate },
    { key: 'fat', title: '脂肪达标率', rate: statistics?.fatComplianceRate },
  ] as const;

  return items.map(item => {
    const status = getFoodRecordingRateStatus(item.rate);
    return {
      key: item.key,
      title: item.title,
      valueText: formatFoodRecordingRate(item.rate),
      statusLabel: status.label,
      tone: status.tone,
    };
  });
}

export function mapExecutionTrendToChart(
  trendList?: MealExecutionTrendItem[] | null,
): NutritionTrendItem[] {
  return (trendList ?? [])
    .map(item => ({
      date: item.date?.trim() || '',
      caloriesRate: normalizeComplianceRate(item.energyRate),
      proteinRate: normalizeComplianceRate(item.proteinRate),
      carbsRate: normalizeComplianceRate(item.carbsRate),
      fatRate: normalizeComplianceRate(item.fatRate),
    }))
    .filter(item => item.date);
}

export function resolveFoodRecordingOverallRange(rule?: DietPatientRuleInfo | null) {
  return getPrescriptionDateRange(rule);
}

export function resolveFoodRecordingTrendRange(range: 7 | 30) {
  return getTrendDateRange(range === 7 ? '7' : '30');
}

/** 05/12 周一 */
export function formatFoodRecordingDayTitle(date?: string) {
  const parsed = moment(date, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return date?.trim() || '--';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${parsed.format('MM/DD')} ${weekdays[parsed.day()]}`;
}

/** 3餐·1380千卡 */
export function formatFoodRecordingDaySubtitle(day: MealAllRecordDayItem) {
  return formatDayListSubtitle(day).replace(/\s*·\s*/, '·');
}

export function getFoodRecordingDayStatus(day?: MealAllRecordDayItem | null): {
  label: string;
  tone: FoodRecordingRateTone;
} | null {
  const compliance = getDayComplianceDisplay(day);
  if (!compliance) return null;
  if (compliance.label === '达标') return { label: '达标', tone: 'ok' };
  if (compliance.label === '偏低' || compliance.label === '基本达标' || compliance.label === '偏高') {
    return { label: compliance.label === '基本达标' ? '偏低' : compliance.label, tone: 'warn' };
  }
  return { label: '明显不足', tone: 'bad' };
}
