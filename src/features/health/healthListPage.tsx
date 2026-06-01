import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import { isApiOk } from '@/src/utils/apiHelpers';

type Item = { id?: number; name?: string; description?: string; [key: string]: unknown };

export function HealthListScreen({
  title,
  loadItems,
  deleteItem,
  mapTitle,
  mapSubtitle,
}: {
  title: string;
  loadItems: () => Promise<unknown>;
  deleteItem?: (id: number) => Promise<unknown>;
  mapTitle: (item: Item) => string;
  mapSubtitle?: (item: Item) => string;
}) {
  const navigation = useNavigation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await loadItems();
    if (isApiOk(res as { code?: number })) {
      const d = (res as { data?: unknown }).data;
      setItems(Array.isArray(d) ? (d as Item[]) : []);
    }
    setLoading(false);
  }, [loadItems]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableOpacity style={{ padding: 16 }} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
      </TouchableOpacity>
      <ListPageLayout title={title} loading={loading} onRefresh={load} emptyText={items.length ? undefined : '暂无记录'}>
        {items.map(item => (
          <ListCard
            key={String(item.id ?? mapTitle(item))}
            title={mapTitle(item)}
            subtitle={mapSubtitle?.(item)}
            onDelete={
              deleteItem && item.id
                ? async () => {
                    await deleteItem(item.id!);
                    load();
                  }
                : undefined
            }
          />
        ))}
      </ListPageLayout>
    </SafeAreaView>
  );
}
