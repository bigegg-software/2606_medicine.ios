import { checkInMyBooking } from '@/api/courseSession';
import { isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';

/** 扫码结果归一化 */
export function normalizeScanPayload(data?: string | null): string {
  return String(data ?? '').trim();
}

/** 是否为可处理的扫码内容 */
export function isValidScanPayload(data?: string | null): boolean {
  return normalizeScanPayload(data).length > 0;
}

/**
 * 从扫码内容解析签到码（5 位数字）
 * 支持纯数字，或 URL/文本中含 5 位连续数字
 */
export function resolveCheckInCodeFromScan(data?: string | null): string {
  const raw = normalizeScanPayload(data);
  if (!raw) return '';
  if (/^\d{5}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const fromQuery =
      url.searchParams.get('checkInCode') ||
      url.searchParams.get('code') ||
      url.searchParams.get('c') ||
      '';
    const q = String(fromQuery).trim();
    if (/^\d{5}$/.test(q)) return q;
  } catch {
    // 非 URL
  }
  const matched = raw.match(/(?:^|[^\d])(\d{5})(?:[^\d]|$)/);
  return matched?.[1] || '';
}

export type ScanCheckInResult = {
  ok: boolean;
  msg?: string;
};

function actionFailMsg(res: ApiResult | null | undefined, fallback: string) {
  return res?.msg?.trim() || res?.message?.trim() || fallback;
}

/** 扫码签到 */
export async function checkInByScanCode(scanData?: string | null): Promise<ScanCheckInResult> {
  const checkInCode = resolveCheckInCodeFromScan(scanData);
  if (!checkInCode) {
    return { ok: false, msg: '未识别到有效签到码' };
  }
  try {
    const res = await checkInMyBooking({ checkInCode });
    if (!isResourceApiOk(res)) {
      return { ok: false, msg: actionFailMsg(res, '签到失败，请稍后重试') };
    }
    return { ok: true, msg: '签到成功' };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}
