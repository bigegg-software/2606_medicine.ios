import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { submitPatientTrainingRecord } from '@/api/prescription';
import { AppTheme } from '@/common/theme';
import styles from '@/css/training/trainingExecution';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Route = RouteProp<RootStackParamList, 'TrainingExecution'>;

export default function TrainingExecutionPage() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const finish = async (completed: boolean) => {
    setRunning(false);
    const res = await submitPatientTrainingRecord({
      prescriptionId: params.prescriptionId,
      exerciseId: params.exerciseId,
      durationSeconds: seconds,
      completed,
      note: params.exerciseName,
    });
    if (isApiOk(res as { code?: number })) {
      Alert.alert('完成', completed ? '训练已完成' : '已保存记录', [{ text: '确定', onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert('失败', (res as { message?: string }).message ?? '提交失败');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.name}>{params.exerciseName ?? '训练'}</Text>
      <Text style={styles.timer}>{formatTime(seconds)}</Text>
      {params.targetCount ? (
        <Text style={styles.target}>目标：{params.targetCount}{params.unit ?? '次'}</Text>
      ) : null}
      <TouchableOpacity style={styles.playBtn} onPress={() => setRunning(r => !r)}>
        <MaterialIcons name={running ? 'pause' : 'play-arrow'} size={48} color="#fff" />
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.doneBtn} onPress={() => finish(true)}>
          <Text style={styles.doneText}>完成训练</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => finish(false)}>
          <Text style={styles.skipText}>提前结束</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
