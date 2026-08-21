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
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/courseDetail';
import type { RootStackParamList } from '@/route/router';
import {
  getCourseInfo,
  recordCourseComplete,
  recordCourseView,
  toggleCourseFavorite,
  toggleCourseLike,
  type CourseItem,
} from '@/api/course';
import { buildDictLabelMap, DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { formatCourseWatchingCount, stripHtmlText, toCourseId, applyCourseFavoriteToggle, applyCourseLikeToggle } from './courseHelpers';
import RichHtmlView from './components/RichHtmlView';

type Route = RouteProp<RootStackParamList, 'CourseDetail'>;

export default function CourseDetailPage() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const courseId = toCourseId(params.courseId);
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});
  const hasRecordedViewRef = useRef(false);
  const hasRecordedCompleteRef = useRef(false);

  const handleShare = useCallback(() => {
    // TODO: 分享
  }, []);

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

  const videoUrl = course?.videoOssUrl?.trim() || '';
  const player = useVideoPlayer(videoUrl || null, instance => {
    instance.loop = false;
  });

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      const res = (await getCourseInfo(courseId)) as { code?: number; data?: CourseItem };
      if (isResourceApiOk(res)) {
        setCourse(apiResourceData<CourseItem>(res) ?? null);
      } else {
        setCourse(null);
      }
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    (async () => {
      const res = await getDictDataByType(DICT_TYPES.courseType);
      const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
      if (isResourceApiOk(dictRes)) {
        setTypeLabelMap(buildDictLabelMap(dictRes.data));
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    hasRecordedViewRef.current = false;
    hasRecordedCompleteRef.current = false;
    void loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (!courseId || !course || hasRecordedViewRef.current) return;
    hasRecordedViewRef.current = true;
    recordCourseView({ courseId, status: true }).catch(() => undefined);
  }, [course, courseId]);

  useEventListener(player, 'playToEnd', () => {
    if (!courseId || hasRecordedCompleteRef.current) return;
    hasRecordedCompleteRef.current = true;
    recordCourseComplete({ courseId }).catch(() => undefined);
  });

  const handleToggleFavorite = useCallback(async () => {
    if (!course || !courseId || actionLoading) return;
    const nextStatus = !course.isFavorited;
    setActionLoading(true);
    try {
      const res = await toggleCourseFavorite({ courseId, status: nextStatus });
      if (isResourceApiOk(res)) {
        setCourse(prev => (prev ? applyCourseFavoriteToggle(prev, nextStatus) : prev));
      } else {
        Alert.alert('提示', (res as { msg?: string }).msg ?? '操作失败，请稍后重试');
      }
    } catch {
      Alert.alert('提示', '操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, course, courseId]);

  const handleToggleLike = useCallback(async () => {
    if (!course || !courseId || actionLoading) return;
    const nextStatus = !course.isLiked;
    setActionLoading(true);
    try {
      const res = await toggleCourseLike({ courseId, status: nextStatus });
      if (isResourceApiOk(res)) {
        setCourse(prev => (prev ? applyCourseLikeToggle(prev, nextStatus) : prev));
      } else {
        Alert.alert('提示', (res as { msg?: string }).msg ?? '操作失败，请稍后重试');
      }
    } catch {
      Alert.alert('提示', '操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, course, courseId]);

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  if (!course) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center} showHeaderBackground={false}>
        <Text style={styles.emptyText}>课程不存在或已下架</Text>
      </PageLayout>
    );
  }

  const introText = course.courseIntro?.trim() || '暂无课程简介';
  const detailHtml = course.courseDetail?.trim() || '';
  const detailPlain = stripHtmlText(course.courseDetail);
  const detailFallback = '暂无课程详情';
  const courseTypeLabel = course.courseType
    ? (typeLabelMap[course.courseType] ?? course.courseType)
    : '';

  return (
    <PageLayout style={styles.container} showHeaderBackground={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {videoUrl ? (
          <View style={styles.videoWrap}>
            <VideoView style={styles.video} player={player} contentFit="contain" nativeControls />
            {courseTypeLabel ? (
              <View style={styles.categoryTag} pointerEvents="none">
                <Text style={styles.categoryText}>{courseTypeLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Flex style={styles.metaBar} justify="between" align="center">
          <Flex align="center" style={styles.metaLeft}>
            <Text style={styles.metaName} numberOfLines={1}>
              {course.instructor?.trim() || '讲师待定'}
            </Text>
          </Flex>
          <Flex align="center" style={styles.metaRight}>
            <Image
              style={styles.metaWatchIcon}
              source={require('@/assets/images/community/icon_gkrs.png')}
            />
            <Text style={styles.metaWatchText}>{formatCourseWatchingCount(course.viewCount)}</Text>
          </Flex>
        </Flex>

        <View style={styles.body}>
          <Text style={styles.title}>{course.title || '课程详情'}</Text>

          <Flex style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              disabled={actionLoading}
              onPress={handleToggleLike}
            >
              <Image
                style={[styles.actionIcon, { tintColor: course.isLiked ? '#6D925E' : '#61666D' }]}
                source={require('@/assets/images/community/icon_dz.png')}
              />
              <Text style={[styles.actionText, course.isLiked && styles.actionTextActive]}>
                {course.likeCount ?? 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              disabled={actionLoading}
              onPress={handleToggleFavorite}
            >
              <Image
                style={[styles.actionIcon, { tintColor: course.isFavorited ? '#6D925E' : '#61666D' }]}
                source={require('@/assets/images/community/icon_sc.png')}
              />
              <Text style={[styles.actionText, course.isFavorited && styles.actionTextActive]}>
                {course.favoriteCount ?? 0}
              </Text>
            </TouchableOpacity>
          </Flex>

          <Flex align="center" style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleBar} />
            <Text style={styles.sectionTitle}>简介</Text>
          </Flex>
          <Text style={styles.detailText}>{introText}</Text>

          <Flex align="center" style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleBar} />
            <Text style={styles.sectionTitle}>详情</Text>
          </Flex>
          {detailHtml && detailPlain ? (
            <RichHtmlView html={detailHtml} style={styles.detailHtml} />
          ) : (
            <Text style={styles.detailText}>{detailFallback}</Text>
          )}
        </View>
      </ScrollView>
    </PageLayout>
  );
}
