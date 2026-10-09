import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import styles from '@/css/curriculum/privateTraining';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import store from '@/store/store';
import { fetchUserInfo } from '@/store/actions/user';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '@/src/features/exercise/utils/dietCalendarHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import CoachFilterPicker, { type CoachFilterValue } from './CoachFilterPicker';
import TimeSlotFilterPicker from './TimeSlotFilterPicker';
import type { TimeSlotValue } from '../utils/timeSlotHelpers';
import { resolveSessionAction } from '../utils/sessionActionHelpers';
import {
  showBookConfirmAlert,
  showCancelConfirmAlert,
  showInsufficientBenefitAlert,
  tryShowInsufficientBenefitAlert,
} from '../utils/bookingDialogHelpers';
import {
  fetchCourseSessionDateHasMapByYear,
  fetchCourseSessionDateHasSet,
  resolveWeekDateRange,
} from '../utils/dateHasHelpers';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchNextPrivateBooking,
  fetchRecommendPrivateSessions,
  formatPrivateBenefitRemainParts,
  resolveCardBookingId,
  type NextBookingView,
  type PrivateSessionCardView,
} from '../utils/courseSessionHelpers';

type Props = {
  stationId?: string;
  isActive?: boolean;
};

/** 无教练头像时与预约教练页一致的默认头像 */
const DEFAULT_COACH_AVATAR = getDefaultAvatarByGender();

function getCoachActionStyles(tone: ReturnType<typeof resolveSessionAction>['tone']) {
  switch (tone) {
    case 'booked':
      return { btn: styles.coachBookBtnBooked, text: styles.coachBookBtnBookedText };
    case 'deadline':
      return { btn: styles.coachBookBtnDeadline, text: styles.coachBookBtnDeadlineText };
    case 'ongoing':
      return { btn: styles.coachBookBtnOngoing, text: styles.coachBookBtnOngoingText };
    case 'ended':
      return { btn: styles.coachBookBtnEnded, text: styles.coachBookBtnEndedText };
    case 'full':
      return { btn: styles.coachBookBtnFull, text: styles.coachBookBtnFullText };
    case 'book':
    default:
      return { btn: null, text: null };
  }
}

