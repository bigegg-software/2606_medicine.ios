import moment from 'moment';
import {
  DICT_TYPES,
  EXERCISE_CHILD_DICT_BY_TYPE,
  buildDictLabelMap,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import type { UserBaseInfo } from '@/api/patient';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getExRecordDayStatis, type ExRecordDayStatisData } from '@/api/exRecordDay';
import {
  getExPatientRuleHealthGoalProgress,
  getExPatientRuleModuleCompleteRate,
  type ExPatientRuleHealthGoalProgress,
  type ExPatientRuleHealthGoalProgressField,
  type ExPatientRuleModuleCompleteRate,
} from '@/api/exPatientRule';
import {
  getExMilestoneRuleStat,
  type ExMilestoneRuleStat,
} from '@/api/exMilestone';
import {
  getExerciseTypeStatis,
  getHistoryExPatientRuleList,
  getScheduleWeekCalendarList,
  type DayTypeDetailItem,
  type ExPatientRuleRatio,
  type ExerciseTypeStatisItem,
  type HistoryExPatientRule,
  type HistoryListResult,
  type InUseExPatientRule,
  type ProgressInfo,
  type WeekCalendarItem,
} from '@/api/schedule';
import { getHealthGoalInfo, type HealthGoalInfo, type HealthGoalTarget } from '@/api/healthGoal';
import { formatDiagnosticLabelText } from '@/src/features/exercise/utils/exerciseHelpers';

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

/** 日程页「历史干预计划档案」卡片 */
export type ScheduleHistoryArchiveMaxProgress = {
  /** 如 空腹血糖(mmol/L) */
  label: string;
  /** 最新值 */
  currentText: string;
  /** 基准值（划线展示）；无则不展示 */
  baselineText: string | null;
  /** 相对基准的数值升降 */
  trend: 'up' | 'down' | null;
};

export type ScheduleHistoryArchiveItem = {
  id: string;
  title: string;
  status?: number;
  statusLabel: string;
  dateText: string;
  sessionCountText: string;
  durationHoursText: string;
  /** 进步最大分项；无有效数据时为 null（卡片不展示该列） */
  maxProgress: ScheduleHistoryArchiveMaxProgress | null;
  summaryText: string;
  isInProgress: boolean;
  isDone: boolean;
};

export type HealthGoalDisplayItem = {
  key: string;
  title: string;
  subtitle: string;
  statusText: string;
  icon: number;
  backImage: number;
  assessmentType: string;
  assessmentValue: string;
};

export const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  cardio: '有氧心肺',
  strength: '抗阻增肌',
  flexibility: '柔韧拉伸',
  balance: '平衡控制',
};

const EXERCISE_TYPE_RING_ORDER = ['cardio', 'strength', 'flexibility', 'balance'] as const;

const EMPTY_RING_PROGRESS: [number, number, number, number] = [0, 0, 0, 0];

export const EXERCISE_TYPE_IMAGES: Record<string, number> = {
  cardio: require('@/assets/images/schedule/exercise3.png'),
  strength: require('@/assets/images/schedule/exercise2.png'),
  flexibility: require('@/assets/images/schedule/exercise4.png'),
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
  return getWeekDateRange(moment());
}

export function getWeekDateRange(weekStart: moment.Moment) {
  const start = moment(weekStart).startOf('isoWeek');
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: moment(start).endOf('isoWeek').format('YYYY-MM-DD'),
  };
}

export function formatWeekRangeText(startDate: string, endDate: string) {
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) return '--';
  return `${start.format('YYYY/MM/DD')}-${end.format('YYYY/MM/DD')}`;
}

export function isDateInPrescriptionRange(
  date: moment.Moment,
  prescriptionStartDate?: string,
  prescriptionEndDate?: string,
) {
  const start = moment(prescriptionStartDate);
  const end = moment(prescriptionEndDate);
  if (!start.isValid() || !end.isValid()) return true;
  return date.isBetween(start, end, 'day', '[]');
}

export function clampDateRangeToPrescription(
  rangeStartDate: string,
  rangeEndDate: string,
  prescriptionStartDate?: string,
  prescriptionEndDate?: string,
) {
  const rangeStart = moment(rangeStartDate);
  const rangeEnd = moment(rangeEndDate);
  const prescriptionStart = moment(prescriptionStartDate);
  const prescriptionEnd = moment(prescriptionEndDate);

  if (!rangeStart.isValid() || !rangeEnd.isValid()) return null;
  if (!prescriptionStart.isValid() || !prescriptionEnd.isValid()) {
    return { startDate: rangeStartDate, endDate: rangeEndDate };
  }

  const start = moment.max(rangeStart, prescriptionStart);
  const end = moment.min(rangeEnd, prescriptionEnd);
  if (start.isAfter(end, 'day')) return null;

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}

export function canShiftWeekWithinPrescription(
  weekStart: moment.Moment,
  direction: -1 | 1,
  prescriptionStartDate?: string,
  prescriptionEndDate?: string,
) {
  const prescriptionStart = moment(prescriptionStartDate);
  const prescriptionEnd = moment(prescriptionEndDate);
  if (!prescriptionStart.isValid() || !prescriptionEnd.isValid()) return true;

  const targetWeekStart = moment(weekStart).add(direction, 'week').startOf('isoWeek');
  const targetWeekEnd = moment(targetWeekStart).endOf('isoWeek');
  return targetWeekEnd.isSameOrAfter(prescriptionStart, 'day')
    && targetWeekStart.isSameOrBefore(prescriptionEnd, 'day');
}

export function getPrescriptionLastWeekState(
  prescriptionStartDate?: string,
  prescriptionEndDate?: string,
) {
  const prescriptionEnd = moment(prescriptionEndDate);
  if (!prescriptionEnd.isValid()) {
    return {
      weekStart: moment().startOf('isoWeek'),
      selectedDate: moment().format('YYYY-MM-DD'),
    };
  }

  const prescriptionStart = moment(prescriptionStartDate);
  const weekStart = moment(prescriptionEnd).startOf('isoWeek');
  let selectedDate = moment(prescriptionEnd);

  if (prescriptionStart.isValid() && selectedDate.isBefore(prescriptionStart, 'day')) {
    selectedDate = moment(prescriptionStart);
  }

  return {
    weekStart,
    selectedDate: selectedDate.format('YYYY-MM-DD'),
  };
}

