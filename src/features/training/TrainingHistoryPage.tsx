import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { getAppTrainingHistory } from '@/api/prescription';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import { isApiOk } from '@/src/utils/apiHelpers';

type Record = { id?: number; exerciseName?: string; duration?: number; completed?: boolean; createdAt?: string };

export default function TrainingHistoryPage() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAppTrainingHistory(7);
    if (isApiOk(res as { code?: number })) {
      const d = (res as { data?: unknown }).data;
      setItems(Array.isArray(d) ? (d as Record[]) : []);
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
      <ListPageLayout title="训练历史" loading={loading} onRefresh={load} emptyText={items.length ? undefined : '近7天暂无训练记录'}>
        {items.map((item, i) => (
          <ListCard
            key={String(item.id ?? i)}
            title={item.exerciseName ?? '训练'}
            subtitle={`${item.completed ? '已完成' : '未完成'} · ${item.duration ?? 0}秒 · ${item.createdAt ? moment(item.createdAt).format('MM-DD HH:mm') : ''}`}
          />
        ))}
      </ListPageLayout>
    </SafeAreaView>
  );
}
