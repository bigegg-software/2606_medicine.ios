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
import { Flex, Toast } from '@ant-design/react-native';
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
  fetchPrivateCourseDetail,
  formatOnlineHeaderEnrollText,
  toSessionId,
  type OnlineCourseDetailView,
} from './utils/courseSessionHelpers';
import AdjustTimeModal from './components/AdjustTimeModal';
import CachedRemoteImage from './components/CachedRemoteImage';
import CoachEntryCard from './components/CoachEntryCard';
import CourseSubMetaRow from './components/CourseSubMetaRow';
import CourseTypeTitleTag from './components/CourseTypeTitleTag';
import { navigateToCurriculumTab } from './utils/navigationHelpers';
import {
  isBookingAbsentStatus,
  isBookingActionClosed,
} from './utils/sessionActionHelpers';

type Route = RouteProp<RootStackParamList, 'PrivateCourseDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_COVER = require('@/assets/images/curriculum/sj.png');

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

/** 私教课程详情（顶部参考集体课；头图高 206；关联课程才展示介绍区） */
export default function PrivateCourseDetailPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<Route>();
  const sessionId = toSessionId(params.sessionId);
  const bookingStatusHint =
    params.bookingStatus != null && String(params.bookingStatus).trim() !== ''
      ? Number(params.bookingStatus)
      : undefined;
  const privateRemainCount = useSelector((state: RootState) =>
    resolveCourseBenefitRemainCount(state.user.systemUser, 'private'),
  );
  const [detail, setDetail] = useState<OnlineCourseDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adjustTimeVisible, setAdjustTimeVisible] = useState(false);

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
      const next = await fetchPrivateCourseDetail(sessionId, bookingStatusHint);
      setDetail(next);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [bookingStatusHint, sessionId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleBook = useCallback(() => {
    if (!detail || actionLoading) return;
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
      info: bookingInfoFromDetail(detail),
      courseType: 'private',
      onConfirm: () => {
        void (async () => {
          setActionLoading(true);
          try {
            const result = await bookPrivateSession(detail.sessionId);
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
            await loadDetail();
          } finally {
            setActionLoading(false);
          }
        })();
      },
    });
  }, [actionLoading, detail, loadDetail, navigation, privateRemainCount]);

  const handleCancel = useCallback(() => {
    if (!detail || actionLoading) return;
    const bookingId = detail.bookingId?.trim() || '';
    if (!bookingId) {
      Toast.show('请到我的预约中取消', 1.5);
      return;
    }
    showCancelConfirmAlert({
      info: bookingInfoFromDetail(detail),
      courseType: 'private',
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
    return ['上课地点'];
  }, [detail]);

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
        <Text style={styles.emptyText}>暂无私教课程详情</Text>
      </PageLayout>
    );
  }

  const bookingClosed = isBookingActionClosed(detail.bookingStatus);
  const showRebook = isBookingAbsentStatus(detail.bookingStatus);
  // 进行中(4) / 已结束(5) / 已取消(6)：不可预约、取消、调整时间
  const showReserveAction =
    !bookingClosed && detail.status !== 4 && detail.status !== 5 && detail.status !== 6;
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
  const adjustInitialStartTime = detail.startTime || detail.timeText.split('-')[0]?.trim() || '';

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <AdjustTimeModal
        visible={adjustTimeVisible}
        onClose={() => setAdjustTimeVisible(false)}
        bookingId={detail.bookingId}
        stationId={detail.stationId}
        coachUserId={detail.coachUserId}
        courseType="private"
        excludeSessionId={detail.sessionId}
        initialDate={detail.sessionDate}
        initialStartTime={adjustInitialStartTime}
        onSuccess={newSessionId => {
          const id = String(newSessionId ?? '').trim();
          if (id && id !== detail.sessionId) {
            // 同页更新场次，避免 replace 再次打开详情
            navigation.setParams({ sessionId: id });
            return;
          }
          void loadDetail();
        }}
      />
      <View style={styles.pageBody}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.privateHeroWrap}>
            <CachedRemoteImage
              uri={detail.coverUri}
              fallback={DEFAULT_COVER}
              style={styles.privateHeroImage}
              resizeMode="cover"
            />
            {detail.courseTags.length > 0 ? (
              <View style={styles.privateHeroTagRow} pointerEvents="none">
                {detail.courseTags.map(tag => (
                  <View key={tag} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Flex style={styles.metaBar} align="center" justify="between">
            <MetaParts parts={metaParts} />
            {detail.stationName ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.metaRight}
                onPress={() => openMap(detail.stationName)}
              >
                <Flex align="center">
                  <Image
                    tintColor={"#999999"}
                    style={styles.metaAddressIcon}
                    source={require('@/assets/images/curriculum/address.png')}
                  />
                  <Text style={styles.metaAddress} numberOfLines={1}>
                    {detail.stationName}
                  </Text>
                  <Image
                    style={styles.metaAddressArrow}
                    source={require('@/assets/images/curriculum/icon_right.png')}
                  />
                </Flex>
              </TouchableOpacity>
            ) : null}
          </Flex>

          <View style={styles.body}>
            <CourseSubMetaRow parts={subMetaParts} />
            <Flex align="center" style={styles.titleRow}>
              <Text style={styles.title}>{detail.title}</Text>
              <CourseTypeTitleTag type="private" />
            </Flex>

            <CoachEntryCard
              coachName={detail.coachName}
              coachUserId={detail.coachUserId}
              avatarUri={detail.avatarUri}
            />

            {detail.hasLinkedCourse ? (
              <>
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
              </>
            ) : null}
          </View>
        </ScrollView>

        {showRebook ? (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 40) }]}>
            <TouchableOpacity
              style={styles.btn}
              activeOpacity={0.7}
              onPress={() => navigateToCurriculumTab(navigation)}
            >
              <Text style={styles.btnText}>重新预约</Text>
            </TouchableOpacity>
          </View>
        ) : showReserveAction ? (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 40) }]}>
            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnFlex,
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
              {detail.bookedByMe ? (
                <TouchableOpacity
                  style={[styles.btn, styles.btnFlex, actionLoading && styles.btnDisabled]}
                  activeOpacity={0.7}
                  disabled={actionLoading}
                  onPress={() => {
                    if (!detail.bookingId?.trim()) {
                      Toast.show('请到我的预约中调整', 1.5);
                      return;
                    }
                    if (!detail.stationId?.trim()) {
                      Toast.show('暂无法调整时间', 1.5);
                      return;
                    }
                    setAdjustTimeVisible(true);
                  }}
                >
                  <Text style={styles.btnText}>调整时间</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </PageLayout>
  );
}
