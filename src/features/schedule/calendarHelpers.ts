import moment, { type Moment } from 'moment';
import {
  getDayTypeListDetailByCustomerLocalDate,
  getInUseExPatientRuleInfo,
  type DayTypeDetailItem,
  type InUseExPatientRule,
} from '@/api/schedule';
import { getMealDetailByMealId, getMealListByDate, type MealRecordItem } from '@/api/meal';
import {
  getIndexMedicationPlanGroupByTime,
  type IndexMedicationPlanGroupItem,
  type IndexMedicationPlanItem,
} from '@/api/medicationPlan';
import {
  getDailyActivityListByDate,
  getDailyLiveListByDate,
  getDailyRecordStatusListByDateRange,
  type DailyActivityItem,
  type DailyLiveItem,
  type DailyRecordStatusItem,
} from '@/api/dailyRecordStatus';
import {
  formatExerciseChildTypes,
  getExerciseTypeLabel,
} from '@/src/features/home/exercise/exerciseHelpers';
import {
  formatMedicationDoseText,
  loadMedicationDictMaps,
  type MedicationDictMaps,
} from '@/src/features/profile/medication/medicationHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  getExerciseChildTypeLabel,
  loadScheduleDictMaps,
  type ScheduleDictMaps,
} from './scheduleHelpers';

export type CalendarTimelineItem = {
  key: string;
  time: string;
  title: string;
  desc: string;
  kind: 'diet' | 'ex' | 'drug' | 'activity' | 'live';
  activityId?: string;
  exerciseTypeLabel?: string;
  sortValue: number;
  period: 'morning' | 'afternoon' | 'exercise';
};

const MEAL_CATEGORY_LABELS: Record<number, string> = {
  1: '早餐',
  2: '午餐',
  3: '晚餐',
  4: '加餐',
};

const MEAL_CATEGORY_DEFAULT_MINUTES: Record<number, number> = {
  1: 8 * 60,
  2: 12 * 60,
  3: 18 * 60,
  4: 15 * 60,
};

export function getCalendarGridDateRange(month: Moment) {
  const start = moment(month).startOf('month').startOf('week');
  const end = moment(month).endOf('month').endOf('week');
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}

export function hasDailyRecord(status?: DailyRecordStatusItem | null) {
  if (!status) return false;
  return Boolean(status.isDiet || status.isEx || status.isDrug || status.isActivity || status.isLive);
}

function parseDateTimeSortValue(value?: string) {
  const parsed = moment(value);
  if (!parsed.isValid()) return 0;
  return parsed.hours() * 60 + parsed.minutes();
}

function parseTimeStrSortValue(value?: string) {
  const parsed = moment(value, ['HH:mm', 'H:mm'], true);
  if (!parsed.isValid()) return 0;
  return parsed.hours() * 60 + parsed.minutes();
}

function formatTimelineTime(value?: string) {
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('H:mm') : '—';
}

function formatPlanTime(value?: string) {
  const parsed = moment(value, ['HH:mm', 'H:mm'], true);
  return parsed.isValid() ? parsed.format('HH:mm') : value?.trim() || '—';
}

function resolvePeriod(sortValue: number) {
  const hour = Math.floor(sortValue / 60);
  return hour < 12 ? 'morning' : 'afternoon';
}

function formatMedicationActionLabel(action?: number | null) {
  if (action === 1) return '已服用';
  if (action === 0) return '已忽略';
  return '未服用';
}

function formatMealCalorieText(calorie?: number) {
  if (calorie == null || Number.isNaN(Number(calorie))) return '已记录用餐';
  return `${Math.round(Number(calorie))}kcal`;
}

function mapActivityTimelineItem(item: DailyActivityItem, index: number): CalendarTimelineItem {
  const sortValue = parseDateTimeSortValue(item.activityStartTime);
  const location = item.activityLocation?.trim();
  const remark = item.activityRemark?.trim();
  return {
    key: `activity-${item.activityId ?? index}`,
    time: formatTimelineTime(item.activityStartTime),
    title: item.activityName?.trim() || '社区活动',
    desc: location || remark || item.statusName?.trim() || '社区活动',
    kind: 'activity',
    activityId: item.activityId != null ? String(item.activityId) : undefined,
    sortValue: sortValue || index + 100,
    period: resolvePeriod(sortValue || 540),
  };
}

function mapLiveTimelineItem(item: DailyLiveItem, index: number): CalendarTimelineItem {
  const sortValue = parseDateTimeSortValue(item.liveStartTime);
  const anchor = item.anchorName?.trim();
  const intro = item.liveIntro?.trim();
  return {
    key: `live-${item.liveId ?? index}`,
    time: formatTimelineTime(item.liveStartTime),
    title: item.title?.trim() || '直播',
    desc: anchor ? `${anchor}${intro ? ` · ${intro}` : ''}` : intro || item.statusName?.trim() || '直播',
    kind: 'live',
    sortValue: sortValue || index + 200,
    period: resolvePeriod(sortValue || 540),
  };
}

