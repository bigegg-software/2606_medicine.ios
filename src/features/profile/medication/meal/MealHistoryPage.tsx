import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import NoData from '@/src/components/noData';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import {
  getMealAllRecords,
  getMealExecutionStatistics,
  type MealAllRecordMonthGroup,
  type MealExecutionStatistics,
} from '@/api/meal';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import styles from '@/css/medication/mealHistory';
import MealTrendChart from './components/MealTrendChart';
import {
  flattenMealHistoryDays,
  formatDayListSubtitle,
  formatMealHistoryDayTitle,
  formatMealHistoryMonthLabel,
  getDayComplianceDisplay,
  getTrendDateRange,
  getPrescriptionDateRange,
  getPrescriptionPeriodDayCount,
  formatMealHistoryRate,
  normalizeComplianceRate,
} from './utils/mealHistoryHelpers';

const PAGE_SIZE = 20;
const HISTORY_TABS = [
  { label: '趋势', value: 'trend' },
  { label: '明细', value: 'detail' },
] as const;

type HistoryTab = (typeof HISTORY_TABS)[number]['value'];
type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{formatMealHistoryRate(value)}%</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export default function MealHistoryPage() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<HistoryTab>('trend');
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyRange, setHistoryRange] = useState<'7' | '30'>('7');
  const [overallStatistics, setOverallStatistics] = useState<MealExecutionStatistics | null>(null);
  const [chartTrendList, setChartTrendList] = useState<MealExecutionStatistics['trendList']>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [monthGroups, setMonthGroups] = useState<MealAllRecordMonthGroup[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [dietPatientRuleId, setDietPatientRuleId] = useState<string | undefined>();
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);

  const hasMoreRef = useRef(true);
  const hasLoadedTrendRef = useRef(false);
  const hasLoadedDetailRef = useRef(false);
  const dietRuleRef = useRef<DietPatientRuleInfo | null>(null);
  const monthGroupsRef = useRef<MealAllRecordMonthGroup[]>([]);
  const pageNumRef = useRef(1);
  const sliderAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    Animated.timing(sliderAnim, {
      toValue: historyRange === '7' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [historyRange, sliderAnim]);

  const onSegmentLayout = useCallback((event: LayoutChangeEvent) => {
    setSegmentWidth(event.nativeEvent.layout.width / 2);
  }, []);

  const resolveDietRule = useCallback(async () => {
    if (dietRuleRef.current) return dietRuleRef.current;
    try {
      const ruleRes = await getInUseDietPatientRuleInfo();
      const rule = apiResourceData<DietPatientRuleInfo>(ruleRes as any) ?? null;
      dietRuleRef.current = rule;
      setDietRule(rule);
      if (rule?.dietPatientRuleId != null) {
        setDietPatientRuleId(String(rule.dietPatientRuleId));
      }
      return rule;
    } catch {
      return null;
    }
  }, []);

  const loadOverallStatistics = useCallback(async (rule?: DietPatientRuleInfo | null) => {
    const { startDate, endDate } = getPrescriptionDateRange(rule);
    const ruleId = rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : dietPatientRuleId;
    try {
      const res = await getMealExecutionStatistics({
        dietPatientRuleId: ruleId,
        startDate,
        endDate,
      });
      if (isResourceApiOk(res)) {
        setOverallStatistics(apiResourceData<MealExecutionStatistics>(res as { code?: number; data?: MealExecutionStatistics }) ?? null);
      } else {
        setOverallStatistics(null);
      }
    } catch {
      setOverallStatistics(null);
    }
  }, [dietPatientRuleId]);

  const loadChartTrend = useCallback(async (ruleId?: string, range: '7' | '30' = '7') => {
    const { startDate, endDate } = getTrendDateRange(range);
    setLoadingChart(true);
    try {
      const res = await getMealExecutionStatistics({
        dietPatientRuleId: ruleId,
        startDate,
        endDate,
      });
      if (isResourceApiOk(res)) {
        const data = apiResourceData<MealExecutionStatistics>(res as { code?: number; data?: MealExecutionStatistics });
        setChartTrendList(data?.trendList ?? []);
      } else {
        setChartTrendList([]);
      }
    } catch {
      setChartTrendList([]);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  const loadRecords = useCallback(async (
    mode: 'initial' | 'refresh' | 'more',
    ruleId?: string,
    currentPage = 1,
    currentGroups: MealAllRecordMonthGroup[] = [],
  ) => {
    if (mode === 'more') setLoadingMore(true);

    const nextPage = mode === 'more' ? currentPage + 1 : 1;

    try {
      const res = await getMealAllRecords({
        dietPatientRuleId: ruleId,
        pageSize: PAGE_SIZE,
        pageNum: nextPage,
      });

      const rows = getResourceRows<MealAllRecordMonthGroup>(res);
      const total = (res as { total?: number }).total ?? 0;
      const mergedGroups = mode === 'more' ? [...currentGroups, ...rows] : rows;

      setMonthGroups(mergedGroups);
      monthGroupsRef.current = mergedGroups;
      pageNumRef.current = nextPage;

      const loadedDays = mergedGroups.reduce((sum, group) => sum + (group.list?.length ?? 0), 0);
      hasMoreRef.current = loadedDays < total;
      setHasMore(hasMoreRef.current);
    } catch {
      if (mode !== 'more') {
        setMonthGroups([]);
        monthGroupsRef.current = [];
      }
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      hasLoadedDetailRef.current = true;
      setLoadingDetail(false);
      setLoadingMore(false);
    }
  }, []);

  const loadTrend = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoadingTrend(true);
    const rule = await resolveDietRule();
    const ruleId = rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined;
    await Promise.all([
      loadOverallStatistics(rule),
      loadChartTrend(ruleId, historyRange),
    ]);
    hasLoadedTrendRef.current = true;
    setLoadingTrend(false);
  }, [historyRange, loadChartTrend, loadOverallStatistics, resolveDietRule]);

  const loadDetail = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    if (mode === 'initial') setLoadingDetail(true);
    const rule = await resolveDietRule();
    const ruleId = rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined;
    await loadRecords(
      mode,
      ruleId,
      mode === 'more' ? pageNumRef.current : 1,
      mode === 'more' ? monthGroupsRef.current : [],
    );
  }, [loadRecords, resolveDietRule]);

  const loadTrendRef = useRef(loadTrend);
  const loadDetailRef = useRef(loadDetail);
  loadTrendRef.current = loadTrend;
  loadDetailRef.current = loadDetail;

  useFocusEffect(
    useCallback(() => {
      void loadTrendRef.current(hasLoadedTrendRef.current ? 'refresh' : 'initial');
      void loadDetailRef.current(hasLoadedDetailRef.current ? 'refresh' : 'initial');
    }, []),
  );

  useEffect(() => {
    if (!hasLoadedTrendRef.current) return;
    void (async () => {
      const rule = await resolveDietRule();
      const ruleId = rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined;
      await loadChartTrend(ruleId, historyRange);
    })();
  }, [historyRange, loadChartTrend, resolveDietRule]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'trend') {
        await loadTrend('refresh');
      } else {
        await loadDetail('refresh');
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, loadDetail, loadTrend]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (activeTab !== 'detail') return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 100 && hasMoreRef.current && !loadingMore) {
      void loadDetail('more');
    }
  }, [activeTab, loadDetail, loadingMore]);

  const flatDays = flattenMealHistoryDays(monthGroups);
  const isInitialLoading = activeTab === 'trend' ? loadingTrend : loadingDetail;

  const renderTrendTab = () => (
    <>
      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>总体达标率</Text>
          <Text style={styles.cardSubTitle}>
            处方内统计{getPrescriptionPeriodDayCount(dietRule)}天
          </Text>
        </View>

        <View style={styles.statGrid}>
          <StatCard
            label="热量达标率"
            value={normalizeComplianceRate(overallStatistics?.calorieComplianceRate)}
          />
          <StatCard
            label="蛋白达标率"
            value={normalizeComplianceRate(overallStatistics?.proteinComplianceRate)}
          />
          <StatCard
            label="饮水达标率"
            value={normalizeComplianceRate(overallStatistics?.waterComplianceRate)}
          />
        </View>
      </View>

      <Flex justify="between" align="center" style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>达标率趋势</Text>
        <View onLayout={onSegmentLayout} style={styles.sliderContainer}>
          <Animated.View
            style={[
              styles.sliderIndicator,
              {
                transform: [{
                  translateX: sliderAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, segmentWidth + 4],
                  }),
                }],
              },
            ]}
          />
          <TouchableOpacity style={styles.sliderBtn} onPress={() => setHistoryRange('7')}>
            <Text style={historyRange === '7' ? styles.sliderTextActive : styles.sliderTextInactive}>近7天</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sliderBtn} onPress={() => setHistoryRange('30')}>
            <Text style={historyRange === '30' ? styles.sliderTextActive : styles.sliderTextInactive}>近30天</Text>
          </TouchableOpacity>
        </View>
      </Flex>
      <View style={[styles.card, styles.trendCard]}>
        {loadingChart ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : (
          <MealTrendChart trendList={chartTrendList} />
        )}
      </View>
    </>
  );

  const renderDetailTab = () => (
    <>
      {flatDays.length === 0 ? (
        <View style={[styles.card, { paddingVertical: 32 }]}>
          <NoData text="暂无饮食记录" />
        </View>
      ) : (
        monthGroups.map(group => (
          <View key={group.yyyyMM ?? group.list?.[0]?.customerLocalDate} style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.monthTitle}>{formatMealHistoryMonthLabel(group.yyyyMM)}</Text>
            {(group.list ?? []).map(day => {
              const dateKey = day.customerLocalDate?.trim();
              if (!dateKey) return null;
              const compliance = getDayComplianceDisplay(day);
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={styles.dayItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('MealDayDetailPage', { customerLocalDate: dateKey })}>
                  <Flex justify="between" align="center">
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.dayTitle}>{formatMealHistoryDayTitle(dateKey)}</Text>
                      <Text style={styles.daySubtitle}>{formatDayListSubtitle(day)}</Text>
                    </View>
                    <Flex align="center">
                      {compliance ? (
                        <Text style={[styles.dayComplianceText, { color: compliance.color }]}>
                          {compliance.label}
                        </Text>
                      ) : null}
                      <Text style={styles.dayArrow}>›</Text>
                    </Flex>
                  </Flex>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}

      {loadingMore ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : null}

      {!hasMore && flatDays.length > 0 ? (
        <Text style={[styles.cardSubTitle, { textAlign: 'center', marginTop: 12 }]}>没有更多了</Text>
      ) : null}
    </>
  );

  return (
    <PageLayout style={styles.container} contentStyle={styles.pageBody}>
      <Flex justify="center" style={styles.tabBox}>
        {HISTORY_TABS.map(item => (
          <TouchableOpacity
            style={styles.tabCol}
            key={item.value}
            onPress={() => {
              if (item.value === activeTab) return;
              setActiveTab(item.value);
            }}>
            <View style={styles.tabItemWrap}>
              <Text style={[styles.tabText, activeTab === item.value && styles.activeTabText]}>
                {item.label}
              </Text>
              {activeTab === item.value ? (
                <View style={styles.tabIndicatorWrap}>
                  <Image source={require('@/assets/images/user/btm.png')} style={styles.tabIndicator} />
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </Flex>

      {isInitialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={AppTheme.primaryColor}
            />
          )}>
          {activeTab === 'trend' ? renderTrendTab() : renderDetailTab()}
        </ScrollView>
      )}
    </PageLayout>
  );
}
