import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as AntdProvider } from '@ant-design/react-native';
import zhCN from '@ant-design/react-native/lib/locale-provider/zh_CN';
import { useFonts } from 'expo-font';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store, { type AppDispatch, type RootState } from '@/store/store';
import { fetchUserSession } from '@/store/actions/user';
import { navigationRef } from '@/utils/navigationRef';
import RootStack from '@/route/router';
import { getToken } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { buildScaledAntdTheme } from '@/common/antdTheme';
import { FontSizeProvider, useFontSize } from '@/common/FontSizeContext';
import { AppTheme } from '@/common/theme';
import { checkAutoSyncOnLaunch } from '@/utils/checkAutoSyncOnLaunch';
import { addPushNotificationListeners, registerIosPushToken, syncNotificationSettingsFromUserExtr } from '@/src/utils/pushNotifications';
import SyncReminderWatcher from '@/src/components/SyncReminderWatcher';
import SessionExpiredWatcher from '@/src/components/SessionExpiredWatcher';
import UploadProgressBar from '@/src/components/UploadProgressBar';

function AutoSyncOnLaunch() {
  const isLogin = useSelector((state: RootState) => state.login.isLogin);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const userId = useSelector((state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId);
  const autoSyncData = userExtr?.autoSyncData;
  const checkedRef = React.useRef(false);

  useEffect(() => {
    if (checkedRef.current || !isLogin || !userId || userExtr == null) return;
    if (Platform.OS !== 'ios') {
      checkedRef.current = true;
      return;
    }

    checkedRef.current = true;
    if (autoSyncData === 1) {
      void checkAutoSyncOnLaunch(userId, autoSyncData);
    }
  }, [autoSyncData, isLogin, userExtr, userId]);

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
