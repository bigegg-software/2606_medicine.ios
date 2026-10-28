import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import moment from 'moment';
import styles from '@/css/exercise';
import type { RootState } from '@/store/store';
import {
    getExUserSignInfo,
    type ExUserSignInfo,
} from '@/api/exUserSignInfo';
import type { InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import {
    buildDietWeekDays,
} from '../utils/dietCalendarHelpers';
import { isCalendarDateInPrescriptionRange } from '@/src/features/nutrition/components/utils/dietCalendarHelpers';
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
import {
    loadExPatientRuleForDate,
    resolveExerciseDayRule,
} from '../utils/exerciseRuleDateHelpers';
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
    formatMainTrainingSummaryText,
    formatTrainingPhaseSubtitle,
    getCooldownColdList,
    getWarmupHotList,
    isCertUnlockActionUnlocked,
    isMainTrainingAllProgressStarted,
    isTrainingPhaseAllPlayed,
    type MainTrainingPlayCard,
    type TrainingPhaseExerciseCard,
} from '../utils/trainingPhaseHelpers';
import { loadCoachTrainingRecordByRuleAndDate } from '../utils/coachTrainingRecordHelpers';
import TodayActionsList, { type TodayActionListItem } from './training/TodayActionsList';

const SIGN_CHECK_ICON = require('@/assets/images/nutrition/wc.png');
const PHASE_NEXT_ICON = require('@/assets/images/exercise/icon_next.png');

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type TrainingPageRef = {
    openDatePicker: () => void;
};

function resolveMainTaskIndex(
    dayRule: InUseExPatientRule | null | undefined,
    exerciseType: string,
) {
    const list = dayRule?.ruleRatioList ?? [];
    const matched = list.findIndex(item => item.exerciseType?.trim() === exerciseType);
    return matched >= 0 ? matched : undefined;
}

type Props = {
    exerciseRule?: InUseExPatientRule | null;
    /** 家人只读：不可训练/打卡 */
    forceReadOnly?: boolean;
    patientUserId?: string;
    /** 历史计划：锁定当前处方，不可进播放页 */
    lockToRule?: boolean;
    /** 与到店 Tab 共用的选中日（由 ExercisePage 托管） */
    selectedDate: string;
    onSelectedDateChange: (date: string) => void;
    /**
     * 认证解锁状态覆盖（家属视角传家人的 getInfo.user.certUnlockActionUnlocked）
     * 不传则用登录人 systemUser
     */
    certUnlockActionUnlocked?: number | null;
};

