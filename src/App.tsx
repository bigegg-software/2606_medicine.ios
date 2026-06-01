import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as AntdProvider } from '@ant-design/react-native';
import zhCN from '@ant-design/react-native/lib/locale-provider/zh_CN';
import { useFonts } from 'expo-font';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import store from '@/store/store';
import { navigationRef } from '@/utils/navigationRef';
import RootStack from '@/route/router';
import { getToken } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { antdTheme } from '@/common/antdTheme';
import { AppTheme } from '@/common/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
  });

  useEffect(() => {
    (async () => {
      const token = await getToken();
      store.dispatch({ type: SET_LOGIN, payload: !!(token && token.length > 0) });
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
      <AntdProvider locale={zhCN} theme={antdTheme}>
        <Provider store={store}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <NavigationContainer ref={navigationRef}>
              <RootStack />
            </NavigationContainer>
          </SafeAreaProvider>
        </Provider>
      </AntdProvider>
    </GestureHandlerRootView>
  );
}
