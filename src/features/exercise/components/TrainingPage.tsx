import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import styles from '@/css/exercise';
import {
    getExUserSignInfo,
    type ExUserSignInfo,
} from '@/api/exUserSignInfo';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
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
import { loadExPatientRuleForDate, resolveLockedExerciseViewDate } from '../utils/exerciseRuleDateHelpers';
import {
    getExerciseSignButtonLabel,
    performExerciseDailySign,
    resolveExerciseCanFinishSign,
    subscribeExerciseSignSuccess,
} from '../utils/exerciseSignHelpers';
import {
    attachTrainingPhaseCompleteInfo,
    buildMainTrainingModules,
    buildTrainingPhaseCards,
    findNextTrainingPhasePlayCard,
    flattenMainTrainingPlayCards,
    formatTrainingPhaseSubtitle,
    getCooldownColdList,
    getWarmupHotList,
    isMainTrainingAllProgressStarted,
    isTrainingPhaseAllPlayed,
    type MainTrainingPlayCard,
    type TrainingPhaseExerciseCard,
} from '../utils/trainingPhaseHelpers';
import { consumePendingTrainingPhaseTab } from '../utils/trainingPhaseTabSync';
import WarmupPhase from './training/WarmupPhase';
import MainTrainingPhase from './training/MainTrainingPhase';
import CooldownPhase from './training/CooldownPhase';

const SIGN_CHECK_ICON = require('@/assets/images/nutrition/wc.png');
const PHASE_NEXT_ICON = require('@/assets/images/exercise/icon_next.png');

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type TrainingPhaseKey = 'warmup' | 'main' | 'cooldown';

function resolveMainTaskIndex(
    dayRule: InUseExPatientRule | null | undefined,
    exerciseType: string,
) {
    const list = dayRule?.ruleRatioList ?? [];
    const matched = list.findIndex(item => item.exerciseType?.trim() === exerciseType);
    return matched >= 0 ? matched : undefined;
}

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
    /** 家人只读：不可训练/打卡 */
    forceReadOnly?: boolean;
    patientUserId?: string;
    /** 历史计划：锁定当前处方，不可进播放页 */
    lockToRule?: boolean;
};

