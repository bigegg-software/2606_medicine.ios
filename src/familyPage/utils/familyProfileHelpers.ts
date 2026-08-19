import type { ImageSourcePropType } from 'react-native';
import type { FamilyBindItem } from '@/api/familyBind';
import type { UserBaseInfo } from '@/api/patient';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import { maskFamilyPhone } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';

/** 家人 Tab / 选中 key：优先 bind id，其次患者 userId */
export function getFamilyTabKey(item: FamilyBindItem, index: number): string {
  if (item.id != null) return String(item.id);
  if (item.patientUserId != null) return String(item.patientUserId);
  return `family-${index}`;
}

/** 已通过绑定的家人（数据/档案 Tab 展示） */
export function getApprovedFamilyBindList(list: FamilyBindItem[]): FamilyBindItem[] {
  return list.filter(item => Number(item.bindStatus) === 1);
}

/** 家人 Tab / 切换角标文案：统一 childRemarkName */
export function getFamilyTabLabel(item: FamilyBindItem): string {
  return (
    item.childRemarkName?.trim() ||
    item.remarkName?.trim() ||
    item.patientName?.trim() ||
    '家人'
  );
}

/** 子女端展示绑定的老人姓名 */
export function getChildFamilyDisplayName(item: FamilyBindItem): string {
  return item.remarkName?.trim() || item.patientName?.trim() || item.childRemarkName?.trim() || '未命名';
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
