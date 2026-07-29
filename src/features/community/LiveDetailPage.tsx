import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/liveDetail';
import type { RootStackParamList } from '@/route/router';
import {
  getLiveStreamInfo,
  recordLiveStreamView,
  toggleLiveStreamReservation,
  type LiveStreamItem,
} from '@/api/liveStream';
import { buildDictLabelMap, DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { stripHtmlText } from './courseHelpers';
import {
  formatLiveDailySchedule,
  formatLiveWatchingCount,
  formatLiveWatchMethodText,
  getLiveStatusStyle,
  getLiveStatusText,
  getLiveWatchUrl,
  toLiveId,
} from './liveHelpers';

type Route = RouteProp<RootStackParamList, 'LiveDetail'>;

const DEFAULT_COVER = require('@/assets/images/home/head.png');

export default function LiveDetailPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<Route>();
  const liveId = toLiveId(params.liveId);
  const [live, setLive] = useState<LiveStreamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});
  const [platformLabelMap, setPlatformLabelMap] = useState<Record<string, string>>({});
  const hasRecordedViewRef = useRef(false);

  const handleShare = useCallback(() => {
    // TODO: 分享
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerShareBtn}
        >
          <Image
            style={styles.headerShareIcon}
            source={require('@/assets/images/community/icon_share.png')}
          />
        </TouchableOpacity>
      ),
    });
  }, [handleShare, navigation]);

  const loadLive = useCallback(async () => {
    if (!liveId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getLiveStreamInfo(liveId);
      console.log(res)
      if (isResourceApiOk(res as { code?: number })) {
        setLive(apiResourceData<LiveStreamItem>(res as { code?: number; data?: LiveStreamItem }) ?? null);
      } else {
        setLive(null);
      }
    } catch {
      setLive(null);
    } finally {
      setLoading(false);
    }
  }, [liveId]);

  useEffect(() => {
    (async () => {
      const [typeRes, platformRes] = await Promise.all([
        getDictDataByType(DICT_TYPES.liveType),
        getDictDataByType(DICT_TYPES.livePlatform),
      ]);
      const typeDict = typeRes as unknown as { code?: number; data?: DictDataItem[] };
      const platformDict = platformRes as unknown as { code?: number; data?: DictDataItem[] };
      if (isResourceApiOk(typeDict)) {
        setTypeLabelMap(buildDictLabelMap(typeDict.data));
      }
      if (isResourceApiOk(platformDict)) {
        setPlatformLabelMap(buildDictLabelMap(platformDict.data));
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    hasRecordedViewRef.current = false;
    void loadLive();
  }, [loadLive]);

  useEffect(() => {
    if (!liveId || !live || hasRecordedViewRef.current) return;
    hasRecordedViewRef.current = true;
    recordLiveStreamView(liveId).catch(() => undefined);
  }, [live, liveId]);

  const handleToggleReservation = useCallback(async () => {
    if (!live || !liveId || actionLoading || live.status !== 0) return;
    const nextStatus = !live.isReserved;
    setActionLoading(true);
    try {
      const res = await toggleLiveStreamReservation({ liveId, status: nextStatus });
      if (isResourceApiOk(res as { code?: number })) {
        const data = apiResourceData<{ status?: boolean }>(
          res as { code?: number; data?: { status?: boolean } },
        );
        setLive(prev => (prev ? { ...prev, isReserved: data?.status ?? nextStatus } : prev));
        Alert.alert('提示', nextStatus ? '预约成功' : '已取消预约');
      } else {
        Alert.alert('失败', (res as { msg?: string }).msg ?? '请稍后重试');
      }
    } catch {
      Alert.alert('失败', '请稍后重试');
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, live, liveId]);

  const handleWatch = useCallback(() => {
    const url = getLiveWatchUrl(live);
    if (!url) {
      Alert.alert('提示', '暂无观看链接');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('提示', '无法打开观看链接');
    });
  }, [live]);

  const handleCopyWatchUrl = useCallback(async () => {
    const url = getLiveWatchUrl(live);
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
  }, [live]);

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center} showHeaderBackground={false}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  if (!live) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center} showHeaderBackground={false}>
        <Text style={styles.emptyText}>暂无直播详情</Text>
      </PageLayout>
    );
  }

  const coverSource = live.coverOssUrl?.trim() ? { uri: live.coverOssUrl } : DEFAULT_COVER;
  const typeLabel = live.liveType ? typeLabelMap[live.liveType] ?? live.liveType : '';
  const platformLabel = live.livePlatform
    ? platformLabelMap[live.livePlatform] ?? live.livePlatform
    : '';
  const statusText = getLiveStatusText(live.status, live.statusName);
  const statusStyle = getLiveStatusStyle(live.status);
  const scheduleText = formatLiveDailySchedule(live.liveStartTime);
  const detailText =
    stripHtmlText(live.liveHighlights) ||
    live.liveIntro?.trim() ||
    '暂无直播详情';
  const showReserveAction = live.status === 0;
  const watchUrl = getLiveWatchUrl(live);

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <View style={styles.pageBody}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <Image source={coverSource} style={styles.heroImage} resizeMode="cover" />
            {statusText || typeLabel ? (
              <View style={styles.heroTagRow} pointerEvents="none">
                {statusText ? (
                  <View style={[styles.statusTag, { backgroundColor: statusStyle.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                    <Text style={[styles.statusTagText, { color: statusStyle.text }]}>
                      {statusText}
                    </Text>
                  </View>
                ) : null}
                {typeLabel ? (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{typeLabel}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <Flex style={styles.metaBar} justify="between" align="center">
            <Flex align="center" style={styles.metaLeft}>
              <Text style={styles.metaName} numberOfLines={1}>
                {live.anchorName?.trim() || '主播待定'}
              </Text>
              {scheduleText ? (
                <>
                  <View style={styles.metaDivider} />
                  <Text style={styles.metaSchedule} numberOfLines={1}>
                    {scheduleText}
                  </Text>
                </>
              ) : null}
            </Flex>
            <Flex align="center" style={styles.metaRight}>
              <Image
                style={styles.metaWatchIcon}
                source={require('@/assets/images/community/icon_gkrs.png')}
              />
              <Text style={styles.metaWatchText}>{formatLiveWatchingCount(live.viewCount)}</Text>
            </Flex>
          </Flex>

          <View style={styles.body}>
            <Text style={styles.title}>{live.title?.trim() || '直播详情'}</Text>

            <View style={styles.watchCard}>
              <Flex align="center" style={styles.watchRow}>
                <Text style={styles.watchMethodText} numberOfLines={2}>
                  <Text style={styles.watchMethodLabel}>观看方式 : </Text>
                  {formatLiveWatchMethodText(platformLabel)}
                </Text>
                <TouchableOpacity
                  style={styles.watchBtn}
                  activeOpacity={0.7}
                  onPress={handleWatch}>
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
                    onPress={handleCopyWatchUrl}>
                    <Text style={styles.watchCopyText}>复制链接</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <Flex align="center" style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>简介</Text>
            </Flex>
            <Text style={styles.detailText}>{detailText}</Text>
            {live.liveIntro?.trim() && stripHtmlText(live.liveHighlights) ? (
              <Text style={[styles.detailText, styles.detailBlock]}>{live.liveIntro.trim()}</Text>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 40) }]}>
          {showReserveAction ? (
            <TouchableOpacity
              style={[
                styles.btn,
                live.isReserved && styles.btnCancel,
                actionLoading && styles.btnDisabled,
              ]}
              activeOpacity={0.7}
              disabled={actionLoading}
              onPress={handleToggleReservation}>
              {actionLoading ? (
                <ActivityIndicator color={live.isReserved ? '#6D925E' : '#FFFFFF'} />
              ) : (
                <Text style={[styles.btnText, live.isReserved && styles.btnCancelText]}>
                  {live.isReserved ? '取消预约' : '立即预约'}
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
