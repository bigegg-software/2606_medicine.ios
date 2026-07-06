import moment from 'moment';
import {
  DICT_TYPES,
  EXERCISE_CHILD_DICT_BY_TYPE,
  buildDictLabelMap,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  getDayTypeListDetailByCustomerLocalDate,
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

export type HealthGoalDisplayItem = {
  key: string;
  title: string;
  subtitle: string;
  statusText: string;
  icon: number;
  backImage: number;
  assessmentType: string;
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
  flexibility: '#EE9C44',
  balance: '#0951AE',
};

export type ExercisePrescriptionMetricItem = {
  key: string;
  value: number;
  label: string;
  color: string;
};

export function buildExercisePrescriptionMetrics(
  ruleRatioList?: ExPatientRuleRatio[],
  dictMaps?: ScheduleDictMaps,
  progressMap?: Record<string, number>,
): ExercisePrescriptionMetricItem[] {
  return (ruleRatioList ?? []).map((rule, index) => {
    const task = toTodayTaskItem(rule, index, dictMaps, progressMap);
    const typeKey = rule.exerciseType?.trim() ?? '';
    return {
      key: task.key,
      value: task.progress,
      label: task.title,
      color: EXERCISE_TYPE_COLORS[typeKey] ?? '#6D925E',
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

function formatHealthGoalStatusByProgress(progress: number) {
  if (progress >= 80) return '接近目标达成';
  if (progress >= 60) return '改善明显';
  if (progress >= 40) return '改善情况良好';
  if (progress >= 20) return '持续改善中';
  return '已开始改善';
}

function getHealthGoalStatusText(target: HealthGoalTarget, progressInfo?: ProgressInfo) {
  const state = resolveHealthGoalProgressState(target, progressInfo);
  if (state.kind === 'no_data') return '等待评估';
  if (state.kind === 'declined') return '需关注';
  return formatHealthGoalStatusByProgress(state.value);
}

function getHealthGoalIcon(target: HealthGoalTarget) {
  const assessmentType = target.healthGoalVo?.assessmentType?.trim();
  if (assessmentType && HEALTH_GOAL_ICONS[assessmentType]) {
    return HEALTH_GOAL_ICONS[assessmentType];
  }
  return HEALTH_GOAL_ICONS.health_indicator_type;
}

export async function enrichHealthGoalTargets(targets?: HealthGoalTarget[]) {
  if (!targets?.length) return [];

  return Promise.all(
    targets.map(async target => {
      if (target.healthGoalVo?.goalName?.trim() || target.healthGoalId == null) {
        return target;
      }

      try {
        const res = await getHealthGoalInfo(target.healthGoalId);
        if (!isResourceApiOk(res)) return target;
        const info = apiResourceData<HealthGoalInfo>(res as any);
        return info ? { ...target, healthGoalVo: info } : target;
      } catch {
        return target;
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
  };
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

export type HistoryPlanFilter = 'all' | 'paused' | 'ended';

export const HISTORY_PLAN_FILTER_OPTIONS: { label: string; value: HistoryPlanFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '已暂停', value: 'paused' },
  { label: '已结束', value: 'ended' },
];

export async function fetchHistoryPlanPage(
  filter: HistoryPlanFilter,
  pageNum: number,
  pageSize: number,
): Promise<{ rows: HistoryExPatientRule[]; hasMore: boolean }> {
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

  const [pausedRes, endedRes] = await Promise.all([
    getHistoryExPatientRuleList({ status: 1, pageSize, pageNum }),
    getHistoryExPatientRuleList({ status: 2, pageSize, pageNum }),
  ]);
  const rows = sortHistoryPlans([
    ...getResourceRows<HistoryExPatientRule>(pausedRes),
    ...getResourceRows<HistoryExPatientRule>(endedRes),
  ]);
  const pausedTotal = (pausedRes as unknown as HistoryListResult).total ?? 0;
  const endedTotal = (endedRes as unknown as HistoryListResult).total ?? 0;
  return {
    rows,
    hasMore: pageNum * pageSize < pausedTotal || pageNum * pageSize < endedTotal,
  };
}
