import type { SystemUser } from '@/api/user';

/** 是否已付费签约 */
export function isUserPaid(user?: Pick<SystemUser, 'isPaid'> | null) {
  return Number(user?.isPaid) === 1;
}

/** yyyy-MM-dd → yyyy/M/d */
export function formatPaidDateDisplay(value?: string | null) {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (!match) return '';
  const year = match[1];
  const month = String(Number(match[2]));
  const day = String(Number(match[3]));
  if (!year || !month || month === 'NaN' || !day || day === 'NaN') return '';
  return `${year}/${month}/${day}`;
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
  return {
    paid,
    statusText: paid ? '已签约' : '未签约',
    dateRangeText: paid
      ? formatPaidDateRange(user?.paidStartDate, user?.paidEndDate)
      : '',
  };
}
