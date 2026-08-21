import moment from 'moment';
import {
  getDietPatientRuleList,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import {
  getMealExecutionStatistics,
  type MealExecutionStatistics,
} from '@/api/meal';
import {
  apiResourceData,
  getResourceRows,
  isResourceApiOk,
} from '@/src/utils/apiHelpers';
import { formatFoodRecordingRate } from './foodRecordingHelpers';

function formatArchiveRateValue(rate?: number | null) {
  const text = formatFoodRecordingRate(rate);
  return text === '--' ? '--' : text.replace(/%$/, '');
}

export type DietHistoryPlanFilter = 'all' | 'paused' | 'ended';

export const DIET_HISTORY_FILTER_OPTIONS: { label: string; value: DietHistoryPlanFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '已暂停', value: 'paused' },
  { label: '已完成', value: 'ended' },
];

export type DietHistoryArchiveItem = {
  id: string;
  title: string;
  status?: number;
  statusLabel: string;
  dateText: string;
  executionRateText: string;
  calorieRateText: string;
  proteinRateText: string;
  summaryText: string;
  isInProgress: boolean;
  isDone: boolean;
};

const PREVIEW_SIZE = 5;

type HistoryListResult = {
  total?: number;
};

function getHistoryStatusLabel(status?: number) {
  if (status === 0) return '进行中';
  if (status === 1) return '已暂停';
  if (status === 2) return '已结束';
  return '--';
}

function formatHistoryDateRange(startDate?: string, endDate?: string) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start && !end) return '--';
  const formatDate = (value: string) => {
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY/MM/DD') : value;
  };
  return `${start ? formatDate(start) : '--'}-${end ? formatDate(end) : '--'}`;
}

function getHistorySortTime(info: DietPatientRuleInfo) {
  return info.stopTime || info.createTime || info.endDate || info.startDate || '';
}

export function sortDietHistoryPlans(items: DietPatientRuleInfo[]) {
  return [...items].sort(
    (a, b) => moment(getHistorySortTime(b)).valueOf() - moment(getHistorySortTime(a)).valueOf(),
  );
}

async function loadExecutionStatisticsForArchive(
  rule: DietPatientRuleInfo,
): Promise<MealExecutionStatistics | null> {
  const ruleId = rule.dietPatientRuleId != null ? String(rule.dietPatientRuleId).trim() : '';
  if (!ruleId) return null;
  const startDate = rule.startDate?.trim() || undefined;
  const endDate = rule.endDate?.trim() || undefined;
  try {
    const res = await getMealExecutionStatistics({
      dietPatientRuleId: ruleId,
      startDate,
      endDate,
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return (
      apiResourceData<MealExecutionStatistics>(
        res as unknown as { code?: number; data?: MealExecutionStatistics },
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function toDietHistoryArchiveItem(
  info: DietPatientRuleInfo,
  statistics?: MealExecutionStatistics | null,
): DietHistoryArchiveItem {
  const rawId = info.dietPatientRuleId != null ? String(info.dietPatientRuleId).trim() : '';
  const id = rawId
    || `${info.startDate ?? ''}-${info.endDate ?? ''}-${info.prescriptionName ?? ''}`;

  return {
    id,
    title: info.prescriptionName?.trim() || '营养处方',
    status: info.status,
    statusLabel: info.status === 2 ? '已完成' : getHistoryStatusLabel(info.status),
    dateText: formatHistoryDateRange(info.startDate, info.endDate),
    executionRateText: formatArchiveRateValue(statistics?.executionRate),
    calorieRateText: formatArchiveRateValue(statistics?.calorieComplianceRate),
    proteinRateText: formatArchiveRateValue(statistics?.proteinComplianceRate),
    summaryText: info.completeSummary?.trim() || info.adjustReason?.trim() || '',
    isInProgress: info.status === 0,
    isDone: info.status === 2,
  };
}

async function mapPlansToArchiveItems(plans: DietPatientRuleInfo[]) {
  return Promise.all(
    plans.map(async plan => {
      const statistics = await loadExecutionStatisticsForArchive(plan);
      return toDietHistoryArchiveItem(plan, statistics);
    }),
  );
}

export async function fetchDietHistoryPlanPage(
  filter: DietHistoryPlanFilter,
  pageNum: number,
  pageSize: number,
): Promise<{ rows: DietPatientRuleInfo[]; hasMore: boolean }> {
  if (filter === 'paused') {
    const res = await getDietPatientRuleList({ status: 1, pageSize, pageNum });
    const rows = getResourceRows<DietPatientRuleInfo>(res);
    const total = (res as unknown as HistoryListResult).total ?? 0;
    return { rows, hasMore: pageNum * pageSize < total };
  }

  if (filter === 'ended') {
    const res = await getDietPatientRuleList({ status: 2, pageSize, pageNum });
    const rows = getResourceRows<DietPatientRuleInfo>(res);
    const total = (res as unknown as HistoryListResult).total ?? 0;
    return { rows, hasMore: pageNum * pageSize < total };
  }

  // 全部：不含进行中
  const [pausedRes, endedRes] = await Promise.all([
    getDietPatientRuleList({ status: 1, pageSize, pageNum }),
    getDietPatientRuleList({ status: 2, pageSize, pageNum }),
  ]);
  const rows = sortDietHistoryPlans([
    ...getResourceRows<DietPatientRuleInfo>(pausedRes),
    ...getResourceRows<DietPatientRuleInfo>(endedRes),
  ]);
  const pausedTotal = (pausedRes as unknown as HistoryListResult).total ?? 0;
  const endedTotal = (endedRes as unknown as HistoryListResult).total ?? 0;
  return {
    rows,
    hasMore: pageNum * pageSize < pausedTotal || pageNum * pageSize < endedTotal,
  };
}

export async function fetchDietHistoryArchivePage(
  filter: DietHistoryPlanFilter,
  pageNum: number,
  pageSize: number,
): Promise<{ rows: DietHistoryArchiveItem[]; hasMore: boolean }> {
  const { rows, hasMore } = await fetchDietHistoryPlanPage(filter, pageNum, pageSize);
  return { rows: await mapPlansToArchiveItems(rows), hasMore };
}

/** 饮食记录页预览：已暂停 + 已结束（不含进行中） */
export async function loadDietHistoryArchivePreview(pageSize = PREVIEW_SIZE) {
  const [pausedRes, endedRes] = await Promise.all([
    getDietPatientRuleList({ status: 1, pageSize, pageNum: 1 }),
    getDietPatientRuleList({ status: 2, pageSize, pageNum: 1 }),
  ]);
  const plans = sortDietHistoryPlans([
    ...getResourceRows<DietPatientRuleInfo>(pausedRes),
    ...getResourceRows<DietPatientRuleInfo>(endedRes),
  ]).slice(0, pageSize);
  return mapPlansToArchiveItems(plans);
}

export function getHistoryDietNutritionParams(dietPatientRuleId: string | number) {
  return {
    dietPatientRuleId: String(dietPatientRuleId),
  };
}
