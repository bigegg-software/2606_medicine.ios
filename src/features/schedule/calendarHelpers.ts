import {
  getInUseDietPatientRuleInfo,
  type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import moment, { type Moment } from 'moment';
import {
  type DayTypeDetailItem,
  type InUseExPatientRule,
} from '@/api/schedule';
import { getMealDetailByMealId, getMealListByDate, type MealRecordDetail, type MealRecordItem } from '@/api/meal';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import {
  getMedicationRecordAll,
  type MedicationRecordDayGroup,
  type MedicationRecordItem,
} from '@/api/medicationRecord';
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
} from '@/src/features/exercise/utils/exerciseHelpers';
import {
  formatMedicationDoseText,
  getMedicationPlanTypeLabel,
  loadMedicationDictMaps,
  resolveDictLabel,
  type MedicationDictMaps,
  type MedicationPlanGroupView,
} from '@/src/features/profile/medication/medicationHelpers';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildDictLabelMap,
  DICT_TYPES,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import {
  buildMealCardsFromRuleForDate,
  getDietRuleSummary,
  type MealCardData,
} from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  getFoodRecordsByCategory,
  MEAL_CATEGORY_BY_KEY,
  resolveMainMealsRecordStatus,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import type { ImageSourcePropType } from 'react-native';
import {
  getExerciseChildTypeLabel,
  loadScheduleDictMaps,
  type ScheduleDictMaps,
} from './scheduleHelpers';

/** 日程日历最早可选月份 */
export const SCHEDULE_CALENDAR_MIN_MONTH = '2026-06';
/** 日程日历最早可选日期 */
export const SCHEDULE_CALENDAR_MIN_DATE = `${SCHEDULE_CALENDAR_MIN_MONTH}-01`;

export function clampScheduleCalendarMonth(month: Moment | string): Moment {
  const min = moment(SCHEDULE_CALENDAR_MIN_MONTH, 'YYYY-MM').startOf('month');
  const target = moment(month).startOf('month');
  if (!target.isValid()) return min.clone();
  return target.isBefore(min, 'month') ? min.clone() : target;
}

export function clampScheduleCalendarDate(date?: string | null): string {
  const value = date?.trim() || '';
  if (!value || value < SCHEDULE_CALENDAR_MIN_DATE) return SCHEDULE_CALENDAR_MIN_DATE;
  return value;
}

export function isScheduleCalendarMonthAtMin(month: Moment) {
  const min = moment(SCHEDULE_CALENDAR_MIN_MONTH, 'YYYY-MM');
  return !moment(month).isAfter(min, 'month');
}

