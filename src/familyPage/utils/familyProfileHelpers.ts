import type { ImageSourcePropType } from 'react-native';
import type { FamilyBindItem } from '@/api/familyBind';
import type { UserBaseInfo } from '@/api/patient';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import { maskFamilyPhone } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';
import { isChildFamilyBindVisible } from './familyBindNoticeHelpers';

/** 家人 Tab / 选中 key：优先 bind id，其次患者 userId */
export function getFamilyTabKey(item: FamilyBindItem, index: number): string {
  if (item.id != null) return String(item.id);
  if (item.patientUserId != null) return String(item.patientUserId);
  return `family-${index}`;
}

/** 已通过绑定的家人（数据/首页展示，排除待确认解绑与账号异常） */
export function getApprovedFamilyBindList(list: FamilyBindItem[]): FamilyBindItem[] {
  return list.filter(
    item => Number(item.bindStatus) === 1 && isChildFamilyBindVisible(item),
  );
}

/** 绑定待对方确认 */
export function isFamilyBindPending(item?: Pick<FamilyBindItem, 'bindStatus'> | null) {
  return Number(item?.bindStatus) === 0;
}

/** 家人端档案页可见：已通过 + 待确认 */
export function getDisplayFamilyBindList(list: FamilyBindItem[]): FamilyBindItem[] {
  return list.filter(item => {
    const status = Number(item.bindStatus);
    if (status !== 0 && status !== 1) return false;
    return isChildFamilyBindVisible(item);
  });
}

/** 家人姓名匿名：王强→王*，王某某→王**（保留首字，其余为 *） */
export function maskFamilyDisplayName(name?: string | null): string {
  const value = name?.trim() || '';
  if (!value) return '';
  if (value.length === 1) return value;
  return `${value[0]}${'*'.repeat(value.length - 1)}`;
}

/** 绑定记录展示名：优先 childRemarkName，其次 remarkName；一律匿名 */
function resolveMaskedFamilyBindName(item: FamilyBindItem, fallback: string): string {
  return (
    maskFamilyDisplayName(item.childRemarkName) ||
    maskFamilyDisplayName(item.remarkName) ||
    maskFamilyDisplayName(item.patientName) ||
    fallback
  );
}

/** 家人 Tab / 切换角标文案（匿名） */
export function getFamilyTabLabel(item: FamilyBindItem): string {
  return resolveMaskedFamilyBindName(item, '家人');
}

/** 子女端绑定老人姓名原文（提交/特殊逻辑用，页面展示请用 getChildFamilyDisplayName） */
export function getChildFamilyRawDisplayName(item: FamilyBindItem): string {
  return item.childRemarkName?.trim() || item.remarkName?.trim() || item.patientName?.trim() || '未命名';
}

/** 子女端展示绑定的老人姓名（匿名） */
export function getChildFamilyDisplayName(item: FamilyBindItem): string {
  return resolveMaskedFamilyBindName(item, '未命名');
}

/** 子女端家人头像：优先真实头像，否则按性别默认图 */
export function resolveChildFamilyAvatarSource(
  item?: Pick<
    FamilyBindItem,
    'patientAvatarOssUrl' | 'avatarOssUrl' | 'patientGender' | 'patientUserBaseInfo'
  > | null,
  user?: Pick<UserBaseInfo, 'avatarOssUrl' | 'gender'> | null,
): ImageSourcePropType {
  const url =
    user?.avatarOssUrl?.trim() ||
    item?.patientAvatarOssUrl?.trim() ||
    item?.avatarOssUrl?.trim() ||
    item?.patientUserBaseInfo?.avatarOssUrl?.trim() ||
    '';
  if (/^https?:\/\//i.test(url)) return { uri: url };
  return getDefaultAvatarByGender(
    user?.gender ?? item?.patientGender ?? item?.patientUserBaseInfo?.gender,
  );
}

export function getChildFamilySubtitle(item: FamilyBindItem): string {
  return maskFamilyPhone(item.patientPhonenumber);
}

/** 资料卡副文案：关系·手机号 */
export function getChildFamilyMetaLine(
  item: FamilyBindItem,
  relationLabel?: string,
): string {
  const parts: string[] = [];
  const relation = relationLabel?.trim();
  if (relation) parts.push(relation);
  const phone = maskFamilyPhone(item.patientPhonenumber);
  if (phone && phone !== '--') parts.push(phone);
  return parts.length ? parts.join('·') : '--';
}

export type FamilyMemberInfoRow = {
  key: string;
  title: string;
  value: string;
  icon: ImageSourcePropType;
};

/** 家人资料卡健康信息行（空占位，实际值由 loadFamilyMemberInfoRows 填充） */
export const FAMILY_MEMBER_INFO_ROWS: FamilyMemberInfoRow[] = [
  {
    key: 'emergency',
    title: '紧急联系人：',
    value: '--',
    icon: require('@/assets/family/profile/info_emergency.png'),
  },
  {
    key: 'allergy',
    title: '过敏史：',
    value: '--',
    icon: require('@/assets/family/profile/info_allergy.png'),
  },
  {
    key: 'family-history',
    title: '家族病史：',
    value: '--',
    icon: require('@/assets/family/profile/info_family_history.png'),
  },
  {
    key: 'case',
    title: '病历记录：',
    value: '--',
    icon: require('@/assets/family/profile/info_case.png'),
  },
];

export type FamilyDeviceOnlineStatus = 'online' | 'offline';

export type FamilyDeviceItem = {
  key: string;
  name: string;
  status: FamilyDeviceOnlineStatus;
  /** 离线时展示，如：2小时前 */
  statusExtra?: string;
  icon: ImageSourcePropType;
};

/** 家人资料页设备连接状态静态列表 */
export const FAMILY_DEVICE_ITEMS: FamilyDeviceItem[] = [
  {
    key: 'bp',
    name: '血压仪',
    status: 'offline',
    statusExtra: '2小时前',
    icon: require('@/assets/family/profile/device_bp.png'),
  },
  {
    key: 'glucose',
    name: '血糖仪',
    status: 'online',
    icon: require('@/assets/family/profile/device_glucose.png'),
  },
];

export function formatFamilyDeviceStatusText(item: FamilyDeviceItem): string {
  if (item.status === 'online') return '在线';
  if (item.statusExtra) return `离线 (${item.statusExtra})`;
  return '离线';
}
