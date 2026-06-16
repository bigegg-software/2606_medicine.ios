import React, { useEffect, useState } from 'react';
import { Text, Image, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Flex } from '@ant-design/react-native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/medication/index';
import PageLayout from '@/src/components/PageLayout';
import MealTab from './components/MealTab';
import MedicationTab from './components/MedicationTab';
export const MEDICATION_NAV_LIST = [
    { label: '用药', value: 'medication' },
    { label: '用餐', value: 'meal' },
] as const;

export type MedicationNavValue = (typeof MEDICATION_NAV_LIST)[number]['value'];

export default function MedicationPage() {
    const [activeNav, setActiveNav] = useState<MedicationNavValue>('medication');
    const navigation: any = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                activeNav === 'medication' ? (
                    <TouchableOpacity
                        style={{ marginRight: 16 }}
                        onPress={() => navigation.navigate('MedicationAllPage')}>
                        <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>所有用药</Text>
                    </TouchableOpacity>
                ) : null,
        });
    }, [activeNav, navigation]);

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <Flex style={styles.navBox}>
                    {MEDICATION_NAV_LIST.map(item => (
                        <TouchableOpacity
                            style={styles.navCol}
                            key={item.value}
                            onPress={() => {
                                if (item.value === activeNav) return;
                                setActiveNav(item.value);
                            }}>
                            <View style={styles.navItemWrap}>
                                <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>
                                    {item.label}
                                </Text>
                                {activeNav === item.value ? (
                                    <View style={styles.navIndicatorWrap}>
                                        <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                                    </View>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    ))}
                </Flex>

                {activeNav === 'medication' ? <MedicationTab /> : <MealTab />}
        </PageLayout>
    );
}
