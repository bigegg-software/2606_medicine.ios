import type { PointsRuleGroup, PointsRuleItem } from '@/api/pointsConfig';

export type PointsRuleTableRow = {
  key: string;
  name: string;
  points: string;
  limit: string;
};

export type PointsRuleTableSection = {
  key: string;
  title: string;
  rows: PointsRuleTableRow[];
};

/** 上限：1 每日次数 / 2 每日积分；上限为 0 时展示 -- */
export function formatPointsLimit(rule: PointsRuleItem): string {
  const raw = rule.limitValue;
  if (raw == null || String(raw).trim() === '') return '--';

  const value = Number(raw);
  // 上限 0 / 非法数值：统一展示 --
  if (!Number.isFinite(value) || value === 0) return '--';

  if (rule.limitType === 1) return `每日${value}次`;
  if (rule.limitType === 2) return `每日${value}积分`;
  return String(value);
}

export function formatRewardPoints(raw?: number | string | null): string {
  if (raw == null || raw === '') return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return String(raw);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, '');
}

/** 仅启用规则，按 sortOrder 排序后转表格分区 */
export function buildPointsRuleSections(groups: PointsRuleGroup[] | null | undefined): PointsRuleTableSection[] {
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group, groupIndex) => {
      const rules = (group.rules ?? [])
        .filter(rule => rule.enabled === 1 || rule.enabled == null)
        .slice()
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

      const rows: PointsRuleTableRow[] = rules.map((rule, ruleIndex) => ({
        key: String(rule.ruleId ?? `${group.moduleCategory}-${rule.moduleSubKey}-${ruleIndex}`),
        name: rule.moduleSubName?.trim() || rule.moduleSubKey?.trim() || '—',
        points: `+${formatRewardPoints(rule.rewardPoints)}`,
        limit: formatPointsLimit(rule),
      }));

      return {
        key: String(group.moduleCategory ?? `group-${groupIndex}`),
        title: group.moduleCategoryName?.trim() || group.moduleCategory?.trim() || '其他',
        rows,
      };
    })
    .filter(section => section.rows.length > 0);
}
