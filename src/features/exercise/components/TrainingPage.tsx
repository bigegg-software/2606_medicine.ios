import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import styles from '@/css/exercise';
import type { InUseExPatientRule } from '@/api/schedule';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '../utils/dietCalendarHelpers';
import {
    EXERCISE_CHECK_IN_DOT_COLOR,
    loadExerciseCheckInMapByDateRange,
    loadExerciseCheckInMapByYear,
    type ExerciseCheckInMap,
} from '../utils/exerciseCheckInHelpers';
import { loadExPatientRuleForDate } from '../utils/exerciseRuleDateHelpers';
import WarmupPhase from './training/WarmupPhase';
import MainTrainingPhase from './training/MainTrainingPhase';
import CooldownPhase from './training/CooldownPhase';

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
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
    const isHistory = moment(selectedDate).isBefore(moment(), 'day');

    const exerciseDayRecordMarker = useMemo(() => ({
        color: EXERCISE_CHECK_IN_DOT_COLOR,
        title: '运动打卡记录：',
        label: '已打卡',
        loadByYear: loadExerciseCheckInMapByYear,
    }), []);

    const loadDayRule = useCallback(async (date: string, inUseRule: InUseExPatientRule | null) => {
        const rule = await loadExPatientRuleForDate(date, inUseRule);
        setDayRule(rule);
    }, []);

    const loadWeekCheckIn = useCallback(async (date: string) => {
        const start = moment(date).startOf('isoWeek').format('YYYY-MM-DD');
        const end = moment(date).endOf('isoWeek').format('YYYY-MM-DD');
        const map = await loadExerciseCheckInMapByDateRange(start, end);
        setCheckInMap(prev => ({ ...prev, ...map }));
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadDayRule(selectedDate, exerciseRule);
            void loadWeekCheckIn(selectedDate);
        }, [exerciseRule, loadDayRule, loadWeekCheckIn, selectedDate]),
    );

    const onPressDatePicker = () => {
        setDatePickerVisible(true);
    };

    const onFinishTraining = useCallback(() => {
        // TODO: 结束训练·保存数据
    }, []);

    const onPressBottomAction = useCallback(() => {
        if (activePhase === 'warmup') {
            setActivePhase('main');
            return;
        }
        if (activePhase === 'main') {
            setActivePhase('cooldown');
            return;
        }
        if (isHistory) return;
        onFinishTraining();
    }, [activePhase, isHistory, onFinishTraining]);

    const bottomAction = isHistory
        ? activePhase === 'warmup'
            ? { label: '查看主训练', showIcon: true }
            : activePhase === 'main'
                ? { label: '查看冷身', showIcon: true }
                : null
        : activePhase === 'warmup'
            ? { label: '进入主训练', showIcon: true }
            : activePhase === 'main'
                ? { label: '进入冷身', showIcon: true }
                : { label: '结束训练·保存数据', showIcon: false };

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
                        <Text style={styles.trainingStatValue}>--</Text>
                        <Text style={styles.trainingStatLabel}>分钟</Text>
                    </View>
                    <View style={styles.trainingStatCard}>
                        <Image
                            style={styles.trainingStatIcon}
                            source={require('@/assets/images/exercise/icon_qk.png')}
                        />
                        <Text style={styles.trainingStatValue}>--</Text>
                        <Text style={styles.trainingStatLabel}>千卡</Text>
                    </View>
                    <View style={styles.trainingStatCard}>
                        <Image
                            style={styles.trainingStatIcon}
                            source={require('@/assets/images/exercise/icon_wcd.png')}
                        />
                        <Text style={styles.trainingStatValue}>--</Text>
                        <Text style={styles.trainingStatLabel}>完成度</Text>
                    </View>
                </View>
                <View style={styles.trainingProgressTrack}>
                    <View style={[styles.trainingProgressFill, { width: '0%' }]} />
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
                        readOnly={isHistory}
                    />
                ) : null}
                {activePhase === 'main' ? (
                    <MainTrainingPhase
                        key={`main-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={isHistory}
                    />
                ) : null}
                {activePhase === 'cooldown' ? (
                    <CooldownPhase
                        key={`cooldown-${selectedDate}-${dayRule?.exPatientRuleId ?? 'none'}`}
                        dayRule={dayRule}
                        selectedDate={selectedDate}
                        readOnly={isHistory}
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
                        style={styles.bottomBarButtonLeft}
                        activeOpacity={0.7}
                        onPress={onPressBottomAction}>
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            {bottomAction.showIcon ? (
                                <Image
                                    style={styles.bottomBarButtonIcon}
                                    source={require('@/assets/images/exercise/icon_next.png')}
                                />
                            ) : null}
                            <Text style={styles.bottomBarButtonTextLeft}>{bottomAction.label}</Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            ) : null}
        </View>
    );
}
