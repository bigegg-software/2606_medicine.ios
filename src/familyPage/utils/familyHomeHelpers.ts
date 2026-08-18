import type { FamilyBindItem } from '@/api/familyBind';
import type { PersonalizedDynamicIndicatorMatchData } from '@/api/personalizedDynamicIndicator';
import { matchPersonalizedDynamicIndicator } from '@/api/personalizedDynamicIndicator';
import {
  getExPatientRuleModuleCompleteRate,
  type ExPatientRuleModuleCompleteRate,
} from '@/api/exPatientRule';
import { getInUseExPatientRuleInfo } from '@/api/schedule';
import { getUserTokenDetailList, type UserTokenDetail } from '@/api/userTokenDetail';
import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser } from '@/api/user';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';
import { formatSignRewardsTokens } from '@/src/features/profile/utils/signInHelpers';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { loadFamilyMealNutritionItems } from '@/src/familyPage/FamilyData/utils/familyDataMealHelpers';
import { countFamilyLatestVitalAbnormal } from '@/src/familyPage/FamilyData/utils/familyDataVitalHelpers';
import {
  getApprovedFamilyBindList,
  getChildFamilyDisplayName,
  getFamilyTabKey,
} from './familyProfileHelpers';

export type FamilyHomeMemberCard = {
  key: string;
  name: string;
  relationLabel: string;
  patientUserId: string;
};

/** 首页问候时段文案 */
export function getFamilyHomeGreetingPeriod(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

/** 首页问候标题：下午好，张伟 */
export function getFamilyHomeGreetingTitle(
  user?: UserBaseInfo | null,
  systemUser?: SystemUser | null,
  date = new Date(),
): string {
  const name = getDisplayUserName(user, systemUser) || '用户';
  return `${getFamilyHomeGreetingPeriod(date)}，${name}`;
}

/** 匹配接口返回了指标类型则需关注 */
export function hasPersonalizedDynamicIndicator(
  data?: PersonalizedDynamicIndicatorMatchData | null,
): boolean {
  return Boolean(data?.type?.trim());
}

/** 拉取指定家人是否需关注（有匹配类型=需关注，无数据=良好） */
export async function loadFamilyMemberNeedsAttention(
  patientUserId: string,
): Promise<boolean> {
  const id = String(patientUserId).trim();
  if (!id) return false;
  try {
    const res = await matchPersonalizedDynamicIndicator({ patientUserId: id });
    const data = apiResourceData<PersonalizedDynamicIndicatorMatchData>(res);
    return hasPersonalizedDynamicIndicator(data);
  } catch {
    return false;
  }
}

/** 批量拉取已绑定家人的关注状态，key 为 patientUserId */
export async function loadFamilyHomeAttentionMap(
  list: FamilyBindItem[],
): Promise<Record<string, boolean>> {
  const approved = getApprovedFamilyBindList(list);
  const entries = await Promise.all(
    approved.map(async item => {
      const id = item.patientUserId != null ? String(item.patientUserId).trim() : '';
      if (!id) return ['', false] as const;
      const needsAttention = await loadFamilyMemberNeedsAttention(id);
      return [id, needsAttention] as const;
    }),
  );
  const map: Record<string, boolean> = {};
  entries.forEach(([id, needsAttention]) => {
    if (id) map[id] = needsAttention;
  });
  return map;
}

/** 拉取指定家人在用处方的主训练完成率 0-100；无处方或失败返回 null */
export async function loadFamilyMemberMainCompleteRate(
  patientUserId: string,
): Promise<number | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;
  try {
    const ruleRes = await getInUseExPatientRuleInfo({ patientUserId: id });
    const rule = apiResourceData<{ exPatientRuleId?: string | number }>(
      ruleRes as unknown as { code?: number; data?: { exPatientRuleId?: string | number } },
    );
    const ruleId = rule?.exPatientRuleId != null ? String(rule.exPatientRuleId).trim() : '';
    if (!ruleId) return null;
    const rateRes = await getExPatientRuleModuleCompleteRate(ruleId, { patientUserId: id });
    const data = apiResourceData<ExPatientRuleModuleCompleteRate>(rateRes);
    const rate = Number(data?.mainCompleteRate);
    if (!Number.isFinite(rate)) return null;
    return Math.max(0, Math.min(100, rate));
  } catch {
    return null;
  }
}

/** 批量拉取已绑定家人运动处方主训练完成率，key 为 patientUserId */
export async function loadFamilyHomeActivityProgressMap(
  list: FamilyBindItem[],
): Promise<Record<string, number | null>> {
  const approved = getApprovedFamilyBindList(list);
  const entries = await Promise.all(
    approved.map(async item => {
      const id = item.patientUserId != null ? String(item.patientUserId).trim() : '';
      if (!id) return ['', null] as const;
      const rate = await loadFamilyMemberMainCompleteRate(id);
      return [id, rate] as const;
    }),
  );
  const map: Record<string, number | null> = {};
  entries.forEach(([id, rate]) => {
    if (id) map[id] = rate;
  });
  return map;
}

