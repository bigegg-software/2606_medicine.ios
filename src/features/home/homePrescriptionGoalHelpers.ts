import moment from 'moment';
import type { HealthGoalTarget } from '@/api/healthGoal';
import { getMeasureDataNormalDayCount } from '@/api/measureData';
import { queryFirstAndLatestHealthTestRecord, type FirstAndLatestHealthTestRecord } from '@/api/exHealthTestRecord';
import type { InUseExPatientRule, ProgressInfo } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  getPrescriptionProgressStatusText,
  normalizeProgress,
} from '@/src/features/schedule/scheduleHelpers';
import { calcTargetFromInitial } from '@/src/features/schedule/testing/testingHelpers';
import { isExerciseRestDay } from '@/src/features/exercise/utils/trainingPhaseHelpers';

const REST_DAY_TEXT = '今日休息日，给身体放个假。';

const HEALTH_INDICATOR_VALUE_ORDER = ['xueYa', 'xueTang', 'tiZhong', 'xueZhi'] as const;

const HEALTH_GOAL_TYPE_ORDER: Record<string, number> = {
  health_indicator_type: 0,
  sys_health_test_item: 1,
  assessment_type_other: 2,
};

const COMPLIANCE_MEASURE_TYPE: Record<string, '血压' | '血糖'> = {
  xueYa: '血压',
  xueTang: '血糖',
};

const INDICATOR_LABEL: Record<string, string> = {
  xueYa: '血压',
  xueTang: '血糖',
};

const LIPID_SHORT_LABEL: Record<string, string> = {
  xuezhiTc: 'TC',
  xuezhiTg: 'TG',
  xuezhiHdlC: 'HDL-C',
  xuezhiLdlC: 'LDL-C',
};

const LIPID_RATE_KEY: Record<string, keyof HealthGoalTarget> = {
  xuezhiTc: 'xuezhiTcRate',
  xuezhiTg: 'xuezhiTgRate',
  xuezhiHdlC: 'xuezhiHdlCRate',
  xuezhiLdlC: 'xuezhiLdlCRate',
};

const LIPID_DIR_KEY: Record<string, keyof HealthGoalTarget> = {
  xuezhiTc: 'xuezhiTcImproveDirection',
  xuezhiTg: 'xuezhiTgImproveDirection',
  xuezhiHdlC: 'xuezhiHdlCImproveDirection',
  xuezhiLdlC: 'xuezhiLdlCImproveDirection',
};

function findFirstLipidType(target: HealthGoalTarget) {
  const fromList = (target.compliantTypes ?? []).find(type => LIPID_SHORT_LABEL[type]);
  if (fromList) return fromList;
  return Object.keys(LIPID_SHORT_LABEL).find(type => {
    const rateKey = LIPID_RATE_KEY[type];
    const rate = target[rateKey] as number | undefined;
    return rate != null && !Number.isNaN(Number(rate));
  });
}

const WAIT_ASSESSMENT_TEXT = '等待评估请先进行首次测量';

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

function calcComplianceTargetDays(cycleDays: number | null, compliantPercent?: number) {
  if (cycleDays == null || cycleDays <= 0) return null;
  if (compliantPercent == null || Number.isNaN(Number(compliantPercent))) return null;
  return Math.round(cycleDays * Number(compliantPercent) / 100);
}

function formatGoalDecimal(value: number) {
  const fixed = Number(value.toFixed(1));
  return Number.isInteger(fixed) ? String(fixed) : fixed.toFixed(1);
}

function formatDirectionVerb(direction?: number) {
  if (direction === 1) return '上升';
  if (direction === -1) return '下降';
  return '改善';
}

