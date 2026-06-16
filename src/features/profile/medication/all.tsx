import React, { useCallback, useRef, useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { removeMedicationPlanById, type MedicationPlan } from '@/api/medicationPlan';
import styles from '@/css/medication/all';
import { AppTheme } from '@/common/theme';
import PageLayout from '@/src/components/PageLayout';
import NoData from '@/src/components/noData';
import SwipeDeleteRow, { closeActiveSwipeRow } from '@/src/features/profile/healthRecord/components/SwipeDeleteRow';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
    formatMedicationPlanDate,
    formatMedicationTimeList,
    formatMedicationUsageText,
    isPersonalMedicationPlan,
    loadMedicationDictMaps,
    loadMyMedicationPlans,
    type MedicationDictMaps,
} from './medicationHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

    if (!editable || !onPress) {
        return <View style={styles.medicationBox}>{content}</View>;
    }

    const card = (
        <TouchableOpacity
            style={[styles.medicationBox, onDelete ? styles.medicationBoxInSwipe : null]}
            activeOpacity={0.7}
            onPress={onPress}>
            {content}
        </TouchableOpacity>
    );

    if (!onDelete) {
        return card;
    }

    return (
        <SwipeDeleteRow onDelete={onDelete} styleOverrides={SWIPE_STYLE_OVERRIDES}>
            {card}
        </SwipeDeleteRow>
    );
}

export default function MedicationAllPage() {
    const navigation = useNavigation<Nav>();
    const [plans, setPlans] = useState<MedicationPlan[]>([]);
    const [dictMaps, setDictMaps] = useState<MedicationDictMaps | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const dictMapsRef = useRef<MedicationDictMaps | null>(null);
    const hasLoadedOnceRef = useRef(false);
    dictMapsRef.current = dictMaps;

    const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
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

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
                {!hasLoadedOnce && loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={AppTheme.primaryColor} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={[
                            styles.body,
                            activePlans.length === 0 && styles.bodyEmpty,
                        ]}
                        keyboardShouldPersistTaps="handled"
                        onScrollBeginDrag={closeActiveSwipeRow}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => loadRef.current('refresh')}
                                tintColor={AppTheme.primaryColor}
                            />
                        }>
                        <Text style={styles.sectionTitle}>当前用药</Text>
                        {activePlans.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <NoData text="暂无用药计划" />
                            </View>
                        ) : (
                            activePlans.map(plan => (
                                <MedicationPlanCard
                                    key={String(plan.medicationPlanId ?? `${plan.name}-${plan.startDate}`)}
                                    plan={plan}
                                    dictMaps={dictMaps ?? { amountUnit: {}, eventBased: {}, amountUnitOptions: [], eventBasedOptions: [] }}
                                    onPress={
                                        isPersonalMedicationPlan(plan) && plan.medicationPlanId != null
                                            ? () =>
                                                navigation.navigate('MedicationAddPage', {
                                                    medicationPlanId: plan.medicationPlanId!,
                                                })
                                            : undefined
                                    }
                                    onDelete={
                                        isPersonalMedicationPlan(plan) && plan.medicationPlanId != null
                                            ? () => handleDelete(plan)
                                            : undefined
                                    }
                                />
                            ))
                        )}
                    </ScrollView>
                )}
        </PageLayout>
    );
}
