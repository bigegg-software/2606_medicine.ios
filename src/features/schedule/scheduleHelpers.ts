import moment from 'moment';
import {
  DICT_TYPES,
  EXERCISE_CHILD_DICT_BY_TYPE,
  buildDictLabelMap,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  getDayTypeListDetailByCustomerLocalDate,
  getScheduleWeekCalendarList,
  type DayTypeDetailItem,
  type ExPatientRuleRatio,
  type HistoryExPatientRule,
  type InUseExPatientRule,
  type WeekCalendarItem,
} from '@/api/schedule';

export type ScheduleDictMaps = {
  exerciseType: Record<string, string>;
  strengthLevel: Record<string, string>;
  childTypeByExercise: Record<string, Record<string, string>>;
};

export type ScheduleWeekDayItem = {
  date: moment.Moment;
  completed: boolean;
  done: number;
  total: number;
};

export type HistoryPlanItem = {
  id: string;
  title: string;
  cycle: string;
  status?: number;
  stopReason: string;
};

export const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  cardio: '有氧心肺',
  strength: '抗阻增肌',
  flexibility: '柔韧拉伸',
  balance: '平衡控制',
};

export const EXERCISE_TYPE_IMAGES: Record<string, number> = {
  cardio: require('@/assets/images/schedule/exercise2.png'),
  strength: require('@/assets/images/schedule/exercise2.png'),
  flexibility: require('@/assets/images/schedule/exercise2.png'),
  balance: require('@/assets/images/schedule/exercise1.png'),
};

function toQueryId(id?: string | number | null) {
  if (id == null || id === '') return undefined;
  return String(id);
}

function resolveDictLabel(map: Record<string, string> | undefined, value?: string) {
  const key = value?.trim();
  if (!key) return '';
  return map?.[key] ?? key;
}

export function getCurrentWeekDateRange() {
  return {
    startDate: moment().startOf('isoWeek').format('YYYY-MM-DD'),
    endDate: moment().endOf('isoWeek').format('YYYY-MM-DD'),
  };
}

export async function loadScheduleDictMaps(): Promise<ScheduleDictMaps> {
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

  const maps: ScheduleDictMaps = {
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

export function buildScheduleWeekDays(calendarDays?: WeekCalendarItem[]): ScheduleWeekDayItem[] {
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

export async function loadScheduleWeekCalendar(exPatientRuleId?: string | number) {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) {
    return buildScheduleWeekDays();
  }

  const { startDate, endDate } = getCurrentWeekDateRange();
  try {
    const res = await getScheduleWeekCalendarList({ exPatientRuleId: ruleId, startDate, endDate });
    if (!isResourceApiOk(res)) {
      return buildScheduleWeekDays();
    }
    return buildScheduleWeekDays(apiResourceData<WeekCalendarItem[]>(res as any));
  } catch {
    return buildScheduleWeekDays();
  }
}

export function normalizeProgress(progress?: number) {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function calcDayTypeProgress(need?: number, done?: number) {
  const needValue = Number(need);
  const doneValue = Number(done ?? 0);
  if (!Number.isFinite(needValue) || needValue <= 0) return 0;
  return normalizeProgress((doneValue / needValue) * 100);
}

export async function loadTodayTaskProgressMap(
  exPatientRuleId?: string | number,
  customerLocalDate = moment().format('YYYY-MM-DD'),
): Promise<Record<string, number>> {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) return {};

  try {
    const res = await getDayTypeListDetailByCustomerLocalDate({
      exPatientRuleId: ruleId,
      customerLocalDate,
    });
    if (!isResourceApiOk(res)) return {};

    const list = apiResourceData<DayTypeDetailItem[]>(res as any) ?? [];
    const map: Record<string, number> = {};
    for (const item of list) {
      const typeKey = item.exerciseType?.trim();
      if (!typeKey) continue;
      map[typeKey] = calcDayTypeProgress(item.typeNeedExerciseDuration, item.typeSumExerciseDuration);
    }
    return map;
  } catch {
    return {};
  }
}

export function getExerciseTypeLabel(type?: string) {
  const key = type?.trim();
  if (!key) return '训练任务';
  return EXERCISE_TYPE_LABELS[key] ?? key;
}

function formatExerciseChildTypes(
  value?: string,
  exerciseType?: string,
  dictMaps?: ScheduleDictMaps,
) {
  if (!value?.trim()) return '';

  const childMap = exerciseType ? dictMaps?.childTypeByExercise[exerciseType] : undefined;
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => resolveDictLabel(childMap, item))
    .join('、');
}

function getGoalSubtitle(rule: ExPatientRuleRatio, dictMaps?: ScheduleDictMaps) {
  const childText = formatExerciseChildTypes(rule.exerciseChildType, rule.exerciseType, dictMaps);
  if (childText) return childText;

  const durationText = rule.duration != null ? `${rule.duration}分钟` : '';
  const strengthText = resolveDictLabel(dictMaps?.strengthLevel, rule.strengthLevel);
  if (durationText && strengthText) return `${durationText}（${strengthText}）`;
  return durationText || strengthText || '--';
}

export function toTodayTaskItem(
  rule: ExPatientRuleRatio,
  index: number,
  dictMaps?: ScheduleDictMaps,
  progressMap?: Record<string, number>,
) {
  const typeKey = rule.exerciseType?.trim() ?? '';
  const typeLabel = dictMaps?.exerciseType[typeKey] ?? getExerciseTypeLabel(typeKey);
  const progress = typeKey && progressMap?.[typeKey] != null
    ? progressMap[typeKey]
    : normalizeProgress(rule.ratio);

  return {
    key: `${typeKey}-${index}`,
    title: typeLabel,
    intro: rule.duration != null ? `${typeLabel}${rule.duration}分钟` : '--',
    progress,
    icon: EXERCISE_TYPE_IMAGES[typeKey] ?? EXERCISE_TYPE_IMAGES.cardio,
  };
}

export function toGoalItem(rule: ExPatientRuleRatio, index: number, dictMaps?: ScheduleDictMaps) {
  const typeKey = rule.exerciseType?.trim() ?? '';
  return {
    key: `${typeKey}-${index}`,
    title: dictMaps?.exerciseType[typeKey] ?? getExerciseTypeLabel(typeKey),
    subtitle: getGoalSubtitle(rule, dictMaps),
    icon: EXERCISE_TYPE_IMAGES[typeKey] ?? EXERCISE_TYPE_IMAGES.cardio,
    backImage: index === 0
      ? require('@/assets/images/schedule/back1.png')
      : require('@/assets/images/schedule/back2.png'),
  };
}

export function formatPrescriptionCycleDays(startDate?: string, endDate?: string) {
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) return '--';
  return `${end.diff(start, 'days') + 1}天`;
}

