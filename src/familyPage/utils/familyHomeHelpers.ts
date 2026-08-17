import type { FamilyBindItem } from '@/api/familyBind';
import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser } from '@/api/user';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import {
  getApprovedFamilyBindList,
  getChildFamilyDisplayName,
  getFamilyTabKey,
} from './familyProfileHelpers';

export type FamilyHomeMemberCard = {
  key: string;
  name: string;
  relationLabel: string;
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

/** 首页副标题：关系列表，如 父亲·母亲 */
export function getFamilyHomeSubtitle(
  list: FamilyBindItem[],
  relationLabelMap: Record<string, string>,
): string {
  const approved = getApprovedFamilyBindList(list);
  if (approved.length === 0) return '暂无绑定家人';
  const labels = approved.map(item => {
    const relation =
      relationLabelMap[String(item.relationType ?? '')] ||
      item.relationType?.trim() ||
      '';
    return relation || getChildFamilyDisplayName(item);
  });
  return labels.join('·');
}

/** 首页家人卡片基础列表（来自 store 已通过绑定） */
export function buildFamilyHomeMemberCards(
  list: FamilyBindItem[],
  relationLabelMap: Record<string, string>,
): FamilyHomeMemberCard[] {
  return getApprovedFamilyBindList(list).map((item, index) => {
    const relationLabel =
      relationLabelMap[String(item.relationType ?? '')] ||
      item.relationType?.trim() ||
      getChildFamilyDisplayName(item);
    return {
      key: getFamilyTabKey(item, index),
      name: relationLabel,
      relationLabel,
    };
  });
}
