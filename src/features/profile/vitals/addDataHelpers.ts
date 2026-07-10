export const BLOOD_SUGAR_MEASURE_STATUS_LIST = ['空腹', '餐前', '餐后2小时', '睡前', '凌晨'] as const;

export type BloodSugarMeasureStatusUi = typeof BLOOD_SUGAR_MEASURE_STATUS_LIST[number];

type BloodSugarReferenceCategory = 'fasting' | 'postMeal' | 'bedtime' | 'dawn';

export function toBloodSugarMeasureStatusLabel(status?: string | null) {
  if (status === '餐后') return '餐后2小时';
  if (BLOOD_SUGAR_MEASURE_STATUS_LIST.includes(status as BloodSugarMeasureStatusUi)) {
    return status as BloodSugarMeasureStatusUi;
  }
  return '餐前';
}

export function toBloodSugarMeasureStatusValue(status: string) {
  if (status === '餐后2小时') return '餐后';
  return status;
}

function getBloodSugarReferenceCategory(status: string): BloodSugarReferenceCategory {
  if (status === '餐后2小时' || status === '餐后') return 'postMeal';
  if (status === '睡前') return 'bedtime';
  if (status === '凌晨') return 'dawn';
  return 'fasting';
}

export function getBloodSugarReferenceLines(status: string) {
  switch (getBloodSugarReferenceCategory(status)) {
    case 'postMeal':
      return [
        '正常：<7.8 mmol/L',
        '偏高：7.8-11.0 mmol/L',
        '高风险：≥11.1 mmol/L',
      ];
    case 'bedtime':
      return [
        '偏低：<5.6 mmol/L',
        '正常：5.6-7.8 mmol/L',
        '偏高：7.9-10.0 mmol/L',
        '高风险：>10.0 mmol/L',
      ];
    case 'dawn':
      return [
        '偏低：<3.9 mmol/L',
        '正常：3.9-5.6 mmol/L',
        '偏高：5.7-7.0 mmol/L',
        '高风险：>7.0 mmol/L',
      ];
    case 'fasting':
    default:
      return [
        '偏低：<3.9 mmol/L',
        '正常：3.9-6.0 mmol/L',
        '偏高：6.1-6.9 mmol/L',
        '高风险：≥7.0 mmol/L',
      ];
  }
}

export function getBloodPressureReferenceLines() {
  return [
    '正常:90-119 / 60-79 mmHg',
    '正常高值:120-139 / 80-89',
    '轻度高血压:140-159 / 90-99',
    '中度高血压:160-179 / 100-109',
    '重度高血压:≥180 / ≥110',
    '低血压：<90 / <60',
  ];
}

export const BLOOD_PRESSURE_INPUT_MAX_LENGTH = 5;

export function sanitizeBloodPressureInput(text: string) {
  let sanitized = text.replace(/[^\d.]/g, '');
  const dotIndex = sanitized.indexOf('.');
  if (dotIndex >= 0) {
    const intPart = sanitized.slice(0, dotIndex);
    const decPart = sanitized.slice(dotIndex + 1).replace(/\./g, '').slice(0, 1);
    sanitized = decPart.length > 0 || sanitized.endsWith('.')
      ? `${intPart}.${decPart}`
      : intPart;
  }
  return sanitized.slice(0, BLOOD_PRESSURE_INPUT_MAX_LENGTH);
}

export function formatBloodPressureEditValue(value: number | undefined) {
  if (value == null) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return parseFloat(num.toFixed(1)).toString();
}
