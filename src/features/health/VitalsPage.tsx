import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getHealthMetrics } from '@/api/health';
import { parseHealthMetrics } from '@/common/models';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import { isApiOk } from '@/src/utils/apiHelpers';
import moment from 'moment';

export default function VitalsPage() {
  const navigation = useNavigation();
  const [items, setItems] = useState<{ type: string; value: string; recordedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getHealthMetrics({ days: 30 });
    if (isApiOk(res as { code?: number })) {
      setItems(parseHealthMetrics((res as { data?: unknown }).data ?? res));
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
      <ListPageLayout title="体征监测" loading={loading} onRefresh={load} emptyText={items.length ? undefined : '暂无体征记录'}>
        {items.map((item, i) => (
          <ListCard
            key={`${item.type}-${item.recordedAt}-${i}`}
            title={`${item.type}：${item.value}`}
            subtitle={moment(item.recordedAt).format('YYYY-MM-DD HH:mm')}
          />
        ))}
      </ListPageLayout>
    </SafeAreaView>
  );
}
