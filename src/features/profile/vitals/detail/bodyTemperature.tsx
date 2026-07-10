import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    getMeasureDataDetailByDateRange,
    type MeasureDataItem,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { flattenMeasureItems } from '../vitalsHelpers';
import {
    buildBodyTemperatureDetailPeriodSeries,
    buildBodyTemperatureDetailTodaySeries,
    calcBodyTemperatureDetailStats,
    formatBodyTemperatureDetailPointDisplay,
    getBodyTemperatureDetailQueryRange,
    type BodyTemperatureDetailPoint,
} from './helpers/bodyTemperature';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';

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

function applyEmptyBodyTemperatureState(
    range: BodyTemperatureChartRange,
    setters: {
        setChartData: (data: BodyTemperatureRangePoint[]) => void;
        setDisplayValue: (value: string) => void;
        setDisplayStatus: (status: string) => void;
        setDisplayStatusColor: (color: string) => void;
        setCurrentLabel: (label: string) => void;
        setStats: (stats: typeof EMPTY_STATS) => void;
    },
) {
    const emptyDisplay = resetHeaderDisplay(range);
    setters.setChartData([]);
    setters.setDisplayValue(emptyDisplay.value);
    setters.setDisplayStatus(formatStatusText(emptyDisplay.status));
    setters.setDisplayStatusColor(emptyDisplay.statusColor);
    setters.setCurrentLabel(emptyDisplay.currentLabel);
    setters.setStats(EMPTY_STATS);
}

async function loadBodyTemperatureDetailItems(range: BodyTemperatureChartRange) {
    const { startDate, endDate } = getBodyTemperatureDetailQueryRange(range);
    const res = (await getMeasureDataDetailByDateRange({
        startDate,
        endDate,
        type: '体温',
    })) as unknown as { code?: number; data?: MeasureDataItem[] };

    if (!isResourceApiOk(res)) return null;
    return flattenMeasureItems(apiResourceData<MeasureDataItem[]>(res));
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
        const emptySetters = {
            setChartData,
            setDisplayValue,
            setDisplayStatus,
            setDisplayStatusColor,
            setCurrentLabel,
            setStats,
        };

        try {
            const detailItems = await loadBodyTemperatureDetailItems(range);
            if (detailItems == null) {
                applyEmptyBodyTemperatureState(range, emptySetters);
                return;
            }

            setChartData(
                range === 'today'
                    ? buildBodyTemperatureDetailTodaySeries(detailItems)
                    : buildBodyTemperatureDetailPeriodSeries(detailItems, range),
            );

            const periodStats = calcBodyTemperatureDetailStats(detailItems, range);
            setStats(periodStats ? {
                statusText: periodStats.statusText,
                rangeText: periodStats.rangeText,
                recordCount: periodStats.recordCount,
                abnormalDays: periodStats.abnormalDays,
                abnormalCount: periodStats.abnormalCount,
            } : EMPTY_STATS);
        } catch {
            applyEmptyBodyTemperatureState(range, emptySetters);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadMeasureData(selectedType);
        }, [loadMeasureData, selectedType]),
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '体温',
    });

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
                <View style={styles.pageHeader}>
                    <PageHeader selectedType={selectedType} onSelectedTypeChange={setSelectedType} />
                </View>

                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom:  insets.bottom }}
                >
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
                            <Text style={styles.rowTitle}>正常范围：36.0°C – 37.2°C</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        <BodyTemperatureDetailChart
                            range={selectedType}
                            data={chartData}
                            onPointChange={handleChartPointChange}
                        />
                          <Flex justify='center' style={styles.colTopBox}>
                        <Flex>
                            <Flex style={styles.colRightBor}></Flex>
                            <Text style={styles.colRightText}>偏低</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colLBor}></Flex>
                            <Text style={styles.colLText}>正常</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colHBor}></Flex>
                            <Text style={styles.colHText}>偏高</Text>
                        </Flex>
                        <Flex>
                            <Flex style={styles.colHxBor}></Flex>
                            <Text style={styles.colHxText}>高风险</Text>
                        </Flex>
                    </Flex>
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
            {menuModals}
        </PageLayout>
    );
}
