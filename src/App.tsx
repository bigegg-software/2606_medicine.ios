import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as AntdProvider } from '@ant-design/react-native';
import zhCN from '@ant-design/react-native/lib/locale-provider/zh_CN';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
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
import { updateExtrInfo } from '@/api/user';

function PushTokenReporter() {
  const isLogin = useSelector((state: RootState) => state.login.isLogin);

  // Report APNs push token after login
  useEffect(() => {
    if (!isLogin) return;
    if (Platform.OS !== 'ios') return;

    let cancelled = false;

    (async () => {
      try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        const token = (await Notifications.getDevicePushTokenAsync()).data;
        if (cancelled || !token) return;

        await updateExtrInfo({ iphoneDeviceToken: token });
      } catch {
        // silent
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLogin]);

  return null;
}

function AppShell() {
  const { option } = useFontSize();
  const theme = useMemo(() => buildScaledAntdTheme(option), [option]);

  return (
    <AntdProvider locale={zhCN} theme={theme}>
      <Provider store={store}>
        <PushTokenReporter />
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <RootStack />
          </NavigationContainer>
        </SafeAreaProvider>
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
      <FontSizeProvider>
        <AppShell />
      </FontSizeProvider>
    </GestureHandlerRootView>
  );
}
