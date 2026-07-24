export const VITAL_LEVEL_COLORS = {
  /** 正常 / 达标 */
  normal: { color: '#6D925E', backgroundColor: 'rgba(109,146,94,0.14)' },
  /** 较差 / 待改善 / 正常高值 / 偏高 */
  mild: { color: '#EE9C44', backgroundColor: 'rgba(238,156,68,0.14)' },
  /** 与 mild 同色（中度归入待改善档） */
  moderate: { color: '#EE9C44', backgroundColor: 'rgba(238,156,68,0.14)' },
  /** 异常偏高 */
  severe: { color: '#FB4550', backgroundColor: 'rgba(251,69,80,0.13)' },
  /** 偏低 */
  low: { color: '#72A1C5', backgroundColor: 'rgba(114,161,197,0.13)' },
  empty: { color: '#999999', backgroundColor: 'transparent' },
} as const;

export type VitalLevelTier = keyof typeof VITAL_LEVEL_COLORS;

export function getVitalLevelTier(label: string): VitalLevelTier {
  if (!label) return 'empty';

  if (/未达标|偏少|较差|待改善|一般/.test(label)) return 'mild';
  if (/^(已)?达标$|进行中/.test(label)) return 'normal';
  if (/低血糖|低血压|偏低|偏瘦|低体温/.test(label)) return 'low';
  if (/重度|严重|红色|危险|急症|高风险|糖尿病|发热|高热|肥胖/.test(label)) return 'severe';
  if (/中度|橙色/.test(label)) return 'moderate';
  if (/异常偏高|异常/.test(label)) return 'severe';
  if (/正常高值|轻度|黄色|偏高|边缘升高|升高|临界升高|超重/.test(label)) return 'mild';
  if (/正常|理想|良好|极佳/.test(label)) return 'normal';

  if (/高血压/.test(label)) return 'mild';

  return 'mild';
}

export function getLevelColor(label: string) {
  return VITAL_LEVEL_COLORS[getVitalLevelTier(label)].color;
}

export function getLevelBgColor(label: string) {
  return VITAL_LEVEL_COLORS[getVitalLevelTier(label)].backgroundColor;
}
