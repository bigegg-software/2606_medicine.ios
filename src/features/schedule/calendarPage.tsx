import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Picker, Toast } from '@ant-design/react-native';
import moment, { type Moment } from 'moment';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/schedule/calendar';
import type { DailyRecordStatusItem } from '@/api/dailyRecordStatus';
import {
  groupTimelineItems,
  hasDailyRecord,
  loadCalendarDayTimelineItems,
  loadDailyRecordStatusMap,
  mapTodayMedicationGroupsToTimelineItems,
  type CalendarTimelineItem,
} from './calendarHelpers';
import {
  applyMedicationCheckInToPlanGroups,
  loadMedicationPlanGroupsForDate,
  submitMedicationCheckIn,
  type MedicationPlanGroupView,
} from '@/src/features/profile/medication/medicationHelpers';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;
const MIN_YEAR = moment().year() - 10;
const MAX_YEAR = moment().year() + 1;

const MONTH_PICKER_DATA = [
  Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => {
    const year = MIN_YEAR + index;
    return { label: String(year), value: year };
  }),
  Array.from({ length: 12 }, (_, index) => ({
    label: String(index + 1).padStart(2, '0'),
    value: index + 1,
  })),
];

const TIMELINE_ICONS: Record<CalendarTimelineItem['kind'], number> = {
  diet: require('@/assets/images/schedule/yw.png'),
  ex: require('@/assets/images/schedule/exercise2.png'),
  drug: require('@/assets/images/schedule/yw.png'),
  activity: require('@/assets/images/schedule/exercise4.png'),
  live: require('@/assets/images/schedule/exercise3.png'),
};

