import React, { useMemo } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeTab from '@/src/features/home/HomeTab';
import SchedulePage from '@/src/features/schedule/SchedulePage';
import AssistantPage from '@/src/features/assistant/AssistantPage';
import CommunityPage from '@/src/features/community/CommunityPage';
import ProfilePage from '@/src/features/profile/ProfilePage';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Assistant: undefined;
  Community: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();


function TabIcon({ focused, source, focusedMarginLeft }: {
  focused: boolean;
  source: ImageSourcePropType;
  focusedMarginLeft?: number;
}) {
  return (
    <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
      {focused ? (
        <Image source={require('@/assets/tabbar/select.png')}
          style={{ position: 'absolute', width: 30, height: 30 }}
        />
      ) : null}
      <Image source={source}
        style={{
          width: 28,
          height: 28,
          tintColor: focused ? AppTheme.primaryColor : AppTheme.textSecondary,
          marginLeft: focusedMarginLeft !== undefined ? focusedMarginLeft : 0,
        }}
      />
    </View>
  );
}

export default function MainTabs() {
  const { scaleSize } = useFontSize();
  const tabBarLabelStyle = useMemo(
    () => ({ fontSize: scaleSize(14), fontWeight: '600' as const }),
    [scaleSize],
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.primaryColor,
        tabBarInactiveTintColor: AppTheme.textSecondary,
        tabBarLabelStyle,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={require('@/assets/tabbar/home.png')} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={SchedulePage}
        options={{
          tabBarLabel: '安排',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={require('@/assets/tabbar/time.png')} />,
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantPage}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <Image source={require('@/assets/tabbar/gj.png')} style={{ width: 66, height: 66 }} />
          ),
          tabBarIconStyle: { marginTop: -2 },
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityPage}
        options={{
          tabBarLabel: '社区',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={require('@/assets/tabbar/community.png')} focusedMarginLeft={-2} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={require('@/assets/tabbar/user.png')} />,
        }}
      />
    </Tab.Navigator>
  );
}
