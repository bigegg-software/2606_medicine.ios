import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import type { ExPatientRuleRatio } from '@/api/exPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';

export const EXERCISE_TYPE_ORDER = ['cardio', 'strength', 'flexibility', 'balance'] as const;
export type ExerciseTypeKey = (typeof EXERCISE_TYPE_ORDER)[number];

export const EXERCISE_TYPE_META: Record<
  ExerciseTypeKey,
  { title: string; color: string; icon: ImageSourcePropType }
> = {
  cardio: {
    title: '有氧·心肺耐力',
    color: '#6D925E',
    icon: require('@/assets/images/exercise/exercise3.png'),
  },
  strength: {
    title: '抗阻·力量',
    color: '#FB4550',
    icon: require('@/assets/images/exercise/exercise2.png'),
  },
  flexibility: {
    title: '柔韧性',
    color: '#EE9C44',
    icon: require('@/assets/images/exercise/exercise1.png'),
  },
  balance: {
    title: '平衡·神经运动',
    color: '#72A1C5',
    icon: require('@/assets/images/exercise/exercise4.png'),
  },
};

const FITT_VP_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  icon: ImageSourcePropType;
  aliases: string[];
}> = [
  {
    key: 'frequency',
    label: '频率',
    icon: require('@/assets/images/exercise/icon_f.png'),
    aliases: ['frequency', 'F', 'f', '频率'],
  },
  {
    key: 'intensity',
    label: '强度',
    icon: require('@/assets/images/exercise/icon_i.png'),
    aliases: ['intensity', 'I', 'i', '强度'],
  },
  {
    key: 'time',
    label: '时间',
    icon: require('@/assets/images/exercise/icon_t.png'),
    aliases: ['time', 'T', 't', '时间', 'duration'],
  },
  {
    key: 'type',
    label: '类型',
    icon: require('@/assets/images/exercise/icon_tt.png'),
    aliases: ['Tt', 'TT', 'tt', 'type', 'Type', 'TYPE', '类型'],
  },
  {
    key: 'volume',
    label: '总量',
    icon: require('@/assets/images/exercise/icon_v.png'),
    aliases: ['volume', 'V', 'v', '总量', 'volumeTotal'],
  },
  {
    key: 'progression',
    label: '进阶',
    icon: require('@/assets/images/exercise/icon_p.png'),
    aliases: ['progression', 'P', 'p', '进阶', 'progress'],
  },
];

export type PrescriptionFittItem = {
  key: string;
  label: string;
  value: string;
  icon: ImageSourcePropType;
};

export type PrescriptionTypeSection = {
  key: ExerciseTypeKey;
  title: string;
  color: string;
  icon: ImageSourcePropType;
  ratio: number;
  ratioText: string;
  fittItems: PrescriptionFittItem[];
};

export type PrescriptionWeightItem = {
  key: ExerciseTypeKey;
  title: string;
  color: string;
  ratio: number;
  ratioText: string;
};

function formatZhDate(value?: string) {
  const parsed = moment(value);
  if (!parsed.isValid()) return '--';
  return parsed.format('YYYY年M月D日');
}

function normalizeRatio(value?: number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}

function formatRatioText(ratio: number) {
  return `${ratio}%`;
}

function readFittValue(fittVp: Record<string, unknown> | undefined, aliases: string[]) {
  if (!fittVp) return '';
  for (const alias of aliases) {
    const raw = fittVp[alias];
    if (raw == null) continue;
    if (typeof raw === 'string' || typeof raw === 'number') {
      const text = String(raw).trim();
      if (text) return text;
    }
  }
  return '';
}

export function buildFittVpItems(fittVp?: Record<string, unknown> | null): PrescriptionFittItem[] {
  return FITT_VP_FIELDS.map(field => ({
    key: field.key,
    label: field.label,
    icon: field.icon,
    value: readFittValue(fittVp ?? undefined, field.aliases) || '--',
  }));
}

