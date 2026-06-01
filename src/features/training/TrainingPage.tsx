import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getPatientTodayTraining } from '@/api/prescription';
import { AppTheme } from '@/common/theme';
import styles from '@/css/training/training';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import type { TrainingExerciseParam } from '@/common/models';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Training'>;
type Route = RouteProp<RootStackParamList, 'Training'>;

export default function TrainingPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getPatientTodayTraining();
      if (isApiOk(res as { code?: number })) {
        setData((res as { data?: Record<string, unknown> }).data ?? {});
      }
      setLoading(false);
    })();
  }, []);

  const exercises: TrainingExerciseParam[] = Array.isArray(data.exercises)
    ? (data.exercises as TrainingExerciseParam[])
    : [];
  const prescriptionId = Number(data.prescriptionId ?? data.id ?? 0);
  const catalog = route.params?.catalogId;

  const startExercise = (ex: TrainingExerciseParam) => {
    if (!prescriptionId) return;
    navigation.navigate('TrainingExecution', {
      prescriptionId,
      exerciseId: ex.id,
      exerciseName: ex.name,
      targetCount: ex.targetCount,
      unit: ex.unit,
      durationMinutes: ex.durationMinutes,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} />
      </TouchableOpacity>
      <Text style={styles.title}>康复训练{catalog ? ` · ${catalog}` : ''}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('TrainingHistory')}>
        <Text style={styles.link}>训练历史</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('PrescriptionList')}>
        <Text style={styles.link}>我的处方</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator color={AppTheme.primaryColor} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.planTitle}>{String(data.planName ?? data.title ?? '今日训练')}</Text>
          {exercises.length === 0 ? (
            <Text style={styles.empty}>今日暂无训练任务</Text>
          ) : (
            exercises.map(ex => (
              <TouchableOpacity key={ex.id} style={styles.card} onPress={() => startExercise(ex)}>
                <Text style={styles.cardTitle}>{ex.name}</Text>
                <Text style={styles.cardSub}>
                  {ex.durationMinutes ? `${ex.durationMinutes}分钟` : ''}
                  {ex.targetCount ? ` · ${ex.targetCount}${ex.unit ?? '次'}` : ''}
                </Text>
                <Text style={styles.start}>开始训练 →</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
