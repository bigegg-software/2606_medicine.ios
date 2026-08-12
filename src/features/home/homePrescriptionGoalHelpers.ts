import moment from 'moment';
import type { HealthGoalTarget } from '@/api/healthGoal';
import { getMeasureDataLatestByType, getMeasureDataNormalDayCount, type MeasureDataItem } from '@/api/measureData';
import { queryFirstAndLatestHealthTestRecord, type FirstAndLatestHealthTestRecord } from '@/api/exHealthTestRecord';
import { getExPatientRuleModuleCompleteRate } from '@/api/exPatientRule';
import type { InUseExPatientRule, ProgressInfo } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  getPrescriptionProgressStatusText,
  normalizeProgress,
} from '@/src/features/schedule/scheduleHelpers';
import { calcTargetFromInitial } from '@/src/features/schedule/testing/testingHelpers';
import { isExerciseRestDay } from '@/src/features/exercise/utils/trainingPhaseHelpers';
import { parseMeasureNumber } from '@/src/features/profile/vitals/detail/helpers/shared';

const REST_DAY_TEXT = '今日休息日，给身体放个假。';

const HEALTH_INDICATOR_VALUE_ORDER = ['xueYa', 'xueTang', 'tiZhong', 'xueZhi'] as const;

const HEALTH_GOAL_TYPE_ORDER: Record<string, number> = {
  health_indicator_type: 0,
  sys_health_test_item: 1,
  assessment_type_other: 2,
};

const COMPLIANCE_MEASURE_TYPE: Record<'xueYa' | 'xueTang', '血压' | '血糖'> = {
  xueYa: '血压',
  xueTang: '血糖',
};

const INDICATOR_LABEL: Record<'xueYa' | 'xueTang', string> = {
  xueYa: '血压',
  xueTang: '血糖',
};

const LIPID_META = [
  { key: 'ldlC' as const, label: 'LDL-C', lowerBetter: true, rateKey: 'xuezhiLdlCRate', dirKey: 'xuezhiLdlCImproveDirection' },
  { key: 'tg' as const, label: 'TG', lowerBetter: true, rateKey: 'xuezhiTgRate', dirKey: 'xuezhiTgImproveDirection' },
  { key: 'tc' as const, label: 'TC', lowerBetter: true, rateKey: 'xuezhiTcRate', dirKey: 'xuezhiTcImproveDirection' },
  { key: 'hdlC' as const, label: 'HDL-C', lowerBetter: false, rateKey: 'xuezhiHdlCRate', dirKey: 'xuezhiHdlCImproveDirection' },
];

const WAIT_ASSESSMENT_TEXT = '等待评估 请先进行首次测量';

export type HomePrescriptionGoalDisplay =
  | {
    layout: 'metric';
    label: string;
    value: string;
    unit: string;
    badge: string;
  }
  | {
    layout: 'text';
    text: string;
    badge?: string;
  };

export function getPrescriptionCycleDayCount(startDate?: string, endDate?: string) {
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) return null;
  return end.diff(start, 'days') + 1;
}

function toFiniteNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatGoalDecimal(value: number) {
  const fixed = Number(value.toFixed(1));
  return Number.isInteger(fixed) ? String(fixed) : fixed.toFixed(1);
}

function formatDirectionVerb(lowerBetter: boolean) {
  return lowerBetter ? '下降' : '上升';
}

function getHomeGoalSortIndex(target: HealthGoalTarget) {
  const assessmentType = target.healthGoalVo?.assessmentType?.trim() ?? '';
  if (assessmentType === 'question_type') return 9999;
  const typeRank = HEALTH_GOAL_TYPE_ORDER[assessmentType] ?? 3;
  if (assessmentType !== 'health_indicator_type') return typeRank * 100;

  const valueRank = HEALTH_INDICATOR_VALUE_ORDER.indexOf(
    target.healthGoalVo?.assessmentValue?.trim() as typeof HEALTH_INDICATOR_VALUE_ORDER[number],
  );
  return typeRank * 100 + (valueRank >= 0 ? valueRank : 99);
}

export function pickHomePrescriptionGoalTarget(targets?: HealthGoalTarget[]) {
  return (targets ?? [])
    .filter(target => target.healthGoalVo?.assessmentType?.trim() !== 'question_type')
    .sort((left, right) => getHomeGoalSortIndex(left) - getHomeGoalSortIndex(right))[0];
}

