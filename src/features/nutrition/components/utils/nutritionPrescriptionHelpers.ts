import type { ImageSourcePropType } from 'react-native';
import type {
  DietPatientRuleInfo,
  NutritionPersonReportResult,
} from '@/api/dietPatientRule';

export type PrescriptionNutrientItem = {
  key: 'protein' | 'carb' | 'fat';
  title: string;
  color: string;
  icon: ImageSourcePropType;
  progress: number;
  amountText: string;
  grams: number;
  desc: string;
};

export type PrescriptionDietMode = {
  code: string;
  title: string;
  reasoning: string;
  strategy: string;
};

export type PrescriptionMacroSource = {
  key: string;
  title: string;
  icon: ImageSourcePropType;
  desc: string;
  tags: string[];
};

export type PrescriptionAdviceItem = {
  key: string;
  title: string;
  tips: string[];
  icon: ImageSourcePropType;
  background: ImageSourcePropType;
  color: string;
  dotColor: string;
  defaultExpanded: boolean;
};

export type PrescriptionMonitorCard = {
  key: string;
  /** 生活方式建议 | 药物与监测 */
  group: 'lifestyle' | 'monitor';
  title: string;
  icon: ImageSourcePropType;
  badge: string | null;
  text: string;
  colors: readonly [string, string, string];
};

const NUTRIENT_META = {
  protein: {
    title: '蛋白质',
    color: '#0951AE',
    icon: require('@/assets/images/nutrition/dbz.png'),
  },
  carb: {
    title: '碳水',
    color: '#72A1C5',
    icon: require('@/assets/images/nutrition/ts.png'),
  },
  fat: {
    title: '脂肪',
    color: '#FB4550',
    icon: require('@/assets/images/nutrition/zf.png'),
  },
} as const;

const ADVICE_VISUALS = [
  {
    icon: require('@/assets/images/nutrition/icon_zc.png'),
    background: require('@/assets/images/nutrition/back1.png'),
    color: '#886D47',
    dotColor: '#694F2B',
  },
  {
    icon: require('@/assets/images/nutrition/icon_hx.png'),
    background: require('@/assets/images/nutrition/back2.png'),
    color: '#666666',
    dotColor: '#81796F',
  },
  {
    icon: require('@/assets/images/nutrition/icon_gz.png'),
    background: require('@/assets/images/nutrition/back3.png'),
    color: '#608847',
    dotColor: '#48692B',
  },
] as const;

const MACRO_ICON_BY_NAME: Array<{ match: RegExp; icon: ImageSourcePropType; key: string }> = [
  { match: /蛋白|protein/i, icon: require('@/assets/images/nutrition/dbz.png'), key: 'protein' },
  { match: /碳水|糖|carb/i, icon: require('@/assets/images/nutrition/ts.png'), key: 'carb' },
  { match: /脂肪|fat/i, icon: require('@/assets/images/nutrition/zf.png'), key: 'fat' },
];

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parsePercent(value?: string | number | null) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  if (typeof value !== 'string') return 0;
  const matched = value.match(/(\d+(?:\.\d+)?)/);
  if (!matched) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(matched[1]))));
}

function formatGrams(value?: number | null) {
  const num = toNumber(value);
  if (num <= 0) return '--';
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10);
}

function splitTips(text?: string | null) {
  const raw = text?.trim() ?? '';
  if (!raw) return [] as string[];
  return raw
    .split(/\n+|；|;|。/)
    .map(item => item.trim())
    .filter(Boolean);
}

function splitTags(text?: string | null) {
  const raw = text?.trim() ?? '';
  if (!raw) return [] as string[];

  const openers = new Set(['(', '（', '[', '【', '{', '「', '『']);
  const closerToOpeners: Record<string, string[]> = {
    ')': ['(', '（'],
    '）': ['（', '('],
    ']': ['[', '【'],
    '】': ['【', '['],
    '}': ['{'],
    '」': ['「'],
    '』': ['『'],
  };
  const separators = new Set(['、', ',', '，', ';', '；', '/', '｜', '|', '\n', '\r']);

  const tags: string[] = [];
  let current = '';
  const stack: string[] = [];

  const pushCurrent = () => {
    const value = current.replace(/\s+/g, ' ').trim();
    if (value) tags.push(value);
    current = '';
  };

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (openers.has(char)) {
      stack.push(char);
      current += char;
      continue;
    }

    const matchedOpeners = closerToOpeners[char];
    if (matchedOpeners?.length && stack.length) {
      const top = stack[stack.length - 1];
      if (matchedOpeners.includes(top)) {
        stack.pop();
        current += char;
        continue;
      }
    }

    if (separators.has(char) && stack.length === 0) {
      pushCurrent();
      continue;
    }
    current += char;
  }
  pushCurrent();

  return tags.slice(0, 12);
}

