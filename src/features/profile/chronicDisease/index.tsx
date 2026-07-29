import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getChronicDiseaseFrontList, type ChronicDiseaseRecord } from '@/api/chronicDisease';
import { AppTheme } from '@/common/theme';
import styles from '@/css/chronicDisease/index';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import ChronicDiseaseCard from './components/ChronicDiseaseCard';
import {
    DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS,
    loadChronicIndexIndicators,
    loadDiseaseTypeLabelMap,
    type ChronicDiseaseDailyIndicators,
} from './components/chronicData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 5;

function getListTotal(
    res: { code?: number; total?: number; rows?: unknown[] } | null | undefined,
    rowsLength: number,
) {
    if (!isResourceApiOk(res)) return 0;
    if (typeof res?.total === 'number') return res.total;
    return rowsLength;
}

type FetchMode = 'initial' | 'refresh' | 'loadMore' | 'silent';

export default function ChronicDiseasePage() {
    const navigation = useNavigation<Nav>();
    const [records, setRecords] = useState<ChronicDiseaseRecord[]>([]);
    const [diseaseTypeLabels, setDiseaseTypeLabels] = useState<Record<string, string>>({});
    const [dailyIndicatorsById, setDailyIndicatorsById] = useState<Map<number, ChronicDiseaseDailyIndicators>>(
        new Map(),
    );
    const [total, setTotal] = useState(0);
    const [pageNum, setPageNum] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [lastFetchCount, setLastFetchCount] = useState(0);

    const recordsRef = useRef(records);
    const totalRef = useRef(total);
    const pageNumRef = useRef(pageNum);
    const diseaseTypeLabelsRef = useRef(diseaseTypeLabels);
    const loadingMoreRef = useRef(false);
    const hasLoadedOnceRef = useRef(false);
    const lastFetchCountRef = useRef(0);

    recordsRef.current = records;
    totalRef.current = total;
    pageNumRef.current = pageNum;
    diseaseTypeLabelsRef.current = diseaseTypeLabels;
    hasLoadedOnceRef.current = hasLoadedOnce;
    lastFetchCountRef.current = lastFetchCount;

    const hasMoreData = useCallback((currentTotal: number, currentRecordsLength: number, fetchedCount: number) => {
        if (currentTotal > 0) {
            return currentRecordsLength < currentTotal;
        }
        return fetchedCount === PAGE_SIZE;
    }, []);

    const fetchPage = useCallback(async (page: number, mode: FetchMode) => {
        if (mode === 'loadMore') {
            const currentTotal = totalRef.current;
            const currentLength = recordsRef.current.length;
            if (
                loadingMoreRef.current ||
                !hasMoreData(currentTotal, currentLength, lastFetchCountRef.current)
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
            const [res, labelMap] = await Promise.all([
                getChronicDiseaseFrontList({ pageNum: page, pageSize: PAGE_SIZE }),
                Object.keys(diseaseTypeLabelsRef.current).length > 0
                    ? Promise.resolve(diseaseTypeLabelsRef.current)
                    : loadDiseaseTypeLabelMap(),
            ]);

            if (Object.keys(diseaseTypeLabelsRef.current).length === 0) {
                setDiseaseTypeLabels(labelMap);
                diseaseTypeLabelsRef.current = labelMap;
            }

            const rows = getResourceRows(res as { code?: number; rows?: ChronicDiseaseRecord[] });
            const responseTotal = getListTotal(
                res as { code?: number; total?: number; rows?: ChronicDiseaseRecord[] },
                rows.length,
            );

            if (mode === 'loadMore') {
                setRecords(prev => [...prev, ...rows]);
                const indicators = await loadChronicIndexIndicators(rows, labelMap);
                setDailyIndicatorsById(prev => {
                    const next = new Map(prev);
                    indicators.forEach((value, key) => next.set(key, value));
                    return next;
                });
            } else {
                setRecords(rows);
                const indicators = await loadChronicIndexIndicators(rows, labelMap);
                setDailyIndicatorsById(indicators);
            }

            setTotal(responseTotal);
            setPageNum(page);
            setLastFetchCount(rows.length);
            lastFetchCountRef.current = rows.length;
        } catch {
            if (mode !== 'loadMore') {
                setRecords([]);
                setDailyIndicatorsById(new Map());
                setTotal(0);
                setPageNum(1);
            }
        } finally {
            if (mode === 'initial' || mode === 'silent') {
                hasLoadedOnceRef.current = true;
                setHasLoadedOnce(true);
            }
            if (mode === 'initial') {
                setLoading(false);
            }
            if (mode === 'refresh') {
                setRefreshing(false);
            }
            if (mode === 'loadMore') {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [hasMoreData]);

    const fetchPageRef = useRef(fetchPage);
    fetchPageRef.current = fetchPage;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        void fetchPageRef.current(1, 'initial');
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            void fetchPageRef.current(1, hasLoadedOnceRef.current ? 'silent' : 'initial');
        }, []),
    );

    const hasMore = hasMoreData(total, records.length, lastFetchCount);

    const handleRefresh = useCallback(() => {
        void fetchPageRef.current(1, 'refresh');
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!hasLoadedOnceRef.current || loadingMoreRef.current || refreshing || loading) {
            return;
        }
        void fetchPageRef.current(pageNumRef.current + 1, 'loadMore');
    }, [loading, refreshing]);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
                handleLoadMore();
            }
        },
        [handleLoadMore],
    );

    const listFooter = (() => {
        if (loadingMore) {
            return (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            );
        }
        if (records.length > 0 && !hasMore) {
            return (
                <Text style={{ textAlign: 'center', color: '#999999', paddingVertical: 16, fontSize: 12 }}>
                    没有更多了
                </Text>
            );
        }
        return null;
    })();

    if (!hasLoadedOnce && loading) {
        return (
            <PageLayout style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} edges={[]}>
            <ScrollView
                contentContainerStyle={records.length === 0 ? styles.bodyEmpty : styles.body}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={AppTheme.primaryColor}
                        colors={[AppTheme.primaryColor]}
                    />
                }
                onScroll={handleScroll}
                scrollEventThrottle={400}>
                {records.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Image
                            style={styles.emptyImage}
                            source={require('@/assets/images/user/zwjl.png')}
                            resizeMode="contain"
                        />
                        <Text style={styles.emptyText}>暂无慢病记录</Text>
                    </View>
                ) : (
                    <View style={styles.infoBox}>
                        <Flex justify="between">
                            <Text style={styles.sectionTitle}>已建档慢病</Text>
                        </Flex>
                        {records.map(item => {
                            const dailyIndicators =
                                item.id != null
                                    ? dailyIndicatorsById.get(item.id) ?? DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS
                                    : DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS;

                            return (
                                <ChronicDiseaseCard
                                    key={String(item.id)}
                                    record={item}
                                    diseaseTypeLabels={diseaseTypeLabels}
                                    dailyIndicators={dailyIndicators}
                                    onPress={() =>
                                        item.id != null
                                        && navigation.navigate('ChronicDiseaseDetailPage', { id: item.id })
                                    }
                                />
                            );
                        })}
                        {listFooter}
                    </View>
                )}
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomBarButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ChronicDiseaseAddPage')}>
                    <Flex style={{ flex: 1 }} justify="center" align="center">
                        <Image
                            style={styles.bottomBarButtonImg}
                            source={require('@/assets/images/vitals/icon_add.png')}
                        />
                        <Text style={styles.bottomBarButtonText}>添加慢病</Text>
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}
