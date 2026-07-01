import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Text, View, ScrollView, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Animated, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
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
import NoData from '@/src/components/noData';
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
        setSegmentWidth(w / 2);
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
    const takenPercent = totalCount > 0 ? (takeCount / totalCount) * 100 : 0;
    const missedPercent = totalCount > 0 ? (notTakeCount / totalCount) * 100 : 0;

    // API returns rate as 1-100, normalize to 0-1 for SVG calculations
    const rateFraction = adherenceRate / 100;

    const R = 45.5;
    const CX = 51.5;
    const CY = 51.5;
    const endAngle = -Math.PI / 2 + 2 * Math.PI * rateFraction;
    const dotX = CX + R * Math.cos(endAngle);
    const dotY = CY + R * Math.sin(endAngle);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        if (distanceFromBottom < 100 && hasMoreRef.current && !loadingMore) {
            void loadMore();
        }
    }, [loadingMore, loadMore]);

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <View style={[styles.medicationBox, { margin: 18, paddingVertical: 18 }]}>
                <Flex justify="between">
                    <Flex>
                        <Image style={styles.topImg} source={require('@/assets/images/medication/yp.png')} />
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
                                    transform: [
                                        {
                                            translateX: sliderAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [4, segmentWidth],
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

                <Flex style={{ marginTop: 24, gap: 16 }}>
                    <Flex style={styles.chartSvgWrap}>
                        <Svg width={103} height={103} viewBox="0 0 103 103">
                            <Defs>
                                <LinearGradient id="progressGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <Stop offset="0" stopColor="rgba(131,174,255,1)" />
                                    <Stop offset="1" stopColor="rgba(79,134,238,1)" />
                                </LinearGradient>
                            </Defs>
                            <Circle cx={51.5} cy={51.5} r={45.5} stroke="rgba(131,174,255,0.14)" strokeWidth={12} fill="none" />
                            <Circle
                                cx={51.5} cy={51.5} r={45.5}
                                stroke="url(#progressGrad)"
                                strokeWidth={12} fill="none" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45.5 * rateFraction} ${2 * Math.PI * 45.5}`}
                                rotation="-90" origin="51.5,51.5"
                            />
                            <Circle cx={dotX} cy={dotY} r={3} fill="#FFFFFF" />
                        </Svg>
                        <View style={styles.chartLabelWrap}>
                            <Text style={styles.chartLabel}>依从率</Text>
                            <Text style={styles.chartValue}>{Math.round(adherenceRate)}%</Text>
                        </View>
                    </Flex>
                    <View style={styles.rightBox}>
                        <View style={styles.barRow}>
                            <Flex justify="between" style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>已服用</Text>
                                <Text style={styles.barCount}>{takeCount}</Text>
                            </Flex>
                            <View style={styles.barTrack}>
                                <RNLinearGradient
                                    colors={['#FFB867', '#FF8B07']}
                                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                                    style={[styles.barFill, { width: `${takenPercent}%` }]}
                                />
                            </View>
                        </View>
                        <View style={[styles.barRow, { marginTop: 10 }]}>
                            <Flex justify="between" style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>未服用</Text>
                                <Text style={styles.barCount}>{notTakeCount}</Text>
                            </Flex>
                            <View style={styles.barTrack}>
                                <RNLinearGradient
                                    colors={['#83AEFF', '#4F86EE']}
                                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                                    style={[styles.barFill, { width: `${missedPercent}%` }]}
                                />
                            </View>
                        </View>
                    </View>
                </Flex>
            </View>

            <Flex justify='center' style={styles.navBox}>
                {MEDICATION_NAV_LIST.map(item => (
                    <TouchableOpacity
                        style={styles.navCol}
                        key={item.value}
                        onPress={() => {
                            if (item.value === activeNav) return;
                            setActiveNav(item.value);
                        }}>
                        <View style={styles.navItemWrap}>
                            <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>
                                {item.label}
                            </Text>
                            {activeNav === item.value ? (
                                <View style={styles.navIndicatorWrap}>
                                    <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                ))}
            </Flex>

            {!hasLoadedOnce && loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.body}
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
                            <NoData text="暂无数据" />
                        </View>
                    ) : (
                        <View style={styles.medicationBox}>
                            {historyDays.map((day, dayIndex) => (
                                <View key={day.yyyyMMdd ?? dayIndex}>
                                    <Text style={styles.colTitle}>{formatDayLabel(day.yyyyMMdd)}</Text>
                                    <View style={styles.listBox}>
                                        {[...(day.list ?? [])].reverse().map((record) => (
                                            <Flex justify="between" style={styles.listItem} key={record.medicationRecordId}>
                                                <View>
                                                    <Flex>
                                                        <Text style={styles.listItemText}>{record.snapshotRule?.name}</Text>
                                                        <PlanTypeBadge isPrescription={record.snapshotRule?.planType === 1} />
                                                    </Flex>
                                                    <Text style={styles.listItemDw}>{record.snapshotRule?.amount}{resolveDictLabel(dictMaps?.amountUnit ?? {}, record.snapshotRule?.amountUnit)}</Text>
                                                </View>
                                                <Text style={styles.listItemText}>{record.medicationPlanTime}</Text>
                                            </Flex>
                                        ))}
                                    </View>
                                    {dayIndex < historyDays.length - 1 ? (
                                        <View style={[styles.rowLine, { marginBottom: 10 }]} />
                                    ) : null}
                                </View>
                            ))}
                        </View>
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
