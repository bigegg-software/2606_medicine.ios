import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import type { HistoryExPatientRule } from '@/api/schedule';
import { AppTheme } from '@/common/theme';
import PageLayout from '@/src/components/PageLayout';
import NoData from '@/src/components/noData';
import styles from '@/css/schedule/schedule';
import {
  fetchHistoryPlanPage,
  getHistoryStatusLabel,
  HISTORY_PLAN_FILTER_OPTIONS,
  sortHistoryPlans,
  toHistoryPlanItem,
  type HistoryPlanFilter,
} from './scheduleHelpers';

const PAGE_SIZE = 20;

function getHistoryPlanKey(item: HistoryExPatientRule) {
  return item.exPatientRuleId != null && item.exPatientRuleId !== ''
    ? String(item.exPatientRuleId)
    : `${item.startDate ?? ''}-${item.endDate ?? ''}-${item.prescriptionName ?? ''}`;
}

function mergeHistoryPlans(existing: HistoryExPatientRule[], incoming: HistoryExPatientRule[]) {
  const map = new Map<string, HistoryExPatientRule>();
  [...existing, ...incoming].forEach(item => {
    map.set(getHistoryPlanKey(item), item);
  });
  return sortHistoryPlans([...map.values()]);
}

export default function ScheduleHistoryPage() {
  const [filter, setFilter] = useState<HistoryPlanFilter>('all');
  const [plans, setPlans] = useState<HistoryExPatientRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const hasMoreRef = useRef(true);
  const pageNumRef = useRef(1);
  const filterRef = useRef(filter);

  filterRef.current = filter;

  const historyItems = useMemo(() => plans.map(toHistoryPlanItem), [plans]);

  const loadPlans = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    const currentFilter = filterRef.current;
    const nextPageNum = mode === 'more' ? pageNumRef.current + 1 : 1;

    if (mode === 'initial') {
      setLoading(true);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { rows, hasMore: nextHasMore } = await fetchHistoryPlanPage(
        currentFilter,
        nextPageNum,
        PAGE_SIZE,
      );

      setPlans(prev => (mode === 'more' ? mergeHistoryPlans(prev, rows) : rows));
      setPageNum(nextPageNum);
      setHasMore(nextHasMore);
      pageNumRef.current = nextPageNum;
      hasMoreRef.current = nextHasMore;
    } catch {
      if (mode !== 'more') {
        setPlans([]);
      }
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const handleFilterChange = useCallback((nextFilter: HistoryPlanFilter) => {
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
    if (loadingMore || loading || refreshing || !hasMoreRef.current) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 120) {
      void loadPlans('more');
    }
  }, [loadPlans, loading, loadingMore, refreshing]);

  if (loading && !refreshing && historyItems.length === 0) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.historyPageBody}>
        <Flex justify="center" style={{ flex: 1 }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} contentStyle={styles.historyPageBody}>
      <View style={styles.historyFilterSection}>
        <View style={styles.filterRow}>
          {HISTORY_PLAN_FILTER_OPTIONS.map(option => {
            const active = filter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.7}
                style={[styles.filterItem, active && styles.filterItemActive]}
                onPress={() => handleFilterChange(option.value)}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.historyListScroll}
        contentContainerStyle={[
          styles.historyListContent,
          historyItems.length === 0 && styles.historyListContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPlans('refresh')}
            colors={[AppTheme.primaryColor]}
            tintColor={AppTheme.primaryColor}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {historyItems.length > 0 ? (
          historyItems.map(item => (
            <Flex justify="between" style={styles.medicalBox} key={String(item.id)}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.medicalTitle, { marginTop: 0 }]}>{item.title}</Text>
                <Text style={[styles.leftText, { marginTop: 6 }]}>{item.cycle}</Text>
                {item.status === 1 && item.stopReason ? (
                  <Text style={styles.statusInfo}>暂停原因：{item.stopReason}</Text>
                ) : null}
              </View>
              <Flex style={item.status === 2 ? styles.yjsBox : styles.yztBox}>
                <Text style={styles.yztText}>{getHistoryStatusLabel(item.status)}</Text>
              </Flex>
            </Flex>
          ))
        ) : (
          <View style={styles.historyEmptyWrap}>
            <NoData text="暂无历史计划" />
          </View>
        )}

        {loadingMore ? (
          <ActivityIndicator color={AppTheme.primaryColor} style={{ marginTop: 16 }} />
        ) : null}
        {!loadingMore && historyItems.length > 0 && !hasMore ? (
          <Text style={styles.loadMoreText}>没有更多了</Text>
        ) : null}
      </ScrollView>
    </PageLayout>
  );
}
