import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { getMyBed } from '@/api/family';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/myBed';
import { isApiOk } from '@/src/utils/apiHelpers';

export default function MyBedPage() {
  const navigation = useNavigation();
  const [bed, setBed] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getMyBed();
      if (isApiOk(res as { code?: number })) {
        setBed((res as { data?: Record<string, unknown> }).data ?? {});
      }
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} />
      </TouchableOpacity>
      <Text style={styles.title}>我的床位</Text>
      {loading ? (
        <ActivityIndicator color={AppTheme.primaryColor} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>病区</Text>
          <Text style={styles.value}>{String(bed.wardName ?? bed.ward ?? '—')}</Text>
          <Text style={styles.label}>床位号</Text>
          <Text style={styles.value}>{String(bed.bedNumber ?? bed.bedNo ?? '—')}</Text>
          <Text style={styles.label}>入院日期</Text>
          <Text style={styles.value}>{String(bed.admissionDate ?? bed.admittedAt ?? '—')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
