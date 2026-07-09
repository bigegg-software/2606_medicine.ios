import type { RootStackParamList } from '@/route/router';
import { updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { AppDispatch } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import type { UserExtr } from '@/api/user';

export type VitalsGoalKind = 'sleep' | 'energy' | 'steps';

export type VitalsDetailMenuConfig = {
  allRecordsType?: RootStackParamList['AllDataPage']['type'];
  goalKind?: VitalsGoalKind;
};

export const DEFAULT_SLEEP_TARGET_HOURS = 8;
export const DEFAULT_STEP_TARGET = 10000;
export const DEFAULT_ENERGY_TARGET = 2000;
export const ENERGY_GOAL_MAX = 5000;

type UserExtrGoals = {
  sleepGoals?: number;
  stepGoals?: number;
  energyGoals?: number;
};

export function resolveSleepTargetHours(sleepGoalsMinutes?: number) {
  if (sleepGoalsMinutes != null && sleepGoalsMinutes > 0) {
    return Math.round((sleepGoalsMinutes / 60) * 2) / 2;
  }
  return DEFAULT_SLEEP_TARGET_HOURS;
}

export function resolveStepTarget(stepGoals?: number) {
  if (stepGoals != null && stepGoals >= 0) {
    return Math.round(stepGoals / 500) * 500;
  }
  return DEFAULT_STEP_TARGET;
}

export function resolveEnergyTarget(energyGoals?: number) {
  if (energyGoals != null && energyGoals >= 0) {
    return Math.round(energyGoals / 50) * 50;
  }
  return DEFAULT_ENERGY_TARGET;
}

export function resolveGoalTargetValue(kind: VitalsGoalKind, userExtr?: UserExtrGoals | null) {
  if (kind === 'sleep') return resolveSleepTargetHours(userExtr?.sleepGoals);
  if (kind === 'steps') return resolveStepTarget(userExtr?.stepGoals);
  return resolveEnergyTarget(userExtr?.energyGoals);
}

export function getGoalTargetModalConfig(kind: VitalsGoalKind) {
  if (kind === 'sleep') {
    return {
      title: '设置睡眠目标',
      label: '每日目标（小时）',
      unit: '小时',
      min: 1,
      max: 10,
      step: 0.5,
    };
  }

  if (kind === 'steps') {
    return {
      title: '设置步数目标',
      label: '每日目标（步）',
      unit: '步',
      min: 0,
      max: 20000,
      step: 500,
      patternUnitSize: 1000,
      formatDisplay: (value: number) => value.toLocaleString(),
    };
  }

  return {
    title: '设置消耗目标',
    label: '每日目标（千卡）',
    unit: '千卡',
    min: 0,
    max: ENERGY_GOAL_MAX,
    step: 50,
    patternUnitSize: 100,
    formatDisplay: (value: number) => value.toLocaleString(),
  };
}

export function getGoalSaveSuccessMessage(kind: VitalsGoalKind) {
  if (kind === 'sleep') return '睡眠目标已保存';
  if (kind === 'steps') return '步数目标已保存';
  return '消耗目标已保存';
}

export function getGoalSaveErrorMessage(kind: VitalsGoalKind) {
  if (kind === 'sleep') return '保存睡眠目标失败，请稍后重试';
  if (kind === 'steps') return '保存步数目标失败，请稍后重试';
  return '保存消耗目标失败，请稍后重试';
}

export function buildGoalSavePayload(kind: VitalsGoalKind, target: number) {
  if (kind === 'sleep') return { sleepGoals: Math.round(target * 60) };
  if (kind === 'steps') return { stepGoals: Math.round(target) };
  return { energyGoals: Math.round(target) };
}

export async function saveVitalsGoalTarget(
  kind: VitalsGoalKind,
  target: number,
  userExtr: UserExtr | null | undefined,
  dispatch: AppDispatch,
) {
  const payload = buildGoalSavePayload(kind, target);
  const res = await updateExtrInfo(payload);
  if (!isResourceApiOk(res as { code?: number })) {
    return {
      ok: false as const,
      message: (res as { msg?: string })?.msg ?? '保存失败，请稍后重试',
    };
  }

  if (userExtr) {
    dispatch({
      type: SET_USER_EXTR,
      payload: { ...userExtr, ...payload },
    });
  }

  return { ok: true as const };
}
