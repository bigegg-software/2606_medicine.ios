import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/curriculum/onlineCourseDetail';
import type { RootStackParamList } from '@/route/router';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchCourseSessionDetail,
  formatOnlineHeaderEnrollText,
  mapGroupCourseDetail,
  toSessionId,
  type OnlineCourseDetailView,
} from './utils/courseSessionHelpers';

type Route = RouteProp<RootStackParamList, 'GroupCourseDetail'>;

const DEFAULT_COVER = require('@/assets/images/curriculum/xb1.png');

function MetaParts({ parts }: { parts: string[] }) {
  return (
    <Flex align="center" style={styles.metaLeft}>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {index > 0 ? <View style={styles.metaDivider} /> : null}
          <Text style={index === 0 ? styles.metaName : styles.metaSchedule} numberOfLines={1}>
            {part}
          </Text>
        </React.Fragment>
      ))}
    </Flex>
  );
}

/** 集体课程详情（顶部参考线上详情，无 URL 模块） */
export default function GroupCourseDetailPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<Route>();
  const sessionId = toSessionId(params.sessionId);
  const [detail, setDetail] = useState<OnlineCourseDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const headerEnrollText = formatOnlineHeaderEnrollText(detail?.bookedCount, detail?.capacity);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerReserveBadge}>
          <Image
            style={styles.headerReserveIcon}
            source={require('@/assets/images/community/icon_yy.png')}
          />
          <Text style={styles.headerReserveText}>{headerEnrollText}</Text>
        </View>
      ),
    });
  }, [headerEnrollText, navigation]);

  const loadDetail = useCallback(async () => {
    if (!sessionId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const item = await fetchCourseSessionDetail(sessionId);
      setDetail(item ? mapGroupCourseDetail(item) : null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleBook = useCallback(() => {
    if (!detail || actionLoading) return;
    Modal.alert('确认预约', '预约将冻结 1 次权益，是否继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认预约',
        onPress: () => {
          void (async () => {
            setActionLoading(true);
            try {
              const result = await bookPrivateSession(detail.sessionId);
              if (!result.ok) {
                Toast.show(result.msg || '预约失败', 1.5);
                return;
              }
              Toast.show('预约成功', 1.5);
              await loadDetail();
            } finally {
              setActionLoading(false);
            }
          })();
        },
      },
    ]);
  }, [actionLoading, detail, loadDetail]);

  const handleCancel = useCallback(() => {
    if (!detail || actionLoading) return;
    const bookingId = detail.bookingId?.trim() || '';
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
            setActionLoading(true);
            try {
              const result = await cancelPrivateBooking(bookingId);
              if (!result.ok) {
                Toast.show(result.msg || '取消失败', 1.5);
                return;
              }
              Toast.show('已取消预约', 1.5);
              await loadDetail();
            } finally {
              setActionLoading(false);
            }
          })();
        },
      },
    ]);
  }, [actionLoading, detail, loadDetail]);

  const openMap = useCallback((location: string) => {
    const query = encodeURIComponent(location);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('提示', '无法打开地图');
    });
  }, []);

  const metaParts = useMemo(() => {
    if (!detail) return [];
    return [
      detail.coachName,
      detail.timeText,
      detail.courseTypeLabel,
      detail.categoryLabel,
    ].filter(Boolean);
  }, [detail]);

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center} showHeaderBackground={false}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center} showHeaderBackground={false}>
        <Text style={styles.emptyText}>暂无集体课程详情</Text>
      </PageLayout>
    );
  }

  const coverSource = detail.coverUri ? { uri: detail.coverUri } : DEFAULT_COVER;
  const showReserveAction = detail.status !== 5 && detail.status !== 6;
  const introText = detail.introText.trim() || '';
  const pointsText = detail.pointsText.trim() || '';
  const suitText = detail.suitText.trim() || '';

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <View style={styles.pageBody}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <Image source={coverSource} style={styles.heroImage} resizeMode="cover" />
            {detail.categoryLabel ? (
              <View style={styles.heroTagRow} pointerEvents="none">
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{detail.categoryLabel}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <Flex style={styles.metaBar} align="center">
            <MetaParts parts={metaParts} />
          </Flex>

          <View style={styles.body}>
            <Text style={styles.title}>{detail.title}</Text>

            {detail.stationName ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.addressRow}
                onPress={() => openMap(detail.stationName)}
              >
                <Image
                  style={styles.addressIcon}
                  source={require('@/assets/images/curriculum/address.png')}
                />
                <Text style={styles.addressText} numberOfLines={2}>
                  上课地点：{detail.stationName}
                </Text>
                <Image
                  style={styles.addressArrow}
                  source={require('@/assets/images/curriculum/icon_right.png')}
                />
              </TouchableOpacity>
            ) : null}

            <Flex align="center" style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>适合人群</Text>
            </Flex>
            <Text style={styles.detailText}>{suitText || '暂无适合人群说明'}</Text>

            <Flex align="center" style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>课程介绍</Text>
            </Flex>
            <Text style={styles.detailText}>{introText || '暂无课程介绍'}</Text>

            <Flex align="center" style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>课程要点</Text>
            </Flex>
            <Text style={styles.detailText}>{pointsText || '暂无课程要点'}</Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 40) }]}>
          {showReserveAction ? (
            <TouchableOpacity
              style={[
                styles.btn,
                detail.bookedByMe && styles.btnCancel,
                actionLoading && styles.btnDisabled,
              ]}
              activeOpacity={0.7}
              disabled={actionLoading}
              onPress={() => {
                if (detail.bookedByMe) {
                  handleCancel();
                } else {
                  handleBook();
                }
              }}
            >
              {actionLoading ? (
                <ActivityIndicator color={detail.bookedByMe ? '#6D925E' : '#FFFFFF'} />
              ) : (
                <Text style={[styles.btnText, detail.bookedByMe && styles.btnCancelText]}>
                  {detail.bookedByMe ? '取消预约' : '立即预约'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.btn, styles.btnDisabled]}>
              <Text style={styles.btnText}>
                {detail.status === 5 ? '已结束' : detail.status === 6 ? '已取消' : '不可预约'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </PageLayout>
  );
}