export function formatFamilyHomeActivityProgressText(rate: number | null | undefined) {
  if (rate == null || !Number.isFinite(Number(rate))) return '--';
  return `${Math.max(0, Math.min(100, Math.round(Number(rate))))}%`;
}

export function resolveFamilyHomeActivityProgressPercent(rate: number | null | undefined) {
  if (rate == null || !Number.isFinite(Number(rate))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(rate))));
}

/** 最新一条积分明细的 tokens 为当前余额；无记录视为 0 */
export async function loadFamilyMemberTokens(
  patientUserId: string,
): Promise<number | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;
  try {
    const res = await getUserTokenDetailList(
      { pageNum: 1, pageSize: 1 },
      { patientUserId: id },
    );
    const rows = getResourceRows<UserTokenDetail>(res);
    if (rows.length === 0) return 0;
    const n = Number(rows[0]?.tokens);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return null;
  }
}

/** 批量拉取已绑定家人积分，key 为 patientUserId */
export async function loadFamilyHomeTokensMap(
  list: FamilyBindItem[],
): Promise<Record<string, number | null>> {
  const approved = getApprovedFamilyBindList(list);
  const entries = await Promise.all(
    approved.map(async item => {
      const id = item.patientUserId != null ? String(item.patientUserId).trim() : '';
      if (!id) return ['', null] as const;
      const tokens = await loadFamilyMemberTokens(id);
      return [id, tokens] as const;
    }),
  );
  const map: Record<string, number | null> = {};
  entries.forEach(([id, tokens]) => {
    if (id) map[id] = tokens;
  });
  return map;
}

export function formatFamilyHomeTokensText(tokens: number | null | undefined) {
  if (tokens == null || !Number.isFinite(Number(tokens))) return '--';
  return formatSignRewardsTokens(tokens);
}

export type FamilyHomeFocusSummary = {
  healthAbnormalCount: number | null;
  nutritionRate: number | null;
};

export function emptyFamilyHomeFocusSummary(): FamilyHomeFocusSummary {
  return { healthAbnormalCount: null, nutritionRate: null };
}

/** 首页重点关注：第一位家人的健康异常项数、营养处方进度 */
export async function loadFamilyHomeFocusSummary(
  patientUserId: string,
): Promise<FamilyHomeFocusSummary> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyHomeFocusSummary();
  try {
    const [healthAbnormalCount, mealItems] = await Promise.all([
      countFamilyLatestVitalAbnormal(id),
      loadFamilyMealNutritionItems(id),
    ]);
    const calorie = mealItems.find(item => item.key === 'calorie');
    const hasDietTarget = Boolean(calorie && calorie.targetValue && !calorie.targetValue.startsWith('--'));
    const nutritionRate = hasDietTarget ? calorie!.progress : null;
    return { healthAbnormalCount, nutritionRate };
  } catch {
    return emptyFamilyHomeFocusSummary();
  }
}

export function formatFamilyHomeFocusHealthText(count: number | null | undefined) {
  if (count == null || !Number.isFinite(Number(count))) return '--';
  return `${Math.max(0, Math.round(Number(count)))}项异常`;
}

export function formatFamilyHomeFocusProgressText(rate: number | null | undefined) {
  if (rate == null || !Number.isFinite(Number(rate))) return '--';
  return `进度 ${Math.max(0, Math.min(100, Math.round(Number(rate))))}%`;
}

function getFamilyHomeMemberRelationLabel(
  item: FamilyBindItem,
  relationLabelMap: Record<string, string>,
): string {
  return (
    relationLabelMap[String(item.relationType ?? '')] ||
    item.relationType?.trim() ||
    getChildFamilyDisplayName(item)
  );
}

/** 首页副标题：父亲良好·母亲需关注 */
export function getFamilyHomeSubtitle(
  list: FamilyBindItem[],
  relationLabelMap: Record<string, string>,
  attentionByPatientUserId?: Record<string, boolean>,
): string {
  const approved = getApprovedFamilyBindList(list);
  if (approved.length === 0) return '暂无绑定家人';
  return approved
    .map(item => {
      const relation = getFamilyHomeMemberRelationLabel(item, relationLabelMap);
      const id = item.patientUserId != null ? String(item.patientUserId).trim() : '';
      const needsAttention = id ? attentionByPatientUserId?.[id] : undefined;
      const status = needsAttention ? '需关注' : '良好';
      return `${relation}${status}`;
    })
    .join('·');
}

/** 首页家人卡片基础列表（来自 store 已通过绑定） */
export function buildFamilyHomeMemberCards(
  list: FamilyBindItem[],
  relationLabelMap: Record<string, string>,
): FamilyHomeMemberCard[] {
  return getApprovedFamilyBindList(list).map((item, index) => {
    const relationLabel = getFamilyHomeMemberRelationLabel(item, relationLabelMap);
    return {
      key: getFamilyTabKey(item, index),
      name: relationLabel,
      relationLabel,
      patientUserId: item.patientUserId != null ? String(item.patientUserId).trim() : '',
    };
  });
}
