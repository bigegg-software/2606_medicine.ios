import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Flex, Switch, Toast } from '@ant-design/react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
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
    applyMedicationCheckInToProgress,
    loadMedicationDictMaps,
    loadMedicationHistory,
    loadMedicationPlanGroups,
    loadMedicationProgress,
    submitMedicationCheckIn,
    type DrugTipSettings,
    type MedicationDictMaps,
    type MedicationHistoryDayView,
    type MedicationPlanGroupView,
    type MedicationPlanItemView,
    type MedicationProgressView,
} from '../medicationHelpers';
import moment from 'moment';

const TIME_LIST = [
    { label: '5分钟', value: '5' },
    { label: '10分钟', value: '10' },
    { label: '15分钟', value: '15' },
];

const PROGRESS_SIZE = 48;
const PROGRESS_STROKE = 4;

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
    if (taken) {
        return (
            <Flex align="center">
                <View style={styles.medicationStatusIconWrap}>
                    <View style={styles.medicationStatusCircleTaken} />
                    <Text style={styles.medicationStatusCheck}>✓</Text>
                </View>
                <Text style={styles.medicationYfyText}>已服用</Text>
            </Flex>
        );
    }
    return (
        <Flex align="center">
            <View style={styles.medicationStatusIconWrap}>
                <View style={styles.medicationStatusCircle} />
            </View>
            <Text style={styles.medicationWfyText}>已服用</Text>
        </Flex>
    );
}

