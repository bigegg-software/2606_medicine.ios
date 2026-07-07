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
import { RouteProp, useRoute } from '@react-navigation/native';
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
import { formatCourseViewCount, stripHtmlText, toCourseId } from './courseHelpers';

type Route = RouteProp<RootStackParamList, 'CourseDetail'>;

export default function CourseDetailPage() {
  const { params } = useRoute<Route>();
  const courseId = toCourseId(params.courseId);
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});
  const hasRecordedViewRef = useRef(false);
  const hasRecordedCompleteRef = useRef(false);

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
        setCourse(prev => prev ? {
          ...prev,
          isFavorited: nextStatus,
          favoriteCount: Math.max(0, Number(prev.favoriteCount ?? 0) + (nextStatus ? 1 : -1)),
        } : prev);
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
        setCourse(prev => prev ? {
          ...prev,
          isLiked: nextStatus,
          likeCount: Math.max(0, Number(prev.likeCount ?? 0) + (nextStatus ? 1 : -1)),
        } : prev);
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
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <Text style={styles.emptyText}>课程不存在或已下架</Text>
      </PageLayout>
    );
  }

  const detailText = stripHtmlText(course.courseDetail) || course.courseIntro || '暂无课程详情';
  const courseTypeLabel = course.courseType
    ? (typeLabelMap[course.courseType] ?? course.courseType)
    : '';

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {videoUrl ? (
          <View style={styles.videoWrap}>
            <VideoView style={styles.video} player={player} contentFit="contain" nativeControls />
          </View>
        ) : null}

        <View style={styles.body}>
          {courseTypeLabel ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{courseTypeLabel}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{course.title || '课程详情'}</Text>
          {course.instructor ? (
            <Text style={styles.instructor}>讲师：{course.instructor}</Text>
          ) : null}
          {course.courseIntro ? (
            <Text style={styles.intro}>{course.courseIntro}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <Text style={styles.statText}>{formatCourseViewCount(course.viewCount)}</Text>
            <Text style={styles.statText}>{course.likeCount ?? 0} 点赞</Text>
            <Text style={styles.statText}>{course.favoriteCount ?? 0} 收藏</Text>
          </View>

          <Flex style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              disabled={actionLoading}
              onPress={handleToggleLike}
            >
              <Image
                style={styles.actionIcon}
                source={require('@/assets/images/community/dz.png')}
              />
              <Text style={[styles.actionText, course.isLiked && styles.actionTextActive]}>
                {course.isLiked ? '已点赞' : '点赞'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              disabled={actionLoading}
              onPress={handleToggleFavorite}
            >
              <Image
                style={styles.actionIcon}
                source={require('@/assets/images/community/sc.png')}
              />
              <Text style={[styles.actionText, course.isFavorited && styles.actionTextActive]}>
                {course.isFavorited ? '已收藏' : '收藏'}
              </Text>
            </TouchableOpacity>
          </Flex>

          <Text style={styles.sectionTitle}>课程详情</Text>
          <Text style={styles.detailText}>{detailText}</Text>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