function normalizeExerciseTypeKey(value?: string): ExerciseTypeKey | null {
  const key = value?.trim();
  if (key === 'cardio' || key === 'aerobic') return 'cardio';
  if (key === 'strength') return 'strength';
  if (key === 'flexibility') return 'flexibility';
  if (key === 'balance') return 'balance';
  return null;
}

function buildRatioMap(list?: ExPatientRuleRatio[]) {
  const map = new Map<ExerciseTypeKey, ExPatientRuleRatio>();
  for (const item of list ?? []) {
    const key = normalizeExerciseTypeKey(item.exerciseType);
    if (!key) continue;
    map.set(key, item);
  }
  return map;
}

export function formatPrescriptionGeneratedText(rule?: InUseExPatientRule | null) {
  const dateText = formatZhDate(rule?.createTime || rule?.startDate);
  return dateText === '--' ? '生成 --' : `生成 ${dateText}`;
}

export function formatPrescriptionNextAssessText(rule?: InUseExPatientRule | null) {
  const dateText = formatZhDate(rule?.endDate);
  return dateText === '--' ? '下次评估 --' : `下次评估 ${dateText}`;
}

export function formatWeekDurationStat(weekDuration?: number) {
  const num = Number(weekDuration);
  if (!Number.isFinite(num) || num <= 0) return '--';
  return `≥${Math.round(num)}`;
}

export function formatWeekKcalStat(weekKcal?: number) {
  const num = Number(weekKcal);
  if (!Number.isFinite(num) || num <= 0) return '--';
  return `~${Math.round(num)}`;
}

export function formatFirstAdvanceWeeksStat(firstAdvanceWeeks?: string) {
  const text = firstAdvanceWeeks?.trim();
  return text || '--';
}

export function buildPrescriptionWeightItems(
  rule?: InUseExPatientRule | null,
): PrescriptionWeightItem[] {
  const ratioMap = buildRatioMap(rule?.ruleRatioList);
  return EXERCISE_TYPE_ORDER
    .filter(key => ratioMap.has(key))
    .map(key => {
      const ratio = normalizeRatio(ratioMap.get(key)?.ratio);
      return {
        key,
        title: EXERCISE_TYPE_META[key].title,
        color: EXERCISE_TYPE_META[key].color,
        ratio,
        ratioText: formatRatioText(ratio),
      };
    });
}

/** 处方中已配置的主训练类型（无配置的类型不展示） */
export function getPrescribedExerciseTypeKeys(
  rule?: InUseExPatientRule | null,
): ExerciseTypeKey[] {
  const ratioMap = buildRatioMap(rule?.ruleRatioList);
  return EXERCISE_TYPE_ORDER.filter(key => ratioMap.has(key));
}

export function buildPrescriptionTypeSections(
  rule?: InUseExPatientRule | null,
): PrescriptionTypeSection[] {
  const ratioMap = buildRatioMap(rule?.ruleRatioList);
  return EXERCISE_TYPE_ORDER
    .filter(key => ratioMap.has(key))
    .map(key => {
      const item = ratioMap.get(key);
      const ratio = normalizeRatio(item?.ratio);
      return {
        key,
        title: EXERCISE_TYPE_META[key].title,
        color: EXERCISE_TYPE_META[key].color,
        icon: EXERCISE_TYPE_META[key].icon,
        ratio,
        ratioText: formatRatioText(ratio),
        fittItems: buildFittVpItems(item?.fittVp),
      };
    });
}

export function getAiAnalysisTitle(rule?: InUseExPatientRule | null) {
  return rule?.aiAnalysis?.title?.trim() || '暂无 AI 洞察标题';
}

export function getAiAnalysisSummary(rule?: InUseExPatientRule | null) {
  return rule?.aiAnalysis?.summary?.trim() || rule?.remark?.trim() || '暂无 AI 洞察说明';
}
