import { getBmiCategory } from '../detail/helpers/weight';

export function parseMeasureBmi(bmi?: number | string | null) {
  const value = Number(bmi);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function formatMeasureBmi(bmi?: number | string | null) {
  const value = parseMeasureBmi(bmi);
  if (value == null) return '--';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** 按 BMI 区间计算等级：偏瘦 / 正常 / 超重 / 肥胖 */
export function getMeasureBmiLevelLabel(bmi?: number | string | null) {
  const value = parseMeasureBmi(bmi);
  if (value == null) return '--';
  return getBmiCategory(value);
}