const TrainingPage = forwardRef<TrainingPageRef, Props>(function TrainingPage({
    exerciseRule = null,
    forceReadOnly = false,
    patientUserId,
    lockToRule = false,
    selectedDate,
    onSelectedDateChange,
    certUnlockActionUnlocked: certUnlockOverride,
}, ref) {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    /** 本人：systemUser；家属视角：用传入的家人状态 */
    const selfCertUnlockRaw = useSelector(
        (s: RootState) => s.user.systemUser?.certUnlockActionUnlocked,
    );
    const certUnlockActionUnlocked = isCertUnlockActionUnlocked(
        patientUserId
            ? (certUnlockOverride ?? 0)
            : selfCertUnlockRaw,
    );
    const showCertUnlockTip = !certUnlockActionUnlocked;
    const [dayRule, setDayRule] = useState<InUseExPatientRule | null>(exerciseRule);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
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
    /** 当日是否已有教练到店训练日志 */
    const [inStoreDone, setInStoreDone] = useState(false);
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
    const prescriptionStartDate = exerciseRule?.startDate?.trim() || dayRule?.startDate?.trim() || '';
    const prescriptionEndDate = exerciseRule?.endDate?.trim() || dayRule?.endDate?.trim() || '';
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
    const mainTrainingSummaryText = useMemo(
        () => formatMainTrainingSummaryText([
            ...warmupCards,
            ...mainPlayCards,
            ...cooldownCards,
        ]),
        [cooldownCards, mainPlayCards, warmupCards],
    );
    /** 居家训练重点（接口 homeTrainingFocus） */
    const homeTrainingFocusText = useMemo(
        () =>
            dayRule?.homeTrainingFocus?.trim()
            || exerciseRule?.homeTrainingFocus?.trim()
            || '',
        [dayRule?.homeTrainingFocus, exerciseRule?.homeTrainingFocus],
    );

    const exerciseDayRecordMarker = useMemo(() => ({
        color: EXERCISE_CHECK_IN_DOT_COLOR,
        loadByYear: (year: number) =>
            loadExerciseCheckInMapByYear(year, patientUserId, exerciseRule?.exPatientRuleId),
    }), [exerciseRule?.exPatientRuleId, patientUserId]);

    /** 历史处方 getInfo 返回后同步 dayRule（选中日由父级托管） */
    useEffect(() => {
        if (!lockToRule || !exerciseRule) return;
        setDayRule(exerciseRule);
    }, [lockToRule, exerciseRule]);

    const loadDayRule = useCallback(async (date: string, inUseRule: InUseExPatientRule | null) => {
        const rule = await loadExPatientRuleForDate(date, inUseRule, {
            ...patientOpts,
            exPatientRuleId: inUseRule?.exPatientRuleId ?? exerciseRule?.exPatientRuleId,
        });
        // 快照无周课表时回退进行中处方，避免休息日 isRest 丢失
        const next = resolveExerciseDayRule(rule, inUseRule);
        setDayRule(next);
        return next;
    }, [exerciseRule?.exPatientRuleId, patientOpts]);

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
            const result = await buildMainTrainingModules(rule, date, patientUserId, {
                certUnlockActionUnlocked: patientUserId
                    ? (certUnlockOverride ?? 0)
                    : selfCertUnlockRaw,
            });
            if (result.isRest || result.isPostponedAway) {
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
    }, [certUnlockOverride, patientUserId, selfCertUnlockRaw]);

    const loadWarmupProgress = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        try {
            const { isRest, isPostponedAway, hotList } = getWarmupHotList(rule, date);
            if (isRest || isPostponedAway || hotList.length === 0) {
                setWarmupCards([]);
                return;
            }
            const cards = await buildTrainingPhaseCards(hotList, undefined, {
                defaultThumbKey: 'hot',
                actionType: 'home',
                certUnlockActionUnlocked: patientUserId
                    ? (certUnlockOverride ?? 0)
                    : selfCertUnlockRaw,
            });
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
    }, [certUnlockOverride, patientUserId, selfCertUnlockRaw]);

    const loadCooldownProgress = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        try {
            const { isRest, isPostponedAway, coldList } = getCooldownColdList(rule, date);
            if (isRest || isPostponedAway || coldList.length === 0) {
                setCooldownCards([]);
                return;
            }
            const cards = await buildTrainingPhaseCards(coldList, undefined, {
                defaultThumbKey: 'cold',
                actionType: 'home',
                certUnlockActionUnlocked: patientUserId
                    ? (certUnlockOverride ?? 0)
                    : selfCertUnlockRaw,
            });
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
    }, [certUnlockOverride, patientUserId, selfCertUnlockRaw]);

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

    const loadInStoreDone = useCallback(async (
        date: string,
        rule?: InUseExPatientRule | null,
    ) => {
        const exPatientRuleId = rule?.exPatientRuleId ?? exerciseRule?.exPatientRuleId;
        const record = await loadCoachTrainingRecordByRuleAndDate({
            exPatientRuleId,
            customerLocalDate: date,
            patientUserId,
        });
        setInStoreDone(Boolean(record));
    }, [exerciseRule?.exPatientRuleId, patientUserId]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            void (async () => {
                const rule = await loadDayRule(selectedDate, exerciseRule);
                if (cancelled) return;
                void loadWeekCheckIn(selectedDate);
                void loadDayStat(selectedDate, rule);
                void loadMainProgress(selectedDate, rule);
                void loadWarmupProgress(selectedDate, rule);
                void loadCooldownProgress(selectedDate, rule);
                void loadInStoreDone(selectedDate, rule);
                if (!moment(selectedDate).isBefore(moment(), 'day')) {
                    void loadSignInfo();
                }
            })();
            return () => {
                cancelled = true;
            };
        }, [
            certUnlockActionUnlocked,
            exerciseRule,
            loadDayRule,
            loadDayStat,
            loadMainProgress,
            loadWarmupProgress,
            loadCooldownProgress,
            loadInStoreDone,
            loadSignInfo,
            loadWeekCheckIn,
            patientUserId,
            selectedDate,
        ]),
    );

    const todayActionsEmptyMeta = useMemo(() => {
        const warmup = getWarmupHotList(dayRule, selectedDate);
        const cooldown = getCooldownColdList(dayRule, selectedDate);
        const isRestDay = Boolean(warmup.isRest || cooldown.isRest);
        if (warmup.isPostponedAway || cooldown.isPostponedAway) {
            return {
                isRestOrEmpty: true,
                isRestDay: false,
                emptyText: '今日训练已顺延，暂无训练安排',
            };
        }
        if (isRestDay) {
            return {
                isRestOrEmpty: true,
                isRestDay: true,
                emptyText: '今日为休息日，暂无训练安排',
            };
        }
        return {
            isRestOrEmpty: false,
            isRestDay: false,
            emptyText: '今日暂无训练安排',
        };
    }, [dayRule, selectedDate]);

    // 右侧「戳我打卡」成功后同步底部打卡状态与日历点
    useEffect(() => {
        return subscribeExerciseSignSuccess((next: ExUserSignInfo | null) => {
            setSignInfo(next);
            void loadWeekCheckIn(selectedDate);
            void loadMainProgress(selectedDate, dayRule);
        });
    }, [dayRule, loadMainProgress, loadWeekCheckIn, selectedDate]);

    const onPressDatePicker = useCallback(() => {
        setDatePickerVisible(true);
    }, []);

    useImperativeHandle(ref, () => ({
        openDatePicker: onPressDatePicker,
    }), [onPressDatePicker]);

    const handleSelectDate = useCallback((date: string) => {
        onSelectedDateChange(date);
    }, [onSelectedDateChange]);

    /** 主训练每项有进度（半完成）即可打卡 */
    const canFinishSign = useMemo(
        () => resolveExerciseCanFinishSign({
            signInfo,
            mainAllProgressed,
            mainTotalCount: dayStat.mainTotalCount,
            mainCompleteCount: dayStat.mainCompleteCount,
            preferLocalMainProgress: true,
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
                preferLocalMainProgress: true,
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

    const onPressTodayAction = useCallback((item: TodayActionListItem) => {
        if (item.trainingPhase === 'hot') {
            openWarmupPlayer(item);
            return;
        }
        if (item.trainingPhase === 'cold') {
            openCooldownPlayer(item);
            return;
        }
        openMainPlayer({
            ...item,
            exerciseType: item.exerciseType || 'cardio',
        });
    }, [openCooldownPlayer, openMainPlayer, openWarmupPlayer]);

    const onPressBottomAction = useCallback(() => {
        if (!isToday) return;

        // 按热身 → 主训练 → 冷身顺序找下一个未完成动作
        if (!warmupAllPlayed) {
            if (nextWarmupCard) openWarmupPlayer(nextWarmupCard);
            return;
        }
        if (!mainAllPlayed) {
            if (nextMainCard) openMainPlayer(nextMainCard);
            return;
        }
        if (!cooldownAllPlayed) {
            if (nextCooldownCard) openCooldownPlayer(nextCooldownCard);
            return;
        }
        void onFinishSign();
    }, [
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

        if (!warmupAllPlayed || !mainAllPlayed || !cooldownAllPlayed) {
            return {
                label: '开始跟练',
                showIcon: true,
                icon: PHASE_NEXT_ICON,
                disabled: false,
                dimmed: false,
            };
        }
        return signAction;
    }, [
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
                onSelect={handleSelectDate}
                dayRecordMarker={exerciseDayRecordMarker}
                selectableStartDate={prescriptionStartDate || null}
                selectableEndDate={prescriptionEndDate || null}
            />
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* <Flex justify="between" style={styles.calendarBox}>
                    {weekDays.map(item => {
                        const isActive = item.key === selectedDate;
                        const selectable = isCalendarDateInPrescriptionRange(
                            item.key,
                            prescriptionStartDate,
                            prescriptionEndDate,
                        );
                        const hasCheckIn = selectable && Boolean(checkInMap[item.key]);
                        return (
                            <TouchableOpacity
                                key={item.key}
                                activeOpacity={selectable ? 0.7 : 1}
                                disabled={!selectable}
                                style={[
                                    styles.calendarCol,
                                    isActive && selectable && styles.calendarColActive,
                                ]}
                                onPress={() => {
                                    if (!selectable) return;
                                    onSelectedDateChange(item.key);
                                }}>
                                <Text
                                    style={[
                                        isActive && selectable
                                            ? styles.calendarTitleActive
                                            : styles.calendarTitle,
                                        !selectable && styles.calendarTitleDisabled,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                <Text
                                    style={[
                                        isActive && selectable
                                            ? styles.calendarSubtitleActive
                                            : styles.calendarSubtitle,
                                        !selectable && styles.calendarSubtitleDisabled,
                                    ]}
                                >
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
                </View> */}

                <View style={styles.autonomousTrainingBox}>
                    <View style={styles.autonomousTrainingItem}>
                        <Text style={styles.autonomousText}>今天，为身体留一点时间</Text>
                        <Text style={styles.autonomousText2}>选择适合自己的方式，让训练成为生活的一部分</Text>
                    </View>

                    <ImageBackground
                        source={require('@/assets/images/exercise/zzxl.png')}
                        style={styles.autonomousTrainingBackground}
                        imageStyle={styles.autonomousTrainingBackgroundImage}
                    >
                        <Flex align="center" style={styles.autonomousHomeTitleRow}>
                            <Text style={styles.autonomousHomeTitle}>居家自主训练</Text>
                            <View style={styles.autonomousHomeTag}>
                                <Text style={styles.autonomousHomeTagText}>可独立完成</Text>
                            </View>
                        </Flex>
                        {homeTrainingFocusText ? (
                            <Text style={styles.autonomousHomeSubtitle} numberOfLines={1}>
                                {homeTrainingFocusText}
                            </Text>
                        ) : null}
                        <Text style={styles.autonomousHomeSummary}>{mainTrainingSummaryText}</Text>
                        <Text style={styles.autonomousHomeTip}>已为你选择可在家安全完成的训练。</Text>
                        {!forceReadOnly ? (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={!bottomAction || bottomAction.disabled}
                                onPress={onPressBottomAction}
                                style={[
                                    styles.autonomousStartBtnWrap,
                                    (!bottomAction || bottomAction.disabled || bottomAction.dimmed)
                                        ? { opacity: 0.5 }
                                        : undefined,
                                ]}
                            >
                                <LinearGradient
                                    colors={['#9BBD8E', '#6D925E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.autonomousStartBtn}
                                >

                                    <Text style={styles.autonomousStartBtnText}>开始跟练</Text>
                                    <Image
                                        style={styles.autonomousStartBtnIcon}
                                        source={require('@/assets/images/exercise/jt.png')}
                                    />

                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null}
                        <Flex style={styles.autonomousHomeTipRow}>
                            <Image style={styles.autonomousHomeTipIcon} source={require('@/assets/images/exercise/dp.png')} />
                            <Text style={styles.autonomousHomeTipText}>如有明显不适，请暂停训练并联系LM 管家。</Text>
                        </Flex>
                    </ImageBackground>
                </View>

                {isToday && inStoreDone ? (
                    <Flex align="center" style={styles.inStoreDoneTip}>
                        <Image
                            style={styles.inStoreDoneTipIcon}
                            source={require('@/assets/images/exercise/fw.png')}
                        />
                        <Text style={styles.inStoreDoneTipText}>
                            今日训练已到店完成，训练进度已记录
                        </Text>
                    </Flex>
                ) : null}

                <TodayActionsList
                    warmupCards={warmupCards}
                    mainPlayCards={mainPlayCards}
                    cooldownCards={cooldownCards}
                    readOnly={readOnly}
                    disablePlayer={disablePlayer}
                    dateMode={dateMode}
                    isRestOrEmpty={todayActionsEmptyMeta.isRestOrEmpty}
                    emptyText={todayActionsEmptyMeta.emptyText}
                    onPressItem={onPressTodayAction}
                />

                {!todayActionsEmptyMeta.isRestDay ? (
                    <Flex justify="center" align="center" style={[styles.planListFooter, { marginTop: 30 }]}>
                        <Text style={styles.planListFooterText}>到店练习后可解锁待认证动作</Text>
                    </Flex>
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
                                {signing
                                    && isToday
                                    && warmupAllPlayed
                                    && mainAllPlayed
                                    && cooldownAllPlayed
                                    ? '打卡中...'
                                    : bottomAction.label}
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            ) : null}
        </View>
    );
});

export default TrainingPage;
