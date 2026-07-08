import moment, { type Moment } from 'moment';
import {
  getDayTypeListDetailByCustomerLocalDate,
  getInUseExPatientRuleInfo,
  type DayTypeDetailItem,
  type InUseExPatientRule,
} from '@/api/schedule';
import { getMealDetailByMealId, getMealListByDate, type MealRecordDetail, type MealRecordItem } from '@/api/meal';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
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
  resolveDictLabel,
  type MedicationDictMaps,
  type MedicationPlanGroupView,
} from '@/src/features/profile/medication/medicationHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildMealCardsFromRuleForDate,
  type MealCardData,
} from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  getFoodRecordsByCategory,
  MEAL_CATEGORY_BY_KEY,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import type { ImageSourcePropType } from 'react-native';
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
  liveId?: string;
  exerciseTypeLabel?: string;
  exerciseGoalText?: string;
  exerciseProgress?: number;
  exerciseIcon?: number;
  exerciseTaskIndex?: number;
  exerciseType?: string;
  exerciseChildType?: string;
  strengthLevel?: string;
  sortValue: number;
  period: 'morning' | 'afternoon' | 'exercise';
  medicationPlanId?: string;
  medicationPlanTime?: string;
  canCheckIn?: boolean;
  taken?: boolean;
  eventBasedLabel?: string;
  mealIsRecommended?: boolean;
  mealFoods?: string[];
  mealCalories?: number;
  mealIcon?: ImageSourcePropType;
  mealTimeWindow?: string;
  mealCategory?: number;
  mealDetailId?: string;
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


const MEAL_CATEGORY_KEY_BY_NUMBER: Record<number, string> = {
  1: 'breakfast',
  2: 'lunch',
  3: 'dinner',
  4: 'snack',
};

function getMealCardMetaKey(mealCard: MealCardData) {
  return mealCard.key.split('-')[0] ?? '';
}

function parseMealWindowStart(timeWindow?: string) {
  const start = timeWindow?.split('-')[0]?.trim();
  return start ? formatPlanTime(start) : '—';
}

function mealWindowToSortValue(timeWindow?: string, fallback = 8 * 60) {
  const start = timeWindow?.split('-')[0]?.trim();
  return parseTimeStrSortValue(start) || fallback;
}

function sumRecordCalories(records: MealDetailItem[]) {
  return records.reduce((sum, item) => sum + Math.round(Number(item.calorie) || 0), 0);
}

function mapRecommendedMealTimelineItem(
  mealCard: MealCardData,
  index: number,
): CalendarTimelineItem {
  const metaKey = getMealCardMetaKey(mealCard);
  const category = MEAL_CATEGORY_BY_KEY[metaKey] ?? 1;
  const sortValue = mealWindowToSortValue(mealCard.time, MEAL_CATEGORY_DEFAULT_MINUTES[category]);

  return {
    key: `diet-suggest-${mealCard.key}-${index}`,
    time: parseMealWindowStart(mealCard.time),
    title: mealCard.title,
    desc: mealCard.foods.length ? mealCard.foods.join('、') : '暂无推荐',
    kind: 'diet',
    sortValue,
    period: resolvePeriod(sortValue),
    mealIsRecommended: true,
    mealFoods: mealCard.foods,
    mealCalories: mealCard.calories,
    mealIcon: mealCard.icon,
    mealTimeWindow: mealCard.time,
    mealCategory: category,
  };
}

function mapRecordedMealTimelineItem(params: {
  mealCard: MealCardData;
  records: MealDetailItem[];
  index: number;
}): CalendarTimelineItem {
  const { mealCard, records, index } = params;
  const metaKey = getMealCardMetaKey(mealCard);
  const category = MEAL_CATEGORY_BY_KEY[metaKey] ?? records[0]?.mealCategory ?? 1;
  const foods = records.map(item => item.mealName?.trim()).filter(Boolean) as string[];
  const calories = sumRecordCalories(records);
  const recordTime = records.find(item => item.timeStr?.trim())?.timeStr;
  const sortValue = recordTime
    ? parseTimeStrSortValue(formatPlanTime(recordTime))
    : mealWindowToSortValue(mealCard.time, MEAL_CATEGORY_DEFAULT_MINUTES[category]);
  const firstDetailId = records.find(item => item.mealDetailId != null)?.mealDetailId;

  return {
    key: `diet-record-${metaKey}-${index}`,
    time: recordTime ? formatPlanTime(recordTime) : parseMealWindowStart(mealCard.time),
    title: mealCard.title,
    desc: foods.length ? foods.join('、') : '已记录用餐',
    kind: 'diet',
    sortValue: sortValue || MEAL_CATEGORY_DEFAULT_MINUTES[category],
    period: resolvePeriod(sortValue || MEAL_CATEGORY_DEFAULT_MINUTES[category]),
    mealIsRecommended: false,
    mealFoods: foods,
    mealCalories: calories,
    mealIcon: mealCard.icon,
    mealTimeWindow: mealCard.time,
    mealCategory: category,
    mealDetailId: firstDetailId != null ? String(firstDetailId) : undefined,
  };
}

