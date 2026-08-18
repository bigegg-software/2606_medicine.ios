import type { ImageSourcePropType } from 'react-native';

/** 身份审核状态 0.待审核 1.审核通过 2.未审核通过；null 未提交 */
export type IdentityAuthStatus = 0 | 1 | 2 | null;

export function resolveIdentityAuthBadgeSource(
  authStatus?: number | null,
): ImageSourcePropType {
  if (authStatus === 0) {
    return require('@/assets/images/user/shz.png');
  }
  if (authStatus === 1) {
    return require('@/assets/images/user/yrz.png');
  }
  if (authStatus === 2) {
    return require('@/assets/images/user/wtg.png');
  }
  return require('@/assets/images/user/wrz.png');
}

/** 审核中文案更长，单独加宽 */
export function resolveIdentityAuthBadgeWidth(authStatus?: number | null) {
  return authStatus === 2 ? 80 : 68;
}

/** 审核中 / 审核通过不可点击进入认证页 */
export function canPressIdentityAuthBadge(authStatus?: number | null) {
  return authStatus !== 0 && authStatus !== 1;
}

/** 未提交过认证，或审核未通过时可重新认证 */
export function shouldShowIdentityAuthEntry(authStatus?: number | null) {
  return authStatus == null || authStatus === 2;
}

/** 右侧入口图：未提交=实名认证，未通过=重新认证 */
export function resolveIdentityAuthEntrySource(
  authStatus?: number | null,
): ImageSourcePropType {
  if (authStatus === 2) {
    return require('@/assets/images/user/cxrz.png');
  }
  return require('@/assets/images/user/smrz.png');
}

/** 重新认证文案略长，入口图稍宽 */
export function resolveIdentityAuthEntryWidth(authStatus?: number | null) {
  return authStatus === 2 ? 94 : 91;
}
