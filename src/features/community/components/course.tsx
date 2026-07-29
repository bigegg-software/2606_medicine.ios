import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/community/community';
import type { RootStackParamList } from '@/route/router';
import { AppTheme } from '@/common/theme';
import {
  getCourseList,
  type CourseItem,
} from '@/api/course';
import { buildDictLabelMap, DICT_TYPES, getDictDataByType } from '@/api/dict';
import type { DictDataItem } from '@/api/dict';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { formatCourseViewCount, toCourseId } from '../courseHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 10;

type CourseTab = {
  label: string;
  value: string;
};

function getListTotal(res: { total?: number } | null | undefined, rowsLength: number) {
  const total = Number(res?.total);
  return Number.isFinite(total) && total >= 0 ? total : rowsLength;
}

const DEFAULT_COVER = require('@/assets/images/home/head.png');

export default function CoursePage() {
  const navigation = useNavigation<Nav>();
  const [tabs, setTabs] = useState<CourseTab[]>([{ label: '全部', value: '' }]);
  const [activeTab, setActiveTab] = useState('');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});

  const pageNumRef = useRef(pageNum);
  const totalRef = useRef(total);
  const coursesRef = useRef(courses);
  const loadingMoreRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const hasMountedRef = useRef(false);
  const activeTabRef = useRef(activeTab);
  const lastFetchCountRef = useRef(0);

  pageNumRef.current = pageNum;
  totalRef.current = total;
  coursesRef.current = courses;
  activeTabRef.current = activeTab;

  useEffect(() => {
    (async () => {
      const res = await getDictDataByType(DICT_TYPES.courseType);
      const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
      if (!isResourceApiOk(dictRes)) return;
      const labelMap = buildDictLabelMap(dictRes.data);
      setTypeLabelMap(labelMap);
      const dictTabs = Object.entries(labelMap).map(([value, label]) => ({ label, value }));
      setTabs([
        { label: '全部', value: '' },
        ...dictTabs,
      ]);
    })();
  }, []);

  const hasMoreData = useCallback((currentTotal: number, currentLength: number, lastFetchCount: number) => {
    if (currentTotal > 0) return currentLength < currentTotal;
    if (currentLength === 0) return false;
    return lastFetchCount >= PAGE_SIZE;
  }, []);

  const fetchPage = useCallback(async (
    page: number,
    tab: string,
    mode: 'initial' | 'refresh' | 'loadMore' | 'silent',
  ) => {
    if (mode === 'loadMore') {
      if (
        loadingMoreRef.current ||
        !hasMoreData(totalRef.current, coursesRef.current.length, lastFetchCountRef.current)
      ) {
        return;
      }
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else if (mode === 'initial') {
      setLoading(true);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    }

    try {
      const params = { pageNum: page, pageSize: PAGE_SIZE };
      const res = await getCourseList({
        ...params,
        courseType: tab || undefined,
      });

      if (!isResourceApiOk(res)) {
        if (mode !== 'loadMore' && tab === activeTabRef.current) {
          setCourses([]);
          setTotal(0);
          setPageNum(1);
        }
        return;
      }

      const rows = getResourceRows<CourseItem>(res as { code?: number; rows?: CourseItem[] });
      const responseTotal = getListTotal(res as { total?: number }, rows.length);

      if (mode !== 'loadMore' && tab !== activeTabRef.current) {
        return;
      }

      if (mode === 'loadMore') {
        setCourses(prev => [...prev, ...rows]);
      } else {
        setCourses(rows);
      }
      setTotal(responseTotal);
      setPageNum(page);
      lastFetchCountRef.current = rows.length;
      hasLoadedOnceRef.current = true;
    } catch {
      if (mode !== 'loadMore' && tab === activeTabRef.current) {
        setCourses([]);
        setTotal(0);
        setPageNum(1);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [hasMoreData]);

  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    lastFetchCountRef.current = 0;
    const mode = hasLoadedOnceRef.current ? 'silent' : 'initial';
    void fetchPageRef.current(1, activeTab, mode);
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      void fetchPageRef.current(
        1,
        activeTabRef.current,
        hasLoadedOnceRef.current ? 'silent' : 'initial',
      );
    }, []),
  );

  const handleRefresh = useCallback(() => {
    void fetchPageRef.current(1, activeTabRef.current, 'refresh');
  }, []);

  const handleLoadMore = useCallback(() => {
    if (
      !hasLoadedOnceRef.current
      || loadingMoreRef.current
      || loading
      || refreshing
      || coursesRef.current.length === 0
    ) {
      return;
    }
    if (!hasMoreData(totalRef.current, coursesRef.current.length, lastFetchCountRef.current)) {
      return;
    }
    void fetchPageRef.current(pageNumRef.current + 1, activeTabRef.current, 'loadMore');
  }, [hasMoreData, loading, refreshing]);

  const hasMore = hasMoreData(total, courses.length, lastFetchCountRef.current);

  const getCourseTypeLabel = useCallback((courseType?: string) => {
    if (!courseType) return '课程';
    return typeLabelMap[courseType] ?? courseType;
  }, [typeLabelMap]);

  const renderCourseItem = useCallback(({ item }: { item: CourseItem }) => {
    const courseId = toCourseId(item.courseId);
    const coverUri = item.coverOssUrl?.trim();

    return (
      <TouchableOpacity
        style={styles.courseBox}
        activeOpacity={0.9}
        onPress={() => {
          if (!courseId) return;
          navigation.navigate('CourseDetail', { courseId });
        }}
      >
        <View style={styles.courseImgWrap}>
          <Image
            source={coverUri ? { uri: coverUri } : DEFAULT_COVER}
            style={styles.courseImg}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.courseImgGradient}
            pointerEvents="none"
          >
            <Flex align="center">
              <Image style={styles.gkrsIcon} source={require('@/assets/images/community/gkrc.png')} />
              <Text style={styles.gkrsText}>{formatCourseViewCount(item.viewCount)}</Text>
            </Flex>
          </LinearGradient>
          <View style={styles.courseCategoryTag}>
            <Text style={styles.liveTopCategoryText}>{getCourseTypeLabel(item.courseType)}</Text>
          </View>
          <View style={styles.coursePlayWrap} pointerEvents="none">
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="light" style={styles.coursePlayBlur} />
            ) : (
              <View style={[styles.coursePlayBlur, styles.coursePlayBlurFallback]} />
            )}
            <Image
              source={require('@/assets/images/community/icon_play.png')}
              style={styles.coursePlayIcon}
            />
          </View>
        </View>
        <View style={styles.courseBoxInfo}>
          <Text style={styles.courseTitle} numberOfLines={1}>{item.title || '未命名课程'}</Text>
          <Text style={styles.courseText} numberOfLines={2}>
            {item.courseIntro || '暂无课程简介'}
          </Text>
          <Flex justify="between" style={{ marginTop: 12 }}>
            <Flex>
              <Image style={styles.courseIcon} source={require('@/assets/images/community/user.png')} />
              <Text style={styles.courseBtmText}>{item.instructor || '讲师待定'}</Text>
            </Flex>
            <Flex>
              <Image style={styles.courseIcon} source={require('@/assets/images/community/dz.png')} />
              <Text style={styles.courseBtmText}>{item.likeCount ?? 0}</Text>
              <Image style={[styles.courseIcon, { marginLeft: 20 }]} source={require('@/assets/images/community/sc.png')} />
              <Text style={styles.courseBtmText}>{item.favoriteCount ?? 0}</Text>
            </Flex>
          </Flex>
        </View>
      </TouchableOpacity>
    );
  }, [getCourseTypeLabel, navigation]);

  const listHeader = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.courseTabBox}
    >
      {tabs.map(item => {
        const selected = activeTab === item.value;
        return (
          <TouchableOpacity
            style={[styles.courseTabItem, selected && styles.courseTabItemActive]}
            key={item.value || 'all'}
            onPress={() => setActiveTab(item.value)}
            activeOpacity={0.85}
          >
            <Text style={[styles.courseTabText, selected && styles.courseTabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const listFooter = loadingMore && hasMore ? (
    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
      <ActivityIndicator color={AppTheme.primaryColor} />
    </View>
  ) : null;

  const listEmpty = !loading ? (
    <Text style={{ textAlign: 'center', marginTop: 40, color: '#999', fontSize: 14 }}>
      暂无课程
    </Text>
  ) : null;

  return (
    <FlatList
      data={courses}
      keyExtractor={(item, index) => toCourseId(item.courseId) || `course-${index}`}
      renderItem={renderCourseItem}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={listEmpty}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onEndReached={hasMore ? handleLoadMore : undefined}
      onEndReachedThreshold={0.2}
    />
  );
}
