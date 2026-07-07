import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/vitals/bloodPage';
import { Flex } from '@ant-design/react-native';
import PageHeader from './components/pageHeader';
import VitalsProgressRing from './components/VitalsProgressRing';
import BloodOxygenDetailChart, { type BloodOxygenChartRange } from './components/BloodOxygenDetailChart';
import { LinearGradient } from 'expo-linear-gradient';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VitalsPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<BloodOxygenChartRange>('today');

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '血糖' });
    }, [navigation]);

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
                            <Text style={styles.rowTitle}>%</Text>
                            <Flex style={styles.statusBox}>
                                <Text style={styles.statusText}>良好</Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowLeftValue}>95-100</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>正常范围: 95-100</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>当前：今天 14:30</Text>
                            </Flex>
                        </Flex>

                        <BloodOxygenDetailChart range={selectedType} />
                    </View>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
