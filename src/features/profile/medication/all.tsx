import React, { useCallback, useRef, useState } from 'react';
import {
    Text,
    View,
    ScrollView,
    ActivityIndicator,
    Image,
    RefreshControl,
    TouchableOpacity,
    Alert,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { removeMedicationPlanById, type DrugPatientRuleInfo, type MedicationPlan } from '@/api/medicationPlan';
import styles from '@/css/medication/all';
import { AppTheme } from '@/common/theme';
import PageLayout from '@/src/components/PageLayout';
import NoData from '@/src/components/noData';
import SwipeDeleteRow, { closeActiveSwipeRow } from '@/src/features/profile/healthRecord/components/SwipeDeleteRow';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
    formatDrugPatientRuleCycle,
    formatDrugRuleListNames,
    formatMedicationPlanDate,
    formatMedicationTimeList,
    formatMedicationUsageText,
    getDrugPatientRuleStatusLabel,
    isPersonalMedicationPlan,
    loadDrugPatientRuleHistoryPage,
    loadMedicationDictMaps,
    loadMyMedicationPlans,
    type MedicationDictMaps,
} from './medicationHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AllMedicationTab = 'current' | 'history';

const ALL_MEDICATION_TABS = [
    { label: '当前用药', value: 'current' as const },
    { label: '历史用药', value: 'history' as const },
];

const HISTORY_PAGE_SIZE = 20;

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

const SWIPE_STYLE_OVERRIDES = {
    swipeRow: styles.swipeRow,
    swipeAction: styles.swipeAction,
    swipeForeground: styles.swipeForeground,
    swipeDeleteBtn: styles.swipeDeleteBtn,
    editIcon: styles.swipeDeleteIcon,
};

function MedicationPlanCard({
    plan,
    dictMaps,
    onPress,
    onDelete,
}: {
    plan: MedicationPlan;
    dictMaps: MedicationDictMaps;
    onPress?: () => void;
    onDelete?: () => void;
}) {
    const isPrescription = plan.planType === 1;
    const usageText = formatMedicationUsageText(plan, dictMaps);
    const timeText = formatMedicationTimeList(plan.timeList);
    const dateText = formatMedicationPlanDate(plan.startDate ?? plan.createTime);
    const editable = isPersonalMedicationPlan(plan);

    const content = (
        <>
            <Flex>
                <Flex style={{ flex: 1 }}>
                    <Text style={styles.medicationTitle}>{plan.name?.trim() || '--'}</Text>
                    <PlanTypeBadge isPrescription={isPrescription} />
                </Flex>
                <Text style={styles.medicationTimeText}>{dateText}</Text>
            </Flex>
            <Text style={styles.medicationUsageText}>用法：{usageText}</Text>
            <Flex align="center" style={{ marginTop: 8 }}>
                <Image source={require('@/assets/images/medication/time.png')} style={styles.medicationTime} />
                <Text style={styles.medicationText}>服用时间：{timeText}</Text>
            </Flex>
        </>
    );

    if (!onPress) {
        return <View style={styles.medicationBox}>{content}</View>;
    }

    const inSwipe = editable && !!onDelete;

    const card = (
        <TouchableOpacity
            style={[styles.medicationBox, inSwipe ? styles.medicationBoxInSwipe : null]}
            activeOpacity={0.7}
            onPress={onPress}>
            {content}
        </TouchableOpacity>
    );

    if (!inSwipe) {
        return card;
    }

    return (
        <SwipeDeleteRow onDelete={onDelete} styleOverrides={SWIPE_STYLE_OVERRIDES}>
            {card}
        </SwipeDeleteRow>
    );
}