function resolveReport(rule?: DietPatientRuleInfo | null): NutritionPersonReportResult | null {
  return rule?.nutritionPersonReportResult ?? null;
}

export function buildPrescriptionCalories(rule?: DietPatientRuleInfo | null) {
  const report = resolveReport(rule);
  const intake = report?.nutrition_intake;
  const calories = Math.round(
    toNumber(intake?.diet_calories) || toNumber(rule?.targetCalories),
  );
  const energyTip = report?.lifestyle_report?.energy_paragraph?.trim() || '';
  return {
    calories: calories > 0 ? String(calories) : '--',
    energyTip: energyTip || '暂无热量说明',
  };
}

export function buildPrescriptionNutrients(rule?: DietPatientRuleInfo | null): PrescriptionNutrientItem[] {
  const report = resolveReport(rule);
  const intake = report?.nutrition_intake;
  const ratios = intake?.macronutrient_ratios;
  const recommendations = report?.lifestyle_report?.macronutrient_recommendations ?? [];

  const findDesc = (match: RegExp) => {
    const hit = recommendations.find(item => match.test(item.nutrient_name ?? ''));
    return hit?.recommended_foods?.trim() || '暂无生活化说明';
  };

  const proteinG = toNumber(intake?.protein_g) || toNumber(rule?.targetProtein);
  const carbsG = toNumber(intake?.carbs_g) || toNumber(rule?.targetCarbs);
  const fatG = toNumber(intake?.fat_g) || toNumber(rule?.targetFat);

  return [
    {
      key: 'protein',
      ...NUTRIENT_META.protein,
      progress: parsePercent(ratios?.protein) || parsePercent(rule?.proteinPercent),
      amountText: formatGrams(proteinG),
      grams: proteinG,
      desc: findDesc(/蛋白|protein/i),
    },
    {
      key: 'carb',
      ...NUTRIENT_META.carb,
      progress: parsePercent(ratios?.carbohydrates) || parsePercent(rule?.carbsPercent),
      amountText: formatGrams(carbsG),
      grams: carbsG,
      desc: findDesc(/碳水|糖|carb/i),
    },
    {
      key: 'fat',
      ...NUTRIENT_META.fat,
      progress: parsePercent(ratios?.fat) || parsePercent(rule?.fatPercent),
      amountText: formatGrams(fatG),
      grams: fatG,
      desc: findDesc(/脂肪|fat/i),
    },
  ];
}

/** 营养素克数换算为热量（蛋白/碳水 4kcal/g，脂肪 9kcal/g） */
export function nutrientGramsToCalories(key: PrescriptionNutrientItem['key'], grams: number) {
  const value = toNumber(grams);
  if (value <= 0) return 0;
  return Math.round(value * (key === 'fat' ? 9 : 4));
}

export function formatFoodEquivText(text?: string | null) {
  const raw = text?.trim() ?? '';
  if (!raw) return '';
  return raw.startsWith('≈') ? raw : `≈${raw}`;
}

export function buildPrescriptionDietMode(rule?: DietPatientRuleInfo | null): PrescriptionDietMode | null {
  const report = resolveReport(rule);
  const intake = report?.nutrition_intake;
  const code = (
    intake?.diet_mode_code?.trim()
    || report?.recommended_diet?.trim()
    || ''
  );
  const title = (
    intake?.recommended_diet_applied?.trim()
    || report?.recommended_diet?.trim()
    || code
  );
  if (!code && !title) return null;

  return {
    code: code || title.slice(0, 8),
    title,
    reasoning: report?.diet_selection_reasoning?.trim() || '暂无模式说明',
    strategy: report?.lifestyle_report?.strategy_and_goals?.trim() || '',
  };
}

