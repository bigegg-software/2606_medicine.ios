import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  findNodeHandle,
  type FocusEvent,
  type KeyboardEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { Flex, Toast } from '@ant-design/react-native';
import { sendSmsCode, register } from '@/api/auth';
import styles from '@/css/auth/register';
import { saveToken, saveUserId, saveRefreshToken, saveClientId } from '@/services/storage';
import { smsClientId } from '@/utils/config';
import { SET_LOGIN } from '@/store/type/login';
import { fetchUserSession } from '@/store/actions/user';
import type { AppDispatch } from '@/store/store';
import { isResourceApiOk, type LoginData } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import { resolvePostAuthHomeRoute } from './utils/identityHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const REGISTER_ACCESSORY = {
  invite: 'registerInviteDoneToolbar',
  phone: 'registerPhoneDoneToolbar',
  code: 'registerCodeDoneToolbar',
} as const;

type RegisterField = keyof typeof REGISTER_ACCESSORY;

function getKeyboardDuration(event: KeyboardEvent) {
  if (Platform.OS === 'ios' && typeof event.duration === 'number') {
    return event.duration;
  }
  return 250;
}

export default function RegisterPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const bottomOffset = useSharedValue(0);
  const [inviteCode, setInviteCode] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [accessoryKeys, setAccessoryKeys] = useState<Record<RegisterField, number>>({
    invite: 0,
    phone: 0,
    code: 0,
  });
  const switchingAuthRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);

  const refreshAccessory = useCallback((field: RegisterField) => {
    setAccessoryKeys(prev => ({ ...prev, [field]: prev[field] + 1 }));
  }, []);

  const scrollFocusedInputIntoView = useCallback((e: FocusEvent) => {
    const targetHandle = findNodeHandle(e.target as unknown as number | React.Component);
    if (targetHandle == null) return;

    setTimeout(() => {
      const scrollView = scrollRef.current as ScrollView & {
        getScrollResponder?: () => {
          scrollResponderScrollNativeHandleToKeyboard?: (
            nodeHandle: number,
            additionalOffset: number,
            preventNegativeScrollOffset?: boolean,
          ) => void;
        };
      } | null;
      const responder = scrollView?.getScrollResponder?.();
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(targetHandle, 100, true);
    }, Platform.OS === 'ios' ? 80 : 120);
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  // 键盘收起时保持当前滚动位置，避免点「完成」后整页往下跳
  useFocusEffect(
    useCallback(() => {
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const sub = Keyboard.addListener(hideEvent, () => {
        const y = scrollOffsetRef.current;
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y, animated: false });
        });
      });
      return () => sub.remove();
    }, []),
  );

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

  const goLogin = useCallback(() => {
    if (switchingAuthRef.current || submitting) return;
    switchingAuthRef.current = true;
    navigation.replace('Login');
  }, [navigation, submitting]);

  const sendCode = useCallback(async () => {
    if (!phoneValid) {
      Toast.info('请输入正确的手机号（11位数字）', 1.5);
      return;
    }
    setSendingCode(true);
    try {
      const res = await sendSmsCode(phone.trim());
      if (isResourceApiOk(res as { code?: number; msg?: string })) {
        setCountdown(60);
        Toast.success('验证码已发送', 1.5);
      } else {
        const r = res as { msg?: string; message?: string };
        Toast.show(r.msg ?? r.message ?? '请稍后重试', 1.5);
      }
    } catch {
      Toast.show('网络错误，请稍后重试', 1.5);
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
        authAction: 'register',
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
        const routeResult = await resolvePostAuthHomeRoute('');
        if (!routeResult.ok) {
          Alert.alert('注册失败', routeResult.msg ?? '身份初始化失败，请稍后重试');
          return;
        }
        if (routeResult.didInitMemberType) {
          await dispatch(fetchUserSession());
        }
        navigation.reset({ index: 0, routes: [{ name: routeResult.homeRoute }] });
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
    <PageLayout
      style={styles.container}
      keyboardAccessory={
        <>
          {(Object.entries(REGISTER_ACCESSORY) as [RegisterField, string][]).map(([field, id]) => (
            <KeyboardDoneAccessory key={`${id}-${accessoryKeys[field]}`} nativeID={id} />
          ))}
        </>
      }>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          <View style={{ flex: 1 }}>
            <View style={styles.body}>
              <View style={styles.content}>
                <Text style={styles.title}>注册账号</Text>
                <Text style={styles.titleSubTitle}>请填写以下信息完成注册</Text>

                <Text style={styles.inputTitle}>邀请码</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="请输入邀请码"
                  placeholderTextColor="#999999"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  returnKeyType="done"
                  onFocus={scrollFocusedInputIntoView}
                  onPressIn={() => refreshAccessory('invite')}
                  inputAccessoryViewID={REGISTER_ACCESSORY.invite}
                />
                {/* <Text style={styles.yinviteCodeTip}>请向您所属的养老机构或社区获取邀请码</Text> */}

                <Text style={styles.inputTitle}>手机号</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="请输入手机号"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                  returnKeyType="done"
                  onFocus={scrollFocusedInputIntoView}
                  onPressIn={() => refreshAccessory('phone')}
                  inputAccessoryViewID={REGISTER_ACCESSORY.phone}
                />

                <Text style={styles.inputTitle}>验证码</Text>
                <View style={styles.codeBox}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="请输入验证码"
                    placeholderTextColor="#999999"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                    onFocus={scrollFocusedInputIntoView}
                    onPressIn={() => refreshAccessory('code')}
                    inputAccessoryViewID={REGISTER_ACCESSORY.code}
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

                <TouchableOpacity
                  style={[styles.button, submitting && styles.buttonDisabled]}
                  disabled={submitting}
                  onPress={doRegister}
                >
                  <Flex justify="center" style={{ flex: 1 }}>
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>注册</Text>
                    )}
                  </Flex>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.registerTextBox}
                  onPress={goLogin}>
                  <Text style={styles.registerText}>
                    已有账号？
                    <Text style={styles.registerTextLink}>去登录</Text>
                  </Text>
                </TouchableOpacity>

                <Flex style={styles.agreementRow} justify="center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setAgreed(v => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Image
                      style={styles.checkboxIcon}
                      source={
                        agreed
                          ? require('@/assets/images/login/icon_select.png')
                          : require('@/assets/images/login/icon_unselected.png')
                      }
                    />
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
                </Flex>
              </View>

              <Reanimated.View style={bottomAreaStyle} />
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </PageLayout>
  );
}
