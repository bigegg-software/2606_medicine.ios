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

type Route = RouteProp<RootStackParamList, 'PrivateCourseDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_AVATAR = require('@/assets/images/curriculum/ljl.png');

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

/** 私教课程详情（布局同集体课；头图 129×129；仅个人简介） */
export default function PrivateCourseDetailPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<Route>();
  const sessionId = toSessionId(params.sessionId);
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
      const next = await fetchPrivateCourseDetail(sessionId);
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
        <Text style={styles.emptyText}>暂无私教课程详情</Text>
      </PageLayout>
    );
  }

  const avatarSource = detail.coverUri ? { uri: detail.coverUri } : DEFAULT_AVATAR;
  // 进行中(4) / 已结束(5) / 已取消(6)：不可预约、取消、调整时间
  const showReserveAction =
    detail.status !== 4 && detail.status !== 5 && detail.status !== 6;
  const disabledActionLabel =
    detail.status === 4
      ? '进行中'
      : detail.status === 5
        ? '已过期'
        : detail.status === 6
          ? '已取消'
          : '不可预约';
  const introText = detail.introText.trim() || '';
  const adjustInitialStartTime = detail.startTime || detail.timeText.split('-')[0]?.trim() || '';

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <AdjustTimeModal
        visible={adjustTimeVisible}
        onClose={() => setAdjustTimeVisible(false)}
        bookingId={detail.bookingId}
        stationId={detail.stationId}
        courseType="private"
        excludeSessionId={detail.sessionId}
        initialDate={detail.sessionDate}
        initialStartTime={adjustInitialStartTime}
        onSuccess={newSessionId => {
          const id = String(newSessionId ?? '').trim();
          if (id && id !== detail.sessionId) {
            navigation.replace('PrivateCourseDetail', { sessionId: id });
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
            <Image source={avatarSource} style={styles.privateHeroImage} resizeMode="cover" />
          </View>

          <Flex style={[styles.metaBar, styles.privateMetaBar]} align="center">
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

            {(detail.certificateText || detail.specialtyText) ? (
              <View style={styles.coachInfoCard}>
                {detail.certificateText ? (
                  <View style={styles.coachInfoRow}>
                    <Image
                      style={styles.coachInfoIcon}
                      source={require('@/assets/images/curriculum/icon_cert.png')}
                    />
                    <Text style={styles.coachInfoText}>
                      资格证书 : {detail.certificateText}
                    </Text>
                  </View>
                ) : null}
                {detail.specialtyText ? (
                  <View
                    style={[
                      styles.coachInfoRow,
                      detail.certificateText ? styles.coachInfoRowGap : null,
                    ]}
                  >
                    <Image
                      style={styles.coachInfoIcon}
                      source={require('@/assets/images/curriculum/icon_specialty.png')}
                    />
                    <Text style={styles.coachInfoText}>
                      擅长方向 : {detail.specialtyText}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Flex align="center" style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>个人简介</Text>
            </Flex>
            <Text style={styles.detailText}>{introText || '暂无个人简介'}</Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 40) }]}>
          {showReserveAction ? (
            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnFlex,
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
          ) : (
            <View style={[styles.btn, styles.btnDisabled]}>
              <Text style={styles.btnText}>{disabledActionLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </PageLayout>
  );
}