function buildFallbackDisplay(
  prescription: InUseExPatientRule,
  progressOverride?: number | null,
): HomePrescriptionGoalDisplay {
  const progress = normalizeProgress(
    progressOverride
    ?? prescription.progress
    ?? prescription.progressInfo?.complateRatio,
  );
  const statusText = getPrescriptionProgressStatusText(progress);
  return {
    layout: 'text',
    text: `当前完成 ${progress} %，${statusText}`,
  };
}

function buildWaitAssessmentDisplay(): HomePrescriptionGoalDisplay {
  return { layout: 'text', text: WAIT_ASSESSMENT_TEXT };
}

function buildComplianceDaysDisplay(
  indicatorValue: 'xueYa' | 'xueTang',
  cycleDays: number,
  compliantDays: number,
): HomePrescriptionGoalDisplay {
  return {
    layout: 'metric',
    label: `${INDICATOR_LABEL[indicatorValue]}控制目标`,
    value: String(Math.round(cycleDays)),
    unit: '天',
    badge: `已达标${Math.round(compliantDays)}天`,
  };
}

function buildWeightDisplay(target: HealthGoalTarget): HomePrescriptionGoalDisplay | null {
  const baseline = toFiniteNumber(target.weight?.baseline);
  const targetKg = toFiniteNumber(target.weight?.target);
  const gain = target.tiZhongImproveDirection === 1
    || (baseline != null && targetKg != null && targetKg > baseline);
  const direction = gain ? '增重' : '减重';

  let goalKg = baseline != null && targetKg != null
    ? Math.abs(targetKg - baseline)
    : toFiniteNumber(target.tiZhongRate ?? target.improveDirectionVal);

  if (goalKg == null || goalKg <= 0) return null;

  // 尚未首次评估
  if (target.improvePercent == null && baseline == null) {
    return buildWaitAssessmentDisplay();
  }
  if (target.improvePercent == null && baseline != null) {
    // 有处方基线但无进度：按已完成 0
    return {
      layout: 'metric',
      label: `${direction}目标`,
      value: formatGoalDecimal(goalKg),
      unit: '千克',
      badge: `已${direction}0千克`,
    };
  }

  const currentKg = Math.abs(goalKg * Number(target.improvePercent ?? 0) / 100);
  return {
    layout: 'metric',
    label: `${direction}目标`,
    value: formatGoalDecimal(goalKg),
    unit: '千克',
    badge: `已${direction}${formatGoalDecimal(currentKg)}千克`,
  };
}

function findFirstLipidMeta(target: HealthGoalTarget) {
  for (const meta of LIPID_META) {
    const pair = target.bloodLipid?.[meta.key];
    if (toFiniteNumber(pair?.baseline) != null || toFiniteNumber(pair?.target) != null) {
      return meta;
    }
  }
  for (const meta of LIPID_META) {
    const rate = toFiniteNumber(target[meta.rateKey] as number | undefined);
    if (rate != null) return meta;
  }
  const fromList = (target.compliantTypes ?? []).find(type => (
    type === 'xuezhiLdlC' || type === 'xuezhiTg' || type === 'xuezhiTc' || type === 'xuezhiHdlC'
  ));
  if (fromList === 'xuezhiLdlC') return LIPID_META[0];
  if (fromList === 'xuezhiTg') return LIPID_META[1];
  if (fromList === 'xuezhiTc') return LIPID_META[2];
  if (fromList === 'xuezhiHdlC') return LIPID_META[3];
  return null;
}

function buildLipidDisplay(target: HealthGoalTarget): HomePrescriptionGoalDisplay | null {
  const meta = findFirstLipidMeta(target);
  if (!meta) return null;

  const pair = target.bloodLipid?.[meta.key];
  const baseline = toFiniteNumber(pair?.baseline);
  const pairTarget = toFiniteNumber(pair?.target);
  const rateAmount = toFiniteNumber(target[meta.rateKey] as number | undefined);
  const dirFromApi = toFiniteNumber(target[meta.dirKey] as number | undefined);

  const lowerBetter = dirFromApi != null
    ? dirFromApi === -1
    : (baseline != null && pairTarget != null ? pairTarget < baseline : meta.lowerBetter);
  const verb = formatDirectionVerb(lowerBetter);

  let goalAmount = baseline != null && pairTarget != null
    ? Math.abs(pairTarget - baseline)
    : rateAmount;

  if (goalAmount == null || goalAmount <= 0) return null;

  if (target.improvePercent == null && baseline == null) {
    return buildWaitAssessmentDisplay();
  }

  const currentAmount = Math.abs(goalAmount * Number(target.improvePercent ?? 0) / 100);
  return {
    layout: 'text',
    text: `${meta.label}${verb} ${formatGoalDecimal(goalAmount)}，已${verb}${formatGoalDecimal(currentAmount)}`,
  };
}