export type ScheduleWeekStats = {
  trainingCount: string;
  completionRate: string;
  totalDuration: string;
  trainingDone: string;
  trainingTotal: string;
  durationMinutes: string;
};

const EMPTY_WEEK_STATS: ScheduleWeekStats = {
  trainingCount: '--',
  completionRate: '--',
  totalDuration: '--',
  trainingDone: '--',
  trainingTotal: '',
  durationMinutes: '--',
};

export function buildWeekStatsFromStatis(data?: ExRecordDayStatisData | null): ScheduleWeekStats {
  if (!data) return EMPTY_WEEK_STATS;

  const done = data.complateNum ?? 0;
  const total = data.needSumExNum ?? 0;
  const ratio = data.complateRatio;

  return {
    trainingCount: total <= 0 ? String(done) : `${done}/${total}`,
    trainingDone: String(done),
    trainingTotal: total > 0 ? String(total) : '',
    completionRate:
      ratio != null && Number.isFinite(Number(ratio)) ? `${normalizeProgress(ratio)}%` : '--',
    totalDuration: formatTotalDuration(data.sumExerciseDuration),
    durationMinutes:
      data.sumExerciseDuration != null && Number.isFinite(Number(data.sumExerciseDuration))
        ? String(Math.max(0, Math.round(Number(data.sumExerciseDuration))))
        : '--',
  };
}

let scheduleDictMapsPromise: Promise<ScheduleDictMaps> | null = null;

/** 字典初始化后复用，避免切日重复请求 */
export async function loadScheduleDictMaps(): Promise<ScheduleDictMaps> {
  if (scheduleDictMapsPromise) return scheduleDictMapsPromise;

  scheduleDictMapsPromise = (async () => {
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
  })().catch(error => {
    scheduleDictMapsPromise = null;
    throw error;
  });

  return scheduleDictMapsPromise;
}

