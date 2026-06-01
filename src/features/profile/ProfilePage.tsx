import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { clearAll, saveUserId } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/profile';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MENU = [
  { icon: 'edit' as const, label: '编辑资料', route: 'ProfileEdit' as const },
  { icon: 'family-restroom' as const, label: '家属绑定', route: 'FamilyBind' as const },
  { icon: 'hotel' as const, label: '我的床位', route: 'MyBed' as const },
  { icon: 'favorite' as const, label: '体征监测', route: 'Vitals' as const },
  { icon: 'medication' as const, label: '用药记录', route: 'Medication' as const },
  { icon: 'assignment' as const, label: '康复处方', route: 'PrescriptionList' as const },
  { icon: 'history' as const, label: '训练历史', route: 'TrainingHistory' as const },
];

export default function ProfilePage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const [user, setUser] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [signedToday, setSignedToday] = useState(false);
  const [points, setPoints] = useState(0);
  const signKey = `sign_in_${new Date().getFullYear()}_${new Date().getMonth() + 1}_${new Date().getDate()}`;

  const load = useCallback(async () => {
    const signed = (await AsyncStorage.getItem(signKey)) === 'true';
    setSignedToday(signed);
    try {
      const pRes = await getUserBaseInfo();
      if (isResourceApiOk(pRes as { code?: number })) {
        const d = (pRes as { data?: UserBaseInfo }).data ?? {};
        setUser(d as Record<string, unknown>);
        if (d.userId != null) await saveUserId(d.userId);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [signKey]);

  useEffect(() => {
    load();
  }, [load]);

  const signIn = async () => {
    if (signedToday) return;
    await AsyncStorage.setItem(signKey, 'true');
    setSignedToday(true);
    setPoints(p => p + 10);
    Alert.alert('签到成功', '获得 10 积分');
  };

  const logout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          dispatch({ type: SET_LOGIN, payload: false });
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  const name = String(user.name ?? '未知用户');
  const avatarUrl = String(user.avatarOssUrl ?? '');
  const meta = [user.gender, user.birthDate, user.bloodType].filter(Boolean).join(' · ');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name[0] ?? 'U'}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            {meta ? <Text style={styles.phone}>{meta}</Text> : null}
          </View>
          <View style={styles.pointsBox}>
            <MaterialIcons name="star" size={20} color={AppTheme.accentColor} />
            <Text style={styles.points}>{points}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.signBtn, signedToday && styles.signBtnDone]} onPress={signIn} disabled={signedToday}>
          <Text style={styles.signBtnText}>{signedToday ? '今日已签到' : '每日签到 +10积分'}</Text>
        </TouchableOpacity>

        {MENU.map(item => (
          <TouchableOpacity key={item.route} style={styles.menuRow} onPress={() => navigation.navigate(item.route)}>
            <MaterialIcons name={item.icon} size={24} color={AppTheme.primaryColor} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
