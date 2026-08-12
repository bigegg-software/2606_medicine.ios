import type { ImageSourcePropType } from 'react-native';
import moment from 'moment';
import {
  DICT_TYPES,
  buildDictLabelMap,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import type {
  HealthGoalJointRomTarget,
  HealthGoalMetricPair,
  HealthGoalTarget,
} from '@/api/healthGoal';
import {
  queryFirstAndLatestHealthTestRecord,
  type FirstAndLatestHealthTestRecord,
} from '@/api/exHealthTestRecord';
import {
  queryFirstAndLatestExUserQuestion,
  type FirstAndLatestUserQuestionRecord,
} from '@/api/exUserQuestion';
import {
  getMeasureDataDetailByDateRange,
  type MeasureDataDayGroup,
  type MeasureDataItem,
} from '@/api/measureData';
import type { QuestionnaireType } from '@/api/questionTemplate';
import { calcTargetFromInitial } from '@/src/features/schedule/testing/testingHelpers';
import {
  formatQuestionnaireScoreLevel,
  getQuestionnaireBestTarget,
  getQuestionnaireTierProgress,
} from '@/src/features/schedule/testing/questionnaireHelpers';
import { flattenMeasureItems } from '@/src/features/profile/vitals/vitalsHelpers';
import { parseMeasureNumber } from '@/src/features/profile/vitals/detail/helpers/shared';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { normalizeProgress } from './scheduleHelpers';

export type ScheduleGoalCategoryTab = {
  key: string;
  label: string;
  tip: string;
  icon: ImageSourcePropType;
};

export type ScheduleGoalProgressItem = {
  key: string;
  /** 跳转详情用的 healthGoalId（拆分项与 key 不同） */
  detailId?: string;
  categoryKey: string;
  title: string;
  subtitle: string;
  valueText: string;
  unitText: string;
  targetText: string;
  improveText: string;
  improveUp: boolean;
  progress: number;
  baselineHint: string;
  assessmentType: string;
  assessmentValue: string;
  /** 卡片迷你折线数据（处方周期内全部点） */
  chartValues: number[];
};

const CATEGORY_ICON_BY_LABEL: Record<string, ImageSourcePropType> = {
  三高指标: require('@/assets/images/schedule/icon_tj.png'),
  力量平衡: require('@/assets/images/schedule/icon_ll.png'),
  术后康复: require('@/assets/images/schedule/icon_mx.png'),
  问卷评估: require('@/assets/images/schedule/icon_book.png'),
};

const CATEGORY_TIP_BY_LABEL: Record<string, string> = {
  三高指标: '指标管理',
  力量平衡: '功能管理',
  术后康复: '康复管理',
  问卷评估: '功能评估',
};

const FALLBACK_CATEGORY_ICONS = [
  require('@/assets/images/schedule/icon_tj.png'),
  require('@/assets/images/schedule/icon_ll.png'),
  require('@/assets/images/schedule/icon_mx.png'),
  require('@/assets/images/schedule/icon_book.png'),
];

/** @deprecated 仅作图标/文案兜底参考，实际 Tab 由字典 + 目标数据动态生成 */
export const SCHEDULE_GOAL_CATEGORY_TABS: ScheduleGoalCategoryTab[] = [
  {
    key: '1',
    label: '三高指标',
    tip: '指标管理',
    icon: require('@/assets/images/schedule/icon_tj.png'),
  },
  {
    key: '2',
    label: '力量平衡',
    tip: '功能管理',
    icon: require('@/assets/images/schedule/icon_ll.png'),
  },
  {
    key: '3',
    label: '术后康复',
    tip: '康复管理',
    icon: require('@/assets/images/schedule/icon_mx.png'),
  },
];

const JOINT_ROM_META: Array<{ key: keyof HealthGoalJointRomTarget; label: string }> = [
  { key: 'shoulderFlexion', label: '肩关节前屈' },
  { key: 'shoulderAbduction', label: '肩关节外展' },
  { key: 'elbowFlexion', label: '肘关节屈曲' },
  { key: 'hipFlexion', label: '髋关节屈曲' },
  { key: 'kneeFlexion', label: '膝关节屈曲' },
  { key: 'ankleDorsiflexion', label: '踝关节背屈' },
];

const LIPID_META: Array<{
  key: 'ldlC' | 'hdlC' | 'tc' | 'tg';
  title: string;
  shortLabel: string;
  lowerBetter: boolean;
  measureKey: 'xuezhiLdlC' | 'xuezhiHdlC' | 'xuezhiTc' | 'xuezhiTg';
}> = [
    { key: 'ldlC', title: '低密度脂蛋白', shortLabel: 'LDL-C', lowerBetter: true, measureKey: 'xuezhiLdlC' },
    { key: 'hdlC', title: '高密度脂蛋白', shortLabel: 'HDL-C', lowerBetter: false, measureKey: 'xuezhiHdlC' },
    { key: 'tc', title: '总胆固醇', shortLabel: 'TC', lowerBetter: true, measureKey: 'xuezhiTc' },
    { key: 'tg', title: '甘油三脂', shortLabel: 'TG', lowerBetter: true, measureKey: 'xuezhiTg' },
  ];

const BP_META: Array<{
  key: 'sbp' | 'dbp';
  title: string;
  shortLabel: string;
}> = [
    { key: 'sbp', title: '收缩压', shortLabel: 'Systolic BP' },
    { key: 'dbp', title: '舒张压', shortLabel: 'Diastolic BP' },
  ];

function toFiniteNumber(value?: number | null) {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatMetricNumber(value?: number | null) {
  const num = toFiniteNumber(value);
  if (num == null) return '--';
  const fixed = Number(num.toFixed(2));
  return Number.isInteger(fixed) ? String(fixed) : String(fixed);
}

function formatImproveDelta(value?: number | null) {
  const num = toFiniteNumber(value);
  if (num == null) return '--';
  return formatMetricNumber(Math.abs(num));
}

function getCycleDayCount(startDate?: string, endDate?: string) {
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) return null;
  return end.diff(start, 'days') + 1;
}

type ResolvedMetric = {
  baseline: number | null;
  target: number | null;
  unit: string;
  lowerBetter: boolean;
  /** 基线展示文案（如血压 120/80） */
  baselineText?: string;
  /** 目标数值后缀（如血压 120/80） */
  targetPrefix?: string;
};

function resolveMetricPair(
  pair?: HealthGoalMetricPair | null,
  unit = '',
  lowerBetter = false,
): ResolvedMetric {
  return {
    baseline: toFiniteNumber(pair?.baseline),
    target: toFiniteNumber(pair?.target),
    unit,
    lowerBetter,
  };
}

function isBloodLipidGoal(target: HealthGoalTarget) {
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  return assessmentValue === 'xueZhi' || Boolean(target.bloodLipid);
}

export function isJointRomGoal(target: HealthGoalTarget) {
  return Boolean(target.jointRom);
}

function readJointRomObjField(
  objValue: Record<string, number | string | null> | null | undefined,
  key: keyof HealthGoalJointRomTarget,
) {
  if (!objValue) return null;
  return toFiniteNumber(objValue[key] as number | string | null | undefined);
}

function hasCompleteMetricPair(pair?: HealthGoalMetricPair | null) {
  return toFiniteNumber(pair?.baseline) != null || toFiniteNumber(pair?.target) != null;
}

function hasBloodPressureComponent(
  bp: HealthGoalTarget['bloodPressure'] | undefined,
  key: 'sbp' | 'dbp',
) {
  if (key === 'sbp') {
    return toFiniteNumber(bp?.sbpBaseline) != null || toFiniteNumber(bp?.sbpTarget) != null;
  }
  return toFiniteNumber(bp?.dbpBaseline) != null || toFiniteNumber(bp?.dbpTarget) != null;
}

function resolveBloodPressureComponentMetric(
  bp: HealthGoalTarget['bloodPressure'] | undefined,
  key: 'sbp' | 'dbp',
): ResolvedMetric {
  if (key === 'sbp') {
    return {
      baseline: toFiniteNumber(bp?.sbpBaseline),
      target: toFiniteNumber(bp?.sbpTarget),
      unit: 'mmHg',
      lowerBetter: true,
    };
  }
  return {
    baseline: toFiniteNumber(bp?.dbpBaseline),
    target: toFiniteNumber(bp?.dbpTarget),
    unit: 'mmHg',
    lowerBetter: true,
  };
}

function isWeightGoal(target: HealthGoalTarget) {
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  return assessmentValue === 'tiZhong' || Boolean(target.weight);
}

function isBloodGlucoseGoal(target: HealthGoalTarget) {
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  return assessmentValue === 'xueTang' || Boolean(target.bloodGlucose);
}

function isBloodPressureGoal(target: HealthGoalTarget) {
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  return assessmentValue === 'xueYa' || Boolean(target.bloodPressure);
}

function isUricAcidGoal(target: HealthGoalTarget) {
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  const assessmentValueName = target.healthGoalVo?.assessmentValueName?.trim() ?? '';
  return assessmentValue === 'niaoSuan'
    || assessmentValue === 'xueNiaoSuan'
    || assessmentValueName.includes('尿酸')
    || Boolean(target.uricAcid);
}

export function isHealthTestGoal(target: HealthGoalTarget) {
  const assessmentType = target.healthGoalVo?.assessmentType?.trim() ?? '';
  return assessmentType === 'sys_health_test_item' || Boolean(target.healthTest);
}

export function isQuestionnaireGoal(target: HealthGoalTarget) {
  return target.healthGoalVo?.assessmentType?.trim() === 'question_type';
}

/** 运动处方执行率目标（建立运动习惯） */
export function isExImpRateGoal(target: HealthGoalTarget) {
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  return assessmentValue === 'ex_imp_rate';
}

export function resolveQuestionnaireTypeFromTarget(
  target: HealthGoalTarget,
): QuestionnaireType | undefined {
  if (!isQuestionnaireGoal(target)) return undefined;
  const raw = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (![0, 1, 2, 3].includes(parsed)) return undefined;
  return parsed as QuestionnaireType;
}

/** 力量平衡分类（target_category dictValue=2） */
export const STRENGTH_BALANCE_TARGET_CATEGORY = '2';

export function isStrengthBalanceGoal(target: HealthGoalTarget) {
  const raw = target.healthGoalVo?.targetCategory?.trim() ?? '';
  return raw === STRENGTH_BALANCE_TARGET_CATEGORY || raw === '力量平衡';
}

/** 基线用处方配置、当前值用健康测量/测试成绩的指标 */
function isMeasuredHealthIndicatorGoal(target: HealthGoalTarget) {
  return isWeightGoal(target)
    || isBloodGlucoseGoal(target)
    || isUricAcidGoal(target)
    || isHealthTestGoal(target);
}

export function resolveHealthTestItemIdFromTarget(target: HealthGoalTarget) {
  const fromVo = target.healthGoalVo?.healthTestItemVo?.healthTestItemId;
  if (fromVo != null) return String(fromVo);
  const assessmentType = target.healthGoalVo?.assessmentType?.trim() ?? '';
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim() ?? '';
  if (assessmentType === 'sys_health_test_item' && assessmentValue) {
    return assessmentValue;
  }
  return null;
}

function formatBloodPressurePair(sbp?: number | null, dbp?: number | null) {
  const high = toFiniteNumber(sbp);
  const low = toFiniteNumber(dbp);
  if (high == null && low == null) return null;
  return `${high != null ? formatMetricNumber(high) : '--'}/${low != null ? formatMetricNumber(low) : '--'}`;
}

function resolveGoalMetric(
  target: HealthGoalTarget,
  options?: { prescriptionTargetWeight?: number | null },
): ResolvedMetric {
  const goalVo = target.healthGoalVo;
  const assessmentType = goalVo?.assessmentType?.trim() ?? '';
  const assessmentValue = goalVo?.assessmentValue?.trim() ?? '';
  const testUnit = goalVo?.healthTestItemVo?.unit?.trim() ?? '';
  const testDirection = goalVo?.healthTestItemVo?.improveDirection;

  if (assessmentType === 'sys_health_test_item' || target.healthTest) {
    const baseline = toFiniteNumber(target.healthTest?.baseline);
    let targetValue = toFiniteNumber(target.healthTest?.target);
    if (targetValue == null && baseline != null) {
      targetValue = calcTargetFromInitial(baseline, target.improveDirectionVal, testDirection);
    }
    return {
      baseline,
      target: targetValue,
      unit: testUnit,
      lowerBetter: testDirection === -1,
    };
  }

  if (isBloodPressureGoal(target)) {
    const bp = target.bloodPressure;
    const sbpBaseline = toFiniteNumber(bp?.sbpBaseline);
    const dbpBaseline = toFiniteNumber(bp?.dbpBaseline);
    const sbpTarget = toFiniteNumber(bp?.sbpTarget);
    const dbpTarget = toFiniteNumber(bp?.dbpTarget);
    return {
      baseline: sbpBaseline,
      target: sbpTarget,
      unit: 'mmHg',
      lowerBetter: true,
      baselineText: formatBloodPressurePair(sbpBaseline, dbpBaseline) ?? undefined,
      targetPrefix: formatBloodPressurePair(sbpTarget, dbpTarget) ?? undefined,
    };
  }

  if (isBloodGlucoseGoal(target)) {
    return resolveMetricPair(target.bloodGlucose, 'mmol/L', true);
  }

  if (isUricAcidGoal(target)) {
    return resolveMetricPair(target.uricAcid, 'μmol/L', true);
  }

  if (isWeightGoal(target)) {
    const baseline = toFiniteNumber(target.weight?.baseline);
    const targetValue = toFiniteNumber(target.weight?.target)
      ?? toFiniteNumber(options?.prescriptionTargetWeight);
    return {
      baseline,
      target: targetValue,
      unit: 'kg',
      lowerBetter: target.tiZhongImproveDirection !== 1,
    };
  }

  if (assessmentValue === 'xueZhi' || target.bloodLipid) {
    const lipid = target.bloodLipid;
    const first = LIPID_META.find(item => hasCompleteMetricPair(lipid?.[item.key]));
    if (first) {
      return resolveMetricPair(lipid?.[first.key], 'mmol/L', first.lowerBetter);
    }
  }

  if (target.jointRom) {
    const first = JOINT_ROM_META.find(item => {
      const pair = target.jointRom?.[item.key];
      return toFiniteNumber(pair?.baseline) != null || toFiniteNumber(pair?.target) != null;
    });
    if (first) {
      return resolveMetricPair(target.jointRom?.[first.key], '°', false);
    }
  }

  return {
    baseline: null,
    target: null,
    unit: testUnit,
    lowerBetter: testDirection === -1,
  };
}

function resolveProgress(target: HealthGoalTarget) {
  if (target.indicatorDeclined === 1) return 0;
  const raw = target.improvePercent ?? target.compliantPercent;
  if (raw == null || Number.isNaN(Number(raw))) return null;
  return normalizeProgress(raw);
}

/** 按基线→当前→目标计算进度；无当前值时回退 API 进度 */
function calcMetricProgressPercent(
  baseline: number | null,
  current: number | null,
  targetValue: number | null,
  lowerBetter: boolean,
  apiProgress: number | null,
) {
  if (baseline == null || targetValue == null) {
    return apiProgress ?? 0;
  }

  const totalChange = Math.abs(targetValue - baseline);
  if (totalChange <= 0) {
    return apiProgress ?? 0;
  }

  if (current == null) {
    return apiProgress ?? 0;
  }

  if (lowerBetter) {
    if (current <= targetValue) return 100;
    const completed = Math.max(0, baseline - current);
    return normalizeProgress((completed / totalChange) * 100);
  }

  if (current >= targetValue) return 100;
  const completed = Math.max(0, current - baseline);
  return normalizeProgress((completed / totalChange) * 100);
}

function resolveCurrentValue(
  metric: ResolvedMetric,
  progress: number | null,
) {
  if (metric.baseline == null) {
    return { valueText: '--', current: null };
  }

  if (progress == null || metric.target == null) {
    return {
      valueText: formatMetricNumber(metric.baseline),
      current: metric.baseline,
    };
  }

  const current = metric.baseline + (metric.target - metric.baseline) * (progress / 100);
  return {
    valueText: formatMetricNumber(current),
    current,
  };
}

function resolveImproveDelta(
  metric: ResolvedMetric,
  current: number | null,
  progress: number | null,
) {
  if (current != null && metric.baseline != null) {
    return current - metric.baseline;
  }
  if (progress != null && metric.baseline != null && metric.target != null) {
    return (metric.target - metric.baseline) * (progress / 100);
  }
  return null;
}

/** 仅使用 getInfo 返回的 targetCategory；字典无对应项则不归类 */
export function resolveScheduleGoalCategoryKey(
  target: HealthGoalTarget,
  categoryLabelMap?: Record<string, string>,
): string {
  const raw = target.healthGoalVo?.targetCategory?.trim() ?? '';
  if (!raw) return '';
  if (categoryLabelMap && !categoryLabelMap[raw]) return '';
  return raw;
}

export function getScheduleGoalCategoryTab(
  key: string,
  tabs: ScheduleGoalCategoryTab[] = SCHEDULE_GOAL_CATEGORY_TABS,
) {
  return tabs.find(tab => tab.key === key) ?? tabs[0] ?? SCHEDULE_GOAL_CATEGORY_TABS[0];
}

export type TargetCategoryDictMaps = {
  labelMap: Record<string, string>;
  sortMap: Record<string, number>;
};

export async function loadTargetCategoryDict(): Promise<TargetCategoryDictMaps> {
  try {
    const res = await getDictDataByType(DICT_TYPES.targetCategory);
    if (!isResourceApiOk(res)) return { labelMap: {}, sortMap: {} };
    const items = apiResourceData<DictDataItem[]>(res as any) ?? [];
    const labelMap = buildDictLabelMap(items);
    const sortMap: Record<string, number> = {};
    for (const item of items) {
      if (item.dictValue == null) continue;
      sortMap[String(item.dictValue)] = item.dictSort ?? 0;
    }
    return { labelMap, sortMap };
  } catch {
    return { labelMap: {}, sortMap: {} };
  }
}

/** @deprecated 使用 loadTargetCategoryDict */
export async function loadTargetCategoryLabelMap() {
  const { labelMap } = await loadTargetCategoryDict();
  return labelMap;
}

/**
 * 根据处方目标上的 targetCategory + target_category 字典生成 Tab。
 * 字典中没有的分类不渲染。
 */
export function buildVisibleScheduleGoalCategoryTabs(
  targets: HealthGoalTarget[] | undefined,
  categoryLabelMap: Record<string, string>,
  categorySortMap?: Record<string, number>,
): ScheduleGoalCategoryTab[] {
  const keys = new Set<string>();
  for (const target of targets ?? []) {
    const raw = target.healthGoalVo?.targetCategory?.trim() ?? '';
    if (!raw || !categoryLabelMap[raw]) continue;
    keys.add(raw);
  }

  return [...keys]
    .sort((a, b) => {
      const sortDiff = (categorySortMap?.[a] ?? 0) - (categorySortMap?.[b] ?? 0);
      if (sortDiff !== 0) return sortDiff;
      return a.localeCompare(b);
    })
    .map((key, index) => {
      const label = categoryLabelMap[key];
      return {
        key,
        label,
        tip: CATEGORY_TIP_BY_LABEL[label] ?? '目标管理',
        icon: CATEGORY_ICON_BY_LABEL[label]
          ?? FALLBACK_CATEGORY_ICONS[index % FALLBACK_CATEGORY_ICONS.length],
      };
    });
}
export function toScheduleGoalProgressItem(
  target: HealthGoalTarget,
  index: number,
  options?: {
    categoryLabelMap?: Record<string, string>;
    cycleDays?: number | null;
    currentWeightKg?: number | null;
    currentBloodGlucose?: number | null;
    currentBloodPressure?: { sbp?: number | null; dbp?: number | null } | null;
    currentUricAcid?: number | null;
    currentBloodLipid?: {
      ldlC?: number | null;
      hdlC?: number | null;
      tc?: number | null;
      tg?: number | null;
    } | null;
    /** 处方周期内最早测量（基线为空时回退） */
    baselineWeightKg?: number | null;
    baselineBloodGlucose?: number | null;
    baselineBloodPressure?: { sbp?: number | null; dbp?: number | null } | null;
    baselineUricAcid?: number | null;
    baselineBloodLipid?: {
      ldlC?: number | null;
      hdlC?: number | null;
      tc?: number | null;
      tg?: number | null;
    } | null;
    /** healthGoalId -> 最近一次健康测试成绩 */
    currentHealthTestByGoalId?: Record<string, number | null>;
    /** healthGoalId -> 首次健康测试成绩（基线为空时回退） */
    baselineHealthTestByGoalId?: Record<string, number | null>;
    /** healthGoalId -> 最近一次关节活动度 objValue */
    currentJointRomByGoalId?: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>>;
    /** healthGoalId -> 首次关节活动度 objValue */
    baselineJointRomByGoalId?: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>>;
    /** healthGoalId -> 最近一次问卷得分 */
    currentQuestionnaireByGoalId?: Record<string, number | null>;
    /** healthGoalId -> 首次问卷得分（基线为空时回退） */
    baselineQuestionnaireByGoalId?: Record<string, number | null>;
    /** 处方整体主训练完成率（moduleCompleteRate.mainCompleteRate） */
    prescriptionMainCompleteRate?: number | null;
    prescriptionTargetWeight?: number | null;
    /** 血脂拆分项 */
    lipidKey?: typeof LIPID_META[number]['key'];
    /** 血压拆分项 */
    bpKey?: typeof BP_META[number]['key'];
    /** 关节活动度拆分项 */
    jointRomKey?: typeof JOINT_ROM_META[number]['key'];
    /** 处方周期折线序列 */
    chartSeries?: {
      weight?: number[];
      bloodGlucose?: number[];
      bloodPressureSbp?: number[];
      bloodPressureDbp?: number[];
      uricAcid?: number[];
      bloodLipid?: {
        ldlC?: number[];
        hdlC?: number[];
        tc?: number[];
        tg?: number[];
      };
      healthTestByGoalId?: Record<string, number[]>;
      jointRomByGoalId?: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number[]>>>;
      questionnaireByGoalId?: Record<string, number[]>;
    };
  },
): ScheduleGoalProgressItem {
  const goalVo = target.healthGoalVo;
  const assessmentType = goalVo?.assessmentType?.trim() ?? '';
  const assessmentValue = goalVo?.assessmentValue?.trim() ?? '';
  const lipidMeta = options?.lipidKey
    ? LIPID_META.find(item => item.key === options.lipidKey)
    : undefined;
  const bpMeta = options?.bpKey
    ? BP_META.find(item => item.key === options.bpKey)
    : undefined;
  const jointRomMeta = options?.jointRomKey
    ? JOINT_ROM_META.find(item => item.key === options.jointRomKey)
    : undefined;
  const questionnaireType = resolveQuestionnaireTypeFromTarget(target);
  const isQuestionnaire = questionnaireType != null;
  const isExImpRate = isExImpRateGoal(target);

  const title = lipidMeta?.title
    || bpMeta?.title
    || jointRomMeta?.label
    || goalVo?.assessmentValueName?.trim()
    || goalVo?.goalName?.trim()
    || goalVo?.healthTestItemVo?.testName?.trim()
    || '健康目标';
  const subtitleCandidate = lipidMeta?.shortLabel
    || bpMeta?.shortLabel
    || (jointRomMeta
      ? ''
      : (goalVo?.goalName?.trim() || goalVo?.healthTestItemVo?.testName?.trim() || ''));
  const subtitle = subtitleCandidate && subtitleCandidate !== title ? subtitleCandidate : '';

  const testDirection = goalVo?.healthTestItemVo?.improveDirection;
  const jointRomLowerBetter = testDirection === -1;
  const metric = lipidMeta
    ? resolveMetricPair(
      target.bloodLipid?.[lipidMeta.key],
      'mmol/L',
      lipidMeta.lowerBetter,
    )
    : bpMeta
      ? resolveBloodPressureComponentMetric(target.bloodPressure, bpMeta.key)
      : jointRomMeta
        ? resolveMetricPair(target.jointRom?.[jointRomMeta.key], '°', jointRomLowerBetter)
        : resolveGoalMetric(target, {
          prescriptionTargetWeight: options?.prescriptionTargetWeight,
        });

  // 处方基线为空时，回退处方周期内最早一次测量 / 首次测试
  if (lipidMeta) {
    if (metric.baseline == null) {
      metric.baseline = toFiniteNumber(options?.baselineBloodLipid?.[lipidMeta.key]);
    }
  } else if (bpMeta) {
    if (metric.baseline == null) {
      metric.baseline = toFiniteNumber(options?.baselineBloodPressure?.[bpMeta.key]);
    }
  } else if (jointRomMeta) {
    const goalId = target.healthGoalId != null ? String(target.healthGoalId) : '';
    const firstFieldBaseline = goalId
      ? toFiniteNumber(options?.baselineJointRomByGoalId?.[goalId]?.[jointRomMeta.key])
      : null;
    if (metric.baseline == null && firstFieldBaseline != null) {
      metric.baseline = firstFieldBaseline;
    }
    if (metric.target == null && metric.baseline != null) {
      metric.target = calcTargetFromInitial(
        metric.baseline,
        target.improveDirectionVal,
        testDirection,
      );
    }
  } else if (isWeightGoal(target)) {
    if (metric.baseline == null) {
      metric.baseline = toFiniteNumber(options?.baselineWeightKg);
    }
  } else if (isBloodGlucoseGoal(target)) {
    if (metric.baseline == null) {
      metric.baseline = toFiniteNumber(options?.baselineBloodGlucose);
    }
  } else if (isUricAcidGoal(target)) {
    if (metric.baseline == null) {
      metric.baseline = toFiniteNumber(options?.baselineUricAcid);
    }
  } else if (isHealthTestGoal(target)) {
    const goalId = target.healthGoalId != null ? String(target.healthGoalId) : '';
    const firstRecordBaseline = goalId
      ? toFiniteNumber(options?.baselineHealthTestByGoalId?.[goalId])
      : null;
    if (metric.baseline == null && firstRecordBaseline != null) {
      metric.baseline = firstRecordBaseline;
    }
    if (metric.target == null && metric.baseline != null) {
      metric.target = calcTargetFromInitial(
        metric.baseline,
        target.improveDirectionVal,
        testDirection,
      );
    }
  }

  const apiProgress = resolveProgress(target);
  const measuredGoal = isMeasuredHealthIndicatorGoal(target)
    || Boolean(lipidMeta)
    || Boolean(bpMeta)
    || Boolean(jointRomMeta);

  let valueText: string;
  let current: number | null;
  let progress: number;
  let improveDelta: number | null;
  let improveUp: boolean;
  let targetText: string;
  let unitText: string;
  let questionnaireBaselineScore: number | null = null;

  if (isExImpRate) {
    // 当前：处方整体主训练完成率；目标：exImpRate
    current = toFiniteNumber(options?.prescriptionMainCompleteRate);
    valueText = current != null ? formatMetricNumber(current) : '--';
    const targetRate = toFiniteNumber(target.exImpRate);
    targetText = targetRate != null
      ? `目标≥${formatMetricNumber(targetRate)}`
      : '目标--';
    unitText = '%';
    progress = calcMetricProgressPercent(0, current, targetRate, false, null);
    improveDelta = current != null ? current : null;
    improveUp = true;
  } else if (isQuestionnaire) {
    const goalId = target.healthGoalId != null ? String(target.healthGoalId) : '';
    const latestScore = goalId
      ? toFiniteNumber(options?.currentQuestionnaireByGoalId?.[goalId])
      : null;
    questionnaireBaselineScore = goalId
      ? toFiniteNumber(options?.baselineQuestionnaireByGoalId?.[goalId])
      : null;
    current = latestScore;
    valueText = formatQuestionnaireScoreLevel(questionnaireType, latestScore);
    const bestTarget = getQuestionnaireBestTarget(questionnaireType);
    targetText = `目标：${bestTarget.label}`;
    unitText = '';
    progress = latestScore != null
      ? (getQuestionnaireTierProgress(questionnaireType, latestScore) ?? 0)
      : 0;
    improveDelta = null;
    improveUp = true;
  } else if (lipidMeta) {
    current = toFiniteNumber(options?.currentBloodLipid?.[lipidMeta.key]);
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.targetPrefix
      ? `目标${targetCompare}${metric.targetPrefix}`
      : metric.target != null
        ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
        : '目标--';
    unitText = metric.unit;
  } else if (bpMeta) {
    current = toFiniteNumber(options?.currentBloodPressure?.[bpMeta.key]);
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.target != null
      ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
      : '目标--';
    unitText = metric.unit;
  } else if (jointRomMeta) {
    const goalId = target.healthGoalId != null ? String(target.healthGoalId) : '';
    current = goalId
      ? toFiniteNumber(options?.currentJointRomByGoalId?.[goalId]?.[jointRomMeta.key])
      : null;
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.target != null
      ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
      : '目标--';
    unitText = metric.unit;
  } else if (isWeightGoal(target)) {
    current = toFiniteNumber(options?.currentWeightKg);
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.target != null
      ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
      : '目标--';
    unitText = metric.unit;
  } else if (isBloodGlucoseGoal(target)) {
    current = toFiniteNumber(options?.currentBloodGlucose);
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.target != null
      ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
      : '目标--';
    unitText = metric.unit;
  } else if (isUricAcidGoal(target)) {
    current = toFiniteNumber(options?.currentUricAcid);
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.target != null
      ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
      : '目标--';
    unitText = metric.unit;
  } else if (isHealthTestGoal(target)) {
    const goalId = target.healthGoalId != null ? String(target.healthGoalId) : '';
    current = goalId
      ? toFiniteNumber(options?.currentHealthTestByGoalId?.[goalId])
      : null;
    valueText = current != null ? formatMetricNumber(current) : '--';
    progress = measuredGoal
      ? calcMetricProgressPercent(
        metric.baseline,
        current,
        metric.target,
        metric.lowerBetter,
        apiProgress,
      )
      : (apiProgress ?? 0);
    improveDelta = measuredGoal
      ? (current != null && metric.baseline != null ? current - metric.baseline : null)
      : resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.target != null
      ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
      : '目标--';
    unitText = metric.unit;
  } else {
    const resolved = resolveCurrentValue(metric, apiProgress);
    valueText = resolved.valueText;
    current = resolved.current;
    progress = apiProgress ?? 0;
    improveDelta = resolveImproveDelta(metric, current, apiProgress);
    improveUp = metric.lowerBetter ? (improveDelta ?? 0) <= 0 : (improveDelta ?? 0) >= 0;
    const targetCompare = metric.lowerBetter ? '≤' : '≥';
    targetText = metric.targetPrefix
      ? `目标${targetCompare}${metric.targetPrefix}`
      : metric.target != null
        ? `目标${targetCompare}${formatMetricNumber(metric.target)}`
        : '目标--';
    unitText = metric.unit;
  }

  // 基线：健康指标用配置值；问卷用首次评估状态；执行率无基线
  const baselineValueText = isExImpRate
    ? '--'
    : isQuestionnaire
      ? formatQuestionnaireScoreLevel(questionnaireType, questionnaireBaselineScore)
      : (metric.baselineText
        || (metric.baseline != null ? formatMetricNumber(metric.baseline) : '--'));
  const baselineUnit = isQuestionnaire || isExImpRate ? '' : (unitText || '');
  const cycleDays = options?.cycleDays;
  const cycleText = cycleDays != null && cycleDays > 0 ? `${cycleDays}天周期改善` : '周期改善';
  const baselineHint = `基线${baselineValueText}${baselineUnit}·${cycleText}`;

  const baseKey = target.healthGoalId != null
    ? String(target.healthGoalId)
    : `${title}-${index}`;
  const key = lipidMeta
    ? `${baseKey}-${lipidMeta.key}`
    : bpMeta
      ? `${baseKey}-${bpMeta.key}`
      : jointRomMeta
        ? `${baseKey}-${jointRomMeta.key}`
        : baseKey;

  const chartSeries = options?.chartSeries;
  let chartValues: number[] = [];
  if (lipidMeta) {
    chartValues = chartSeries?.bloodLipid?.[lipidMeta.key] ?? [];
  } else if (bpMeta) {
    chartValues = bpMeta.key === 'sbp'
      ? (chartSeries?.bloodPressureSbp ?? [])
      : (chartSeries?.bloodPressureDbp ?? []);
  } else if (jointRomMeta) {
    chartValues = chartSeries?.jointRomByGoalId?.[baseKey]?.[jointRomMeta.key] ?? [];
  } else if (isWeightGoal(target)) {
    chartValues = chartSeries?.weight ?? [];
  } else if (isBloodGlucoseGoal(target)) {
    chartValues = chartSeries?.bloodGlucose ?? [];
  } else if (isUricAcidGoal(target)) {
    chartValues = chartSeries?.uricAcid ?? [];
  } else if (isQuestionnaire) {
    chartValues = chartSeries?.questionnaireByGoalId?.[baseKey] ?? [];
  } else if (isHealthTestGoal(target)) {
    chartValues = chartSeries?.healthTestByGoalId?.[baseKey] ?? [];
  }

  return {
    key,
    detailId: baseKey,
    categoryKey: resolveScheduleGoalCategoryKey(target, options?.categoryLabelMap),
    title,
    subtitle,
    valueText,
    unitText,
    targetText,
    improveText: formatImproveDelta(improveDelta),
    improveUp,
    progress,
    baselineHint,
    assessmentType,
    assessmentValue: lipidMeta ? 'xueZhi' : bpMeta ? 'xueYa' : assessmentValue,
    chartValues,
  };
}

export function buildScheduleGoalProgressItems(
  targets?: HealthGoalTarget[],
  options?: {
    categoryLabelMap?: Record<string, string>;
    startDate?: string;
    endDate?: string;
    currentWeightKg?: number | null;
    currentBloodGlucose?: number | null;
    currentBloodPressure?: { sbp?: number | null; dbp?: number | null } | null;
    currentUricAcid?: number | null;
    currentBloodLipid?: {
      ldlC?: number | null;
      hdlC?: number | null;
      tc?: number | null;
      tg?: number | null;
    } | null;
    baselineWeightKg?: number | null;
    baselineBloodGlucose?: number | null;
    baselineBloodPressure?: { sbp?: number | null; dbp?: number | null } | null;
    baselineUricAcid?: number | null;
    baselineBloodLipid?: {
      ldlC?: number | null;
      hdlC?: number | null;
      tc?: number | null;
      tg?: number | null;
    } | null;
    currentHealthTestByGoalId?: Record<string, number | null>;
    baselineHealthTestByGoalId?: Record<string, number | null>;
    currentJointRomByGoalId?: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>>;
    baselineJointRomByGoalId?: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>>;
    currentQuestionnaireByGoalId?: Record<string, number | null>;
    baselineQuestionnaireByGoalId?: Record<string, number | null>;
    prescriptionMainCompleteRate?: number | null;
    prescriptionTargetWeight?: number | null;
    chartSeries?: {
      weight?: number[];
      bloodGlucose?: number[];
      bloodPressureSbp?: number[];
      bloodPressureDbp?: number[];
      uricAcid?: number[];
      bloodLipid?: {
        ldlC?: number[];
        hdlC?: number[];
        tc?: number[];
        tg?: number[];
      };
      healthTestByGoalId?: Record<string, number[]>;
      jointRomByGoalId?: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number[]>>>;
      questionnaireByGoalId?: Record<string, number[]>;
    };
  },
) {
  const cycleDays = getCycleDayCount(options?.startDate, options?.endDate);
  const sharedOptions = {
    categoryLabelMap: options?.categoryLabelMap,
    cycleDays,
    currentWeightKg: options?.currentWeightKg,
    currentBloodGlucose: options?.currentBloodGlucose,
    currentBloodPressure: options?.currentBloodPressure,
    currentUricAcid: options?.currentUricAcid,
    currentBloodLipid: options?.currentBloodLipid,
    baselineWeightKg: options?.baselineWeightKg,
    baselineBloodGlucose: options?.baselineBloodGlucose,
    baselineBloodPressure: options?.baselineBloodPressure,
    baselineUricAcid: options?.baselineUricAcid,
    baselineBloodLipid: options?.baselineBloodLipid,
    currentHealthTestByGoalId: options?.currentHealthTestByGoalId,
    baselineHealthTestByGoalId: options?.baselineHealthTestByGoalId,
    currentJointRomByGoalId: options?.currentJointRomByGoalId,
    baselineJointRomByGoalId: options?.baselineJointRomByGoalId,
    currentQuestionnaireByGoalId: options?.currentQuestionnaireByGoalId,
    baselineQuestionnaireByGoalId: options?.baselineQuestionnaireByGoalId,
    prescriptionMainCompleteRate: options?.prescriptionMainCompleteRate,
    prescriptionTargetWeight: options?.prescriptionTargetWeight,
    chartSeries: options?.chartSeries,
  };

  const items: ScheduleGoalProgressItem[] = [];
  (targets ?? []).forEach((target, index) => {
    if (isBloodLipidGoal(target)) {
      for (const meta of LIPID_META) {
        if (!hasCompleteMetricPair(target.bloodLipid?.[meta.key])) continue;
        items.push(toScheduleGoalProgressItem(target, index, {
          ...sharedOptions,
          lipidKey: meta.key,
        }));
      }
      return;
    }

    if (isBloodPressureGoal(target)) {
      for (const meta of BP_META) {
        if (!hasBloodPressureComponent(target.bloodPressure, meta.key)) continue;
        items.push(toScheduleGoalProgressItem(target, index, {
          ...sharedOptions,
          bpKey: meta.key,
        }));
      }
      return;
    }

    if (isJointRomGoal(target)) {
      for (const meta of JOINT_ROM_META) {
        items.push(toScheduleGoalProgressItem(target, index, {
          ...sharedOptions,
          jointRomKey: meta.key,
        }));
      }
      return;
    }

    items.push(toScheduleGoalProgressItem(target, index, sharedOptions));
  });
  return items;
}

export type PrescriptionEarliestMeasures = {
  weightKg: number | null;
  bloodGlucose: number | null;
  bloodPressure: { sbp: number | null; dbp: number | null } | null;
  uricAcid: number | null;
  bloodLipid: {
    ldlC: number | null;
    hdlC: number | null;
    tc: number | null;
    tg: number | null;
  } | null;
};

const EMPTY_EARLIEST_MEASURES: PrescriptionEarliestMeasures = {
  weightKg: null,
  bloodGlucose: null,
  bloodPressure: null,
  uricAcid: null,
  bloodLipid: null,
};

async function loadMeasureItemsInPrescriptionRange(
  type: '体重' | '血糖' | '血压' | '尿酸' | '血脂',
  startDate?: string,
  endDate?: string,
) {
  if (!startDate?.trim() || !endDate?.trim()) return [] as MeasureDataItem[];
  try {
    const res = await getMeasureDataDetailByDateRange({
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      type,
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) return [];
    const rows = apiResourceData<MeasureDataDayGroup[]>(
      res as unknown as { code?: number; data?: MeasureDataDayGroup[] },
    );
    return flattenMeasureItems(rows);
  } catch {
    return [];
  }
}

function pickEarliestValidMeasure(
  items: MeasureDataItem[],
  pick: (item: MeasureDataItem) => number | null,
) {
  for (const item of items) {
    const value = pick(item);
    if (value != null && value > 0) return value;
  }
  return null;
}

/** 处方周期内最早一次测量（血脂/血压/血糖/体重/尿酸基线回退） */
export async function loadPrescriptionEarliestMeasures(
  startDate?: string,
  endDate?: string,
): Promise<PrescriptionEarliestMeasures> {
  if (!startDate?.trim() || !endDate?.trim()) return EMPTY_EARLIEST_MEASURES;

  const [weightItems, glucoseItems, pressureItems, uricAcidItems, lipidItems] = await Promise.all([
    loadMeasureItemsInPrescriptionRange('体重', startDate, endDate),
    loadMeasureItemsInPrescriptionRange('血糖', startDate, endDate),
    loadMeasureItemsInPrescriptionRange('血压', startDate, endDate),
    loadMeasureItemsInPrescriptionRange('尿酸', startDate, endDate),
    loadMeasureItemsInPrescriptionRange('血脂', startDate, endDate),
  ]);

  const sbp = pickEarliestValidMeasure(pressureItems, item => parseMeasureNumber(item.val));
  const dbp = pickEarliestValidMeasure(pressureItems, item => parseMeasureNumber(item.val2));

  const pickEarliestLipid = (
    key: 'tc' | 'tg' | 'hdlC' | 'ldlC',
  ) => {
    for (const item of lipidItems) {
      const value = key === 'tc'
        ? parseMeasureNumber(item.xuezhiTc ?? item.val)
        : key === 'tg'
          ? parseMeasureNumber(item.xuezhiTg)
          : key === 'hdlC'
            ? parseMeasureNumber(item.xuezhiHdlC)
            : parseMeasureNumber(item.xuezhiLdlC);
      if (value != null && value > 0) return value;
    }
    return null;
  };

  return {
    weightKg: pickEarliestValidMeasure(weightItems, item => parseMeasureNumber(item.val)),
    bloodGlucose: pickEarliestValidMeasure(glucoseItems, item => parseMeasureNumber(item.val)),
    bloodPressure: sbp != null || dbp != null ? { sbp, dbp } : null,
    uricAcid: pickEarliestValidMeasure(uricAcidItems, item => parseMeasureNumber(item.val)),
    bloodLipid: {
      tc: pickEarliestLipid('tc'),
      tg: pickEarliestLipid('tg'),
      hdlC: pickEarliestLipid('hdlC'),
      ldlC: pickEarliestLipid('ldlC'),
    },
  };
}

export type HealthTestFirstAndLatestMap = {
  latestByGoalId: Record<string, number | null>;
  firstByGoalId: Record<string, number | null>;
  latestJointRomByGoalId: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>>;
  firstJointRomByGoalId: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>>;
};

function parseJointRomFieldsFromObjValue(
  objValue?: Record<string, number | string | null> | null,
): Partial<Record<keyof HealthGoalJointRomTarget, number | null>> {
  const result: Partial<Record<keyof HealthGoalJointRomTarget, number | null>> = {};
  for (const meta of JOINT_ROM_META) {
    result[meta.key] = readJointRomObjField(objValue, meta.key);
  }
  return result;
}

/** 健康测试：查询首次及最新成绩（基线为空时用首次值） */
export async function loadHealthTestFirstAndLatestByGoalId(
  exPatientRuleId?: string | number | null,
  targets?: HealthGoalTarget[],
  userId?: string | number | null,
): Promise<HealthTestFirstAndLatestMap> {
  const empty: HealthTestFirstAndLatestMap = {
    latestByGoalId: {},
    firstByGoalId: {},
    latestJointRomByGoalId: {},
    firstJointRomByGoalId: {},
  };
  if (exPatientRuleId == null || !targets?.length) return empty;

  const entries = await Promise.all(
    targets.map(async target => {
      if (!isHealthTestGoal(target) && !isJointRomGoal(target)) return null;
      if (target.healthGoalId == null) return null;
      const healthTestItemId = resolveHealthTestItemIdFromTarget(target);
      if (!healthTestItemId) return null;

      try {
        const res = await queryFirstAndLatestHealthTestRecord({
          exPatientRuleId: String(exPatientRuleId),
          healthTestItemId,
          userId: userId != null ? String(userId) : undefined,
        });
        if (!isResourceApiOk(res as unknown as { code?: number })) {
          return [
            String(target.healthGoalId),
            null,
            null,
            null,
            null,
          ] as const;
        }
        const data = apiResourceData<FirstAndLatestHealthTestRecord>(
          res as unknown as { code?: number; data?: FirstAndLatestHealthTestRecord },
        );
        return [
          String(target.healthGoalId),
          toFiniteNumber(data?.latestRecord?.testValue),
          toFiniteNumber(data?.firstRecord?.testValue),
          parseJointRomFieldsFromObjValue(data?.latestRecord?.objValue),
          parseJointRomFieldsFromObjValue(data?.firstRecord?.objValue),
        ] as const;
      } catch {
        return [
          String(target.healthGoalId),
          null,
          null,
          null,
          null,
        ] as const;
      }
    }),
  );

  const latestByGoalId: Record<string, number | null> = {};
  const firstByGoalId: Record<string, number | null> = {};
  const latestJointRomByGoalId: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>> = {};
  const firstJointRomByGoalId: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number | null>>> = {};
  for (const entry of entries) {
    if (!entry) continue;
    latestByGoalId[entry[0]] = entry[1];
    firstByGoalId[entry[0]] = entry[2];
    if (entry[3]) latestJointRomByGoalId[entry[0]] = entry[3];
    if (entry[4]) firstJointRomByGoalId[entry[0]] = entry[4];
  }
  return {
    latestByGoalId,
    firstByGoalId,
    latestJointRomByGoalId,
    firstJointRomByGoalId,
  };
}

/** @deprecated 使用 loadHealthTestFirstAndLatestByGoalId */
export async function loadLatestHealthTestScoreByGoalId(
  exPatientRuleId?: string | number | null,
  targets?: HealthGoalTarget[],
  userId?: string | number | null,
): Promise<Record<string, number | null>> {
  const { latestByGoalId } = await loadHealthTestFirstAndLatestByGoalId(
    exPatientRuleId,
    targets,
    userId,
  );
  return latestByGoalId;
}

export type QuestionnaireFirstAndLatestMap = {
  latestByGoalId: Record<string, number | null>;
  firstByGoalId: Record<string, number | null>;
};

/** 评估问卷：查询首次及最新得分（基线用首次评估状态） */
export async function loadQuestionnaireFirstAndLatestByGoalId(
  exPatientRuleId?: string | number | null,
  targets?: HealthGoalTarget[],
  userId?: string | number | null,
): Promise<QuestionnaireFirstAndLatestMap> {
  const empty: QuestionnaireFirstAndLatestMap = { latestByGoalId: {}, firstByGoalId: {} };
  if (exPatientRuleId == null || !targets?.length) return empty;

  const entries = await Promise.all(
    targets.map(async target => {
      if (!isQuestionnaireGoal(target) || target.healthGoalId == null) return null;
      const questionnaireType = resolveQuestionnaireTypeFromTarget(target);
      if (questionnaireType == null) return null;

      try {
        const res = await queryFirstAndLatestExUserQuestion({
          exPatientRuleId: String(exPatientRuleId),
          type: questionnaireType,
          userId: userId != null ? String(userId) : undefined,
        });
        if (!isResourceApiOk(res as unknown as { code?: number })) {
          return [String(target.healthGoalId), null, null] as const;
        }
        const data = apiResourceData<FirstAndLatestUserQuestionRecord>(
          res as unknown as { code?: number; data?: FirstAndLatestUserQuestionRecord },
        );
        return [
          String(target.healthGoalId),
          toFiniteNumber(data?.latestRecord?.score),
          toFiniteNumber(data?.firstRecord?.score),
        ] as const;
      } catch {
        return [String(target.healthGoalId), null, null] as const;
      }
    }),
  );

  const latestByGoalId: Record<string, number | null> = {};
  const firstByGoalId: Record<string, number | null> = {};
  for (const entry of entries) {
    if (!entry) continue;
    latestByGoalId[entry[0]] = entry[1];
    firstByGoalId[entry[0]] = entry[2];
  }
  return { latestByGoalId, firstByGoalId };
}

/** @deprecated 使用 loadQuestionnaireFirstAndLatestByGoalId */
export async function loadLatestQuestionnaireScoreByGoalId(
  exPatientRuleId?: string | number | null,
  targets?: HealthGoalTarget[],
  userId?: string | number | null,
): Promise<Record<string, number | null>> {
  const { latestByGoalId } = await loadQuestionnaireFirstAndLatestByGoalId(
    exPatientRuleId,
    targets,
    userId,
  );
  return latestByGoalId;
}

export function filterScheduleGoalsByCategory(
  items: ScheduleGoalProgressItem[],
  categoryKey: string,
) {
  if (!categoryKey) return [];
  return items.filter(item => item.categoryKey === categoryKey);
}

export function openScheduleGoalDetail(
  navigation: { navigate: (name: any, params?: any) => void },
  item: Pick<ScheduleGoalProgressItem, 'key' | 'detailId' | 'assessmentType' | 'assessmentValue'>,
) {
  const detailId = item.detailId || item.key;
  if (item.assessmentType === 'sys_health_test_item') {
    navigation.navigate('TestingPage', { id: String(detailId) });
    return;
  }
  if (item.assessmentType === 'question_type') {
    navigation.navigate('QuestionnaireTestingPage', { id: String(detailId) });
    return;
  }
  // 运动处方执行率 → 运动处方
  if (item.assessmentValue === 'ex_imp_rate') {
    navigation.navigate('ExercisePage');
    return;
  }
  if (item.assessmentType === 'health_indicator_type') {
    if (item.assessmentValue === 'xueYa') {
      navigation.navigate('BloodPressurePage');
      return;
    }
    if (item.assessmentValue === 'xueTang') {
      navigation.navigate('BloodSugarPage');
      return;
    }
    if (item.assessmentValue === 'xueZhi') {
      navigation.navigate('BloodLipidPage');
      return;
    }
    if (item.assessmentValue === 'tiZhong') {
      navigation.navigate('WeightPage');
      return;
    }
    if (
      item.assessmentValue === 'niaoSuan'
      || item.assessmentValue === 'xueNiaoSuan'
    ) {
      navigation.navigate('UricAcidPage');
    }
  }
}
