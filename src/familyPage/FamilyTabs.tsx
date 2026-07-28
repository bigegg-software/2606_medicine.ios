import React, { useCallback, useEffect, useMemo } from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { RootStackParamList } from '@/route/router';
import FamilyHomePage from './FamilyHomePage';
import FamilyDataPage from './FamilyDataPage';
import FamilyAlertPage from './FamilyAlertPage';
import FamilyProfilePage from './FamilyProfilePage';

export type FamilyTabParamList = {
  FamilyHome: undefined;
  FamilyData: undefined;
  FamilyAlert: undefined;
  FamilyProfile: undefined;
};

const FAMILY_TAB_TITLES: Record<keyof FamilyTabParamList, string> = {
  FamilyHome: '首页',
  FamilyData: '数据',
  FamilyAlert: '预警',
  FamilyProfile: '我的',
};

const Tab = createBottomTabNavigator<FamilyTabParamList>();

function TabIcon({
  focused,
  source,
  activeSource,
}: {
  focused: boolean;
  source: ImageSourcePropType;
  activeSource: ImageSourcePropType;
}) {
  return (
    <Image
      source={focused ? activeSource : source}
      style={{ width: 28, height: 28 }}
    />
  );
}

export default function FamilyTabs() {
  const { scaleSize } = useFontSize();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabBarLabelStyle = useMemo(
    () => ({ fontSize: scaleSize(14), fontWeight: '600' as const }),
    [scaleSize],
  );
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: '#FFFFFF',
      borderTopWidth: 0,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    }),
    [],
  );

  // 只更新 title，并清除非预警页可能残留的 headerRight
  const syncFamilyTabTitle = useCallback(
    (routeName: string) => {
      const title = FAMILY_TAB_TITLES[routeName as keyof FamilyTabParamList] ?? '首页';
      if (routeName === 'FamilyAlert') {
        navigation.setOptions({ title });
        return;
      }
      navigation.setOptions({
        title,
        headerRight: () => null,
      });
    },
    [navigation],
  );

  useEffect(() => {
    navigation.setOptions({
      title: FAMILY_TAB_TITLES.FamilyHome,
      headerRight: () => null,
    });
  }, [navigation]);

  return (
    <Tab.Navigator
      screenListeners={{
        state: event => {
          const tabState = event.data.state;
          if (!tabState) return;
          const route = tabState.routes[tabState.index];
          syncFamilyTabTitle(route.name);
        },
      }}
      screenOptions={{
        headerShown: false,
        // 预挂载各 Tab，避免首次切入时白屏/闪一下
        lazy: false,
        tabBarActiveTintColor: AppTheme.primaryColor,
        tabBarInactiveTintColor: AppTheme.textSecondary,
        tabBarLabelStyle,
        tabBarStyle,
      }}>
      <Tab.Screen
        name="FamilyHome"
        component={FamilyHomePage}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('@/assets/tabbar/home.png')}
              activeSource={require('@/assets/tabbar/homeActive.png')}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FamilyData"
        component={FamilyDataPage}
        options={{
          tabBarLabel: '数据',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('@/assets/tabbar/community.png')}
              activeSource={require('@/assets/tabbar/communityActive.png')}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FamilyAlert"
        component={FamilyAlertPage}
        options={{
          tabBarLabel: '预警',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('@/assets/tabbar/time.png')}
              activeSource={require('@/assets/tabbar/timeActive.png')}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FamilyProfile"
        component={FamilyProfilePage}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('@/assets/tabbar/user.png')}
              activeSource={require('@/assets/tabbar/userActive.png')}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
