import {
  getAiMakeOneDayMealRemainCount,
  getInUseDietPatientRuleInfo,
} from '@/api/dietPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type DietArchiveRelatedFields = {
  primaryDiagnosis: string;
  diagnosticLabel: string;
  primaryHealthGoal: string;
  dietaryPreferences: string;
};

export const MEAL_REFRESH_BY_ARCHIVE_TITLE = '更新本周食谱？';

export const MEAL_REFRESH_BY_ARCHIVE_MESSAGE =
  '健康档案已更新。是否立即根据最新信息调整当前食谱？\n立即更新：重新生成本周（从今天开始）及下周的食谱。\n暂不更新：本周及下周食谱保持不变，生成下下周食谱时自动更新。';

function normalizeDietField(value?: string | null) {
  return String(value ?? '').trim();
}

export function pickDietArchiveRelatedFields(
  source: Partial<DietArchiveRelatedFields>,
): DietArchiveRelatedFields {
  return {
    primaryDiagnosis: normalizeDietField(source.primaryDiagnosis),
    diagnosticLabel: normalizeDietField(source.diagnosticLabel),
    primaryHealthGoal: normalizeDietField(source.primaryHealthGoal),
    dietaryPreferences: normalizeDietField(source.dietaryPreferences),
  };
}

/** 主诉 / 健康标签 / 主要健康目标 / 饮食偏好 是否有变更 */
export function hasDietArchiveFieldsChanged(
  before: DietArchiveRelatedFields,
  after: DietArchiveRelatedFields,
) {
  return (
    before.primaryDiagnosis !== after.primaryDiagnosis
    || before.diagnosticLabel !== after.diagnosticLabel
    || before.primaryHealthGoal !== after.primaryHealthGoal
    || before.dietaryPreferences !== after.dietaryPreferences
  );
}

/** 是否存在进行中的营养处方（无处方时不必弹更新食谱确认） */
export async function hasInUseDietPatientRule(): Promise<boolean> {
  try {
    const res = await getInUseDietPatientRuleInfo();
    if (!isResourceApiOk(res as { code?: number })) return false;
    const data = apiResourceData(res as { code?: number; data?: { dietPatientRuleId?: number | string } });
    const id = data?.dietPatientRuleId;
    return id != null && String(id).trim() !== '';
  } catch {
    return false;
  }
}

/** 今日换一换剩余次数（与 DietPage 同一接口） */
export async function loadAiMakeOneDayMealRemainCount(): Promise<number | null> {
  try {
    const res = await getAiMakeOneDayMealRemainCount();
    if (!isResourceApiOk(res as { code?: number })) return null;
    const raw = apiResourceData(res as { code?: number; data?: number });
    const count = Number(raw);
    return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : null;
  } catch {
    return null;
  }
}

/** 是否还有换一换次数（用于决定是否弹「更新本周食谱」） */
export function hasMealRefreshRemainCount(remainCount: number | null | undefined) {
  return remainCount != null && remainCount > 0;
}
