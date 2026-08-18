import type { ImageSourcePropType } from 'react-native';
import type { OldFamilyBindItem } from '@/api/oldFamilyBind';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import type { FamilyPermissionKey } from './myFamilyAddHelpers';
import { FAMILY_PERMISSION_OPTIONS } from './myFamilyAddHelpers';

const PERMISSION_SHORT_LABEL_MAP = Object.fromEntries(
  FAMILY_PERMISSION_OPTIONS.map(item => [item.key, item.shortLabel]),
) as Record<FamilyPermissionKey, string>;

/** 选中项直接作为接口 authPermissions 英文编码提交 */
export function toFamilyPermissionApiCodes(keys: FamilyPermissionKey[]): string[] {
  return [...keys];
}

const PERMISSION_KEY_SET = new Set<string>(FAMILY_PERMISSION_OPTIONS.map(item => item.key));

/** 将接口返回的权限编码解析为本地可选 key */
export function parseFamilyPermissionKeys(authPermissions?: string[]): FamilyPermissionKey[] {
  return (authPermissions ?? []).filter((code): code is FamilyPermissionKey =>
    PERMISSION_KEY_SET.has(code),
  );
}

export function formatFamilyDetailRelationLine(
  relationLabel: string,
  phone?: string,
): string {
  const phoneText = maskFamilyPhone(phone);
  if (!relationLabel) return phoneText;
  return `${relationLabel}·${phoneText}`;
}

export function formatFamilyBindCreateTime(createTime?: string): string | null {
  const value = createTime?.trim();
  if (!value) return null;
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;
  return `${matched[1]}/${matched[2]}/${matched[3]}`;
}

export function maskFamilyPhone(phone?: string): string {
  const value = (phone ?? '').trim();
  if (value.length < 7) return value || '--';
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
}

export function getFamilyDisplayName(item: OldFamilyBindItem): string {
  return (
    item.childRemarkName?.trim() ||
    item.jsUserName?.trim() ||
    item.remarkName?.trim() ||
    '未命名家人'
  );
}

/** 家人列表头像：优先真实头像，否则按性别默认图 */
export function resolveFamilyBindAvatarSource(
  item: Pick<
    OldFamilyBindItem,
    'jsAvatarOssUrl' | 'avatarOssUrl' | 'jsGender' | 'jsUserBaseInfo'
  >,
): ImageSourcePropType {
  const url =
    item.jsAvatarOssUrl?.trim() ||
    item.avatarOssUrl?.trim() ||
    item.jsUserBaseInfo?.avatarOssUrl?.trim() ||
    '';
  if (/^https?:\/\//i.test(url)) return { uri: url };
  return getDefaultAvatarByGender(item.jsGender ?? item.jsUserBaseInfo?.gender);
}

export function getFamilyBindStatusMeta(bindStatus?: number | null): {
  authorized: boolean;
  label: string;
  pending: boolean;
} {
  if (bindStatus === 1) {
    return { authorized: true, label: '已授权', pending: false };
  }
  if (bindStatus === 0) {
    return { authorized: false, label: '未授权', pending: true };
  }
  return { authorized: false, label: '未通过', pending: false };
}

export function formatFamilyPermissionSummary(authPermissions?: string[]): string {
  const list = (authPermissions ?? [])
    .map(
      code =>
        PERMISSION_SHORT_LABEL_MAP[code as FamilyPermissionKey] ??
        FAMILY_PERMISSION_OPTIONS.find(item => item.key === code)?.title,
    )
    .filter(Boolean) as string[];

  if (list.length === 0) return '暂无授权项';
  return `已授权${list.length}项·${list.join(' ')}`;
}

export function getFamilyListSubtitle(item: OldFamilyBindItem): string {
  const status = getFamilyBindStatusMeta(item.bindStatus);
  if (status.pending) return '等待确认中...';
  if (!status.authorized) return item.identityRejectReason?.trim() || '邀请未通过';
  return formatFamilyPermissionSummary(item.authPermissions);
}

export function validateFamilyInviteInput(input: {
  name: string;
  relation: string;
  phone: string;
  permissions: FamilyPermissionKey[];
}): string | null {
  if (!input.name.trim()) return '请输入家人姓名';
  if (!input.relation.trim()) return '请选择关系';
  if (!input.phone.trim()) return '请输入手机号';
  if (!/^1\d{10}$/.test(input.phone.trim())) return '请输入正确的手机号';
  if (input.permissions.length === 0) return '请至少选择一项授权权限';
  return null;
}
