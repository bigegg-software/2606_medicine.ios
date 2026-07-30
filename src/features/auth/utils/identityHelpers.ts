import { initMemberType, updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

export type IdentityPerspective = 'old' | 'child';

export type AuthHomeRoute = 'MainTabs' | 'FamilyTabs' | 'IdentitySelectPage';

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
  return 'IdentitySelectPage';
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