export type CalendarTimelineItem = {
  key: string;
  time: string;
  title: string;
  desc: string;
  kind: 'diet' | 'ex' | 'drug' | 'activity' | 'live';
  activityId?: string;
  activityLocation?: string;
  activityStatus?: number;
  activityStatusName?: string;
  activityIsBm?: boolean;
  liveId?: string;
  liveAnchorName?: string;
  livePlatform?: string;
  liveStatus?: number;
  liveStatusName?: string;
  exerciseTypeLabel?: string;
  exerciseGoalText?: string;
  /** 已完成分钟（展示：done/target分钟） */
  exerciseDoneMinutes?: number;
  /** 目标分钟 */
  exerciseTargetMinutes?: number;
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
  medicationPlanTypeLabel?: string;
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

const MEAL_CATEGORY_ICONS: Record<number, ImageSourcePropType> = {
  1: require('@/assets/images/schedule/zc.png'),
  2: require('@/assets/images/schedule/wwc.png'),
  3: require('@/assets/images/schedule/ws.png'),
};

function getMealCategoryIcon(category?: number, fallback?: ImageSourcePropType) {
  if (category != null && MEAL_CATEGORY_ICONS[category]) {
    return MEAL_CATEGORY_ICONS[category];
  }
  return fallback ?? MEAL_CATEGORY_ICONS[1];
}

/** 推荐餐次固定时间：早餐7点 午餐12点 晚餐18点 */
const MEAL_CATEGORY_DEFAULT_MINUTES: Record<number, number> = {
  1: 7 * 60,
  2: 12 * 60,
  3: 18 * 60,
  4: 15 * 60,
};

function formatMinutesToTime(minutes: number) {
  return moment().startOf('day').add(minutes, 'minutes').format('HH:mm');
}

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

/** 日历日期点颜色：用餐 / 用药 / 运动 / 其他 */
export const CALENDAR_DAY_DOT_COLORS = {
  diet: '#EE9C44',
  drug: '#72A1C5',
  ex: '#6D925E',
  other: '#FB4550',
} as const;

export type CalendarDayLocalDotStatus = {
  isDiet?: boolean;
  isDrug?: boolean;
  isEx?: boolean;
  isActivity?: boolean;
  isLive?: boolean;
};

export function buildLocalCalendarDotStatus(
  items: CalendarTimelineItem[],
  options?: { isEx?: boolean; hasMedicationPlan?: boolean },
): CalendarDayLocalDotStatus {
  return {
    isEx: Boolean(options?.isEx),
    isDiet: items.some(item => item.kind === 'diet'),
    isDrug: Boolean(options?.hasMedicationPlan) || items.some(item => item.kind === 'drug'),
    isActivity: items.some(item => item.kind === 'activity'),
    isLive: items.some(item => item.kind === 'live'),
  };
}

export function getCalendarDayDotColors(
  status?: DailyRecordStatusItem | null,
  local?: CalendarDayLocalDotStatus | null,
): string[] {
  const isDiet = Boolean(status?.isDiet || local?.isDiet);
  const isDrug = Boolean(status?.isDrug || local?.isDrug);
  const isEx = Boolean(status?.isEx || local?.isEx);
  const isOther = Boolean(status?.isActivity || status?.isLive || local?.isActivity || local?.isLive);
  if (!isDiet && !isDrug && !isEx && !isOther) return [];
  const colors: string[] = [];
  if (isDiet) colors.push(CALENDAR_DAY_DOT_COLORS.diet);
  if (isDrug) colors.push(CALENDAR_DAY_DOT_COLORS.drug);
  if (isEx) colors.push(CALENDAR_DAY_DOT_COLORS.ex);
  if (isOther) colors.push(CALENDAR_DAY_DOT_COLORS.other);
  return colors;
}

/** 时间轴圆点颜色：与图例一致（用餐/用药/运动/其他） */
export function getTimelineAxisColor(items: CalendarTimelineItem[]): string {
  const kinds = new Set(items.map(item => item.kind));
  if (kinds.has('diet')) return CALENDAR_DAY_DOT_COLORS.diet;
  if (kinds.has('drug')) return CALENDAR_DAY_DOT_COLORS.drug;
  if (kinds.has('ex')) return CALENDAR_DAY_DOT_COLORS.ex;
  return CALENDAR_DAY_DOT_COLORS.other;
}

/** 已完成态：绿 */
export const TIMELINE_STATUS_DONE_COLOR = '#6D925E';
/** 待处理 / 未完成态：橙 */
export const TIMELINE_STATUS_PENDING_COLOR = '#EE9C44';

const TIMELINE_STATUS_DONE_LABELS = new Set([
  '已记录',
  '已服用',
  '直播中',
  '进行中',
  '已报名',
]);
const TIMELINE_STATUS_PENDING_LABELS = new Set([
  '未记录',
  '未服用',
  '未开始',
  '去记录',
  '已结束',
  '已取消',
  '未报名',
]);

export type TimelineStatusBtnTone = 'done' | 'pending' | 'default';

/** 时间轴状态按钮文案 → 色调 */
export function getTimelineStatusBtnTone(label?: string | null): TimelineStatusBtnTone {
  const text = label?.trim() || '';
  if (!text) return 'default';
  if (TIMELINE_STATUS_DONE_LABELS.has(text)) return 'done';
  if (TIMELINE_STATUS_PENDING_LABELS.has(text)) return 'pending';
  // 后端自定义文案兜底
  if (/直播中|进行中|已报名|已记录|已服用/.test(text)) return 'done';
  if (/已结束|已取消|已下架|未开始|未报名|未记录|未服用|去记录/.test(text)) return 'pending';
  return 'default';
}

export function getTimelineStatusBtnColor(label?: string | null): string {
  const tone = getTimelineStatusBtnTone(label);
  if (tone === 'done') return TIMELINE_STATUS_DONE_COLOR;
  if (tone === 'pending') return TIMELINE_STATUS_PENDING_COLOR;
  return '#3B74BD';
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

function sumRecordCalories(records: MealDetailItem[]) {
  return records.reduce((sum, item) => sum + Math.round(Number(item.calorie) || 0), 0);
}

function mapRecommendedMealTimelineItem(
  mealCard: MealCardData,
  index: number,
): CalendarTimelineItem {
  const metaKey = getMealCardMetaKey(mealCard);
  const category = MEAL_CATEGORY_BY_KEY[metaKey] ?? 1;
  const sortValue = MEAL_CATEGORY_DEFAULT_MINUTES[category] ?? 8 * 60;

  return {
    key: `diet-suggest-${mealCard.key}-${index}`,
    time: formatMinutesToTime(sortValue),
    title: mealCard.title,
    desc: mealCard.foods.length ? mealCard.foods.join('、') : '暂无推荐',
    kind: 'diet',
    sortValue,
    period: resolvePeriod(sortValue),
    mealIsRecommended: true,
    mealFoods: mealCard.foods,
    mealCalories: mealCard.calories,
    mealIcon: getMealCategoryIcon(category, mealCard.icon),
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
  const fallbackMinutes = MEAL_CATEGORY_DEFAULT_MINUTES[category] ?? 8 * 60;
  const sortValue = recordTime
    ? parseTimeStrSortValue(formatPlanTime(recordTime))
    : fallbackMinutes;
  const firstDetailId = records.find(item => item.mealDetailId != null)?.mealDetailId;

  return {
    key: `diet-record-${metaKey}-${index}`,
    time: recordTime ? formatPlanTime(recordTime) : formatMinutesToTime(fallbackMinutes),
    title: mealCard.title,
    desc: foods.length ? foods.join('、') : '已记录用餐',
    kind: 'diet',
    sortValue: sortValue || MEAL_CATEGORY_DEFAULT_MINUTES[category],
    period: resolvePeriod(sortValue || MEAL_CATEGORY_DEFAULT_MINUTES[category]),
    mealIsRecommended: false,
    mealFoods: foods,
    mealCalories: calories,
    mealIcon: getMealCategoryIcon(category, mealCard.icon),
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
    mealIcon: getMealCategoryIcon(category),
    mealCategory: category,
    mealDetailId: firstDetailId != null ? String(firstDetailId) : undefined,
  };
}

async function loadMealDetailListForDate(
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<MealDetailItem[]> {
  const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
  if (isToday) {
    try {
      const res = await getTodayMealDetailList(options);
      if (!isResourceApiOk(res as unknown as { code?: number })) return [];
      return apiResourceData<MealDetailItem[]>(res as unknown as { code?: number; data?: MealDetailItem[] }) ?? [];
    } catch {
      return [];
    }
  }

  try {
    const res = await getMealListByDate({ customerLocalDate }, options);
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
          const detailRes = await getMealDetailByMealId(String(meal.mealId), options);
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
  return {
    key: `activity-${item.activityId ?? index}`,
    time: formatTimelineTime(item.activityStartTime),
    title: item.activityName?.trim() || '社区活动',
    desc: location || item.activityRemark?.trim() || '',
    kind: 'activity',
    activityId: item.activityId != null ? String(item.activityId) : undefined,
    activityLocation: location,
    activityStatus: item.status,
    activityStatusName: item.statusName?.trim(),
    activityIsBm: item.isBm,
    sortValue: sortValue || index + 100,
    period: resolvePeriod(sortValue || 540),
  };
}

function mapLiveTimelineItem(
  item: DailyLiveItem,
  index: number,
  platformLabelMap: Record<string, string> = {},
): CalendarTimelineItem {
  const sortValue = parseDateTimeSortValue(item.liveStartTime);
  const anchor = item.anchorName?.trim();
  const platformValue = item.livePlatform?.trim();
  const platform = platformValue
    ? platformLabelMap[platformValue] ?? platformValue
    : undefined;
  const subtitle = [anchor, platform].filter(Boolean).join('、');
  return {
    key: `live-${item.liveId ?? index}`,
    time: formatTimelineTime(item.liveStartTime),
    title: item.title?.trim() || '直播',
    desc: subtitle || item.liveIntro?.trim() || '',
    kind: 'live',
    liveId: item.liveId != null ? String(item.liveId) : undefined,
    liveAnchorName: anchor,
    livePlatform: platform,
    liveStatus: item.status,
    liveStatusName: item.statusName?.trim(),
    sortValue: sortValue || index + 200,
    period: resolvePeriod(sortValue || 540),
  };
}

let livePlatformLabelMapPromise: Promise<Record<string, string>> | null = null;

async function loadLivePlatformLabelMap(): Promise<Record<string, string>> {
  if (livePlatformLabelMapPromise) return livePlatformLabelMapPromise;

  livePlatformLabelMapPromise = (async () => {
    try {
      const res = await getDictDataByType(DICT_TYPES.livePlatform);
      const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
      if (isResourceApiOk(dictRes)) {
        return buildDictLabelMap(dictRes.data);
      }
    } catch {
      // ignore
    }
    return {};
  })().catch(() => {
    livePlatformLabelMapPromise = null;
    return {};
  });

  return livePlatformLabelMapPromise;
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

    const doneMinutes = Math.round(item.typeSumExerciseDuration ?? 0);
    const targetMinutes = Math.round(item.typeNeedExerciseDuration ?? 0);
    const exerciseGoalText = formatExerciseGoalText(doneMinutes, targetMinutes);
    const goalFields =
      targetMinutes > 0
        ? {
          exerciseGoalText,
          exerciseDoneMinutes: doneMinutes,
          exerciseTargetMinutes: targetMinutes,
        }
        : {};

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
          ...(childIndex === 0 ? goalFields : {}),
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
      ...goalFields,
      exerciseType: typeKey,
      kind: 'ex',
      sortValue: 540 + sortOffset * 15,
      period: 'exercise',
    });
    sortOffset += 1;
  }

  return result;
}

export type LoadCalendarDayTimelineOptions = {
  prescription?: InUseExPatientRule | null;
  progressMap?: Record<string, number>;
  /** 已缓存的运动字典，传入后不再重复请求 */
  dictMaps?: ScheduleDictMaps;
  patientUserId?: string | number | null;
};

function formatMedicationEventLabel(label?: string) {
  const text = label?.trim();
  if (!text || text === '无') return '';
  return text;
}

function mapMedicationRecordTimelineItems(
  records: MedicationRecordItem[],
  dictMaps?: MedicationDictMaps,
): CalendarTimelineItem[] {
  return records.map((item, index) => {
    const plan = item.snapshotRule;
    const time =
      formatPlanTime(item.medicationPlanTime)
      || (item.actionTime ? formatTimelineTime(item.actionTime) : '—');
    const sortValue =
      parseTimeStrSortValue(time)
      || parseDateTimeSortValue(item.actionTime)
      || index + 1;
    const doseText = formatMedicationDoseText(plan, dictMaps);
    const eventBasedLabel = formatMedicationEventLabel(
      resolveDictLabel(dictMaps?.eventBased ?? {}, plan?.eventBased),
    );

    return {
      key: `drug-record-${item.medicationRecordId ?? `${item.medicationPlanId ?? 'x'}-${index}`}`,
      time,
      title: plan?.name?.trim() || '用药',
      desc: doseText !== '--' ? doseText : '',
      kind: 'drug' as const,
      sortValue,
      period: resolvePeriod(sortValue),
      taken: item.action === 1,
      canCheckIn: false,
      medicationPlanId: item.medicationPlanId != null ? String(item.medicationPlanId) : undefined,
      medicationPlanTime: formatPlanTime(item.medicationPlanTime),
      medicationPlanTypeLabel: getMedicationPlanTypeLabel(plan?.planType),
      eventBasedLabel,
    };
  });
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
        medicationPlanTypeLabel: item.planTypeLabel,
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

async function loadDietRuleInfo(
  options?: { patientUserId?: string | number | null },
): Promise<DietPatientRuleInfo | null> {
  try {
    const ruleRes = await getInUseDietPatientRuleInfo(options);
    return apiResourceData<DietPatientRuleInfo>(
      ruleRes as { code?: number; data?: DietPatientRuleInfo },
    ) ?? null;
  } catch {
    return null;
  }
}

/** 与 MealTab「餐食建议」同源：在用饮食处方 mealList */
function getMealSuggestionCards(dietRule: DietPatientRuleInfo | null): MealCardData[] {
  return getDietRuleSummary(dietRule).mealCards;
}

function mapRecordedMealsFromDetailList(mealDetailList: MealDetailItem[]): CalendarTimelineItem[] {
  const items: CalendarTimelineItem[] = [];
  Object.entries(MEAL_CATEGORY_KEY_BY_NUMBER).forEach(([categoryText, metaKey]) => {
    const category = Number(categoryText);
    const records = getFoodRecordsByCategory(mealDetailList, metaKey);
    if (records.length === 0) return;
    items.push(mapRecordedMealTimelineItemWithoutCard(category, records, category));
  });
  return items;
}

/**
 * 今日饮食（对齐 MealTab）：
 * 1. 先取「今日摄入」
 * 2. 早/中/晚未记全时，用「餐食建议」mealCards 补齐未记录餐次
 */
async function loadTodayDietTimelineItems(
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<CalendarTimelineItem[]> {
  const mealDetailList = await loadMealDetailListForDate(customerLocalDate, options);
  const items = mapRecordedMealsFromDetailList(mealDetailList);
  const coveredCategories = new Set(
    items.map(item => item.mealCategory).filter((value): value is number => value != null),
  );

  // 三餐已全部录入：只展示真实摄入
  if (resolveMainMealsRecordStatus(mealDetailList) === 'achieved') {
    return items.sort((left, right) => left.sortValue - right.sortValue);
  }

  const dietRule = await loadDietRuleInfo(options);
  const suggestionCards = getMealSuggestionCards(dietRule);

  suggestionCards.forEach((mealCard, index) => {
    const metaKey = getMealCardMetaKey(mealCard);
    const category = MEAL_CATEGORY_BY_KEY[metaKey];
    // 仅补齐未记录的早/中/晚
    if (category == null || category > 3 || coveredCategories.has(category)) return;
    items.push(mapRecommendedMealTimelineItem(mealCard, index));
    coveredCategories.add(category);
  });

  return items.sort((left, right) => left.sortValue - right.sortValue);
}

/** 历史：保持原逻辑，用处方 mealList + 当日记录，不调 AI */
async function loadHistoryDietTimelineItems(
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<CalendarTimelineItem[]> {
  const [dietRule, mealDetailList] = await Promise.all([
    loadDietRuleInfo(options),
    loadMealDetailListForDate(customerLocalDate, options),
  ]);

  const recommendedCards = buildMealCardsFromRuleForDate(dietRule?.mealList, customerLocalDate);
  const items: CalendarTimelineItem[] = [];

  if (recommendedCards.length > 0) {
    const coveredCategories = new Set<number>();
    recommendedCards.forEach((mealCard, index) => {
      const metaKey = getMealCardMetaKey(mealCard);
      const category = MEAL_CATEGORY_BY_KEY[metaKey];
      if (category != null) coveredCategories.add(category);
      const records = getFoodRecordsByCategory(mealDetailList, metaKey);
      // 历史只展示已记录；有处方卡但无记录则不展示推荐
      const item = mapMealTimelineItem(mealCard, records, index, false);
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

  return mapRecordedMealsFromDetailList(mealDetailList)
    .sort((left, right) => left.sortValue - right.sortValue);
}

async function loadDietTimelineItems(
  customerLocalDate: string,
  options?: { patientUserId?: string | number | null },
): Promise<CalendarTimelineItem[]> {
  try {
    const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
    if (isToday) {
      return loadTodayDietTimelineItems(customerLocalDate, options);
    }
    return loadHistoryDietTimelineItems(customerLocalDate, options);
  } catch {
    return [];
  }
}

const DAY_EXERCISE_TYPE_ORDER = ['cardio', 'strength', 'flexibility', 'balance'] as const;

async function loadExerciseTimelineItems(
  customerLocalDate: string,
  prescription: InUseExPatientRule | null | undefined,
  dictMaps?: ScheduleDictMaps,
  progressMap?: Record<string, number>,
): Promise<CalendarTimelineItem[]> {
  try {
    const scheduledTypes = DAY_EXERCISE_TYPE_ORDER.filter(
      typeKey => progressMap != null && Object.prototype.hasOwnProperty.call(progressMap, typeKey),
    );
    if (scheduledTypes.length === 0) return [];

    const ratioList = prescription?.ruleRatioList ?? [];
    const list: DayTypeDetailItem[] = scheduledTypes.map(typeKey => {
      const rule = ratioList.find(item => item.exerciseType?.trim() === typeKey);
      const progress = progressMap?.[typeKey] ?? 0;
      const targetMinutes = Math.round(Number(rule?.duration ?? 0));
      const doneMinutes = targetMinutes > 0
        ? Math.round((Math.max(0, Math.min(100, progress)) / 100) * targetMinutes)
        : 0;

      return {
        customerLocalDate,
        exerciseType: typeKey,
        exerciseChildType: rule?.exerciseChildType,
        typeNeedExerciseDuration: targetMinutes,
        typeSumExerciseDuration: doneMinutes,
        childTypeList: (rule?.exerciseChildType ?? '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
          .map(exerciseChildType => ({ exerciseChildType })),
      };
    });

    return mapDayTypeExerciseTimelineItems(list, dictMaps).map(item => {
      const typeKey = item.exerciseType?.trim();
      if (!typeKey) return item;
      const taskIndex = ratioList.findIndex(rule => rule.exerciseType?.trim() === typeKey);
      const rule = taskIndex >= 0 ? ratioList[taskIndex] : undefined;
      const progress = progressMap?.[typeKey] ?? 0;
      return {
        ...item,
        exerciseType: rule?.exerciseType ?? typeKey,
        exerciseChildType: rule?.exerciseChildType,
        strengthLevel: rule?.strengthLevel,
        exerciseTaskIndex: taskIndex >= 0 ? taskIndex : undefined,
        exerciseProgress: Math.max(0, Math.min(100, Math.round(Number(progress) || 0))),
      };
    });
  } catch {
    return [];
  }
}

/** 历史日期用药：按真实服药记录展示，避免 indexPlan 把今日打卡状态带到历史 */
async function loadMedicationTimelineItems(
  customerLocalDate: string,
  dictMaps?: MedicationDictMaps,
  options?: { patientUserId?: string | number | null },
): Promise<CalendarTimelineItem[]> {
  try {
    const res = await getMedicationRecordAll({
      startDate: customerLocalDate,
      endDate: customerLocalDate,
      pageSize: 100,
      pageNum: 1,
    }, options);
    if (!isResourceApiOk(res as { code?: number })) return [];

    const rows = getResourceRows<MedicationRecordDayGroup>(res);
    const records = rows.flatMap(group => group.list ?? []);
    return mapMedicationRecordTimelineItems(records, dictMaps)
      .sort((left, right) => left.sortValue - right.sortValue);
  } catch {
    return [];
  }
}

export async function loadDailyRecordStatusMap(
  month: Moment,
  options?: { patientUserId?: string | number | null },
) {
  const { startDate, endDate } = getCalendarGridDateRange(month);

  try {
    const res = await getDailyRecordStatusListByDateRange({ startDate, endDate }, options);
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
  options?: LoadCalendarDayTimelineOptions,
) {
  try {
    const patientOpts = options?.patientUserId != null
      ? { patientUserId: options.patientUserId }
      : undefined;
    const detailTasks: Promise<CalendarTimelineItem[]>[] = [
      getDailyActivityListByDate({ customerLocalDate }, patientOpts)
        .then(res => (isResourceApiOk(res)
          ? (apiResourceData<DailyActivityItem[]>(res as any) ?? []).map(mapActivityTimelineItem)
          : [])),
      (async () => {
        const [liveRes, platformLabelMap] = await Promise.all([
          getDailyLiveListByDate({ customerLocalDate }, patientOpts),
          loadLivePlatformLabelMap(),
        ]);
        if (!isResourceApiOk(liveRes)) return [];
        return (apiResourceData<DailyLiveItem[]>(liveRes as any) ?? []).map((item, index) =>
          mapLiveTimelineItem(item, index, platformLabelMap),
        );
      })(),
      loadDietTimelineItems(customerLocalDate, patientOpts),
    ];

    const progressMap = options?.progressMap;
    if (progressMap && Object.keys(progressMap).length > 0) {
      detailTasks.push(
        (async () => {
          const dictMaps = options?.dictMaps
            ?? await loadScheduleDictMaps().catch(() => undefined);
          return loadExerciseTimelineItems(
            customerLocalDate,
            options?.prescription,
            dictMaps,
            progressMap,
          );
        })(),
      );
    }

    if (status?.isDrug && customerLocalDate !== moment().format('YYYY-MM-DD')) {
      detailTasks.push(
        loadMedicationDictMaps()
          .then(dictMaps => loadMedicationTimelineItems(customerLocalDate, dictMaps, patientOpts)),
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

export type CalendarTimelineTimeGroup = {
  key: string;
  time: string;
  sortValue: number;
  items: CalendarTimelineItem[];
};

/** 同一展示时间合并为一组，共用一个时间点 */
export function groupTimelineItemsByTime(items: CalendarTimelineItem[]): CalendarTimelineTimeGroup[] {
  const groups: CalendarTimelineTimeGroup[] = [];
  const indexByTime = new Map<string, number>();

  for (const item of items) {
    const timeKey = item.time?.trim() || '—';
    const existingIndex = indexByTime.get(timeKey);
    if (existingIndex == null) {
      indexByTime.set(timeKey, groups.length);
      groups.push({
        key: `time-${timeKey}-${item.sortValue}`,
        time: timeKey,
        sortValue: item.sortValue,
        items: [item],
      });
      continue;
    }
    groups[existingIndex].items.push(item);
  }

  return groups.sort((left, right) => left.sortValue - right.sortValue);
}
