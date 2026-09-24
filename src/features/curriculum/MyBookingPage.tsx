import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/curriculum/myBooking';
import type { RootStackParamList } from '@/route/router';
import {
  fetchCompletedBookings,
  fetchMyBookingUpcomingBundle,
  resolveBookingDetailRoute,
  type MyBookingCompletedCardView,
  type MyBookingFollowCardView,
  type MyBookingNextCardView,
} from './utils/myBookingHelpers';

const TAB_LIST = [
  { key: 'upcoming', title: '即将开始' },
  { key: 'completed', title: '已完成' },
] as const;

type TabKey = (typeof TAB_LIST)[number]['key'];

const DEFAULT_AVATAR = require('@/assets/images/curriculum/ljl.png');
const DEFAULT_COVER = require('@/assets/images/curriculum/xb1.png');

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** 我的预约 */
export default function MyBookingPage() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [loading, setLoading] = useState(true);
  const [nextBooking, setNextBooking] = useState<MyBookingNextCardView | null>(null);
  const [followList, setFollowList] = useState<MyBookingFollowCardView[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<MyBookingCompletedCardView[]>([]);
  const [completedList, setCompletedList] = useState<MyBookingCompletedCardView[]>([]);

  const openDetail = useCallback(
    (sessionId: string, courseType: string) => {
      const id = String(sessionId ?? '').trim();
      if (!id) return;
      const route = resolveBookingDetailRoute(courseType);
      navigation.navigate(route, { sessionId: id });
    },
    [navigation],
  );

  const loadUpcoming = useCallback(async () => {
    try {
      const data = await fetchMyBookingUpcomingBundle();
      setNextBooking(data.next);
      setFollowList(data.followList);
      setRecentCompleted(data.recentCompleted);
    } catch {
      setNextBooking(null);
      setFollowList([]);
      setRecentCompleted([]);
    }
  }, []);

  const loadCompleted = useCallback(async () => {
    try {
      const rows = await fetchCompletedBookings();
      setCompletedList(rows);
    } catch {
      setCompletedList([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          if (activeTab === 'upcoming') {
            await loadUpcoming();
          } else {
            await loadCompleted();
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [activeTab, loadUpcoming, loadCompleted]),
  );

  const hasUpcoming = Boolean(nextBooking) || followList.length > 0;
  const hasCompleted = completedList.length > 0;

  return (
    <PageLayout style={styles.container} contentStyle={styles.content}>
      <Flex style={styles.navBox}>
        {TAB_LIST.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Flex
              key={tab.key}
              style={[styles.navItem, active && styles.activeNavItem]}
              justify="center"
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.navText, active && styles.activeNavText]}>{tab.title}</Text>
            </Flex>
          );
        })}
      </Flex>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : activeTab === 'upcoming' ? (
          hasUpcoming ? (
            <>
              {nextBooking ? (
                <View style={styles.bookingCard}>
                  <Image
                    source={require('@/assets/images/curriculum/back.png')}
                    style={styles.bookingCardBg}
                    resizeMode="stretch"
                  />
                  <View style={styles.bookingCardBody}>
                    <Flex justify="between" align="center">
                      <Text style={styles.bookingLabel}>下一次训练</Text>
                      <View style={styles.bookingStatusTag}>
                        <Text style={styles.bookingStatusText}>{nextBooking.statusLabel}</Text>
                      </View>
                    </Flex>

                    <Text style={styles.bookingTime}>{nextBooking.timeText}</Text>
                    <Text style={styles.bookingTitle}>{nextBooking.title}</Text>

                    <Flex align="start" style={styles.bookingCoachRow}>
                      <Image
                        style={styles.bookingCoachAvatar}
                        source={
                          nextBooking.avatarUri
                            ? { uri: nextBooking.avatarUri }
                            : DEFAULT_AVATAR
                        }
                      />
                      <View style={styles.bookingCoachInfo}>
                        <Text style={styles.bookingCoachName}>{nextBooking.coachName}</Text>
                        <Flex align="center" style={styles.bookingCoachMetaRow}>
                          <Image
                            style={styles.bookingCoachMetaIcon}
                            tintColor="#999999"
                            source={require('@/assets/images/curriculum/address.png')}
                          />
                          <Text style={styles.bookingCoachMeta}>{nextBooking.stationName}</Text>
                        </Flex>
                        <Flex align="center" style={styles.bookingCoachMetaRow}>
                          <Image
                            style={styles.bookingCoachMetaIcon}
                            tintColor="#999999"
                            source={require('@/assets/images/curriculum/time.png')}
                          />
                          <Text style={styles.bookingCoachTip}>{nextBooking.tipText}</Text>
                        </Flex>
                      </View>
                    </Flex>

                    <Flex style={styles.bookingActionRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.bookingAdjustBtn}
                        onPress={() =>
                          openDetail(nextBooking.sessionId, nextBooking.courseType)
                        }
                      >
                        <Flex style={{ flex: 1 }} justify="center">
                          <Image
                            style={styles.bookingAdjustBtnIcon}
                            tintColor="#6D925E"
                            source={require('@/assets/images/curriculum/time.png')}
                          />
                          <Text style={styles.bookingAdjustBtnText}>调整时间</Text>
                        </Flex>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.bookingDetailBtn}
                        onPress={() =>
                          openDetail(nextBooking.sessionId, nextBooking.courseType)
                        }
                      >
                        <Flex style={{ flex: 1 }} justify="center">
                          <Text style={styles.bookingDetailBtnText}>查看详情</Text>
                          <Image
                            style={styles.bookingDetailBtnIcon}
                            tintColor="#333333"
                            source={require('@/assets/images/curriculum/icon_right.png')}
                          />
                        </Flex>
                      </TouchableOpacity>
                    </Flex>
                  </View>
                </View>
              ) : null}

              <View style={styles.contentBox}>
                {followList.length > 0 ? (
                  <>
                    <Text style={[styles.weekOnlineTitle, { marginTop: nextBooking ? 0 : 16 }]}>
                      后续安排
                    </Text>
                    {followList.map(item => (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.7}
                        style={styles.followCard}
                        onPress={() => openDetail(item.sessionId, item.courseType)}
                      >
                        <Flex align="start">
                          <Image
                            style={styles.followCover}
                            source={item.coverUri ? { uri: item.coverUri } : DEFAULT_COVER}
                          />
                          <View style={styles.followInfo}>
                            <Flex justify="between" align="center">
                              <Text style={styles.followTime} numberOfLines={1}>
                                {item.timeText}
                              </Text>
                              <View style={styles.bookingStatusTag}>
                                <Text style={styles.bookingStatusText}>{item.statusLabel}</Text>
                              </View>
                            </Flex>
                            <Text style={styles.followTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Flex align="center" style={styles.followMetaRow}>
                              <Image
                                style={styles.followMetaIcon}
                                tintColor="#999999"
                                source={require('@/assets/images/curriculum/bm.png')}
                              />
                              <Text style={styles.followMeta} numberOfLines={1}>
                                {item.coachMeta}
                              </Text>
                            </Flex>
                          </View>
                        </Flex>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}

                {recentCompleted.length > 0 ? (
                  <>
                    <Text style={styles.weekOnlineTitle}>最近完成</Text>
                    {recentCompleted.map(item => (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (item.sessionId) openDetail(item.sessionId, item.courseType);
                        }}
                      >
                        <Flex justify="between" align="start" style={styles.completedCard}>
                          <Image
                            style={styles.completedDateIcon}
                            source={require('@/assets/images/common/wc.png')}
                          />
                          <View style={styles.completedInfo}>
                            <Text style={styles.completedDate}>{item.dateText}</Text>
                            <Text style={styles.completedTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </View>
                          <View style={styles.completedStatusTag}>
                            <Text style={styles.completedStatusText}>{item.statusLabel}</Text>
                          </View>
                        </Flex>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}
              </View>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyRecord text="暂无即将开始的预约" />
            </View>
          )
        ) : hasCompleted ? (
          <View style={styles.contentBox}>
            <Text style={[styles.weekOnlineTitle, { marginTop: 16 }]}>最近完成</Text>
            {completedList.map(item => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.sessionId) openDetail(item.sessionId, item.courseType);
                }}
              >
                <Flex justify="between" align="start" style={styles.completedCard}>
                  <Image
                    style={styles.completedDateIcon}
                    source={require('@/assets/images/common/wc.png')}
                  />
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedDate}>{item.dateText}</Text>
                    <Text style={styles.completedTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <View style={styles.completedStatusTag}>
                    <Text style={styles.completedStatusText}>{item.statusLabel}</Text>
                  </View>
                </Flex>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyRecord text="暂无已完成的预约" />
          </View>
        )}

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>日复一日的规律，是身体最好的滋养</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </PageLayout>
  );
}
