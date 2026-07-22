import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import styles from '@/css/exercise';
import { buildDietWeekDays } from '../utils/dietCalendarHelpers';

export default function DietPage() {
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);

    const onPressDatePicker = () => {
        // TODO: 打开日期选择
    };

    const onPressCheckIn = () => {
        // TODO: 完成今日打卡
    };

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
                <View style={styles.calendarContent}>

                </View>
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
                    onPress={onPressCheckIn}>
                    <Flex justify="center" style={{ flex: 1 }}>
                        <Text style={styles.bottomBarButtonTextLeft}>结束训练·保存数据</Text>
                    </Flex>
                </TouchableOpacity>
            </Flex>
        </View>
    );
}
