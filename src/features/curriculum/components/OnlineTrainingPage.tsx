import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import styles from '@/css/curriculum/onlineTraining';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import {
  resolveCourseBenefitRemainCount,
  showBookConfirmAlert,
  showCancelConfirmAlert,
  showInsufficientBenefitAlert,
  tryShowInsufficientBenefitAlert,
} from '../utils/bookingDialogHelpers';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchNextOnlineBooking,
  fetchRecommendOnlineSessions,
  resolveCardBookingId,
  type NextBookingView,
  type OnlineSessionCardView,
} from '../utils/courseSessionHelpers';
import {
  fetchHomePracticeCards,
  type HomePracticeCardView,
} from '../utils/homePracticeHelpers';
import { resolveSessionAction } from '../utils/sessionActionHelpers';

type Props = {
  stationId?: string;
  isActive?: boolean;
};

/** 无教练头像时与预约教练页一致的默认头像 */
const DEFAULT_COACH_AVATAR = getDefaultAvatarByGender();

function getLiveActionStyles(tone: ReturnType<typeof resolveSessionAction>['tone']) {
  switch (tone) {
    case 'booked':
      return { btn: styles.liveBookBtnBooked, text: styles.liveBookBtnBookedText };
    case 'deadline':
      return { btn: styles.liveBookBtnDeadline, text: styles.liveBookBtnDeadlineText };
    case 'ongoing':
      return { btn: styles.liveBookBtnOngoing, text: styles.liveBookBtnOngoingText };
    case 'ended':
      return { btn: styles.liveBookBtnEnded, text: styles.liveBookBtnEndedText };
    case 'full':
      return { btn: styles.liveBookBtnFull, text: styles.liveBookBtnFullText };
    case 'book':
    default:
      return { btn: null, text: null };
  }
}

