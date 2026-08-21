import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import PageLayout from '@/src/components/PageLayout';
import EmptyRecord from '@/src/components/EmptyRecord';
import styles from '@/css/schedule/schedule';
import DietHistoryArchiveCard from './components/DietHistoryArchiveCard';
import {
  DIET_HISTORY_FILTER_OPTIONS,
  fetchDietHistoryArchivePage,
  getHistoryDietNutritionParams,
  type DietHistoryArchiveItem,
  type DietHistoryPlanFilter,
} from './components/utils/dietHistoryArchiveHelpers';

const PAGE_SIZE = 20;

function mergeArchiveItems(
  existing: DietHistoryArchiveItem[],
  incoming: DietHistoryArchiveItem[],
) {
  const map = new Map<string, DietHistoryArchiveItem>();
  [...existing, ...incoming].forEach(item => {
    map.set(item.id, item);
  });
  return [...map.values()];
}

export default function DietHistoryPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<DietHistoryPlanFilter>('all');
  const [items, setItems] = useState<DietHistoryArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const hasMoreRef = useRef(true);
  const pageNumRef = useRef(1);
  const filterRef = useRef(filter);
  const loadingMoreRef = useRef(false);

  filterRef.current = filter;

  const loadPlans = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    const currentFilter = filterRef.current;
    const nextPageNum = mode === 'more' ? pageNumRef.current + 1 : 1;

    if (mode === 'more') {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { rows, hasMore: nextHasMore } = await fetchDietHistoryArchivePage(
        currentFilter,
        nextPageNum,
        PAGE_SIZE,
      );

      setItems(prev => (mode === 'more' ? mergeArchiveItems(prev, rows) : rows));
      pageNumRef.current = nextPageNum;
      setHasMore(nextHasMore);
      hasMoreRef.current = nextHasMore;
    } catch {
      if (mode !== 'more') {
        setItems([]);
      }
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  const handleFilterChange = useCallback((nextFilter: DietHistoryPlanFilter) => {
    if (nextFilter === filterRef.current) return;
    filterRef.current = nextFilter;
    setFilter(nextFilter);
    pageNumRef.current = 1;
    hasMoreRef.current = true;
    void loadPlans('initial');
  }, [loadPlans]);

  useFocusEffect(
    useCallback(() => {
      void loadPlans('initial');
    }, [loadPlans]),
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (loadingMoreRef.current || loading || refreshing || !hasMoreRef.current) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 120) {
      void loadPlans('more');
    }
  }, [loadPlans, loading, refreshing]);

  if (loading && !refreshing && items.length === 0) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.historyPageBody}>
        <Flex justify="center" style={styles.center}>
          <ActivityIndicator color="#6D925E" />
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} contentStyle={styles.historyPageBody}>
      <View style={styles.historyFilterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {DIET_HISTORY_FILTER_OPTIONS.map(option => {
            const active = filter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                style={[styles.filterItem, active && styles.filterItemActive]}
                onPress={() => handleFilterChange(option.value)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.historyListScroll}
        contentContainerStyle={[
          styles.historyListContent,
          items.length === 0 && styles.historyListContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPlans('refresh')}
            colors={['#6D925E']}
            tintColor="#6D925E"
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.length > 0 ? (
          items.map(item => (
            <DietHistoryArchiveCard
              key={item.id}
              item={item}
              onPress={() => {
                navigation.navigate('NutritionPage', getHistoryDietNutritionParams(item.id));
              }}
            />
          ))
        ) : (
          <View style={styles.historyEmptyWrap}>
            <EmptyRecord text="暂无历史营养处方" />
          </View>
        )}

        {loadingMore ? (
          <ActivityIndicator color="#6D925E" style={{ marginTop: 16 }} />
        ) : null}
        {!loadingMore && items.length > 0 && !hasMore ? (
          <Text style={styles.loadMoreText}>没有更多了</Text>
        ) : null}
      </ScrollView>
    </PageLayout>
  );
}
