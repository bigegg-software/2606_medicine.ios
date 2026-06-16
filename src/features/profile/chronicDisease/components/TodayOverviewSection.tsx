import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/chronicDisease/detail';
import type { RootStackParamList } from '@/route/router';
import type { TodayOverviewResult } from './chronicData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
    overview: TodayOverviewResult;
};

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
        <>
            <Flex justify="between" style={{ marginTop: 18 }}>
                <Text style={styles.sectionTitle}>今日概览</Text>
                <TouchableOpacity onPress={handleRecord} disabled={!overview.addDataType}>
                    <Text style={styles.more}>记录</Text>
                </TouchableOpacity>
            </Flex>
            <View style={styles.infoBox}>
                {overview.mode === 'empty' ? (
                    <Text style={styles.emptyText}>今天未监测</Text>
                ) : (
                    <>
                        {overview.mode === 'partial' && overview.summary ? (
                            <Text style={styles.summaryText}>{overview.summary}</Text>
                        ) : null}
                        {overview.records.map((row, index) => (
                            <Flex
                                key={row.key}
                                justify="between"
                                style={index > 0 || overview.mode === 'partial' ? styles.colItem : undefined}>
                                <Text style={styles.colTitle}>{row.label}</Text>
                                <Text style={styles.colTitle}>{row.time}</Text>
                                <Text style={styles.colTitle}>{row.value}</Text>
                            </Flex>
                        ))}
                    </>
                )}
            </View>
        </>
    );
}
