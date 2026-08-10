import moment from 'moment';
import {
  getExPatientRuleList,
  type ExPatientRuleInfo,
} from '@/api/exPatientRule';
import { getResourceRows } from '@/src/utils/apiHelpers';

export type PrescriptionTimelineItem = {
  key: string;
  versionLabel: string;
  dateText: string;
  title: string;
  desc: string;
  isActive: boolean;
};

function parseTimeMs(value?: string) {
  const parsed = moment(value);
  return parsed.isValid() ? parsed.valueOf() : 0;
}

function formatTimelineDate(value?: string) {
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('YYYY/MM/DD') : '--';
}

/** 新到旧排序：创建时间优先，其次 id */
export function sortPrescriptionHistoryNewestFirst(list: ExPatientRuleInfo[]) {
  return [...list].sort((a, b) => {
    const timeDiff = parseTimeMs(b.createTime || b.startDate) - parseTimeMs(a.createTime || a.startDate);
    if (timeDiff !== 0) return timeDiff;
    return String(b.exPatientRuleId ?? '').localeCompare(String(a.exPatientRuleId ?? ''));
  });
}

function resolveTimelineTitle(item: ExPatientRuleInfo, isOldest: boolean) {
  if (isOldest) return '初始处方生成';
  return (
    item.adjustReason?.trim() ||
    item.aiAnalysis?.title?.trim() ||
    item.prescriptionName?.trim() ||
    '处方调整'
  );
}

function resolveTimelineDesc(item: ExPatientRuleInfo) {
  return (
    item.aiAnalysis?.summary?.trim() ||
    item.completeSummary?.trim() ||
    item.remark?.trim() ||
    item.extraRemark?.trim() ||
    ''
  );
}

/** 将历史处方列表映射为时间线展示项（新在上，版本号从大到小） */
export function buildPrescriptionTimelineItems(
  list: ExPatientRuleInfo[],
): PrescriptionTimelineItem[] {
  const sorted = sortPrescriptionHistoryNewestFirst(list);
  const total = sorted.length;

  return sorted.map((item, index) => {
    const version = total - index;
    const isOldest = index === total - 1;
    return {
      key: String(item.exPatientRuleId ?? `${item.createTime ?? ''}-${index}`),
      versionLabel: `V${version}`,
      dateText: formatTimelineDate(item.createTime || item.startDate),
      title: resolveTimelineTitle(item, isOldest),
      desc: resolveTimelineDesc(item),
      isActive: item.status === 0,
    };
  });
}

/** 查询全部历史运动处方（不限 status） */
export async function loadPrescriptionTimelineItems(): Promise<PrescriptionTimelineItem[]> {
  const res = await getExPatientRuleList({
    status: '',
    pageSize: 100,
    pageNum: 1,
  });
  const rows = getResourceRows<ExPatientRuleInfo>(res);
  return buildPrescriptionTimelineItems(rows);
}
