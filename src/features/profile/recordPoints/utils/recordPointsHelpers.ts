import type { UserTokenDetail } from '@/api/userTokenDetail';

export type PointsTabKey = 'all' | 'income' | 'expense';

export const POINTS_TABS: { key: PointsTabKey; label: string; incomeType?: 1 | -1 }[] = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '获得', incomeType: 1 },
  { key: 'expense', label: '消耗', incomeType: -1 },
];

export function formatPointsDate(raw?: string | null): string {
  if (!raw?.trim()) return '—';
  return raw.trim().replace(/-/g, '/');
}

export function getPointsTitle(item: UserTokenDetail): string {
  return item.actionDesc?.trim() || item.action?.trim() || '积分变动';
}

export function getPointsTime(item: UserTokenDetail): string {
  return formatPointsDate(item.detailDate || item.dataDate || item.createTime);
}

/** 解析积分变动值；消耗场景若后端给正数，按负值展示 */
export function resolvePointsDelta(raw: number | string | null | undefined, tab: PointsTabKey): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (tab === 'expense' && n > 0) return -n;
  if (tab === 'income' && n < 0) return Math.abs(n);
  return n;
}

/** 右侧展示：+1,000 / -500 */
export function formatPointsAmount(delta: number): string {
  const abs = Math.abs(delta);
  const body = Number.isInteger(abs)
    ? abs.toLocaleString('en-US')
    : abs.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (delta > 0) return `+${body}`;
  if (delta < 0) return `-${body}`;
  return body;
}

export function isPointsIncome(delta: number): boolean {
  return delta >= 0;
}