export function getInUseStatusText(info?: InUseExPatientRule | null) {
  if (!info) return '--';
  if (info.status === 1) return '已暂停';
  if (info.status === 2) return '已结束';
  const ratio = info.progressInfo?.complateRatio;
  if (ratio != null && ratio >= 80) return '状态良好';
  if (ratio != null && ratio >= 50) return '持续改善中';
  return '进行中';
}

export function formatTotalDuration(minutes?: number) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '--';
  const value = Math.max(0, Math.round(Number(minutes)));
  if (value === 0) return '0分钟';
  if (value < 60) return `${value}分钟`;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}m`;
}

export function formatTrainingCount(info?: InUseExPatientRule['progressInfo']) {
  if (!info) return '--';
  const done = info.complateNum ?? 0;
  const total = info.needSumExNum ?? 0;
  if (total <= 0) return String(done);
  return `${done}/${total}`;
}

export function formatCompletionRate(info?: InUseExPatientRule['progressInfo']) {
  if (info?.complateRatio == null || Number.isNaN(Number(info.complateRatio))) return '--';
  return `${normalizeProgress(info.complateRatio)}%`;
}

function getHistorySortTime(item: HistoryExPatientRule) {
  return item.updateTime ?? item.stopTime ?? item.endDate ?? item.createTime ?? '';
}

function formatHistoryDateRange(startDate?: string, endDate?: string) {
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

export function getHistoryStatusLabel(status?: number) {
  if (status === 0) return '进行中';
  if (status === 1) return '已暂停';
  if (status === 2) return '已结束';
  return '--';
}

export function toHistoryPlanItem(info: HistoryExPatientRule): HistoryPlanItem {
  const id = info.exPatientRuleId != null && info.exPatientRuleId !== ''
    ? String(info.exPatientRuleId)
    : `${info.startDate ?? ''}-${info.endDate ?? ''}-${info.prescriptionName ?? ''}`;

  return {
    id,
    title: info.prescriptionName?.trim() || '--',
    cycle: formatHistoryDateRange(info.startDate, info.endDate),
    status: info.status,
    stopReason: info.stopReason?.trim() || '',
  };
}

export function sortHistoryPlans(items: HistoryExPatientRule[]) {
  return [...items].sort(
    (a, b) => moment(getHistorySortTime(b)).valueOf() - moment(getHistorySortTime(a)).valueOf(),
  );
}