function formatExerciseDurationText(minutes?: number | null) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '';
  return `${Math.round(Number(minutes))}分钟`;
}

function mapDayTypeExerciseTimelineItems(
  items: DayTypeDetailItem[] | undefined,
  dictMaps?: ScheduleDictMaps,
): CalendarTimelineItem[] {
  const result: CalendarTimelineItem[] = [];
  let sortOffset = 0;

  for (const item of items ?? []) {
    const typeKey = item.exerciseType?.trim() ?? '';
    const typeLabel = getExerciseTypeLabel(typeKey, dictMaps);
    const children = (item.childTypeList ?? []).filter(
      child => child.exerciseChildType?.trim() || child.exerciseDuration != null,
    );

    if (children.length > 0) {
      children.forEach((child, childIndex) => {
        const childLabel =
          getExerciseChildTypeLabel(child.exerciseChildType, typeKey, dictMaps)
          || child.exerciseChildType?.trim()
          || typeLabel;
        const durationText = formatExerciseDurationText(child.exerciseDuration);

        result.push({
          key: `ex-${item.customerLocalDate ?? ''}-${typeKey}-${childIndex}`,
          time: durationText || '0分钟',
          title: durationText || '0分钟',
          desc: childLabel,
          exerciseTypeLabel: typeLabel,
          kind: 'ex',
          sortValue: 540 + sortOffset * 15,
          period: 'exercise',
        });
        sortOffset += 1;
      });
      continue;
    }

    const doneMinutes = item.typeSumExerciseDuration ?? 0;
    const childTypes = formatExerciseChildTypes(item.exerciseChildType, typeKey, dictMaps);

    result.push({
      key: `ex-${item.customerLocalDate ?? ''}-${typeKey}`,
      time: formatExerciseDurationText(doneMinutes) || '0分钟',
      title: formatExerciseDurationText(doneMinutes) || '0分钟',
      desc: childTypes !== '--' ? childTypes : '运动训练',
      exerciseTypeLabel: typeLabel,
      kind: 'ex',
      sortValue: 540 + sortOffset * 15,
      period: 'exercise',
    });
    sortOffset += 1;
  }

  return result;
}

async function resolveInUseExPatientRuleId() {
  try {
    const res = await getInUseExPatientRuleInfo();
    if (!isResourceApiOk(res)) return undefined;
    const rule = apiResourceData<InUseExPatientRule>(res as any);
    return rule?.exPatientRuleId != null ? String(rule.exPatientRuleId) : undefined;
  } catch {
    return undefined;
  }
}

function mapMedicationTimelineItems(
  groups: IndexMedicationPlanGroupItem[] | undefined,
  dictMaps?: MedicationDictMaps,
): CalendarTimelineItem[] {
  return (groups ?? []).flatMap((group, groupIndex) =>
    (group.list ?? []).map((item: IndexMedicationPlanItem, itemIndex) => {
      const plan = item.healthMedicationPlan;
      const medicationPlanId = plan?.medicationPlanId;
      const time = formatPlanTime(item.medicationPlanTime ?? group.medicationPlanTime ?? plan?.timeList?.[0]);
      const sortValue = parseTimeStrSortValue(time) || (groupIndex + 1) * 60 + itemIndex;
      const doseText = formatMedicationDoseText(plan, dictMaps);
      const actionText = formatMedicationActionLabel(item.action);

      return {
        key: `drug-${medicationPlanId ?? groupIndex}-${itemIndex}`,
        time,
        title: plan?.name?.trim() || '用药',
        desc: [doseText !== '--' ? doseText : '', actionText].filter(Boolean).join(' · '),
        kind: 'drug',
        sortValue,
        period: resolvePeriod(sortValue),
      };
    }),
  );
}

function mapMealTimelineItem(
  meal: MealRecordItem,
  index: number,
  foodNames?: string,
  timeStr?: string,
): CalendarTimelineItem {
  const category = meal.mealCategory ?? 1;
  const sortValue =
    parseTimeStrSortValue(timeStr)
    || MEAL_CATEGORY_DEFAULT_MINUTES[category]
    || (index + 1) * 60;

  return {
    key: `diet-${meal.mealId ?? index}`,
    time: timeStr ? formatPlanTime(timeStr) : '—',
    title: MEAL_CATEGORY_LABELS[category] ?? '用餐',
    desc: foodNames?.trim() || formatMealCalorieText(meal.calorie),
    kind: 'diet',
    sortValue,
    period: resolvePeriod(sortValue),
  };
}