function buildHealthTestDisplay(
  target: HealthGoalTarget,
  firstValue?: number | null,
  latestValue?: number | null,
): HomePrescriptionGoalDisplay | null {
  const goalVo = target.healthGoalVo;
  const detail = goalVo?.healthTestItemVo;
  const testName = detail?.testName?.trim() || goalVo?.goalName?.trim() || '健康测试';
  const unit = detail?.unit?.trim() || '';
  const direction = detail?.improveDirection;
  const configuredBaseline = toFiniteNumber(target.healthTest?.baseline);
  const configuredTarget = toFiniteNumber(target.healthTest?.target);

  if (firstValue == null && latestValue == null && configuredBaseline == null) {
    return buildWaitAssessmentDisplay();
  }
  if (firstValue == null && latestValue == null) {
    return buildWaitAssessmentDisplay();
  }

  const baseline = configuredBaseline ?? firstValue;
  const latest = latestValue ?? firstValue;
  if (baseline == null || latest == null) return buildWaitAssessmentDisplay();

  const targetValue = configuredTarget
    ?? calcTargetFromInitial(baseline, target.improveDirectionVal, direction);
  if (targetValue == null) return buildWaitAssessmentDisplay();

  let currentImprove: number;
  let targetImprove: number;
  if (direction === -1) {
    currentImprove = Number(baseline) - Number(latest);
    targetImprove = Number(baseline) - Number(targetValue);
  } else {
    currentImprove = Number(latest) - Number(baseline);
    targetImprove = Number(targetValue) - Number(baseline);
  }

  currentImprove = Math.max(0, currentImprove);
  targetImprove = Math.max(0, targetImprove);

  const directionText = direction === -1 ? '下降' : '提升';
  return {
    layout: 'text',
    text: `${testName}${directionText}${formatGoalDecimal(currentImprove)}/${formatGoalDecimal(targetImprove)}${unit}`,
  };
}

function buildExerciseHabitDisplay(
  target: HealthGoalTarget,
  currentRateRaw?: number | null,
  progressInfo?: ProgressInfo,
): HomePrescriptionGoalDisplay | null {
  if (target.exImpRate == null) return null;

  const currentRate = normalizeProgress(
    currentRateRaw
    ?? progressInfo?.complateRatio,
  );
  const targetRate = normalizeProgress(target.exImpRate);
  return {
    layout: 'text',
    text: `运动处方执行率${currentRate}/${targetRate}%`,
  };
}

async function hasLatestMeasure(type: '血压' | '血糖' | '体重' | '血脂') {
  try {
    const res = await getMeasureDataLatestByType(type);
    if (!isResourceApiOk(res as unknown as { code?: number })) return false;
    const data = apiResourceData<MeasureDataItem>(
      res as unknown as { code?: number; data?: MeasureDataItem },
    );
    if (!data) return false;
    if (type === '血脂') {
      return parseMeasureNumber(data.xuezhiLdlC) != null
        || parseMeasureNumber(data.xuezhiHdlC) != null
        || parseMeasureNumber(data.xuezhiTc ?? data.val) != null
        || parseMeasureNumber(data.xuezhiTg) != null;
    }
    return parseMeasureNumber(data.val) != null;
  } catch {
    return false;
  }
}

async function loadComplianceDaysDisplay(
  prescription: InUseExPatientRule,
  indicatorValue: 'xueYa' | 'xueTang',
): Promise<HomePrescriptionGoalDisplay | null> {
  const cycleDays = getPrescriptionCycleDayCount(prescription.startDate, prescription.endDate);
  if (cycleDays == null || cycleDays <= 0) return null;

  const measureType = COMPLIANCE_MEASURE_TYPE[indicatorValue];
  const measured = await hasLatestMeasure(measureType);
  if (!measured) return buildWaitAssessmentDisplay();

  let compliantDays = 0;
  const exPatientRuleId = prescription.exPatientRuleId != null
    ? String(prescription.exPatientRuleId)
    : null;
  if (exPatientRuleId) {
    try {
      const countRes = await getMeasureDataNormalDayCount({
        exPatientRuleId,
        type: measureType,
      });
      const countPayload = countRes as unknown as { code?: number; data?: number };
      if (isResourceApiOk(countPayload)) {
        compliantDays = Math.max(0, Math.round(Number(apiResourceData<number>(countPayload) ?? 0)));
      }
    } catch {
      compliantDays = 0;
    }
  }

  return buildComplianceDaysDisplay(indicatorValue, cycleDays, compliantDays);
}

