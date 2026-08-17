import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import {
  getDailyActivityListByDate,
  getDailyLiveListByDate,
  getDailyRecordStatusListByDateRange,
  type DailyActivityItem,
  type DailyLiveItem,
  type DailyRecordStatusItem,
} from '@/api/dailyRecordStatus';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { buildSignedChatPayload, saveChatAction } from '@/api/assistant';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import {
  buildDictLabelMap,
  DICT_TYPES,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import {
  mapTodayMedicationGroupsToTimelineItems,
  type CalendarTimelineItem,
} from '@/src/features/schedule/calendarHelpers';
import { loadMedicationPlanGroupsForDate } from '@/src/features/profile/medication/medicationHelpers';
import {
  buildMealCardsFromRule,
  type MealCardData,
} from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  loadScheduleDictMaps,
  normalizeProgress,
  toTodayTaskItem,
} from '@/src/features/schedule/scheduleHelpers';
import { loadCalendarDayCompleteRateProgressMap } from '@/src/features/schedule/calendarDayCompleteRateHelpers';
import type { ChatGuideState } from './types';
import {
  loadTodayExerciseMainMetaByType,
} from './todayScheduleExerciseHelpers';

export const TODAY_SCHEDULE_QUESTION = '今日安排';
export const TODAY_SCHEDULE_ANSWER = '好的，为您发送今日安排，请查看。';
export const TODAY_SCHEDULE_EMPTY_ANSWER = '今天无安排';
export const TODAY_SCHEDULE_ACTION = 'today_schedule';

const STATUS_PATH = '/patient/dailyRecordStatus/listByDateRange';

export type TodayScheduleItem = {
  key: string;
  time: string;
  sortValue: number;
  title: string;
  desc: string;
  kind: 'diet' | 'drug' | 'activity' | 'live' | 'ex';
  icon?: ImageSourcePropType;
  mealWindowEnd?: number;
  mealCard?: MealCardData;
  eventBasedLabel?: string;
  canCheckIn?: boolean;
  taken?: boolean;
  medicationKey?: string;
  activityId?: string;
  location?: string;
  liveId?: string;
  liveAnchorName?: string;
  livePlatform?: string;
  /** 主播姓名、观看平台 */
  liveSubtitle?: string;
  progress?: number;
  exerciseType?: string;
  exerciseChildType?: string;
  strengthLevel?: string;
  taskIndex?: number;
};

export type TodaySchedulePayload = {
  items: TodayScheduleItem[];
  mealCards: MealCardData[];
  mealSwiperIndex: number;
  isEmpty: boolean;
};

/** 03:00-11:00 早餐；11:00-16:00 午餐；16:00-02:00 晚餐（跨日用 26h 表示） */
const MEAL_WINDOW_BY_KEY: Record<string, { start: number; end: number }> = {
  breakfast: { start: 3 * 60, end: 11 * 60 },
  lunch: { start: 11 * 60, end: 16 * 60 },
  dinner: { start: 16 * 60, end: 26 * 60 },
};

const TIMELINE_ICONS: Record<TodayScheduleItem['kind'], number> = {
  diet: require('@/assets/images/schedule/yw.png'),
  drug: require('@/assets/images/schedule/yw.png'),
  activity: require('@/assets/images/assistant/icon_hd.png'),
  live: require('@/assets/images/assistant/icon_zb.png'),
  ex: require('@/assets/images/schedule/exercise2.png'),
};

export function getTodayScheduleIcon(item: TodayScheduleItem) {
  if (item.icon) {
    return item.icon;
  }
  if (item.kind === 'diet' && item.mealCard?.icon) {
    return item.mealCard.icon;
  }
  return TIMELINE_ICONS[item.kind];
}

function getTodayDate() {
  return moment().format('YYYY-MM-DD');
}

function getCurrentMinutes() {
  const now = moment();
  return now.hours() * 60 + now.minutes();
}

function getMealMetaKey(mealCard: MealCardData) {
  return mealCard.key.split('-')[0] ?? '';
}

function getMealWindow(mealCard: MealCardData) {
  const key = getMealMetaKey(mealCard);
  return MEAL_WINDOW_BY_KEY[key] ?? MEAL_WINDOW_BY_KEY.dinner;
}

