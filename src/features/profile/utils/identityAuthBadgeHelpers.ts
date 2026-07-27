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

/** 仅未提交过认证时展示右侧实名认证入口 */
export function shouldShowIdentityAuthEntry(authStatus?: number | null) {
  return authStatus == null;
}
