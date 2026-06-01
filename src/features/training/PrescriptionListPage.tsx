import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAppPrescriptions } from '@/api/prescription';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rx = { id: number; title?: string; name?: string; status?: string; startDate?: string };

export default function PrescriptionListPage() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAppPrescriptions();
    if (isApiOk(res as { code?: number })) {
      const d = (res as { data?: unknown }).data;
      setItems(Array.isArray(d) ? (d as Rx[]) : []);
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
      <ListPageLayout title="康复处方" loading={loading} onRefresh={load} emptyText={items.length ? undefined : '暂无处方'}>
        {items.map(item => (
          <ListCard
            key={item.id}
            title={item.title ?? item.name ?? '处方'}
            subtitle={`${item.status ?? ''} · ${item.startDate?.slice(0, 10) ?? ''}`}
            onPress={() => navigation.navigate('PrescriptionDetail', { id: item.id })}
          />
        ))}
      </ListPageLayout>
    </SafeAreaView>
  );
}
