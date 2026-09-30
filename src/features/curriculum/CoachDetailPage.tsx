import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import styles from '@/css/curriculum/coachDetail';
import type { RootStackParamList } from '@/route/router';
import {
  fetchCoachDetailView,
  type CoachDetailView,
} from './utils/coachUserHelpers';

type Route = RouteProp<RootStackParamList, 'CoachDetail'>;

const DEFAULT_AVATAR = getDefaultAvatarByGender();

/** 教练详情 */
export default function CoachDetailPage() {
  const { params } = useRoute<Route>();
  const coachUserId = String(params.coachUserId ?? '').trim();
  const [detail, setDetail] = useState<CoachDetailView | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!coachUserId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchCoachDetailView(coachUserId);
      setDetail(next);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [coachUserId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <Text style={styles.emptyText}>暂无教练详情</Text>
      </PageLayout>
    );
  }

  const avatarSource = detail.avatarUri ? { uri: detail.avatarUri } : DEFAULT_AVATAR;
  const certificateText = detail.certificateText.trim();
  const specialtyText = detail.specialtyText.trim();
  const introText = detail.introText.trim();

  return (
    <PageLayout style={styles.container}>
      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Flex align="center" style={styles.headerRow}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.nameBlock}>
              <Text style={styles.name} numberOfLines={1}>
                {detail.name}
              </Text>
              {detail.stationName ? (
                <Flex align="center" style={styles.stationRow}>
                  <Image
                    style={styles.stationIcon}
                    source={require('@/assets/images/curriculum/dp.png')}
                  />
                  <Text style={styles.stationText} numberOfLines={1}>
                    所属门店 : {detail.stationName}
                  </Text>
                </Flex>
              ) : null}
            </View>
          </Flex>

          {certificateText ? (
            <Flex align="center" style={styles.certCard}>
              <Image
                style={styles.certIcon}
                source={require('@/assets/images/curriculum/zs.png')}
              />
              <Text style={styles.certLabel}>资格证书</Text>
              <Text style={styles.certValue} numberOfLines={2}>
                {certificateText}
              </Text>
            </Flex>
          ) : null}

          <Flex align="center" style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleBar} />
            <Text style={styles.sectionTitle}>擅长方向</Text>
          </Flex>
          <Text style={styles.detailText}>{specialtyText || '暂无擅长方向'}</Text>

          <Flex align="center" style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleBar} />
            <Text style={styles.sectionTitle}>个人简介</Text>
          </Flex>
          <Text style={styles.detailText}>{introText || '暂无个人简介'}</Text>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
