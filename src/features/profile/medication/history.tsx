import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Text, View, ScrollView, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Animated, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    getMedicationRecordAll,
    getMedicationRecordStatis,
    type MedicationRecordDayGroup,
    type MedicationRecordAction,
} from '@/api/medicationRecord';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    loadMedicationDictMaps,
    resolveDictLabel,
    type MedicationDictMaps,
} from './medicationHelpers';
import styles from '@/css/medication/all';
import { AppTheme } from '@/common/theme';
import PageLayout from '@/src/components/PageLayout';
import EmptyRecord from '@/src/components/EmptyRecord';
import moment from 'moment';

const PAGE_SIZE = 20;

export const MEDICATION_NAV_LIST = [
    { label: '全部', value: 'all' },
    { label: '已服用', value: '1' },
    { label: '未服用', value: '0' },
] as const;

function PlanTypeBadge({ isPrescription }: { isPrescription: boolean }) {
    if (isPrescription) {
        return (
            <Flex style={styles.medicationCF}>
                <Text style={styles.medicationCFText}>处方</Text>
            </Flex>
        );
    }
    return (
        <Flex style={styles.medicationGR}>
            <Text style={styles.medicationGRText}>个人</Text>
        </Flex>
    );
}

function formatDayLabel(yyyyMMdd?: string): string {
    if (!yyyyMMdd) return '--';
    const parsed = moment(yyyyMMdd, ['YYYYMMDD', 'YYYY-MM-DD'], true);
    if (!parsed.isValid()) return yyyyMMdd;
    if (parsed.isSame(moment(), 'day')) return '今天';
    if (parsed.isSame(moment().subtract(1, 'day'), 'day')) return '昨天';
    return parsed.format('M月D日');
}

