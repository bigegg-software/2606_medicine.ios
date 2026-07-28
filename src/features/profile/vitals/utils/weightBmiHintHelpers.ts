import { calcBmiFromWeight } from '../detail/helpers/weight';

export function formatWeightBmiHintText(
  weightText: string,
  heightCm?: number | string | null,
) {
  const height = Number(heightCm);
  const heightLabel = Number.isFinite(height) && height > 0 ? String(Math.round(height)) : '--';
  const weight = Number(weightText);
  const bmi = Number.isFinite(weight) && weight > 0
    ? calcBmiFromWeight(weight, Number.isFinite(height) && height > 0 ? height : null)
    : null;
  return `根据您的身高${heightLabel}cm计算为：${bmi != null ? String(bmi) : '--'}`;
}