export default function TrainingPage({
    exerciseRule = null,
    forceReadOnly = false,
    patientUserId,
    lockToRule = false,
}: Props) {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState(() =>
        lockToRule ? resolveLockedExerciseViewDate(exerciseRule) : moment().format('YYYY-MM-DD'),
    );
    const [dayRule, setDayRule] = useState<InUseExPatientRule | null>(exerciseRule);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [activePhase, setActivePhase] = useState<TrainingPhaseKey>('warmup');
    const [checkInMap, setCheckInMap] = useState<ExerciseCheckInMap>({});
    const [dayStat, setDayStat] = useState<ExerciseDayStatView>(emptyExerciseDayStatView);
    const [signInfo, setSignInfo] = useState<ExUserSignInfo | null>(null);
    const [signing, setSigning] = useState(false);
    /** 主训练每项均至少有进度（半完成，如 2/12 分钟、1/10 组次） */
    const [mainAllProgressed, setMainAllProgressed] = useState(false);
    /** 主训练展平列表（含完成进度），用于底部「开始主训练 / 进入冷身」 */
    const [mainPlayCards, setMainPlayCards] = useState<MainTrainingPlayCard[]>([]);
    /** 热身列表（含完成进度），用于底部「开始热身 / 进入主训练」 */
    const [warmupCards, setWarmupCards] = useState<TrainingPhaseExerciseCard[]>([]);
    /** 冷身列表（含完成进度），用于底部「开始冷身 / 完成今日打卡」 */
    const [cooldownCards, setCooldownCards] = useState<TrainingPhaseExerciseCard[]>([]);
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
    const isPast = moment(selectedDate).isBefore(moment(), 'day');
    const isFuture = moment(selectedDate).isAfter(moment(), 'day');
    const isToday = !isPast && !isFuture;
    /** 非今日或家人/历史只读：不可执行 */
    const readOnly = forceReadOnly || !isToday;
    const disablePlayer = lockToRule;
    const dateMode = isPast ? 'past' : isFuture ? 'future' : 'today';
    const patientOpts = useMemo(
        () => (patientUserId ? { patientUserId } : undefined),
        [patientUserId],
    );
    const nextWarmupCard = useMemo(
        () => findNextTrainingPhasePlayCard(warmupCards),
        [warmupCards],
    );
    const warmupAllPlayed = useMemo(
        () => isTrainingPhaseAllPlayed(warmupCards),
        [warmupCards],
    );
    const nextMainCard = useMemo(
        () => findNextTrainingPhasePlayCard<MainTrainingPlayCard>(mainPlayCards),
        [mainPlayCards],
    );
    const mainAllPlayed = useMemo(
        () => isTrainingPhaseAllPlayed(mainPlayCards),
        [mainPlayCards],
    );
    const nextCooldownCard = useMemo(
        () => findNextTrainingPhasePlayCard(cooldownCards),
        [cooldownCards],
    );
    const cooldownAllPlayed = useMemo(
        () => isTrainingPhaseAllPlayed(cooldownCards),
        [cooldownCards],
    );

    const exerciseDayRecordMarker = useMemo(() => ({
        color: EXERCISE_CHECK_IN_DOT_COLOR,
        loadByYear: (year: number) =>
            loadExerciseCheckInMapByYear(year, patientUserId, exerciseRule?.exPatientRuleId),
    }), [exerciseRule?.exPatientRuleId, patientUserId]);

    /** 历史处方 getInfo 返回后，将日期对齐到处方周期内 */
    useEffect(() => {
        if (!lockToRule || !exerciseRule) return;
        setSelectedDate(resolveLockedExerciseViewDate(exerciseRule));
        setDayRule(exerciseRule);
    }, [lockToRule, exerciseRule]);

    const loadDayRule = useCallback(async (date: string, inUseRule: InUseExPatientRule | null) => {
        if (lockToRule) {
            setDayRule(inUseRule);
            return inUseRule;
        }
        const rule = await loadExPatientRuleForDate(date, inUseRule, {
            ...patientOpts,
            exPatientRuleId: inUseRule?.exPatientRuleId ?? exerciseRule?.exPatientRuleId,
        });
        setDayRule(rule);
        return rule;
    }, [exerciseRule?.exPatientRuleId, lockToRule, patientOpts]);

    const loadWeekCheckIn = useCallback(async (date: string) => {
        const start = moment(date).startOf('isoWeek').format('YYYY-MM-DD');
        const end = moment(date).endOf('isoWeek').format('YYYY-MM-DD');
        const map = await loadExerciseCheckInMapByDateRange(
            start,
            end,
            patientUserId,
            exerciseRule?.exPatientRuleId ?? dayRule?.exPatientRuleId,
        );
        setCheckInMap(prev => ({ ...prev, ...map }));
    }, [dayRule?.exPatientRuleId, exerciseRule?.exPatientRuleId, patientUserId]);

    const loadDayStat = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        const exPatientRuleId = rule?.exPatientRuleId ?? exerciseRule?.exPatientRuleId;
        const next = await loadExerciseDayStat({
            exPatientRuleId,
            customerLocalDate: date,
            patientUserId,
        });
        setDayStat(next);
    }, [exerciseRule?.exPatientRuleId, patientUserId]);

    const loadMainProgress = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        try {
            const result = await buildMainTrainingModules(rule, date, patientUserId);
            if (result.isRest) {
                setMainAllProgressed(false);
                setMainPlayCards([]);
                return;
            }
            setMainPlayCards(flattenMainTrainingPlayCards(result.modules));
            setMainAllProgressed(isMainTrainingAllProgressStarted(result.modules));
        } catch {
            setMainAllProgressed(false);
            setMainPlayCards([]);
        }
    }, [patientUserId]);

    const loadWarmupProgress = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        try {
            const { isRest, hotList } = getWarmupHotList(rule, date);
            if (isRest || hotList.length === 0) {
                setWarmupCards([]);
                return;
            }
            const cards = await buildTrainingPhaseCards(hotList);
            const withInfo = await attachTrainingPhaseCompleteInfo(cards, {
                exPatientRuleId: rule?.exPatientRuleId,
                customerLocalDate: date,
                trainingPhase: 'hot',
                patientUserId,
            });
            setWarmupCards(withInfo);
        } catch {
            setWarmupCards([]);
        }
    }, [patientUserId]);

    const loadCooldownProgress = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        try {
            const { isRest, coldList } = getCooldownColdList(rule, date);
            if (isRest || coldList.length === 0) {
                setCooldownCards([]);
                return;
            }
            const cards = await buildTrainingPhaseCards(coldList);
            const withInfo = await attachTrainingPhaseCompleteInfo(cards, {
                exPatientRuleId: rule?.exPatientRuleId,
                customerLocalDate: date,
                trainingPhase: 'cold',
                patientUserId,
            });
            setCooldownCards(withInfo);
        } catch {
            setCooldownCards([]);
        }
    }, [patientUserId]);

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
            const pendingTab = consumePendingTrainingPhaseTab();
            if (pendingTab) {
                setActivePhase(pendingTab);
            }

            let cancelled = false;
            void (async () => {
                const rule = await loadDayRule(selectedDate, exerciseRule);
                if (cancelled) return;
                void loadWeekCheckIn(selectedDate);
                void loadDayStat(selectedDate, rule);
                void loadMainProgress(selectedDate, rule);
                void loadWarmupProgress(selectedDate, rule);
                void loadCooldownProgress(selectedDate, rule);
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
            loadWarmupProgress,
            loadCooldownProgress,
            loadSignInfo,
            loadWeekCheckIn,
            patientUserId,
            selectedDate,
        ]),
    );

    // 右侧「戳我打卡」成功后同步底部打卡状态与日历点
    useEffect(() => {
        return subscribeExerciseSignSuccess((next: ExUserSignInfo | null) => {
            setSignInfo(next);
            void loadWeekCheckIn(selectedDate);
            void loadMainProgress(selectedDate, dayRule);
        });
    }, [dayRule, loadMainProgress, loadWeekCheckIn, selectedDate]);

    const onPressDatePicker = () => {
        setDatePickerVisible(true);
    };

    /** 主训练每项有进度（半完成）即可打卡 */
    const canFinishSign = useMemo(
        () => resolveExerciseCanFinishSign({
            signInfo,
            mainAllProgressed,
            mainTotalCount: dayStat.mainTotalCount,
            mainCompleteCount: dayStat.mainCompleteCount,
        }),
        [
            dayStat.mainCompleteCount,
            dayStat.mainTotalCount,
            mainAllProgressed,
            signInfo,
        ],
    );

    const onFinishSign = useCallback(async () => {
        if (signing || !isToday) return;
        setSigning(true);
        try {
            const result = await performExerciseDailySign({
                isToday: true,
                signInfo,
                mainAllProgressed,
                mainTotalCount: dayStat.mainTotalCount,
                mainCompleteCount: dayStat.mainCompleteCount,
            });
            if (!result.ok) return;
            setSignInfo(result.signInfo);
            void loadWeekCheckIn(selectedDate);
            void loadMainProgress(selectedDate, dayRule);
        } finally {
            setSigning(false);
        }
    }, [
        dayRule,
        dayStat.mainCompleteCount,
        dayStat.mainTotalCount,
        isToday,
        loadMainProgress,
        loadWeekCheckIn,
        mainAllProgressed,
        selectedDate,
        signInfo,
        signing,
    ]);

    const openWarmupPlayer = useCallback((card: TrainingPhaseExerciseCard) => {
        if (disablePlayer) return;
        navigation.navigate('ExercisePlayerPage', {
            exVideoId: card.exVideoId,
            title: card.title,
            ruleSubtitle: formatTrainingPhaseSubtitle(card),
            trainingPhase: 'hot',
            groupVal: card.groupVal,
            numberVal: card.numberVal,
            keepSecondVal: card.keepSecondVal,
            durationMinutes: card.durationMinutes,
            timerType: card.timerType,
            readOnly,
            customerLocalDate: selectedDate,
        });
    }, [disablePlayer, navigation, readOnly, selectedDate]);

    const openMainPlayer = useCallback((card: MainTrainingPlayCard) => {
        if (disablePlayer) return;
        const exerciseType = card.exerciseType;
        const rule = dayRule?.ruleRatioList?.find(
            item => item.exerciseType?.trim() === exerciseType,
        );
        navigation.navigate('ExercisePlayerPage', {
            exerciseType,
            exerciseChildType: rule?.exerciseChildType,
            strengthLevel: rule?.strengthLevel,
            taskIndex: resolveMainTaskIndex(dayRule, exerciseType),
            exVideoId: card.exVideoId,
            title: card.title,
            ruleSubtitle: formatTrainingPhaseSubtitle(card),
            trainingPhase: 'main',
            groupVal: card.groupVal,
            numberVal: card.numberVal,
            keepSecondVal: card.keepSecondVal,
            durationMinutes: card.durationMinutes,
            timerType: card.timerType || undefined,
            readOnly,
            customerLocalDate: selectedDate,
        });
    }, [dayRule, disablePlayer, navigation, readOnly, selectedDate]);

    const openCooldownPlayer = useCallback((card: TrainingPhaseExerciseCard) => {
        if (disablePlayer) return;
        navigation.navigate('ExercisePlayerPage', {
            exVideoId: card.exVideoId,
            title: card.title,
            ruleSubtitle: formatTrainingPhaseSubtitle(card),
            trainingPhase: 'cold',
            groupVal: card.groupVal,
            numberVal: card.numberVal,
            keepSecondVal: card.keepSecondVal,
            durationMinutes: card.durationMinutes,
            timerType: card.timerType,
            readOnly,
            customerLocalDate: selectedDate,
        });
    }, [disablePlayer, navigation, readOnly, selectedDate]);

    const onPressBottomAction = useCallback(() => {
        if (!isToday) {
            if (activePhase === 'warmup') {
                setActivePhase('main');
                return;
            }
            if (activePhase === 'main') {
                setActivePhase('cooldown');
                return;
            }
            return;
        }

        // 今日：按阶段完成进度决定动作，开始* 均直接进播放页
        if (activePhase === 'warmup') {
            if (!warmupAllPlayed) {
                if (nextWarmupCard) openWarmupPlayer(nextWarmupCard);
                return;
            }
            if (!mainAllPlayed) {
                if (nextMainCard) {
                    openMainPlayer(nextMainCard);
                } else {
                    setActivePhase('main');
                }
                return;
            }
            if (!cooldownAllPlayed) {
                if (nextCooldownCard) {
                    openCooldownPlayer(nextCooldownCard);
                } else {
                    setActivePhase('cooldown');
                }
                return;
            }
            void onFinishSign();
            return;
        }

        if (activePhase === 'main') {
            if (!mainAllPlayed) {
                if (nextMainCard) openMainPlayer(nextMainCard);
                return;
            }
            if (!cooldownAllPlayed) {
                if (nextCooldownCard) {
                    openCooldownPlayer(nextCooldownCard);
                } else {
                    setActivePhase('cooldown');
                }
                return;
            }
            void onFinishSign();
            return;
        }

        if (activePhase === 'cooldown') {
            if (!cooldownAllPlayed) {
                if (nextCooldownCard) openCooldownPlayer(nextCooldownCard);
                return;
            }
            void onFinishSign();
        }
    }, [
        activePhase,
        cooldownAllPlayed,
        isToday,
        mainAllPlayed,
        nextCooldownCard,
        nextMainCard,
        nextWarmupCard,
        onFinishSign,
        openCooldownPlayer,
        openMainPlayer,
        openWarmupPlayer,
        warmupAllPlayed,
    ]);

    const bottomAction = useMemo(() => {
        // 非今天或家人只读不展示底部操作按钮
        if (forceReadOnly || !isToday) return null;

        const signAction = {
            label: getExerciseSignButtonLabel(signInfo),
            showIcon: true,
            icon: SIGN_CHECK_ICON,
            disabled: signing || Boolean(signInfo?.signedToday),
            dimmed: !canFinishSign && !signInfo?.signedToday,
        };

        if (activePhase === 'warmup') {
            if (!warmupAllPlayed) {
                return {
                    label: '开始热身',
                    showIcon: true,
                    icon: PHASE_NEXT_ICON,
                    disabled: false,
                    dimmed: false,
                };
            }
            if (!mainAllPlayed) {
                return {
                    label: '开始主训练',
                    showIcon: true,
                    icon: PHASE_NEXT_ICON,
                    disabled: false,
                    dimmed: false,
                };
            }
            if (!cooldownAllPlayed) {
                return {
                    label: '开始冷身',
                    showIcon: true,
                    icon: PHASE_NEXT_ICON,
                    disabled: false,
                    dimmed: false,
                };
            }
            return signAction;
        }

        if (activePhase === 'main') {
            if (!mainAllPlayed) {
                return {
                    label: '开始主训练',
                    showIcon: true,
                    icon: PHASE_NEXT_ICON,
                    disabled: false,
                    dimmed: false,
                };
            }
            if (!cooldownAllPlayed) {
                return {
                    label: '开始冷身',
                    showIcon: true,
                    icon: PHASE_NEXT_ICON,
                    disabled: false,
                    dimmed: false,
                };
            }
            return signAction;
        }

        // cooldown
        if (!cooldownAllPlayed) {
            return {
                label: '开始冷身',
                showIcon: true,
                icon: PHASE_NEXT_ICON,
                disabled: false,
                dimmed: false,
            };
        }
        return signAction;
    }, [
        activePhase,
        canFinishSign,
        cooldownAllPlayed,
        forceReadOnly,
        isToday,
        mainAllPlayed,
        signInfo,
        signing,
        warmupAllPlayed,
    ]);

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
                        key={`warmup-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}-${patientUserId ?? 'self'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={readOnly}
                        disablePlayer={disablePlayer}
                        dateMode={dateMode}
                        patientUserId={patientUserId}
                    />
                ) : null}
                {activePhase === 'main' ? (
                    <MainTrainingPhase
                        key={`main-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}-${patientUserId ?? 'self'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={readOnly}
                        disablePlayer={disablePlayer}
                        dateMode={dateMode}
                        patientUserId={patientUserId}
                    />
                ) : null}
                {activePhase === 'cooldown' ? (
                    <CooldownPhase
                        key={`cooldown-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}-${patientUserId ?? 'self'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={readOnly}
                        disablePlayer={disablePlayer}
                        dateMode={dateMode}
                        patientUserId={patientUserId}
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