/** 线上训练 */
export default function OnlineTrainingPage({ stationId, isActive = true }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const systemUser = useSelector((state: RootState) => state.user.systemUser);
  const onlineRemainCount = resolveCourseBenefitRemainCount(systemUser, 'online');
  const [sessions, setSessions] = useState<OnlineSessionCardView[]>([]);
  const [nextBooking, setNextBooking] = useState<NextBookingView | null>(null);
  const [practiceCards, setPracticeCards] = useState<HomePracticeCardView[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const pageNumRef = useRef(1);
  const excludeSessionIdsRef = useRef('');
  const hasMoreRef = useRef(false);

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
      const result = await fetchRecommendOnlineSessions({ stationId: id, pageNum: 1 });
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
  }, [stationId]);

  const loadMoreSessions = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id || !hasMoreRef.current || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = pageNumRef.current + 1;
      const result = await fetchRecommendOnlineSessions({
        stationId: id,
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
  }, [loading, loadingMore, stationId]);

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
      const next = await fetchNextOnlineBooking({ stationId: id });
      setNextBooking(next);
    } catch {
      setNextBooking(null);
    }
  }, [stationId]);

  const loadHomePractice = useCallback(async () => {
    try {
      const list = await fetchHomePracticeCards();
      setPracticeCards(list);
    } catch {
      setPracticeCards([]);
    }
  }, []);

  const refreshAfterBookingChange = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      setNextBooking(null);
      return;
    }
    try {
      const [listResult, next] = await Promise.all([
        fetchRecommendOnlineSessions({ stationId: id, pageNum: 1 }),
        fetchNextOnlineBooking({ stationId: id }),
      ]);
      setSessions(listResult.cards);
      pageNumRef.current = 1;
      excludeSessionIdsRef.current = listResult.excludeSessionIds;
      hasMoreRef.current = listResult.hasMore;
      setNextBooking(next);
    } catch {
      // 保持当前列表
    }
  }, [stationId]);

  const handleBook = useCallback(
    (card: OnlineSessionCardView) => {
      if (actionSessionId) return;
      const openBenefits = () => navigation.navigate('MemberBenefitsPage');
      if (
        tryShowInsufficientBenefitAlert({
          courseType: 'online',
          remainCount: onlineRemainCount,
          needCount: 1,
          onViewBenefit: openBenefits,
        })
      ) {
        return;
      }
      showBookConfirmAlert({
        info: card.bookingInfo,
        courseType: 'online',
        onConfirm: () => {
          void (async () => {
            setActionSessionId(card.sessionId);
            try {
              const result = await bookPrivateSession(card.sessionId);
              if (!result.ok) {
                if (result.insufficientBenefit) {
                  showInsufficientBenefitAlert({
                    courseType: 'online',
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
    [actionSessionId, navigation, onlineRemainCount, refreshAfterBookingChange],
  );

  const handleCancel = useCallback(
    (card: OnlineSessionCardView) => {
      if (actionSessionId) return;
      const bookingId = resolveCardBookingId(card, nextBooking);
      if (!bookingId) {
        Toast.show('请到我的预约中取消', 1.5);
        return;
      }
      showCancelConfirmAlert({
        info: card.bookingInfo,
        courseType: 'online',
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
    void loadHomePractice();
  }, [isActive, loadHomePractice]);

  /** 从详情预约/取消返回时刷新列表（首屏由上方 effect 负责） */
  const skipFocusRefreshRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!isActive) return;
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void refreshAfterBookingChange();
      void loadHomePractice();
    }, [isActive, loadHomePractice, refreshAfterBookingChange]),
  );

  return (
    <View style={styles.tabPage}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleSessionScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.contentBox}>
          <ImageBackground
            source={require('@/assets/images/curriculum/xs.png')}
            style={styles.imgBackground}
            imageStyle={styles.imgBackgroundImage}
          >
            <Text style={styles.bannerTitle}>不在门店，也能保持自己的节奏</Text>
            <Text style={styles.bannerDesc}>
              {'在熟悉老师的陪伴下\n完成适合居家的巩固训练'}
            </Text>
          </ImageBackground>

          <Text style={styles.weekOnlineTitle}>本周线上安排</Text>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : !stationId?.trim() ? (
            <View style={{ paddingTop: 24 }}>
              <EmptyRecord text="请先选择服务站" />
            </View>
          ) : sessions.length === 0 ? (
            <View style={{ paddingTop: 24 }}>
              <EmptyRecord text="暂无线上课" />
            </View>
          ) : (
            sessions.map(card => {
              const action = resolveSessionAction({
                status: card.status,
                bookedByMe: card.bookedByMe,
                bookLabel: '预约直播',
                bookedLabel: '取消预约',
              });
              const actionStyles = getLiveActionStyles(action.tone);
              const busy = actionSessionId === card.sessionId;
              const avatarUri = card.avatarUri?.trim() || '';
              return (
                <TouchableOpacity
                  key={card.key}
                  activeOpacity={0.85}
                  style={styles.liveCard}
                  onPress={() =>
                    navigation.navigate('OnlineCourseDetail', {
                      sessionId: card.sessionId,
                    })
                  }
                >
                  <Flex align="start">
                    <Image
                      style={styles.liveAvatar}
                      source={
                        avatarUri
                          ? { uri: avatarUri }
                          : DEFAULT_COACH_AVATAR
                      }
                    />
                    <View style={styles.liveInfo}>
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTagText}>
                          {card.isRecommend ? '直播·推荐' : '直播'}
                        </Text>
                      </View>
                      <Text style={styles.liveTitle} numberOfLines={1}>
                        {card.title}
                      </Text>
                      <Text style={styles.liveTime} numberOfLines={1}>
                        {card.timeText}
                      </Text>
                      <Text style={styles.liveSuit} numberOfLines={1}>
                        {card.suitText}
                      </Text>
                      <Flex justify="between" align="center" style={styles.liveActionRow}>
                        <View style={styles.liveEnrollRow}>
                          <Image
                            style={styles.liveEnrollIcon}
                            tintColor={"#666666"}
                            source={require('@/assets/images/curriculum/bm.png')}
                          />
                          <Text style={styles.liveEnrollText} numberOfLines={1}>
                            {card.benefitText}
                          </Text>
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={[styles.liveBookBtn, actionStyles.btn]}
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
                          <Text style={[styles.liveBookBtnText, actionStyles.text]}>
                            {busy ? '处理中...' : action.label}
                          </Text>
                        </TouchableOpacity>
                      </Flex>
                    </View>
                  </Flex>

                  <Flex style={styles.livePrepareBox}>
                    <Image
                      style={styles.livePrepareIcon}
                      source={require('@/assets/images/curriculum/zb.png')}
                    />
                    <Text style={styles.livePrepareText} numberOfLines={2}>
                      {card.prepareText}
                    </Text>
                  </Flex>
                </TouchableOpacity>
              );
            })
          )}

          {loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : null}

          {practiceCards.length > 0 ? (
            <Text style={styles.weekOnlineTitle}>随时练一练</Text>
          ) : null}
        </View>

        {practiceCards.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.practiceScroll}
            contentContainerStyle={styles.practiceScrollContent}
          >
            {practiceCards.map(card => (
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('ExercisePlayerPage', {
                    exVideoId: card.exVideoId,
                    title: card.title,
                    trainingPhase: 'main',
                    groupVal: card.groupVal,
                    numberVal: card.numberVal,
                    keepSecondVal: card.keepSecondVal,
                    durationMinutes: card.durationMinutes,
                    timerType: card.timerType,
                    practiceOnly: true,
                  })
                }
              >
                <Flex align="start" style={styles.practiceCard}>
                  <Image
                    style={styles.practiceCover}
                    source={card.coverSource}
                    resizeMode="cover"
                  />
                  <View style={styles.practiceInfo}>
                    {card.durationMinutes > 0 ? (
                      <Text style={styles.practiceTitle} numberOfLines={1}>
                        {`${card.durationMinutes}分钟`}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.practiceTitle,
                        card.durationMinutes > 0 ? styles.practiceTitleSecond : null,
                        {marginTop:8},

                      ]}
                      numberOfLines={1}
                    >
                      {card.title}
                    </Text>
                    <Text style={styles.practiceSubtitle} numberOfLines={1}>
                      {card.subtitle}
                    </Text>
                  </View>
                </Flex>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <Flex justify="center" align="center" style={[styles.planListFooter, { gap: 6 }]}>
          <Image source={require('@/assets/images/curriculum/yz.png')} style={styles.planListFooterImage} />
          <Text style={styles.planListFooterText}>每一次居家练习，都是为更好相见做准备</Text>
        </Flex>
      </ScrollView>
    </View>
  );
}