/** 私教训练 */
export default function PrivateTrainingPage({ stationId, isActive = true }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const privateRemainCount = useSelector(
    (state: RootState) => state.user.systemUser?.privateCoachTotalCount,
  );
  const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachFilterValue | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotValue | null>(null);
  const [sessions, setSessions] = useState<PrivateSessionCardView[]>([]);
  const [nextBooking, setNextBooking] = useState<NextBookingView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const [dateHasSet, setDateHasSet] = useState<Set<string>>(() => new Set());
  const pageNumRef = useRef(1);
  const excludeSessionIdsRef = useRef('');
  const hasMoreRef = useRef(false);
  const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
  const weekRange = useMemo(() => resolveWeekDateRange(selectedDate), [selectedDate]);

  const sessionDayRecordMarker = useMemo(
    () => ({
      color: '#6D925E',
      loadByYear: (year: number) =>
        fetchCourseSessionDateHasMapByYear({
          year,
          courseType: 'private',
          stationId,
        }),
    }),
    [stationId],
  );

  const coachFilterLabel = selectedCoach?.coachRealName?.trim() || '全部老师';
  const timeSlotFilterLabel = selectedTimeSlot?.label?.trim() || '全部时段';

  useEffect(() => {
    setSelectedCoach(null);
    setSelectedTimeSlot(null);
  }, [stationId]);

  const loadSessions = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      pageNumRef.current = 1;
      excludeSessionIdsRef.current = '';
      hasMoreRef.current = false;
      return;
    }
    setLoading(true);
    try {
      const result = await fetchRecommendPrivateSessions({
        stationId: id,
        coachUserId: selectedCoach?.coachUserId,
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: selectedTimeSlot?.startTime,
        endTime: selectedTimeSlot?.endTime,
        privateRemainCount,
        pageNum: 1,
      });
      setSessions(result.cards);
      pageNumRef.current = 1;
      excludeSessionIdsRef.current = result.excludeSessionIds;
      hasMoreRef.current = result.hasMore;
    } catch {
      setSessions([]);
      pageNumRef.current = 1;
      excludeSessionIdsRef.current = '';
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [
    privateRemainCount,
    selectedCoach?.coachUserId,
    selectedDate,
    selectedTimeSlot?.endTime,
    selectedTimeSlot?.startTime,
    stationId,
  ]);

  const loadMoreSessions = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id || !hasMoreRef.current || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = pageNumRef.current + 1;
      const result = await fetchRecommendPrivateSessions({
        stationId: id,
        coachUserId: selectedCoach?.coachUserId,
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: selectedTimeSlot?.startTime,
        endTime: selectedTimeSlot?.endTime,
        privateRemainCount,
        pageNum: nextPage,
        excludeSessionIds: excludeSessionIdsRef.current,
      });
      setSessions(prev => {
        const seen = new Set(prev.map(card => card.sessionId));
        return [...prev, ...result.cards.filter(card => !seen.has(card.sessionId))];
      });
      pageNumRef.current = nextPage;
      hasMoreRef.current = result.hasMore;
    } catch {
      // 保持已加载列表
    } finally {
      setLoadingMore(false);
    }
  }, [
    loading,
    loadingMore,
    privateRemainCount,
    selectedCoach?.coachUserId,
    selectedDate,
    selectedTimeSlot?.endTime,
    selectedTimeSlot?.startTime,
    stationId,
  ]);

  const handleSessionScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom < 120) {
        void loadMoreSessions();
      }
    },
    [loadMoreSessions],
  );

  const loadNextBooking = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setNextBooking(null);
      return;
    }
    try {
      const next = await fetchNextPrivateBooking({ stationId: id });
      setNextBooking(next);
    } catch {
      setNextBooking(null);
    }
  }, [stationId]);

  const loadDateHas = useCallback(async () => {
    try {
      const set = await fetchCourseSessionDateHasSet({
        courseType: 'private',
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
      await dispatch(fetchUserInfo());
      const remain =
        store.getState().user.systemUser?.privateCoachTotalCount ?? privateRemainCount;
      const [listResult, next] = await Promise.all([
        fetchRecommendPrivateSessions({
          stationId: id,
          coachUserId: selectedCoach?.coachUserId,
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: selectedTimeSlot?.startTime,
          endTime: selectedTimeSlot?.endTime,
          privateRemainCount: remain,
          pageNum: 1,
        }),
        fetchNextPrivateBooking({ stationId: id }),
      ]);
      setSessions(listResult.cards);
      pageNumRef.current = 1;
      excludeSessionIdsRef.current = listResult.excludeSessionIds;
      hasMoreRef.current = listResult.hasMore;
      setNextBooking(next);
      void loadDateHas();
    } catch {
      // 保持当前列表，避免预约成功后闪空
    }
  }, [
    dispatch,
    loadDateHas,
    privateRemainCount,
    selectedCoach?.coachUserId,
    selectedDate,
    selectedTimeSlot?.endTime,
    selectedTimeSlot?.startTime,
    stationId,
  ]);

  const handleBook = useCallback(
    (card: PrivateSessionCardView) => {
      if (actionSessionId) return;
      const openBenefits = () => navigation.navigate('MemberBenefitsPage');
      if (
        tryShowInsufficientBenefitAlert({
          courseType: 'private',
          remainCount: privateRemainCount,
          needCount: 1,
          onViewBenefit: openBenefits,
        })
      ) {
        return;
      }
      showBookConfirmAlert({
        info: card.bookingInfo,
        courseType: 'private',
        onConfirm: () => {
          void (async () => {
            setActionSessionId(card.sessionId);
            try {
              const result = await bookPrivateSession(card.sessionId);
              if (!result.ok) {
                if (result.insufficientBenefit) {
                  showInsufficientBenefitAlert({
                    courseType: 'private',
                    remainCount: result.remainCount ?? 0,
                    needCount: result.needCount ?? 1,
                    onViewBenefit: openBenefits,
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
    [actionSessionId, navigation, privateRemainCount, refreshAfterBookingChange],
  );

  const handleCancel = useCallback(
    (card: PrivateSessionCardView) => {
      if (actionSessionId) return;
      const bookingId = resolveCardBookingId(card, nextBooking);
      if (!bookingId) {
        Toast.show('请到我的预约中取消', 1.5);
        return;
      }
      showCancelConfirmAlert({
        info: card.bookingInfo,
        courseType: 'private',
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
    if (!isActive) return;
    void loadSessions();
  }, [isActive, loadSessions]);

  useEffect(() => {
    if (!isActive) return;
    void loadNextBooking();
  }, [isActive, loadNextBooking]);

  useEffect(() => {
    if (!isActive) return;
    void loadDateHas();
  }, [isActive, loadDateHas]);

  /** 从详情预约/取消返回时刷新列表与权益（首屏由上方 effect 负责，避免重复请求） */
  const skipFocusRefreshRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!isActive) return;
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void refreshAfterBookingChange();
    }, [isActive, refreshAfterBookingChange]),
  );

  return (
    <View style={styles.tabPage}>
      <DietDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
        dayRecordMarker={sessionDayRecordMarker}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleSessionScroll}
        scrollEventThrottle={16}
      >
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
            <CoachFilterPicker
              stationId={stationId}
              courseType="private"
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
            <EmptyRecord text="暂无私教课" />
          </View>
        ) : (
          sessions.map((card, index) => {
            const action = resolveSessionAction({
              status: card.status,
              bookedByMe: card.bookedByMe,
              bookLabel: `预约${card.name}`,
              bookedLabel: '取消预约',
            });
            const actionStyles = getCoachActionStyles(action.tone);
            const busy = actionSessionId === card.sessionId;
            const coverUri = card.coverUri?.trim() || card.avatarUri?.trim() || '';
            const benefitParts = formatPrivateBenefitRemainParts(privateRemainCount);
            return (
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.85}
                style={[styles.coachCard, index === 0 ? styles.coachCardFirst : styles.coachCardRest]}
                onPress={() =>
                  navigation.navigate('PrivateCourseDetail', {
                    sessionId: card.sessionId,
                  })
                }
              >
                <View style={styles.coachCoverWrap}>
                  <Image
                    style={styles.coachCover}
                    source={coverUri ? { uri: coverUri } : DEFAULT_COACH_AVATAR}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.coachInfo}>
                  <Flex align="center" style={styles.coachNameRow}>
                    <Text style={styles.coachName} numberOfLines={1}>
                      {card.name}
                    </Text>
                    {card.tag ? (
                      <View style={styles.coachTag}>
                        <Text style={styles.coachTagText}>{card.tag}</Text>
                      </View>
                    ) : null}
                  </Flex>
                  {card.desc ? (
                    <Text style={styles.coachDesc} numberOfLines={2}>
                      {card.desc}
                    </Text>
                  ) : null}
                  <View style={styles.coachDivider} />
                  <Text style={styles.coachTime}>{card.time}</Text>
                  <Text style={styles.coachTopic} numberOfLines={1}>
                    {card.topic}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.coachBookBtn, actionStyles.btn]}
                    disabled={busy || !action.pressable}
                    onPress={() => {
                      if (!action.pressable || busy) return;
                      if (card.bookedByMe) {
                        handleCancel(card);
                      } else {
                        handleBook(card);
                      }
                    }}
                  >
                    <Text style={[styles.coachBookBtnText, actionStyles.text]}>
                      {busy ? '处理中...' : action.label}
                    </Text>
                  </TouchableOpacity>
                  <Flex align="center" style={styles.coachBenefitRow}>
                    <Image
                      style={styles.coachBenefitIcon}
                      source={require('@/assets/images/curriculum/qy.png')}
                    />
                    <Text style={styles.coachBenefitText}>
                      {benefitParts.prefix}
                      {benefitParts.highlight != null ? (
                        <Text style={styles.coachBenefitHighlight}>
                          {benefitParts.highlight}
                        </Text>
                      ) : null}
                      {benefitParts.suffix ?? ''}
                    </Text>
                  </Flex>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {loadingMore ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : null}

        {nextBooking ? (
          <Flex justify="between" align="center" style={styles.nextTrainBox}>
            <Flex align="center" style={styles.nextTrainLeft}>
              <Image
                style={styles.nextTrainIcon}
                source={require('@/assets/images/curriculum/next_train.png')}
              />
              <View style={styles.nextTrainInfo}>
                <Text style={styles.nextTrainTitle}>你的下一次训练</Text>
                <Text style={styles.nextTrainDetail}>{nextBooking.detailText}</Text>
              </View>
            </Flex>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('MyBookingPage')}
            >
              <Flex align="center">
                <Text style={styles.myBookingText}>查看预约</Text>
                <Image
                  style={styles.myBookingIcon}
                  source={require('@/assets/images/curriculum/arrow_right.png')}
                />
              </Flex>
            </TouchableOpacity>
          </Flex>
        ) : null}
      </ScrollView>
    </View>
  );
}
