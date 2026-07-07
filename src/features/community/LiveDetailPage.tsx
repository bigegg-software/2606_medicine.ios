import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/courseDetail';
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
  formatLiveStartTime,
  formatLiveViewCount,
  getLiveStatusText,
  toLiveId,
} from './liveHelpers';

type Route = RouteProp<RootStackParamList, 'LiveDetail'>;

const DEFAULT_COVER = require('@/assets/images/home/head.png');

export default function LiveDetailPage() {
  const { params } = useRoute<Route>();
  const liveId = toLiveId(params.liveId);
  const [live, setLive] = useState<LiveStreamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});
  const [platformLabelMap, setPlatformLabelMap] = useState<Record<string, string>>({});
  const hasRecordedViewRef = useRef(false);

  const loadLive = useCallback(async () => {
    if (!liveId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getLiveStreamInfo(liveId);
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

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  if (!live) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <Text style={styles.emptyText}>暂无直播详情</Text>
      </PageLayout>
    );
  }

  const coverSource = live.coverOssUrl?.trim() ? { uri: live.coverOssUrl } : DEFAULT_COVER;
  const typeLabel = live.liveType ? typeLabelMap[live.liveType] ?? live.liveType : '';
  const platformLabel = live.livePlatform
    ? platformLabelMap[live.livePlatform] ?? live.livePlatform
    : '';
  const highlights = stripHtmlText(live.liveHighlights);

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={coverSource} style={styles.videoWrap} resizeMode="cover" />
        <View style={styles.body}>
          {typeLabel ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{typeLabel}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{live.title?.trim() || '直播详情'}</Text>
          <Text style={styles.instructor}>
            主播：{live.anchorName?.trim() || '--'}
            {platformLabel ? ` · ${platformLabel}` : ''}
          </Text>
          <Text style={styles.instructor}>开播时间：{formatLiveStartTime(live.liveStartTime)}</Text>
          <Text style={styles.instructor}>状态：{getLiveStatusText(live.status, live.statusName)}</Text>
          {live.liveIntro?.trim() ? <Text style={styles.intro}>{live.liveIntro.trim()}</Text> : null}
          <View style={styles.statsRow}>
            <Text style={styles.statText}>{formatLiveViewCount(live.viewCount)}</Text>
          </View>
          {highlights ? (
            <>
              <Text style={styles.sectionTitle}>直播要点</Text>
              <Text style={styles.detailText}>{highlights}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
      {live.status === 0 ? (
        <TouchableOpacity
          style={{
            marginHorizontal: 18,
            marginBottom: 24,
            height: 44,
            borderRadius: 22,
            backgroundColor: live.isReserved ? '#00C950' : AppTheme.primaryColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={actionLoading}
          onPress={handleToggleReservation}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '500' }}>
            {live.isReserved ? '取消预约' : '立即预约'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </PageLayout>
  );
}
