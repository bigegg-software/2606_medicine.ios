import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
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
import { resolveSessionAction } from '../utils/sessionActionHelpers';

type Props = {
  stationId?: string;
  isActive?: boolean;
};

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
  const [loading, setLoading] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchRecommendOnlineSessions({ stationId: id });
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

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

  const refreshAfterBookingChange = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setSessions([]);
      setNextBooking(null);
      return;
    }
    try {
      const [list, next] = await Promise.all([
        fetchRecommendOnlineSessions({ stationId: id }),
        fetchNextOnlineBooking({ stationId: id }),
      ]);
      setSessions(list);
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
    }, [isActive, refreshAfterBookingChange]),
  );

  return (
    <View style={styles.tabPage}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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
              const coverUri = card.coverUri || card.avatarUri;
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
                        coverUri
                          ? { uri: coverUri }
                          : require('@/assets/images/curriculum/ljl.png')
                      }
                    />
                    <View style={styles.liveInfo}>
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTagText}>直播·推荐</Text>
                      </View>
                      <Text style={styles.liveTitle} numberOfLines={2}>
                        {card.title}
                      </Text>
                      <Text style={styles.liveSuit} numberOfLines={2}>
                        {card.suitText}
                      </Text>
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

                  <Flex justify="between" align="center" style={styles.liveBottomRow}>
                    <View style={styles.liveBottomLeft}>
                      <Text style={styles.liveTime}>{card.timeText}</Text>
                      <View style={styles.liveBenefitRow}>
                        <Image
                          style={styles.liveBenefitIcon}
                          tintColor="#000000"
                          source={require('@/assets/images/curriculum/bm.png')}
                        />
                        <Text style={styles.liveBenefitText}>{card.benefitText}</Text>
                      </View>
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
                </TouchableOpacity>
              );
            })
          )}

          <Text style={styles.weekOnlineTitle}>随时练一练</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.practiceScroll}
          contentContainerStyle={styles.practiceScrollContent}
        >
          {[1, 2, 3].map(key => (
            <Flex key={key} align="start" style={styles.practiceCard}>
              <Image
                style={styles.practiceCover}
                source={require('@/assets/images/curriculum/ljl.png')}
              />
              <View style={styles.practiceInfo}>
                <Text style={styles.practiceTitle}>15分钟晨间舒展</Text>
                <Text style={styles.practiceSubtitle}>处方配套视频</Text>
              </View>
            </Flex>
          ))}
        </ScrollView>

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>每一次居家练习，都是为更好相见做准备</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </View>
  );
}
