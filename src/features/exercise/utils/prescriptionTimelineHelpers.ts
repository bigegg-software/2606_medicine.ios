import moment from 'moment';
import {
  getExPatientRuleAdjustList,
  type ExPatientRuleAdjustItem,
} from '@/api/exPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

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

/** 展示实际版本号，如 1.1、1.2 */
export function formatPrescriptionVersionLabel(
  version?: number | string | null,
  fallback = '',
) {
  const raw = version != null ? String(version).trim() : '';
  if (!raw || raw === '0') return fallback;
  return raw.startsWith('V') || raw.startsWith('v') ? raw : `V${raw}`;
}

function versionEquals(
  a?: number | string | null,
  b?: number | string | null,
) {
  const left = a != null ? String(a).trim() : '';
  const right = b != null ? String(b).trim() : '';
  if (!left || !right) return false;
  if (left === right) return true;
  const nLeft = Number(left);
  const nRight = Number(right);
  return Number.isFinite(nLeft) && Number.isFinite(nRight) && nLeft === nRight;
}

/** 新到旧：调整时间优先，其次版本号 */
export function sortAdjustListNewestFirst(list: ExPatientRuleAdjustItem[]) {
  return [...list].sort((a, b) => {
    const timeDiff = parseTimeMs(b.adjustTime) - parseTimeMs(a.adjustTime);
    if (timeDiff !== 0) return timeDiff;
    return (Number(b.version) || 0) - (Number(a.version) || 0);
  });
}

function resolveAdjustTimelineTitle(item: ExPatientRuleAdjustItem, isOldest: boolean) {
  const reason = item.adjustReason?.trim();
  if (reason) return reason;
  if (isOldest) return '初始处方生成';
  return '处方调整';
}

/** 调整记录列表 → 时间线（新在上） */
export function buildPrescriptionTimelineItemsFromAdjustList(
  list: ExPatientRuleAdjustItem[],
  activeVersion?: number | string | null,
): PrescriptionTimelineItem[] {
  const sorted = sortAdjustListNewestFirst(list);
  const total = sorted.length;

  return sorted.map((item, index) => {
    const isOldest = index === total - 1;
    return {
      key: String(item.adjustId ?? `${item.adjustTime ?? ''}-${index}`),
      versionLabel: formatPrescriptionVersionLabel(
        item.version,
        `V${total - index}`,
      ),
      dateText: formatTimelineDate(item.adjustTime),
      title: resolveAdjustTimelineTitle(item, isOldest),
      desc: '',
      isActive: activeVersion != null && String(activeVersion).trim() !== ''
        ? versionEquals(item.version, activeVersion)
        : index === 0,
    };
  });
}

/** 按处方 id 查询调整原因时间线 */
export async function loadPrescriptionTimelineItems(
  exPatientRuleId?: string | number | null,
  activeVersion?: number | string | null,
): Promise<PrescriptionTimelineItem[]> {
  const id = exPatientRuleId != null ? String(exPatientRuleId).trim() : '';
  if (!id) return [];

  const res = await getExPatientRuleAdjustList(id);
  if (!isResourceApiOk(res as unknown as { code?: number })) return [];
  const list = apiResourceData<ExPatientRuleAdjustItem[]>(
    res as unknown as { code?: number; data?: ExPatientRuleAdjustItem[] },
  );
  return buildPrescriptionTimelineItemsFromAdjustList(
    Array.isArray(list) ? list : [],
    activeVersion,
  );
}
