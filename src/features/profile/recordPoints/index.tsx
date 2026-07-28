import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/recordPoints';
import { getUserTokenDetailList, type UserTokenDetail } from '@/api/userTokenDetail';
import { getResourceRows } from '@/src/utils/apiHelpers';
import {
  POINTS_TABS,
  type PointsTabKey,
  getPointsTitle,
  getPointsTime,
  resolvePointsDelta,
  formatPointsAmount,
  isPointsIncome,
} from './utils/recordPointsHelpers';

const PAGE_SIZE = 20;

export default function RecordPointsPage() {
  const [activeTab, setActiveTab] = useState<PointsTabKey>('all');
  const [items, setItems] = useState<UserTokenDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const load = useCallback(async (opts?: { refresh?: boolean; page?: number }) => {
    const refresh = opts?.refresh === true;
    const page = opts?.page ?? 1;
    const tab = POINTS_TABS.find(t => t.key === activeTabRef.current);

    if (refresh) setRefreshing(true);
    else if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getUserTokenDetailList({
        incomeType: tab?.incomeType,
        pageNum: page,
        pageSize: PAGE_SIZE,
      });
      const rows = getResourceRows(res as { code?: number; rows?: UserTokenDetail[] });
      const total = Number((res as { total?: number })?.total ?? 0);

      setItems(prev => (page === 1 ? rows : [...prev, ...rows]));
      setPageNum(page);
      setHasMore(rows.length >= PAGE_SIZE && (total <= 0 || page * PAGE_SIZE < total));
    } catch {
      if (page === 1) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setHasMore(true);
    setPageNum(1);
    load({ page: 1 });
  }, [activeTab, load]);

  const onEndReached = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    load({ page: pageNum + 1 });
  }, [loading, refreshing, loadingMore, hasMore, pageNum, load]);

  const renderItem = useCallback(
    ({ item }: { item: UserTokenDetail }) => {
      const delta = resolvePointsDelta(item.rewardsTokens, activeTab);
      const income = isPointsIncome(delta);
      return (
        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {getPointsTitle(item)}
            </Text>
            <Text style={styles.cardTime} numberOfLines={1}>
              {getPointsTime(item)}
            </Text>
          </View>
          <Text
            style={[
              styles.cardAmount,
              income ? styles.cardAmountIncome : styles.cardAmountExpense,
            ]}>
            {formatPointsAmount(delta)}
          </Text>
        </View>
      );
    },
    [activeTab],
  );

  return (
    <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.tabBar}>
        <View style={styles.tabTrack}>
          {POINTS_TABS.map(tab => {
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                activeOpacity={0.8}
                onPress={() => {
                  if (tab.key === activeTab) return;
                  setActiveTab(tab.key);
                }}>
                <Text style={active ? styles.tabTextActive : styles.tabText}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            String(item.tokenDetailId ?? `${item.createTime}-${index}`)
          }
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true, page: 1 })} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image
                style={styles.emptyImage}
                source={require('@/assets/images/user/zwjl.png')}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>暂无积分记录</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
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
