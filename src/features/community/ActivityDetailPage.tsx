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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  getActivityInfo,
  joinActivity,
  leaveActivity,
  type ActivityItem,
} from '@/api/activity';
import { buildDictLabelMap, DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/activityDetail';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
  canToggleActivitySignup,
  formatActivityDetailDateTime,
  getActivitySignupRemain,
  getActivityStatusText,
  getActivityStatusTone,
  parseActivityDetailContent,
  splitDetailLines,
  toActivityId,
} from './activityHelpers';

type Route = RouteProp<RootStackParamList, 'ActivityDetail'>;

const DEFAULT_COVER = require('@/assets/images/home/head.png');

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
  action,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIconWrap}>
        <MaterialIcons name={icon} size={18} color={AppTheme.primaryColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
        {action}
      </View>
    </View>
  );
}

function DetailTextBlock({ text }: { text: string }) {
  const lines = splitDetailLines(text);
  if (lines.length <= 1) {
    return <Text style={styles.sectionText}>{text}</Text>;
  }
  return (
    <View>
      {lines.map((line, index) => (
        <Text key={`${line}-${index}`} style={[styles.detailLine, index === 0 && { marginTop: 0 }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function ActivityDetailPage() {
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const activityId = toActivityId(params.id);
  const [data, setData] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});

  const loadActivity = useCallback(async () => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getActivityInfo(activityId);
      if (isResourceApiOk(res as { code?: number })) {
        setData(apiResourceData<ActivityItem>(res as { code?: number; data?: ActivityItem }) ?? null);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    (async () => {
      const res = await getDictDataByType(DICT_TYPES.activityType);
      const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
      if (isResourceApiOk(dictRes)) {
        setTypeLabelMap(buildDictLabelMap(dictRes.data));
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadActivity();
  }, [loadActivity]);

  const toggleRegister = async () => {
    if (!activityId || !data || actionLoading) return;
    const nextJoined = !data.isBm;
    setActionLoading(true);
    try {
      const res = nextJoined ? await joinActivity(activityId) : await leaveActivity(activityId);
      if (isResourceApiOk(res as { code?: number })) {
        setData(prev =>
          prev
            ? {
              ...prev,
              isBm: nextJoined,
              signupCount: Math.max(0, Number(prev.signupCount ?? 0) + (nextJoined ? 1 : -1)),
            }
            : prev,
        );
        Alert.alert('提示', nextJoined ? '报名成功' : '已取消报名');
      } else {
        Alert.alert('失败', (res as { msg?: string }).msg ?? '请稍后重试');
      }
    } catch {
      Alert.alert('失败', '请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const detailContent = useMemo(
    () => parseActivityDetailContent(data?.activityDetail),
    [data?.activityDetail],
  );

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

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <Text style={styles.emptyText}>暂无活动详情</Text>
      </PageLayout>
    );
  }

  const coverSource = data.coverOssUrl?.trim() ? { uri: data.coverOssUrl } : DEFAULT_COVER;
  const statusText = getActivityStatusText(data.status, data.statusName, data.isBm);
  const statusTone = getActivityStatusTone(data.status);
  const typeLabel = data.activityType ? typeLabelMap[data.activityType] ?? data.activityType : '';
  const location = data.activityLocation?.trim() || '待定';
  const introText = detailContent.intro || data.activityRemark?.trim() || '暂无详细介绍';
  const signupCount = Number(data.signupCount ?? 0);
  const signupLimit = Number(data.signupLimit ?? 0);
  const remainCount = getActivitySignupRemain(signupCount, signupLimit);
  const progressRatio =
    signupLimit > 0 ? Math.min(1, Math.max(0, signupCount / signupLimit)) : 0;
  const showSignupAction = canToggleActivitySignup(data.status, data.isBm);
  const organizerName = data.contactName?.trim() || '主办方';

  return (
    <PageLayout style={styles.container} showHeaderBackground={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image source={coverSource} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)']}
            style={styles.heroGradient}
          />
          <View style={[styles.heroStatusTag, { backgroundColor: statusTone.bg }]}>
            <Text style={[styles.heroStatusText, { color: statusTone.text }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.title}>{data.activityName?.trim() || '活动详情'}</Text>
          <View style={styles.badgeRow}>
            {typeLabel ? (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{typeLabel}</Text>
              </View>
            ) : null}
            <View style={[styles.signupBadge, !data.isBm && styles.signupBadgePending]}>
              <Text style={[styles.signupBadgeText, !data.isBm && styles.signupBadgeTextPending]}>
                {data.isBm ? '已报名' : '未报名'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <InfoRow
              icon="schedule"
              label="开始时间"
              value={formatActivityDetailDateTime(data.activityStartTime)}
            />
            <InfoRow
              icon="event-busy"
              label="报名截止"
              value={formatActivityDetailDateTime(data.signupDeadline)}
            />
            <InfoRow
              icon="place"
              label="地点"
              value={location}
              last
              action={
                location !== '待定' ? (
                  <TouchableOpacity style={styles.mapLink} onPress={() => openMap(location)}>
                    <Text style={styles.mapLinkText}>点击查看地图</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          </View>

          <View style={styles.sectionCard}>
            <SectionHeader title="活动详情" />
            <DetailTextBlock text={introText} />
            {detailContent.sections.map(section => (
              <View key={section.title} style={styles.sectionSubBlock}>
                <Text style={styles.sectionSubTitle}>{section.title}</Text>
                <DetailTextBlock text={section.body} />
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <SectionHeader title="报名情况" />
            <View style={styles.signupStatRow}>
              <Text style={styles.signupStat}>{signupCount}</Text>
              <Text style={styles.signupStatUnit}>
                {signupLimit > 0 ? `/ ${signupLimit} 人` : '人已报名'}
              </Text>
            </View>
            {signupLimit > 0 ? (
              <>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
                </View>
                <Text style={styles.signupMeta}>剩余名额：{remainCount ?? 0} 人</Text>
              </>
            ) : null}
            <View style={styles.signupMetaRow}>
              <Text style={styles.signupMeta}>您的报名状态</Text>
              <View style={[styles.signupStatusPill, !data.isBm && styles.signupStatusPillPending]}>
                <Text style={[styles.signupStatusText, !data.isBm && styles.signupStatusTextPending]}>
                  {data.isBm ? '已报名' : '未报名'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <SectionHeader title="主办方" />
            <View style={styles.organizerRow}>
              <View style={styles.organizerIconWrap}>
                <MaterialIcons name="groups" size={22} color={AppTheme.primaryColor} />
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{organizerName}</Text>
                {data.contactPhone?.trim() ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${data.contactPhone}`)}>
                    <Text style={styles.organizerPhone}>{data.contactPhone.trim()}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.signupMeta}>暂无联系电话</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {showSignupAction ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.btn,
              data.isBm && styles.btnCancel,
              actionLoading && styles.btnDisabled,
            ]}
            disabled={actionLoading}
            onPress={toggleRegister}>
            {actionLoading ? (
              <ActivityIndicator color={data.isBm ? AppTheme.textPrimary : '#FFFFFF'} />
            ) : (
              <Text style={[styles.btnText, data.isBm && styles.btnCancelText]}>
                {data.isBm ? '取消报名' : '立即报名'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </PageLayout>
  );
}
