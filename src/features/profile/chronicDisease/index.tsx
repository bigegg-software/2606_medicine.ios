import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, type ImageSourcePropType, type ListRenderItem, } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getChronicDiseaseFrontList, type ChronicDiseaseRecord } from '@/api/chronicDisease';
import { AppTheme } from '@/common/theme';
import styles from '@/css/chronicDisease/index';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import NoData from '@/src/components/noData';
import {
    CHRONIC_DISEASE_CONTROL_STATUS_LABELS,
    DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS,
    loadChronicIndexIndicators,
    loadDiseaseTypeLabelMap,
    resolveDiseaseTypeLabel,
    type ChronicDiseaseControlStatus,
    type ChronicDiseaseDailyIndicators,
    type ChronicDiseaseMealRecordStatus,
    type ChronicDiseaseVitalsTodayStatus,
} from './components/chronicData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 5;

const CHRONIC_INDICATOR_COLOR = {
    muted: '#999999',
    ok: '#34B69F',
    warning: '#FF8B07',
} as const;

function formatDiagnosisTime(value?: string): string {
    if (!value) return '--';
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
        const [year, month] = trimmed.split('-');
        return `${year}年${Number(month)}月`;
    }
    return trimmed;
}

function getVitalsTodayIndicator(status: ChronicDiseaseVitalsTodayStatus) {
    return status === 'measured'
        ? { label: '今日已测', color: CHRONIC_INDICATOR_COLOR.ok }
        : { label: '今日未测', color: CHRONIC_INDICATOR_COLOR.muted };
}

function getMedicationPendingIndicator(pendingCount: number) {
    return pendingCount > 0
        ? { label: `${pendingCount}项待服`, color: CHRONIC_INDICATOR_COLOR.warning }
        : { label: '无待服', color: CHRONIC_INDICATOR_COLOR.ok };
}

function getMealRecordIndicator(
    status: ChronicDiseaseMealRecordStatus,
    mealLabel = '晚餐',
) {
    return status === 'recorded'
        ? { label: '饮食已记录', color: CHRONIC_INDICATOR_COLOR.ok }
        : { label: `${mealLabel}未记录`, color: CHRONIC_INDICATOR_COLOR.muted };
}

function getControlStatusStyles(status: ChronicDiseaseControlStatus) {
    switch (status) {
        case 'attention':
            return {
                box: styles.infoStatusBoxAttention,
                icon: styles.infoStatusIconAttention,
                text: styles.infoStatusTextAttention,
            };
        case 'highRisk':
            return {
                box: styles.infoStatusBoxHighRisk,
                icon: styles.infoStatusIconHighRisk,
                text: styles.infoStatusTextHighRisk,
            };
        default:
            return {
                box: styles.infoStatusBox,
                icon: styles.infoStatusIcon,
                text: styles.infoStatusText,
            };
    }
}

function IndicatorItem({
    icon,
    label,
    color,
}: {
    icon: ImageSourcePropType;
    label: string;
    color: string;
}) {
    return (
        <Flex>
            <Image style={[styles.infoContentImage, { tintColor: color }]} source={icon} />
            <Text style={[styles.infoContentText, { color }]}>{label}</Text>
        </Flex>
    );
}

type ChronicDiseaseCardProps = {
    record: ChronicDiseaseRecord;
    diseaseTypeLabels: Record<string, string>;
    dailyIndicators: ChronicDiseaseDailyIndicators;
    onPress: () => void;
};

function ChronicDiseaseCard({
    record,
    diseaseTypeLabels,
    dailyIndicators,
    onPress,
}: ChronicDiseaseCardProps) {
    const diseaseLabel = resolveDiseaseTypeLabel(record.diseaseType, diseaseTypeLabels);
    const statusStyles = getControlStatusStyles(dailyIndicators.controlStatus);
    const vitalsIndicator = getVitalsTodayIndicator(dailyIndicators.vitalsToday);
    const medicationIndicator = getMedicationPendingIndicator(dailyIndicators.pendingMedicationCount);
    const mealIndicator = getMealRecordIndicator(dailyIndicators.mealRecorded, dailyIndicators.mealLabel);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <View style={styles.infoBox}>
                <Flex justify="between">
                    <Text style={styles.infoTitle}>{diseaseLabel}</Text>
                    <Flex style={statusStyles.box}>
                        <View style={statusStyles.icon} />
                        <Text style={statusStyles.text}>
                            {CHRONIC_DISEASE_CONTROL_STATUS_LABELS[dailyIndicators.controlStatus]}
                        </Text>
                    </Flex>
                </Flex>
                <Flex justify="between" style={styles.infoContent}>
                    <IndicatorItem
                        icon={require('@/assets/images/chronic/mb.png')}
                        label={vitalsIndicator.label}
                        color={vitalsIndicator.color}
                    />
                    <IndicatorItem
                        icon={require('@/assets/images/chronic/yh.png')}
                        label={medicationIndicator.label}
                        color={medicationIndicator.color}
                    />
                    <IndicatorItem
                        icon={require('@/assets/images/chronic/ys.png')}
                        label={mealIndicator.label}
                        color={mealIndicator.color}
                    />
                </Flex>
                {/* <View style={styles.pageLine} />
                <Flex justify="between" style={{ marginHorizontal: 5 }}>
                    <Flex>
                        <Image
                            style={styles.infoContentImage}
                            source={require('@/assets/images/medication/time.png')}
                        />
                        <Text style={styles.infoContentTime}>
                            确诊：{formatDiagnosisTime(record.diagnosisTime)}
                        </Text>
                    </Flex>
                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.primaryColor} />
                </Flex> */}
            </View>
        </TouchableOpacity>
    );
}

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

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('ChronicDiseaseAddPage')}
                    style={{ marginRight: 16 }}>
                    <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>添加</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

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

    const renderItem: ListRenderItem<ChronicDiseaseRecord> = useCallback(
        ({ item }) => {
            const dailyIndicators =
                item.id != null
                    ? dailyIndicatorsById.get(item.id) ?? DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS
                    : DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS;

            return (
                <ChronicDiseaseCard
                    record={item}
                    diseaseTypeLabels={diseaseTypeLabels}
                    dailyIndicators={dailyIndicators}
                    onPress={() =>
                        item.id != null && navigation.navigate('ChronicDiseaseDetailPage', { id: item.id })
                    }
                />
            );
        },
        [dailyIndicatorsById, diseaseTypeLabels, navigation],
    );

    const listFooter = useCallback(() => {
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
    }, [hasMore, loadingMore, records.length]);

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
        <PageLayout style={styles.container}>
            <FlatList
                data={records}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={[styles.body, records.length === 0 && { flexGrow: 1 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={AppTheme.primaryColor}
                        colors={[AppTheme.primaryColor]}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                ListHeaderComponent={
                    <Flex style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>已建档慢病</Text>
                    </Flex>
                }
                ListEmptyComponent={
                    <Flex style={{ marginTop: 100 }}>
                        <NoData text="暂无慢病记录" />
                    </Flex>
                }
                ListFooterComponent={listFooter}
            />
        </PageLayout>
    );
}
