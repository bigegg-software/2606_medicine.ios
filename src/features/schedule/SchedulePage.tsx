import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { getSchedules, completeSchedule, uncompleteSchedule, deleteSchedule } from '@/api/schedule';
import ListPageLayout, { ListCard } from '@/src/components/ListPageLayout';
import { AppTheme } from '@/common/theme';
import styles from '@/css/schedule/schedule';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import type { ScheduleItem } from '@/common/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_COLORS: Record<string, { bg: string; color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  MEDICATION: { bg: '#FFE4E6', color: '#E11D48', icon: 'medication' },
  MEASUREMENT: { bg: '#DBEAFE', color: '#2563EB', icon: 'bar-chart' },
  ACTIVITY: { bg: '#DCFCE7', color: '#16A34A', icon: 'directions-run' },
  CALL: { bg: '#F3E8FF', color: '#9333EA', icon: 'phone' },
};

export default function SchedulePage() {
  const navigation = useNavigation<Nav>();
  const [date, setDate] = useState(moment());
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getSchedules(date.format('YYYY-MM-DD'));
    if (isApiOk(res as { code?: number })) {
      const d = (res as { data?: unknown }).data;
      setItems(Array.isArray(d) ? (d as ScheduleItem[]) : []);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftDay = (delta: number) => setDate(d => moment(d).add(delta, 'day'));

  const toggleComplete = async (item: ScheduleItem) => {
    if (!item.id) return;
    const done = item.status === 'COMPLETED';
    const res = done ? await uncompleteSchedule(item.id) : await completeSchedule(item.id);
    if (isApiOk(res as { code?: number })) load();
    else Alert.alert('提示', (res as { message?: string }).message ?? '操作失败');
  };

  return (
    <SafeAreaView style={styles.flex}>
      <ListPageLayout
        title="今日安排"
        loading={loading}
        actionLabel="添加"
        onAction={() => navigation.navigate('ScheduleAdd')}
        emptyText={items.length ? undefined : '今日暂无安排，点击添加创建'}>
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => shiftDay(-1)}>
            <MaterialIcons name="chevron-left" size={28} color={AppTheme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ScheduleCalendar')}>
            <Text style={styles.dateText}>{date.format('YYYY年M月D日')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => shiftDay(1)}>
            <MaterialIcons name="chevron-right" size={28} color={AppTheme.textPrimary} />
          </TouchableOpacity>
        </View>
        {items.map(item => {
          const cfg = TYPE_COLORS[String(item.type ?? '').toUpperCase()] ?? TYPE_COLORS.ACTIVITY;
          const time = item.scheduledTime ? moment(item.scheduledTime).format('HH:mm') : '--:--';
          return (
            <View key={String(item.id)} style={styles.cardWrap}>
              <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
                <MaterialIcons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <ListCard title={item.title ?? '安排'} subtitle={`${time} · ${item.type ?? '活动'}`} />
              </View>
              <TouchableOpacity onPress={() => toggleComplete(item)}>
                <MaterialIcons
                  name={item.status === 'COMPLETED' ? 'check-circle' : 'radio-button-unchecked'}
                  size={28}
                  color={AppTheme.primaryColor}
                />
              </TouchableOpacity>
              {item.id ? (
                <TouchableOpacity
                  onPress={async () => {
                    await deleteSchedule(item.id!);
                    load();
                  }}>
                  <MaterialIcons name="delete-outline" size={24} color={AppTheme.dangerColor} />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </ListPageLayout>
    </SafeAreaView>
  );
}
