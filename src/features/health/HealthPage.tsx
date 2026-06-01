import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { getLatestMetrics } from '@/api/health';
import { AppTheme } from '@/common/theme';
import styles from '@/css/health/health';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type HealthRoute = 'HealthProfile' | 'Vitals' | 'PrescriptionList' | 'Medication' | 'MedicalRecords';

const GRID: { label: string; route: HealthRoute; icon: keyof typeof MaterialIcons.glyphMap; enabled: boolean }[] = [
  { label: '健康档案', route: 'HealthProfile', icon: 'folder-shared', enabled: true },
  { label: '体征监测', route: 'Vitals', icon: 'monitor-heart', enabled: true },
  { label: '慢病管理', route: 'HealthProfile', icon: 'healing', enabled: true },
  { label: '康复计划', route: 'PrescriptionList', icon: 'fitness-center', enabled: true },
  { label: '饮食运动', route: 'HealthProfile', icon: 'restaurant', enabled: false },
  { label: '用药记录', route: 'Medication', icon: 'medication', enabled: true },
  { label: '报告解读', route: 'MedicalRecords', icon: 'description', enabled: true },
  { label: '评估问卷', route: 'HealthProfile', icon: 'quiz', enabled: false },
];

const MORE = [
  { label: '过敏史', route: 'Allergy' as const },
  { label: '家族史', route: 'FamilyHistory' as const },
  { label: '紧急联系人', route: 'EmergencyContacts' as const },
];

export default function HealthPage() {
  const navigation = useNavigation<Nav>();
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getLatestMetrics();
    if (isApiOk(res as { code?: number })) {
      const d = (res as { data?: Record<string, unknown> }).data;
      if (d && typeof d === 'object') setMetrics(d);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metricVal = (key: string) => {
    const m = metrics[key];
    if (m && typeof m === 'object' && m !== null && 'value' in m) return String((m as { value: unknown }).value);
    if (m != null) return String(m);
    return '--';
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.title}>健康管理</Text>
      {loading ? (
        <ActivityIndicator color={AppTheme.primaryColor} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.metricsRow}>
            <MetricChip label="血压" value={metricVal('blood_pressure') || metricVal('systolic')} />
            <MetricChip label="血糖" value={metricVal('blood_glucose') || metricVal('glucose')} />
            <MetricChip label="心率" value={metricVal('heart_rate')} />
          </View>
          <View style={styles.grid}>
            {GRID.map(item => (
              <TouchableOpacity
                key={item.label}
                style={[styles.cell, !item.enabled && styles.cellDisabled]}
                disabled={!item.enabled}
                onPress={() => item.enabled && navigation.navigate(item.route)}>
                <View style={styles.cellIcon}>
                  <MaterialIcons name={item.icon} size={26} color={item.enabled ? AppTheme.primaryColor : AppTheme.textSecondary} />
                </View>
                <Text style={styles.cellLabel}>{item.label}</Text>
                {!item.enabled ? <Text style={styles.soon}>即将开放</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.section}>更多记录</Text>
          {MORE.map(m => (
            <TouchableOpacity key={m.route} style={styles.listRow} onPress={() => navigation.navigate(m.route)}>
              <Text style={styles.listLabel}>{m.label}</Text>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}
