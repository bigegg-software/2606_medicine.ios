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
    const [selectedLipidType, setSelectedLipidType] = useState<'TC' | 'TG' | 'LDL-C' | 'HDL-C'>('TC');

    const navigateToAddData = useCallback(() => {
        navigation.navigate('AddDataPage', { type: '血糖' });
    }, [navigation]);

    const lipidTabs: Array<{ label: string; value: 'TC' | 'TG' | 'LDL-C' | 'HDL-C' }> = [
        { label: 'TC', value: 'TC' },
        { label: 'TG', value: 'TG' },
        { label: 'LDL-C', value: 'LDL-C' },
        { label: 'HDL-C', value: 'HDL-C' },
    ];

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
                            <Text style={[styles.rowLeftValue, { fontSize: 16 }]}>血脂控制目标</Text>

                            <Flex style={styles.statusBox}>
                                <Text style={styles.statusText}>待改善</Text>
                            </Flex>
                        </Flex>
                        <Flex style={styles.topTextBox}>
                            <View style={styles.leftIcon}></View>
                            <Text style={styles.typeTitle}>TC</Text>
                            <Text style={styles.rowTitle1}>总胆固醇 (mmol/L)</Text>
                            <Image style={styles.rowImage} tintColor={"#EE9C44"} source={require("@/assets/images/vitals/icon_xj.png")} />
                            <Text style={styles.rowValue}>0.5</Text>
                        </Flex>
                        <Flex style={styles.topTextBox}>
                            <View style={styles.leftIcon}></View>
                            <Text style={styles.typeTitle}>TC</Text>
                            <Text style={styles.rowTitle1}>总胆固醇 (mmol/L)</Text>
                            <Image style={styles.rowImage} tintColor={"#EE9C44"} source={require("@/assets/images/vitals/icon_xj.png")} />
                            <Text style={styles.rowValue}>0.5</Text>
                        </Flex>
                        <Flex style={styles.topTextBox}>
                            <View style={styles.leftIcon}></View>
                            <Text style={styles.typeTitle}>TC</Text>
                            <Text style={styles.rowTitle1}>总胆固醇 (mmol/L)</Text>
                            <Image style={styles.rowImage} tintColor={"#EE9C44"} source={require("@/assets/images/vitals/icon_xj.png")} />
                            <Text style={styles.rowValue}>0.5</Text>
                        </Flex>
                    </View>
                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={[styles.rowLeftValue, { fontSize: 16 }]}>指标对比</Text>
                            <Flex style={styles.statusBox}>
                                <Text style={styles.statusText}>待改善</Text>
                            </Flex>
                        </Flex>
                        <Flex style={styles.dbBox}>
                            <Flex style={styles.dbBoxItem}>
                                <Text style={styles.dbBoxItemText}>初始</Text>
                                <TouchableOpacity>
                                    <Text style={styles.dbBoxItemValue}>2026/03/27</Text>
                                </TouchableOpacity>
                            </Flex>
                            <Image style={styles.dbImage} source={require('@/assets/images/vitals/db.png')} />
                            <Flex style={styles.dbBoxItem}>
                                <Text style={styles.dbBoxItemText}>最近</Text>
                                <TouchableOpacity>
                                    <Text style={styles.dbBoxItemValue}>2026/06/27</Text>
                                </TouchableOpacity>
                            </Flex>
                        </Flex>
                        <Flex justify='between' style={styles.dbCol}>
                            <View>
                                <Text style={styles.dbColTitle}>TC</Text>
                                <Text style={styles.dbColTitle1}>总胆固醇</Text>
                            </View>
                            <Flex>
                                <Text style={styles.dbColValue}>6.3</Text>
                                <Image style={styles.dbColImg} source={require('@/assets/images/vitals/you.png')}></Image>
                                <Text style={styles.dbColValue1}>6.9</Text>
                            </Flex>
                            <Flex>
                                <Text style={styles.dbRightValue}>-0.6</Text>
                                <Image style={styles.dbColRightImg} source={require('@/assets/images/vitals/xia.png')}></Image>
                                <Text style={styles.dbRightValue1}>改善</Text>
                            </Flex>
                        </Flex>
                        <Flex justify='between' style={styles.dbCol}>
                            <View>
                                <Text style={styles.dbColTitle}>TC</Text>
                                <Text style={styles.dbColTitle1}>总胆固醇</Text>
                            </View>
                            <Flex>
                                <Text style={styles.dbColValue}>6.3</Text>
                                <Image style={styles.dbColImg} source={require('@/assets/images/vitals/you.png')}></Image>
                                <Text style={styles.dbColValue1}>6.9</Text>
                            </Flex>
                            <Flex>
                                <Text style={styles.dbRightValue_1}>-0.6</Text>
                                <Image style={styles.dbColRightImg} source={require('@/assets/images/vitals/shang.png')}></Image>
                                <Text style={styles.dbRightValue1_1}>加重</Text>
                            </Flex>
                        </Flex>
                    </View>


                    <View style={[styles.rowBox, { marginTop: 10 }]}>
                        <Flex justify='between'>
                            <Text style={[styles.rowLeftValue, { fontSize: 16 }]}>总胆固醇</Text>

                            <Flex style={styles.statusBox}>
                                <Text style={styles.statusText}>良好</Text>
                            </Flex>
                        </Flex>
                        <Text style={styles.rowTitle}>mmol/L</Text>
                        <Text style={styles.rowLeftValue}>5.7</Text>
                        <Flex justify='between'>
                            <Text style={styles.rowTitle}>{'正常范围：< 5.2 mmol/L'}</Text>
                            <Flex style={styles.dayBox}>
                                <Text style={styles.dayText}>当前：今天 14:30</Text>
                            </Flex>
                        </Flex>
                        <Flex style={styles.tabBox}>
                            {lipidTabs.map((item) => {
                                const isActive = selectedLipidType === item.value;
                                return (
                                    <TouchableOpacity
                                        key={item.value}
                                        activeOpacity={0.85}
                                        onPress={() => setSelectedLipidType(item.value)}
                                        style={[styles.tabItem, isActive && styles.tabItemActive]}
                                    >
                                        <Flex justify='center' style={{ flex: 1 }}>
                                            <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>{item.label}</Text>
                                        </Flex>
                                    </TouchableOpacity>
                                );
                            })}
                        </Flex>
                        <BloodOxygenDetailChart range={selectedType} />
                        <Text style={styles.btmText}>最近10次测量</Text>
                    </View>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
