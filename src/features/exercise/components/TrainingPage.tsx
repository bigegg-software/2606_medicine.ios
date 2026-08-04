import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import styles from '@/css/exercise';
import { buildDietWeekDays } from '../utils/dietCalendarHelpers';
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

export default function TrainingPage() {
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
    const [activePhase, setActivePhase] = useState<TrainingPhaseKey>('warmup');
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);

    const onPressDatePicker = () => {
        // TODO: 打开日期选择
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
        onFinishTraining();
    }, [activePhase, onFinishTraining]);

    const bottomAction = useMemo(() => {
        if (activePhase === 'warmup') {
            return { label: '进入主训练', showIcon: true };
        }
        if (activePhase === 'main') {
            return { label: '进入冷身', showIcon: true };
        }
        return { label: '结束训练·保存数据', showIcon: false };
    }, [activePhase]);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
                <Flex justify="between" style={styles.calendarBox}>
                    {weekDays.map(item => {
                        const isActive = item.key === selectedDate;
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
                    <View style={[styles.trainingProgressFill, { width: '20%' }]} />
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

                {activePhase === 'warmup' ? <WarmupPhase /> : null}
                {activePhase === 'main' ? <MainTrainingPhase /> : null}
                {activePhase === 'cooldown' ? <CooldownPhase /> : null}
            </ScrollView>

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
        </View>
    );
}
