import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard, Platform, Button, InputAccessoryView, type KeyboardEvent, } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { AppTheme } from '@/common/theme';
import { Flex } from '@ant-design/react-native';
import { sendSmsCode, register } from '@/api/auth';
import styles from '@/css/auth/register';
import { saveToken, saveUserId, saveRefreshToken, saveClientId } from '@/services/storage';
import { smsClientId } from '@/utils/config';
import { SET_LOGIN } from '@/store/type/login';
import { isResourceApiOk, type LoginData } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { LinearGradient } from 'expo-linear-gradient';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const inviteInputAccessoryViewID = 'registerInviteDoneToolbar';
const phoneInputAccessoryViewID = 'registerPhoneDoneToolbar';
const codeInputAccessoryViewID = 'registerCodeDoneToolbar';

function KeyboardDoneAccessory({ nativeID }: { nativeID: string }) {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.keyboardAccessory}>
        <Button title="完成" onPress={() => Keyboard.dismiss()} color="#027aff" />
      </View>
    </InputAccessoryView>
  );
}

function getKeyboardDuration(event: KeyboardEvent) {
  if (Platform.OS === 'ios' && typeof event.duration === 'number') {
    return event.duration;
  }
  return 250;
}

export default function RegisterPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const bottomOffset = useSharedValue(0);
  const [inviteCode, setInviteCode] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const inviteCodeValid = inviteCode.trim().length > 0;
  const phoneValid = phone.trim().length === 11;
  const codeValid = code.trim().length === 6;

  const getBottomInset = useCallback(
    (height: number) => Math.max(0, height - insets.bottom),
    [insets.bottom],
  );

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, event => {
      const adjustedHeight = getBottomInset(event.endCoordinates.height);
      bottomOffset.value = withTiming(adjustedHeight, {
        duration: getKeyboardDuration(event),
        easing: Easing.out(Easing.cubic),
      });
    });

    const onHide = Keyboard.addListener(hideEvent, event => {
      bottomOffset.value = withTiming(0, {
        duration: getKeyboardDuration(event),
        easing: Easing.out(Easing.cubic),
      });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [bottomOffset, getBottomInset]);

  const openUserAgreement = () => { };

  const openPrivacyPolicy = () => { };

  const sendCode = useCallback(async () => {
    if (!phoneValid) {
      Alert.alert('提示', '请输入正确的手机号（11位数字）');
      return;
    }
    setSendingCode(true);
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
      setSendingCode(false);
    }
  }, [phone, phoneValid]);

  const doRegister = async () => {
    if (!inviteCodeValid) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }
    if (!phoneValid || !codeValid) {
      Alert.alert('提示', '请填写手机号和6位验证码');
      return;
    }
    if (!agreed) {
      Alert.alert('提示', '请阅读并同意用户协议');
      return;
    }
    setSubmitting(true);
    try {
      const res = (await register({
        regUseInviteCode: inviteCode.trim(),
        phonenumber: phone.trim(),
        smsCode: code.trim(),
      })) as {
        code?: number;
        msg?: string;
        message?: string;
        data?: LoginData;
      };
      const data = res.data;
      if (isResourceApiOk(res) && data?.access_token) {
        await saveToken(data.access_token);
        await saveClientId(data.client_id ?? smsClientId);
        if (data.refresh_token) await saveRefreshToken(data.refresh_token);
        if (data.openid) await saveUserId(data.openid);
        dispatch({ type: SET_LOGIN, payload: true });
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        Alert.alert('注册失败', res.msg ?? res.message ?? '请检查信息后重试');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const bottomAreaStyle = useAnimatedStyle(() => ({
    height: bottomOffset.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardDoneAccessory nativeID={inviteInputAccessoryViewID} />
      <KeyboardDoneAccessory nativeID={phoneInputAccessoryViewID} />
      <KeyboardDoneAccessory nativeID={codeInputAccessoryViewID} />

      <LinearGradient
        colors={['#B4D0FF', '#F5F8FF']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.body}>
        <View style={styles.content}>
          <Text style={styles.title}>欢迎来到莱益昇</Text>
          <Text style={styles.subtitle}>请填写以下信息完成注册</Text>

          <Text style={styles.inputTitle}>邀请码</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="请输入邀请码"
            placeholderTextColor="#999999"
            value={inviteCode}
            onChangeText={setInviteCode}
            inputAccessoryViewID={inviteInputAccessoryViewID}
          />

          <Text style={styles.inputTitle}>手机号</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="请输入手机号"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
            maxLength={11}
            value={phone}
            onChangeText={setPhone}
            inputAccessoryViewID={phoneInputAccessoryViewID}
          />

          <Text style={styles.inputTitle}>验证码</Text>
          <View style={[styles.codeBox, styles.codeBoxTight]}>
            <TextInput
              style={styles.codeInput}
              placeholder="验证码"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              inputAccessoryViewID={codeInputAccessoryViewID}
            />
            <TouchableOpacity
              style={countdown > 0 && styles.codeBtnOff}
              disabled={countdown > 0 || sendingCode || submitting}
              onPress={sendCode}
            >
              <Text style={styles.codeBtnText}>
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.agreement}>
            <View style={styles.agreementRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAgreed(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
              </TouchableOpacity>
              <Text style={styles.agreementText}>
                已阅读并同意
                <Text style={styles.agreementLink} onPress={openUserAgreement}>
                  《用户协议》
                </Text>
                和
                <Text style={styles.agreementLink} onPress={openPrivacyPolicy}>
                  《隐私政策》
                </Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={doRegister}
          >
            <Flex justify="center" style={{ flex: 1 }}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>立即注册</Text>
              )}
            </Flex>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Flex justify="center">
              <Text style={[styles.registerText, { color: AppTheme.textSecondary }]}>
                已有账号？
              </Text>
              <Text style={styles.registerText}>立即登录</Text>
            </Flex>
          </TouchableOpacity>
        </View>

        <Reanimated.View style={bottomAreaStyle} />
      </View>
    </SafeAreaView>
  );
}
