import moment from 'moment';
import {
  getDietPatientRuleSnapshotByDate,
  getInUseDietPatientRuleInfo,
  getListMealDay,
  type DietMealDayItem,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { isDietRuleActiveOnDate } from './dietMealHelpers';
import { applyMealDayForDateToRule } from './mealRefreshPeriodHelpers';

export type DietPatientRuleDateOptions = {
  patientUserId?: string | number | null;
  /** 指定营养处方 id（数据隔离，快照接口必传） */
  dietPatientRuleId?: string | number | null;
};

function toRuleId(value?: string | number | null) {
  if (value == null) return undefined;
  const id = String(value).trim();
  return id || undefined;
}

/** 处方元信息用于展示目标热量等；推荐餐次一律来自 listMealDay */
function ruleMetaWithoutWeeklyMeals(rule: DietPatientRuleInfo): DietPatientRuleInfo {
  return { ...rule, mealList: [] };
}

/** 拉取指定日期的按日食谱作为推荐 mealList（无数据则空，不回退周模板） */
export async function overlayMealDayForDate(
  rule: DietPatientRuleInfo | null,
  customerLocalDate: string,
  options?: DietPatientRuleDateOptions,
): Promise<DietPatientRuleInfo | null> {
  if (!rule) return null;
  const base = ruleMetaWithoutWeeklyMeals(rule);
  const dietPatientRuleId = toRuleId(options?.dietPatientRuleId ?? rule.dietPatientRuleId);
  if (!dietPatientRuleId) return base;

  try {
    const res = await getListMealDay(
      {
        dietPatientRuleId,
        startDate: customerLocalDate,
        endDate: customerLocalDate,
      },
      options,
    );
    if (!isResourceApiOk(res as unknown as { code?: number })) return base;
    const list = apiResourceData(
      res as unknown as { code?: number; data?: DietMealDayItem[] },
    ) ?? [];
    return applyMealDayForDateToRule(base, list, customerLocalDate);
  } catch {
    return base;
  }
}

export async function fetchDietRuleForDate(
  customerLocalDate: string,
  options?: DietPatientRuleDateOptions,
): Promise<DietPatientRuleInfo | null> {
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
  const dietPatientRuleId = toRuleId(options?.dietPatientRuleId);
  try {
    // 今日且未锁定处方：走在用处方；其余（含历史日期）必须带 dietPatientRuleId 拉快照
    if (isToday && !dietPatientRuleId) {
      const res = await getInUseDietPatientRuleInfo(options);
      if (!isResourceApiOk(res as unknown as { code?: number })) return null;
      return (
        apiResourceData<DietPatientRuleInfo>(
          res as unknown as { code?: number; data?: DietPatientRuleInfo },
        ) ?? null
      );
    }

    if (!dietPatientRuleId) return null;

    const res = await getDietPatientRuleSnapshotByDate(
      { customerLocalDate, dietPatientRuleId },
      options,
    );
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return (
      apiResourceData<DietPatientRuleInfo>(
        res as unknown as { code?: number; data?: DietPatientRuleInfo },
      ) ?? null
    );
  } catch {
    return null;
  }
}

/**
 * 今天与未来：使用当前在用处方元信息；
 * 过去日期：按本地日期查询处方快照。
 * 推荐餐次一律用 listMealDay 回显，不再使用老周模板 mealList。
 */
export async function loadDietRuleForDate(
  customerLocalDate: string,
  inUseRule: DietPatientRuleInfo | null,
  options?: DietPatientRuleDateOptions,
): Promise<DietPatientRuleInfo | null> {
  const today = moment().format('YYYY-MM-DD');
  const dietPatientRuleId = toRuleId(
    options?.dietPatientRuleId ?? inUseRule?.dietPatientRuleId,
  );

  const rule = customerLocalDate >= today
    ? inUseRule
    : await fetchDietRuleForDate(customerLocalDate, {
        ...options,
        dietPatientRuleId,
      });
  if (!isDietRuleActiveOnDate(rule, customerLocalDate)) return null;
  return overlayMealDayForDate(rule, customerLocalDate, {
    ...options,
    dietPatientRuleId,
  });
}
