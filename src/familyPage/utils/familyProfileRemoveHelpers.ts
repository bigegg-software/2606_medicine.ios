import { removeFamilyBind } from '@/api/familyBind';
import { isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';

/** 删除家人确认文案 */
export function buildFamilyBindRemoveConfirmMessage(displayName: string) {
  const name = displayName.trim() || '该';
  return `删除后将不再支持查看该用户数据，是否删除${name}用户？`;
}

/** 家属端解绑家人；id 统一 string */
export async function removeFamilyBindById(
  bindId: string,
): Promise<{ ok: boolean; msg?: string }> {
  const id = String(bindId ?? '').trim();
  if (!id) return { ok: false, msg: '家人信息无效' };
  try {
    const res = await removeFamilyBind(id);
    if (!isResourceApiOk(res as ApiResult)) {
      const r = res as ApiResult;
      return { ok: false, msg: r.msg ?? r.message ?? '删除失败，请稍后重试' };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}
