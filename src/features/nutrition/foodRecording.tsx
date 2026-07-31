import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/nutrition/foodRecording';
import NutritionTrendChart, {
  NUTRITION_TREND_SERIES,
  type NutritionTrendItem,
} from './components/NutritionTrendChart';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import {
  getMealAllRecords,
  getMealExecutionStatistics,
  type MealAllRecordMonthGroup,
  type MealExecutionStatistics,
} from '@/api/meal';
import {
  apiResourceData,
  getResourceRows,
  isResourceApiOk,
} from '@/src/utils/apiHelpers';
import {
  buildFoodRecordingRateCards,
  formatFoodRecordingDaySubtitle,
  formatFoodRecordingDayTitle,
  getFoodRecordingDayStatus,
  mapExecutionTrendToChart,
  resolveFoodRecordingOverallRange,
  resolveFoodRecordingTrendRange,
  type FoodRecordingRateTone,
} from './components/utils/foodRecordingHelpers';
import {
  flattenMealHistoryDays,
  formatMealHistoryMonthLabel,
} from '@/src/features/profile/medication/meal/utils/mealHistoryHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import type { RootStackParamList } from '@/route/router';
import { AppTheme } from '@/common/theme';

const PAGE_SIZE = 20;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const RATE_TAG_STYLE: Record<FoodRecordingRateTone, { box: object; text: object }> = {
  ok: { box: styles.rateTagOk, text: styles.rateTagTextOk },
  warn: { box: styles.rateTagWarn, text: styles.rateTagTextWarn },
  bad: { box: styles.rateTagBad, text: styles.rateTagTextBad },
};