export function buildScheduleWeekDays(
  calendarDays?: WeekCalendarItem[],
  weekStart = moment().startOf('isoWeek'),
): ScheduleWeekDayItem[] {
  const start = moment(weekStart).startOf('isoWeek');
  const calendarMap = new Map(
    (calendarDays ?? [])
      .filter(item => item.customerLocalDate)
      .map(item => [item.customerLocalDate!, item]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = moment(start).add(index, 'day');
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

export async function loadScheduleWeekCalendarForRange(
  exPatientRuleId: string | number | undefined,
  startDate: string,
  endDate: string,
  weekStart = moment(startDate),
) {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) {
    return buildScheduleWeekDays(undefined, weekStart);
  }

  try {
    const res = await getScheduleWeekCalendarList({ exPatientRuleId: ruleId, startDate, endDate });
    if (!isResourceApiOk(res)) {
      return buildScheduleWeekDays(undefined, weekStart);
    }
    return buildScheduleWeekDays(apiResourceData<WeekCalendarItem[]>(res as any), weekStart);
  } catch {
    return buildScheduleWeekDays(undefined, weekStart);
  }
}

export async function loadScheduleWeekCalendar(exPatientRuleId?: string | number) {
  const { startDate, endDate } = getCurrentWeekDateRange();
  return loadScheduleWeekCalendarForRange(exPatientRuleId, startDate, endDate);
}

export async function loadScheduleWeekStatsForRange(
  exPatientRuleId: string | number | undefined,
  startDate: string,
  endDate: string,
): Promise<ScheduleWeekStats> {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) return EMPTY_WEEK_STATS;

  try {
    const res = await getExRecordDayStatis({ exPatientRuleId: ruleId, startDate, endDate });
    if (!isResourceApiOk(res)) return EMPTY_WEEK_STATS;
    return buildWeekStatsFromStatis(apiResourceData<ExRecordDayStatisData>(res as any));
  } catch {
    return EMPTY_WEEK_STATS;
  }
}

export type DayTrainingDetailItem = {
  key: string;
  title: string;
  durationText: string;
  projects: string;
  progress: number;
  icon: number;
};

/** dayTypeListDetailByCustomerLocalDate 已下线，暂无分类型日详情数据源 */
export async function loadDayTrainingDetails(
  _exPatientRuleId: string | number | undefined,
  _customerLocalDate: string,
  _dictMaps?: ScheduleDictMaps,
): Promise<DayTrainingDetailItem[]> {
  return [];
}

export function toDayTrainingDetailItem(
  item: DayTypeDetailItem,
  index: number,
  dictMaps?: ScheduleDictMaps,
): DayTrainingDetailItem {
  const typeKey = item.exerciseType?.trim() ?? '';
  const typeLabel = dictMaps?.exerciseType[typeKey] ?? getExerciseTypeLabel(typeKey);
  const done = item.typeSumExerciseDuration ?? 0;
  const target = item.typeNeedExerciseDuration ?? 0;
  const childTypes = (item.childTypeList ?? [])
    .map(child => getExerciseChildTypeLabel(child.exerciseChildType, typeKey, dictMaps))
    .filter(Boolean)
    .join('、');

  return {
    key: `${typeKey}-${index}`,
    title: typeLabel,
    durationText: target > 0 ? `${done}/${target}分钟` : `${done}分钟`,
    projects: childTypes || getExerciseChildTypeLabel(item.exerciseChildType, typeKey, dictMaps) || '--',
    progress: calcDayTypeProgress(item.typeNeedExerciseDuration, item.typeSumExerciseDuration),
    icon: EXERCISE_TYPE_IMAGES[typeKey] ?? EXERCISE_TYPE_IMAGES.cardio,
  };
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

export function buildExerciseTypeRingProgress(
  stats: ExerciseTypeStatisItem[] | undefined,
  ruleRatioList?: ExPatientRuleRatio[],
): [number, number, number, number] {
  const statMap = new Map(
    (stats ?? [])
      .filter(item => item.exerciseType?.trim())
      .map(item => [item.exerciseType!.trim(), normalizeProgress(item.complateRatio) / 100]),
  );

  const ruleOrder = (ruleRatioList ?? [])
    .map(rule => rule.exerciseType?.trim())
    .filter((type): type is string => Boolean(type))
    .slice(0, 4);

  const order = ruleOrder.length > 0 ? ruleOrder : [...EXERCISE_TYPE_RING_ORDER];
  while (order.length < 4) {
    order.push(EXERCISE_TYPE_RING_ORDER[order.length] ?? '');
  }

  return [
    statMap.get(order[0]!) ?? 0,
    statMap.get(order[1]!) ?? 0,
    statMap.get(order[2]!) ?? 0,
    statMap.get(order[3]!) ?? 0,
  ];
}

export async function loadExerciseTypeRingProgress(
  exPatientRuleId?: string | number,
  ruleRatioList?: ExPatientRuleRatio[],
): Promise<[number, number, number, number]> {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) return EMPTY_RING_PROGRESS;

  try {
    const res = await getExerciseTypeStatis({ exPatientRuleId: ruleId });
    if (!isResourceApiOk(res)) return EMPTY_RING_PROGRESS;
    const list = apiResourceData<ExerciseTypeStatisItem[]>(res as any) ?? [];
    return buildExerciseTypeRingProgress(list, ruleRatioList);
  } catch {
    return EMPTY_RING_PROGRESS;
  }
}

/** dayTypeListDetailByCustomerLocalDate 已下线，改用 exerciseTypeStatis 完成比例 */
export async function loadTodayTaskProgressMap(
  exPatientRuleId?: string | number,
  _customerLocalDate = moment().format('YYYY-MM-DD'),
): Promise<Record<string, number>> {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) return {};

  try {
    const res = await getExerciseTypeStatis({ exPatientRuleId: ruleId });
    if (!isResourceApiOk(res)) return {};

    const list = apiResourceData<ExerciseTypeStatisItem[]>(res as any) ?? [];
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

/** 处方主训练四模块整体完成率 → exerciseType progressMap（0-100） */
export function toModuleCompleteRateProgressMap(
  data?: ExPatientRuleModuleCompleteRate | null,
): Record<string, number> {
  if (!data) return {};
  return {
    cardio: normalizeProgress(data.cardioCompleteRate),
    strength: normalizeProgress(data.strengthCompleteRate),
    flexibility: normalizeProgress(data.flexibilityCompleteRate),
    balance: normalizeProgress(data.balanceCompleteRate),
  };
}

/** 首页运动处方卡片：按处方起止日期的四模块整体完成率 */
export async function loadModuleCompleteRateProgressMap(
  exPatientRuleId?: string | number,
): Promise<Record<string, number>> {
  const ruleId = toQueryId(exPatientRuleId);
  if (!ruleId) return {};

  try {
    const res = await getExPatientRuleModuleCompleteRate(ruleId);
    if (!isResourceApiOk(res as { code?: number })) return {};
    return toModuleCompleteRateProgressMap(
      apiResourceData<ExPatientRuleModuleCompleteRate>(res as { data?: ExPatientRuleModuleCompleteRate }),
    );
  } catch {
    return {};
  }
}

export function getExerciseTypeLabel(type?: string) {
  const key = type?.trim();
  if (!key) return '训练任务';
  return EXERCISE_TYPE_LABELS[key] ?? key;
}

export function getExerciseChildTypeLabel(
  childType?: string,
  exerciseType?: string,
  dictMaps?: ScheduleDictMaps,
) {
  const key = childType?.trim();
  if (!key) return '';
  const childMap = exerciseType ? dictMaps?.childTypeByExercise[exerciseType] : undefined;
  return resolveDictLabel(childMap, key);
}

export const PLAYER_SPORT_IMAGES: Record<string, number> = {
  cardio: require('@/assets/images/player/sport1.png'),
  strength: require('@/assets/images/player/sport2.png'),
  flexibility: require('@/assets/images/player/sport3.png'),
  balance: require('@/assets/images/player/sport4.png'),
};

export const EXERCISE_TYPE_COLORS: Record<string, string> = {
  cardio: '#6D925E',
  strength: '#72A1C5',
  flexibility: '#0951AE',
  balance: '#EE9C44',
};

export type ExercisePrescriptionMetricItem = {
  key: string;
  /** 今日处方未安排该类型时为 null，首页展示 -- */
  value: number | null;
  label: string;
  color: string;
};

/** 今日主训练实际有动作的类型；休息日为空；无周安排时回退 ruleRatioList */
export function resolveTodayExerciseMetricTypeKeys(
  prescription?: Pick<InUseExPatientRule, 'ruleRatioList' | 'weekTrainingScheduleList'> | null,
  customerLocalDate?: string,
): Set<string> {
  const date = customerLocalDate?.trim() || moment().format('YYYY-MM-DD');
  const day = moment(date, 'YYYY-MM-DD').isoWeekday();
  const schedule = Number.isFinite(day) && day >= 1 && day <= 7
    ? (prescription?.weekTrainingScheduleList ?? []).find(item => Number(item.day) === day) ?? null
    : null;

  if (schedule?.isRest) return new Set();

  if (schedule?.mainList?.length) {
    const keys = new Set<string>();
    for (const block of schedule.mainList) {
      if ((block.cardioList ?? []).length > 0) keys.add('cardio');
      if ((block.strengthList ?? []).length > 0) keys.add('strength');
      if ((block.flexibilityList ?? []).length > 0) keys.add('flexibility');
      if ((block.balanceList ?? []).length > 0) keys.add('balance');
    }
    if (keys.size > 0) return keys;
  }

  const fromRatio = new Set<string>();
  for (const rule of prescription?.ruleRatioList ?? []) {
    const typeKey = rule.exerciseType?.trim();
    if (typeKey) fromRatio.add(typeKey);
  }
  return fromRatio;
}

/** 首页 / 日历：固定四类；今日处方未安排的类型 value 为 null（显示 --） */
export function buildExercisePrescriptionMetrics(
  ruleRatioList?: ExPatientRuleRatio[],
  dictMaps?: ScheduleDictMaps,
  progressMap?: Record<string, number>,
  options?: {
    /** 今日有安排的类型；不传则按 ruleRatioList 判断 */
    availableTypeKeys?: ReadonlySet<string> | readonly string[] | null;
  },
): ExercisePrescriptionMetricItem[] {
  const list = ruleRatioList ?? [];
  const byType = new Map<string, { rule: ExPatientRuleRatio; index: number }>();
  list.forEach((rule, index) => {
    const typeKey = rule.exerciseType?.trim();
    if (!typeKey || byType.has(typeKey)) return;
    byType.set(typeKey, { rule, index });
  });

  const availableKeys = options?.availableTypeKeys == null
    ? null
    : options.availableTypeKeys instanceof Set
      ? options.availableTypeKeys
      : new Set(options.availableTypeKeys);

  return EXERCISE_TYPE_RING_ORDER.map(typeKey => {
    const color = EXERCISE_TYPE_COLORS[typeKey] ?? '#6D925E';
    const label = dictMaps?.exerciseType[typeKey] ?? getExerciseTypeLabel(typeKey);
    const matched = byType.get(typeKey);
    const isAvailable = availableKeys != null
      ? availableKeys.has(typeKey)
      : Boolean(matched);

    if (!isAvailable) {
      return {
        key: typeKey,
        value: null,
        label: matched
          ? (dictMaps?.exerciseType[typeKey]
            ?? toTodayTaskItem(matched.rule, matched.index, dictMaps, progressMap).title)
          : label,
        color,
      };
    }

    if (matched) {
      const task = toTodayTaskItem(matched.rule, matched.index, dictMaps, progressMap);
      return {
        key: typeKey,
        value: task.progress,
        label: task.title,
        color,
      };
    }

    // 今日有安排但不在 ratio 列表：仍展示进度（无则 0）
    const progress = progressMap?.[typeKey];
    return {
      key: typeKey,
      value: progress != null ? normalizeProgress(progress) : 0,
      label,
      color,
    };
  });
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

const HEALTH_GOAL_ICONS: Record<string, number> = {
  health_indicator_type: require('@/assets/images/schedule/yw.png'),
  sys_health_test_item: require('@/assets/images/schedule/exercise3.png'),
  question_type: require('@/assets/images/schedule/exercise4.png'),
  assessment_type_other: require('@/assets/images/schedule/yw.png'),
};

const COMPLIANT_TYPE_META: Record<string, {
  label: string;
  rateKey: keyof HealthGoalTarget;
  dirKey: keyof HealthGoalTarget;
}> = {
  xuezhiTc: { label: '总胆固醇', rateKey: 'xuezhiTcRate', dirKey: 'xuezhiTcImproveDirection' },
  xuezhiTg: { label: '甘油三酯', rateKey: 'xuezhiTgRate', dirKey: 'xuezhiTgImproveDirection' },
  xuezhiHdlC: { label: 'HDL-C', rateKey: 'xuezhiHdlCRate', dirKey: 'xuezhiHdlCImproveDirection' },
  xuezhiLdlC: { label: 'LDL-C', rateKey: 'xuezhiLdlCRate', dirKey: 'xuezhiLdlCImproveDirection' },
};

function formatImproveDirectionText(direction?: number) {
  if (direction === 1) return '上升';
  if (direction === -1) return '下降';
  return '改善';
}

function formatLipidTargets(target: HealthGoalTarget) {
  return (target.compliantTypes ?? [])
    .map(type => {
      const meta = COMPLIANT_TYPE_META[type];
      if (!meta) return '';
      const rate = target[meta.rateKey] as number | undefined;
      const direction = target[meta.dirKey] as number | undefined;
      if (rate == null) return '';
      return `${meta.label}${formatImproveDirectionText(direction)}${rate}%`;
    })
    .filter(Boolean);
}

function formatHealthGoalSubtitle(target: HealthGoalTarget) {
  const goalVo = target.healthGoalVo;
  const indicatorName = goalVo?.assessmentValueName?.trim()
    || goalVo?.healthTestItemVo?.testName?.trim();

  if (goalVo?.assessmentType === 'sys_health_test_item' && target.improveDirectionVal != null) {
    const unit = goalVo.healthTestItemVo?.unit?.trim();
    const direction = goalVo.healthTestItemVo?.improveDirection;
    const directionText = direction === 1 ? '提高' : direction === -1 ? '降低' : '改善';
    const suffix = unit ? unit : '%';
    return `${indicatorName ?? '健康测试'}${directionText}${target.improveDirectionVal}${suffix}`;
  }

  if (target.exImpRate != null) {
    return `执行率目标 ${target.exImpRate}%`;
  }

  if (target.complianceImproveType === 0 && target.compliantPercent != null) {
    return `${indicatorName ?? '指标'}达标率 ${target.compliantPercent}%`;
  }

  if (target.complianceImproveType === 1) {
    const lipidTargets = formatLipidTargets(target);
    if (lipidTargets.length > 0) {
      return lipidTargets.join('、');
    }
  }

  return indicatorName || goalVo?.goalName?.trim() || '--';
}

function resolveHealthGoalProgressState(
  target: HealthGoalTarget,
  progressInfo?: ProgressInfo,
): { kind: 'no_data' } | { kind: 'declined' } | { kind: 'progress'; value: number } {
  if (target.indicatorDeclined === 1) {
    return { kind: 'declined' };
  }

  if (target.exImpRate != null) {
    const ratio = progressInfo?.complateRatio;
    if (ratio == null || Number.isNaN(Number(ratio))) {
      return { kind: 'no_data' };
    }
    return { kind: 'progress', value: normalizeProgress(ratio) };
  }

  const rawProgress = target.improvePercent ?? target.compliantPercent;
  if (rawProgress == null || Number.isNaN(Number(rawProgress))) {
    return { kind: 'no_data' };
  }

  const progress = Number(rawProgress);
  if (progress < 0) {
    return { kind: 'declined' };
  }

  return { kind: 'progress', value: normalizeProgress(progress) };
}

function isNonQuantifiableHealthGoal(target: HealthGoalTarget) {
  return target.healthGoalVo?.assessmentType?.trim() === 'question_type';
}

function formatHealthGoalStatusByProgress(progress: number) {
  if (progress >= 80) return '接近目标达成';
  if (progress >= 60) return '改善明显';
  if (progress >= 40) return '改善情况良好';
  if (progress >= 20) return '持续改善中';
  return '已开始改善';
}

function getHealthGoalStatusText(target: HealthGoalTarget, progressInfo?: ProgressInfo) {
  const state = resolveHealthGoalProgressState(target, progressInfo);
  if (state.kind === 'declined') return '指标下降需关注';
  if (state.kind === 'progress') return formatHealthGoalStatusByProgress(state.value);
  if (isNonQuantifiableHealthGoal(target)) return '持续改善中';
  return '等待评估';
}

function getHealthGoalIcon(target: HealthGoalTarget) {
  const assessmentType = target.healthGoalVo?.assessmentType?.trim();
  if (assessmentType && HEALTH_GOAL_ICONS[assessmentType]) {
    return HEALTH_GOAL_ICONS[assessmentType];
  }
  return HEALTH_GOAL_ICONS.health_indicator_type;
}

export async function enrichHealthGoalTargets(
  targets?: HealthGoalTarget[],
  options?: { previousTargets?: HealthGoalTarget[] },
) {
  if (!targets?.length) return [];

  const previousById = new Map<string, HealthGoalTarget>();
  for (const item of options?.previousTargets ?? []) {
    if (item.healthGoalId == null) continue;
    previousById.set(String(item.healthGoalId), item);
  }

  return Promise.all(
    targets.map(async target => {
      const previous = target.healthGoalId != null
        ? previousById.get(String(target.healthGoalId))
        : undefined;
      const merged: HealthGoalTarget = previous?.healthGoalVo
        ? {
          ...target,
          healthGoalVo: {
            ...previous.healthGoalVo,
            ...target.healthGoalVo,
          },
        }
        : target;

      const hasName = Boolean(merged.healthGoalVo?.goalName?.trim());
      const hasCategory = Boolean(merged.healthGoalVo?.targetCategory?.trim());
      if ((hasName && hasCategory) || merged.healthGoalId == null) {
        return merged;
      }

      try {
        const res = await getHealthGoalInfo(merged.healthGoalId);
        if (!isResourceApiOk(res)) return merged;
        const info = apiResourceData<HealthGoalInfo>(res as any);
        return info ? { ...merged, healthGoalVo: info } : merged;
      } catch {
        return merged;
      }
    }),
  );
}

export function toHealthGoalDisplayItem(
  target: HealthGoalTarget,
  index: number,
  progressInfo?: ProgressInfo,
): HealthGoalDisplayItem {
  const goalVo = target.healthGoalVo;
  const assessmentType = goalVo?.assessmentType?.trim();
  const assessmentValue = goalVo?.assessmentValue?.trim();
  const key = target.healthGoalId != null
    ? String(target.healthGoalId)
    : `${goalVo?.goalName ?? 'goal'}-${index}`;
  return {
    key,
    title: goalVo?.goalName?.trim() || goalVo?.assessmentValueName?.trim() || '健康目标',
    subtitle: formatHealthGoalSubtitle(target),
    statusText: getHealthGoalStatusText(target, progressInfo),
    icon: getHealthGoalIcon(target),
    backImage: index % 2 === 0
      ? require('@/assets/images/schedule/back1.png')
      : require('@/assets/images/schedule/back2.png'),
    assessmentType: assessmentType ?? '',
    assessmentValue: assessmentValue ?? '',
  };
}

const HEALTH_INDICATOR_VALUE_ORDER = ['xueYa', 'xueTang', 'tiZhong', 'xueZhi'] as const;

const HEALTH_GOAL_TYPE_ORDER: Record<string, number> = {
  health_indicator_type: 0,
  sys_health_test_item: 1,
  question_type: 2,
};

function getHealthGoalSortIndex(item: HealthGoalDisplayItem) {
  const typeRank = HEALTH_GOAL_TYPE_ORDER[item.assessmentType] ?? 99;
  if (item.assessmentType !== 'health_indicator_type') {
    return typeRank * 100;
  }

  const valueRank = HEALTH_INDICATOR_VALUE_ORDER.indexOf(
    item.assessmentValue as typeof HEALTH_INDICATOR_VALUE_ORDER[number],
  );
  return typeRank * 100 + (valueRank >= 0 ? valueRank : 99);
}

export function sortHealthGoalDisplayItems(items: HealthGoalDisplayItem[]) {
  return [...items].sort((left, right) => getHealthGoalSortIndex(left) - getHealthGoalSortIndex(right));
}

function getFirstExerciseChildTypeLabel(
  rule: ExPatientRuleRatio,
  dictMaps?: ScheduleDictMaps,
) {
  const typeKey = rule.exerciseType?.trim() ?? '';
  const firstChild = (rule.exerciseChildType ?? '')
    .split(',')
    .map(item => item.trim())
    .find(Boolean);
  if (!firstChild) return '';
  return getExerciseChildTypeLabel(firstChild, typeKey, dictMaps) || firstChild;
}

function formatTodayTaskIntro(rule: ExPatientRuleRatio, dictMaps?: ScheduleDictMaps) {
  const label = getFirstExerciseChildTypeLabel(rule, dictMaps);
  const duration = Number(rule.duration);
  if (!label) return '--';
  if (Number.isFinite(duration) && duration > 0) {
    return `${label}${Math.round(duration)}分钟`;
  }
  return label;
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
    intro: formatTodayTaskIntro(rule, dictMaps),
    progress,
    icon: EXERCISE_TYPE_IMAGES[typeKey] ?? EXERCISE_TYPE_IMAGES.cardio,
    progressColor: EXERCISE_TYPE_COLORS[typeKey] ?? EXERCISE_TYPE_COLORS.cardio,
  };
}

export function formatPrescriptionCycleDays(startDate?: string, endDate?: string) {
  if (!startDate?.trim() || !endDate?.trim()) return '--';
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) return '--';
  return `${end.diff(start, 'days') + 1}`;
}

/** 处方周期进度：当前第几天 / 总天数（按 startDate~endDate，含起止日） */
export function getPrescriptionDayProgress(startDate?: string, endDate?: string) {
  if (!startDate?.trim() || !endDate?.trim()) return null;
  const start = moment(startDate).startOf('day');
  const end = moment(endDate).startOf('day');
  if (!start.isValid() || !end.isValid()) return null;

  const totalDays = end.diff(start, 'days') + 1;
  if (totalDays <= 0) return null;

  const today = moment().startOf('day');
  let currentDay = today.diff(start, 'days') + 1;
  if (currentDay < 1) currentDay = 0;
  if (currentDay > totalDays) currentDay = totalDays;

  return { currentDay, totalDays };
}

/** 日程页顶栏：年龄 | 诊断 | 处方名 | 自开始日起 */
export function formatScheduleTopInfoText(
  user?: UserBaseInfo | null,
  prescription?: Pick<InUseExPatientRule, 'diagnosticLabel' | 'prescriptionName' | 'startDate'> | null,
) {
  const birthMoment = moment(user?.birthDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
  const age = birthMoment.isValid() ? `${moment().diff(birthMoment, 'years')}岁` : '';
  const diagnosis = formatDiagnosticLabelText(prescription?.diagnosticLabel);
  const prescriptionName = prescription?.prescriptionName?.trim() || '';
  const start = prescription?.startDate?.trim();
  const startText = start
    ? `自${moment(start).isValid() ? moment(start).format('YYYY/MM/DD') : start}起`
    : '';
  return [age, diagnosis, prescriptionName, startText].filter(Boolean).join(' | ') || '--';
}

export function getPrescriptionProgressStatusText(progress?: number) {
  const value = normalizeProgress(progress);
  if (value < 20) return '刚刚开始';
  if (value < 40) return '持续进行';
  if (value <= 60) return '状态良好';
  if (value < 80) return '改善明显';
  return '接近达成';
}

export function getInUseStatusText(info?: InUseExPatientRule | null) {
  if (!info) return '--';
  if (info.status === 1) return '已暂停';
  if (info.status === 2) return '已结束';
  return getPrescriptionProgressStatusText(info.progress ?? info.progressInfo?.complateRatio);
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

function formatHistoryArchiveDateText(info: HistoryExPatientRule) {
  const start = info.startDate?.trim();
  const end = info.endDate?.trim();
  const formatDate = (value: string) => {
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY/MM/DD') : value;
  };

  if (!start && !end) return '--';
  const startText = start ? formatDate(start) : '--';
  const endText = end ? formatDate(end) : '--';
  return `${startText} - ${endText}`;
}

function formatHistoryDurationHours(sumExerciseDuration?: number | null) {
  if (sumExerciseDuration == null || Number.isNaN(Number(sumExerciseDuration))) return '--';
  const hours = Number(sumExerciseDuration) / 60;
  if (!Number.isFinite(hours)) return '--';
  const fixed = Number(hours.toFixed(1));
  return Number.isInteger(fixed) ? String(fixed) : String(fixed);
}

const HEALTH_GOAL_PROGRESS_FIELD_UNIT: Record<string, string> = {
  sbp: 'mmHg',
  dbp: 'mmHg',
  tc: 'mmol/L',
  tg: 'mmol/L',
  hdlC: 'mmol/L',
  ldlC: 'mmol/L',
  bloodGlucose: 'mmol/L',
  weight: 'kg',
  shoulderFlexion: '°',
  shoulderAbduction: '°',
  elbowFlexion: '°',
  hipFlexion: '°',
  kneeFlexion: '°',
  ankleDorsiflexion: '°',
  exImpRate: '%',
};

function resolveHealthGoalProgressFieldUnit(fieldKey?: string | null) {
  const key = fieldKey?.trim();
  if (!key) return '';
  return HEALTH_GOAL_PROGRESS_FIELD_UNIT[key] ?? '';
}

function formatHistoryMetricNumber(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (Number.isInteger(num)) return String(num);
  return String(Number(num.toFixed(2)));
}

/** 从 maxProcess 中取进度最大的分项 */
export function resolveMaxHealthGoalProgressField(
  maxProcess?: ExPatientRuleHealthGoalProgress['maxProcess'],
): ScheduleHistoryArchiveMaxProgress | null {
  const fields = (maxProcess?.fieldList ?? []).filter(Boolean);
  let best: ExPatientRuleHealthGoalProgressField | null = null;
  let bestProgress = Number.NEGATIVE_INFINITY;

  for (const field of fields) {
    if (field.progress == null || Number.isNaN(Number(field.progress))) continue;
    const progress = Number(field.progress);
    if (progress > bestProgress) {
      best = field;
      bestProgress = progress;
    }
  }

  if (!best) return null;

  const currentText = formatHistoryMetricNumber(best.current);
  if (!currentText) return null;

  const fieldName = best.fieldName?.trim() || maxProcess?.goalName?.trim() || '';
  const unit = resolveHealthGoalProgressFieldUnit(best.fieldKey);
  let label = fieldName;
  if (fieldName && unit && !fieldName.includes(unit)) {
    label = `${fieldName}(${unit})`;
  } else if (!fieldName && unit) {
    label = unit;
  }
  if (!label) return null;

  const baselineText = formatHistoryMetricNumber(best.baseline);
  const current = Number(best.current);
  const baseline = best.baseline != null ? Number(best.baseline) : null;
  let trend: 'up' | 'down' | null = null;
  if (baseline != null && Number.isFinite(baseline) && Number.isFinite(current) && current !== baseline) {
    const direction = best.direction;
    // direction: 1 需提高，-1 需降低；按目标方向判断进步/下降
    if (direction === -1) {
      trend = current < baseline ? 'up' : 'down';
    } else if (direction === 1) {
      trend = current > baseline ? 'up' : 'down';
    } else if (best.target != null && Number.isFinite(Number(best.target))) {
      const target = Number(best.target);
      const lowerBetter = target < baseline;
      trend = lowerBetter
        ? (current < baseline ? 'up' : 'down')
        : (current > baseline ? 'up' : 'down');
    } else {
      trend = current > baseline ? 'up' : 'down';
    }
  }

  return {
    label,
    currentText,
    baselineText,
    trend,
  };
}

export function toScheduleHistoryArchiveItem(
  info: HistoryExPatientRule,
  ruleStat?: ExMilestoneRuleStat | null,
  healthGoalProgress?: ExPatientRuleHealthGoalProgress | null,
): ScheduleHistoryArchiveItem {
  const id = info.exPatientRuleId != null && info.exPatientRuleId !== ''
    ? String(info.exPatientRuleId)
    : `${info.startDate ?? ''}-${info.endDate ?? ''}-${info.prescriptionName ?? ''}`;

  const totalLessons = ruleStat?.totalLessons != null && Number.isFinite(Number(ruleStat.totalLessons))
    ? Math.round(Number(ruleStat.totalLessons))
    : null;
  const durationHours = formatHistoryDurationHours(
    ruleStat?.exerciseDuration ?? info.progressInfo?.sumExerciseDuration,
  );

  const maxProgress = resolveMaxHealthGoalProgressField(healthGoalProgress?.maxProcess);
  const summary = info.completeSummary?.trim()
    || info.aiAnalysis?.summary?.trim()
    || '';

  return {
    id,
    title: info.prescriptionName?.trim() || '运动干预计划',
    status: info.status,
    statusLabel: info.status === 2 ? '已完成' : getHistoryStatusLabel(info.status),
    dateText: formatHistoryArchiveDateText(info),
    sessionCountText: totalLessons != null
      ? String(totalLessons)
      : (info.progressInfo?.complateNum != null && Number.isFinite(Number(info.progressInfo.complateNum))
        ? String(Math.round(Number(info.progressInfo.complateNum)))
        : '--'),
    durationHoursText: durationHours,
    maxProgress,
    summaryText: summary,
    isInProgress: info.status === 0,
    isDone: info.status === 2,
  };
}

export function sortHistoryPlans(items: HistoryExPatientRule[]) {
  return [...items].sort(
    (a, b) => moment(getHistorySortTime(b)).valueOf() - moment(getHistorySortTime(a)).valueOf(),
  );
}

const HISTORY_ARCHIVE_PREVIEW_SIZE = 5;

async function loadRuleStatForArchive(exPatientRuleId?: string | number | null) {
  if (exPatientRuleId == null || exPatientRuleId === '') return null;
  try {
    const res = await getExMilestoneRuleStat(exPatientRuleId);
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return apiResourceData<ExMilestoneRuleStat>(
      res as unknown as { code?: number; data?: ExMilestoneRuleStat },
    ) ?? null;
  } catch {
    return null;
  }
}

async function loadHealthGoalProgressForArchive(exPatientRuleId?: string | number | null) {
  if (exPatientRuleId == null || exPatientRuleId === '') return null;
  try {
    const res = await getExPatientRuleHealthGoalProgress(exPatientRuleId);
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    return apiResourceData<ExPatientRuleHealthGoalProgress>(
      res as unknown as { code?: number; data?: ExPatientRuleHealthGoalProgress },
    ) ?? null;
  } catch {
    return null;
  }
}

/** 日程页预览：进行中 + 已暂停 + 已结束 */
export async function loadScheduleHistoryArchivePreview(pageSize = HISTORY_ARCHIVE_PREVIEW_SIZE) {
  const [inProgressRes, pausedRes, endedRes] = await Promise.all([
    getHistoryExPatientRuleList({ status: 0, pageSize, pageNum: 1 }),
    getHistoryExPatientRuleList({ status: 1, pageSize, pageNum: 1 }),
    getHistoryExPatientRuleList({ status: 2, pageSize, pageNum: 1 }),
  ]);

  const plans = sortHistoryPlans([
    ...getResourceRows<HistoryExPatientRule>(inProgressRes),
    ...getResourceRows<HistoryExPatientRule>(pausedRes),
    ...getResourceRows<HistoryExPatientRule>(endedRes),
  ]).slice(0, pageSize);

  return Promise.all(
    plans.map(async plan => {
      const [ruleStat, healthGoalProgress] = await Promise.all([
        loadRuleStatForArchive(plan.exPatientRuleId),
        loadHealthGoalProgressForArchive(plan.exPatientRuleId),
      ]);
      return toScheduleHistoryArchiveItem(plan, ruleStat, healthGoalProgress);
    }),
  );
}

export type HistoryPlanFilter = 'all' | 'inProgress' | 'paused' | 'ended';

export const HISTORY_PLAN_FILTER_OPTIONS: { label: string; value: HistoryPlanFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'inProgress' },
  { label: '已暂停', value: 'paused' },
  { label: '已完成', value: 'ended' },
];

export async function fetchHistoryPlanPage(
  filter: HistoryPlanFilter,
  pageNum: number,
  pageSize: number,
): Promise<{ rows: HistoryExPatientRule[]; hasMore: boolean }> {
  if (filter === 'inProgress') {
    const res = await getHistoryExPatientRuleList({ status: 0, pageSize, pageNum });
    const rows = getResourceRows<HistoryExPatientRule>(res);
    const total = (res as unknown as HistoryListResult).total ?? 0;
    return { rows, hasMore: pageNum * pageSize < total };
  }

  if (filter === 'paused') {
    const res = await getHistoryExPatientRuleList({ status: 1, pageSize, pageNum });
    const rows = getResourceRows<HistoryExPatientRule>(res);
    const total = (res as unknown as HistoryListResult).total ?? 0;
    return { rows, hasMore: pageNum * pageSize < total };
  }

  if (filter === 'ended') {
    const res = await getHistoryExPatientRuleList({ status: 2, pageSize, pageNum });
    const rows = getResourceRows<HistoryExPatientRule>(res);
    const total = (res as unknown as HistoryListResult).total ?? 0;
    return { rows, hasMore: pageNum * pageSize < total };
  }

  const [inProgressRes, pausedRes, endedRes] = await Promise.all([
    getHistoryExPatientRuleList({ status: 0, pageSize, pageNum }),
    getHistoryExPatientRuleList({ status: 1, pageSize, pageNum }),
    getHistoryExPatientRuleList({ status: 2, pageSize, pageNum }),
  ]);
  const rows = sortHistoryPlans([
    ...getResourceRows<HistoryExPatientRule>(inProgressRes),
    ...getResourceRows<HistoryExPatientRule>(pausedRes),
    ...getResourceRows<HistoryExPatientRule>(endedRes),
  ]);
  const inProgressTotal = (inProgressRes as unknown as HistoryListResult).total ?? 0;
  const pausedTotal = (pausedRes as unknown as HistoryListResult).total ?? 0;
  const endedTotal = (endedRes as unknown as HistoryListResult).total ?? 0;
  return {
    rows,
    hasMore:
      pageNum * pageSize < inProgressTotal
      || pageNum * pageSize < pausedTotal
      || pageNum * pageSize < endedTotal,
  };
}

/** 历史计划列表页：分页 + ruleStat / healthGoalProgress 指标 */
export async function fetchHistoryArchivePage(
  filter: HistoryPlanFilter,
  pageNum: number,
  pageSize: number,
): Promise<{ rows: ScheduleHistoryArchiveItem[]; hasMore: boolean }> {
  const { rows, hasMore } = await fetchHistoryPlanPage(filter, pageNum, pageSize);
  const items = await Promise.all(
    rows.map(async plan => {
      const [ruleStat, healthGoalProgress] = await Promise.all([
        loadRuleStatForArchive(plan.exPatientRuleId),
        loadHealthGoalProgressForArchive(plan.exPatientRuleId),
      ]);
      return toScheduleHistoryArchiveItem(plan, ruleStat, healthGoalProgress);
    }),
  );
  return { rows: items, hasMore };
}

/** 里程碑「累计训练(小时)」展示 */
export function formatMilestoneHours(minutes?: number | null) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value <= 0) return '0';
  const hours = value / 60;
  if (Number.isInteger(hours)) return String(hours);
  return hours.toFixed(1).replace(/\.0$/, '');
}

