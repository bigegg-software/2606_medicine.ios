import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/curriculum/groupTraining';
import type { RootStackParamList } from '@/route/router';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '@/src/features/exercise/utils/dietCalendarHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import CoachFilterPicker, { type CoachFilterValue } from './CoachFilterPicker';
import CourseCategoryFilterPicker, {
  type CourseCategoryFilterValue,
} from './CourseCategoryFilterPicker';
import TimeSlotFilterPicker from './TimeSlotFilterPicker';
import type { TimeSlotValue } from '../utils/timeSlotHelpers';
import {
  showBookConfirmAlert,
  showCancelConfirmAlert,
  showInsufficientBenefitAlert,
} from '../utils/bookingDialogHelpers';
import {
  fetchCourseSessionDateHasMapByYear,
  fetchCourseSessionDateHasSet,
  resolveWeekDateRange,
} from '../utils/dateHasHelpers';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchNextGroupBooking,
  fetchRecommendGroupSessions,
  resolveCardBookingId,
  type GroupSessionCardView,
  type NextBookingView,
} from '../utils/courseSessionHelpers';

type Props = {
  stationId?: string;
};

/** 集体训练 */
export default function GroupTrainingPage({ stationId }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachFilterValue | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CourseCategoryFilterValue | null>(
    null,
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotValue | null>(null);
  const [sessions, setSessions] = useState<GroupSessionCardView[]>([]);
  const [nextBooking, setNextBooking] = useState<NextBookingView | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const [dateHasSet, setDateHasSet] = useState<Set<string>>(() => new Set());
  const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
  const weekRange = useMemo(() => resolveWeekDateRange(selectedDate), [selectedDate]);

  const sessionDayRecordMarker = useMemo(
    () => ({
      color: '#6D925E',
      loadByYear: (year: number) =>
        fetchCourseSessionDateHasMapByYear({
          year,
          courseType: 'group',
          stationId,
        }),
    }),
    [stationId],
  );

  const coachFilterLabel = selectedCoach?.coachRealName?.trim() || '全部老师';
  const categoryFilterLabel =
    selectedCategory?.courseCategoryLabel?.trim() || '全部课程';
  const timeSlotFilterLabel = selectedTimeSlot?.label?.trim() || '全部时段';

  useEffect(() => {
    setSelectedCoach(null);
    setSelectedCategory(null);
    setSelectedTimeSlot(null);
  }, [stationId]);

  const loadSessions = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchRecommendGroupSessions({
        stationId: id,
        coachUserId: selectedCoach?.coachUserId,
        courseCategory: selectedCategory?.courseCategory,
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: selectedTimeSlot?.startTime,
        endTime: selectedTimeSlot?.endTime,
      });
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategory?.courseCategory,
    selectedCoach?.coachUserId,
    selectedDate,
    selectedTimeSlot?.endTime,
    selectedTimeSlot?.startTime,
    stationId,
  ]);

  const loadNextBooking = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setNextBooking(null);
      return;
    }
    try {
      const next = await fetchNextGroupBooking({ stationId: id });
      setNextBooking(next);
    } catch {
      setNextBooking(null);
    }
  }, [stationId]);

  const loadDateHas = useCallback(async () => {
    try {
      const set = await fetchCourseSessionDateHasSet({
        courseType: 'group',
        startDate: weekRange.startDate,
        endDate: weekRange.endDate,
        stationId,
      });
      setDateHasSet(set);
    } catch {
      setDateHasSet(new Set());
    }
  }, [stationId, weekRange.endDate, weekRange.startDate]);

  const refreshAfterBookingChange = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      setNextBooking(null);
      return;
    }
    try {
      const [list, next] = await Promise.all([
        fetchRecommendGroupSessions({
          stationId: id,
          coachUserId: selectedCoach?.coachUserId,
          courseCategory: selectedCategory?.courseCategory,
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: selectedTimeSlot?.startTime,
          endTime: selectedTimeSlot?.endTime,
        }),
        fetchNextGroupBooking({ stationId: id }),
      ]);
      setSessions(list);
      setNextBooking(next);
      void loadDateHas();
    } catch {
      // 保持当前列表
    }
  }, [
    loadDateHas,
    selectedCategory?.courseCategory,
    selectedCoach?.coachUserId,
    selectedDate,
    selectedTimeSlot?.endTime,
    selectedTimeSlot?.startTime,
    stationId,
  ]);

  const handleBook = useCallback(
    (card: GroupSessionCardView) => {
      if (actionSessionId) return;
      showBookConfirmAlert({
        info: card.bookingInfo,
        courseType: 'group',
        onConfirm: () => {
          void (async () => {
            setActionSessionId(card.sessionId);
            try {
              const result = await bookPrivateSession(card.sessionId);
              if (!result.ok) {
                if (result.insufficientBenefit) {
                  showInsufficientBenefitAlert({
                    courseType: 'group',
                    remainCount: result.remainCount ?? 0,
                    needCount: result.needCount ?? 1,
                  });
                  return;
                }
                Toast.show(result.msg || '预约失败', 1.5);
                return;
              }
              Toast.show('预约成功', 1.5);
              await refreshAfterBookingChange();
            } finally {
              setActionSessionId(null);
            }
          })();
        },
      });
    },
    [actionSessionId, refreshAfterBookingChange],
  );

  const handleCancel = useCallback(
    (card: GroupSessionCardView) => {
      if (actionSessionId) return;
      const bookingId = resolveCardBookingId(card, nextBooking);
      if (!bookingId) {
        Toast.show('请到我的预约中取消', 1.5);
        return;
      }
      showCancelConfirmAlert({
        info: card.bookingInfo,
        courseType: 'group',
        onConfirm: () => {
          void (async () => {
            setActionSessionId(card.sessionId);
            try {
              const result = await cancelPrivateBooking(bookingId);
              if (!result.ok) {
                Toast.show(result.msg || '取消失败', 1.5);
                return;
              }
              Toast.show('已取消预约', 1.5);
              await refreshAfterBookingChange();
            } finally {
              setActionSessionId(null);
            }
          })();
        },
      });
    },
    [actionSessionId, nextBooking, refreshAfterBookingChange],
  );

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    void loadNextBooking();
  }, [loadNextBooking]);

  useEffect(() => {
    void loadDateHas();
  }, [loadDateHas]);

  return (
    <View style={styles.tabPage}>
      <DietDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
        dayRecordMarker={sessionDayRecordMarker}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Flex justify="between" style={styles.calendarBox}>
          {weekDays.map(item => {
            const isActive = item.key === selectedDate;
            const hasSession = dateHasSet.has(item.key);
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                style={[styles.calendarCol, isActive && styles.calendarColActive]}
                onPress={() => setSelectedDate(item.key)}
              >
                <Text style={isActive ? styles.calendarTitleActive : styles.calendarTitle}>
                  {item.label}
                </Text>
                <Text style={isActive ? styles.calendarSubtitleActive : styles.calendarSubtitle}>
                  {item.day}
                </Text>
                <View style={styles.calendarDotWrap}>
                  {hasSession ? <View style={styles.calendarDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.calendarCol}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.calendarTitle}>日期</Text>
            <Image
              style={styles.calendarImage}
              source={require('@/assets/images/nutrition/time.png')}
            />
          </TouchableOpacity>
        </Flex>

        <Flex justify="between" align="center" style={styles.filterRow}>
          <Flex style={styles.filterChipRow}>
            <CourseCategoryFilterPicker
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              <TouchableOpacity activeOpacity={0.7} style={styles.filterChip}>
                <Flex align="center">
                  <Text style={styles.filterChipText} numberOfLines={1}>
                    {categoryFilterLabel}
                  </Text>
                  <Image
                    style={styles.filterChipIcon}
                    source={require('@/assets/images/curriculum/arrow_down.png')}
                  />
                </Flex>
              </TouchableOpacity>
            </CourseCategoryFilterPicker>
            <CoachFilterPicker
              stationId={stationId}
              courseType="group"
              value={selectedCoach}
              onChange={setSelectedCoach}
            >
              <TouchableOpacity activeOpacity={0.7} style={styles.filterChip}>
                <Flex align="center">
                  <Text style={styles.filterChipText} numberOfLines={1}>
                    {coachFilterLabel}
                  </Text>
                  <Image
                    style={styles.filterChipIcon}
                    source={require('@/assets/images/curriculum/arrow_down.png')}
                  />
                </Flex>
              </TouchableOpacity>
            </CoachFilterPicker>
            <TimeSlotFilterPicker value={selectedTimeSlot} onChange={setSelectedTimeSlot}>
              <TouchableOpacity activeOpacity={0.7} style={styles.filterChip}>
                <Flex align="center">
                  <Text style={styles.filterChipText} numberOfLines={1}>
                    {timeSlotFilterLabel}
                  </Text>
                  <Image
                    style={styles.filterChipIcon}
                    source={require('@/assets/images/curriculum/arrow_down.png')}
                  />
                </Flex>
              </TouchableOpacity>
            </TimeSlotFilterPicker>
          </Flex>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyBookingPage')}
          >
            <Flex align="center">
              <Text style={styles.myBookingText}>我的预约</Text>
              <Image
                style={styles.myBookingIcon}
                source={require('@/assets/images/curriculum/arrow_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </Flex>

        <ImageBackground
          source={require('@/assets/images/curriculum/jt.png')}
          style={styles.imgBackground}
          imageStyle={styles.imgBackgroundImage}
        >
          <Text style={styles.groupBannerTitle}>为持续巩固而练</Text>
          <Text style={styles.groupBannerDesc}>
            {'在康复老师带领下\n以更轻松的节奏保持力量\n平衡与身体控制。'}
          </Text>
        </ImageBackground>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : !stationId?.trim() ? (
          <View style={{ paddingTop: 40 }}>
            <EmptyRecord text="请先选择服务站" />
          </View>
        ) : sessions.length === 0 ? (
          <View style={{ paddingTop: 40 }}>
            <EmptyRecord text="暂无集体课" />
          </View>
        ) : (
          sessions.map(card => (
            <TouchableOpacity
              key={card.key}
              activeOpacity={0.85}
              style={styles.classCard}
              onPress={() =>
                navigation.navigate('GroupCourseDetail', {
                  sessionId: card.sessionId,
                })
              }
            >
              <Image
                source={
                  card.coverUri
                    ? { uri: card.coverUri }
                    : require('@/assets/images/curriculum/xb1.png')
                }
                style={styles.classCover}
                resizeMode="cover"
              />
              <View style={styles.classBody}>
                <Flex justify="between" align="center" style={styles.classTitleRow}>
                  <Text style={styles.classTitle} numberOfLines={1}>
                    {card.title}
                  </Text>
                  <Flex style={styles.classTag}>
                    <Image
                      style={styles.classTagIcon}
                      source={require('@/assets/images/exercise/hs.png')}
                    />
                    <Text style={styles.classTagText}>适合你</Text>
                  </Flex>
                </Flex>

                <Flex justify="between" align="center" style={styles.classMetaRow}>
                  <Text style={styles.classMetaLeft} numberOfLines={1}>
                    {card.coachMeta}
                  </Text>
                  <View style={styles.classMetaRight}>
                    <Image
                      style={styles.classMetaIcon}
                      source={require('@/assets/images/curriculum/bm.png')}
                    />
                    <Text style={styles.classMetaRightText}>{card.enrollText}</Text>
                  </View>
                </Flex>

                <View style={styles.classDashWrap}>
                  <View style={styles.classDash} />
                </View>

                <Flex justify="between" align="center" style={styles.classBottomRow}>
                  <View style={styles.classBottomLeft}>
                    <Text style={styles.classTime}>{card.time}</Text>
                    <View style={styles.classBenefitRow}>
                      <Image
                        style={styles.classBenefitIcon}
                        source={require('@/assets/images/curriculum/qy.png')}
                      />
                      <Text style={styles.classBenefitText}>{card.benefitText}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.classBookBtn}
                    disabled={actionSessionId === card.sessionId}
                    onPress={() => {
                      if (card.bookedByMe) {
                        handleCancel(card);
                      } else {
                        handleBook(card);
                      }
                    }}
                  >
                    <Text style={styles.classBookBtnText}>
                      {actionSessionId === card.sessionId
                        ? '处理中...'
                        : card.bookedByMe
                          ? '取消预约'
                          : '预约参加'}
                    </Text>
                  </TouchableOpacity>
                </Flex>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>和熟悉的老师一起，把训练变成生活的一部分</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </View>
  );
}
