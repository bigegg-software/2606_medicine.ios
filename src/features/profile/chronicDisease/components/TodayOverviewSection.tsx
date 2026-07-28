import React from 'react';
import { Text, Image, View, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/chronicDisease/detail';
import type { RootStackParamList } from '@/route/router';
import type { TodayOverviewRecord, TodayOverviewResult } from './chronicData';
import { formatTodayOverviewLeftText } from '@/src/features/profile/chronicDisease/components/utils/todayOverviewHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
    overview: TodayOverviewResult;
};

function OverviewRow({ row }: { row: TodayOverviewRecord }) {
    return (
        <Flex justify="between" align="center" style={styles.overviewRow}>
            <Text style={styles.overviewLeftText} numberOfLines={1}>
                {formatTodayOverviewLeftText(row.measurementStatus, row.time)}
            </Text>
            <Flex align="center" style={styles.overviewRight}>
                <Text style={styles.overviewValue}>{row.value}</Text>
                {row.status ? (
                    <Flex style={[styles.overviewStatusBox, { borderColor: row.statusColor }]}>
                        <Text style={[styles.overviewStatusText, { color: row.statusColor }]}>
                            {row.status}
                        </Text>
                    </Flex>
                ) : null}
            </Flex>
        </Flex>
    );
}

export default function TodayOverviewSection({ overview }: Props) {
    const navigation = useNavigation<Nav>();

    const handleRecord = () => {
        if (!overview.addDataType) return;
        if (overview.addDataType === '血氧' || overview.addDataType === '心率') {
            navigation.navigate('AllDataPage', { type: overview.addDataType });
            return;
        }
        navigation.navigate('AddDataPage', { type: overview.addDataType });
    };

    return (
        <View style={styles.overviewSection}>
            <Flex justify="between" align="center">
                <Text style={styles.overviewTitle}>今日概览</Text>
                <TouchableOpacity onPress={handleRecord} disabled={!overview.addDataType}>
                    <Image style={styles.more} source={require('@/assets/images/user/icon_jia.png')} />
                </TouchableOpacity>
            </Flex>

            {overview.mode === 'empty' ? (
                <View style={styles.overviewRow}>
                    <Text style={styles.emptyText}>今天未监测</Text>
                </View>
            ) : (
                overview.records.map(row => <OverviewRow key={row.key} row={row} />)
            )}
        </View>
    );
}
