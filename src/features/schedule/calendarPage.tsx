import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Modal, Picker, Toast } from '@ant-design/react-native';
import moment, { type Moment } from 'moment';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/schedule/calendar';
import type { DailyRecordStatusItem } from '@/api/dailyRecordStatus';
import {
  CALENDAR_DAY_DOT_COLORS,
  getCalendarDayDotColors,
  getTimelineAxisColor,
  getTimelineStatusBtnColor,
  getTimelineStatusBtnTone,
  TIMELINE_STATUS_DONE_COLOR,
  TIMELINE_STATUS_PENDING_COLOR,
  groupTimelineItems,
  groupTimelineItemsByTime,
  loadCalendarDayTimelineItems,
  loadDailyRecordStatusMap,
  mapTodayMedicationGroupsToTimelineItems,
  type CalendarTimelineItem,
} from './calendarHelpers';
import { EXERCISE_TYPE_IMAGES } from './scheduleHelpers';
import {
  applyMedicationCheckInBatchToPlanGroups,
  applyMedicationCheckInToPlanGroups,
  buildMedicationCheckInConfirmMessage,
  loadMedicationPlanGroupsForDate,
  submitMedicationCheckIn,
  type MedicationPlanGroupView,
} from '@/src/features/profile/medication/medicationHelpers';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { getActivityStatusText } from '@/src/features/community/activityHelpers';
import { getLiveStatusText } from '@/src/features/community/liveHelpers';

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
  activity: require('@/assets/images/schedule/hd.png'),
  live: require('@/assets/images/schedule/zb.png'),
};

type CalendarDay = {
  date: Moment;
  isCurrentMonth: boolean;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

function ExerciseTimelineSection({
  items,
  isToday,
  selectedDate,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  isToday: boolean;
  selectedDate: string;
  onPressItem: (item: CalendarTimelineItem) => void;
}) {
  if (items.length === 0) return null;
  const selectedDateLabel = moment(selectedDate).format('M月D日');

  return (
    <View style={styles.exerciseSectionWrap}>
      <Flex align="center" style={styles.exerciseDateTitle}>
        <Text style={styles.periodText}>{selectedDateLabel}</Text>
        {isToday ? <Text style={styles.todayText}>今天</Text> : null}
      </Flex>

      <Text style={styles.periodText}>随时</Text>

      <ScrollView style={styles.exerciseScroll} horizontal showsHorizontalScrollIndicator={false}>
        {items.map(item => {
          const exerciseIcon =
            EXERCISE_TYPE_IMAGES[item.exerciseType?.trim() ?? ''] ?? EXERCISE_TYPE_IMAGES.cardio;

          return (
            <View key={item.key} style={styles.cardSide}>
              {isToday ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onPressItem(item)}>
                  <Flex style={styles.exerciseTaskCard} align="start">
                    <Image
                      style={styles.taskCardIcon}
                      tintColor="#333333"
                      source={exerciseIcon}
                    />
                    <View style={styles.exerciseCardContent}>
                      <Flex justify="between" align="center">
                        <Text style={styles.taskCardTitle}>{item.exerciseTypeLabel}</Text>
                        {item.exerciseTargetMinutes != null && item.exerciseTargetMinutes > 0 ? (
                          <Text style={styles.taskCardDesc} numberOfLines={1}>
                            {item.exerciseDoneMinutes ?? 0}
                            <Text style={styles.taskCardDescText}>
                              /{item.exerciseTargetMinutes}分钟
                            </Text>
                          </Text>
                        ) : null}
                      </Flex>
                      <Text style={styles.taskCardDescBtm} numberOfLines={2}>{item.desc}</Text>
                    </View>
                  </Flex>
                </TouchableOpacity>
              ) : (
                <Flex style={styles.exerciseTaskCard} align="start">
                  <Image
                    style={styles.taskCardIcon}
                    tintColor="#333333"
                    source={exerciseIcon}
                  />
                  <View style={styles.exerciseCardContent}>
                    <Flex justify="between" align="center">
                      <Text style={styles.taskCardTitle}>{item.exerciseTypeLabel}</Text>
                      {item.exerciseTargetMinutes != null && item.exerciseTargetMinutes > 0 ? (
                        <Text style={styles.taskCardDesc} numberOfLines={1}>
                          {item.exerciseDoneMinutes ?? 0}
                          <Text style={styles.taskCardDescText}>
                            /{item.exerciseTargetMinutes}分钟
                          </Text>
                        </Text>
                      ) : null}
                    </Flex>
                    <Text style={styles.taskCardDescBtm} numberOfLines={2}>{item.desc}</Text>
                  </View>
                </Flex>
              )}
            </View>
          );
        })}
      </ScrollView>

    </View>
  );
}