function ProgressRing({ progress }: { progress: number }) {
    const value = Math.min(100, Math.max(0, Math.round(progress)));
    const isComplete = value >= 100;
    const ringColor = isComplete ? "rgba(0,201,80,0.14)" : "rgba(255,139,7,0.14)";
    const progressColor = isComplete ? "#00C950" : "#FF8B07";
    const progressRadius = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
    const progressCenter = PROGRESS_SIZE / 2;
    const progressPath = useMemo(() => {
        const path = Skia.Path.Make();
        path.addArc(
            {
                x: progressCenter - progressRadius,
                y: progressCenter - progressRadius,
                width: progressRadius * 2,
                height: progressRadius * 2,
            },
            -90,
            (360 * value) / 100,
        );
        return path;
    }, [progressCenter, progressRadius, value]);

    return (
        <View style={styles.progressRing}>
            <Canvas style={styles.progressCanvas}>
                <Circle
                    cx={progressCenter}
                    cy={progressCenter}
                    r={progressRadius}
                    color={ringColor}
                    style="stroke"
                    strokeWidth={PROGRESS_STROKE}
                />
                <Path
                    path={progressPath}
                    color={progressColor}
                    style="stroke"
                    strokeWidth={PROGRESS_STROKE}
                    strokeCap="round"
                />
            </Canvas>
            <Text style={[styles.progressText, isComplete && { color: progressColor }]}>{value}%</Text>
        </View>
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
        <Flex justify="between" align="center">
            <View style={styles.medicationLeftBox}>
                <Flex>
                    <Text style={styles.medicationLeftTitle}>{item.name}</Text>
                    <PlanTypeBadge isPrescription={item.planType === 1} />
                </Flex>
                <Text style={styles.medicationText}>{item.doseText}</Text>
            </View>
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
    const [progress, setProgress] = useState<MedicationProgressView>({ rate: 0, takeCount: 0, notTakeCount: 0 });
    const [historyDays, setHistoryDays] = useState<MedicationHistoryDayView[]>([]);
    const [checkingInKey, setCheckingInKey] = useState<string | null>(null);
    const [tipSettings, setTipSettings] = useState<DrugTipSettings>(() => buildDrugTipSettingsFromUserExtr(null));
    const [savingTip, setSavingTip] = useState(false);

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
                Toast.fail((res as any)?.msg || '保存提醒设置失败', 1.5);
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
            Toast.fail('保存提醒设置失败', 1.5);
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

            const [groups, progressData, history] = await Promise.all([
                loadMedicationPlanGroups(maps),
                loadMedicationProgress(),
                loadMedicationHistory(),
            ]);

            setPlanGroups(groups);
            setProgress(progressData);
            setHistoryDays(history);
        } catch {
            setPlanGroups([]);
            setProgress({ rate: 0, takeCount: 0, notTakeCount: 0 });
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
        if (!item.canCheckIn || checkingInKey) return;

        setCheckingInKey(item.key);
        try {
            const res = await submitMedicationCheckIn(item);
            if (!isResourceApiOk(res as any)) {
                Toast.fail((res as any)?.msg || '打卡失败', 1.5);
                return;
            }
            Toast.success('已记录服用', 1.5);
            setPlanGroups(prev => applyMedicationCheckInToPlanGroups(prev, item.key));
            setProgress(prev => applyMedicationCheckInToProgress(prev));
            const history = await loadMedicationHistory();
            setHistoryDays(history);
        } catch {
            Toast.fail('打卡失败', 1.5);
        } finally {
            setCheckingInKey(null);
        }
    }, [checkingInKey]);

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

            <Flex justify="between">
                <Text style={[styles.sectionTitle, { marginTop: 6 }]}>当前用药</Text>
                <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => navigation.navigate('MedicationAddPage')}>
                    <Text style={[styles.more, { marginTop: 0 }]}>添加用药</Text>
                </TouchableOpacity>
            </Flex>


            {!loading && planGroups.length === 0 ? (
                <View style={styles.medicationBox}>
                    <Text style={styles.leftText}>暂无用药计划</Text>
                </View>
            ) : null}

            {planGroups.map(group => (
                <View key={group.time} style={styles.medicationBox}>
                    <Flex align="center" style={styles.medicationTitleBox}>
                        <Image source={require('@/assets/images/medication/time.png')} style={styles.medicationTime} />
                        <Text style={styles.medicationTitle}>{group.timeLabel}</Text>
                        {group.eventBasedLabel ? (
                            <Text style={styles.medicationTimeText}>{group.eventBasedLabel}</Text>
                        ) : null}
                    </Flex>
                    <View style={[styles.rowLine, { marginBottom: 16 }]} />
                    <View style={styles.medicationInfo}>
                        {group.items.map((item, index) => (
                            <View key={item.key} style={index > 0 ? { marginTop: 8 } : undefined}>
                                <PlanRow
                                    item={item}
                                    checkingIn={checkingInKey === item.key}
                                    onCheckIn={handleCheckIn}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            ))}

            <View style={styles.medicationBox}>
                <Flex justify="between">
                    <Text style={styles.medicationTitle}>用药进度</Text>
                    <ProgressRing progress={progress.rate} />
                </Flex>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>用药提醒</Text>
            <View style={styles.medicationBox}>
                <Flex justify="between" align="center" style={{ marginBottom: 12 }}>
                    <Text style={styles.colTitle}>开启用药提醒</Text>
                    <Switch
                        checked={reminderEnabled}
                        onChange={handleReminderSwitch}
                        disabled={savingTip}
                        color={AppTheme.primaryColor}
                    />
                </Flex>
                <View style={[styles.rowLine, { marginBottom: 10 }]} />
                <Text style={styles.colTitle}>提前提醒时间</Text>
                <Flex justify="between" style={{ marginTop: 14, marginBottom: 12, gap: 8 }}>
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
                <View style={[styles.rowLine, { marginBottom: 10 }]} />
                <Text style={styles.colTitle}>提醒方式</Text>
                <Flex justify="between" style={{ marginTop: 14, marginBottom: 12, gap: 8 }}>
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
                                            styles.tipCheckIcon,
                                            !reminderEnabled && { opacity: 0.45 },
                                        ]}
                                        source={
                                            selected
                                                ? require('@/assets/images/medication/tipCheckOn.png')
                                                : require('@/assets/images/medication/tipCheckOff.png')
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.colText,
                                            (!reminderEnabled || !selected) && { color: AppTheme.textSecondary },
                                            selected && reminderEnabled && { color: AppTheme.primaryColor },
                                        ]}>
                                        {item.label}
                                    </Text>
                                </Flex>
                            </TouchableOpacity>
                        );
                    })}
                </Flex>
            </View>

            <Flex justify="between">
                <Text style={[styles.sectionTitle, { marginTop: 18 }]}>服药历史</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MedicationHistoryPage')}>
                    <Text style={styles.more}>全部</Text>
                </TouchableOpacity>
            </Flex>

            {!loading && historyDays.length === 0 ? (
                <View style={styles.medicationBox}>
                    <Text style={styles.leftText}>暂无服药记录</Text>
                </View>
            ) : null}

            {historyDays.length > 0 ? (
                <View style={styles.medicationBox}>
                    {historyDays.map((day, dayIndex) => (
                        <View key={day.key}>
                            <Text style={styles.colTitle}>{formatDayLabel(day.label)}</Text>
                            <View style={styles.listBox}>
                                {day.items.map(item => (
                                    <Flex justify="between" style={styles.listItem} key={item.key}>
                                        <Flex>
                                            <Text style={styles.listItemText}>{item.name}</Text>
                                            <PlanTypeBadge isPrescription={item.isPrescription} />
                                        </Flex>
                                        <Text style={styles.listItemText}>{item.timeText}</Text>
                                    </Flex>
                                ))}
                            </View>
                            {dayIndex < historyDays.length - 1 ? (
                                <View style={[styles.rowLine, { marginBottom: 10 }]} />
                            ) : null}
                        </View>
                    ))}
                </View>
            ) : null}
        </ScrollView>
    );
}
