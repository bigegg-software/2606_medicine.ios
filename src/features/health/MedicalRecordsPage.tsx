import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import { getResourceRows } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MedicalRecordsPage() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMedicalRecordFrontList({ pageNum: 1, pageSize: 50 });
      setItems(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity style={{ padding: 16 }} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
      </TouchableOpacity>
      <ListPageLayout title="就医记录" loading={loading} onRefresh={load} emptyText={items.length ? undefined : '暂无记录'}>
        {items.map(item => {
          const id = item.medicalRecordId ?? 0;
          const title = item.diagnosticResult || item.hospital || '就医记录';
          const subtitle = [item.medicalRecordType, item.recordDate, item.hospital].filter(Boolean).join(' · ');
          return (
            <ListCard
              key={id || String(subtitle)}
              title={title}
              subtitle={subtitle}
              onPress={() => id && navigation.navigate('MedicalRecordDetail', { id })}
            />
          );
        })}
      </ListPageLayout>
    </SafeAreaView>
  );
}
