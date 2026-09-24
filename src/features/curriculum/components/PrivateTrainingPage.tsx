import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/curriculum/privateTraining';
import type { RootStackParamList } from '@/route/router';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '@/src/features/exercise/utils/dietCalendarHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import CoachFilterPicker, { type CoachFilterValue } from './CoachFilterPicker';
import TimeSlotFilterPicker from './TimeSlotFilterPicker';
import type { TimeSlotValue } from '../utils/timeSlotHelpers';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchNextPrivateBooking,
  fetchRecommendPrivateSessions,
  resolveCardBookingId,
  type NextBookingView,
  type PrivateSessionCardView,
} from '../utils/courseSessionHelpers';

type Props = {
  stationId?: string;
};

/** 私教训练 */
export default function PrivateTrainingPage({ stationId }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachFilterValue | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotValue | null>(null);
  const [sessions, setSessions] = useState<PrivateSessionCardView[]>([]);
  const [nextBooking, setNextBooking] = useState<NextBookingView | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);

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
      return;
    }
    setLoading(true);
    try {
      const list = await fetchRecommendPrivateSessions({
        stationId: id,
        coachUserId: selectedCoach?.coachUserId,
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
      const next = await fetchNextPrivateBooking({ stationId: id });
      setNextBooking(next);
    } catch {
      setNextBooking(null);
    }
  }, [stationId]);

  const refreshAfterBookingChange = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      setNextBooking(null);
      return;
    }
    try {
      const [list, next] = await Promise.all([
        fetchRecommendPrivateSessions({
          stationId: id,
          coachUserId: selectedCoach?.coachUserId,
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: selectedTimeSlot?.startTime,
          endTime: selectedTimeSlot?.endTime,
        }),
        fetchNextPrivateBooking({ stationId: id }),
      ]);
      setSessions(list);
      setNextBooking(next);
    } catch {
      // 保持当前列表，避免预约成功后闪空
    }
  }, [
    selectedCoach?.coachUserId,
    selectedDate,
    selectedTimeSlot?.endTime,
    selectedTimeSlot?.startTime,
    stationId,
  ]);

  const handleBook = useCallback(
    (card: PrivateSessionCardView) => {
      if (actionSessionId) return;
      Modal.alert('确认预约', '预约将冻结 1 次权益，是否继续？', [
        { text: '取消', style: 'cancel' },
        {
          text: '确认预约',
          onPress: () => {
            void (async () => {
              setActionSessionId(card.sessionId);
              try {
                const result = await bookPrivateSession(card.sessionId);
                if (!result.ok) {
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
        },
      ]);
    },
    [actionSessionId, refreshAfterBookingChange],
  );

  const handleCancel = useCallback(
    (card: PrivateSessionCardView) => {
      if (actionSessionId) return;
      const bookingId = resolveCardBookingId(card, nextBooking);
      if (!bookingId) {
        Toast.show('请到我的预约中取消', 1.5);
        return;
      }
      Modal.alert('取消预约', '开课前 24 小时可取消并释放权益，确认取消？', [
        { text: '再想想', style: 'cancel' },
        {
          text: '确认取消',
          onPress: () => {
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
        },
      ]);
    },
    [actionSessionId, nextBooking, refreshAfterBookingChange],
  );

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    void loadNextBooking();
  }, [loadNextBooking]);

  return (
    <View style={styles.tabPage}>
      <DietDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Flex justify="between" style={styles.calendarBox}>
          {weekDays.map(item => {
            const isActive = item.key === selectedDate;
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
                <View style={styles.calendarDotWrap} />
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
          sessions.map((card, index) => (
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
              <Flex align="start">
                <Image
                  style={styles.coachAvatar}
                  source={
                    card.avatarUri
                      ? { uri: card.avatarUri }
                      : require('@/assets/images/curriculum/ljl.png')
                  }
                />
                <View style={styles.coachInfo}>
                  <Flex align="center" style={styles.coachNameRow}>
                    <Text style={styles.coachName}>{card.name}</Text>
                    <View style={styles.coachTag}>
                      <Text style={styles.coachTagText}>{card.tag}</Text>
                    </View>
                  </Flex>
                  <Text style={styles.coachDesc} numberOfLines={2}>
                    {card.desc}
                  </Text>
                  <Flex align="center" style={styles.coachBenefitRow}>
                    <Image
                      style={styles.coachBenefitIcon}
                      source={require('@/assets/images/curriculum/qy.png')}
                    />
                    <Text style={styles.coachBenefitText}>{card.benefitText}</Text>
                  </Flex>
                </View>
              </Flex>

              <View style={styles.coachDashWrap}>
                <View style={styles.coachDash} />
              </View>

              <Flex justify="between" align="center" style={styles.coachBottomRow}>
                <View style={styles.coachSessionInfo}>
                  <Text style={styles.coachTime}>{card.time}</Text>
                  <Text style={styles.coachTopic} numberOfLines={1}>
                    {card.topic}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.coachBookBtn}
                  disabled={actionSessionId === card.sessionId}
                  onPress={() => {
                    if (card.bookedByMe) {
                      handleCancel(card);
                    } else {
                      handleBook(card);
                    }
                  }}
                >
                  <Text style={styles.coachBookBtnText}>
                    {actionSessionId === card.sessionId
                      ? '处理中...'
                      : card.bookedByMe
                        ? '取消预约'
                        : '预约教练'}
                  </Text>
                </TouchableOpacity>
              </Flex>
            </TouchableOpacity>
          ))
        )}

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