function TimelineStatusBtn({ label }: { label: string }) {
  const tone = getTimelineStatusBtnTone(label);
  return (
    <View style={styles.activityStatusBtn}>
      <Text
        style={[
          styles.activityStatusBtnText,
          tone === 'done' && styles.activityStatusBtnTextDone,
          tone === 'pending' && styles.activityStatusBtnTextPending,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function DietTimelineCard({ item }: { item: CalendarTimelineItem }) {
  const isRecorded = !item.mealIsRecommended;
  const foods = item.mealFoods ?? [];
  const foodText = foods.length > 0
    ? foods.join('、')
    : isRecorded
      ? ''
      : (item.desc || '暂无推荐');
  const calorieText =
    item.mealCalories != null && item.mealCalories > 0
      ? `${item.mealCalories} 千卡`
      : '';
  const statusLabel = isRecorded ? '已记录' : '去记录';

  return (
    <View style={styles.mergedTimelineCard}>
      <Flex justify="between" align="center">
        <View style={styles.mergedMedicationContent}>
          <Flex align="center">
            <Image
              style={styles.taskCardIcon}
              source={item.mealIcon ?? TIMELINE_ICONS.diet}
            />
            <Text style={styles.taskCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {calorieText ? (
              <Text style={styles.dietCalorieInlineText} numberOfLines={1}>
                {calorieText}
              </Text>
            ) : null}
          </Flex>
          {foodText ? (
            <Text
              style={[styles.mergedMedicationDesc, styles.activityLocationText]}
              numberOfLines={2}>
              {foodText}
            </Text>
          ) : null}
        </View>
        <TimelineStatusBtn label={statusLabel} />
      </Flex>
    </View>
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
    const actionLabel = '已服用';
    const actionColor = getTimelineStatusBtnColor(actionLabel);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={checkingIn}
        style={styles.taskCardStatusButton}
        onPress={() => onCheckIn(item)}>
        {checkingIn ? (
          <ActivityIndicator color={actionColor} size="small" />
        ) : (
          <Flex align="center">
            <View style={styles.taskCardStatusIconWrap}>
              <View
                style={[
                  styles.taskCardStatusCircleAction,
                  { borderColor: actionColor },
                ]}
              />
            </View>
            <Text style={[styles.taskCardStatus, { color: actionColor }]}>{actionLabel}</Text>
          </Flex>
        )}
      </TouchableOpacity>
    );
  }

  const statusLabel = item.taken ? '已服用' : '未服用';
  const statusColor = getTimelineStatusBtnColor(statusLabel);

  return (
    <Flex align="center" style={item.taken ? styles.taskCardStatusTakenWrap : null}>
      <View style={styles.taskCardStatusIconWrap}>
        {item.taken ? (
          <>
            <View style={[styles.taskCardStatusCircleTaken, { borderColor: statusColor }]} />
            <Text style={[styles.taskCardStatusCheck, { color: statusColor }]}>✓</Text>
          </>
        ) : (
          <View style={[styles.taskCardStatusCircleMuted, { borderColor: statusColor }]} />
        )}
      </View>
      <Text style={[styles.taskCardStatus, { color: statusColor }]}>
        {statusLabel}
      </Text>
    </Flex>
  );
}

function TimelineCardItem({
  item,
  onPressItem,
  checkingInKey,
  onMedicationCheckIn,
}: {
  item: CalendarTimelineItem;
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
}) {
  const isDietItem = item.kind === 'diet';
  const isPressable = isDietItem || item.kind === 'activity' || item.kind === 'live';

  return (
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
  );
}

function LiveTimelineCard({
  items,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  onPressItem: (item: CalendarTimelineItem) => void;
}) {
  return (
    <View style={styles.mergedTimelineCard}>
      {items.map((item, itemIndex) => {
        const subtitle =
          [item.liveAnchorName, item.livePlatform].filter(Boolean).join('  ') || item.desc;
        const statusText = getLiveStatusText(item.liveStatus, item.liveStatusName);

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => onPressItem(item)}>
            <Flex
              justify="between"
              align="center"
              style={itemIndex > 0 ? styles.mergedTimelineCardItem : null}>
              <View style={styles.mergedMedicationContent}>
                <Flex align="center">
                  <Image
                    style={styles.taskCardIcon}
                    source={require('@/assets/images/schedule/zb.png')}
                  />
                  <Text style={styles.taskCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </Flex>
                {subtitle ? (
                  <Text style={[styles.mergedMedicationDesc, styles.activityLocationText]} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TimelineStatusBtn label={statusText} />
            </Flex>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ActivityTimelineCard({
  items,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  onPressItem: (item: CalendarTimelineItem) => void;
}) {
  return (
    <View style={styles.mergedTimelineCard}>
      {items.map((item, itemIndex) => {
        const location = item.activityLocation || item.desc;
        const statusText = getActivityStatusText(
          item.activityStatus,
          item.activityStatusName,
          item.activityIsBm,
        );

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => onPressItem(item)}>
            <Flex
              justify="between"
              align="center"
              style={itemIndex > 0 ? styles.mergedTimelineCardItem : null}>
              <View style={styles.mergedMedicationContent}>
                <Flex align="center">
                  <Image
                    style={styles.taskCardIcon}
                    source={require('@/assets/images/schedule/hd.png')}
                  />
                  <Text style={styles.taskCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </Flex>
                {location ? (
                  <Text style={[styles.mergedMedicationDesc, styles.activityLocationText]} numberOfLines={2}>
                    {location}
                  </Text>
                ) : null}
              </View>
              <TimelineStatusBtn label={statusText} />
            </Flex>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MedicationTimelineCard({
  items,
  checkingInKey,
  checkingInAll,
  onMedicationCheckIn,
  onMedicationCheckInAll,
}: {
  items: CalendarTimelineItem[];
  checkingInKey: string | null;
  checkingInAll: boolean;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
  onMedicationCheckInAll: (items: CalendarTimelineItem[]) => void;
}) {
  const canCheckInItems = items.filter(item => item.canCheckIn);
  const allTaken = items.length > 0 && items.every(item => item.taken);

  return (
    <View style={styles.mergedTimelineCard}>
      <Flex justify="between" align="center">
        <Flex align="center">
          <Image
            style={styles.taskCardIcon}
            source={require('@/assets/images/schedule/yy.png')}
          />
          <Text style={styles.taskCardTitle}>用药</Text>
        </Flex>
        {canCheckInItems.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.taskCardStatusButton}
            disabled={checkingInAll || checkingInKey != null}
            onPress={() => onMedicationCheckInAll(canCheckInItems)}>
            {checkingInAll ? (
              <ActivityIndicator color={TIMELINE_STATUS_PENDING_COLOR} size="small" />
            ) : (
              <Flex align="center">
                <View style={styles.taskCardStatusIconWrap}>
                  <View
                    style={[
                      styles.taskCardStatusCircleAction,
                      { borderColor: TIMELINE_STATUS_PENDING_COLOR },
                    ]}
                  />
                </View>
              </Flex>
            )}
          </TouchableOpacity>
        ) : allTaken ? (
          <Flex align="center">
            <View style={styles.taskCardStatusIconWrap}>
              <View
                style={[
                  styles.taskCardStatusCircleTaken,
                  { borderColor: TIMELINE_STATUS_DONE_COLOR },
                ]}
              />
              <Text style={[styles.taskCardStatusCheck, { color: TIMELINE_STATUS_DONE_COLOR }]}>
                ✓
              </Text>
            </View>
          </Flex>
        ) : null}
      </Flex>

      {items.map((item, itemIndex) => (
        <Flex
          key={item.key}
          justify="between"
          align="center"
          style={[
            styles.mergedTimelineCardItem,
          ]}>
          <View style={styles.mergedMedicationContent}>
            <Flex align="center" style={styles.mergedMedicationTitleRow}>
              <Text style={styles.mergedMedicationName} numberOfLines={1}>
                {item.title}
              </Text>
            </Flex>
            {item.desc ? (
              <Text style={styles.mergedMedicationDesc} numberOfLines={2}>
                {item.desc}
              </Text>
            ) : null}
          </View>
          <MedicationStatus
            item={item}
            checkingIn={checkingInAll || checkingInKey === item.key}
            onCheckIn={onMedicationCheckIn}
          />
        </Flex>
      ))}
    </View>
  );
}

function TimelineSection({
  period,
  items,
  onPressItem,
  checkingInKey,
  checkingInGroupKey,
  onMedicationCheckIn,
  onMedicationCheckInAll,
}: {
  period: string;
  items: CalendarTimelineItem[];
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  checkingInGroupKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
  onMedicationCheckInAll: (items: CalendarTimelineItem[], groupKey: string) => void;
}) {
  const timeGroups = useMemo(() => groupTimelineItemsByTime(items), [items]);

  if (timeGroups.length === 0) return null;

  return (
    <View style={styles.timelineSection}>
      <View style={styles.periodRow}>
        <Text style={styles.periodText}>{period}</Text>
      </View>

      <View style={styles.sectionItems}>
        {timeGroups.map((group, groupIndex) => {
          const isLast = groupIndex === timeGroups.length - 1;
          const medicationItems = group.items.filter(item => item.kind === 'drug');
          const activityItems = group.items.filter(item => item.kind === 'activity');
          const liveItems = group.items.filter(item => item.kind === 'live');
          const otherItems = group.items.filter(
            item => item.kind !== 'drug' && item.kind !== 'activity' && item.kind !== 'live',
          );

          return (
            <View
              key={group.key}
              style={[styles.timelineRow, !isLast && styles.timelineRowGap]}>
              <View style={styles.axisCol}>
                <View
                  style={[
                    styles.timeAxisLine,
                    { backgroundColor: getTimelineAxisColor(group.items) },
                  ]}
                />
                {!isLast ? <View style={styles.axisSegment} /> : null}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timeText}>{group.time}</Text>
                <View style={styles.cardSideList}>
                  {medicationItems.length > 0 ? (
                    <View style={styles.cardSideBox}>
                      <MedicationTimelineCard
                        items={medicationItems}
                        checkingInKey={checkingInKey}
                        checkingInAll={checkingInGroupKey === group.key}
                        onMedicationCheckIn={onMedicationCheckIn}
                        onMedicationCheckInAll={items => onMedicationCheckInAll(items, group.key)}
                      />
                    </View>
                  ) : null}
                  {activityItems.length > 0 ? (
                    <View style={styles.cardSideBox}>
                      <ActivityTimelineCard
                        items={activityItems}
                        onPressItem={onPressItem}
                      />
                    </View>
                  ) : null}
                  {liveItems.length > 0 ? (
                    <View style={styles.cardSideBox}>
                      <LiveTimelineCard
                        items={liveItems}
                        onPressItem={onPressItem}
                      />
                    </View>
                  ) : null}
                  {otherItems.map(item => (
                    <View key={item.key} style={styles.cardSideBox}>
                      <TimelineCardItem
                        item={item}
                        onPressItem={onPressItem}
                        checkingInKey={checkingInKey}
                        onMedicationCheckIn={onMedicationCheckIn}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ScheduleTimeline({
  items,
  loading,
  isToday,
  selectedDate,
  onPressItem,
  checkingInKey,
  checkingInGroupKey,
  onMedicationCheckIn,
  onMedicationCheckInAll,
}: {
  items: CalendarTimelineItem[];
  loading: boolean;
  isToday: boolean;
  selectedDate: string;
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  checkingInGroupKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
  onMedicationCheckInAll: (items: CalendarTimelineItem[], groupKey: string) => void;
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
          selectedDate={selectedDate}
          onPressItem={onPressItem}
        />
      ) : null}
      {hasScheduledItems ? (
        <View style={styles.scheduledTimelineWrap}>
          <TimelineSection
            period="上午"
            items={grouped.morning}
            onPressItem={onPressItem}
            checkingInKey={checkingInKey}
            checkingInGroupKey={checkingInGroupKey}
            onMedicationCheckIn={onMedicationCheckIn}
            onMedicationCheckInAll={onMedicationCheckInAll}
          />
          <TimelineSection
            period="下午"
            items={grouped.afternoon}
            onPressItem={onPressItem}
            checkingInKey={checkingInKey}
            checkingInGroupKey={checkingInGroupKey}
            onMedicationCheckIn={onMedicationCheckIn}
            onMedicationCheckInAll={onMedicationCheckInAll}
          />
        </View>
      ) : null}
    </View>
  );
}

function CalendarMonthGrid({
  calendarDays,
  selectedDate,
  statusMap,
  onSelectDate,
}: {
  calendarDays: CalendarDay[];
  selectedDate: string;
  statusMap: Map<string, DailyRecordStatusItem>;
  onSelectDate: (dateKey: string) => void;
}) {
  const todayKey = moment().format('YYYY-MM-DD');

  return (
    <View style={styles.calendarGrid}>
      {calendarDays.map((day, index) => {
        const dateKey = day.date.format('YYYY-MM-DD');
        const isSelected = selectedDate === dateKey;
        const isTodayCell = dateKey === todayKey;
        const dayDots = getCalendarDayDotColors(statusMap.get(dateKey));
        const overlapDots = dayDots.length >= 4;
        const isFirstRow = index < 7;

        return (
          <TouchableOpacity
            key={dateKey}
            activeOpacity={0.7}
            style={[styles.dayCell, isFirstRow && styles.dayCellFirstRow]}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            onPress={() => onSelectDate(dateKey)}>
            <View style={[styles.dayInner, isSelected && styles.daySelected]}>
              <Text
                style={
                  isSelected
                    ? styles.dayTextSelected
                    : day.isCurrentMonth
                      ? styles.dayText
                      : styles.dayTextOther
                }>
                {isTodayCell ? '今' : day.date.date()}
              </Text>
            </View>
            <Flex
              style={[
                styles.dayDotWrap,
                overlapDots ? styles.dayDotWrapOverlap : styles.dayDotWrapGap,
              ]}>
              {dayDots.map((color, index) => (
                <View
                  key={`${dateKey}-${color}-${index}`}
                  style={[
                    styles.dayDot,
                    { backgroundColor: color },
                    overlapDots && index > 0 ? styles.dayDotOverlap : null,
                  ]}
                />
              ))}
            </Flex>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MemoCalendarMonthGrid = React.memo(CalendarMonthGrid);

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
  const [checkingInGroupKey, setCheckingInGroupKey] = useState<string | null>(null);
  const statusMapRef = useRef(statusMap);
  const currentMonthRef = useRef(currentMonth);
  const selectedDateRef = useRef(selectedDate);
  const skipFocusRefreshRef = useRef(true);

  statusMapRef.current = statusMap;
  currentMonthRef.current = currentMonth;
  selectedDateRef.current = selectedDate;

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const isToday = selectedDate === moment().format('YYYY-MM-DD');
  const displayTimelineItems = useMemo(() => {
    if (!isToday) return timelineItems;
    const drugItems = mapTodayMedicationGroupsToTimelineItems(medicationPlanGroups);
    const others = timelineItems.filter(item => item.kind !== 'drug');
    return [...others, ...drugItems].sort((left, right) => left.sortValue - right.sortValue);
  }, [isToday, medicationPlanGroups, timelineItems]);

  const loadMonthlyOverview = useCallback(async (
    month: Moment,
    options?: { silent?: boolean },
  ) => {
    if (!options?.silent) setLoadingMonth(true);
    try {
      const map = await loadDailyRecordStatusMap(month);
      setStatusMap(map);
    } catch {
      setStatusMap(new Map());
    } finally {
      if (!options?.silent) setLoadingMonth(false);
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

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
  }, []);

  useEffect(() => {
    void loadMonthlyOverview(currentMonth);
  }, [currentMonth, loadMonthlyOverview]);

  // 仅随选中日期请求当日详情，避免 statusMap 回填导致进入页面重复请求
  useEffect(() => {
    void loadDayTimeline(selectedDate, statusMap.get(selectedDate));
    void loadTodayMedication(selectedDate);
    // statusMap 有意不作为依赖：今日时间轴不依赖 status；历史日在下方补拉
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [selectedDate, loadDayTimeline, loadTodayMedication]);

  // 从记餐等页面返回时刷新；勿把 selectedDate 放进依赖，否则切日期会误触发整月重载
  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      const month = currentMonthRef.current;
      const date = selectedDateRef.current;
      void loadMonthlyOverview(month, { silent: true });
      void loadDayTimeline(date, statusMapRef.current.get(date));
      void loadTodayMedication(date);
    }, [loadMonthlyOverview, loadDayTimeline, loadTodayMedication]),
  );

  // 月度 status 返回后，仅历史日且需要运动/用药时再补一次（今日跳过）
  useEffect(() => {
    if (selectedDate === moment().format('YYYY-MM-DD')) return;
    const status = statusMap.get(selectedDate);
    if (!status?.isEx && !status?.isDrug) return;
    void loadDayTimeline(selectedDate, status);
  }, [statusMap, selectedDate, loadDayTimeline]);

  const handleTimelinePress = useCallback((item: CalendarTimelineItem) => {
    if (item.kind === 'diet') {
      if (item.mealIsRecommended) {
        navigation.navigate('MealRecognitionPage', {
          mealCategory: item.mealCategory,
        });
        return;
      }
      // 延后一帧再跳转，减轻日历重页与转场叠在同一帧的卡顿
      requestAnimationFrame(() => {
        navigation.navigate('MealDayDetailPage', {
          customerLocalDate: selectedDate,
        });
      });
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
    if (!item.canCheckIn || checkingInKey || checkingInGroupKey) return;

    const planItem = medicationPlanGroups
      .flatMap(group => group.items)
      .find(plan => plan.key === item.key);
    if (!planItem) return;

    setCheckingInKey(item.key);
    try {
      const res = await submitMedicationCheckIn(planItem);
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '打卡失败', 1.5);
        return;
      }
      Toast.success('已记录服用', 1.5);
      setMedicationPlanGroups(prev => applyMedicationCheckInToPlanGroups(prev, item.key));
    } catch {
      Toast.show('打卡失败', 1.5);
    } finally {
      setCheckingInKey(null);
    }
  }, [checkingInGroupKey, checkingInKey, medicationPlanGroups]);

  const confirmMedicationCheckInAll = useCallback(async (
    items: CalendarTimelineItem[],
    groupKey: string,
  ) => {
    if (items.length === 0 || checkingInKey || checkingInGroupKey) return;

    const planItems = medicationPlanGroups
      .flatMap(group => group.items)
      .filter(plan => items.some(item => item.key === plan.key && item.canCheckIn));
    if (planItems.length === 0) return;

    setCheckingInGroupKey(groupKey);
    try {
      const results = await Promise.all(planItems.map(item => submitMedicationCheckIn(item)));
      const failedCount = results.filter(res => !isResourceApiOk(res as { code?: number })).length;
      if (failedCount > 0) {
        Toast.show(failedCount === planItems.length ? '打卡失败' : '部分打卡失败', 1.5);
        await loadTodayMedication(selectedDate);
        return;
      }
      Toast.success('已全部标记为已服用', 1.5);
      setMedicationPlanGroups(prev =>
        applyMedicationCheckInBatchToPlanGroups(prev, planItems.map(item => item.key)),
      );
    } catch {
      Toast.show('打卡失败', 1.5);
    } finally {
      setCheckingInGroupKey(null);
    }
  }, [
    checkingInGroupKey,
    checkingInKey,
    loadTodayMedication,
    medicationPlanGroups,
    selectedDate,
  ]);

  const handleMedicationCheckInAll = useCallback((
    items: CalendarTimelineItem[],
    groupKey: string,
  ) => {
    if (items.length === 0 || checkingInKey || checkingInGroupKey) return;

    const planItems = medicationPlanGroups
      .flatMap(group => group.items)
      .filter(plan => items.some(item => item.key === plan.key && item.canCheckIn));
    if (planItems.length === 0) return;

    Modal.alert('', buildMedicationCheckInConfirmMessage(planItems), [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => void confirmMedicationCheckInAll(items, groupKey),
      },
    ]);
  }, [
    checkingInGroupKey,
    checkingInKey,
    confirmMedicationCheckInAll,
    medicationPlanGroups,
  ]);

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={[styles.rowBox, styles.mg18]}>
          <Flex justify="between" align="center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentMonth(m => moment(m).subtract(1, 'month'))}
              style={styles.navIconLeftWrap}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image source={require('@/assets/images/schedule/icon_left.png')} style={styles.navIcon} />
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
              onPress={() => setCurrentMonth(m => moment(m).add(1, 'month'))}
              style={styles.navIconRightWrap}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image source={require('@/assets/images/schedule/icon_right.png')} style={styles.navIcon} />
            </TouchableOpacity>
          </Flex>

          <View style={styles.weekHead}>
            {WEEK_LABELS.map(label => (
              <Flex key={label} style={styles.weekCellWrap}>
                <Text style={styles.weekCell}>
                  {label}
                </Text>
              </Flex>
            ))}
          </View>

          {loadingMonth ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : (
            <MemoCalendarMonthGrid
              calendarDays={calendarDays}
              selectedDate={selectedDate}
              statusMap={statusMap}
              onSelectDate={handleSelectDate}
            />
          )}
        </View>
        <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.calendarBack}>
          <Flex style={{ gap: 30, flex: 1 }} justify="center">
            <Flex>
              <View style={[styles.typeColor, { backgroundColor: CALENDAR_DAY_DOT_COLORS.diet }]} />
              <Text style={styles.typeText}>用餐</Text>
            </Flex>
            <Flex>
              <View style={[styles.typeColor, { backgroundColor: CALENDAR_DAY_DOT_COLORS.drug }]} />
              <Text style={styles.typeText}>用药</Text>
            </Flex>
            <Flex>
              <View style={[styles.typeColor, { backgroundColor: CALENDAR_DAY_DOT_COLORS.ex }]} />
              <Text style={styles.typeText}>运动</Text>
            </Flex>
            <Flex>
              <View style={[styles.typeColor, { backgroundColor: CALENDAR_DAY_DOT_COLORS.other }]} />
              <Text style={styles.typeText}>其他</Text>
            </Flex>
          </Flex>
        </ImageBackground>

        <View style={[styles.rowBox, { marginTop: 0 }, styles.mg18]}>
          <ScheduleTimeline
            items={displayTimelineItems}
            loading={loadingDay || (isToday && loadingMedication)}
            isToday={isToday}
            selectedDate={selectedDate}
            onPressItem={handleTimelinePress}
            checkingInKey={checkingInKey}
            checkingInGroupKey={checkingInGroupKey}
            onMedicationCheckIn={handleMedicationCheckIn}
            onMedicationCheckInAll={handleMedicationCheckInAll}
          />
        </View>
      </ScrollView>
    </PageLayout>
  );
}