/** 近 6 周柱状图时长标签，如 3.9h */
export function formatMilestoneWeekBarDuration(minutes?: number | null) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value <= 0) return '0h';
  const hours = value / 60;
  if (hours < 10) {
    const text = hours.toFixed(1).replace(/\.0$/, '');
    return `${text}h`;
  }
  return `${Math.round(hours)}h`;
}

/** 近 6 周柱高：相对本批最大时长 0-100 */
export function calcMilestoneWeekBarProgress(
  minutes: number | null | undefined,
  maxMinutes: number,
) {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  const max = Math.max(0, Math.round(Number(maxMinutes) || 0));
  if (max <= 0 || value <= 0) return 0;
  return normalizeProgress((value / max) * 100);
}

export type MilestoneWeekModuleRateItem = {
  key: string;
  title: string;
  progress: number;
  color: string;
};

function toOptionalProgress(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return normalizeProgress(value);
}

/** 分项完成率展示顺序：有氧 / 抗阻 / 平衡 / 拉伸（无数据也展示，进度为 0） */
export function buildMilestoneWeekModuleRates(week?: {
  cardioCompleteRate?: number | null;
  strengthCompleteRate?: number | null;
  flexibilityCompleteRate?: number | null;
  balanceCompleteRate?: number | null;
} | null): MilestoneWeekModuleRateItem[] {
  const candidates: Array<{
    key: string;
    title: string;
    raw?: number | null;
    color: string;
  }> = [
    { key: 'cardio', title: '有氧', raw: week?.cardioCompleteRate, color: '#6D925E' },
    { key: 'strength', title: '抗阻', raw: week?.strengthCompleteRate, color: '#72A1C5' },
    { key: 'balance', title: '平衡', raw: week?.balanceCompleteRate, color: '#0951AE' },
    { key: 'flexibility', title: '拉伸', raw: week?.flexibilityCompleteRate, color: '#EE9C44' },
  ];

  return candidates.map(item => ({
    key: item.key,
    title: item.title,
    progress: toOptionalProgress(item.raw) ?? 0,
    color: item.color,
  }));
}

