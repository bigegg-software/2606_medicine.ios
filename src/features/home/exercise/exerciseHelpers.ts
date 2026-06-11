import moment from 'moment';
import {
  DICT_TYPES,
  EXERCISE_CHILD_DICT_BY_TYPE,
  buildDictLabelMap,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import type { ExPatientRuleInfo, ExPatientRuleRatio } from '@/api/exPatientRule';
import { getExRecordDayCalendarList, getExRecordDayStatis, type ExRecordDayCalendarItem, type ExRecordDayStatisData } from '@/api/exRecordDay';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  cardio: '有氧心肺',
  strength: '抗阻增肌',
  flexibility: '柔韧拉伸',
  balance: '平衡控制',
};

export type ExerciseDictMaps = {
  exerciseType: Record<string, string>;
  strengthLevel: Record<string, string>;
  childTypeByExercise: Record<string, Record<string, string>>;
};

const EMPTY_DICT_MAPS: ExerciseDictMaps = {
  exerciseType: {},
  strengthLevel: {},
  childTypeByExercise: {},
};

function resolveDictLabel(map: Record<string, string> | undefined, value?: string) {
  const key = value?.trim();
  if (!key) return '';
  return map?.[key] ?? key;
}

export async function loadExerciseDictMaps(): Promise<ExerciseDictMaps> {
  const requests = [
    { key: 'exerciseType', dictType: DICT_TYPES.exerciseType },
    { key: 'strengthLevel', dictType: DICT_TYPES.strengthLevel },
    ...Object.entries(EXERCISE_CHILD_DICT_BY_TYPE).map(([exerciseType, dictType]) => ({
      key: exerciseType,
      dictType,
    })),
  ] as const;

  const responses = await Promise.all(
    requests.map(item =>
      getDictDataByType(item.dictType)
        .then(res => ({ ...item, items: isResourceApiOk(res) ? apiResourceData<DictDataItem[]>(res as any) : [] }))
        .catch(() => ({ ...item, items: [] as DictDataItem[] })),
    ),
  );

  const maps: ExerciseDictMaps = {
    exerciseType: {},
    strengthLevel: {},
    childTypeByExercise: {},
  };

  for (const item of responses) {
    const labelMap = buildDictLabelMap(item.items);
    if (item.key === 'exerciseType') {
      maps.exerciseType = labelMap;
    } else if (item.key === 'strengthLevel') {
      maps.strengthLevel = labelMap;
    } else {
      maps.childTypeByExercise[item.key] = labelMap;
    }
  }

  return maps;
}

export function getExerciseTypeLabel(type?: string, dictMaps?: ExerciseDictMaps) {
  const key = type?.trim();
  if (!key) return '训练任务';
  return dictMaps?.exerciseType[key] ?? EXERCISE_TYPE_LABELS[key] ?? key;
}

export function formatExerciseChildTypes(
  value?: string,
  exerciseType?: string,
  dictMaps?: ExerciseDictMaps,
) {
  if (!value?.trim()) return '--';

  const childMap = exerciseType ? dictMaps?.childTypeByExercise[exerciseType] : undefined;
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => resolveDictLabel(childMap, item))
    .join('、');
}

export function formatPrescriptionDateRange(startDate?: string, endDate?: string) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start && !end) return '--';
  const startText = start && moment(start).isValid() ? moment(start).format('YYYY-MM-DD') : start || '--';
  const endText = end && moment(end).isValid() ? moment(end).format('YYYY-MM-DD') : end || '--';
  return `${startText}至${endText}`;
}

export function formatExerciseDuration(minutes?: number) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '--';
  return `${minutes}分钟/次`;
}

export function formatExerciseFrequency(frequency?: number) {
  if (frequency == null || Number.isNaN(Number(frequency))) return '--';
  return `每周${frequency}次`;
}