function mapRecordedMealTimelineItemWithoutCard(
  category: number,
  records: MealDetailItem[],
  index: number,
): CalendarTimelineItem {
  const foods = records.map(item => item.mealName?.trim()).filter(Boolean) as string[];
  const calories = sumRecordCalories(records);
  const recordTime = records.find(item => item.timeStr?.trim())?.timeStr;
  const sortValue = recordTime
    ? parseTimeStrSortValue(formatPlanTime(recordTime))
    : MEAL_CATEGORY_DEFAULT_MINUTES[category] ?? (index + 1) * 60;
  const firstDetailId = records.find(item => item.mealDetailId != null)?.mealDetailId;

  return {
    key: `diet-record-${category}-${index}`,
    time: recordTime ? formatPlanTime(recordTime) : '—',
    title: MEAL_CATEGORY_LABELS[category] ?? '用餐',
    desc: foods.length ? foods.join('、') : '已记录用餐',
    kind: 'diet',
    sortValue,
    period: resolvePeriod(sortValue),
    mealIsRecommended: false,
    mealFoods: foods,
    mealCalories: calories,
    mealCategory: category,
    mealDetailId: firstDetailId != null ? String(firstDetailId) : undefined,
  };
}

async function loadMealDetailListForDate(customerLocalDate: string): Promise<MealDetailItem[]> {
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
  if (isToday) {
    try {
      const res = await getTodayMealDetailList();
      if (!isResourceApiOk(res as unknown as { code?: number })) return [];
      return apiResourceData<MealDetailItem[]>(res as unknown as { code?: number; data?: MealDetailItem[] }) ?? [];
    } catch {
      return [];
    }
  }

  try {
    const res = await getMealListByDate({ customerLocalDate });
    if (!isResourceApiOk(res)) return [];

    const meals = (apiResourceData<MealRecordItem[]>(
      res as unknown as { code?: number; data?: MealRecordItem[] },
    ) ?? [])
      .filter(isMealCategoryRecord)
      .sort((left, right) => (left.mealCategory ?? 0) - (right.mealCategory ?? 0));
    if (meals.length === 0) return [];

    const details = await Promise.all(
      meals.map(async meal => {
        if (meal.mealId == null || meal.mealId === '') return null;
        try {
          const detailRes = await getMealDetailByMealId(String(meal.mealId));
          if (!isResourceApiOk(detailRes)) return null;
          return apiResourceData<MealRecordDetail>(
            detailRes as unknown as { code?: number; data?: MealRecordDetail },
          );
        } catch {
          return null;
        }
      }),
    );

    return details.flatMap(detail => detail?.mealDetailList ?? []);
  } catch {
    return [];
  }
}

function isMealCategoryRecord(meal: MealRecordItem) {
  const category = meal.mealCategory ?? 0;
  return category >= 1 && category <= 4;
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
    liveId: item.liveId != null ? String(item.liveId) : undefined,
    sortValue: sortValue || index + 200,
    period: resolvePeriod(sortValue || 540),
  };
}

function formatExerciseDurationText(minutes?: number | null) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '';
  return `${Math.round(Number(minutes))}分钟`;
}

function formatExerciseGoalText(doneMinutes?: number, targetMinutes?: number) {
  const target = targetMinutes ?? 0;
  if (target <= 0) return '';
  const done = doneMinutes ?? 0;
  return `${Math.round(done)}/${Math.round(target)}分钟`;
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

    const doneMinutes = item.typeSumExerciseDuration ?? 0;
    const exerciseGoalText = formatExerciseGoalText(doneMinutes, item.typeNeedExerciseDuration);

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
          exerciseGoalText: childIndex === 0 ? exerciseGoalText : undefined,
          exerciseType: typeKey,
          kind: 'ex',
          sortValue: 540 + sortOffset * 15,
          period: 'exercise',
        });
        sortOffset += 1;
      });
      continue;
    }

    const childTypes = formatExerciseChildTypes(item.exerciseChildType, typeKey, dictMaps);

    result.push({
      key: `ex-${item.customerLocalDate ?? ''}-${typeKey}`,
      time: formatExerciseDurationText(doneMinutes) || '0分钟',
      title: formatExerciseDurationText(doneMinutes) || '0分钟',
      desc: childTypes !== '--' ? childTypes : '运动训练',
      exerciseTypeLabel: typeLabel,
      exerciseGoalText,
      exerciseType: typeKey,
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

function formatMedicationEventLabel(label?: string) {
  const text = label?.trim();
  if (!text || text === '无') return '';
  return text;
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
      const eventBasedLabel = formatMedicationEventLabel(
        resolveDictLabel(dictMaps?.eventBased ?? {}, plan?.eventBased),
      );

      return {
        key: `drug-${medicationPlanId ?? groupIndex}-${itemIndex}`,
        time,
        title: plan?.name?.trim() || '用药',
        desc: doseText !== '--' ? doseText : '',
        kind: 'drug',
        sortValue,
        period: resolvePeriod(sortValue),
        taken: item.action === 1,
        eventBasedLabel,
      };
    }),
  );
}

