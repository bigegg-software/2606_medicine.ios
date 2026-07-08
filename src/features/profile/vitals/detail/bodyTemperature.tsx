import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import BodyTemperatureDetailChart, {
    type BodyTemperatureChartRange,
    type BodyTemperatureRangePoint,
} from './components/BodyTemperatureDetailChart';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getMeasureDataDetailByDate,
    getMeasureDataStatisByDateRange,
    type MeasureDataItem,
    type MeasureDataStatisDayGroup,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getDateRange } from '../vitalsHelpers';
import {
    buildBodyTemperatureChartFromStatisGroups,
    buildBodyTemperatureDetailTodaySeries,
    calcBodyTemperatureDetailStats,
    formatBodyTemperatureDetailPointDisplay,
    type BodyTemperatureDetailPoint,
} from './helpers/bodyTemperature';
import {
    mapDetailChartRangeToVitalsRange,
    normalizeStatisRangeData,
} from './helpers/shared';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMPTY_STATS = {
    statusText: '--',
    rangeText: '--',
    recordCount: null as number | null,
    abnormalDays: null as number | null,
    abnormalCount: null as number | null,
};

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function resetHeaderDisplay(range: BodyTemperatureChartRange) {
    return formatBodyTemperatureDetailPointDisplay(range);
}

export default function VitalsPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<BodyTemperatureChartRange>('today');
    const [chartData, setChartData] = useState<BodyTemperatureRangePoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('当前：今天');
    const [stats, setStats] = useState(EMPTY_STATS);

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '体温' });
    }, [navigation]);

    const handleChartPointChange = useCallback((point: BodyTemperatureRangePoint | undefined) => {
        const display = formatBodyTemperatureDetailPointDisplay(
            selectedType,
            point as BodyTemperatureDetailPoint | undefined,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [selectedType]);

    const loadMeasureData = useCallback(async (range: BodyTemperatureChartRange) => {
        try {
            if (range === 'today') {
                const res = (await getMeasureDataDetailByDate({
                    customerLocalDate: moment().format('YYYY-MM-DD'),
                    type: '体温',
                })) as unknown as { code?: number; data?: MeasureDataItem[] };

                if (!isResourceApiOk(res)) {
                    setChartData([]);
                    const emptyDisplay = resetHeaderDisplay(range);
                    setDisplayValue(emptyDisplay.value);
                    setDisplayStatus(formatStatusText(emptyDisplay.status));
                    setDisplayStatusColor(emptyDisplay.statusColor);
                    setCurrentLabel(emptyDisplay.currentLabel);
                    setStats(EMPTY_STATS);
                    return;
                }

                const items = apiResourceData<MeasureDataItem[]>(res) ?? [];
                setChartData(buildBodyTemperatureDetailTodaySeries(items));
                const periodStats = calcBodyTemperatureDetailStats(items, range);
                setStats(periodStats ? {
                    statusText: periodStats.statusText,
                    rangeText: periodStats.rangeText,
                    recordCount: periodStats.recordCount,
                    abnormalDays: periodStats.abnormalDays,
                    abnormalCount: periodStats.abnormalCount,
                } : EMPTY_STATS);
                return;
            }

            const { startDate, endDate } = getDateRange(mapDetailChartRangeToVitalsRange(range));
            const res = (await getMeasureDataStatisByDateRange({
                startDate,
                endDate,
                type: '体温',
            })) as unknown as { code?: number; data?: MeasureDataStatisDayGroup[] };

            if (!isResourceApiOk(res)) {
                setChartData([]);
                const emptyDisplay = resetHeaderDisplay(range);
                setDisplayValue(emptyDisplay.value);
                setDisplayStatus(formatStatusText(emptyDisplay.status));
                setDisplayStatusColor(emptyDisplay.statusColor);
                setCurrentLabel(emptyDisplay.currentLabel);
                setStats(EMPTY_STATS);
                return;
            }

            const groups = normalizeStatisRangeData(apiResourceData<unknown>(res));
            setChartData(buildBodyTemperatureChartFromStatisGroups(groups, range));
            const periodStats = calcBodyTemperatureDetailStats([], range, groups);
            setStats(periodStats ? {
                statusText: periodStats.statusText,
                rangeText: periodStats.rangeText,
                recordCount: periodStats.recordCount,
                abnormalDays: periodStats.abnormalDays,
                abnormalCount: periodStats.abnormalCount,
            } : EMPTY_STATS);
        } catch {
            setChartData([]);
            const emptyDisplay = resetHeaderDisplay(range);
            setDisplayValue(emptyDisplay.value);
            setDisplayStatus(formatStatusText(emptyDisplay.status));
            setDisplayStatusColor(emptyDisplay.statusColor);
            setCurrentLabel(emptyDisplay.currentLabel);
            setStats(EMPTY_STATS);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadMeasureData(selectedType);
        }, [loadMeasureData, selectedType]),
    );

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <View style={styles.pageContent}>
                <LinearGradient
                    pointerEvents="none"
                    colors={['#FFFFFF', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.typeListFade}
                />
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
                >
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={setSelectedType} />

                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>
                                {selectedType === 'today' ? '体温(℃)' : '平均体温(℃)'}
                            </Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>正常范围：36.0-37.0</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <BodyTemperatureDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                        />
                    </View>

                    <Flex style={[styles.colRow, { marginTop: 30 }]}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>体温状态</Text>
                            <Text style={styles.rValue}>{stats.statusText}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>体温范围（℃）</Text>
                            <Text style={styles.rValue}>{stats.rangeText}</Text>
                        </View>
                    </Flex>
                    <Flex style={[styles.colRow, { marginTop: 10 }]}>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>记录次数（次）</Text>
                            <Text style={styles.rValue}>{stats.recordCount ?? '--'}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>异常天数（天）</Text>
                            <Text style={styles.eValue}>{stats.abnormalDays ?? '--'}</Text>
                        </View>
                        <View style={styles.colBox}>
                            <Text style={styles.rowTitle}>异常次数（次）</Text>
                            <Text style={styles.eValue}>{stats.abnormalCount ?? '--'}</Text>
                        </View>
                    </Flex>
                </ScrollView>
                <Flex
                    justify="between"
                    style={[
                        styles.bottomBar,
                        { height: 86 + insets.bottom, paddingBottom: insets.bottom },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.bottomBarButtonLeft, { flex: 1 }]}
                        onPress={navigateToAddData}
                    >
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                style={styles.bottomBarButtonImg}
                                source={require('@/assets/images/vitals/add.png')}
                            />
                            <Text style={styles.bottomBarButtonTextLeft}>添加记录</Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </View>
        </PageLayout>
    );
}