export function normalizeExerciseProgress(progress?: number) {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildExerciseTaskSummary(rule: ExPatientRuleRatio, dictMaps?: ExerciseDictMaps) {
  const maps = dictMaps ?? EMPTY_DICT_MAPS;
  const typeLabel = getExerciseTypeLabel(rule.exerciseType, maps);
  const childTypes = formatExerciseChildTypes(rule.exerciseChildType, rule.exerciseType, maps);
  const duration = rule.duration != null ? `${rule.duration}分钟` : '--';
  const strengthLabel = resolveDictLabel(maps.strengthLevel, rule.strengthLevel);

  return {
    title: typeLabel,
    durationText: rule.duration != null ? `${rule.duration}分钟` : '--',
    durationDetail: strengthLabel ? `${typeLabel}${duration}（${strengthLabel}）` : `${typeLabel}${duration}`,
    projects: childTypes,
    progress: normalizeExerciseProgress(rule.ratio),
  };
}

export function getCurrentWeekDateRange() {
  return {
    startDate: moment().startOf('isoWeek').format('YYYY-MM-DD'),
    endDate: moment().endOf('isoWeek').format('YYYY-MM-DD'),
  };
}

function toQueryId(id?: string | number | null) {
  if (id == null || id === '') return undefined;
  return String(id);
}

export { toQueryId };

export function normalizeExPatientRuleInfo(info: ExPatientRuleInfo): ExPatientRuleInfo {
  return {
    ...info,
    exPatientRuleId: toQueryId(info.exPatientRuleId),
    patientUserId: toQueryId(info.patientUserId),
    recoveryUserId: toQueryId(info.recoveryUserId),
    exTemplateId: toQueryId(info.exTemplateId),
  };
}

export type ExerciseWeekDayItem = {
  date: moment.Moment;
  completed: boolean;
  done: number;
  total: number;
};

export function buildWeekDaysFromCalendar(calendarDays?: ExRecordDayCalendarItem[]): ExerciseWeekDayItem[] {
  const weekStart = moment().startOf('isoWeek');
  const calendarMap = new Map(
    (calendarDays ?? [])
      .filter(item => item.customerLocalDate)
      .map(item => [item.customerLocalDate!, item]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = moment(weekStart).add(index, 'day');
    const dateKey = date.format('YYYY-MM-DD');
    const record = calendarMap.get(dateKey);

    return {
      date,
      completed: record?.isComplate === 1,
      done: record?.complateNum ?? 0,
      total: record?.suNum ?? 0,
    };
  });
}

export type ExerciseWeekStats = {
  trainingCount: string;
  completionRate: string;
  totalDuration: string;
};

const EMPTY_WEEK_STATS: ExerciseWeekStats = {
  trainingCount: '--',
  completionRate: '--',
  totalDuration: '--',
};

export function formatExerciseTotalDuration(minutes?: number) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '--';
  const value = Math.max(0, Math.round(Number(minutes)));
  if (value === 0) return '0分钟';
  if (value < 60) return `${value}分钟`;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

export function buildWeekStatsFromStatis(data?: ExRecordDayStatisData | null): ExerciseWeekStats {
  if (!data) return EMPTY_WEEK_STATS;

  const done = data.complateNum ?? 0;
  const total = data.needSumExNum ?? 0;
  const ratio = data.complateRatio;

  return {
    trainingCount: `${done}/${total}`,
    completionRate:
      ratio != null && Number.isFinite(Number(ratio)) ? `${Math.round(Number(ratio))}%` : '--',
    totalDuration: formatExerciseTotalDuration(data.sumExerciseDuration),
  };
}

export async function loadExerciseWeekStats(exPatientRuleId?: string | number): Promise<ExerciseWeekStats> {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) {
    return EMPTY_WEEK_STATS;
  }

  const { startDate, endDate } = getCurrentWeekDateRange();
  try {
    const res = await getExRecordDayStatis({ exPatientRuleId: ruleId, startDate, endDate });
    if (!isResourceApiOk(res)) {
      return EMPTY_WEEK_STATS;
    }
    return buildWeekStatsFromStatis(apiResourceData<ExRecordDayStatisData>(res as any));
  } catch {
    return EMPTY_WEEK_STATS;
  }
}

export async function loadExerciseWeekCalendar(exPatientRuleId?: string | number) {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) {
    return buildWeekDaysFromCalendar();
  }

  const { startDate, endDate } = getCurrentWeekDateRange();
  try {
    const res = await getExRecordDayCalendarList({ exPatientRuleId: ruleId, startDate, endDate });
    if (!isResourceApiOk(res)) {
      return buildWeekDaysFromCalendar();
    }
    return buildWeekDaysFromCalendar(apiResourceData<ExRecordDayCalendarItem[]>(res as any));
  } catch {
    return buildWeekDaysFromCalendar();
  }
}

export function formatExerciseHistoryDateRange(startDate?: string, endDate?: string) {
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start && !end) return '--';

  const formatDate = (value: string) => {
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY/MM/DD') : value;
  };

  const startText = start ? formatDate(start) : '--';
  const endText = end ? formatDate(end) : '--';
  return `${startText}-${endText}`;
}

export function buildHistoryPlanItem(info: ExPatientRuleInfo) {
  return {
    id: toQueryId(info.exPatientRuleId) ?? `${info.startDate ?? ''}-${info.endDate ?? ''}-${info.prescriptionName ?? ''}`,
    title: info.prescriptionName?.trim() || '--',
    cycle: formatExerciseHistoryDateRange(info.startDate, info.endDate),
    progress: normalizeExerciseProgress(info.progress),
  };
}
export function getPrescriptionSummary(info?: ExPatientRuleInfo | null) {
  if (!info) {
    return {
      title: '--',
      doctor: '--',
      duration: '--',
      cycle: '--',
      frequency: '--',
      progress: 0,
    };
  }

  return {
    title: info.prescriptionName?.trim() || '--',
    doctor: info.recoveryUserName?.trim() || '--',
    duration: formatExerciseDuration(info.needExerciseDuration),
    cycle: formatPrescriptionDateRange(info.startDate, info.endDate),
    frequency: formatExerciseFrequency(info.needExerciseFrequency),
    progress: normalizeExerciseProgress(info.progress),
  };
}
