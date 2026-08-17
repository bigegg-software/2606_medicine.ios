import React, { useEffect, useState } from 'react';
import { Text, Image, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/medication/index';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import FamilyReadOnlyHeaderTitle from '@/src/familyPage/components/FamilyReadOnlyHeaderTitle';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import MealTab from './components/MealTab';
import MedicationTab from './components/MedicationTab';

export const MEDICATION_NAV_LIST = [
    { label: '用药', value: 'medication' },
    { label: '用餐', value: 'meal' },
] as const;

export type MedicationNavValue = (typeof MEDICATION_NAV_LIST)[number]['value'];

type MedicationRouteProp = RouteProp<RootStackParamList, 'Medication'>;

export default function MedicationPage() {
    const route = useRoute<MedicationRouteProp>();
    const { readOnly, patientUserId, relationLabel } = resolveFamilyReadOnlyView(route.params);
    const [activeNav, setActiveNav] = useState<MedicationNavValue>(
        () => (readOnly ? 'medication' : (route.params?.tab ?? 'medication')),
    );
    const navigation: any = useNavigation();
    const [mealInputResetToken, setMealInputResetToken] = useState(0);

    useEffect(() => {
        if (readOnly) {
            setActiveNav('medication');
            return;
        }
        if (route.params?.tab) {
            setActiveNav(route.params.tab);
        }
    }, [readOnly, route.params?.tab]);

    useEffect(() => {
        if (!route.params?.resetMealInput) return;
        if (readOnly) return;
        setActiveNav('meal');
        setMealInputResetToken(prev => prev + 1);
        navigation.setParams({ resetMealInput: undefined });
    }, [navigation, readOnly, route.params?.resetMealInput]);

    useEffect(() => {
        const pageTitle = activeNav === 'meal' ? '营养处方' : '用药记录';
        navigation.setOptions({
            headerTitle: readOnly
                ? () => (
                    <FamilyReadOnlyHeaderTitle
                        title={pageTitle}
                        relationLabel={relationLabel}
                    />
                )
                : pageTitle,
            headerRight: readOnly
                ? undefined
                : () =>
                    activeNav === 'medication' ? (
                        <TouchableOpacity
                            style={{ marginRight: 16 }}
                            onPress={() => navigation.navigate('MedicationAllPage')}>
                            <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>全部记录</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={{ marginRight: 16 }}
                            onPress={() => navigation.navigate('MealHistoryPage')}>
                            <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>饮食记录</Text>
                        </TouchableOpacity>
                    ),
        });
    }, [activeNav, navigation, readOnly, relationLabel]);

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            {activeNav === 'medication' ? (
                <MedicationTab
                    readOnly={readOnly}
                    patientUserId={patientUserId}
                />
            ) : (
                <MealTab resetToken={mealInputResetToken} />
            )}
        </PageLayout>
    );
}
