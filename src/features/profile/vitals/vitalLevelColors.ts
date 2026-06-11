export const VITAL_LEVEL_COLORS = {
  normal: { color: '#00C950', backgroundColor: 'rgba(0,201,80,0.14)' },
  mild: { color: '#CF9A00', backgroundColor: 'rgba(247,210,102,0.13)' },
  moderate: { color: '#F57132', backgroundColor: 'rgba(245,113,50,0.13)' },
  severe: { color: '#D80010', backgroundColor: 'rgba(216,0,16,0.13)' },
  low: { color: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.13)' },
  empty: { color: '#999999', backgroundColor: 'transparent' },
} as const;

export type VitalLevelTier = keyof typeof VITAL_LEVEL_COLORS;

export function getVitalLevelTier(label: string): VitalLevelTier {
  if (!label) return 'empty';

  if (/低血糖|低血压|偏低/.test(label)) return 'low';
  if (/重度|严重|红色|危险|急症|高风险|糖尿病|发热|高热/.test(label)) return 'severe';
  if (/中度|橙色/.test(label)) return 'moderate';
  if (/正常高值|轻度|黄色|偏高|边缘升高|升高/.test(label)) return 'mild';
  if (/正常|理想/.test(label)) return 'normal';

  if (/高血压|异常/.test(label)) return 'mild';

  return 'mild';
}

export function getLevelColor(label: string) {
  return VITAL_LEVEL_COLORS[getVitalLevelTier(label)].color;
}

export function getLevelBgColor(label: string) {
  return VITAL_LEVEL_COLORS[getVitalLevelTier(label)].backgroundColor;
}