/** 分项整体完成率（仅对有数据的模块取平均；全无数据为 0） */
export function calcMilestoneWeekOverallRate(
  week?: {
    cardioCompleteRate?: number | null;
    strengthCompleteRate?: number | null;
    flexibilityCompleteRate?: number | null;
    balanceCompleteRate?: number | null;
  } | null,
) {
  const rates = [
    toOptionalProgress(week?.cardioCompleteRate),
    toOptionalProgress(week?.strengthCompleteRate),
    toOptionalProgress(week?.balanceCompleteRate),
    toOptionalProgress(week?.flexibilityCompleteRate),
  ].filter((item): item is number => item != null);
  if (rates.length === 0) return 0;
  return normalizeProgress(rates.reduce((sum, item) => sum + item, 0) / rates.length);
}

/** 近 6 周底部总结文案：优先接口 summary */
export function resolveMilestoneWeekSummaryText(
  week?: { summary?: string | null } | null,
  options?: {
    weekIndex?: number;
    overallRate?: number;
  },
) {
  const summary = week?.summary?.trim();
  if (summary) return summary;
  const weekNo = (options?.weekIndex ?? 0) + 1;
  const rate = options?.overallRate ?? 0;
  return `点击上方周次可查看分项；当前 W${weekNo} 整体完成率 ${rate}%。`;
}
