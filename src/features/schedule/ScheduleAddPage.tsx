import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { createSchedule } from '@/api/schedule';
import { AppTheme } from '@/common/theme';
import styles from '@/css/schedule/scheduleAdd';
import { isApiOk } from '@/src/utils/apiHelpers';

const TYPES = [
  { key: 'MEDICATION', label: '用药' },
  { key: 'MEASUREMENT', label: '测量' },
  { key: 'ACTIVITY', label: '活动' },
  { key: 'REMINDER', label: '提醒' },
];

export default function ScheduleAddPage() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('ACTIVITY');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入安排标题');
      return;
    }
    setLoading(true);
    const scheduledTime = `${moment().format('YYYY-MM-DD')}T${time}:00`;
    const res = await createSchedule({ title: title.trim(), type, scheduledTime, status: 'PENDING' });
    setLoading(false);
    if (isApiOk(res as { code?: number })) {
      Alert.alert('成功', '安排已添加', [{ text: '确定', onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert('失败', (res as { message?: string }).message ?? '请稍后重试');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>添加安排</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>标题</Text>
        <TextInput style={styles.input} placeholder="例如：测血糖" value={title} onChangeText={setTitle} placeholderTextColor={AppTheme.hintTextColor} />

        <Text style={styles.label}>类型</Text>
        <View style={styles.typeRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, type === t.key && styles.typeChipActive]}
              onPress={() => setType(t.key)}>
              <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>时间 (HH:mm)</Text>
        <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor={AppTheme.hintTextColor} />

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
