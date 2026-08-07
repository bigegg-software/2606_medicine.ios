import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  type KeyboardEvent,
} from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Flex, Toast } from '@ant-design/react-native';
import { sendDeleteAccountSmsCode, verifyDeleteAccountSmsCode } from '@/api/user';
import styles from '@/css/auth/login';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { clearAll } from '@/services/storage';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_LOGIN } from '@/store/type/login';
import { SET_UPLOADING, SET_UPLOAD_PROGRESS } from '@/store/type/upload';
import { clearUser } from '@/store/actions/user';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DeleteAccountVerifyPage'>;

const codeInputAccessoryViewID = 'deleteAccountCodeDoneToolbar';

function maskPhone(phone?: string | null) {
  const raw = String(phone ?? '').trim();
  if (raw.length < 7) return raw || '';
  return `${raw.slice(0, 3)}****${raw.slice(-4)}`;
}

function getKeyboardDuration(event: KeyboardEvent) {
  if (Platform.OS === 'ios' && typeof event.duration === 'number') {
    return event.duration;
  }
  return 250;
}

export default function DeleteAccountVerifyPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const bottomOffset = useSharedValue(0);
  const phone = useSelector((state: RootState) => state.user.systemUser?.phonenumber);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const codeValid = code.trim().length === 6;
  const maskedPhone = maskPhone(phone);

  const getBottomInset = useCallback(
    (height: number) => Math.max(0, height - insets.bottom),
    [insets.bottom],
  );

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
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

  const sendCode = useCallback(async () => {
    if (sendingCode || countdown > 0 || submitting) return;
    setSendingCode(true);
    try {
      const res = await sendDeleteAccountSmsCode();
      if (isResourceApiOk(res as { code?: number })) {
        setCountdown(60);
        Toast.success('验证码已发送', 1.5);
      } else {
        Toast.show((res as { msg?: string })?.msg || '验证码发送失败', 1.5);
      }
    } catch {
      Toast.show('网络错误，请稍后重试', 1.5);
    } finally {
      setSendingCode(false);
    }
  }, [countdown, sendingCode, submitting]);

  const confirmDelete = useCallback(async () => {
    if (!codeValid) {
      Toast.show('请输入6位验证码', 1.5);
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await verifyDeleteAccountSmsCode(code.trim());
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '验证失败，请稍后重试', 1.5);
        return;
      }

      await clearAll();
      dispatch(clearUser());
      dispatch({ type: SET_UPLOADING, payload: false });
      dispatch({ type: SET_UPLOAD_PROGRESS, payload: 0 });
      dispatch({ type: SET_LOGIN, payload: false });
      Toast.success('您的账户已注销成功', 1.5);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Toast.show('网络错误，请稍后重试', 1.5);
    } finally {
      setSubmitting(false);
    }
  }, [code, codeValid, dispatch, navigation, submitting]);

  const bottomAreaStyle = useAnimatedStyle(() => ({
    height: bottomOffset.value,
  }));

  return (
    <PageLayout
      style={styles.container}
      keyboardAccessory={<KeyboardDoneAccessory nativeID={codeInputAccessoryViewID} />}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces={false}
          showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1 }}>
            <View style={styles.body}>
              <View style={styles.content}>
                <Text style={styles.title}>验证手机号</Text>
                <Text style={styles.titleSubTitle}>
                  验证通过后将永久注销当前账户，请谨慎操作
                </Text>

                <Text style={styles.inputTitle}>手机号</Text>
                <TextInput
                  style={[styles.inputBox, { color: '#999999' }]}
                  value={maskedPhone || '当前绑定手机号'}
                  editable={false}
                />

                <Text style={styles.inputTitle}>验证码</Text>
                <View style={styles.codeBox}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="请输入6位验证码"
                    placeholderTextColor="#999999"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                    editable={!submitting}
                    inputAccessoryViewID={codeInputAccessoryViewID}
                  />
                  <TouchableOpacity
                    style={countdown > 0 ? styles.codeBtnOff : undefined}
                    disabled={countdown > 0 || sendingCode || submitting}
                    onPress={() => {
                      void sendCode();
                    }}>
                    <Text style={styles.codeBtnText}>
                      {countdown > 0 ? `${countdown}秒` : sendingCode ? '发送中' : '获取验证码'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, submitting && styles.buttonDisabled]}
                  disabled={submitting}
                  onPress={() => {
                    void confirmDelete();
                  }}>
                  <Flex justify="center" style={{ flex: 1 }}>
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>确认删除</Text>
                    )}
                  </Flex>
                </TouchableOpacity>
              </View>
            </View>
            <Reanimated.View style={bottomAreaStyle} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </PageLayout>
  );
}