type CalendarDay = {
  date: Moment;
  isCurrentMonth: boolean;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function DashedDivider() {
  return (
    <View style={styles.divider}>
      {Array.from({ length: DASH_COUNT }, (_, index) => (
        <View key={index} style={styles.dash} />
      ))}
    </View>
  );
}

function buildCalendarDays(month: Moment): CalendarDay[] {
  const start = moment(month).startOf('month');
  const end = moment(month).endOf('month');
  const calendarStart = moment(start).startOf('week');
  const calendarEnd = moment(end).endOf('week');
  const days: CalendarDay[] = [];
  const cursor = moment(calendarStart);

  while (!cursor.isAfter(calendarEnd, 'day')) {
    days.push({
      date: moment(cursor),
      isCurrentMonth: cursor.month() === month.month(),
    });
    cursor.add(1, 'day');
  }

  return days;
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function ExerciseTimelineSection({
  items,
  isToday,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  isToday: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.exerciseSectionWrap}>
      <View style={styles.periodRow}>
        <View style={styles.timeAxis}>
          <Text style={styles.periodText}>随时</Text>
        </View>
        <View style={styles.cardSide} />
      </View>

      {items.map((item, itemIndex) => {
        const isLastInSection = itemIndex === items.length - 1;

        return (
          <View
            key={item.key}
            style={[
              styles.timelineRow,
              !isLastInSection && styles.timelineRowGap,
              isLastInSection && styles.exerciseRowSectionLast,
            ]}>
            <View style={styles.cardSide}>
              {isToday ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onPressItem(item)}>
                  <Flex style={styles.exerciseTaskCard} align="start">
                    <Image style={styles.taskCardIcon} source={TIMELINE_ICONS.ex} />
                    <View style={styles.exerciseCardContent}>
                      <Flex justify="between" align="center">
                        <Text style={styles.taskCardTitle}>{item.exerciseTypeLabel}</Text>
                        {item.exerciseGoalText ? (
                          <Text style={styles.taskCardDesc} numberOfLines={1}>
                            {item.exerciseGoalText}
                          </Text>
                        ) : null}
                      </Flex>
                      <Text style={styles.taskCardDesc} numberOfLines={2}>{item.desc}</Text>
                    </View>
                  </Flex>
                </TouchableOpacity>
              ) : (
                <Flex style={styles.exerciseTaskCard} align="start">
                  <Image style={styles.taskCardIcon} source={TIMELINE_ICONS.ex} />
                  <View style={styles.exerciseCardContent}>
                    <Flex justify="between" align="center">
                      <Text style={styles.taskCardTitle}>{item.exerciseTypeLabel}</Text>
                      {item.exerciseGoalText ? (
                        <Text style={styles.taskCardDesc} numberOfLines={1}>
                          {item.exerciseGoalText}
                        </Text>
                      ) : null}
                    </Flex>
                    <Text style={styles.taskCardDesc} numberOfLines={2}>{item.desc}</Text>
                  </View>
                </Flex>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function DietTimelineCard({ item }: { item: CalendarTimelineItem }) {
  const foods = item.mealFoods ?? [];

  return (
    <Flex style={styles.dietTaskCard} align="start">
      <Image
        style={styles.taskCardIcon}
        source={item.mealIcon ?? TIMELINE_ICONS.diet}
      />
      <View style={styles.exerciseCardContent}>
        <Flex align="center" style={{ flexWrap: 'wrap' }}>
          <Text style={styles.taskCardTitle}>{item.title}</Text>
          {item.mealIsRecommended ? (
            <View style={styles.dietRecommendBadge}>
              <Text style={styles.dietRecommendBadgeText}>AI推荐</Text>
            </View>
          ) : null}
        </Flex>
        {foods.length > 0 ? (
          <View style={styles.dietFoodRow}>
            {foods.slice(0, 4).map((food, index) => (
              <View key={`${food}-${index}`} style={styles.dietFoodTag}>
                <Text style={styles.dietFoodTagText} numberOfLines={1}>{food}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.taskCardDesc} numberOfLines={2}>{item.desc}</Text>
        )}

      </View>
    </Flex>
  );
}

function MedicationStatus({
  item,
  checkingIn,
  onCheckIn,
}: {
  item: CalendarTimelineItem;
  checkingIn: boolean;
  onCheckIn: (item: CalendarTimelineItem) => void;
}) {
  if (item.canCheckIn) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={checkingIn}
        onPress={() => onCheckIn(item)}>
        {checkingIn ? (
          <ActivityIndicator color={AppTheme.primaryColor} size="small" />
        ) : (
          <Flex align="center">
            <View style={styles.taskCardStatusIconWrap}>
              <View style={styles.taskCardStatusCircleAction} />
            </View>
            <Text style={[styles.taskCardStatus, styles.taskCardStatusAction]}>已服用</Text>
          </Flex>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Flex align="center">
      <View style={styles.taskCardStatusIconWrap}>
        {item.taken ? (
          <>
            <View style={styles.taskCardStatusCircleTaken} />
            <Text style={styles.taskCardStatusCheck}>✓</Text>
          </>
        ) : (
          <View style={styles.taskCardStatusCircleMuted} />
        )}
      </View>
      <Text
        style={[
          styles.taskCardStatus,
          item.taken ? styles.taskCardStatusTaken : null,
        ]}>
        {item.taken ? '已服用' : '未服用'}
      </Text>
    </Flex>
  );
}

function TimelineSection({
  period,
  items,
  onPressItem,
  checkingInKey,
  onMedicationCheckIn,
}: {
  period: string;
  items: CalendarTimelineItem[];
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <>
      <View style={[styles.periodRow, period === '下午' && styles.periodRowAfternoon]}>
        <View style={styles.timeAxis}>
          <Text style={styles.periodText}>{period}</Text>
        </View>
        <View style={styles.cardSide} />
      </View>

      {items.map((item, itemIndex) => {
        const isLastInSection = itemIndex === items.length - 1;
        const isDietItem = item.kind === 'diet';
        const isPressable = isDietItem || item.kind === 'activity' || item.kind === 'live';

        return (
          <View
            key={item.key}
            style={[
              styles.timelineRow,
              !isLastInSection && styles.timelineRowGap,
              isLastInSection && styles.timelineRowSectionLast,
            ]}>
            <View style={styles.timeAxis}>
              {!isDietItem ? (
                <View style={styles.timeSlot}>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardSide}>
              <TouchableOpacity
                activeOpacity={isPressable ? 0.7 : 1}
                disabled={!isPressable}
                onPress={() => onPressItem(item)}>
                {isDietItem ? (
                  <DietTimelineCard item={item} />
                ) : (
                  <Flex style={styles.taskCard} align="center">
                    <Image style={styles.taskCardIcon} source={TIMELINE_ICONS[item.kind]} />
                    <View style={{ flex: 1 }}>
                      <Flex align="center" style={{ flexWrap: 'wrap' }}>
                        <Text style={styles.taskCardTitle}>{item.title}</Text>
                        {item.kind === 'drug' && item.eventBasedLabel ? (
                          <Text style={styles.taskCardMedicationType}>{item.eventBasedLabel}</Text>
                        ) : null}
                      </Flex>
                      {item.desc ? (
                        <Text style={styles.taskCardDesc} numberOfLines={2}>{item.desc}</Text>
                      ) : null}
                    </View>
                    {item.kind === 'drug' ? (
                      <MedicationStatus
                        item={item}
                        checkingIn={checkingInKey === item.key}
                        onCheckIn={onMedicationCheckIn}
                      />
                    ) : null}
                  </Flex>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );
}

function ScheduleTimeline({
  items,
  loading,
  isToday,
  onPressItem,
  checkingInKey,
  onMedicationCheckIn,
}: {
  items: CalendarTimelineItem[];
  loading: boolean;
  isToday: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
}) {
  const grouped = useMemo(() => groupTimelineItems(items), [items]);
  const hasScheduledItems = grouped.morning.length > 0 || grouped.afternoon.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyTimelineBox}>
        <Text style={styles.emptyTimelineText}>当日暂无记录</Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineWrap}>
      {grouped.exercise.length > 0 ? (
        <ExerciseTimelineSection
          items={grouped.exercise}
          isToday={isToday}
          onPressItem={onPressItem}
        />
      ) : null}
      {hasScheduledItems ? (
        <View style={styles.scheduledTimelineWrap}>
          <View style={styles.axisLine} pointerEvents="none" />
          <TimelineSection
            period="上午"
            items={grouped.morning}
            onPressItem={onPressItem}
            checkingInKey={checkingInKey}
            onMedicationCheckIn={onMedicationCheckIn}
          />
          <TimelineSection
            period="下午"
            items={grouped.afternoon}
            onPressItem={onPressItem}
            checkingInKey={checkingInKey}
            onMedicationCheckIn={onMedicationCheckIn}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function ScheduleCalendarPage() {
  const navigation = useNavigation<Nav>();
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [statusMap, setStatusMap] = useState<Map<string, DailyRecordStatusItem>>(new Map());
  const [timelineItems, setTimelineItems] = useState<CalendarTimelineItem[]>([]);
  const [medicationPlanGroups, setMedicationPlanGroups] = useState<MedicationPlanGroupView[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingMedication, setLoadingMedication] = useState(false);
  const [checkingInKey, setCheckingInKey] = useState<string | null>(null);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const selectedStatus = statusMap.get(selectedDate);
  const isToday = selectedDate === moment().format('YYYY-MM-DD');
  const displayTimelineItems = useMemo(() => {
    if (!isToday) return timelineItems;
    const drugItems = mapTodayMedicationGroupsToTimelineItems(medicationPlanGroups);
    const others = timelineItems.filter(item => item.kind !== 'drug');
    return [...others, ...drugItems].sort((left, right) => left.sortValue - right.sortValue);
  }, [isToday, medicationPlanGroups, timelineItems]);

  const loadMonthlyOverview = useCallback(async (month: Moment) => {
    setLoadingMonth(true);
    try {
      const map = await loadDailyRecordStatusMap(month);
      setStatusMap(map);
    } catch {
      setStatusMap(new Map());
    } finally {
      setLoadingMonth(false);
    }
  }, []);

  const loadDayTimeline = useCallback(async (dateKey: string, status?: DailyRecordStatusItem) => {
    setLoadingDay(true);
    try {
      const items = await loadCalendarDayTimelineItems(dateKey, status);
      setTimelineItems(items);
    } catch {
      setTimelineItems([]);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  const loadTodayMedication = useCallback(async (dateKey: string) => {
    if (dateKey !== moment().format('YYYY-MM-DD')) {
      setMedicationPlanGroups([]);
      return;
    }

    setLoadingMedication(true);
    try {
      const groups = await loadMedicationPlanGroupsForDate(dateKey);
      setMedicationPlanGroups(groups);
    } catch {
      setMedicationPlanGroups([]);
    } finally {
      setLoadingMedication(false);
    }
  }, []);

  useEffect(() => {
    void loadMonthlyOverview(currentMonth);
  }, [currentMonth, loadMonthlyOverview]);

  useEffect(() => {
    void loadDayTimeline(selectedDate, selectedStatus);
    void loadTodayMedication(selectedDate);
  }, [loadDayTimeline, loadTodayMedication, selectedDate, selectedStatus]);

  const handleTimelinePress = useCallback((item: CalendarTimelineItem) => {
    if (item.kind === 'diet') {
      navigation.navigate('Medication', { tab: 'meal' });
      return;
    }
    if (
      item.kind === 'ex'
      && selectedDate === moment().format('YYYY-MM-DD')
      && item.exerciseTaskIndex != null
    ) {
      navigation.navigate('PlayerPage', {
        exerciseType: item.exerciseType,
        exerciseChildType: item.exerciseChildType,
        strengthLevel: item.strengthLevel,
        taskIndex: item.exerciseTaskIndex,
      });
      return;
    }
    if (item.kind === 'activity' && item.activityId) {
      navigation.navigate('ActivityDetail', { id: item.activityId });
      return;
    }
    if (item.kind === 'live' && item.liveId) {
      navigation.navigate('LiveDetail', { liveId: item.liveId });
    }
  }, [navigation, selectedDate]);

  const handleMedicationCheckIn = useCallback(async (item: CalendarTimelineItem) => {
    if (!item.canCheckIn || checkingInKey) return;

    const planItem = medicationPlanGroups
      .flatMap(group => group.items)
      .find(plan => plan.key === item.key);
    if (!planItem) return;

    setCheckingInKey(item.key);
    try {
      const res = await submitMedicationCheckIn(planItem);
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.fail((res as { msg?: string })?.msg || '打卡失败', 1.5);
        return;
      }
      Toast.success('已记录服用', 1.5);
      setMedicationPlanGroups(prev => applyMedicationCheckInToPlanGroups(prev, item.key));
    } catch {
      Toast.fail('打卡失败', 1.5);
    } finally {
      setCheckingInKey(null);
    }
  }, [checkingInKey, medicationPlanGroups]);

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.rowBox}>
          <Flex justify="between" align="center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentMonth(m => moment(m).subtract(1, 'month'))}>
              <Image source={require('@/assets/images/user/left.png')} style={styles.navIcon} />
            </TouchableOpacity>
            <Picker
              data={MONTH_PICKER_DATA}
              cols={2}
              cascade={false}
              value={[currentMonth.year(), currentMonth.month() + 1]}
              onOk={values => {
                setCurrentMonth(
                  moment({
                    year: Number(values[0]),
                    month: Number(values[1]) - 1,
                    date: 1,
                  }),
                );
              }}>
              <TouchableOpacity activeOpacity={0.7} style={styles.dayTitleBtn}>
                <Text style={styles.dayTitle}>{currentMonth.format('YYYY-MM')}</Text>
              </TouchableOpacity>
            </Picker>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentMonth(m => moment(m).add(1, 'month'))}>
              <Image source={require('@/assets/images/user/left.png')} style={styles.navIconRight} />
            </TouchableOpacity>
          </Flex>

          <View style={styles.weekHead}>
            {WEEK_LABELS.map(label => (
              <Text key={label} style={styles.weekCell}>
                {label}
              </Text>
            ))}
          </View>

          <DashedDivider />

          {loadingMonth ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : (
            <View style={styles.calendarGrid}>
              {calendarDays.map(day => {
                const dateKey = day.date.format('YYYY-MM-DD');
                const isSelected = selectedDate === dateKey;
                const isToday = day.date.isSame(moment(), 'day');
                const hasTask = hasDailyRecord(statusMap.get(dateKey));

                return (
                  <TouchableOpacity
                    key={dateKey}
                    activeOpacity={0.7}
                    style={styles.dayCell}
                    onPress={() => setSelectedDate(dateKey)}>
                    <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                      <Text
                        style={
                          isSelected
                            ? styles.dayTextSelected
                            : day.isCurrentMonth
                              ? styles.dayText
                              : styles.dayTextOther
                        }>
                        {isToday ? '今' : day.date.date()}
                      </Text>
                    </View>
                    {hasTask ? (
                      <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        {/* <Text style={styles.titleText}>{dateHeader}</Text> */}
        <ScheduleTimeline
          items={displayTimelineItems}
          loading={loadingDay || (isToday && loadingMedication)}
          isToday={isToday}
          onPressItem={handleTimelinePress}
          checkingInKey={checkingInKey}
          onMedicationCheckIn={handleMedicationCheckIn}
        />
      </ScrollView>
    </PageLayout>
  );
}