async function loadHealthTestDisplay(
  prescription: InUseExPatientRule,
  target: HealthGoalTarget,
  userId?: string | number,
): Promise<HomePrescriptionGoalDisplay | null> {
  const healthTestItemId = target.healthGoalVo?.healthTestItemVo?.healthTestItemId
    ?? (target.healthGoalVo?.assessmentType === 'sys_health_test_item'
      ? target.healthGoalVo?.assessmentValue
      : null);
  const exPatientRuleId = prescription.exPatientRuleId;
  if (healthTestItemId == null || exPatientRuleId == null) {
    return buildWaitAssessmentDisplay();
  }

  try {
    const res = await queryFirstAndLatestHealthTestRecord({
      exPatientRuleId: String(exPatientRuleId),
      healthTestItemId: String(healthTestItemId),
      userId,
    });
    if (!isResourceApiOk(res)) return buildWaitAssessmentDisplay();
    const records = apiResourceData<FirstAndLatestHealthTestRecord>(
      res as { data?: FirstAndLatestHealthTestRecord },
    );
    return buildHealthTestDisplay(
      target,
      records?.firstRecord?.testValue,
      records?.latestRecord?.testValue,
    );
  } catch {
    return buildWaitAssessmentDisplay();
  }
}

async function loadMainCompleteRate(exPatientRuleId?: string | number | null) {
  if (exPatientRuleId == null) return null;
  try {
    const res = await getExPatientRuleModuleCompleteRate(String(exPatientRuleId));
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    const data = apiResourceData<{ mainCompleteRate?: number }>(
      res as unknown as { code?: number; data?: { mainCompleteRate?: number } },
    );
    return toFiniteNumber(data?.mainCompleteRate);
  } catch {
    return null;
  }
}

export async function loadHomePrescriptionGoalDisplay(
  prescription: InUseExPatientRule | null | undefined,
  userId?: string | number,
): Promise<HomePrescriptionGoalDisplay | null> {
  if (!prescription) return null;

  if (isExerciseRestDay(prescription, moment().format('YYYY-MM-DD'))) {
    return { layout: 'text', text: REST_DAY_TEXT };
  }

  const target = pickHomePrescriptionGoalTarget(prescription.healthGoalTargetList);
  const mainCompleteRate = await loadMainCompleteRate(prescription.exPatientRuleId);

  if (!target) {
    return buildFallbackDisplay(prescription, mainCompleteRate);
  }

  const assessmentType = target.healthGoalVo?.assessmentType?.trim();
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim();

  if (assessmentType === 'health_indicator_type') {
    if (assessmentValue === 'xueYa' || assessmentValue === 'xueTang') {
      const display = await loadComplianceDaysDisplay(prescription, assessmentValue);
      return display ?? buildFallbackDisplay(prescription, mainCompleteRate);
    }
    if (assessmentValue === 'tiZhong') {
      const measured = await hasLatestMeasure('体重');
      if (!measured && toFiniteNumber(target.weight?.baseline) == null) {
        return buildWaitAssessmentDisplay();
      }
      return buildWeightDisplay(target) ?? buildFallbackDisplay(prescription, mainCompleteRate);
    }
    if (assessmentValue === 'xueZhi') {
      const measured = await hasLatestMeasure('血脂');
      if (!measured && !target.bloodLipid) {
        return buildWaitAssessmentDisplay();
      }
      return buildLipidDisplay(target) ?? buildFallbackDisplay(prescription, mainCompleteRate);
    }
  }

  if (assessmentType === 'sys_health_test_item') {
    const display = await loadHealthTestDisplay(prescription, target, userId);
    return display ?? buildFallbackDisplay(prescription, mainCompleteRate);
  }

  if (assessmentValue === 'ex_imp_rate' || target.exImpRate != null) {
    const exerciseDisplay = buildExerciseHabitDisplay(
      target,
      mainCompleteRate,
      prescription.progressInfo,
    );
    if (exerciseDisplay) return exerciseDisplay;
  }

  return buildFallbackDisplay(prescription, mainCompleteRate);
}
