import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import * as Clipboard from 'expo-clipboard';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/curriculum/onlineCourseDetail';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import {
  bookingInfoFromDetail,
  resolveCourseBenefitRemainCount,
  showBookConfirmAlert,
  showCancelConfirmAlert,
  showInsufficientBenefitAlert,
  tryShowInsufficientBenefitAlert,
} from './utils/bookingDialogHelpers';
import {
  bookPrivateSession,
  cancelPrivateBooking,
  fetchOnlineCourseDetail,
  formatOnlineHeaderEnrollText,
  formatOnlineWatchMethodText,
  toSessionId,
  type OnlineCourseDetailView,
} from './utils/courseSessionHelpers';
import CoachEntryCard from './components/CoachEntryCard';
import CourseSubMetaRow from './components/CourseSubMetaRow';
import CourseTypeTitleTag from './components/CourseTypeTitleTag';

type Route = RouteProp<RootStackParamList, 'OnlineCourseDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_COVER = require('@/assets/images/curriculum/xb1.png');

/** 线上课程详情（布局参考直播详情） */
export default function OnlineCourseDetailPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<Route>();
  const sessionId = toSessionId(params.sessionId);
  const onlineRemainCount = useSelector((state: RootState) =>
    resolveCourseBenefitRemainCount(state.user.systemUser, 'online'),
  );
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
      const next = await fetchOnlineCourseDetail(sessionId);
      setDetail(next);
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
      info: bookingInfoFromDetail(detail),
      courseType: 'online',
      onConfirm: () => {
        void (async () => {
          setActionLoading(true);
          try {
            const result = await bookPrivateSession(detail.sessionId);
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
            await loadDetail();
          } finally {
            setActionLoading(false);
          }
        })();
      },
    });
  }, [actionLoading, detail, loadDetail, navigation, onlineRemainCount]);

  const handleCancel = useCallback(() => {
    if (!detail || actionLoading) return;
    const bookingId = detail.bookingId?.trim() || '';
    if (!bookingId) {
      Toast.show('请到我的预约中取消', 1.5);
      return;
    }
    showCancelConfirmAlert({
      info: bookingInfoFromDetail(detail),
      courseType: 'online',
      onConfirm: () => {
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
    });
  }, [actionLoading, detail, loadDetail]);

  const handleWatch = useCallback(() => {
    const url = detail?.liveLink?.trim();
    if (!url) {
      Alert.alert('提示', '暂无观看链接');
      return;
    }
    void Linking.openURL(url).catch(() => {
      Alert.alert('提示', '无法打开观看链接');
    });
  }, [detail?.liveLink]);

  const handleCopyWatchUrl = useCallback(async () => {
    const url = detail?.liveLink?.trim();
    if (!url) {
      Alert.alert('提示', '暂无观看链接');
      return;
    }
    try {
      await Clipboard.setStringAsync(url);
      Toast.success('链接已复制');
    } catch {
      Alert.alert('提示', '复制失败，请稍后重试');
    }
  }, [detail?.liveLink]);

  const subMetaParts = useMemo(() => {
    if (!detail) return [];
    return [detail.timeText, detail.categoryLabel].filter(Boolean);
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
        <Text style={styles.emptyText}>暂无线上课程详情</Text>
      </PageLayout>
    );
  }

  const coverSource = detail.coverUri ? { uri: detail.coverUri } : DEFAULT_COVER;
  const watchUrl = detail.liveLink?.trim() || '';
  // 进行中(4) / 已结束(5) / 已取消(6)：不可预约、取消预约
  const showReserveAction =
    detail.status !== 4 && detail.status !== 5 && detail.status !== 6;
  const reserveBlocked =
    !detail.bookedByMe && (detail.status === 2 || detail.status === 3);
  const reserveActionLabel = detail.bookedByMe
    ? '取消预约'
    : detail.status === 3
      ? '报名截止'
      : detail.status === 2
        ? '已满员'
        : '立即预约';
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
            {detail.courseTags.length > 0 ? (
              <View style={styles.heroTagRow} pointerEvents="none">
                {detail.courseTags.map(tag => (
                  <View key={tag} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <CourseSubMetaRow parts={subMetaParts} />
            <Flex align="center" style={styles.titleRow}>
              <Text style={styles.title}>{detail.title}</Text>
              <CourseTypeTitleTag type="online" />
            </Flex>


            <View style={styles.watchCard}>
              <Flex align="center" style={styles.watchRow}>
                <Text style={styles.watchMethodText} numberOfLines={2}>
                  <Text style={styles.watchMethodLabel}>观看方式 : </Text>
                  {formatOnlineWatchMethodText(detail.platformLabel)}
                </Text>
                <TouchableOpacity
                  style={styles.watchBtn}
                  activeOpacity={0.7}
                  onPress={handleWatch}
                >
                  <Text style={styles.watchBtnText}>去观看</Text>
                </TouchableOpacity>
              </Flex>
              {watchUrl ? (
                <View style={styles.watchLinkBox}>
                  <Text style={styles.watchLinkText} numberOfLines={2}>
                    {watchUrl}
                  </Text>
                  <TouchableOpacity
                    style={styles.watchCopyBtn}
                    activeOpacity={0.7}
                    onPress={handleCopyWatchUrl}
                  >
                    <Text style={styles.watchCopyText}>复制链接</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {/* {detail.prepareText ? (
                <Text style={styles.infoText}>{detail.prepareText}</Text>
              ) : null} */}
            </View>

            <CoachEntryCard
              coachName={detail.coachName}
              coachUserId={detail.coachUserId}
              avatarUri={detail.avatarUri}
            />

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
                (actionLoading || reserveBlocked) && styles.btnDisabled,
              ]}
              activeOpacity={0.7}
              disabled={actionLoading || reserveBlocked}
              onPress={() => {
                if (reserveBlocked) return;
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
                  {reserveActionLabel}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} activeOpacity={0.7} onPress={handleWatch}>
              <Text style={styles.btnText}>进入直播</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </PageLayout>
  );
}
