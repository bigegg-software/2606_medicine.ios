import { initMemberType, updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

export type IdentityPerspective = 'old' | 'child';

export type AuthHomeRoute = 'MainTabs' | 'FamilyTabs' | 'IdentitySelectPage';

/**
 * 身份选择页开关。
 * - false：临时跳过 IdentitySelect，未设置身份时默认 old → MainTabs
 * - true：恢复原逻辑（未设置身份 → IdentitySelectPage）
 */
export const ENABLE_IDENTITY_SELECT = false;

/** 跳过身份选择时的默认用户类型 */
export const DEFAULT_MEMBER_TYPE_WHEN_SKIP_SELECT: IdentityPerspective = 'old';

export function normalizeIdentityPerspective(value?: string | null): IdentityPerspective | '' {
  const normalized = String(value ?? '').trim();
  if (normalized === 'old' || normalized === 'child') return normalized;
  return '';
}

/** 根据身份视角决定登录后首页 */
export function getAuthHomeRoute(identityPerspective?: string | null): AuthHomeRoute {
  const perspective = normalizeIdentityPerspective(identityPerspective);
  if (perspective === 'old') return 'MainTabs';
  if (perspective === 'child') return 'FamilyTabs';
  return ENABLE_IDENTITY_SELECT ? 'IdentitySelectPage' : 'MainTabs';
}

/** 当前身份展示文案 */
export function getIdentityLabel(identityPerspective?: string | null): string {
  const perspective = normalizeIdentityPerspective(identityPerspective);
  if (perspective === 'old') return '用户';
  if (perspective === 'child') return '家属';
  return '未设置';
}

/** 首次设置用户类型（老人/家属），身份视角默认与 memberType 一致 */
export async function submitInitMemberType(memberType: IdentityPerspective): Promise<{
  ok: boolean;
  msg?: string;
  homeRoute: AuthHomeRoute;
}> {
  const homeRoute = getAuthHomeRoute(memberType);
  try {
    const res = await initMemberType({ memberType });
    if (!isResourceApiOk(res as { code?: number; msg?: string })) {
      const r = res as { msg?: string; message?: string };
      return {
        ok: false,
        msg: r.msg ?? r.message ?? '提交失败，请稍后重试',
        homeRoute,
      };
    }
    return { ok: true, homeRoute };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试', homeRoute };
  }
}

/**
 * 登录/注册成功后解析首页。
 * 关闭身份选择时：未设置身份会自动 init 为默认用户类型。
 * 开启身份选择时：未设置身份直接进入 IdentitySelectPage。
 */
export async function resolvePostAuthHomeRoute(identityPerspective?: string | null): Promise<{
  ok: boolean;
  msg?: string;
  homeRoute: AuthHomeRoute;
  /** 是否已在本函数内完成 memberType 初始化 */
  didInitMemberType: boolean;
}> {
  if (ENABLE_IDENTITY_SELECT) {
    return {
      ok: true,
      homeRoute: getAuthHomeRoute(identityPerspective),
      didInitMemberType: false,
    };
  }

  if (normalizeIdentityPerspective(identityPerspective)) {
    return {
      ok: true,
      homeRoute: getAuthHomeRoute(identityPerspective),
      didInitMemberType: false,
    };
  }

  const initResult = await submitInitMemberType(DEFAULT_MEMBER_TYPE_WHEN_SKIP_SELECT);
  return {
    ...initResult,
    didInitMemberType: initResult.ok,
  };
}

/** 切换身份视角并返回目标首页 */
export async function switchIdentityPerspective(perspective: IdentityPerspective): Promise<{
  ok: boolean;
  msg?: string;
  homeRoute: AuthHomeRoute;
}> {
  const homeRoute = getAuthHomeRoute(perspective);
  try {
    const res = await updateExtrInfo({ identityPerspective: perspective });
    if (!isResourceApiOk(res as { code?: number; msg?: string })) {
      const r = res as { msg?: string; message?: string };
      return {
        ok: false,
        msg: r.msg ?? r.message ?? '切换失败，请稍后重试',
        homeRoute,
      };
    }
    return { ok: true, homeRoute };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试', homeRoute };
  }
}
