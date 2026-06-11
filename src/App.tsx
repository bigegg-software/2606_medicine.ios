import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as AntdProvider } from '@ant-design/react-native';
import zhCN from '@ant-design/react-native/lib/locale-provider/zh_CN';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store, { type AppDispatch } from '@/store/store';
import { fetchUserSession } from '@/store/actions/user';
import { navigationRef } from '@/utils/navigationRef';
import RootStack from '@/route/router';
import { getToken } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { buildScaledAntdTheme } from '@/common/antdTheme';
import { FontSizeProvider, useFontSize } from '@/common/FontSizeContext';
import { AppTheme } from '@/common/theme';

function AppShell() {
  const { option } = useFontSize();
  const theme = useMemo(() => buildScaledAntdTheme(option), [option]);

  return (
    <AntdProvider locale={zhCN} theme={theme}>
      <Provider store={store}>
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