export function mapTodayMedicationGroupsToTimelineItems(
  groups: MedicationPlanGroupView[],
): CalendarTimelineItem[] {
  return groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => {
      const sortValue =
        parseTimeStrSortValue(item.medicationPlanTime) || (groupIndex + 1) * 60 + itemIndex;

      return {
        key: item.key,
        time: item.medicationPlanTime,
        title: item.name,
        desc: item.doseText !== '--' ? item.doseText : '',
        kind: 'drug',
        sortValue,
        period: resolvePeriod(sortValue),
        medicationPlanId: item.medicationPlanId,
        medicationPlanTime: item.medicationPlanTime,
        canCheckIn: item.canCheckIn,
        taken: item.taken,
        eventBasedLabel: formatMedicationEventLabel(item.eventBasedLabel),
      };
    }),
  );
}

function mapMealTimelineItem(
  mealCard: MealCardData,
  records: MealDetailItem[],
  index: number,
  showRecommendation: boolean,
): CalendarTimelineItem | null {
  if (records.length > 0) {
    return mapRecordedMealTimelineItem({ mealCard, records, index });
  }
  if (showRecommendation) {
    return mapRecommendedMealTimelineItem(mealCard, index);
  }
  return null;
}

async function loadDietTimelineItems(customerLocalDate: string): Promise<CalendarTimelineItem[]> {
  try {
    const [ruleRes, mealDetailList] = await Promise.all([
      getInUseDietPatientRuleInfo(),
      loadMealDetailListForDate(customerLocalDate),
    ]);

    const dietRule = apiResourceData<DietPatientRuleInfo>(
      ruleRes as { code?: number; data?: DietPatientRuleInfo },
    );
    const recommendedCards = buildMealCardsFromRuleForDate(dietRule?.mealList, customerLocalDate);
    const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
    const items: CalendarTimelineItem[] = [];

    if (recommendedCards.length > 0) {
      const coveredCategories = new Set<number>();
      recommendedCards.forEach((mealCard, index) => {
        const metaKey = getMealCardMetaKey(mealCard);
        const category = MEAL_CATEGORY_BY_KEY[metaKey];
        if (category != null) coveredCategories.add(category);
        const records = getFoodRecordsByCategory(mealDetailList, metaKey);
        const item = mapMealTimelineItem(mealCard, records, index, isToday);
        if (item) items.push(item);
      });

      Object.entries(MEAL_CATEGORY_KEY_BY_NUMBER).forEach(([categoryText, metaKey]) => {
        const category = Number(categoryText);
        if (coveredCategories.has(category)) return;
        const records = getFoodRecordsByCategory(mealDetailList, metaKey);
        if (records.length === 0) return;
        items.push(mapRecordedMealTimelineItemWithoutCard(category, records, category));
      });

      return items.sort((left, right) => left.sortValue - right.sortValue);
    }

    if (mealDetailList.length === 0) return items;

    const grouped = new Map<number, MealDetailItem[]>();
    mealDetailList
      .filter(item => item.isWater !== 1 && item.mealCategory != null)
      .forEach(item => {
        const category = item.mealCategory!;
        const list = grouped.get(category) ?? [];
        list.push(item);
        grouped.set(category, list);
      });

    const fallbackItems = Array.from(grouped.entries())
      .sort(([left], [right]) => left - right)
      .map(([category, records], index) => mapRecordedMealTimelineItemWithoutCard(category, records, index));

    return [...items, ...fallbackItems].sort((left, right) => left.sortValue - right.sortValue);
  } catch {
    return [];
  }
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
    let items = mapDayTypeExerciseTimelineItems(list, dictMaps);

    if (customerLocalDate === moment().format('YYYY-MM-DD')) {
      try {
        const ruleRes = await getInUseExPatientRuleInfo();
        if (isResourceApiOk(ruleRes as { code?: number })) {
          const prescription = apiResourceData<InUseExPatientRule>(ruleRes as { code?: number; data?: InUseExPatientRule });
          const ratioList = prescription?.ruleRatioList ?? [];
          items = items.map(item => {
            const typeKey = item.exerciseType?.trim();
            if (!typeKey) return item;
            const taskIndex = ratioList.findIndex(
              rule => rule.exerciseType?.trim() === typeKey,
            );
            if (taskIndex < 0) return item;
            const rule = ratioList[taskIndex];
            return {
              ...item,
              exerciseType: rule.exerciseType,
              exerciseChildType: rule.exerciseChildType,
              strengthLevel: rule.strengthLevel,
              exerciseTaskIndex: taskIndex,
            };
          });
        }
      } catch {
        // keep base items
      }
    }

    return items;
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
      loadDietTimelineItems(customerLocalDate),
    ];

    const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
    if (isToday || status?.isEx) {
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

    if (status?.isDrug && customerLocalDate !== moment().format('YYYY-MM-DD')) {
      detailTasks.push(
        loadMedicationDictMaps()
          .then(dictMaps => loadMedicationTimelineItems(customerLocalDate, dictMaps)),
      );
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
