import moment from 'moment';
import {
  getExPatientRuleInfo,
  getExPatientRuleList,
  type ExPatientRuleInfo,
  type ExPatientRuleRatio,
} from '@/api/exPatientRule';
import { getExerciseTypeStatis } from '@/api/schedule';
import {
  buildWeekStatsFromStatis,
  loadScheduleDictMaps,
  loadScheduleWeekStatsForRange,
  normalizeProgress,
  type ScheduleDictMaps,
  type ScheduleWeekStats,
} from './scheduleHelpers';
import {
  formatExerciseChildTypes,
  formatExerciseDuration,
  formatExerciseFrequency,
  getExerciseTypeLabel,
  normalizeExPatientRuleInfo,
  normalizeExerciseProgress,
} from '@/src/features/exercise/utils/exerciseHelpers';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

const EXERCISE_TYPE_INTROS: Record<string, string> = {
  cardio: '提升心肺耐力、改善循环代谢',
  strength: '强化肌肉力量、保护骨骼关节',
  flexibility: '放松肌群、扩大关节活动范围',
  balance: '锻炼协调性、降低跌倒风险',
};

export type HistoryPlanTaskItem = {
  key: string;
  title: string;
  durationText: string;
  intro: string;
  projects: string;
  ratioText: string;
  completion: number;
};

export type HistoryPlanDetailSummary = {
  title: string;
  statusLabel: string;
  doctorText: string;
  cycleText: string;
  frequencyText: string;
  durationText: string;
  progress: number;
  remark: string;
  stopTimeText: string;
  stopReason: string;
  status?: number;
  startDate?: string;
  endDate?: string;
};

function formatHistoryDetailDateRange(startDate?: string, endDate?: string) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start && !end) return '--';

  const formatDate = (value: string) => {
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY/MM/DD') : value;
  };

  const startText = start ? formatDate(start) : '--';
  const endText = end ? formatDate(end) : '--';
  return `${startText} - ${endText}`;
}

function formatStopTime(value?: string) {
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('YYYY/MM/DD') : value?.trim() || '--';
}

export function getHistoryPlanStatusLabel(status?: number) {
  if (status === 0) return '进行中';
  if (status === 1) return '已暂停';
  if (status === 2) return '已结束';
  return '--';
}

export function buildHistoryPlanDoctorText(info?: ExPatientRuleInfo | null) {
  const name = info?.recoveryUserName?.trim();
  const org = info?.recoveryOrgName?.trim();
  if (name && org) return `${name}（${org}）`;
  return name || org || '--';
}

export function buildHistoryPlanDetailSummary(info?: ExPatientRuleInfo | null): HistoryPlanDetailSummary {
  if (!info) {
    return {
      title: '--',
      statusLabel: '--',
      doctorText: '--',
      cycleText: '--',
      frequencyText: '--',
      durationText: '--',
      progress: 0,
      remark: '',
      stopTimeText: '--',
      stopReason: '',
    };
  }

  return {
    title: info.prescriptionName?.trim() || '--',
    statusLabel: getHistoryPlanStatusLabel(info.status),
    doctorText: buildHistoryPlanDoctorText(info),
    cycleText: formatHistoryDetailDateRange(info.startDate, info.endDate),
    frequencyText: formatExerciseFrequency(info.needExerciseFrequency),
    durationText: formatExerciseDuration(info.needExerciseDuration),
    progress: normalizeExerciseProgress(info.progress),
    remark: info.remark?.trim() || '',
    stopTimeText: formatStopTime(info.stopTime),
    stopReason: info.stopReason?.trim() || '',
    status: info.status,
    startDate: info.startDate,
    endDate: info.endDate,
  };
}

export function buildHistoryPlanTaskItems(
  ruleRatioList: ExPatientRuleRatio[] | undefined,
  dictMaps?: ScheduleDictMaps,
  completionMap?: Record<string, number>,
): HistoryPlanTaskItem[] {
  return (ruleRatioList ?? []).map((rule, index) => {
    const typeKey = rule.exerciseType?.trim() ?? '';
    const title = dictMaps?.exerciseType[typeKey] ?? getExerciseTypeLabel(typeKey);
    const duration = rule.duration != null ? `${rule.duration}分钟` : '--';
    const projects = formatExerciseChildTypes(rule.exerciseChildType, typeKey, dictMaps);
    const ratio = rule.ratio != null ? normalizeProgress(rule.ratio) : null;
    const completion = typeKey && completionMap?.[typeKey] != null
      ? normalizeProgress(completionMap[typeKey])
      : normalizeExerciseProgress(rule.ratio);

    return {
      key: `${typeKey}-${index}`,
      title,
      durationText: duration,
      intro: EXERCISE_TYPE_INTROS[typeKey] ?? '',
      projects: projects === '--' ? '' : projects,
      ratioText: ratio != null ? `占比${ratio}%` : '--',
      completion,
    };
  });
}

async function loadExerciseTypeCompletionMap(exPatientRuleId: string) {
  try {
    const res = await getExerciseTypeStatis({ exPatientRuleId });
    if (!isResourceApiOk(res)) return {};

    const list = apiResourceData<{ exerciseType?: string; complateRatio?: number }[]>(res as any) ?? [];
    const map: Record<string, number> = {};
    for (const item of list) {
      const typeKey = item.exerciseType?.trim();
      if (!typeKey) continue;
      map[typeKey] = normalizeProgress(item.complateRatio);
    }
    return map;
  } catch {
    return {};
  }
}

export async function fetchHistoryPlanDetail(exPatientRuleId: string): Promise<ExPatientRuleInfo | null> {
  try {
    const res = await getExPatientRuleInfo(exPatientRuleId);
    if (isResourceApiOk(res)) {
      const data = apiResourceData<ExPatientRuleInfo>(res as any);
      if (data) return normalizeExPatientRuleInfo(data);
    }
  } catch {
    // fallback to list search
  }

  try {
    const [pausedRes, endedRes] = await Promise.all([
      getExPatientRuleList({ status: 1, pageSize: 100, pageNum: 1 }),
      getExPatientRuleList({ status: 2, pageSize: 100, pageNum: 1 }),
    ]);
    const rows = [
      ...getResourceRows<ExPatientRuleInfo>(pausedRes),
      ...getResourceRows<ExPatientRuleInfo>(endedRes),
    ];
    const found = rows.find(item => String(item.exPatientRuleId) === exPatientRuleId);
    return found ? normalizeExPatientRuleInfo(found) : null;
  } catch {
    return null;
  }
}

export async function loadHistoryPlanPageData(exPatientRuleId: string) {
  const detail = await fetchHistoryPlanDetail(exPatientRuleId);
  const [dictMaps, completionMap, stats] = await Promise.all([
    loadScheduleDictMaps(),
    loadExerciseTypeCompletionMap(exPatientRuleId),
    detail?.startDate && detail?.endDate
      ? loadScheduleWeekStatsForRange(exPatientRuleId, detail.startDate, detail.endDate)
      : Promise.resolve(buildWeekStatsFromStatis(null)),
  ]);

  const summary = buildHistoryPlanDetailSummary(detail);
  const tasks = buildHistoryPlanTaskItems(detail?.ruleRatioList, dictMaps, completionMap);

  return {
    detail,
    summary,
    tasks,
    stats,
  };
}