async function loadExerciseTimelineItems(
  customerLocalDate: string,
  exPatientRuleId: string,
  dictMaps?: ScheduleDictMaps,
): Promise<CalendarTimelineItem[]> {
  try {
    const res = await getDayTypeListDetailByCustomerLocalDate({
      customerLocalDate,
      exPatientRuleId,
    });
    if (!isResourceApiOk(res)) return [];

    const list = apiResourceData<DayTypeDetailItem[]>(res as any) ?? [];
    return mapDayTypeExerciseTimelineItems(list, dictMaps);
  } catch {
    return [];
  }
}

async function loadMedicationTimelineItems(
  customerLocalDate: string,
  dictMaps?: MedicationDictMaps,
): Promise<CalendarTimelineItem[]> {
  try {
    const res = await getIndexMedicationPlanGroupByTime({ customerLocalDate });
    if (!isResourceApiOk(res)) return [];
    return mapMedicationTimelineItems(
      apiResourceData<IndexMedicationPlanGroupItem[]>(res as any),
      dictMaps,
    );
  } catch {
    return [];
  }
}

async function loadDietTimelineItems(customerLocalDate: string): Promise<CalendarTimelineItem[]> {
  try {
    const res = await getMealListByDate({ customerLocalDate });
    if (!isResourceApiOk(res)) return [];

    const meals = apiResourceData<MealRecordItem[]>(res as any) ?? [];
    if (meals.length === 0) return [];

    const details = await Promise.all(
      meals.map(async meal => {
        if (meal.mealId == null || meal.mealId === '') return null;
        try {
          const detailRes = await getMealDetailByMealId(String(meal.mealId));
          return isResourceApiOk(detailRes) ? apiResourceData(detailRes as any) : null;
        } catch {
          return null;
        }
      }),
    );

    return meals.map((meal, index) => {
      const detail = details[index];
      const foodNames = detail?.mealDetailList
        ?.map(item => item.mealName?.trim())
        .filter(Boolean)
        .join('、');
      const timeStr = detail?.mealDetailList?.find(item => item.timeStr?.trim())?.timeStr
        ?? detail?.mainInfo?.updateTime;

      return mapMealTimelineItem(meal, index, foodNames, timeStr);
    });
  } catch {
    return [];
  }
}

export async function loadDailyRecordStatusMap(month: Moment) {
  const { startDate, endDate } = getCalendarGridDateRange(month);

  try {
    const res = await getDailyRecordStatusListByDateRange({ startDate, endDate });
    if (!isResourceApiOk(res)) return new Map<string, DailyRecordStatusItem>();

    const list = apiResourceData<DailyRecordStatusItem[]>(res as any) ?? [];
    const map = new Map<string, DailyRecordStatusItem>();
    for (const item of list) {
      const dateKey = item.customerLocalDate?.trim();
      if (dateKey) map.set(dateKey, item);
    }
    return map;
  } catch {
    return new Map<string, DailyRecordStatusItem>();
  }
}

export async function loadCalendarDayTimelineItems(
  customerLocalDate: string,
  status?: DailyRecordStatusItem | null,
) {
  try {
    const detailTasks: Promise<CalendarTimelineItem[]>[] = [
      getDailyActivityListByDate({ customerLocalDate })
        .then(res => (isResourceApiOk(res)
          ? (apiResourceData<DailyActivityItem[]>(res as any) ?? []).map(mapActivityTimelineItem)
          : [])),
      getDailyLiveListByDate({ customerLocalDate })
        .then(res => (isResourceApiOk(res)
          ? (apiResourceData<DailyLiveItem[]>(res as any) ?? []).map(mapLiveTimelineItem)
          : [])),
    ];

    if (status?.isEx) {
      detailTasks.push(
        (async () => {
          const [dictMaps, exPatientRuleId] = await Promise.all([
            loadScheduleDictMaps(),
            resolveInUseExPatientRuleId(),
          ]);
          if (!exPatientRuleId) return [];
          return loadExerciseTimelineItems(customerLocalDate, exPatientRuleId, dictMaps);
        })(),
      );
    }

    if (status?.isDrug) {
      detailTasks.push(
        loadMedicationDictMaps()
          .then(dictMaps => loadMedicationTimelineItems(customerLocalDate, dictMaps)),
      );
    }

    if (status?.isDiet) {
      detailTasks.push(loadDietTimelineItems(customerLocalDate));
    }

    const groups = await Promise.all(detailTasks);
    return groups.flat().sort((left, right) => left.sortValue - right.sortValue);
  } catch {
    return [];
  }
}

export function groupTimelineItems(items: CalendarTimelineItem[]) {
  const exercise = items.filter(item => item.period === 'exercise' || item.kind === 'ex');
  const scheduled = items.filter(item => item.period !== 'exercise' && item.kind !== 'ex');
  const morning = scheduled.filter(item => item.period === 'morning');
  const afternoon = scheduled.filter(item => item.period === 'afternoon');
  return { exercise, morning, afternoon };
}
