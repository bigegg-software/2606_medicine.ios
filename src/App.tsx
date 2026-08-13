import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as AntdProvider, Toast } from '@ant-design/react-native';
import zhCN from '@ant-design/react-native/lib/locale-provider/zh_CN';
import { useFonts } from 'expo-font';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store, { type AppDispatch, type RootState } from '@/store/store';
import { fetchUserSession } from '@/store/actions/user';
import { autoReconnectEquipment } from '@/store/actions/equipment';
import { navigationRef } from '@/utils/navigationRef';
import RootStack from '@/route/router';
import { getToken } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { buildScaledAntdTheme } from '@/common/antdTheme';
import { FontSizeProvider, useFontSize } from '@/common/FontSizeContext';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import updateHealthKit from '@/utils/healthKit';
import { addPushNotificationListeners, registerIosPushToken, syncNotificationSettingsFromUserExtr } from '@/src/utils/pushNotifications';
import SyncReminderWatcher from '@/src/components/SyncReminderWatcher';
import SessionExpiredWatcher from '@/src/components/SessionExpiredWatcher';
import UploadProgressBar from '@/src/components/UploadProgressBar';

function AutoSyncOnLaunch() {
  const isLogin = useSelector((state: RootState) => state.login.isLogin);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const userId = useSelector((state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId);
  const autoSyncData = userExtr?.autoSyncData;
  /** 已触发过自动同步的账号，退出登录后清空，换号登录可再次同步 */
  const syncedUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isLogin) {
      syncedUserIdRef.current = null;
      return;
    }
    if (!userId || userExtr == null) return;
    if (Platform.OS !== 'ios') return;
    // 与数据管理页一致：非 0 视为开启自动同步
    if (autoSyncData === 0) return;

    const uid = String(userId);
    if (syncedUserIdRef.current === uid) return;
    syncedUserIdRef.current = uid;

    const timer = setTimeout(() => {
      if (AppState.currentState !== 'active') return;
      void updateHealthKit(null).then(syncRes => {
        if (typeof syncRes === 'object' && syncRes !== null && 'code' in syncRes && !isResourceApiOk(syncRes as { code?: number }) && (syncRes as { code?: number }).code !== 0) {
          const msg = (syncRes as { msg?: string }).msg;
          if (msg) Toast.show(msg);
        }
      }).catch((err: unknown) => {
        const msg = err && typeof err === 'object' && 'msg' in err ? String((err as { msg?: string }).msg) : '';
        if (msg) Toast.show(msg);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [autoSyncData, isLogin, userExtr, userId]);

  return null;
}

/** 登录后按用户偏好自动重连设备（手动断开后不再自动连） */
function EquipmentAutoReconnectOnLaunch() {
  const isLogin = useSelector((state: RootState) => state.login.isLogin);
  const userId = useSelector(
    (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
  );
  const triedUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isLogin || userId == null) {
      triedUserIdRef.current = null;
      return;
    }
    const uid = String(userId);
    if (triedUserIdRef.current === uid) return;
    triedUserIdRef.current = uid;

    const timer = setTimeout(() => {
      if (AppState.currentState !== 'active') return;
      const dispatch = store.dispatch as AppDispatch;
      void dispatch(autoReconnectEquipment());
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLogin, userId]);

  return null;
}

function NotificationSettingsSync() {
  const userExtr = useSelector((state: RootState) => state.user.userExtr);

  useEffect(() => {
    syncNotificationSettingsFromUserExtr(userExtr);
  }, [userExtr?.isSendSysMsg, userExtr?.params]);

  return null;
}

function PushTokenReporter() {
  const isLogin = useSelector((state: RootState) => state.login.isLogin);

  useEffect(() => {
    if (!isLogin || Platform.OS !== 'ios') return;
    void registerIosPushToken().catch(() => undefined);
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin || Platform.OS !== 'ios') return;

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void registerIosPushToken().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [isLogin]);

  return null;
}

function PushNotificationListener() {
  useEffect(() => addPushNotificationListeners(), []);
  return null;
}

function AppShell() {
  const { option } = useFontSize();
  const theme = useMemo(() => buildScaledAntdTheme(option), [option]);

  return (
    <AntdProvider locale={zhCN} theme={theme}>
      <Provider store={store}>
        <PushTokenReporter />
        <NotificationSettingsSync />
        <PushNotificationListener />
        <AutoSyncOnLaunch />
        <EquipmentAutoReconnectOnLaunch />
        <SyncReminderWatcher />
        <SessionExpiredWatcher />
        <View style={{ flex: 1 }}>
          <NavigationContainer ref={navigationRef}>
            <RootStack />
          </NavigationContainer>
          <UploadProgressBar />
        </View>
      </Provider>
    </AntdProvider>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    'AlibabaPuHuiTi-Light': require('@/assets/fonts/Alibaba-PuHuiTi-Light.ttf'),
    'AlibabaPuHuiTi-Regular': require('@/assets/fonts/Alibaba-PuHuiTi-Regular.ttf'),
    'AlibabaPuHuiTi-Medium': require('@/assets/fonts/Alibaba-PuHuiTi-Medium.ttf'),
    'AlibabaPuHuiTi-Bold': require('@/assets/fonts/Alibaba-PuHuiTi-Bold.ttf'),
    'AlibabaPuHuiTi-Heavy': require('@/assets/fonts/Alibaba-PuHuiTi-Heavy.ttf'),
  });

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const isLoggedIn = !!(token && token.length > 0);
      const dispatch = store.dispatch as AppDispatch;
      dispatch({ type: SET_LOGIN, payload: isLoggedIn });
      if (isLoggedIn) {
        await dispatch(fetchUserSession());
      }
      setReady(true);
    })();
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppTheme.backgroundColor }}>
        <ActivityIndicator size="large" color={AppTheme.primaryColor} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FontSizeProvider>
          <AppShell />
        </FontSizeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
