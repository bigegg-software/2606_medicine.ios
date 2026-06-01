import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getActivities } from '@/api/community';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import type { ActivityItem } from '@/common/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CommunityPage() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getActivities({ limit: 20 });
    if (isApiOk(res as { code?: number })) {
      let raw = (res as { data?: unknown }).data;
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'content' in (raw as object)) {
        raw = (raw as { content: unknown }).content;
      }
      setItems(Array.isArray(raw) ? (raw as ActivityItem[]) : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ListPageLayout title="社区活动" loading={loading} onRefresh={load} emptyText={items.length ? undefined : '暂无活动'}>
        {items.map(a => (
          <ListCard
            key={String(a.id)}
            title={a.title ?? '活动'}
            subtitle={`${a.typeLabel ?? '活动'} · ${a.location ?? ''} · ${a.startTime?.slice(0, 16) ?? ''}`}
            onPress={() => a.id != null && navigation.navigate('ActivityDetail', { id: a.id })}
          />
        ))}
      </ListPageLayout>
    </SafeAreaView>
  );
}
