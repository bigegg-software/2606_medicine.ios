import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import EmptyRecord from '@/src/components/EmptyRecord';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { getCourseFavoriteList, type CourseItem } from '@/api/course';
import { DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { formatCourseViewCount, toCourseId } from '@/src/features/community/courseHelpers';
import courseStyles from '@/css/community/community';
import styles from '@/css/profile/favorites';
import {
  buildFavoriteCourseTabs,
  buildFavoriteListParams,
  hasFavoriteMore,
  parseFavoriteListTotal,
  type FavoriteCourseTab,
} from './utils/favoritesHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 10;
const DEFAULT_COVER = require('@/assets/images/home/head.png');

export default function FavoritePage() {
  const navigation = useNavigation<Nav>();
  const [tabs, setTabs] = useState<FavoriteCourseTab[]>([{ label: '全部', value: '' }]);
  const [activeType, setActiveType] = useState('');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const activeTypeRef = useRef(activeType);
  const coursesRef = useRef(courses);
  const loadingRef = useRef(false);
  const hasMountedRef = useRef(false);
  activeTypeRef.current = activeType;
  coursesRef.current = courses;

  useEffect(() => {
    void (async () => {
      const res = await getDictDataByType(DICT_TYPES.courseType);
      const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
      if (!isResourceApiOk(dictRes)) return;
      setTabs(buildFavoriteCourseTabs(dictRes.data));
    })();
  }, []);

  const load = useCallback(async (opts?: { refresh?: boolean; page?: number }) => {
    const courseType = activeTypeRef.current;
    const refresh = opts?.refresh === true;
    const page = opts?.page ?? 1;

    if (loadingRef.current && !refresh && page > 1) return;
    loadingRef.current = true;
    if (refresh) setRefreshing(true);
    else if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getCourseFavoriteList(
        buildFavoriteListParams({
          pageNum: page,
          pageSize: PAGE_SIZE,
          courseType,
        }),
      );
      if (!isResourceApiOk(res as { code?: number })) {
        if (page === 1) {
          setCourses([]);
          coursesRef.current = [];
        }
        setHasMore(false);
        return;
      }

      const rows = getResourceRows<CourseItem>(res as { code?: number; rows?: CourseItem[] });
      const nextTotal = parseFavoriteListTotal(res as { total?: number | string });
      const nextList = page === 1 ? rows : [...coursesRef.current, ...rows];
      coursesRef.current = nextList;
      setCourses(nextList);
      setPageNum(page);
      setHasMore(hasFavoriteMore(nextList.length, nextTotal));
    } catch {
      if (page === 1) {
        setCourses([]);
        coursesRef.current = [];
      }
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setHasMore(true);
    setPageNum(1);
    void load({ page: 1 });
  }, [activeType, load]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      void load({ page: 1 });
    }, [load]),
  );

  const handleRefresh = useCallback(() => {
    void load({ refresh: true, page: 1 });
  }, [load]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    void load({ page: pageNum + 1 });
  }, [hasMore, load, loading, loadingMore, pageNum, refreshing]);

  const getCourseTypeLabel = useCallback((courseType?: string) => {
    if (!courseType) return '课程';
    return tabs.find(item => item.value === courseType)?.label || courseType;
  }, [tabs]);

  const renderCourseItem = useCallback(({ item }: { item: CourseItem }) => {
    const courseId = toCourseId(item.courseId);
    const coverUri = item.coverOssUrl?.trim();

    return (
      <TouchableOpacity
        style={courseStyles.courseBox}
        activeOpacity={0.9}
        onPress={() => {
          if (!courseId) return;
          navigation.navigate('CourseDetail', { courseId });
        }}
      >
        <View style={courseStyles.courseImgWrap}>
          <Image
            source={coverUri ? { uri: coverUri } : DEFAULT_COVER}
            style={courseStyles.courseImg}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={courseStyles.courseImgGradient}
            pointerEvents="none"
          >
            <Flex align="center">
              <Image style={courseStyles.gkrsIcon} source={require('@/assets/images/community/gkrc.png')} />
              <Text style={courseStyles.gkrsText}>{formatCourseViewCount(item.viewCount)}</Text>
            </Flex>
          </LinearGradient>
          <View style={courseStyles.courseCategoryTag}>
            <Text style={courseStyles.liveTopCategoryText}>{getCourseTypeLabel(item.courseType)}</Text>
          </View>
          <View style={courseStyles.coursePlayWrap} pointerEvents="none">
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="light" style={courseStyles.coursePlayBlur} />
            ) : (
              <View style={[courseStyles.coursePlayBlur, courseStyles.coursePlayBlurFallback]} />
            )}
            <Image
              source={require('@/assets/images/community/icon_play.png')}
              style={courseStyles.coursePlayIcon}
            />
          </View>
        </View>
        <View style={courseStyles.courseBoxInfo}>
          <Text style={courseStyles.courseTitle} numberOfLines={1}>{item.title || '未命名课程'}</Text>
          <Text style={courseStyles.courseText} numberOfLines={2}>
            {item.courseIntro || '暂无课程简介'}
          </Text>
          <Flex justify="between" style={{ marginTop: 12 }}>
            <Flex>
              <Image style={courseStyles.courseIcon} source={require('@/assets/images/community/user.png')} />
              <Text style={courseStyles.courseBtmText}>{item.instructor || '讲师待定'}</Text>
            </Flex>
            <Flex>
              <Image style={courseStyles.courseIcon} source={require('@/assets/images/community/dz.png')} />
              <Text style={courseStyles.courseBtmText}>{item.likeCount ?? 0}</Text>
              <Image style={[courseStyles.courseIcon, { marginLeft: 20 }]} source={require('@/assets/images/community/sc.png')} />
              <Text style={courseStyles.courseBtmText}>{item.favoriteCount ?? 0}</Text>
            </Flex>
          </Flex>
        </View>
      </TouchableOpacity>
    );
  }, [getCourseTypeLabel, navigation]);

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.tabBar}
      >
        <View style={styles.tabTrack}>
          {tabs.map(tab => {
            const active = tab.value === activeType;
            return (
              <TouchableOpacity
                key={tab.value || 'all'}
                style={[styles.tabItem, active && styles.tabItemActive]}
                activeOpacity={0.8}
                onPress={() => {
                  if (tab.value === activeType) return;
                  setActiveType(tab.value);
                }}
              >
                <Text style={active ? styles.tabTextActive : styles.tabText} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {loading && courses.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item, index) => toCourseId(item.courseId) || `favorite-${index}`}
          renderItem={renderCourseItem}
          contentContainerStyle={courses.length === 0 ? styles.listEmpty : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyRecord text="暂无收藏课程" />
            </View>
          }
          ListFooterComponent={
            loadingMore && hasMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={AppTheme.primaryColor} />
              </View>
            ) : null
          }
        />
      )}
    </PageLayout>
  );
}
