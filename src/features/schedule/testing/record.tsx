import React, { useCallback, useRef, useState } from 'react';
import {
    ScrollView,
    Image,
    View,
    Text,
    ActivityIndicator,
    RefreshControl,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/route/router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import {
    listHealthTestRecords,
    queryFirstAndLatestHealthTestRecord,
    type ExHealthTestRecord,
} from '@/api/exHealthTestRecord';
import { getInUseExPatientRuleInfo } from '@/api/schedule';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import styles from '@/css/schedule/testingPage';
import { useHealthTestDetailByItemId } from './useHealthTestDetail';
import {
    formatRecordDate,
    formatTestValue,
    getImproveLabel,
    getRecordCountText,
    resolveHealthTestUnit,
    resolveRecordTrendTone,
} from './testingHelpers';

const PAGE_SIZE = 10;

function sortHealthTestRecordsByTime(records: ExHealthTestRecord[]) {
    return [...records].sort((a, b) => {
        const timeA = new Date(a.createTime ?? 0).getTime();
        const timeB = new Date(b.createTime ?? 0).getTime();
        return timeB - timeA;
    });
}

export default function TestingRecordPage() {
    const route = useRoute<RouteProp<RootStackParamList, 'TestingRecordPage'>>();
    const healthTestItemId = route.params?.healthTestItemId;
    const userId = useSelector(
        (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
    );
    const { detail } = useHealthTestDetailByItemId(healthTestItemId);
    const unit = resolveHealthTestUnit(detail);
    const testName = detail?.testName?.trim() || '';

    const [records, setRecords] = useState<ExHealthTestRecord[]>([]);
    const [firstRecord, setFirstRecord] = useState<ExHealthTestRecord | null>(null);
    const [recordTotal, setRecordTotal] = useState(0);
    const [pageNum, setPageNum] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const exPatientRuleIdRef = useRef<string | number | undefined>(undefined);
    const hasMoreRef = useRef(false);
    const loadingMoreRef = useRef(false);
    const pageNumRef = useRef(1);

    const fetchPage = useCallback(async (page: number, mode: 'initial' | 'refresh' | 'loadMore') => {
        if (!healthTestItemId) {
            setRecords([]);
            setFirstRecord(null);
            setRecordTotal(0);
            hasMoreRef.current = false;
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (mode === 'loadMore') {
            if (loadingMoreRef.current || !hasMoreRef.current) return;
            loadingMoreRef.current = true;
            setLoadingMore(true);
        } else if (mode === 'initial') {
            setLoading(true);
        } else if (mode === 'refresh') {
            setRefreshing(true);
        }

        try {
            if (!exPatientRuleIdRef.current) {
                const prescriptionRes = await getInUseExPatientRuleInfo();
                if (!isResourceApiOk(prescriptionRes)) {
                    if (mode !== 'loadMore') {
                        setRecords([]);
                        setFirstRecord(null);
                        setRecordTotal(0);
                    }
                    hasMoreRef.current = false;
                    return;
                }
                const prescription = apiResourceData<{ exPatientRuleId?: string | number }>(prescriptionRes as any);
                const ruleId = prescription?.exPatientRuleId;
                if (ruleId == null) {
                    if (mode !== 'loadMore') {
                        setRecords([]);
                        setFirstRecord(null);
                        setRecordTotal(0);
                    }
                    hasMoreRef.current = false;
                    return;
                }
                exPatientRuleIdRef.current = ruleId;
            }

            const ruleId = exPatientRuleIdRef.current;
            if (ruleId == null) return;

            const queryParams = {
                exPatientRuleId: ruleId,
                healthTestItemId: String(healthTestItemId),
                userId,
            };

            const requests: Promise<unknown>[] = [
                listHealthTestRecords({ ...queryParams, pageNum: page, pageSize: PAGE_SIZE }),
            ];
            if (mode !== 'loadMore') {
                requests.push(queryFirstAndLatestHealthTestRecord(queryParams));
            }

            const [listRes, firstLatestRes] = await Promise.all(requests);

            if (mode !== 'loadMore' && firstLatestRes && isResourceApiOk(firstLatestRes as any)) {
                const firstLatest = apiResourceData<{ firstRecord?: ExHealthTestRecord | null }>(
                    firstLatestRes as any,
                );
                setFirstRecord(firstLatest?.firstRecord ?? null);
            }

            if (isResourceApiOk(listRes as any)) {
                const rows = sortHealthTestRecordsByTime(getResourceRows(listRes as any));
                const total = Number((listRes as { total?: number }).total ?? 0);
                const nextTotal = Number.isFinite(total) ? total : rows.length;

                if (mode === 'loadMore') {
                    setRecords(prev => {
                        const merged = sortHealthTestRecordsByTime([...prev, ...rows]);
                        hasMoreRef.current = merged.length < nextTotal;
                        return merged;
                    });
                } else {
                    setRecords(rows);
                    hasMoreRef.current = rows.length < nextTotal;
                }

                setRecordTotal(nextTotal);
                setPageNum(page);
                pageNumRef.current = page;
            } else if (mode !== 'loadMore') {
                setRecords([]);
                setRecordTotal(0);
                hasMoreRef.current = false;
            }
        } catch {
            if (mode !== 'loadMore') {
                setRecords([]);
                setFirstRecord(null);
                setRecordTotal(0);
            }
            hasMoreRef.current = false;
        } finally {
            setLoading(false);
            setRefreshing(false);
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [healthTestItemId, userId]);

    const loadMore = useCallback(() => {
        void fetchPage(pageNumRef.current + 1, 'loadMore');
    }, [fetchPage]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
        if (nearBottom) {
            loadMore();
        }
    }, [loadMore]);

    useFocusEffect(
        useCallback(() => {
            exPatientRuleIdRef.current = undefined;
            void fetchPage(1, 'initial');
        }, [fetchPage]),
    );

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <View style={styles.page}>
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={styles.scroll}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchPage(1, 'refresh')}
                            colors={[AppTheme.primaryColor]}
                            tintColor={AppTheme.primaryColor}
                        />
                    }
                    onScroll={handleScroll}
                    scrollEventThrottle={200}>
                    <View style={[styles.infoBox, { marginTop: 0 }]}>
                        <Flex justify='between'>
                            <Text style={styles.infoTitle}>{testName}</Text>
                            <Text style={styles.infoAllText}>{getRecordCountText(recordTotal)}</Text>
                        </Flex>
                        <View style={styles.infoRecordBox}>
                            {loading && !refreshing ? (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <ActivityIndicator color={AppTheme.primaryColor} />
                                </Flex>
                            ) : records.length > 0 ? (
                                records.map((record, index) => (
                                    <Flex
                                        key={String(record.id ?? record.createTime ?? index)}
                                        justify='between'
                                        style={[
                                            styles.infoRecordItem,
                                            { paddingVertical: 12 },
                                            index > 0 ? { marginTop: 12 } : null,
                                        ]}>
                                        <Flex>
                                            <Image
                                                style={styles.infoRecordImg}
                                                source={require('@/assets/images/schedule/rl.png')}
                                            />
                                            <View>
                                                <Text style={styles.infoRecordText}>
                                                    {formatRecordDate(record.createTime)}
                                                </Text>
                                                <Flex style={[styles.infoRecordStatus, { marginTop: 6 }]}>
                                                    <Text style={styles.infoRecordStatusText}>
                                                        {getImproveLabel(record.firstChangePercent, {
                                                            firstRecord,
                                                            latestRecord: record,
                                                        })}
                                                    </Text>
                                                </Flex>
                                            </View>
                                        </Flex>
                                        <Flex>
                                            {(() => {
                                                // 列表按时间倒序：下一项即上一次评估
                                                const previousRecord = records[index + 1];
                                                const tone = resolveRecordTrendTone({
                                                    currentValue: record.testValue,
                                                    previousValue: previousRecord?.testValue,
                                                    improveDirection: detail?.improveDirection,
                                                });
                                                if (!tone) return null;
                                                return (
                                                    <Image
                                                        style={styles.infoRecordUpImg}
                                                        source={
                                                            tone === 'up'
                                                                ? require('@/assets/images/schedule/icon_gs.png')
                                                                : require('@/assets/images/schedule/icon_xx.png')
                                                        }
                                                    />
                                                );
                                            })()}
                                            <Text style={styles.infoRecordText}>
                                                {formatTestValue(record.testValue, unit)}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                ))
                            ) : (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <Text style={styles.infoItemText}>暂无测试记录</Text>
                                </Flex>
                            )}
                            {loadingMore ? (
                                <Flex justify='center' style={{ paddingVertical: 12 }}>
                                    <ActivityIndicator color={AppTheme.primaryColor} size="small" />
                                </Flex>
                            ) : null}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
