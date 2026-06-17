import React from 'react';
import { Text, View, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/chronicDisease/detail';
import ChronicBloodPressureChart from './ChronicBloodPressureChart';
import ChronicSingleLineChart from './ChronicSingleLineChart';
import type { ChronicDetailData } from './chronicData';
import { CHRONIC_DISEASE_CONTROL_STATUS_LABELS } from './chronicData';

type Props = {
    detail: ChronicDetailData;
};

function getControlStatusStyles(status: ChronicDetailData['controlStatus']) {
    switch (status) {
        case 'attention':
            return {
                box: styles.infoStatusBoxAttention,
                icon: styles.infoStatusIconAttention,
                text: styles.infoStatusTextAttention,
            };
        case 'highRisk':
            return {
                box: styles.infoStatusBoxHighRisk,
                icon: styles.infoStatusIconHighRisk,
                text: styles.infoStatusTextHighRisk,
            };
        default:
            return {
                box: styles.infoStatusBox,
                icon: styles.infoStatusIcon,
                text: styles.infoStatusText,
            };
    }
}

function renderChart(detail: ChronicDetailData) {
    const { config, chartLabels, bloodPressureSeries, singleValueSeries, ldlSeries } = detail;
    switch (config.chartKind) {
        case 'bloodPressure':
            return <ChronicBloodPressureChart data={bloodPressureSeries} labels={chartLabels} />;
        case 'bloodGlucose':
            return (
                <ChronicSingleLineChart
                    data={singleValueSeries}
                    labels={chartLabels}
                    color="#06BDFF"
                    tooltipLabel="血糖"
                />
            );
        case 'bloodLipids':
            return (
                <ChronicSingleLineChart
                    data={ldlSeries}
                    labels={chartLabels}
                    color="#FF8B07"
                    tooltipLabel="LDL-C"
                />
            );
        case 'heartRate':
            return (
                <ChronicSingleLineChart
                    data={singleValueSeries}
                    labels={chartLabels}
                    color="#FF2056"
                    tooltipLabel="心率"
                    valueSuffix="次/分"
                />
            );
        case 'uricAcid':
            return (
                <ChronicSingleLineChart
                    data={singleValueSeries}
                    labels={chartLabels}
                    color="#4F86EE"
                    tooltipLabel="尿酸"
                    valueSuffix="μmol/L"
                />
            );
        case 'bloodOxygen':
            return (
                <ChronicSingleLineChart
                    data={singleValueSeries}
                    labels={chartLabels}
                    color="#00C950"
                    tooltipLabel="血氧"
                    valueSuffix="%"
                />
            );
        default:
            return null;
    }
}

export default function ChronicTrendSection({ detail }: Props) {
    const { config, stats, controlStatus } = detail;
    const statusStyles = getControlStatusStyles(controlStatus);

    return (
        <View style={styles.infoBox}>
            <Flex justify="between" align="center">
                <Flex align="center">
                    <Image tintColor={config.tintColor} style={styles.infoImage} source={config.icon} />
                    <Text style={[styles.rowTitle, { marginTop: 0 }]}>{config.trendTitle}</Text>
                </Flex>
                <Flex style={statusStyles.box}>
                    <View style={statusStyles.icon} />
                    <Text style={statusStyles.text}>
                        {CHRONIC_DISEASE_CONTROL_STATUS_LABELS[controlStatus]}
                    </Text>
                </Flex>
            </Flex>
            {renderChart(detail)}
            <View style={styles.pageLine} />
            <Flex justify="between" style={{ paddingHorizontal: 18 }}>
                {config.statColumns.map(column => (
                    <Flex key={column.key} direction="column" justify="center" align="center">
                        <Text style={styles.detailColTitle}>{column.title}</Text>
                        <Text style={styles.detailColText}>{stats[column.key] ?? '--'}</Text>
                    </Flex>
                ))}
            </Flex>
        </View>
    );
}
