import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { sendSmsCode, login } from '@/api/auth';
import { AppTheme } from '@/common/theme';
import styles from '@/css/auth/login';
import { saveToken, saveUserId, saveRefreshToken, saveClientId } from '@/services/storage';
import { smsClientId } from '@/utils/config';
import { SET_LOGIN } from '@/store/type/login';
import { isResourceApiOk, type LoginData } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const phoneValid = phone.trim().length === 11;
  const codeValid = code.trim().length === 6;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = useCallback(async () => {
    if (!phoneValid) {
      Alert.alert('提示', '请输入正确的手机号（11位数字）');
      return;
    }
    setLoading(true);
    try {
      const res = await sendSmsCode(phone.trim());
      if (isResourceApiOk(res as { code?: number; msg?: string })) {
        setCountdown(60);
        Alert.alert('提示', '验证码已发送');
      } else {
        const r = res as { msg?: string; message?: string };
        Alert.alert('发送失败', r.msg ?? r.message ?? '请稍后重试');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [phone, phoneValid]);

  const doLogin = async () => {
    if (!phoneValid || !codeValid) {
      Alert.alert('提示', '请填写手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const res = (await login(phone.trim(), code.trim())) as {
        code?: number;
        msg?: string;
        message?: string;
        data?: LoginData;
      };
      const data = res.data;
      console.log(data)
      if (isResourceApiOk(res) && data?.access_token) {
        await saveToken(data.access_token);
        await saveClientId(smsClientId);
        if (data.refresh_token) await saveRefreshToken(data.refresh_token);
        if (data.openid) await saveUserId(data.openid);
        dispatch({ type: SET_LOGIN, payload: true });
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        Alert.alert('登录失败', res.msg ?? res.message ?? '请检查验证码');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>欢迎回来</Text>
        <Text style={styles.subtitle}>请输入您的手机号登录</Text>

        <Label icon="phone" text="手机号" />
        <TextInput
          style={styles.input}
          placeholder="请输入11位手机号"
          placeholderTextColor={AppTheme.hintTextColor}
          keyboardType="phone-pad"
          maxLength={11}
          value={phone}
          onChangeText={setPhone}
        />

        <Label icon="shield" text="验证码" />
        <View style={styles.codeRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="请输入6位验证码"
            placeholderTextColor={AppTheme.hintTextColor}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <TouchableOpacity
            style={[styles.codeBtn, countdown > 0 && styles.codeBtnDisabled]}
            disabled={!phoneValid || countdown > 0 || loading}
            onPress={sendCode}>
            <Text style={[styles.codeBtnText, countdown > 0 && styles.codeBtnTextMuted]}>
              {countdown > 0 ? `${countdown}秒` : '获取验证码'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, (!phoneValid || !codeValid) && styles.primaryBtnDisabled]}
          disabled={!phoneValid || !codeValid || loading}
          onPress={doLogin}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>登录</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Register')}>
          <Text style={styles.link}>还没有账号？立即注册</Text>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <MaterialIcons name="info-outline" size={22} color="#4CAF50" />
          <Text style={styles.tipText}>
            温馨提示：如果您在登录过程中遇到问题，可以拨打客服电话{' '}
            <Text style={styles.tipPhone}>400-123-4567</Text> 寻求帮助。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.labelRow}>
      <MaterialIcons name={icon as 'phone'} size={20} color={AppTheme.primaryColor} />
      <Text style={styles.label}>{text}</Text>
    </View>
  );
}
