import type { ImageSourcePropType } from 'react-native';
import moment from 'moment';
import type { CommunityScreenReport } from '@/api/communityScreenReport';

const FALL_ICON = require('@/assets/images/profile/icon_screening_fall.png');
const PILATES_ICON = require('@/assets/images/profile/icon_screening_pilates.png');

const REPORT_TYPE_META: Record<
  string,
  { title: string; icon: ImageSourcePropType }
> = {
  fall_prevention: {
    title: '跌倒风险评估初筛报告',
    icon: FALL_ICON,
  },
  pilates: {
    title: '普拉提功能画像初筛报告',
    icon: PILATES_ICON,
  },
};

export function resolveCommunityScreenReportTitle(report?: CommunityScreenReport | null) {
  const label = report?.reportTypeLabel?.trim();
  if (label) return label;
  const type = report?.reportType?.trim() ?? '';
  return REPORT_TYPE_META[type]?.title || '社区初筛报告';
}

export function resolveCommunityScreenReportIcon(
  report?: CommunityScreenReport | null,
): ImageSourcePropType {
  const type = report?.reportType?.trim() ?? '';
  return REPORT_TYPE_META[type]?.icon || FALL_ICON;
}

export function formatCommunityScreenReportDate(report?: CommunityScreenReport | null) {
  const raw = report?.finishTime?.trim() || report?.createTime?.trim() || '';
  if (!raw) return '—';
  const m = moment(
    raw,
    ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD', 'YYYY/MM/DD HH:mm:ss', 'YYYY/MM/DD'],
    true,
  );
  if (m.isValid()) return m.format('YYYY-MM-DD');
  const fallback = moment(raw);
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : raw;
}

/**
 * 预览区：每种 reportType 取第一条（接口已按时间排序时即为最新），
 * 顺序与接口 rows 一致，不额外按类型重排。
 */
export function pickLatestCommunityScreenReportsByType(
  rows: CommunityScreenReport[] | null | undefined,
): CommunityScreenReport[] {
  const list = Array.isArray(rows) ? rows : [];
  const seen = new Set<string>();
  const result: CommunityScreenReport[] = [];

  for (const row of list) {
    const type = row.reportType?.trim();
    if (!type || seen.has(type)) continue;
    seen.add(type);
    result.push(row);
  }
  return result;
}
