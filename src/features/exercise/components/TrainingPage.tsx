import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, type ImageSourcePropType } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import styles from '@/css/exercise';
import {
    getExUserSignInfo,
    postExUserSign,
    type ExUserSignInfo,
} from '@/api/exUserSignInfo';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '../utils/dietCalendarHelpers';
import {
    EXERCISE_CHECK_IN_DOT_COLOR,
    loadExerciseCheckInMapByDateRange,
    loadExerciseCheckInMapByYear,
    type ExerciseCheckInMap,
} from '../utils/exerciseCheckInHelpers';
import {
    emptyExerciseDayStatView,
    formatExerciseStatCompleteRate,
    formatExerciseStatKcal,
    formatExerciseStatMinutes,
    loadExerciseDayStat,
    resolveExerciseStatProgressPercent,
    type ExerciseDayStatView,
} from '../utils/exerciseDayStatHelpers';
import { loadExPatientRuleForDate } from '../utils/exerciseRuleDateHelpers';
import {
    getExerciseSignBlockedMessage,
    getExerciseSignButtonLabel,
    isExerciseMainTrainingCompleted,
} from '../utils/exerciseSignHelpers';
import {
    buildMainTrainingModules,
    isMainTrainingAllProgressStarted,
} from '../utils/trainingPhaseHelpers';
import WarmupPhase from './training/WarmupPhase';
import MainTrainingPhase from './training/MainTrainingPhase';
import CooldownPhase from './training/CooldownPhase';

const SIGN_CHECK_ICON = require('@/assets/images/nutrition/wc.png');
const PHASE_NEXT_ICON = require('@/assets/images/exercise/icon_next.png');

export type TrainingPhaseKey = 'warmup' | 'main' | 'cooldown';

const TRAINING_PHASE_TABS: ReadonlyArray<{
    key: TrainingPhaseKey;
    label: string;
    icon: ImageSourcePropType;
}> = [
        {
            key: 'warmup',
            label: '热身',
            icon: require('@/assets/images/exercise/icon_rs.png'),
        },
        {
            key: 'main',
            label: '主训练',
            icon: require('@/assets/images/exercise/icon_zxl.png'),
        },
        {
            key: 'cooldown',
            label: '冷身',
            icon: require('@/assets/images/exercise/icon_ls.png'),
        },
    ];

type Props = {
    exerciseRule?: InUseExPatientRule | null;
};

