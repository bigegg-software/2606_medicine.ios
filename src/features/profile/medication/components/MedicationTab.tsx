import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Flex, Modal, Switch, Toast } from '@ant-design/react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateDrugTipInfo } from '@/api/patient';
import { AppTheme } from '@/common/theme';
import styles from '@/css/medication/index';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { SET_USER_EXTR } from '@/store/type/user';
import { useNavigation } from '@react-navigation/native';
import type { AppDispatch, RootState } from '@/store/store';
import {
    DRUG_TIP_TYPE_OPTIONS,
    buildDrugTipSettingsFromUserExtr,
    buildUpdateDrugTipInfoPayload,
    applyMedicationCheckInToPlanGroups,
    applyMedicationCheckInBatchToPlanGroups,
    buildMedicationCheckInConfirmMessage,
    buildMedicationProgressFromPlanGroups,
    loadMedicationDictMaps,
    loadMedicationHistory,
    loadMedicationPlanGroups,
    submitMedicationCheckIn,
    type DrugTipSettings,
    type MedicationDictMaps,
    type MedicationHistoryDayView,
    type MedicationPlanGroupView,
    type MedicationPlanItemView,
} from '../medicationHelpers';
import moment from 'moment';

const TIME_LIST = [
    { label: '5分钟', value: '5' },
    { label: '10分钟', value: '10' },
    { label: '15分钟', value: '15' },
];

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

function ActionStatus({ taken }: { taken: boolean }) {
    return (
        <Flex align="center" style={styles.medicationActionBtn}>
            <Image
                style={styles.medicationSelectIcon}
                source={
                    taken
                        ? require('@/assets/images/medication/select.png')
                        : require('@/assets/images/medication/unselected.png')
                }
            />
            <Text style={styles.medicationActionText}>已服用</Text>
        </Flex>
    );
}

function PlanRow({
    item,
    checkingIn,
    onCheckIn,
}: {
    item: MedicationPlanItemView;
    checkingIn: boolean;
    onCheckIn: (item: MedicationPlanItemView) => void;
}) {
    const statusNode = <ActionStatus taken={item.taken} />;

    return (
        <Flex justify="between" align="center" style={styles.medicationItemCard}>
            <Flex align="center" style={styles.medicationLeftBox}>
                <Image
                    style={styles.medicationItemIcon}
                    source={require('@/assets/images/medication/icon_yp.png')}
                />
                <View style={styles.medicationItemContent}>
                    <Flex>
                        <Text style={styles.medicationLeftTitle}>{item.name}</Text>
                        {/* <PlanTypeBadge isPrescription={item.planType === 1} /> */}
                    </Flex>
                    <Text style={styles.medicationText}>{item.doseText}</Text>
                </View>
            </Flex>
            {item.canCheckIn ? (
                <TouchableOpacity activeOpacity={0.7} disabled={checkingIn} onPress={() => onCheckIn(item)}>
                    {checkingIn ? <ActivityIndicator color={AppTheme.primaryColor} /> : statusNode}
                </TouchableOpacity>
            ) : (
                statusNode
            )}
        </Flex>
    );
}

