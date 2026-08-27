import type { SystemUser } from '@/api/user';

/** 是否已付费签约 */
export function isUserPaid(user?: Pick<SystemUser, 'isPaid'> | null) {
  return Number(user?.isPaid) === 1;
}

/** 解析 yyyy-MM-dd，无效返回 null */
function parsePaidDateParts(value?: string | null) {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/** paidEndDate 是否已过期（按自然日，结束日当天仍视为有效） */
export function isPaidEndDateExpired(paidEndDate?: string | null) {
  const parts = parsePaidDateParts(paidEndDate);
  if (!parts) return false;
  const end = new Date(parts.year, parts.month - 1, parts.day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return end.getTime() < today.getTime();
}

/** yyyy-MM-dd → yyyy/M/d */
export function formatPaidDateDisplay(value?: string | null) {
  const parts = parsePaidDateParts(value);
  if (!parts) return '';
  return `${parts.year}/${parts.month}/${parts.day}`;
}

/** 签约有效期文案：2026/8/24-2027/8/24；无有效日期返回空 */
export function formatPaidDateRange(
  start?: string | null,
  end?: string | null,
) {
  const startText = formatPaidDateDisplay(start);
  const endText = formatPaidDateDisplay(end);
  if (startText && endText) return `${startText}-${endText}`;
  if (startText) return startText;
  if (endText) return endText;
  return '';
}

export function resolveProfilePaidStatus(user?: SystemUser | null) {
  const paid = isUserPaid(user);
  const expired = isPaidEndDateExpired(user?.paidEndDate);
  const dateRangeText =
    paid || expired
      ? formatPaidDateRange(user?.paidStartDate, user?.paidEndDate)
      : '';

  let statusText = '未签约';
  if (expired) {
    statusText = '签约到期';
  } else if (paid) {
    statusText = '已签约';
  }

  return {
    paid: paid && !expired,
    expired,
    statusText,
    dateRangeText,
  };
}
