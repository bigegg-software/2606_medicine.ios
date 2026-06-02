import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { sendSmsCode, register } from '@/api/auth';
import { AppTheme } from '@/common/theme';
import styles from '@/css/auth/register';
import { saveToken, saveUserId } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { isApiOk, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = useCallback(async () => {
    if (phone.trim().length !== 11) {
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
  }, [phone]);

  const doRegister = async () => {
    if (phone.trim().length !== 11) {
      Alert.alert('提示', '请输入正确的手机号（11位数字）');
      return;
    }
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码输入不一致');
      return;
    }
    if (!agreed) {
      Alert.alert('提示', '请阅读并同意用户协议');
      return;
    }
    setLoading(true);
    try {
      const res = (await register(phone.trim(), code.trim(), password)) as {
        code?: number;
        message?: string;
        data?: { token?: string; userId?: number };
      };
      if (isApiOk(res) && res.data?.token) {
        await saveToken(res.data.token);
        if (res.data.userId) await saveUserId(res.data.userId);
        dispatch({ type: SET_LOGIN, payload: true });
        Alert.alert('成功', '注册成功！', [
          { text: '确定', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) },
        ]);
      } else {
        Alert.alert('注册失败', res.message ?? '请稍后重试');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={AppTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>注册新账号</Text>
        <Text style={styles.subtitle}>创建您的智荟康账号</Text>

        <Field label="手机号" icon="phone" value={phone} onChangeText={setPhone} placeholder="请输入11位手机号" keyboardType="phone-pad" maxLength={11} />
        <Text style={styles.fieldLabel}>
          <MaterialIcons name="shield" size={20} color={AppTheme.primaryColor} /> 验证码
        </Text>
        <View style={styles.codeRow}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="请输入验证码" placeholderTextColor={AppTheme.hintTextColor} keyboardType="number-pad" value={code} onChangeText={setCode} />
          <TouchableOpacity style={[styles.codeBtn, countdown > 0 && styles.codeBtnOff]} disabled={countdown > 0 || loading} onPress={sendCode}>
            <Text style={styles.codeBtnText}>{countdown > 0 ? `${countdown}秒` : '获取验证码'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 16 }} />

        <Field label="设置密码" icon="lock" value={password} onChangeText={setPassword} placeholder="请设置6位以上密码" secureTextEntry={!showPwd} onToggle={() => setShowPwd(v => !v)} showToggle />
        <Field label="确认密码" icon="lock" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="请再次输入密码" secureTextEntry={!showConfirm} onToggle={() => setShowConfirm(v => !v)} showToggle />

        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(a => !a)}>
          <MaterialIcons name={agreed ? 'check-box' : 'check-box-outline-blank'} size={26} color={AppTheme.primaryColor} />
          <Text style={styles.agreeText}>
            我已阅读并同意<Text style={styles.link}>《用户协议》</Text> 和 <Text style={styles.link}>《隐私政策》</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} disabled={loading} onPress={doRegister}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>注册</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkCenter}>已有账号？立即登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  secureTextEntry,
  onToggle,
  showToggle,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'phone-pad' | 'default';
  maxLength?: number;
  secureTextEntry?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.labelRow}>
        <MaterialIcons name={icon as 'phone'} size={20} color={AppTheme.primaryColor} />
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, { marginBottom: 0, flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AppTheme.hintTextColor}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
        />
        {showToggle && onToggle ? (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <MaterialIcons name={secureTextEntry ? 'visibility' : 'visibility-off'} size={24} color={AppTheme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
