import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { getScheduleMonthlyOverview } from '@/api/schedule';
import { AppTheme } from '@/common/theme';
import styles from '@/css/schedule/scheduleCalendar';
import { isApiOk } from '@/src/utils/apiHelpers';

export default function ScheduleCalendarPage() {
  const navigation = useNavigation();
  const [month, setMonth] = useState(moment());
  const [overview, setOverview] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const res = await getScheduleMonthlyOverview(month.format('YYYY-MM'));
      if (isApiOk(res as { code?: number })) {
        const d = (res as { data?: Record<string, number> }).data ?? {};
        setOverview(typeof d === 'object' ? d : {});
      }
    })();
  }, [month]);

  const daysInMonth = month.daysInMonth();
  const firstDow = moment(month).startOf('month').day();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>安排日历</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => setMonth(m => moment(m).subtract(1, 'month'))}>
          <MaterialIcons name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{month.format('YYYY年M月')}</Text>
        <TouchableOpacity onPress={() => setMonth(m => moment(m).add(1, 'month'))}>
          <MaterialIcons name="chevron-right" size={28} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekHead}>
        {['日', '一', '二', '三', '四', '五', '六'].map(w => (
          <Text key={w} style={styles.weekCell}>{w}</Text>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {Array.from({ length: firstDow }).map((_, i) => (
          <View key={`e-${i}`} style={styles.dayCell} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = month.date(day).format('YYYY-MM-DD');
          const count = overview[key] ?? 0;
          return (
            <View key={key} style={styles.dayCell}>
              <Text style={styles.dayNum}>{day}</Text>
              {count > 0 ? <View style={styles.dot}><Text style={styles.dotText}>{count}</Text></View> : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
