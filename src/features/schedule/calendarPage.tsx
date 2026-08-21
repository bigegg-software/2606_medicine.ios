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
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/schedule/calendar';
import type { DailyRecordStatusItem } from '@/api/dailyRecordStatus';
import {
  CALENDAR_DAY_DOT_COLORS,
  buildLocalCalendarDotStatus,
  clampScheduleCalendarDate,
  clampScheduleCalendarMonth,
  getCalendarDayDotColors,
  getTimelineAxisColor,
  getTimelineStatusBtnColor,
  getTimelineStatusBtnTone,
  isScheduleCalendarMonthAtMin,
  SCHEDULE_CALENDAR_MIN_MONTH,
  TIMELINE_STATUS_DONE_COLOR,
  TIMELINE_STATUS_PENDING_COLOR,
  groupTimelineItems,
  groupTimelineItemsByTime,
  loadCalendarDayTimelineItems,
  loadDailyRecordStatusMap,
  mapTodayMedicationGroupsToTimelineItems,
  type CalendarDayLocalDotStatus,
  type CalendarTimelineItem,
} from './calendarHelpers';
import {
  buildExercisePrescriptionMetrics,
  EXERCISE_TYPE_COLORS,
  EXERCISE_TYPE_IMAGES,
  loadScheduleDictMaps,
  type ExercisePrescriptionMetricItem,
  type ScheduleDictMaps,
} from './scheduleHelpers';
import { loadCalendarDayCompleteRateProgressMap } from './calendarDayCompleteRateHelpers';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchInUsePrescription } from '@/store/actions/prescription';
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
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import { fetchFamilyBindMyList } from '@/store/actions/family';
import { loadCalendarFamilyPrescription } from './utils/calendarFamilyHelpers';
import {
  loadCalendarInUseDietRule,
  shouldForceScheduleDietDot,
  shouldForceScheduleExDot,
  isExPatientRuleActiveOnDate,
  buildUpcomingExerciseProgressMapFallback,
} from './utils/calendarDietDotHelpers';
import type { DietPatientRuleInfo } from '@/api/dietPatientRule';
import type { InUseExPatientRule } from '@/api/schedule';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;
const MIN_YEAR = moment(SCHEDULE_CALENDAR_MIN_MONTH, 'YYYY-MM').year();
const MAX_YEAR = moment().year() + 1;
const MIN_MONTH = moment(SCHEDULE_CALENDAR_MIN_MONTH, 'YYYY-MM').month() + 1;

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
type Route = RouteProp<RootStackParamList, 'CalendarPage'>;

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
  metrics,
  isToday,
  selectedDate,
  readOnly,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  metrics: ExercisePrescriptionMetricItem[];
  isToday: boolean;
  selectedDate: string;
  readOnly?: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
}) {
  const typeCards = useMemo(() => {
    const progressByType = new Map(
      metrics.map(metric => {
        const typeKey = metric.key.replace(/-\d+$/, '');
        return [typeKey, metric] as const;
      }),
    );
    const seen = new Set<string>();
    const cards: Array<{
      key: string;
      item: CalendarTimelineItem;
      progress: number;
      color: string;
    }> = [];

    for (const item of items) {
      const typeKey = item.exerciseType?.trim() ?? '';
      if (!typeKey || seen.has(typeKey)) continue;
      seen.add(typeKey);
      const metric = progressByType.get(typeKey);
      const progress = item.exerciseProgress != null
        ? item.exerciseProgress
        : (metric?.value ?? 0);
      cards.push({
        key: item.key,
        item,
        progress: Math.max(0, Math.min(100, Math.round(progress))),
        color: metric?.color ?? EXERCISE_TYPE_COLORS[typeKey] ?? '#6D925E',
      });
    }

    return cards;
  }, [items, metrics]);

  if (typeCards.length === 0) return null;
  const selectedDateLabel = moment(selectedDate).format('M月D日');

  return (
    <View style={styles.exerciseSectionWrap}>
      <Flex align="center" style={styles.exerciseDateTitle}>
        <Text style={styles.periodText}>{selectedDateLabel}</Text>
        {isToday ? <Text style={styles.todayText}>今天</Text> : null}
      </Flex>

      <Text style={styles.periodText}>随时</Text>

      <ScrollView style={styles.exerciseScroll} horizontal showsHorizontalScrollIndicator={false}>
        {typeCards.map(({ key, item, progress, color }) => {
          const exerciseIcon =
            EXERCISE_TYPE_IMAGES[item.exerciseType?.trim() ?? ''] ?? EXERCISE_TYPE_IMAGES.cardio;
          const cardBody = (
            <View style={styles.exerciseTaskCard}>
              <Flex align="center">
                <Image
                  style={styles.taskCardIcon}
                  tintColor="#333333"
                  source={exerciseIcon}
                />
                <Text style={[styles.taskCardTitle, { flex: 1 }]} numberOfLines={1}>
                  {item.exerciseTypeLabel}
                </Text>
                <Text style={styles.taskCardDesc}>{progress}%</Text>
              </Flex>
              <View style={styles.exerciseCardProgressTrack}>
                <View
                  style={[
                    styles.exerciseCardProgressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            </View>
          );

          return (
            <View key={key} style={styles.cardSide}>
              {isToday && !readOnly ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => onPressItem(item)}>
                  {cardBody}
                </TouchableOpacity>
              ) : (
                cardBody
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

function DietTimelineCard({
  item,
  readOnly,
}: {
  item: CalendarTimelineItem;
  readOnly?: boolean;
}) {
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
  const statusLabel = isRecorded ? '已记录' : readOnly ? '未记录' : '去记录';

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
  readOnly,
  checkingIn,
  onCheckIn,
}: {
  item: CalendarTimelineItem;
  readOnly?: boolean;
  checkingIn: boolean;
  onCheckIn: (item: CalendarTimelineItem) => void;
}) {
  const taken = Boolean(item.taken);
  const statusColor = getTimelineStatusBtnColor(taken ? '已服用' : '未服用');

  if (item.canCheckIn) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={checkingIn}
        style={styles.taskCardStatusButton}
        onPress={() => onCheckIn(item)}>
        {checkingIn ? (
          <ActivityIndicator color={getTimelineStatusBtnColor('已服用')} size="small" />
        ) : (
          <Flex align="center">
            <Image
              source={require('@/assets/images/schedule/select.png')}
              style={styles.taskCardStatusTakenIcon}
            />
            <Text style={[styles.taskCardStatus, { color: getTimelineStatusBtnColor('已服用') }]}>
              已服用
            </Text>
          </Flex>
        )}
      </TouchableOpacity>
    );
  }

  if (taken) {
    return (
      <View style={styles.taskCardStatusButton}>
        {readOnly ? (
          <Text style={[styles.taskCardStatus, { color: statusColor }]}>已服用</Text>
        ) : (
          <Flex align="center">
            <Image
              source={require('@/assets/images/schedule/wc.png')}
              style={styles.taskCardStatusTakenIcon}
            />
            <Text style={[styles.taskCardStatus, { color: statusColor }]}>已服用</Text>
          </Flex>
        )}
      </View>
    );
  }

  return (
    <View style={styles.taskCardStatusButton}>
      <Text style={[styles.taskCardStatus, { color: statusColor }]}>未服用</Text>
    </View>
  );
}

function TimelineCardItem({
  item,
  readOnly,
  onPressItem,
  checkingInKey,
  onMedicationCheckIn,
}: {
  item: CalendarTimelineItem;
  readOnly?: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
}) {
  const isDietItem = item.kind === 'diet';
  const isDrugItem = item.kind === 'drug';
  const isPressable = !readOnly && (isDietItem || item.kind === 'activity' || item.kind === 'live');

  if (isDrugItem) {
    return (
      <Flex style={styles.taskCard} align="center">
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1 }}
          disabled={readOnly}
          onPress={() => onPressItem(item)}>
          <Flex align="center">
            <Image style={styles.taskCardIcon} source={TIMELINE_ICONS[item.kind]} />
            <View style={{ flex: 1 }}>
              <Flex align="center" style={{ flexWrap: 'wrap' }}>
                <Text style={styles.taskCardTitle}>{item.title}</Text>
                {item.eventBasedLabel ? (
                  <Text style={styles.taskCardMedicationType}>{item.eventBasedLabel}</Text>
                ) : null}
              </Flex>
              {item.desc ? (
                <Text style={styles.taskCardDesc} numberOfLines={2}>{item.desc}</Text>
              ) : null}
            </View>
          </Flex>
        </TouchableOpacity>
        <MedicationStatus
          item={item}
          readOnly={readOnly}
          checkingIn={checkingInKey === item.key}
          onCheckIn={onMedicationCheckIn}
        />
      </Flex>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={isPressable ? 0.7 : 1}
      disabled={!isPressable}
      onPress={() => onPressItem(item)}>
      {isDietItem ? (
        <DietTimelineCard item={item} readOnly={readOnly} />
      ) : (
        <Flex style={styles.taskCard} align="center">
          <Image style={styles.taskCardIcon} source={TIMELINE_ICONS[item.kind]} />
          <View style={{ flex: 1 }}>
            <Flex align="center" style={{ flexWrap: 'wrap' }}>
              <Text style={styles.taskCardTitle}>{item.title}</Text>
            </Flex>
            {item.desc ? (
              <Text style={styles.taskCardDesc} numberOfLines={2}>{item.desc}</Text>
            ) : null}
          </View>
        </Flex>
      )}
    </TouchableOpacity>
  );
}

function LiveTimelineCard({
  items,
  readOnly,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  readOnly?: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
}) {
  return (
    <View style={styles.mergedTimelineCard}>
      {items.map((item, itemIndex) => {
        const subtitle =
          [item.liveAnchorName, item.livePlatform].filter(Boolean).join('、') || item.desc;
        const statusText = getLiveStatusText(item.liveStatus, item.liveStatusName);
        const row = (
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
        );

        if (readOnly) {
          return <View key={item.key}>{row}</View>;
        }

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => onPressItem(item)}>
            {row}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ActivityTimelineCard({
  items,
  readOnly,
  onPressItem,
}: {
  items: CalendarTimelineItem[];
  readOnly?: boolean;
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
        const row = (
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
        );

        if (readOnly) {
          return <View key={item.key}>{row}</View>;
        }

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => onPressItem(item)}>
            {row}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MedicationTimelineCard({
  items,
  readOnly,
  checkingInKey,
  checkingInAll,
  onPressItem,
  onMedicationCheckIn,
  onMedicationCheckInAll,
}: {
  items: CalendarTimelineItem[];
  readOnly?: boolean;
  checkingInKey: string | null;
  checkingInAll: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
  onMedicationCheckInAll: (items: CalendarTimelineItem[]) => void;
}) {
  const canCheckInItems = items.filter(item => item.canCheckIn);
  const allTaken = items.length > 0 && items.every(item => item.taken);

  return (
    <View style={styles.mergedTimelineCard}>
      <Flex justify="between" align="center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPressItem(items[0])}
          disabled={readOnly || items.length === 0}>
          <Flex align="center">
            <Image
              style={styles.taskCardIcon}
              source={require('@/assets/images/schedule/yy.png')}
            />
            <Text style={styles.taskCardTitle}>用药</Text>
          </Flex>
        </TouchableOpacity>
        {canCheckInItems.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.taskCardStatusButton}
            disabled={checkingInAll || checkingInKey != null}
            onPress={() => onMedicationCheckInAll(canCheckInItems)}>
            {checkingInAll ? (
              <ActivityIndicator color={TIMELINE_STATUS_PENDING_COLOR} size="small" />
            ) : (
              <Image
                source={require('@/assets/images/schedule/select.png')}
                style={styles.taskCardStatusTakenIcon}
              />
            )}
          </TouchableOpacity>
        ) : allTaken && !readOnly ? (
          <View style={styles.taskCardStatusButton}>
            <Image
              source={require('@/assets/images/schedule/wc.png')}
              style={styles.taskCardStatusTakenIcon}
            />
          </View>
        ) : null}
      </Flex>

      {items.map(item => (
        <Flex
          key={item.key}
          justify="between"
          align="center"
          style={styles.mergedTimelineCardItem}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.mergedMedicationContent}
            disabled={readOnly}
            onPress={() => onPressItem(item)}>
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
          </TouchableOpacity>
          <MedicationStatus
            item={item}
            readOnly={readOnly}
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
  readOnly,
  onPressItem,
  checkingInKey,
  checkingInGroupKey,
  onMedicationCheckIn,
  onMedicationCheckInAll,
}: {
  period: string;
  items: CalendarTimelineItem[];
  readOnly?: boolean;
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
                        readOnly={readOnly}
                        checkingInKey={checkingInKey}
                        checkingInAll={checkingInGroupKey === group.key}
                        onPressItem={onPressItem}
                        onMedicationCheckIn={onMedicationCheckIn}
                        onMedicationCheckInAll={items => onMedicationCheckInAll(items, group.key)}
                      />
                    </View>
                  ) : null}
                  {activityItems.length > 0 ? (
                    <View style={styles.cardSideBox}>
                      <ActivityTimelineCard
                        items={activityItems}
                        readOnly={readOnly}
                        onPressItem={onPressItem}
                      />
                    </View>
                  ) : null}
                  {liveItems.length > 0 ? (
                    <View style={styles.cardSideBox}>
                      <LiveTimelineCard
                        items={liveItems}
                        readOnly={readOnly}
                        onPressItem={onPressItem}
                      />
                    </View>
                  ) : null}
                  {otherItems.map(item => (
                    <View key={item.key} style={styles.cardSideBox}>
                      <TimelineCardItem
                        item={item}
                        readOnly={readOnly}
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
  exerciseMetrics,
  loading,
  isToday,
  selectedDate,
  readOnly,
  onPressItem,
  checkingInKey,
  checkingInGroupKey,
  onMedicationCheckIn,
  onMedicationCheckInAll,
}: {
  items: CalendarTimelineItem[];
  exerciseMetrics: ExercisePrescriptionMetricItem[];
  loading: boolean;
  isToday: boolean;
  selectedDate: string;
  readOnly?: boolean;
  onPressItem: (item: CalendarTimelineItem) => void;
  checkingInKey: string | null;
  checkingInGroupKey: string | null;
  onMedicationCheckIn: (item: CalendarTimelineItem) => void;
  onMedicationCheckInAll: (items: CalendarTimelineItem[], groupKey: string) => void;
}) {
  const grouped = useMemo(() => groupTimelineItems(items), [items]);
  const hasScheduledItems = grouped.morning.length > 0 || grouped.afternoon.length > 0;
  const showExerciseSection = grouped.exercise.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  if (items.length === 0 && !showExerciseSection) {
    return (
      <View style={styles.emptyTimelineBox}>
        <Text style={styles.emptyTimelineText}>当日暂无记录</Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineWrap}>
      {showExerciseSection ? (
        <ExerciseTimelineSection
          items={grouped.exercise}
          metrics={exerciseMetrics}
          isToday={isToday}
          selectedDate={selectedDate}
          readOnly={readOnly}
          onPressItem={onPressItem}
        />
      ) : null}
      {hasScheduledItems ? (
        <View style={styles.scheduledTimelineWrap}>
          <TimelineSection
            period="上午"
            items={grouped.morning}
            readOnly={readOnly}
            onPressItem={onPressItem}
            checkingInKey={checkingInKey}
            checkingInGroupKey={checkingInGroupKey}
            onMedicationCheckIn={onMedicationCheckIn}
            onMedicationCheckInAll={onMedicationCheckInAll}
          />
          <TimelineSection
            period="下午"
            items={grouped.afternoon}
            readOnly={readOnly}
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
  todayLocalStatus,
  dietRule,
  prescription,
  onSelectDate,
}: {
  calendarDays: CalendarDay[];
  selectedDate: string;
  statusMap: Map<string, DailyRecordStatusItem>;
  todayLocalStatus?: CalendarDayLocalDotStatus | null;
  /** 在用营养处方：今天～截止日打用餐点 */
  dietRule?: DietPatientRuleInfo | null;
  /** 在用运动处方：今天～截止日打运动点 */
  prescription?: InUseExPatientRule | null;
  onSelectDate: (dateKey: string) => void;
}) {
  const todayKey = moment().format('YYYY-MM-DD');

  return (
    <View style={styles.calendarGrid}>
      {calendarDays.map((day, index) => {
        const dateKey = day.date.format('YYYY-MM-DD');
        const isSelected = selectedDate === dateKey;
        const isTodayCell = dateKey === todayKey;
        const forceDiet = shouldForceScheduleDietDot(dateKey, dietRule, todayKey);
        const forceEx = shouldForceScheduleExDot(dateKey, prescription, todayKey);
        const localStatus: CalendarDayLocalDotStatus | undefined =
          forceDiet || forceEx || isTodayCell
            ? {
              ...(isTodayCell ? todayLocalStatus ?? {} : {}),
              ...(forceDiet ? { isDiet: true } : {}),
              ...(forceEx ? { isEx: true } : {}),
            }
            : undefined;
        const dayDots = getCalendarDayDotColors(
          statusMap.get(dateKey),
          localStatus,
        );
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
  const route = useRoute<Route>();
  const dispatch = useDispatch<AppDispatch>();
  const { readOnly, patientUserId, relationLabel, viewNavParams } = resolveFamilyReadOnlyView(route.params);
  const storePrescription = useSelector((state: RootState) => state.prescription.inUse);
  const [familyRule, setFamilyRule] = useState<{
    patientUserId?: string;
    rule: InUseExPatientRule | null;
  }>({ rule: null });
  const familyPrescription =
    readOnly && familyRule.patientUserId === patientUserId ? familyRule.rule : null;
  const prescription = readOnly ? familyPrescription : storePrescription;
  const [currentMonth, setCurrentMonth] = useState(() => clampScheduleCalendarMonth(moment()));
  const [selectedDate, setSelectedDate] = useState(() =>
    clampScheduleCalendarDate(moment().format('YYYY-MM-DD')),
  );
  const [statusMap, setStatusMap] = useState<Map<string, DailyRecordStatusItem>>(new Map());
  const [timelineItems, setTimelineItems] = useState<CalendarTimelineItem[]>([]);
  const [medicationPlanGroups, setMedicationPlanGroups] = useState<MedicationPlanGroupView[]>([]);
  const [exerciseDictMaps, setExerciseDictMaps] = useState<ScheduleDictMaps | null>(null);
  const [exerciseProgressMap, setExerciseProgressMap] = useState<Record<string, number>>({});
  const [todayLocalStatus, setTodayLocalStatus] = useState<CalendarDayLocalDotStatus>({});
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
  const todayDotsLockedRef = useRef(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingMedication, setLoadingMedication] = useState(false);
  const [checkingInKey, setCheckingInKey] = useState<string | null>(null);
  const [checkingInGroupKey, setCheckingInGroupKey] = useState<string | null>(null);
  const statusMapRef = useRef(statusMap);
  const currentMonthRef = useRef(currentMonth);
  const selectedDateRef = useRef(selectedDate);
  const skipFocusRefreshRef = useRef(true);
  const prescriptionRef = useRef(prescription);
  const exerciseProgressMapRef = useRef(exerciseProgressMap);
  const exerciseDictMapsRef = useRef(exerciseDictMaps);
  const dayLoadFingerprintRef = useRef('');

  statusMapRef.current = statusMap;
  currentMonthRef.current = currentMonth;
  selectedDateRef.current = selectedDate;
  prescriptionRef.current = prescription;
  exerciseProgressMapRef.current = exerciseProgressMap;
  exerciseDictMapsRef.current = exerciseDictMaps;

  const hasExercisePrescription = Boolean(prescription?.exPatientRuleId || prescription?.ruleRatioList?.length);
  const exerciseAvailableTypeKeys = useMemo(
    () => new Set(Object.keys(exerciseProgressMap)),
    [exerciseProgressMap],
  );
  const exerciseMetrics = useMemo(
    () => (hasExercisePrescription || exerciseAvailableTypeKeys.size > 0
      ? buildExercisePrescriptionMetrics(
        prescription?.ruleRatioList,
        exerciseDictMaps ?? undefined,
        exerciseProgressMap,
        { availableTypeKeys: exerciseAvailableTypeKeys },
      )
      : []),
    [
      exerciseAvailableTypeKeys,
      exerciseDictMaps,
      exerciseProgressMap,
      hasExercisePrescription,
      prescription?.ruleRatioList,
    ],
  );

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const canGoPrevMonth = !isScheduleCalendarMonthAtMin(currentMonth);
  const isToday = selectedDate === moment().format('YYYY-MM-DD');
  const displayTimelineItems = useMemo(() => {
    let items: CalendarTimelineItem[];
    if (!isToday) {
      items = timelineItems;
    } else {
      const drugItems = mapTodayMedicationGroupsToTimelineItems(medicationPlanGroups);
      const others = timelineItems.filter(item => item.kind !== 'drug');
      items = [...others, ...drugItems].sort((left, right) => left.sortValue - right.sortValue);
    }
    if (!readOnly) return items;
    return items.map(item => (item.kind === 'drug' ? { ...item, canCheckIn: false } : item));
  }, [isToday, medicationPlanGroups, readOnly, timelineItems]);

  const loadDietRuleForDots = useCallback(async () => {
    try {
      const rule = await loadCalendarInUseDietRule(
        patientUserId ? { patientUserId } : undefined,
      );
      setDietRule(rule);
    } catch {
      setDietRule(null);
    }
  }, [patientUserId]);

  const loadMonthlyOverview = useCallback(async (
    month: Moment,
    options?: { silent?: boolean },
  ) => {
    if (!options?.silent) setLoadingMonth(true);
    try {
      const map = await loadDailyRecordStatusMap(month, patientUserId ? { patientUserId } : undefined);
      setStatusMap(map);
    } catch {
      setStatusMap(new Map());
    } finally {
      if (!options?.silent) setLoadingMonth(false);
    }
  }, [patientUserId]);

  const loadExercisePrescription = useCallback(async (
    dateKey: string,
    status?: DailyRecordStatusItem,
  ) => {
    try {
      let dictMaps = exerciseDictMapsRef.current;
      let rule = prescriptionRef.current;
      const needDict = !dictMaps;
      const needRule = !rule;

      if (needDict || needRule) {
        const [nextDictMaps, nextRule] = await Promise.all([
          needDict ? loadScheduleDictMaps().catch(() => null) : Promise.resolve(dictMaps),
          needRule
            ? (readOnly
              ? loadCalendarFamilyPrescription(patientUserId)
              : dispatch(fetchInUsePrescription()))
            : Promise.resolve(rule),
        ]);
        if (needDict && nextDictMaps) {
          dictMaps = nextDictMaps;
          exerciseDictMapsRef.current = nextDictMaps;
          setExerciseDictMaps(nextDictMaps);
        }
        if (needRule) {
          rule = nextRule;
          if (readOnly) {
            setFamilyRule({ patientUserId, rule: nextRule ?? null });
          }
        }
      }

      const todayKey = moment().format('YYYY-MM-DD');
      const hasCurrentExercise = Boolean(rule?.exPatientRuleId || rule?.ruleRatioList?.length);
      const hasDayExercise = Boolean(status?.isEx);
      const inUpcomingPrescription = dateKey >= todayKey
        && hasCurrentExercise
        && isExPatientRuleActiveOnDate(rule, dateKey);
      const shouldLoadDayRate = hasDayExercise || inUpcomingPrescription;
      if (!shouldLoadDayRate) {
        setExerciseProgressMap({});
        return { rule, progressMap: {} as Record<string, number>, dictMaps };
      }

      let progressMap = await loadCalendarDayCompleteRateProgressMap(
        dateKey,
        patientUserId ? { patientUserId } : undefined,
      );
      // 今天/未来：接口无模块时按周训练安排回退，保证时间轴能渲染处方内容
      if (inUpcomingPrescription && Object.keys(progressMap).length === 0) {
        progressMap = buildUpcomingExerciseProgressMapFallback(rule, dateKey);
      }
      setExerciseProgressMap(progressMap);
      return { rule, progressMap, dictMaps };
    } catch {
      setExerciseProgressMap({});
      return null;
    }
  }, [dispatch, patientUserId, readOnly]);

  const loadDayTimeline = useCallback(async (
    dateKey: string,
    status?: DailyRecordStatusItem,
    options?: {
      prescription?: typeof prescription;
      progressMap?: Record<string, number>;
      dictMaps?: ScheduleDictMaps | null;
    },
  ) => {
    setLoadingDay(true);
    try {
      const items = await loadCalendarDayTimelineItems(dateKey, status, {
        prescription: options?.prescription ?? prescriptionRef.current,
        progressMap: options?.progressMap ?? exerciseProgressMapRef.current,
        dictMaps: options?.dictMaps ?? exerciseDictMapsRef.current ?? undefined,
        patientUserId,
      });
      setTimelineItems(items);
      return items;
    } catch {
      setTimelineItems([]);
      return [] as CalendarTimelineItem[];
    } finally {
      setLoadingDay(false);
    }
  }, [patientUserId]);

  const loadTodayMedication = useCallback(async (dateKey: string) => {
    if (dateKey !== moment().format('YYYY-MM-DD')) {
      return [] as MedicationPlanGroupView[];
    }

    setLoadingMedication(true);
    try {
      const groups = await loadMedicationPlanGroupsForDate(
        dateKey,
        undefined,
        patientUserId ? { patientUserId } : undefined,
      );
      setMedicationPlanGroups(groups);
      return groups;
    } catch {
      setMedicationPlanGroups([]);
      return [] as MedicationPlanGroupView[];
    } finally {
      setLoadingMedication(false);
    }
  }, [patientUserId]);

  const lockTodayDotsIfNeeded = useCallback((
    dateKey: string,
    items: CalendarTimelineItem[],
    groups: MedicationPlanGroupView[],
  ) => {
    if (todayDotsLockedRef.current) return;
    if (dateKey !== moment().format('YYYY-MM-DD')) return;
    const merged = [
      ...items.filter(item => item.kind !== 'drug'),
      ...mapTodayMedicationGroupsToTimelineItems(groups),
    ];
    setTodayLocalStatus(buildLocalCalendarDotStatus(merged, {
      isEx: Boolean(
        prescriptionRef.current?.exPatientRuleId
        || prescriptionRef.current?.ruleRatioList?.length,
      ),
      hasMedicationPlan: groups.length > 0,
    }));
    todayDotsLockedRef.current = true;
  }, []);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDate(clampScheduleCalendarDate(dateKey));
  }, []);

  const handleChangeMonth = useCallback((nextMonth: Moment) => {
    const month = clampScheduleCalendarMonth(nextMonth);
    setCurrentMonth(month);
    setSelectedDate(clampScheduleCalendarDate(month.format('YYYY-MM-DD')));
  }, []);

  useEffect(() => {
    if (readOnly) {
      void dispatch(fetchFamilyBindMyList());
    }
  }, [dispatch, readOnly]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: readOnly
        ? () => <FamilyRelationHeaderBadge label={relationLabel} />
        : undefined,
    });
  }, [navigation, readOnly, relationLabel]);

  useEffect(() => {
    todayDotsLockedRef.current = false;
    dayLoadFingerprintRef.current = '';
  }, [patientUserId]);

  useEffect(() => {
    void loadDietRuleForDots();
  }, [loadDietRuleForDots]);

  useEffect(() => {
    void loadMonthlyOverview(currentMonth);
  }, [currentMonth, loadMonthlyOverview]);

  // 仅随选中日期请求当日详情，避免 statusMap 回填导致进入页面重复请求
  useEffect(() => {
    void (async () => {
      const status = statusMap.get(selectedDate);
      if (selectedDate !== moment().format('YYYY-MM-DD') && status) {
        dayLoadFingerprintRef.current = `${selectedDate}|ex:${Boolean(status.isEx)}|drug:${Boolean(status.isDrug)}`;
      }
      const loaded = await loadExercisePrescription(selectedDate, status);
      const items = await loadDayTimeline(selectedDate, status, {
        prescription: loaded?.rule ?? prescriptionRef.current,
        progressMap: loaded?.progressMap ?? exerciseProgressMapRef.current,
        dictMaps: loaded?.dictMaps ?? exerciseDictMapsRef.current,
      });
      const groups = await loadTodayMedication(selectedDate);
      lockTodayDotsIfNeeded(selectedDate, items, groups);
    })();
    // statusMap 有意不作为依赖：今日时间轴不依赖 status；历史日在下方补拉
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [selectedDate, loadDayTimeline, loadTodayMedication, loadExercisePrescription, lockTodayDotsIfNeeded]);

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
      void loadDietRuleForDots();
      void (async () => {
        const status = statusMapRef.current.get(date);
        const loaded = await loadExercisePrescription(date, status);
        const items = await loadDayTimeline(date, status, {
          prescription: loaded?.rule ?? prescriptionRef.current,
          progressMap: loaded?.progressMap ?? exerciseProgressMapRef.current,
          dictMaps: loaded?.dictMaps ?? exerciseDictMapsRef.current,
        });
        const groups = await loadTodayMedication(date);
        lockTodayDotsIfNeeded(date, items, groups);
      })();
    }, [
      loadMonthlyOverview,
      loadDietRuleForDots,
      loadDayTimeline,
      loadTodayMedication,
      loadExercisePrescription,
      lockTodayDotsIfNeeded,
    ]),
  );

  // 月度 status 返回后，仅历史日且需要运动/用药时再补一次（今日跳过）
  useEffect(() => {
    if (selectedDate === moment().format('YYYY-MM-DD')) return;
    const status = statusMap.get(selectedDate);
    if (!status?.isEx && !status?.isDrug) return;
    const fingerprint = `${selectedDate}|ex:${Boolean(status.isEx)}|drug:${Boolean(status.isDrug)}`;
    if (dayLoadFingerprintRef.current === fingerprint) return;
    dayLoadFingerprintRef.current = fingerprint;
    void (async () => {
      if (status.isEx && !prescriptionRef.current?.exPatientRuleId) {
        const loaded = await loadExercisePrescription(selectedDate, status);
        await loadDayTimeline(selectedDate, status, {
          prescription: loaded?.rule ?? prescriptionRef.current,
          progressMap: loaded?.progressMap ?? exerciseProgressMapRef.current,
          dictMaps: loaded?.dictMaps ?? exerciseDictMapsRef.current,
        });
        return;
      }
      await loadDayTimeline(selectedDate, status, {
        prescription: prescriptionRef.current,
        progressMap: exerciseProgressMapRef.current,
        dictMaps: exerciseDictMapsRef.current,
      });
    })();
  }, [statusMap, selectedDate, loadDayTimeline, loadExercisePrescription]);

  const handleTimelinePress = useCallback((item: CalendarTimelineItem) => {
    if (readOnly && (item.kind === 'activity' || item.kind === 'live' || item.kind === 'drug')) {
      return;
    }
    if (item.kind === 'diet') {
      if (readOnly) return;
      if (item.mealIsRecommended) {
        navigation.navigate('MealRecognitionPage', {
          mealCategory: item.mealCategory,
        });
        return;
      }
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
      if (readOnly) return;
      navigation.navigate('PlayerPage', {
        exerciseType: item.exerciseType,
        exerciseChildType: item.exerciseChildType,
        strengthLevel: item.strengthLevel,
        taskIndex: item.exerciseTaskIndex,
      });
      return;
    }
    if (item.kind === 'drug') {
      navigation.navigate('Medication', {
        tab: 'medication',
        ...(viewNavParams ?? {}),
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
  }, [navigation, readOnly, selectedDate, viewNavParams]);

  const handleMedicationCheckIn = useCallback(async (item: CalendarTimelineItem) => {
    if (readOnly) return;
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
  }, [checkingInGroupKey, checkingInKey, medicationPlanGroups, readOnly]);

  const confirmMedicationCheckInAll = useCallback(async (
    items: CalendarTimelineItem[],
    groupKey: string,
  ) => {
    if (readOnly) return;
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
    readOnly,
    selectedDate,
  ]);

  const handleMedicationCheckInAll = useCallback((
    items: CalendarTimelineItem[],
    groupKey: string,
  ) => {
    if (readOnly) return;
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
    readOnly,
  ]);

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={[styles.rowBox, styles.mg18]}>
          <Flex justify="between" align="center">
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={!canGoPrevMonth}
              onPress={() => {
                if (!canGoPrevMonth) return;
                handleChangeMonth(moment(currentMonth).subtract(1, 'month'));
              }}
              style={[styles.navIconLeftWrap, !canGoPrevMonth && { opacity: 0.35 }]}
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
                const year = Number(values[0]);
                let month = Number(values[1]);
                if (year === MIN_YEAR && month < MIN_MONTH) {
                  month = MIN_MONTH;
                }
                handleChangeMonth(
                  moment({
                    year,
                    month: month - 1,
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
              onPress={() => handleChangeMonth(moment(currentMonth).add(1, 'month'))}
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
              todayLocalStatus={todayLocalStatus}
              dietRule={dietRule}
              prescription={prescription}
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
            exerciseMetrics={exerciseMetrics}
            loading={loadingDay || (isToday && loadingMedication)}
            isToday={isToday}
            selectedDate={selectedDate}
            readOnly={readOnly}
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
