import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import TopHeaderTip from './components/TopHeaderTip';
import WeightDetailChart, {
    type WeightDetailPoint,
} from './components/WeightDetailChart';
import {
    getMeasureDataAllRecords,
    type MeasureDataAllRecordsResult,
} from '@/api/measureData';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    buildUricAcidDetailSeries,
    buildUricAcidDetailYAxis,
    calcUricAcidCompareToPrevious,
    flattenUricAcidAllRecords,
    formatUricAcidDetailPointDisplay,
    formatUricAcidNormalRangeText,
    getUricAcidChartReferenceLines,
    URIC_ACID_RECENT_PAGE_SIZE,
    type UricAcidDetailPoint,
} from './helpers/uricAcid';
import { useVitalsDetailMoreMenu } from './helpers/useVitalsDetailMoreMenu';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CompareInfo = {
    text: string;
    color: string;
    backgroundColor: string;
    icon: 'up' | 'down' | null;
};

function formatStatusText(status?: string) {
    return status?.replace(/^・/, '') || '--';
}

function applyEmptyDisplay(
    gender: string | null | undefined,
    setters: {
        setChartData: (data: UricAcidDetailPoint[]) => void;
        setCompareInfo: (info: CompareInfo | null) => void;
        setDisplayValue: (value: string) => void;
        setDisplayStatus: (status: string) => void;
        setDisplayStatusColor: (color: string) => void;
        setCurrentLabel: (label: string) => void;
    },
) {
    const emptyDisplay = formatUricAcidDetailPointDisplay(undefined, gender);
    setters.setChartData([]);
    setters.setCompareInfo(null);
    setters.setDisplayValue(emptyDisplay.value);
    setters.setDisplayStatus(formatStatusText(emptyDisplay.status));
    setters.setDisplayStatusColor(emptyDisplay.statusColor);
    setters.setCurrentLabel(emptyDisplay.currentLabel);
}

export default function UricAcidPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const userGender = useSelector((state: RootState) => state.user.info?.gender);
    const [chartData, setChartData] = useState<UricAcidDetailPoint[]>([]);
    const [displayValue, setDisplayValue] = useState('--');
    const [displayStatus, setDisplayStatus] = useState('--');
    const [displayStatusColor, setDisplayStatusColor] = useState('#999999');
    const [currentLabel, setCurrentLabel] = useState('--');
    const [compareInfo, setCompareInfo] = useState<CompareInfo | null>(null);

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '尿酸' });
    }, [navigation]);

    const handleChartPointChange = useCallback((point: WeightDetailPoint | undefined) => {
        const display = formatUricAcidDetailPointDisplay(
            point as UricAcidDetailPoint | undefined,
            userGender,
        );
        setDisplayValue(display.value);
        setDisplayStatus(formatStatusText(display.status));
        setDisplayStatusColor(display.statusColor);
        setCurrentLabel(display.currentLabel);
    }, [userGender]);

    const loadMeasureData = useCallback(async () => {
        const setters = {
            setChartData,
            setCompareInfo,
            setDisplayValue,
            setDisplayStatus,
            setDisplayStatusColor,
            setCurrentLabel,
        };

        try {
            const res = (await getMeasureDataAllRecords({
                type: '尿酸',
                pageSize: URIC_ACID_RECENT_PAGE_SIZE,
                pageNum: 1,
            })) as unknown as MeasureDataAllRecordsResult;

            if (!isResourceApiOk(res)) {
                applyEmptyDisplay(userGender, setters);
                return;
            }

            const items = flattenUricAcidAllRecords(res.rows);
            setChartData(buildUricAcidDetailSeries(items, userGender));
            setCompareInfo(calcUricAcidCompareToPrevious(items));
        } catch {
            applyEmptyDisplay(userGender, setters);
        }
    }, [userGender]);

    useFocusEffect(
        useCallback(() => {
            void loadMeasureData();
        }, [loadMeasureData]),
    );

    const normalRangeText = formatUricAcidNormalRangeText(userGender);
    const chartCategoryLabels = useMemo(
        () => chartData.map(point => point.hour),
        [chartData],
    );
    const uricAcidYAxisBuilder = useCallback(
        (points: WeightDetailPoint[]) =>
            buildUricAcidDetailYAxis(points as UricAcidDetailPoint[], userGender),
        [userGender],
    );
    const chartReferenceLines = useMemo(
        () => getUricAcidChartReferenceLines(userGender),
        [userGender],
    );

    const { menuModals } = useVitalsDetailMoreMenu({
        allRecordsType: '尿酸',
    });

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            {!userGender ? <TopHeaderTip /> : null}
            <View style={styles.pageContent}>
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
                >
                    <View style={styles.rowBox}>
                        <Flex justify="between">
                            <Text style={styles.rowTitle}>尿酸(μmol/L)</Text>
                            <Flex style={[styles.statusBox, { borderColor: displayStatusColor }]}>
                                <Text style={[styles.statusText, { color: displayStatusColor }]}>
                                    {displayStatus}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>{displayValue}</Text>
                        <Flex justify="between">
                            <Text style={styles.rowTitle}>正常范围：{normalRangeText}</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>{currentLabel}</Text>
                            </Flex>
                        </Flex>

                        {compareInfo ? (
                            <Flex
                                justify="center"
                                style={[styles.upBox, { backgroundColor: compareInfo.backgroundColor }]}
                            >
                                {compareInfo.icon === 'up' ? (
                                    <Image
                                        style={styles.upIcon}
                                        source={require('@/assets/images/vitals/icon_up.png')}
                                    />
                                ) : null}
                                {compareInfo.icon === 'down' ? (
                                    <Image
                                        style={styles.upIcon}
                                        source={require('@/assets/images/vitals/icon_xj.png')}
                                    />
                                ) : null}
                                <Text style={[styles.upText, { color: compareInfo.color }]}>{compareInfo.text}</Text>
                            </Flex>
                        ) : null}

                        <WeightDetailChart
                            range="week"
                            data={chartData}
                            categoryLabels={chartCategoryLabels}
                            onPointChange={handleChartPointChange}
                            yAxisBuilder={uricAcidYAxisBuilder}
                            safetyLineY={chartReferenceLines.safetyLineY}
                            safetyLineLabel={chartReferenceLines.safetyLineLabel}
                        />
                        <Text style={styles.btmText}>最近10次测量</Text>
                    </View>
                </ScrollView>
                <Flex
                    justify="between"
                    style={[
                        styles.bottomBar,
                        { height: 100, paddingBottom: insets.bottom },
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