export default function FoodRecordingPage() {
  const navigation = useNavigation<Nav>();
  const [activeNav, setActiveNav] = useState(0);
  const [trendRange, setTrendRange] = useState<7 | 30>(7);
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
  const [overallStatistics, setOverallStatistics] = useState<MealExecutionStatistics | null>(null);
  const [trendList, setTrendList] = useState<NutritionTrendItem[]>([]);
  const [monthGroups, setMonthGroups] = useState<MealAllRecordMonthGroup[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const hasMoreRef = useRef(true);
  const hasLoadedDetailRef = useRef(false);
  const monthGroupsRef = useRef<MealAllRecordMonthGroup[]>([]);
  const pageNumRef = useRef(1);

  const pageList = [
    {
      title: '趋势',
      icon: require('@/assets/images/nutrition/icon_qs.png'),
    },
    {
      title: '明细',
      icon: require('@/assets/images/nutrition/icon_mx.png'),
    },
  ];

  const rateCards = useMemo(
    () => buildFoodRecordingRateCards(overallStatistics),
    [overallStatistics],
  );

  const dietPatientRuleId = useMemo(
    () => (dietRule?.dietPatientRuleId != null ? String(dietRule.dietPatientRuleId) : undefined),
    [dietRule?.dietPatientRuleId],
  );
  const hasDietPrescription = !!dietPatientRuleId;

  const flatDays = useMemo(() => flattenMealHistoryDays(monthGroups), [monthGroups]);

  const loadDietRule = useCallback(async () => {
    try {
      const res = await getInUseDietPatientRuleInfo();
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        setDietRule(null);
        return null;
      }
      const rule = apiResourceData<DietPatientRuleInfo>(
        res as unknown as { code?: number; data?: DietPatientRuleInfo },
      ) ?? null;
      setDietRule(rule);
      return rule;
    } catch {
      setDietRule(null);
      return null;
    }
  }, []);

  const loadOverallStatistics = useCallback(async (rule?: DietPatientRuleInfo | null) => {
    const { startDate, endDate } = resolveFoodRecordingOverallRange(rule);
    const ruleId = rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined;
    try {
      const res = await getMealExecutionStatistics({
        dietPatientRuleId: ruleId,
        startDate,
        endDate,
      });
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        setOverallStatistics(null);
        return;
      }
      setOverallStatistics(
        apiResourceData<MealExecutionStatistics>(
          res as unknown as { code?: number; data?: MealExecutionStatistics },
        ) ?? null,
      );
    } catch {
      setOverallStatistics(null);
    }
  }, []);

  const loadTrendStatistics = useCallback(async (ruleId: string | undefined, range: 7 | 30) => {
    const { startDate, endDate } = resolveFoodRecordingTrendRange(range);
    try {
      const res = await getMealExecutionStatistics({
        dietPatientRuleId: ruleId,
        startDate,
        endDate,
      });
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        setTrendList([]);
        return;
      }
      const data = apiResourceData<MealExecutionStatistics>(
        res as unknown as { code?: number; data?: MealExecutionStatistics },
      );
      setTrendList(mapExecutionTrendToChart(data?.trendList));
    } catch {
      setTrendList([]);
    }
  }, []);

  const loadRecords = useCallback(async (
    mode: 'initial' | 'refresh' | 'more',
    ruleId?: string,
    currentPage = 1,
    currentGroups: MealAllRecordMonthGroup[] = [],
  ) => {
    if (mode === 'more') setLoadingMore(true);
    if (mode === 'initial') setLoadingDetail(true);

    const nextPage = mode === 'more' ? currentPage + 1 : 1;

    try {
      const res = await getMealAllRecords({
        dietPatientRuleId: ruleId,
        pageSize: PAGE_SIZE,
        pageNum: nextPage,
      });

      const rows = getResourceRows<MealAllRecordMonthGroup>(res as unknown as {
        code?: number;
        rows?: MealAllRecordMonthGroup[];
      });
      const total = (res as { total?: number }).total ?? 0;
      const mergedGroups = mode === 'more' ? [...currentGroups, ...rows] : rows;

      setMonthGroups(mergedGroups);
      monthGroupsRef.current = mergedGroups;
      pageNumRef.current = nextPage;

      // 最近一个月默认展开（仅首次，不覆盖用户手动收起）
      if (mode !== 'more' && mergedGroups.length > 0) {
        const latest = mergedGroups[0];
        const days = latest.list ?? [];
        const latestKey = latest.yyyyMM?.trim()
          || days[0]?.customerLocalDate?.trim()
          || `month-${days.length}`;
        setExpandedMonths(prev => (
          latestKey in prev ? prev : { ...prev, [latestKey]: true }
        ));
      }

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

  const loadDetail = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    const rule = dietRule ?? await loadDietRule();
    const ruleId = rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined;
    await loadRecords(
      mode,
      ruleId,
      mode === 'more' ? pageNumRef.current : 1,
      mode === 'more' ? monthGroupsRef.current : [],
    );
  }, [dietRule, loadDietRule, loadRecords]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        const rule = await loadDietRule();
        if (cancelled) return;
        await loadOverallStatistics(rule);
        if (!hasLoadedDetailRef.current) {
          await loadRecords(
            'initial',
            rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined,
          );
        } else {
          await loadRecords(
            'refresh',
            rule?.dietPatientRuleId != null ? String(rule.dietPatientRuleId) : undefined,
          );
        }
      };
      void run();
      return () => {
        cancelled = true;
      };
    }, [loadDietRule, loadOverallStatistics, loadRecords]),
  );

  useEffect(() => {
    void loadTrendStatistics(dietPatientRuleId, trendRange);
  }, [dietPatientRuleId, loadTrendStatistics, trendRange]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (activeNav !== 1) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 100 && hasMoreRef.current && !loadingMore) {
      void loadDetail('more');
    }
  }, [activeNav, loadDetail, loadingMore]);

  const toggleMonth = useCallback((monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  }, []);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0)']}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topBox}
        >
          <Flex style={styles.navBox}>
            {pageList.map((page, index) => {
              const active = activeNav === index;
              return (
                <TouchableOpacity
                  key={page.title}
                  activeOpacity={0.7}
                  style={[
                    styles.navItem,
                    active ? styles.navItemActive : styles.navItemInactive,
                  ]}
                  onPress={() => setActiveNav(index)}
                >
                  <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Image style={styles.navIcon} source={page.icon} />
                    <Text style={active ? styles.navTextActive : styles.navText}>
                      {page.title}
                    </Text>
                  </Flex>
                </TouchableOpacity>
              );
            })}
          </Flex>
        </LinearGradient>

        {activeNav === 0 ? (
          <>
            <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
              <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
                <Text style={styles.backImage1Text}>总体达标率</Text>
              </Flex>
            </ImageBackground>
            <View style={styles.rateBox}>
              {rateCards.map(card => {
                const tagStyle = RATE_TAG_STYLE[card.tone];
                return (
                  <View key={card.key} style={styles.rateItem}>
                    <Flex justify="between" align="center">
                      <Text style={styles.rateItemTitle}>{card.title}</Text>
                      {hasDietPrescription ? (
                        <View style={[styles.rateTag, tagStyle.box]}>
                          <Text style={[styles.rateTagText, tagStyle.text]}>{card.statusLabel}</Text>
                        </View>
                      ) : (
                        <View style={[styles.rateTag, styles.rateTagMuted]}>
                          <Text style={[styles.rateTagText, styles.rateTagTextMuted]}>--</Text>
                        </View>
                      )}
                    </Flex>
                    <Text style={styles.rateItemValue}>{card.valueText}</Text>
                  </View>
                );
              })}
            </View>

            <ImageBackground
              source={require('@/assets/images/schedule/calendarBack.png')}
              style={[styles.backImage1, { marginTop: 15 }]}
            >
              <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
                <Text style={styles.backImage1Text}>达标率趋势</Text>
                <Flex style={styles.tabBox}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setTrendRange(7)}
                    style={[styles.tabItem, trendRange === 7 && styles.tabItemActive]}
                  >
                    <Flex justify="center" style={{ flex: 1 }}>
                      <Text style={[styles.tabItemText, trendRange === 7 && styles.tabItemTextActive]}>近7天</Text>
                    </Flex>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setTrendRange(30)}
                    style={[styles.tabItem, trendRange === 30 && styles.tabItemActive]}
                  >
                    <Flex justify="center" style={{ flex: 1 }}>
                      <Text style={[styles.tabItemText, trendRange === 30 && styles.tabItemTextActive]}>近30天</Text>
                    </Flex>
                  </TouchableOpacity>
                </Flex>
              </Flex>
            </ImageBackground>
            <View style={{ position: 'relative' }}>
              <NutritionTrendChart trendList={trendList} />
              <Text style={styles.baselineHint}>虚线为达标基准线（90%）</Text>
            </View>

            <Flex style={styles.legendRow} justify="center" wrap="wrap">
              {NUTRITION_TREND_SERIES.map(item => (
                <Flex key={item.key} align="center" style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        ) : loadingDetail && flatDays.length === 0 ? (
          <View style={styles.trendEmpty}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : flatDays.length === 0 ? (
          <View style={[styles.trendEmpty, styles.emptyWrap]}>
            <EmptyRecord text="暂无饮食记录" />
          </View>
        ) : (
          <>
            {monthGroups.map(group => {
              const days = group.list ?? [];
              const monthKey = group.yyyyMM?.trim()
                || days[0]?.customerLocalDate?.trim()
                || `month-${days.length}`;
              const expanded = !!expandedMonths[monthKey];
              return (
                <View key={monthKey} style={[styles.detailBox, expanded && styles.detailBoxExpanded]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleMonth(monthKey)}
                  >
                    <Flex justify="between" align="center" style={styles.monthHeader}>
                      <Text style={styles.monthTitle}>
                        {formatMealHistoryMonthLabel(group.yyyyMM)}
                      </Text>
                      <Flex align="center">
                        <Text style={styles.monthCount}>{days.length}条记录</Text>
                        <Image
                          style={styles.monthIcon}
                          source={
                            expanded
                              ? require('@/assets/images/nutrition/icon_month_up.png')
                              : require('@/assets/images/nutrition/icon_month_down.png')
                          }
                        />
                      </Flex>
                    </Flex>
                  </TouchableOpacity>
                  {expanded ? days.map((day, index) => {
                    const dateKey = day.customerLocalDate?.trim();
                    if (!dateKey) return null;
                    const status = hasDietPrescription ? getFoodRecordingDayStatus(day) : null;
                    const tagStyle = status ? RATE_TAG_STYLE[status.tone] : null;
                    const isLast = index === days.length - 1;
                    return (
                      <TouchableOpacity
                        key={dateKey}
                        style={[styles.dayItem, isLast && styles.dayItemLast]}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('MealDayDetailPage', {
                          customerLocalDate: dateKey,
                        })}
                      >
                        <Flex align="center" style={{ flex: 1 }}>
                          <Image
                            style={styles.dayIcon}
                            source={require('@/assets/images/nutrition/icon_meal_day.png')}
                          />
                          <View style={styles.dayInfo}>
                            <Text style={styles.dayTitle}>{formatFoodRecordingDayTitle(dateKey)}</Text>
                            <Text style={styles.daySubtitle}>{formatFoodRecordingDaySubtitle(day)}</Text>
                          </View>
                          <Flex align="center">
                            {status && tagStyle ? (
                              <View style={[styles.rateTag, tagStyle.box]}>
                                <Text style={[styles.rateTagText, tagStyle.text]}>{status.label}</Text>
                              </View>
                            ) : (
                              <View style={[styles.rateTag, styles.rateTagMuted]}>
                                <Text style={[styles.rateTagText, styles.rateTagTextMuted]}>--</Text>
                              </View>
                            )}
                            <Image
                              style={styles.dayRightIcon}
                              source={require('@/assets/images/nutrition/icon_right.png')}
                            />
                          </Flex>
                        </Flex>
                      </TouchableOpacity>
                    );
                  }) : null}
                </View>
              );
            })}

            {loadingMore ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator color={AppTheme.primaryColor} />
              </View>
            ) : null}

            {!hasMore && flatDays.length > 0 ? (
              <Text style={styles.detailFooterText}>没有更多了</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </PageLayout>
  );
}
