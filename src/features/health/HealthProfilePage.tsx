import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getHealthProfile, getHealthProfileSummary } from '@/api/health';
import { AppTheme } from '@/common/theme';
import styles from '@/css/health/healthProfile';
import { isApiOk } from '@/src/utils/apiHelpers';

export default function HealthProfilePage() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([getHealthProfile(), getHealthProfileSummary()]);
      if (isApiOk(p as { code?: number })) setProfile((p as { data?: Record<string, unknown> }).data ?? {});
      if (isApiOk(s as { code?: number })) setSummary((s as { data?: Record<string, unknown> }).data ?? {});
      setLoading(false);
    })();
  }, []);

  const rows = [
    ['性别', profile.gender],
    ['年龄', profile.age],
    ['身高', profile.height],
    ['体重', profile.weight],
    ['血型', profile.bloodType],
    ['慢性病', profile.chronicDiseases ?? summary.chronicDiseases],
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} />
      </TouchableOpacity>
      <Text style={styles.title}>健康档案</Text>
      {loading ? (
        <ActivityIndicator color={AppTheme.primaryColor} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {rows.map(([label, val]) => (
            <View key={String(label)} style={styles.row}>
              <Text style={styles.label}>{String(label)}</Text>
              <Text style={styles.value}>{val != null && val !== '' ? String(val) : '—'}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
