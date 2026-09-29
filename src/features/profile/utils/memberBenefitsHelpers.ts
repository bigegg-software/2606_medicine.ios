import type { SystemUser } from '@/api/user';
import { resolveProfilePaidStatus } from './profilePaidHelpers';

export type MemberBenefitRow = {
  key: string;
  title: string;
  totalText: string;
  weeklyText: string;
  /** 进度条颜色 */
  progressColor: string;
  /** 0～1，暂无已用次数时按剩余=总量展示 */
  progressRatio: number;
};

const BENEFIT_PROGRESS_COLORS = {
  private: '#6D925E',
  group: '#EE9C44',
  online: '#0951AE',
} as const;

/** yyyy-MM-dd → yyyy/MM/dd */
export function formatBenefitDateDisplay(value?: string | null): string {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (!match) return '';
  const year = match[1];
  const month = String(Number(match[2])).padStart(2, '0');
  const day = String(Number(match[3])).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/** 有效期：2026/01/01 至 2026/12/31（仅用权益起止日） */
export function formatBenefitValidityLabel(
  start?: string | null,
  end?: string | null,
): string {
  const startText = formatBenefitDateDisplay(start);
  const endText = formatBenefitDateDisplay(end);
  if (startText && endText) return `有效期：${startText} 至 ${endText}`;
  if (startText) return `有效期：${startText} 起`;
  if (endText) return `有效期：至 ${endText}`;
  return '';
}

/** 次数展示：-1 不限；缺省 -- */
export function formatBenefitCount(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '--';
  const n = Number(value);
  if (n === -1) return '不限';
  return String(Math.max(0, Math.floor(n)));
}

/** 进度比例：不限为满；有总量时暂按可用满额；否则 0 */
export function resolveBenefitProgressRatio(total?: number | null): number {
  if (total == null || Number.isNaN(Number(total))) return 0;
  const n = Number(total);
  if (n === -1) return 1;
  if (n <= 0) return 0;
  return 1;
}

function parseBenefitDate(value?: string | null): Date | null {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** 是否仍有可用课次（-1 不限或 >0） */
export function hasRemainingBenefitCount(user?: SystemUser | null): boolean {
  const totals = [
    user?.privateCoachTotalCount,
    user?.groupClassTotalCount,
    user?.onlineClassTotalCount,
  ];
  return totals.some(value => {
    if (value == null || Number.isNaN(Number(value))) return false;
    const n = Number(value);
    return n === -1 || n > 0;
  });
}

/** 权益截止日期是否已过（结束日当天仍有效） */
export function isBenefitEndDateExpired(benefitEndDate?: string | null): boolean {
  const end = parseBenefitDate(benefitEndDate);
  if (!end) return false;
  return end.getTime() < startOfToday().getTime();
}

/** 权益是否已生效（无开始日视为已生效） */
export function isBenefitStartDateReached(benefitStartDate?: string | null): boolean {
  const start = parseBenefitDate(benefitStartDate);
  if (!start) return true;
  return start.getTime() <= startOfToday().getTime();
}

/** 是否处于有效权益期内且仍有次数 */
export function hasActiveMemberBenefit(user?: SystemUser | null): boolean {
  if (!hasRemainingBenefitCount(user)) return false;
  if (isBenefitEndDateExpired(user?.benefitEndDate)) return false;
  if (!isBenefitStartDateReached(user?.benefitStartDate)) return false;
  return true;
}

/** 有权益：「权益持续生效中」；用完/无可用：「当前」 */
export function resolveBenefitHeroLabel(user?: SystemUser | null): string {
  return hasActiveMemberBenefit(user) ? '权益持续生效中' : '暂无有效会员权益';
}

export function buildMemberBenefitRows(user?: SystemUser | null): MemberBenefitRow[] {
  return [
    {
      key: 'private',
      title: '私教课',
      totalText: formatBenefitCount(user?.privateCoachTotalCount),
      weeklyText: formatBenefitCount(user?.privateCoachWeeklyLimit),
      progressColor: BENEFIT_PROGRESS_COLORS.private,
      progressRatio: resolveBenefitProgressRatio(user?.privateCoachTotalCount),
    },
    {
      key: 'group',
      title: '集体课',
      totalText: formatBenefitCount(user?.groupClassTotalCount),
      weeklyText: formatBenefitCount(user?.groupClassWeeklyLimit),
      progressColor: BENEFIT_PROGRESS_COLORS.group,
      progressRatio: resolveBenefitProgressRatio(user?.groupClassTotalCount),
    },
    {
      key: 'online',
      title: '线上课',
      totalText: formatBenefitCount(user?.onlineClassTotalCount),
      weeklyText: formatBenefitCount(user?.onlineClassWeeklyLimit),
      progressColor: BENEFIT_PROGRESS_COLORS.online,
      progressRatio: resolveBenefitProgressRatio(user?.onlineClassTotalCount),
    },
  ];
}

export function resolveMemberBenefitsSummary(user?: SystemUser | null) {
  const paidStatus = resolveProfilePaidStatus(user);
  const benefitValidityText = formatBenefitValidityLabel(
    user?.benefitStartDate,
    user?.benefitEndDate,
  );
  const remark = user?.benefitRemark?.trim() || '';
  const stationName = user?.stationName?.trim() || '';
  const coachName = user?.coachUserRealName?.trim() || '';

  return {
    ...paidStatus,
    heroLabel: resolveBenefitHeroLabel(user),
    benefitValidityText,
    remark,
    stationName,
    coachName,
    rows: buildMemberBenefitRows(user),
  };
}