export default function MedicationAllPage() {
    const [activeNav, setActiveNav] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const hasLoadedOnceRef = useRef(false);

    const [historyDays, setHistoryDays] = useState<MedicationRecordDayGroup[]>([]);
    const [historyRange, setHistoryRange] = useState<'7' | '30'>('7');
    const [takeCount, setTakeCount] = useState(0);
    const [notTakeCount, setNotTakeCount] = useState(0);
    const [adherenceRate, setAdherenceRate] = useState(0);
    const [dictMaps, setDictMaps] = useState<MedicationDictMaps | null>(null);
    const dictMapsRef = useRef<MedicationDictMaps | null>(null);

    const [pageNum, setPageNum] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const hasMoreRef = useRef(true);
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

    const sliderAnim = useRef(new Animated.Value(0)).current;
    const sliderContainerRef = useRef<View>(null);
    const [segmentWidth, setSegmentWidth] = useState(0);

    useEffect(() => {
        Animated.timing(sliderAnim, {
            toValue: historyRange === '7' ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [historyRange]);

    const onSegmentLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setSegmentWidth(Math.max(0, (w - 4) / 2));
    }, []);

    const getDateRange = useCallback(() => {
        const end = new Date();
        const start = new Date();
        const days = historyRange === '7' ? 7 : 30;
        start.setDate(end.getDate() - days + 1);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        return { startDate: fmt(start), endDate: fmt(end) };
    }, [historyRange]);

    /** Initial / refresh / filter load — resets pagination */
    const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
        if (mode === 'initial') {
            setLoading(true);
        } else if (mode === 'refresh') {
            setRefreshing(true);
        }
        try {
            const { startDate, endDate } = getDateRange();
            const actionParam = activeNav === 'all' ? undefined : (Number(activeNav) as MedicationRecordAction);

            const [recordsRes, statisRes, maps] = await Promise.all([
                getMedicationRecordAll({ startDate, endDate, pageSize: PAGE_SIZE, pageNum: 1, action: actionParam }),
                getMedicationRecordStatis({ startDate, endDate }),
                dictMapsRef.current ? Promise.resolve(dictMapsRef.current) : loadMedicationDictMaps(),
            ]);

            if (!dictMapsRef.current) {
                dictMapsRef.current = maps;
                setDictMaps(maps);
            }

            if (isResourceApiOk(recordsRes) && (recordsRes as any).rows) {
                const rows = (recordsRes as any).rows;
                setHistoryDays(rows);
                const total = (recordsRes as any).total ?? 0;
                const loaded = rows.reduce((sum: number, d: MedicationRecordDayGroup) => sum + (d.list?.length ?? 0), 0);
                hasMoreRef.current = loaded < total;
                setHasMore(hasMoreRef.current);
            } else {
                setHistoryDays([]);
                hasMoreRef.current = false;
                setHasMore(false);
            }
            setPageNum(1);

            if (isResourceApiOk(statisRes) && (statisRes as any).data) {
                const s = (statisRes as any).data;
                setTakeCount(s.takeCount ?? 0);
                setNotTakeCount(s.notTakeCount ?? 0);
                setAdherenceRate(s.rate ?? 0);
            }

            if (!hasLoadedOnceRef.current) {
                hasLoadedOnceRef.current = true;
                setHasLoadedOnce(true);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getDateRange, activeNav]);

    /** Pull-up load more */
    const loadMore = useCallback(async () => {
        if (!hasMoreRef.current || loadingMore) return;
        setLoadingMore(true);
        try {
            const { startDate, endDate } = getDateRange();
            const actionParam = activeNav === 'all' ? undefined : (Number(activeNav) as MedicationRecordAction);
            const nextPage = pageNum + 1;

            const res = await getMedicationRecordAll({ startDate, endDate, pageSize: PAGE_SIZE, pageNum: nextPage, action: actionParam });

            if (isResourceApiOk(res) && (res as any).rows) {
                const newRows = (res as any).rows;
                setHistoryDays(prev => [...prev, ...newRows]);
                setPageNum(nextPage);
                const total = (res as any).total ?? 0;
                const loaded = (pageNum * PAGE_SIZE) + newRows.reduce((sum: number, d: MedicationRecordDayGroup) => sum + (d.list?.length ?? 0), 0);
                hasMoreRef.current = loaded < total;
                setHasMore(hasMoreRef.current);
            } else {
                hasMoreRef.current = false;
                setHasMore(false);
            }
        } catch {
            // silent
        } finally {
            setLoadingMore(false);
        }
    }, [getDateRange, activeNav, pageNum, loadingMore]);

    const loadRef = useRef(load);
    loadRef.current = load;

    useFocusEffect(
        useCallback(() => {
            void loadRef.current(hasLoadedOnceRef.current ? 'silent' : 'initial');
            return () => {
                setRefreshing(false);
            };
        }, []),
    );

    // reload when range or filter changes
    useEffect(() => {
        void load('silent');
    }, [historyRange, activeNav]);

    // --- derived values ---
    const totalCount = takeCount + notTakeCount;
    const hasMedicationPlan = totalCount > 0;
    const takenPercent = hasMedicationPlan ? (takeCount / totalCount) * 100 : 0;
    const missedPercent = hasMedicationPlan ? (notTakeCount / totalCount) * 100 : 0;

    // API returns rate as 1-100, normalize to 0-1 for SVG calculations
    const rateFraction = hasMedicationPlan ? adherenceRate / 100 : 0;

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        if (distanceFromBottom < 100 && hasMoreRef.current && !loadingMore) {
            void loadMore();
        }
    }, [loadingMore, loadMore]);

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody} showHeaderBackground={false}>
            <View style={[styles.medicationBox, { margin: 18, paddingVertical: 18 }]}>
                <Flex justify="between">
                    <Flex>
                        <Text style={styles.topText}>用药依从性</Text>
                    </Flex>
                    <View
                        ref={sliderContainerRef}
                        onLayout={onSegmentLayout}
                        style={styles.sliderContainer}>
                        <Animated.View
                            style={[
                                styles.sliderIndicator,
                                {
                                    width: segmentWidth || undefined,
                                    transform: [
                                        {
                                            translateX: sliderAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, segmentWidth || 0],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <TouchableOpacity
                            style={styles.sliderBtn}
                            activeOpacity={1}
                            onPress={() => setHistoryRange('7')}>
                            <Text style={historyRange === '7' ? styles.sliderTextActive : styles.sliderTextInactive}>7日</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.sliderBtn}
                            activeOpacity={1}
                            onPress={() => setHistoryRange('30')}>
                            <Text style={historyRange === '30' ? styles.sliderTextActive : styles.sliderTextInactive}>30日</Text>
                        </TouchableOpacity>
                    </View>
                </Flex>

                <Flex align="center" style={{ marginTop: 24 }}>
                    <View style={styles.chartSvgWrap}>
                        <Svg width={103} height={103} viewBox="0 0 103 103">
                            <Circle
                                cx={51.5}
                                cy={51.5}
                                r={45.5}
                                stroke="#ECEDF1"
                                strokeWidth={8}
                                fill="none"
                            />
                            <Circle
                                cx={51.5}
                                cy={51.5}
                                r={45.5}
                                stroke="#0951AE"
                                strokeWidth={8}
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45.5 * rateFraction} ${2 * Math.PI * 45.5}`}
                                rotation="-90"
                                origin="51.5,51.5"
                            />
                        </Svg>
                        <View style={styles.chartLabelWrap}>
                            <Text style={styles.chartLabel}>依从率</Text>
                            <Text style={styles.chartValue}>
                                {hasMedicationPlan ? `${Math.round(adherenceRate)}%` : '--'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.rightBox}>
                        <View style={styles.barRow}>
                            <Flex justify="between" style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>已服用</Text>
                                <Text style={styles.barCount}>{hasMedicationPlan ? takeCount : '--'}</Text>
                            </Flex>
                            <View style={styles.barTrack}>
                                <View style={[styles.barFill, { width: `${takenPercent}%`, backgroundColor: '#6D925E' }]} />
                            </View>
                        </View>
                        <View style={[styles.barRow, { marginTop: 10 }]}>
                            <Flex justify="between" style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>未服用</Text>
                                <Text style={styles.barCount}>{hasMedicationPlan ? notTakeCount : '--'}</Text>
                            </Flex>
                            <View style={styles.barTrack}>
                                <View style={[styles.barFill, { width: `${missedPercent}%`, backgroundColor: '#0951AE' }]} />
                            </View>
                        </View>
                    </View>
                </Flex>
            </View>

            <View style={styles.navBox}>
                {MEDICATION_NAV_LIST.map(item => {
                    const active = activeNav === item.value;
                    return (
                        <TouchableOpacity
                            style={[styles.navCol, active && styles.navColActive]}
                            key={item.value}
                            activeOpacity={1}
                            onPress={() => {
                                if (item.value === activeNav) return;
                                setActiveNav(item.value);
                            }}>
                            <Text style={[styles.navText, active && styles.activeNavText]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {!hasLoadedOnce && loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[
                        styles.body,
                        historyDays.length === 0 && styles.bodyEmpty,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleScroll}
                    scrollEventThrottle={200}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => void load('refresh')}
                            tintColor={AppTheme.primaryColor}
                        />
                    }>
                    {historyDays.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <EmptyRecord text="暂无数据" />
                        </View>
                    ) : (
                        historyDays.map((day, dayIndex) => {
                            const dayKey = day.yyyyMMdd ?? String(dayIndex);
                            const expanded = expandedDays[dayKey] ?? true;
                            return (
                                <View style={[styles.dayCard, expanded && styles.dayCardExpanded]} key={dayKey}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={styles.daySectionHeader}
                                        onPress={() => {
                                            setExpandedDays(prev => ({
                                                ...prev,
                                                [dayKey]: !(prev[dayKey] ?? true),
                                            }));
                                        }}>
                                        <Text style={styles.daySectionTitle}>{formatDayLabel(day.yyyyMMdd)}</Text>
                                        <View style={styles.daySectionToggleBtn}>
                                            <Image
                                                style={styles.daySectionToggleIcon}
                                                source={
                                                    expanded
                                                        ? require('@/assets/images/medication/icon_sq.png')
                                                        : require('@/assets/images/medication/icon_zk.png')
                                                }
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    {expanded ? (
                                        <View style={styles.listBox}>
                                            {[...(day.list ?? [])].reverse().map((record, recordIndex, arr) => {
                                                const taken = record.action === 1;
                                                const isLast = recordIndex === arr.length - 1;
                                                return (
                                                    <View
                                                        style={[styles.listItem, isLast && styles.listItemLast]}
                                                        key={record.medicationRecordId}>
                                                        <View style={styles.listItemLeft}>
                                                            <Image
                                                                style={styles.listItemIcon}
                                                                source={require('@/assets/images/medication/icon_yp.png')}
                                                            />
                                                            <View style={styles.listItemContent}>
                                                                <Flex>
                                                                    <Text style={styles.listItemTitle} numberOfLines={1}>
                                                                        {record.snapshotRule?.name}
                                                                    </Text>
                                                                    <View
                                                                        style={[
                                                                            styles.listItemStatus,
                                                                            taken ? styles.listItemStatusTaken : styles.listItemStatusMissed,
                                                                        ]}>
                                                                        <Text
                                                                            style={
                                                                                taken
                                                                                    ? styles.listItemStatusTextTaken
                                                                                    : styles.listItemStatusTextMissed
                                                                            }>
                                                                            {taken ? '已服用' : '未服用'}
                                                                        </Text>
                                                                    </View>
                                                                </Flex>

                                                                <Text style={styles.listItemDose}>
                                                                    {record.snapshotRule?.amount}
                                                                    {resolveDictLabel(dictMaps?.amountUnit ?? {}, record.snapshotRule?.amountUnit)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.listItemTime}>{record.medicationPlanTime}</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })
                    )}

                    {/* Load more footer */}
                    {historyDays.length > 0 && (
                        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                            {loadingMore ? (
                                <ActivityIndicator color={AppTheme.primaryColor} />
                            ) : !hasMore ? (
                                <Text style={{ fontSize: 12, color: '#999' }}>没有更多了</Text>
                            ) : null}
                        </View>
                    )}
                </ScrollView>
            )}
        </PageLayout>
    );
}