export default function MedicationTab() {
    const dispatch = useDispatch<AppDispatch>();
    const userExtr = useSelector((state: RootState) => state.user.userExtr);
    const navigation: any = useNavigation();
    const [loading, setLoading] = useState(true);
    const dictMapsRef = useRef<MedicationDictMaps | null>(null);
    const [planGroups, setPlanGroups] = useState<MedicationPlanGroupView[]>([]);
    const [historyDays, setHistoryDays] = useState<MedicationHistoryDayView[]>([]);
    const [checkingInKey, setCheckingInKey] = useState<string | null>(null);
    const [checkingInGroupTime, setCheckingInGroupTime] = useState<string | null>(null);
    const [tipSettings, setTipSettings] = useState<DrugTipSettings>(() => buildDrugTipSettingsFromUserExtr(null));
    const [savingTip, setSavingTip] = useState(false);

    const progress = useMemo(
        () => buildMedicationProgressFromPlanGroups(planGroups),
        [planGroups],
    );

    useEffect(() => {
        setTipSettings(buildDrugTipSettingsFromUserExtr(userExtr));
    }, [userExtr]);

    const reminderEnabled = tipSettings.drugIsTip === 1;
    const advanceRemindTime = String(tipSettings.drugBeforeTipTime);

    const saveDrugTipInfo = useCallback(async (next: Partial<DrugTipSettings>) => {
        const merged: DrugTipSettings = {
            ...tipSettings,
            ...next,
            drugTipTypes: next.drugTipTypes ?? tipSettings.drugTipTypes,
        };
        if (merged.drugIsTip !== 0 && merged.drugTipTypes.length === 0) {
            merged.drugIsTip = 0;
        }

        setSavingTip(true);
        try {
            const payload = buildUpdateDrugTipInfoPayload(merged);
            const res = await updateDrugTipInfo(payload);
            if (!isResourceApiOk(res as any)) {
                Toast.show((res as any)?.msg || '保存提醒设置失败', 1.5);
                return;
            }

            setTipSettings(merged);
            if (userExtr) {
                dispatch({
                    type: SET_USER_EXTR,
                    payload: {
                        ...userExtr,
                        drugIsTip: payload.drugIsTip,
                        drugBeforeTipTime: payload.drugBeforeTipTime,
                        drugTipTypes: payload.drugTipTypes,
                    },
                });
            }
        } catch {
            Toast.show('保存提醒设置失败', 1.5);
        } finally {
            setSavingTip(false);
        }
    }, [dispatch, tipSettings, userExtr]);

    const handleAdvanceTimeChange = useCallback((value: string) => {
        const minutes = Number(value);
        if (minutes !== 5 && minutes !== 10 && minutes !== 15) return;
        void saveDrugTipInfo({ drugBeforeTipTime: minutes, drugIsTip: 1 });
    }, [saveDrugTipInfo]);

    const handleTipTypeToggle = useCallback((value: string) => {
        const selected = tipSettings.drugTipTypes.includes(value);
        const drugTipTypes = selected
            ? tipSettings.drugTipTypes.filter(item => item !== value)
            : [...tipSettings.drugTipTypes, value];

        void saveDrugTipInfo({
            drugTipTypes,
            drugIsTip: drugTipTypes.length > 0 ? 1 : 0,
        });
    }, [saveDrugTipInfo, tipSettings.drugTipTypes]);

    const handleReminderSwitch = useCallback((checked: boolean) => {
        if (!checked) {
            void saveDrugTipInfo({
                drugIsTip: 0,
                drugTipTypes: [],
            });
            return;
        }

        void saveDrugTipInfo({
            drugIsTip: 1,
            drugTipTypes:
                tipSettings.drugTipTypes.length > 0
                    ? tipSettings.drugTipTypes
                    : DRUG_TIP_TYPE_OPTIONS.map(item => item.value),
        });
    }, [saveDrugTipInfo, tipSettings.drugTipTypes]);

    const loadPageData = useCallback(async () => {
        setLoading(true);
        try {
            let maps = dictMapsRef.current;
            if (!maps) {
                maps = await loadMedicationDictMaps();
                dictMapsRef.current = maps;
            }

            const [groups, history] = await Promise.all([
                loadMedicationPlanGroups(maps),
                loadMedicationHistory(),
            ]);

            setPlanGroups(groups);
            setHistoryDays(history);
        } catch {
            setPlanGroups([]);
            setHistoryDays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPageDataRef = useRef(loadPageData);
    loadPageDataRef.current = loadPageData;
    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadPageDataRef.current();
        }, []),
    );

    const handleCheckIn = useCallback(async (item: MedicationPlanItemView) => {
        if (!item.canCheckIn || checkingInKey || checkingInGroupTime) return;

        setCheckingInKey(item.key);
        try {
            const res = await submitMedicationCheckIn(item);
            if (!isResourceApiOk(res as any)) {
                Toast.show((res as any)?.msg || '打卡失败', 1.5);
                return;
            }
            Toast.success('已记录服用', 1.5);
            setPlanGroups(prev => applyMedicationCheckInToPlanGroups(prev, item.key));
            const history = await loadMedicationHistory();
            setHistoryDays(history);
        } catch {
            Toast.show('打卡失败', 1.5);
        } finally {
            setCheckingInKey(null);
        }
    }, [checkingInGroupTime, checkingInKey]);

    const confirmCheckInAll = useCallback(async (items: MedicationPlanItemView[], groupTime: string) => {
        if (items.length === 0 || checkingInKey || checkingInGroupTime) return;

        setCheckingInGroupTime(groupTime);
        try {
            const results = await Promise.all(items.map(item => submitMedicationCheckIn(item)));
            const failedCount = results.filter(res => !isResourceApiOk(res as any)).length;
            if (failedCount > 0) {
                Toast.show(failedCount === items.length ? '打卡失败' : '部分打卡失败', 1.5);
                await loadPageDataRef.current();
                return;
            }

            Toast.success('已全部标记为已服用', 1.5);
            setPlanGroups(prev => applyMedicationCheckInBatchToPlanGroups(prev, items.map(item => item.key)));
            const history = await loadMedicationHistory();
            setHistoryDays(history);
        } catch {
            Toast.show('打卡失败', 1.5);
        } finally {
            setCheckingInGroupTime(null);
        }
    }, [checkingInGroupTime, checkingInKey]);

    const handleCheckInAll = useCallback((group: MedicationPlanGroupView) => {
        const pendingItems = group.items.filter(item => item.canCheckIn);
        if (pendingItems.length === 0 || checkingInKey || checkingInGroupTime) return;

        Modal.alert('', buildMedicationCheckInConfirmMessage(pendingItems), [
            { text: '取消', style: 'cancel' },
            {
                text: '确定',
                onPress: () => void confirmCheckInAll(pendingItems, group.time),
            },
        ]);
    }, [checkingInGroupTime, checkingInKey, confirmCheckInAll]);

    function formatDayLabel(yyyyMMdd?: string): string {
        if (!yyyyMMdd) return '--';
        const parsed = moment(yyyyMMdd, ['YYYYMMDD', 'YYYY-MM-DD'], true);
        if (!parsed.isValid()) return yyyyMMdd;
        if (parsed.isSame(moment(), 'day')) return '今天';
        if (parsed.isSame(moment().subtract(1, 'day'), 'day')) return '昨天';
        return parsed.format('M月D日');
    }

    return (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {loading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            ) : null}

            <View style={styles.medicationBox}>
                <Flex justify="between">
                    <Text style={styles.sectionTitle}>当前用药</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MedicationAddPage')}>
                        <Image style={styles.medicationAddIcon} source={require('@/assets/images/medication/icon_jia.png')} />
                    </TouchableOpacity>
                </Flex>

                {planGroups.map((group, groupIndex) => {
                    const hasPendingCheckIn = group.items.some(item => item.canCheckIn);
                    const isGroupCheckingIn = checkingInGroupTime === group.time;
                    const isLastGroup = groupIndex === planGroups.length - 1;

                    return (
                        <View key={group.time} style={styles.medicationTimelineRow}>
                            <View style={styles.medicationAxisCol}>
                                <View style={styles.medicationAxisPointWrap}>
                                    <Image
                                        style={styles.medicationPoint}
                                        source={require('@/assets/images/medication/icon_point.png')}
                                    />
                                </View>
                                {!isLastGroup ? <View style={styles.medicationAxisLine} /> : null}
                            </View>
                            <View style={styles.medicationTimelineContent}>
                                <Flex align="center" justify="between" style={styles.medicationTitleBox}>
                                    <Flex align="center" style={{ flex: 1, paddingRight: 12 }}>
                                        <Text style={styles.medicationTitle}>{group.timeLabel}</Text>
                                        {group.eventBasedLabel ? (
                                            <Text style={styles.medicationTimeText}>{group.eventBasedLabel}</Text>
                                        ) : null}
                                    </Flex>
                                    {hasPendingCheckIn ? (
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            disabled={Boolean(checkingInKey) || isGroupCheckingIn}
                                            onPress={() => handleCheckInAll(group)}>
                                            {isGroupCheckingIn ? (
                                                <ActivityIndicator color={AppTheme.primaryColor} />
                                            ) : (
                                                <Image
                                                    style={styles.medicationSelectIcon}
                                                    source={require('@/assets/images/medication/unselected.png')}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    ) : group.items.every(item => item.taken) ? (
                                        <Image
                                            style={styles.medicationSelectIcon}
                                            source={require('@/assets/images/medication/select.png')}
                                        />
                                    ) : null}
                                </Flex>
                                <View style={styles.medicationInfo}>
                                    {group.items.map((item, index) => (
                                        <View key={item.key} style={index > 0 ? { marginTop: 8 } : undefined}>
                                            <PlanRow
                                                item={item}
                                                checkingIn={checkingInKey === item.key || isGroupCheckingIn}
                                                onCheckIn={handleCheckIn}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    );
                })}

                {!loading && planGroups.length === 0 ? (
                    <View style={styles.medicationBox}>
                        <Text style={styles.leftText}>暂无用药计划</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.medicationBox}>
                <Text style={styles.sectionTitle}>今日用药进度</Text>

                <Flex justify="between" style={styles.medicationProgressBox}>
                    <Text style={styles.medicationLeftText}>{progress.rate}%</Text>
                    <Text style={styles.medicationRightText}>
                        <Text style={styles.medicationLeftText}>{progress.takeCount}</Text>
                        /{progress.takeCount + progress.notTakeCount} 已完成
                    </Text>
                </Flex>
                <View style={styles.medicationProgressTrack}>
                    <View
                        style={[
                            styles.medicationProgressFill,
                            { width: `${Math.min(100, Math.max(0, progress.rate))}%` },
                        ]}
                    />
                </View>
            </View>


            <View style={styles.medicationBox}>
                <Text style={styles.sectionTitle}>用药提醒设置</Text>

                <Flex justify="between" align="center" style={styles.reminderModule}>
                    <Text style={styles.colTitle}>开启用药提醒</Text>
                    <Switch
                        checked={reminderEnabled}
                        onChange={handleReminderSwitch}
                        disabled={savingTip}
                        color={AppTheme.primaryColor}
                    />
                </Flex>

                <View style={styles.reminderModule}>
                    <Text style={styles.colTitle}>提前提醒时间</Text>
                    <Flex justify="between" style={{ marginTop: 15, gap: 15 }}>
                        {TIME_LIST.map(item => (
                            <TouchableOpacity
                                style={[styles.typeItem, advanceRemindTime === item.value && styles.typeItemActive]}
                                key={item.value}
                                disabled={!reminderEnabled || savingTip}
                                onPress={() => handleAdvanceTimeChange(item.value)}>
                                <Flex style={{ flex: 1 }}>
                                    <Text style={[styles.typeItemText, advanceRemindTime === item.value && styles.typeItemTextActive]}>
                                        {item.label}
                                    </Text>
                                </Flex>
                            </TouchableOpacity>
                        ))}
                    </Flex>
                </View>

                <View style={styles.reminderModule}>
                    <Text style={styles.colTitle}>提醒方式</Text>
                    <Flex justify="between" style={{ marginTop: 15 }}>
                        {DRUG_TIP_TYPE_OPTIONS.map(item => {
                            const selected = reminderEnabled && tipSettings.drugTipTypes.includes(item.value);
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    disabled={!reminderEnabled || savingTip}
                                    onPress={() => handleTipTypeToggle(item.value)}>
                                    <Flex align="center">
                                        <Image
                                            style={[
                                                styles.medicationSelectIcon,
                                                !reminderEnabled && { opacity: 0.45 },
                                            ]}
                                            source={
                                                selected
                                                    ? require('@/assets/images/medication/select.png')
                                                    : require('@/assets/images/medication/unselected.png')
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.colText,
                                                (!reminderEnabled || !selected) && { color: AppTheme.textSecondary },
                                                selected && reminderEnabled && { color: '#6D925E' },
                                            ]}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            );
                        })}
                    </Flex>
                </View>
            </View>

            <View style={styles.medicationBox}>
                <Flex justify="between" align="center">
                    <Text style={styles.sectionTitle}>服药历史</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MedicationHistoryPage')}>
                        <Flex align="center">
                            <Text style={styles.more}>全部</Text>
                            <Image style={styles.moreImg} source={require('@/assets/images/medication/icon_right.png')} />
                        </Flex>
                    </TouchableOpacity>
                </Flex>
                {historyDays.length > 0 ? (
                    <View style={styles.contentModule}>
                        {historyDays.map((day, dayIndex) => (
                            <View key={day.key} style={dayIndex > 0 ? { marginTop: 12 } : undefined}>
                                <Text style={styles.colTitle}>{formatDayLabel(day.label)}</Text>
                                <View style={styles.listBox}>
                                    {[...day.items].reverse().map(item => (
                                        <Flex justify="between" style={styles.listItem} key={item.key}>
                                            <Flex>
                                                <Text style={styles.listItemText}>{item.name}</Text>
                                                {/* <PlanTypeBadge isPrescription={item.isPrescription} /> */}
                                            </Flex>
                                            <Text style={styles.listItemText}>{item.timeText}</Text>
                                        </Flex>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : null}
                {!loading && historyDays.length === 0 ? (
                    <View style={styles.contentModule}>
                        <Text style={styles.leftText}>暂无服药记录</Text>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}