function HistoryDrugRuleCard({
    item,
    onPress,
}: {
    item: DrugPatientRuleInfo;
    onPress: () => void;
}) {
    const statusLabel = getDrugPatientRuleStatusLabel(item.status);
    const isPaused = item.status === 1;

    return (
        <TouchableOpacity style={styles.medicationBox} activeOpacity={0.7} onPress={onPress}>
            <Flex justify="between" align="start">
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.medicationTitle}>{item.prescriptionName?.trim() || '--'}</Text>
                    <Text style={[styles.leftText, { marginTop: 6 }]}>
                        {formatDrugPatientRuleCycle(item.startDate, item.endDate)}
                    </Text>
                    <Text style={[styles.medicationUsageText, { marginTop: 8 }]}>
                        用药清单：{formatDrugRuleListNames(item.drugRuleList)}
                    </Text>
                    {isPaused && item.stopReason?.trim() ? (
                        <Text style={styles.historyStopReason}>暂停原因：{item.stopReason.trim()}</Text>
                    ) : null}
                </View>
                <Flex style={isPaused ? styles.historyStatusPaused : styles.historyStatusEnded}>
                    <Text style={isPaused ? styles.historyStatusPausedText : styles.historyStatusEndedText}>
                        {statusLabel}
                    </Text>
                </Flex>
            </Flex>
        </TouchableOpacity>
    );
}