export default function TrainingPage({ exerciseRule = null }: Props) {
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
    const [dayRule, setDayRule] = useState<InUseExPatientRule | null>(exerciseRule);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [activePhase, setActivePhase] = useState<TrainingPhaseKey>('warmup');
    const [checkInMap, setCheckInMap] = useState<ExerciseCheckInMap>({});
    const [dayStat, setDayStat] = useState<ExerciseDayStatView>(emptyExerciseDayStatView);
    const [signInfo, setSignInfo] = useState<ExUserSignInfo | null>(null);
    const [signing, setSigning] = useState(false);
    /** 主训练每项均至少有进度（半完成，如 2/12 分钟、1/10 组次） */
    const [mainAllProgressed, setMainAllProgressed] = useState(false);
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
    const isPast = moment(selectedDate).isBefore(moment(), 'day');
    const isFuture = moment(selectedDate).isAfter(moment(), 'day');
    const isToday = !isPast && !isFuture;
    /** 非今日仅只读，不可执行 */
    const readOnly = !isToday;
    const dateMode = isPast ? 'past' : isFuture ? 'future' : 'today';

    const exerciseDayRecordMarker = useMemo(() => ({
        color: EXERCISE_CHECK_IN_DOT_COLOR,
        loadByYear: loadExerciseCheckInMapByYear,
    }), []);

    const loadDayRule = useCallback(async (date: string, inUseRule: InUseExPatientRule | null) => {
        const rule = await loadExPatientRuleForDate(date, inUseRule);
        setDayRule(rule);
        return rule;
    }, []);

    const loadWeekCheckIn = useCallback(async (date: string) => {
        const start = moment(date).startOf('isoWeek').format('YYYY-MM-DD');
        const end = moment(date).endOf('isoWeek').format('YYYY-MM-DD');
        const map = await loadExerciseCheckInMapByDateRange(start, end);
        setCheckInMap(prev => ({ ...prev, ...map }));
    }, []);

    const loadDayStat = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        const exPatientRuleId = rule?.exPatientRuleId ?? exerciseRule?.exPatientRuleId;
        const next = await loadExerciseDayStat({
            exPatientRuleId,
            customerLocalDate: date,
        });
        setDayStat(next);
    }, [exerciseRule?.exPatientRuleId]);

    const loadMainProgress = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        try {
            const result = await buildMainTrainingModules(rule, date);
            if (result.isRest) {
                setMainAllProgressed(false);
                return;
            }
            setMainAllProgressed(isMainTrainingAllProgressStarted(result.modules));
        } catch {
            setMainAllProgressed(false);
        }
    }, []);

    const loadSignInfo = useCallback(async () => {
        try {
            const res = await getExUserSignInfo();
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                setSignInfo(null);
                return;
            }
            setSignInfo(
                apiResourceData<ExUserSignInfo>(
                    res as unknown as { code?: number; data?: ExUserSignInfo },
                ) ?? null,
            );
        } catch {
            setSignInfo(null);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            void (async () => {
                const rule = await loadDayRule(selectedDate, exerciseRule);
                if (cancelled) return;
                void loadWeekCheckIn(selectedDate);
                void loadDayStat(selectedDate, rule);
                void loadMainProgress(selectedDate, rule);
                if (!moment(selectedDate).isBefore(moment(), 'day')) {
                    void loadSignInfo();
                }
            })();
            return () => {
                cancelled = true;
            };
        }, [
            exerciseRule,
            loadDayRule,
            loadDayStat,
            loadMainProgress,
            loadSignInfo,
            loadWeekCheckIn,
            selectedDate,
        ]),
    );

    const onPressDatePicker = () => {
        setDatePickerVisible(true);
    };

    /** 主训练每项有进度（半完成）即可打卡 */
    const canFinishSign = useMemo(() => {
        if (signInfo?.signedToday) return false;
        if (signInfo?.canSign) return true;
        if (mainAllProgressed) return true;
        if (isExerciseMainTrainingCompleted(signInfo)) return true;
        return dayStat.mainTotalCount > 0
            && dayStat.mainCompleteCount >= dayStat.mainTotalCount;
    }, [
        dayStat.mainCompleteCount,
        dayStat.mainTotalCount,
        mainAllProgressed,
        signInfo,
    ]);

    const onFinishSign = useCallback(async () => {
        if (signing || !isToday) return;
        if (signInfo?.signedToday) {
            Toast.info('今日已打卡');
            return;
        }
        if (!canFinishSign) {
            Toast.info(
                getExerciseSignBlockedMessage(signInfo, { mainProgressed: mainAllProgressed })
                || '请先完成主训练后再打卡（每项有进度即可）',
            );
            return;
        }

        setSigning(true);
        const loadingKey = Toast.loading('打卡中…', 0);
        try {
            const res = await postExUserSign();
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                Toast.info((res as { msg?: string })?.msg?.trim() || '打卡失败');
                return;
            }
            const next = apiResourceData<ExUserSignInfo>(
                res as unknown as { code?: number; data?: ExUserSignInfo },
            ) ?? null;
            setSignInfo(next);
            void loadWeekCheckIn(selectedDate);
            void loadMainProgress(selectedDate, dayRule);
            Toast.info('打卡成功', 1.5);
        } catch {
            Toast.info('打卡失败');
        } finally {
            Toast.remove(loadingKey);
            setSigning(false);
        }
    }, [
        canFinishSign,
        dayRule,
        isToday,
        loadMainProgress,
        loadWeekCheckIn,
        mainAllProgressed,
        selectedDate,
        signInfo,
        signing,
    ]);

    const onPressBottomAction = useCallback(() => {
        if (activePhase === 'warmup') {
            setActivePhase('main');
            return;
        }
        if (activePhase === 'main') {
            setActivePhase('cooldown');
            return;
        }
        if (!isToday) return;
        void onFinishSign();
    }, [activePhase, isToday, onFinishSign]);

    const bottomAction = !isToday
        ? activePhase === 'warmup'
            ? {
                label: isPast ? '查看主训练' : '进入主训练',
                showIcon: true,
                icon: PHASE_NEXT_ICON,
                disabled: false,
                dimmed: false,
            }
            : activePhase === 'main'
                ? {
                    label: isPast ? '查看冷身' : '进入冷身',
                    showIcon: true,
                    icon: PHASE_NEXT_ICON,
                    disabled: false,
                    dimmed: false,
                }
                : null
        : activePhase === 'warmup'
            ? { label: '进入主训练', showIcon: true, icon: PHASE_NEXT_ICON, disabled: false, dimmed: false }
            : activePhase === 'main'
                ? { label: '进入冷身', showIcon: true, icon: PHASE_NEXT_ICON, disabled: false, dimmed: false }
                : {
                    label: getExerciseSignButtonLabel(signInfo),
                    showIcon: true,
                    icon: SIGN_CHECK_ICON,
                    disabled: signing || Boolean(signInfo?.signedToday),
                    dimmed: !canFinishSign && !signInfo?.signedToday,
                };

    return (
        <View style={{ flex: 1 }}>
            <DietDatePickerModal
                visible={datePickerVisible}
                selectedDate={selectedDate}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setSelectedDate}
                dayRecordMarker={exerciseDayRecordMarker}
            />
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
                <Flex justify="between" style={styles.calendarBox}>
                    {weekDays.map(item => {
                        const isActive = item.key === selectedDate;
                        const hasCheckIn = Boolean(checkInMap[item.key]);
                        return (
                            <TouchableOpacity
                                key={item.key}
                                activeOpacity={0.7}
                                style={[styles.calendarCol, isActive && styles.calendarColActive]}
                                onPress={() => setSelectedDate(item.key)}>
                                <Text style={isActive ? styles.calendarTitleActive : styles.calendarTitle}>
                                    {item.label}
                                </Text>
                                <Text style={isActive ? styles.calendarSubtitleActive : styles.calendarSubtitle}>
                                    {item.day}
                                </Text>
                                <View style={styles.calendarDotWrap}>
                                    {hasCheckIn ? (
                                        <View
                                            style={[
                                                styles.calendarDot,
                                                { backgroundColor: EXERCISE_CHECK_IN_DOT_COLOR },
                                            ]}
                                        />
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.calendarCol}
                        onPress={onPressDatePicker}>
                        <Text style={styles.calendarTitle}>日期</Text>
                        <Image
                            style={styles.calendarImage}
                            source={require('@/assets/images/nutrition/time.png')}
                        />
                    </TouchableOpacity>
                </Flex>
                <View style={styles.trainingStatRow}>
                    <View style={styles.trainingStatCard}>
                        <Image
                            style={styles.trainingStatIcon}
                            source={require('@/assets/images/exercise/icon_fz.png')}
                        />
                        <Text style={styles.trainingStatValue}>
                            {formatExerciseStatMinutes(dayStat.sumMinutes)}
                        </Text>
                        <Text style={styles.trainingStatLabel}>分钟</Text>
                    </View>
                    <View style={styles.trainingStatCard}>
                        <Image
                            style={styles.trainingStatIcon}
                            source={require('@/assets/images/exercise/icon_qk.png')}
                        />
                        <Text style={styles.trainingStatValue}>
                            {formatExerciseStatKcal(dayStat.exerciseKcal)}
                        </Text>
                        <Text style={styles.trainingStatLabel}>千卡</Text>
                    </View>
                    <View style={styles.trainingStatCard}>
                        <Image
                            style={styles.trainingStatIcon}
                            source={require('@/assets/images/exercise/icon_wcd.png')}
                        />
                        <Text style={styles.trainingStatValue}>
                            {formatExerciseStatCompleteRate(dayStat.mainCompleteRate)}
                        </Text>
                        <Text style={styles.trainingStatLabel}>完成度</Text>
                    </View>
                </View>
                <View style={styles.trainingProgressTrack}>
                    <View
                        style={[
                            styles.trainingProgressFill,
                            {
                                width: `${resolveExerciseStatProgressPercent(dayStat.mainCompleteRate)}%` as `${number}%`,
                            },
                        ]}
                    />
                </View>

                <View style={styles.trainingPhaseTabBox}>
                    {TRAINING_PHASE_TABS.map(tab => {
                        const isActive = activePhase === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                activeOpacity={0.8}
                                style={[
                                    styles.trainingPhaseTabItem,
                                    isActive && styles.trainingPhaseTabItemActive,
                                ]}
                                onPress={() => setActivePhase(tab.key)}>
                                <Image style={styles.trainingPhaseTabIcon} source={tab.icon} />
                                <Text style={styles.trainingPhaseTabText}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {activePhase === 'warmup' ? (
                    <WarmupPhase
                        key={`warmup-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={readOnly}
                        dateMode={dateMode}
                    />
                ) : null}
                {activePhase === 'main' ? (
                    <MainTrainingPhase
                        key={`main-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={readOnly}
                        dateMode={dateMode}
                    />
                ) : null}
                {activePhase === 'cooldown' ? (
                    <CooldownPhase
                        key={`cooldown-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={readOnly}
                        dateMode={dateMode}
                    />
                ) : null}
            </ScrollView>

            {bottomAction ? (
                <Flex
                    justify="between"
                    align="center"
                    style={[
                        styles.bottomBar,
                        { paddingBottom: Math.max(insets.bottom, 8) },
                    ]}>
                    <TouchableOpacity
                        style={[
                            styles.bottomBarButtonLeft,
                            (bottomAction.disabled || bottomAction.dimmed)
                                ? { opacity: 0.5 }
                                : null,
                        ]}
                        activeOpacity={0.7}
                        disabled={bottomAction.disabled}
                        onPress={onPressBottomAction}>
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            {bottomAction.showIcon ? (
                                <Image
                                    style={styles.bottomBarButtonIcon}
                                    source={bottomAction.icon}
                                />
                            ) : null}
                            <Text style={styles.bottomBarButtonTextLeft}>
                                {signing && activePhase === 'cooldown' && isToday
                                    ? '打卡中...'
                                    : bottomAction.label}
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            ) : null}
        </View>
    );
}
