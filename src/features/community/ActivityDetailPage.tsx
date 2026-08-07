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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  getActivityLifecycleStatusStyle,
  getActivityLifecycleStatusText,
  getActivityListStatusMeta,
  getActivitySignupRemain,
  getActivityStatusText,
  parseActivityDetailContent,
  splitDetailLines,
  toActivityId,
} from './activityHelpers';

type Route = RouteProp<RootStackParamList, 'ActivityDetail'>;

const DEFAULT_COVER = require('@/assets/images/home/head.png');

function SectionHeader({ title }: { title: string }) {
  return (
    <Flex align="center" style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </Flex>
  );
}

function InfoRow({
  icon,
  text,
  onPress,
  showArrow,
}: {
  icon: number;
  text: string;
  onPress?: () => void;
  showArrow?: boolean;
}) {
  const content = (
    <Flex align="center" style={styles.infoRow}>
      <Image source={icon} style={styles.infoIcon} />
      <Text style={styles.infoText} numberOfLines={1}>{text}</Text>
      {showArrow ? (
        <Image
          source={require('@/assets/images/community/icon_right.png')}
          style={styles.infoArrow}
        />
      ) : null}
    </Flex>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {content}
    </TouchableOpacity>
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

function formatSignupWatching(count: number) {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return `${safe.toLocaleString('en-US')}人已报名`;
}

export default function ActivityDetailPage() {
  const navigation = useNavigation();
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
        Toast.show(nextJoined ? '报名成功' : '已取消报名');
      } else {
        Alert.alert('失败', (res as { msg?: string }).msg ?? '请稍后重试');
      }
    } catch {
      Alert.alert('失败', '请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // const handleShare = useCallback(() => {
  //   // TODO: 分享
  // }, []);

  // useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: () => (
  //       <TouchableOpacity
  //         activeOpacity={0.7}
  //         onPress={handleShare}
  //         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  //         style={styles.headerShareBtn}
  //       >
  //         <Image
  //           style={styles.headerShareIcon}
  //           source={require('@/assets/images/community/icon_share.png')}
  //         />
  //       </TouchableOpacity>
  //     ),
  //   });
  // }, [handleShare, navigation]);

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
      <PageLayout style={styles.container} contentStyle={styles.center} showHeaderBackground={false}>
        <Text style={styles.emptyText}>暂无活动详情</Text>
      </PageLayout>
    );
  }

  const coverSource = data.coverOssUrl?.trim() ? { uri: data.coverOssUrl } : DEFAULT_COVER;
  const statusText = getActivityStatusText(data.status, data.statusName, data.isBm);
  const typeLabel = data.activityType ? typeLabelMap[data.activityType] ?? data.activityType : '';
  const lifecycleStatusText = getActivityLifecycleStatusText(data.status, data.statusName);
  const lifecycleStatusStyle = getActivityLifecycleStatusStyle(data.status, data.statusName);
  const listStatusMeta = getActivityListStatusMeta(data.status, data.isBm);
  const location = data.activityLocation?.trim() || '待定';
  const noticeText = data.activityRemark?.trim() || '';
  const introText = detailContent.intro || '暂无详细介绍';
  const signupCount = Number(data.signupCount ?? 0);
  const signupLimit = Number(data.signupLimit ?? 0);
  const remainCount = getActivitySignupRemain(signupCount, signupLimit);
  const progressRatio =
    signupLimit > 0 ? Math.min(1, Math.max(0, signupCount / signupLimit)) : 0;
  const showSignupAction = canToggleActivitySignup(data.status, data.isBm);
  const organizerName = data.contactName?.trim() || '主办方';

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <View style={styles.pageBody}>
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scroll,
            !showSignupAction && styles.scrollNoFooter,
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <Image source={coverSource} style={styles.heroImage} resizeMode="cover" />
            {lifecycleStatusText || typeLabel ? (
              <View style={styles.heroTagRow} pointerEvents="none">
                {lifecycleStatusText ? (
                  <View style={[styles.statusTag, { backgroundColor: lifecycleStatusStyle.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: lifecycleStatusStyle.dot }]} />
                    <Text style={[styles.statusTagText, { color: lifecycleStatusStyle.text }]}>
                      {lifecycleStatusText}
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
              <View style={styles.metaProgressTrack}>
                <View
                  style={[
                    styles.metaProgressFill,
                    {
                      width: `${(signupLimit > 0 ? progressRatio : 0) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.metaRemainLabel}>剩余名额:</Text>
              <Text style={styles.metaRemainValue}>
                {remainCount == null ? '--' : remainCount}
              </Text>
            </Flex>
            <Flex align="center" style={styles.metaRight}>
              <Image
                style={styles.metaWatchIcon}
                source={require('@/assets/images/community/icon_gkrs.png')}
              />
              <Text style={styles.metaWatchText}>{formatSignupWatching(signupCount)}</Text>
            </Flex>
          </Flex>

          <View style={styles.body}>
            <Flex justify="between" align="start">
              <Text style={[styles.title, { flex: 1, marginRight: 8 }]} numberOfLines={2}>
                {data.activityName?.trim() || '活动详情'}
              </Text>
              <View
                style={[
                  styles.titleStatusTag,
                  { backgroundColor: listStatusMeta.backgroundColor },
                ]}>
                <Text style={[styles.titleStatusTagText, { color: listStatusMeta.color }]}>
                  {listStatusMeta.label}
                </Text>
              </View>
            </Flex>


            <View style={styles.infoCard}>
              <InfoRow
                icon={require('@/assets/images/community/icon_time.png')}
                text={`开始时间：${formatActivityDetailDateTime(data.activityStartTime)}`}
              />
              <InfoRow
                icon={require('@/assets/images/community/icon_rl.png')}
                text={`报名截止：${formatActivityDetailDateTime(data.signupDeadline)}`}
              />
              <InfoRow
                icon={require('@/assets/images/community/icon_dw.png')}
                text={`报名地点：${location}`}
                showArrow
                onPress={location !== '待定' ? () => openMap(location) : undefined}
              />
            </View>


            <SectionHeader title="简介" />
            <DetailTextBlock text={noticeText || '暂无简介'} />

            <SectionHeader title="详情" />
            <DetailTextBlock text={introText} />
            {detailContent.sections.map(section => (
              <View key={section.title} style={styles.sectionSubBlock}>
                <Text style={styles.sectionSubTitle}>{section.title}</Text>
                <DetailTextBlock text={section.body} />
              </View>
            ))}

            <Flex align="center" style={styles.organizerCard}>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName} numberOfLines={1}>
                  {`主办方 : ${organizerName}`}
                </Text>
                <Text style={styles.organizerPhone} numberOfLines={1}>
                  {data.contactPhone?.trim() || '暂无联系电话'}
                </Text>
              </View>
              {data.contactPhone?.trim() ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.organizerPhoneBtn}
                  onPress={() => Linking.openURL(`tel:${data.contactPhone!.trim()}`)}>
                  <Image
                    source={require('@/assets/images/community/icon_phone.png')}
                    style={styles.organizerPhoneIcon}
                  />
                </TouchableOpacity>
              ) : null}
            </Flex>
          </View>
        </ScrollView>

        {showSignupAction ? (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 40) }]}>
            <TouchableOpacity
              style={[
                styles.btn,
                data.isBm && styles.btnCancel,
                actionLoading && styles.btnDisabled,
              ]}
              activeOpacity={0.7}
              disabled={actionLoading}
              onPress={toggleRegister}>
              {actionLoading ? (
                <ActivityIndicator color={data.isBm ? '#6D925E' : '#FFFFFF'} />
              ) : (
                <Text style={[styles.btnText, data.isBm && styles.btnCancelText]}>
                  {data.isBm ? '取消报名' : '立即报名'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </PageLayout>
  );
}
