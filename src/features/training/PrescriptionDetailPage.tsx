import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAppPrescriptionDetail } from '@/api/prescription';
import { AppTheme } from '@/common/theme';
import styles from '@/css/training/prescriptionDetail';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Route = RouteProp<RootStackParamList, 'PrescriptionDetail'>;

export default function PrescriptionDetailPage() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getAppPrescriptionDetail(params.id);
      if (isApiOk(res as { code?: number })) {
        setData((res as { data?: Record<string, unknown> }).data ?? {});
      }
      setLoading(false);
    })();
  }, [params.id]);

  const exercises = Array.isArray(data.exercises) ? (data.exercises as Record<string, unknown>[]) : [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{String(data.title ?? data.name ?? '处方详情')}</Text>
        <Text style={styles.meta}>状态：{String(data.status ?? '')}</Text>
        <Text style={styles.meta}>医生：{String(data.doctorName ?? data.physician ?? '')}</Text>
        <Text style={styles.section}>训练项目</Text>
        {exercises.map((ex, i) => (
          <View key={String(ex.id ?? i)} style={styles.card}>
            <Text style={styles.cardTitle}>{String(ex.name ?? '动作')}</Text>
            <Text style={styles.cardSub}>
              {ex.durationMinutes ? `${ex.durationMinutes}分钟` : ''}
              {ex.targetCount ? ` · ${ex.targetCount}${ex.unit ?? '次'}` : ''}
            </Text>
          </View>
        ))}
        {exercises.length === 0 ? <Text style={styles.empty}>暂无训练项目</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
