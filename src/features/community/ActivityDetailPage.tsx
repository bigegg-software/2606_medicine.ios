import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { getActivityDetail, registerForActivity, cancelRegistration } from '@/api/community';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/activityDetail';
import { isApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Route = RouteProp<RootStackParamList, 'ActivityDetail'>;

export default function ActivityDetailPage() {
  const { params } = useRoute<Route>();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getActivityDetail(params.id);
      if (isApiOk(res as { code?: number })) {
        const d = (res as { data?: Record<string, unknown> }).data ?? {};
        setData(d);
        setRegistered(!!d.registered || !!d.isRegistered);
      }
      setLoading(false);
    })();
  }, [params.id]);

  const toggleRegister = async () => {
    const res = registered ? await cancelRegistration(params.id) : await registerForActivity(params.id);
    if (isApiOk(res as { code?: number })) {
      setRegistered(!registered);
      Alert.alert('提示', registered ? '已取消报名' : '报名成功');
    } else {
      Alert.alert('失败', (res as { message?: string }).message ?? '请稍后重试');
    }
  };

  if (loading) {
    return (
      <PageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{String(data.title ?? '活动详情')}</Text>
        <Text style={styles.meta}>地点：{String(data.location ?? '待定')}</Text>
        <Text style={styles.meta}>时间：{String(data.startTime ?? '')}</Text>
        <Text style={styles.meta}>类型：{String(data.typeLabel ?? data.type ?? '')}</Text>
        <Text style={styles.desc}>{String(data.description ?? data.content ?? '暂无详细介绍')}</Text>
      </ScrollView>
      <TouchableOpacity style={styles.btn} onPress={toggleRegister}>
        <Text style={styles.btnText}>{registered ? '取消报名' : '立即报名'}</Text>
      </TouchableOpacity>
    </PageLayout>
  );
}
