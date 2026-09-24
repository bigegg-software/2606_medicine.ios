import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/curriculum/onlineTraining';
import type { RootStackParamList } from '@/route/router';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchNextOnlineBooking,
  fetchRecommendOnlineSessions,
  resolveCardBookingId,
  type NextBookingView,
  type OnlineSessionCardView,
} from '../utils/courseSessionHelpers';

type Props = {
  stationId?: string;
};

/** 线上训练 */
export default function OnlineTrainingPage({ stationId }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
    (card: OnlineSessionCardView) => {
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
            sessions.map(card => (
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
                      card.avatarUri
                        ? { uri: card.avatarUri }
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
                    style={styles.liveBookBtn}
                    disabled={actionSessionId === card.sessionId}
                    onPress={() => {
                      if (card.bookedByMe) {
                        handleCancel(card);
                      } else {
                        handleBook(card);
                      }
                    }}
                  >
                    <Text style={styles.liveBookBtnText}>
                      {actionSessionId === card.sessionId
                        ? '处理中...'
                        : card.bookedByMe
                          ? '取消预约'
                          : '预约直播'}
                    </Text>
                  </TouchableOpacity>
                </Flex>
              </TouchableOpacity>
            ))
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
