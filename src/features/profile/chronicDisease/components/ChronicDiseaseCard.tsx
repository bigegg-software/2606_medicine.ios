import React from 'react';
import { View, Text, Image, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import type { ChronicDiseaseRecord } from '@/api/chronicDisease';
import styles from '@/css/chronicDisease/index';
import {
    CHRONIC_DISEASE_CONTROL_STATUS_LABELS,
    resolveDiseaseTypeLabel,
    type ChronicDiseaseControlStatus,
    type ChronicDiseaseDailyIndicators,
    type ChronicDiseaseMealRecordStatus,
    type ChronicDiseaseVitalsTodayStatus,
} from './chronicData';

const CHRONIC_INDICATOR_COLOR = {
    muted: '#999999',
    vitalsActive: '#6D925E',
    medicationActive: '#EE9C44',
    mealActive: '#6D925E',
} as const;

function getVitalsTodayIndicator(status: ChronicDiseaseVitalsTodayStatus) {
    return status === 'measured'
        ? { label: '今日已测', color: CHRONIC_INDICATOR_COLOR.vitalsActive }
        : { label: '今日未测', color: CHRONIC_INDICATOR_COLOR.muted };
}

function getMedicationPendingIndicator(pendingCount: number) {
    return pendingCount > 0
        ? { label: `${pendingCount}项待服`, color: CHRONIC_INDICATOR_COLOR.medicationActive }
        : { label: '无待服', color: CHRONIC_INDICATOR_COLOR.muted };
}

function getMealRecordIndicator(status: ChronicDiseaseMealRecordStatus) {
    switch (status) {
        case 'achieved':
            return { label: '已达标', color: CHRONIC_INDICATOR_COLOR.mealActive };
        case 'inProgress':
            return { label: '进行中', color: CHRONIC_INDICATOR_COLOR.mealActive };
        default:
            return { label: '未记录', color: CHRONIC_INDICATOR_COLOR.muted };
    }
}

function getControlStatusStyles(status: ChronicDiseaseControlStatus) {
    switch (status) {
        case 'attention':
            return {
                box: styles.infoStatusBoxAttention,
                text: styles.infoStatusTextAttention,
            };
        case 'highRisk':
            return {
                box: styles.infoStatusBoxHighRisk,
                text: styles.infoStatusTextHighRisk,
            };
        default:
            return {
                box: styles.infoStatusBox,
                text: styles.infoStatusText,
            };
    }
}

function IndicatorItem({
    icon,
    label,
    color,
}: {
    icon: ImageSourcePropType;
    label: string;
    color: string;
}) {
    return (
        <Flex>
            <Image style={[styles.infoContentImage, { tintColor: color }]} source={icon} />
            <Text style={styles.infoContentText}>{label}</Text>
        </Flex>
    );
}

type ChronicDiseaseCardProps = {
    record: ChronicDiseaseRecord;
    diseaseTypeLabels: Record<string, string>;
    dailyIndicators: ChronicDiseaseDailyIndicators;
    onPress: () => void;
};

export default function ChronicDiseaseCard({
    record,
    diseaseTypeLabels,
    dailyIndicators,
    onPress,
}: ChronicDiseaseCardProps) {
    const diseaseLabel = resolveDiseaseTypeLabel(record.diseaseType, diseaseTypeLabels);
    const statusStyles = getControlStatusStyles(dailyIndicators.controlStatus);
    const vitalsIndicator = getVitalsTodayIndicator(dailyIndicators.vitalsToday);
    const medicationIndicator = getMedicationPendingIndicator(dailyIndicators.pendingMedicationCount);
    const mealIndicator = getMealRecordIndicator(dailyIndicators.mealRecorded);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <View style={styles.rowBox}>
                <Flex justify="between">
                    <Text style={styles.infoTitle}>{diseaseLabel}</Text>
                    <Flex style={statusStyles.box}>
                        <Text style={statusStyles.text}>
                            {CHRONIC_DISEASE_CONTROL_STATUS_LABELS[dailyIndicators.controlStatus]}
                        </Text>
                    </Flex>
                </Flex>
                <Flex style={styles.uploadTimeBox}>
                    <Image style={styles.imgSize} source={require('@/assets/images/questionnaire/time.png')} />
                    <Text style={styles.uploadTime}>{dailyIndicators.lastVitalsText}</Text>
                </Flex>
                <Flex justify="between" style={styles.infoContent}>
                    <IndicatorItem
                        icon={require('@/assets/images/chronic/mb.png')}
                        label={vitalsIndicator.label}
                        color={vitalsIndicator.color}
                    />
                    <IndicatorItem
                        icon={require('@/assets/images/chronic/yh.png')}
                        label={medicationIndicator.label}
                        color={medicationIndicator.color}
                    />
                    <IndicatorItem
                        icon={require('@/assets/images/chronic/ys.png')}
                        label={mealIndicator.label}
                        color={mealIndicator.color}
                    />
                </Flex>
            </View>
        </TouchableOpacity>
    );
}