export function buildPrescriptionMacroSources(rule?: DietPatientRuleInfo | null): PrescriptionMacroSource[] {
  const list = resolveReport(rule)?.lifestyle_report?.macronutrient_recommendations ?? [];
  if (!list.length) return [];

  return list.map((item, index) => {
    const name = item.nutrient_name?.trim() || `营养素${index + 1}`;
    const meta = MACRO_ICON_BY_NAME.find(entry => entry.match.test(name));
    const remark = item.recommended_remark?.trim() || '';
    const foods = item.recommended_foods?.trim() || '';
    return {
      key: meta?.key ?? `macro-${index}`,
      title: name,
      icon: meta?.icon ?? require('@/assets/images/nutrition/dbz.png'),
      desc: remark || foods || '暂无来源建议',
      tags: splitTags(foods),
    };
  });
}

export function buildPrescriptionAdviceItems(rule?: DietPatientRuleInfo | null): PrescriptionAdviceItem[] {
  const list = resolveReport(rule)?.lifestyle_report?.detailed_dietary_advice ?? [];
  return list
    .map((item, index) => {
      const title = item.category?.trim() || `健康建议${index + 1}`;
      const tips = splitTips(item.advice_points);
      if (!tips.length && !item.advice_points?.trim()) return null;
      const visual = ADVICE_VISUALS[index % ADVICE_VISUALS.length];
      return {
        key: `advice-${index}-${title}`,
        title,
        tips: tips.length ? tips : [item.advice_points!.trim()],
        icon: visual.icon,
        background: visual.background,
        color: visual.color,
        dotColor: visual.dotColor,
        defaultExpanded: index === 0,
      };
    })
    .filter(Boolean) as PrescriptionAdviceItem[];
}

export function buildPrescriptionMonitorCards(rule?: DietPatientRuleInfo | null): PrescriptionMonitorCard[] {
  const report = resolveReport(rule);
  const medical = report?.medical_report;
  const lifestyle = report?.lifestyle_report;

  const cards: Array<PrescriptionMonitorCard | null> = [
    medical?.medication_regimen_analysis?.trim()
      ? {
          key: 'interaction',
          group: 'monitor',
          title: '药物与营养交互',
          icon: require('@/assets/images/nutrition/icon_yw.png'),
          badge: '医学内容',
          text: medical.medication_regimen_analysis.trim(),
          colors: ['#FAFAFA', '#FEFFFF', '#FEFFFF'] as const,
        }
      : null,
    medical?.risk_monitoring_plan?.trim()
      ? {
          key: 'monitor',
          group: 'monitor',
          title: '监测建议',
          icon: require('@/assets/images/nutrition/icon_jc.png'),
          badge: '医学内容',
          text: medical.risk_monitoring_plan.trim(),
          colors: ['#FAFAFA', '#FEFFFF', '#FEFFFF'] as const,
        }
      : null,
    lifestyle?.strategy_and_goals?.trim()
      ? {
          key: 'strategy',
          group: 'lifestyle',
          title: '核心策略与目标',
          icon: require('@/assets/images/nutrition/icon_tip.png'),
          badge: null,
          text: lifestyle.strategy_and_goals.trim(),
          colors: ['#FAFAFA', '#FEFFFF', '#FEFFFF'] as const,
        }
      : null,
    lifestyle?.energy_paragraph?.trim()
      ? {
          key: 'energy',
          group: 'lifestyle',
          title: '能量管理说明',
          icon: require('@/assets/images/nutrition/icon_nl.png'),
          badge: null,
          text: lifestyle.energy_paragraph.trim(),
          colors: ['#FAFAFA', '#FEFFFF', '#FEFFFF'] as const,
        }
      : null,
    lifestyle?.exercise_advice?.trim()
      ? {
          key: 'exercise',
          group: 'lifestyle',
          title: '运动建议',
          icon: require('@/assets/images/nutrition/icon_jy.png'),
          badge: null,
          text: lifestyle.exercise_advice.trim(),
          colors: ['#FAFAFA', '#FEFFFF', '#FEFFFF'] as const,
        }
      : null,
  ];

  return cards.filter(Boolean) as PrescriptionMonitorCard[];
}