export default function MedicationAllPage() {
    const navigation = useNavigation<Nav>();
    const [activeTab, setActiveTab] = useState<AllMedicationTab>('current');
    const [plans, setPlans] = useState<MedicationPlan[]>([]);
    const [historyRules, setHistoryRules] = useState<DrugPatientRuleInfo[]>([]);
    const [dictMaps, setDictMaps] = useState<MedicationDictMaps | null>(null);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [hasLoadedHistoryOnce, setHasLoadedHistoryOnce] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const dictMapsRef = useRef<MedicationDictMaps | null>(null);
    const hasLoadedOnceRef = useRef(false);
    const hasLoadedHistoryOnceRef = useRef(false);
    const historyPageNumRef = useRef(1);
    const hasMoreHistoryRef = useRef(true);
    dictMapsRef.current = dictMaps;

    const loadCurrent = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
        if (mode === 'initial') {
            setLoading(true);
        } else if (mode === 'refresh') {
            setRefreshing(true);
        }

        try {
            const [list, maps] = await Promise.all([
                loadMyMedicationPlans(),
                dictMapsRef.current ? Promise.resolve(dictMapsRef.current) : loadMedicationDictMaps(),
            ]);
            setPlans(list);
            if (!dictMapsRef.current) {
                setDictMaps(maps);
                dictMapsRef.current = maps;
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
        }
    }, []);

    const loadHistory = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
        const nextPage = mode === 'more' ? historyPageNumRef.current + 1 : 1;

        if (mode === 'initial') {
            setHistoryLoading(true);
        } else if (mode === 'refresh') {
            setRefreshing(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const { rows, hasMore } = await loadDrugPatientRuleHistoryPage(nextPage, HISTORY_PAGE_SIZE);
            setHistoryRules(prev => (mode === 'more' ? [...prev, ...rows] : rows));
            historyPageNumRef.current = nextPage;
            hasMoreHistoryRef.current = hasMore;
            setHasMoreHistory(hasMore);
        } finally {
            hasLoadedHistoryOnceRef.current = true;
            setHasLoadedHistoryOnce(true);
            setHistoryLoading(false);
            setLoadingMore(false);
            if (mode === 'refresh') {
                setRefreshing(false);
            }
        }
    }, []);

    const loadCurrentRef = useRef(loadCurrent);
    const loadHistoryRef = useRef(loadHistory);
    loadCurrentRef.current = loadCurrent;
    loadHistoryRef.current = loadHistory;

    useFocusEffect(
        useCallback(() => {
            void loadCurrentRef.current(hasLoadedOnceRef.current ? 'silent' : 'initial');
            return () => {
                setRefreshing(false);
            };
        }, []),
    );

    const handleTabChange = useCallback((tab: AllMedicationTab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        if (tab === 'history' && !hasLoadedHistoryOnceRef.current) {
            void loadHistoryRef.current('initial');
        }
    }, [activeTab]);

    const handleRefresh = useCallback(() => {
        if (activeTab === 'current') {
            void loadCurrentRef.current('refresh');
            return;
        }
        void loadHistoryRef.current('refresh');
    }, [activeTab]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (activeTab !== 'history' || loadingMore || !hasMoreHistoryRef.current) return;

        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        if (distanceFromBottom < 120) {
            void loadHistoryRef.current('more');
        }
    }, [activeTab, loadingMore]);

    const handleDelete = useCallback((plan: MedicationPlan) => {
        const id = plan.medicationPlanId;
        if (id == null) {
            return;
        }

        Alert.alert('删除用药计划', '确定删除该用药计划吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await removeMedicationPlanById(id);
                        if (isResourceApiOk(res as { code?: number })) {
                            setPlans(prev => prev.filter(item => item.medicationPlanId !== id));
                        } else {
                            const r = res as { msg?: string; message?: string };
                            Alert.alert('删除失败', r.msg ?? r.message ?? '请稍后重试');
                        }
                    } catch {
                        Alert.alert('错误', '网络错误，请稍后重试');
                    }
                },
            },
        ]);
    }, []);

    const activePlans = plans.filter(plan => plan.isEnable !== 0);
    const emptyDictMaps = dictMaps ?? {
        amountUnit: {},
        eventBased: {},
        amountUnitOptions: [],
        eventBasedOptions: [],
    };
    const isInitialLoading = activeTab === 'current'
        ? !hasLoadedOnce && loading
        : !hasLoadedHistoryOnce && historyLoading;

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <Flex justify="center" style={styles.navBox}>
                {ALL_MEDICATION_TABS.map(item => (
                    <TouchableOpacity
                        style={styles.navCol}
                        key={item.value}
                        onPress={() => handleTabChange(item.value)}>
                        <View style={styles.navItemWrap}>
                            <Text style={[styles.navText, activeTab === item.value && styles.activeNavText]}>
                                {item.label}
                            </Text>
                            {activeTab === item.value ? (
                                <View style={styles.navIndicatorWrap}>
                                    <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
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
                    contentContainerStyle={[
                        styles.body,
                        activeTab === 'current' && activePlans.length === 0 && styles.bodyEmpty,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleScroll}
                    scrollEventThrottle={200}
                    onScrollBeginDrag={closeActiveSwipeRow}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={AppTheme.primaryColor}
                        />
                    }>
                    {activeTab === 'current' ? (
                        activePlans.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <NoData text="暂无用药计划" />
                            </View>
                        ) : (
                            activePlans.map(plan => (
                                <MedicationPlanCard
                                    key={String(plan.medicationPlanId ?? `${plan.name}-${plan.startDate}`)}
                                    plan={plan}
                                    dictMaps={emptyDictMaps}
                                    onPress={() => {
                                        if (plan.medicationPlanId == null) return;
                                        if (plan.planType === 1) {
                                            navigation.navigate('MedicationDetailPage', {
                                                drugPatientRuleId: plan.drugPatientRuleId!,
                                            });
                                        } else if (isPersonalMedicationPlan(plan)) {
                                            navigation.navigate('MedicationAddPage', {
                                                medicationPlanId: plan.medicationPlanId,
                                            });
                                        }
                                    }}
                                    onDelete={
                                        isPersonalMedicationPlan(plan) && plan.medicationPlanId != null
                                            ? () => handleDelete(plan)
                                            : undefined
                                    }
                                />
                            ))
                        )
                    ) : historyRules.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <NoData text="暂无历史用药" />
                        </View>
                    ) : (
                        <>
                            {historyRules.map(item => (
                                <HistoryDrugRuleCard
                                    key={String(item.drugPatientRuleId ?? `${item.prescriptionName}-${item.startDate}`)}
                                    item={item}
                                    onPress={() => {
                                        if (item.drugPatientRuleId == null) return;
                                        navigation.navigate('MedicationDetailPage', {
                                            drugPatientRuleId: item.drugPatientRuleId,
                                        });
                                    }}
                                />
                            ))}
                            {loadingMore ? (
                                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                    <ActivityIndicator color={AppTheme.primaryColor} />
                                </View>
                            ) : null}
                            {!hasMoreHistory ? (
                                <Text style={[styles.leftText, { textAlign: 'center', marginTop: 12 }]}>
                                    没有更多了
                                </Text>
                            ) : null}
                        </>
                    )}
                </ScrollView>
            )}
        </PageLayout>
    );
}
