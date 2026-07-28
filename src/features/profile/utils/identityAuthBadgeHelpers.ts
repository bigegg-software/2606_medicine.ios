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

/** 仅未提交过认证时展示右侧实名认证入口 */
export function shouldShowIdentityAuthEntry(authStatus?: number | null) {
  return authStatus == null;
}