function getCurrentMealKey() {
  const hour = moment().hours();
  if (hour >= 3 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  return 'dinner';
}

function isScheduleItemVisible(item: TodayScheduleItem, currentMinutes: number) {
  if (item.kind === 'ex') {
    // 与首页一致：今日有主训安排即展示；已完成(100%)不再占用安排位
    const progress = item.progress ?? 0;
    return progress < 100;
  }
  if (item.kind === 'diet' && item.mealWindowEnd != null) {
    return item.mealWindowEnd > currentMinutes;
  }
  return item.sortValue >= currentMinutes;
}

function sortScheduleItems(items: TodayScheduleItem[]) {
  const regular = items.filter(item => item.kind !== 'ex').sort((a, b) => a.sortValue - b.sortValue);
  const exercise = items.filter(item => item.kind === 'ex').sort((a, b) => a.sortValue - b.sortValue);
  return [...regular, ...exercise];
}

function formatLiveSubtitle(anchor?: string, platform?: string) {
  return [anchor?.trim(), platform?.trim()].filter(Boolean).join('、');
}

function mapTimelineToScheduleItem(item: CalendarTimelineItem): TodayScheduleItem {
  const liveSubtitle =
    item.kind === 'live'
      ? formatLiveSubtitle(item.liveAnchorName, item.livePlatform) || undefined
      : undefined;
  return {
    key: item.key,
    time: item.time,
    sortValue: item.sortValue,
    title: item.title,
    desc: item.desc,
    kind: item.kind,
    eventBasedLabel: item.eventBasedLabel,
    canCheckIn: item.canCheckIn,
    taken: item.taken,
    medicationKey: item.key,
    activityId: item.activityId,
    location: item.activityLocation || (item.kind === 'activity' ? item.desc : undefined),
    liveId: item.liveId,
    liveAnchorName: item.liveAnchorName,
    livePlatform: item.livePlatform,
    liveSubtitle,
  };
}

const TODAY_SCHEDULE_RECOMMEND_LIMIT = 3;

function buildMealDesc(mealCard: MealCardData) {
  return mealCard.foods.length ? mealCard.foods.join(' ') : '';
}

function buildUpcomingMealItems(
  mealCards: MealCardData[],
  currentMinutes: number,
): TodayScheduleItem[] {
  return mealCards
    .map(mealCard => {
      const window = getMealWindow(mealCard);
      return {
        key: `diet-${mealCard.key}`,
        time: mealCard.time,
        sortValue: window.start,
        mealWindowEnd: window.end,
        title: mealCard.title,
        desc: buildMealDesc(mealCard),
        kind: 'diet' as const,
        mealCard,
      };
    })
    .filter(item => (item.mealWindowEnd ?? 0) > currentMinutes);
}

async function fetchTodayStatus() {
  const today = getTodayDate();
  const res = await getDailyRecordStatusListByDateRange({ startDate: today, endDate: today });
  if (!isResourceApiOk(res as { code?: number })) return undefined;
  const list = apiResourceData<DailyRecordStatusItem[]>(
    res as unknown as { code?: number; data?: DailyRecordStatusItem[] },
  );
  return (list ?? []).find(item => item.customerLocalDate === today) ?? list?.[0];
}

async function fetchMealSuggestion(currentMinutes: number) {
  try {
    const ruleRes = await getInUseDietPatientRuleInfo();
    const dietRule = apiResourceData<DietPatientRuleInfo>(
      ruleRes as unknown as ApiResult<DietPatientRuleInfo>,
    );

    if (!dietRule?.dietPatientRuleId) {
      return {
        mealCards: [] as MealCardData[],
        mealItems: [] as TodayScheduleItem[],
        mealSwiperIndex: 0,
      };
    }

    const mealCards = buildMealCardsFromRule(dietRule.mealList);
    const upcomingCards = mealCards.filter(card => getMealWindow(card).end > currentMinutes);
    const mealItems = buildUpcomingMealItems(upcomingCards, currentMinutes);
    const currentMealKey = getCurrentMealKey();
    const mealSwiperIndex = Math.max(
      0,
      upcomingCards.findIndex(card => getMealMetaKey(card).startsWith(currentMealKey)),
    );

    return { mealCards: upcomingCards, mealItems, mealSwiperIndex };
  } catch {
    return { mealCards: [], mealItems: [], mealSwiperIndex: 0 };
  }
}

async function fetchDrugItems(currentMinutes: number) {
  const groups = await loadMedicationPlanGroupsForDate(getTodayDate());
  return mapTodayMedicationGroupsToTimelineItems(groups)
    .map(mapTimelineToScheduleItem)
    .filter(item => item.sortValue >= currentMinutes);
}

function mapActivityTimelineItem(item: DailyActivityItem, index: number): CalendarTimelineItem {
  const sortValue = (() => {
    const parsed = moment(item.activityStartTime);
    return parsed.isValid() ? parsed.hours() * 60 + parsed.minutes() : 0;
  })();
  const location = item.activityLocation?.trim();
  const remark = item.activityRemark?.trim();
  return {
    key: `activity-${item.activityId ?? index}`,
    time: moment(item.activityStartTime).isValid()
      ? moment(item.activityStartTime).format('H:mm')
      : '—',
    title: item.activityName?.trim() || '社区活动',
    desc: location || remark || item.statusName?.trim() || '社区活动',
    kind: 'activity',
    activityId: item.activityId != null ? String(item.activityId) : undefined,
    activityLocation: location,
    sortValue: sortValue || index + 100,
    period: sortValue < 12 * 60 ? 'morning' : 'afternoon',
  };
}

function mapLiveTimelineItem(
  item: DailyLiveItem,
  index: number,
  platformLabelMap: Record<string, string> = {},
): CalendarTimelineItem {
  const sortValue = (() => {
    const parsed = moment(item.liveStartTime);
    return parsed.isValid() ? parsed.hours() * 60 + parsed.minutes() : 0;
  })();
  const anchor = item.anchorName?.trim();
  const platformValue = item.livePlatform?.trim();
  const platform = platformValue
    ? platformLabelMap[platformValue] ?? platformValue
    : undefined;
  const subtitle = formatLiveSubtitle(anchor, platform);
  return {
    key: `live-${item.liveId ?? index}`,
    time: moment(item.liveStartTime).isValid()
      ? moment(item.liveStartTime).format('H:mm')
      : '—',
    title: item.title?.trim() || '直播',
    desc: subtitle,
    kind: 'live',
    liveId: item.liveId != null ? String(item.liveId) : undefined,
    liveAnchorName: anchor,
    livePlatform: platform,
    sortValue: sortValue || index + 200,
    period: sortValue < 12 * 60 ? 'morning' : 'afternoon',
  };
}

async function loadLivePlatformLabelMap(): Promise<Record<string, string>> {
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
}

async function fetchTimelineItems(currentMinutes: number) {
  const today = getTodayDate();
  const [activityRes, liveRes, platformLabelMap] = await Promise.all([
    getDailyActivityListByDate({ customerLocalDate: today }),
    getDailyLiveListByDate({ customerLocalDate: today }),
    loadLivePlatformLabelMap(),
  ]);

  const activities = isResourceApiOk(activityRes as unknown as { code?: number })
    ? (apiResourceData<DailyActivityItem[]>(
      activityRes as unknown as { code?: number; data?: DailyActivityItem[] },
    ) ?? []).map(mapActivityTimelineItem)
    : [];
  const lives = isResourceApiOk(liveRes as unknown as { code?: number })
    ? (apiResourceData<DailyLiveItem[]>(
      liveRes as unknown as { code?: number; data?: DailyLiveItem[] },
    ) ?? []).map((item, index) => mapLiveTimelineItem(item, index, platformLabelMap))
    : [];

  return [...activities, ...lives]
    .map(mapTimelineToScheduleItem)
    .filter(item => item.sortValue >= currentMinutes);
}

async function fetchExerciseItems() {
  try {
    const [ruleRes, dictMaps] = await Promise.all([
      getInUseExPatientRuleInfo(),
      loadScheduleDictMaps(),
    ]);
    if (!isResourceApiOk(ruleRes as { code?: number })) return [];

    const rule = apiResourceData<InUseExPatientRule>(
      ruleRes as { code?: number; data?: InUseExPatientRule },
    );
    const ruleId = rule?.exPatientRuleId;
    const ratioList = rule?.ruleRatioList ?? [];
    if (!ruleId || ratioList.length === 0) return [];

    const today = getTodayDate();
    const [progressMap, mainMetaByType] = await Promise.all([
      // 与首页运动处方卡片同一数据源：当日四模块完成率
      loadCalendarDayCompleteRateProgressMap(today),
      loadTodayExerciseMainMetaByType(rule, today),
    ]);

    return ratioList
      .map((ratio, index) => {
        const typeKey = ratio.exerciseType?.trim() ?? '';
        // 今日主训练无该分类则不展示
        const mainMeta = typeKey ? mainMetaByType[typeKey] : undefined;
        if (!typeKey || !mainMeta) return null;

        const task = toTodayTaskItem(ratio, index, dictMaps, progressMap);
        const progress = progressMap[typeKey] != null
          ? normalizeProgress(progressMap[typeKey])
          : task.progress;
        return {
          key: `ex-${task.key}`,
          time: '随时',
          sortValue: 24 * 60 + index,
          title: task.title,
          desc: mainMeta.desc && mainMeta.desc !== '--' ? mainMeta.desc : task.intro,
          kind: 'ex' as const,
          icon: task.icon,
          progress,
          exerciseType: ratio.exerciseType,
          exerciseChildType: ratio.exerciseChildType,
          strengthLevel: ratio.strengthLevel,
          taskIndex: index,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  } catch {
    return [];
  }
}

export async function loadTodaySchedulePayload(): Promise<TodaySchedulePayload> {
  const currentMinutes = getCurrentMinutes();
  await fetchTodayStatus();

  const [mealData, drugItems, timelineItems, exerciseItems] = await Promise.all([
    fetchMealSuggestion(currentMinutes),
    fetchDrugItems(currentMinutes),
    fetchTimelineItems(currentMinutes),
    fetchExerciseItems(),
  ]);

  const merged = [
    ...drugItems,
    ...timelineItems,
    ...mealData.mealItems,
    ...exerciseItems,
  ];

  const visible = sortScheduleItems(merged.filter(item => isScheduleItemVisible(item, currentMinutes)));
  const recommended = visible.slice(0, TODAY_SCHEDULE_RECOMMEND_LIMIT);

  return {
    items: recommended,
    mealCards: mealData.mealCards,
    mealSwiperIndex: mealData.mealSwiperIndex,
    isEmpty: recommended.length === 0,
  };
}

export function parseTodayScheduleFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
): TodaySchedulePayload {
  const respData = interfaceData?.respData as Partial<TodaySchedulePayload> | undefined;
  return {
    items: Array.isArray(respData?.items) ? respData.items : [],
    mealCards: Array.isArray(respData?.mealCards) ? respData.mealCards : [],
    mealSwiperIndex: respData?.mealSwiperIndex ?? 0,
    isEmpty: Boolean(respData?.isEmpty),
  };
}

export async function requestTodayScheduleQuickAction(params: {
  chatId: string;
  chatGuide: ChatGuideState;
  question?: string;
}) {
  const payload = await loadTodaySchedulePayload();
  const question = params.question?.trim() || TODAY_SCHEDULE_QUESTION;
  const answer = payload.isEmpty ? TODAY_SCHEDULE_EMPTY_ANSWER : TODAY_SCHEDULE_ANSWER;
  const interfaceData = {
    reqParams: {
      statusUrl: STATUS_PATH,
      customerLocalDate: getTodayDate(),
    },
    respData: payload,
  };

  const saveRes = await saveChatAction(
    buildSignedChatPayload({
      chatId: params.chatId,
      question,
      answer,
      action: TODAY_SCHEDULE_ACTION,
      userChatGuideId: params.chatGuide.userChatGuideId,
      userChatGuideText: params.chatGuide.userChatGuideText,
      interfaceData,
      deepMode: 'quick',
    }),
  );

  return {
    saveRes,
    payload,
    answer,
    interfaceData,
    question,
  };
}