function calcProgressAmount(target: number, improvePercent?: number) {
  if (improvePercent == null || Number.isNaN(Number(improvePercent))) return null;
  return Number(target) * Number(improvePercent) / 100;
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

function buildFallbackDisplay(prescription: InUseExPatientRule): HomePrescriptionGoalDisplay {
  const progress = normalizeProgress(
    prescription.progress ?? prescription.progressInfo?.complateRatio,
  );
  const statusText = getPrescriptionProgressStatusText(progress);
  return {
    layout: 'text',
    text: `当前完成${progress}%，${statusText}`,
  };
}

function buildWaitAssessmentDisplay(): HomePrescriptionGoalDisplay {
  return { layout: 'text', text: WAIT_ASSESSMENT_TEXT };
}

function buildComplianceDaysDisplay(
  indicatorValue: 'xueYa' | 'xueTang',
  targetDays: number | null,
  compliantDays: number | null,
): HomePrescriptionGoalDisplay | null {
  if (targetDays == null) return null;
  const label = `${INDICATOR_LABEL[indicatorValue]}控制目标`;
  return {
    layout: 'metric',
    label,
    value: String(targetDays),
    unit: '天',
    badge: `已达标${compliantDays ?? 0}天`,
  };
}

function buildWeightDisplay(target: HealthGoalTarget): HomePrescriptionGoalDisplay | null {
  if (target.improvePercent == null) return buildWaitAssessmentDisplay();

  const goalKg = target.tiZhongRate ?? target.improveDirectionVal;
  if (goalKg == null || Number.isNaN(Number(goalKg))) return null;

  const direction = target.tiZhongImproveDirection === 1 ? '增重' : '减重';
  const currentKg = calcProgressAmount(Number(goalKg), target.improvePercent);
  if (currentKg == null) return buildWaitAssessmentDisplay();

  return {
    layout: 'metric',
    label: `${direction}目标`,
    value: formatGoalDecimal(Number(goalKg)),
    unit: '千克',
    badge: `已${direction}${formatGoalDecimal(Math.abs(currentKg))}千克`,
  };
}

function buildLipidImproveDisplay(target: HealthGoalTarget): HomePrescriptionGoalDisplay | null {
  if (target.improvePercent == null) return buildWaitAssessmentDisplay();

  const lipidType = findFirstLipidType(target);
  if (!lipidType) return null;

  const rateKey = LIPID_RATE_KEY[lipidType];
  const dirKey = LIPID_DIR_KEY[lipidType];
  const targetAmount = target[rateKey] as number | undefined;
  const direction = target[dirKey] as number | undefined;
  if (targetAmount == null || Number.isNaN(Number(targetAmount))) return null;

  const currentAmount = calcProgressAmount(Number(targetAmount), target.improvePercent);
  if (currentAmount == null) return buildWaitAssessmentDisplay();

  const label = LIPID_SHORT_LABEL[lipidType];
  const verb = formatDirectionVerb(direction);
  const text = `${label}${verb}${formatGoalDecimal(Number(targetAmount))}，已${verb}${formatGoalDecimal(Math.abs(currentAmount))}`;
  return { layout: 'text', text };
}

function buildLipidCompliantDisplay(target: HealthGoalTarget): HomePrescriptionGoalDisplay | null {
  if (target.improvePercent == null) return buildWaitAssessmentDisplay();

  const lipidType = findFirstLipidType(target);
  if (!lipidType) return null;

  const dirKey = LIPID_DIR_KEY[lipidType];
  const direction = target[dirKey] as number | undefined;
  const rateKey = LIPID_RATE_KEY[lipidType];
  const targetAmount = target[rateKey] as number | undefined;
  const currentAmount = targetAmount != null
    ? calcProgressAmount(Number(targetAmount), target.improvePercent)
    : null;

  if (currentAmount == null) return buildWaitAssessmentDisplay();

  const label = LIPID_SHORT_LABEL[lipidType];
  const verb = formatDirectionVerb(direction);
  return {
    layout: 'text',
    text: `${label}达标，当前已${verb}${formatGoalDecimal(Math.abs(currentAmount))}`,
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

  if (firstValue == null || latestValue == null) {
    return buildWaitAssessmentDisplay();
  }

  const targetValue = calcTargetFromInitial(firstValue, target.improveDirectionVal, direction);
  if (targetValue == null) return buildWaitAssessmentDisplay();

  let currentImprove: number;
  let targetImprove: number;
  if (direction === -1) {
    currentImprove = Number(firstValue) - Number(latestValue);
    targetImprove = Number(firstValue) - Number(targetValue);
  } else {
    currentImprove = Number(latestValue) - Number(firstValue);
    targetImprove = Number(targetValue) - Number(firstValue);
  }

  currentImprove = Math.max(0, currentImprove);
  targetImprove = Math.max(0, targetImprove);

  const directionText = direction === -1 ? '下降' : '提升';
  const unitSuffix = unit ? unit : '';
  return {
    layout: 'text',
    text: `${testName}${directionText}${formatGoalDecimal(currentImprove)}/${formatGoalDecimal(targetImprove)}${unitSuffix}`,
  };
}

function buildExerciseHabitDisplay(
  target: HealthGoalTarget,
  progressInfo?: ProgressInfo,
): HomePrescriptionGoalDisplay | null {
  if (target.exImpRate == null) return null;

  const goalName = target.healthGoalVo?.goalName?.trim() || '建立运动习惯';
  const currentRate = normalizeProgress(progressInfo?.complateRatio);
  const targetRate = normalizeProgress(target.exImpRate);
  return {
    layout: 'text',
    text: `${goalName}，运动处方执行率${currentRate}/${targetRate}%`,
  };
}

async function loadComplianceDaysDisplay(
  prescription: InUseExPatientRule,
  target: HealthGoalTarget,
  indicatorValue: 'xueYa' | 'xueTang',
): Promise<HomePrescriptionGoalDisplay | null> {
  const cycleDays = getPrescriptionCycleDayCount(prescription.startDate, prescription.endDate);
  const targetDays = calcComplianceTargetDays(cycleDays, target.compliantPercent);
  if (targetDays == null) return null;

  let compliantDays: number | null = null;
  const exPatientRuleId = prescription.exPatientRuleId != null
    ? String(prescription.exPatientRuleId)
    : null;
  if (exPatientRuleId) {
    try {
      const countRes = await getMeasureDataNormalDayCount({
        exPatientRuleId,
        type: COMPLIANCE_MEASURE_TYPE[indicatorValue],
      });
      const countPayload = countRes as unknown as { code?: number; data?: number };
      if (isResourceApiOk(countPayload)) {
        compliantDays = apiResourceData<number>(countPayload) ?? 0;
      }
    } catch {
      compliantDays = null;
    }
  }

  return buildComplianceDaysDisplay(indicatorValue, targetDays, compliantDays);
}

async function loadHealthTestDisplay(
  prescription: InUseExPatientRule,
  target: HealthGoalTarget,
  userId?: string | number,
): Promise<HomePrescriptionGoalDisplay | null> {
  const healthTestItemId = target.healthGoalVo?.healthTestItemVo?.healthTestItemId;
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
    const records = apiResourceData<FirstAndLatestHealthTestRecord>(res as { data?: FirstAndLatestHealthTestRecord });
    return buildHealthTestDisplay(
      target,
      records?.firstRecord?.testValue,
      records?.latestRecord?.testValue,
    );
  } catch {
    return buildWaitAssessmentDisplay();
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
  if (!target) {
    return buildFallbackDisplay(prescription);
  }

  const assessmentType = target.healthGoalVo?.assessmentType?.trim();
  const assessmentValue = target.healthGoalVo?.assessmentValue?.trim();

  if (assessmentType === 'health_indicator_type') {
    if (assessmentValue === 'xueYa' || assessmentValue === 'xueTang') {
      const display = await loadComplianceDaysDisplay(
        prescription,
        target,
        assessmentValue,
      );
      return display ?? buildFallbackDisplay(prescription);
    }
    if (assessmentValue === 'tiZhong') {
      return buildWeightDisplay(target) ?? buildFallbackDisplay(prescription);
    }
    if (assessmentValue === 'xueZhi') {
      if (target.complianceImproveType === 1) {
        return buildLipidImproveDisplay(target) ?? buildFallbackDisplay(prescription);
      }
      return buildLipidCompliantDisplay(target) ?? buildFallbackDisplay(prescription);
    }
  }

  if (assessmentType === 'sys_health_test_item') {
    const display = await loadHealthTestDisplay(prescription, target, userId);
    return display ?? buildFallbackDisplay(prescription);
  }

  const exerciseDisplay = buildExerciseHabitDisplay(target, prescription.progressInfo);
  if (exerciseDisplay) return exerciseDisplay;

  return buildFallbackDisplay(prescription);
}
