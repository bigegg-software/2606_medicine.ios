import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import styles from '@/css/chronicDisease/detail';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import ChronicTrendSection from './components/ChronicTrendSection';
import TodayOverviewSection from './components/TodayOverviewSection';
import MedicationPlanSection from './components/MedicationPlanSection';
import TodayMealSection from './components/TodayMealSection';
import {
    loadChronicDetailData,
    resolveDiseaseTypeLabel,
    type ChronicDetailData,
} from './components/chronicData';

type Props = NativeStackScreenProps<RootStackParamList, 'ChronicDiseaseDetailPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChronicDiseaseDetailPage({ route }: Props) {
    const recordId = route.params?.id;
    const { readOnly, patientUserId } = resolveFamilyReadOnlyView(route.params);
    const navigation = useNavigation<Nav>();
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<ChronicDetailData | null>(null);

    const loadDetail = useCallback(async () => {
        try {
            const data = await loadChronicDetailData(
                recordId,
                patientUserId ? { patientUserId } : undefined,
            );
            setDetail(data);
        } catch {
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [patientUserId, recordId]);

    const loadDetailRef = useRef(loadDetail);
    loadDetailRef.current = loadDetail;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        setLoading(true);
        loadDetailRef.current();
    }, [loadDetail]);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadDetailRef.current();
        }, []),
    );

    const diseaseLabel = resolveDiseaseTypeLabel(
        detail?.record?.diseaseType,
        detail?.diseaseTypeLabels ?? {},
    );

    useEffect(() => {
        navigation.setOptions({
            headerRight: readOnly
                ? undefined
                : () => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ChronicDiseaseAddPage', { id: recordId })}
                        style={{ marginRight: 16 }}>
                        <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>编辑慢病</Text>
                    </TouchableOpacity>
                ),
        });
    }, [navigation, readOnly, recordId]);

    useEffect(() => {
        navigation.setOptions({ title: diseaseLabel });
    }, [diseaseLabel, navigation]);

    if (loading || !detail) {
        return (
            <PageLayout style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <ChronicTrendSection detail={detail} />
                <TodayOverviewSection overview={detail.todayOverview} />
                <MedicationPlanSection medications={detail.associatedMedications} readOnly={readOnly} />
                <TodayMealSection patientUserId={patientUserId} />
            </ScrollView>
        </PageLayout>
    );
}
