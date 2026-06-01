import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';
import HomeTab from '@/src/features/home/HomeTab';
import SchedulePage from '@/src/features/schedule/SchedulePage';
import AssistantPage from '@/src/features/assistant/AssistantPage';
import CommunityPage from '@/src/features/community/CommunityPage';
import ProfilePage from '@/src/features/profile/ProfilePage';

export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Assistant: undefined;
  Community: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.primaryColor,
        tabBarInactiveTintColor: AppTheme.textSecondary,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{ tabBarLabel: '首页', tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size ?? 28} color={color} /> }}
      />
      <Tab.Screen
        name="Schedule"
        component={SchedulePage}
        options={{ tabBarLabel: '安排', tabBarIcon: ({ color, size }) => <MaterialIcons name="calendar-month" size={size ?? 28} color={color} /> }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantPage}
        options={{ tabBarLabel: '管家', tabBarIcon: ({ color, size }) => <MaterialIcons name="smart-toy" size={size ?? 28} color={color} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityPage}
        options={{ tabBarLabel: '社区', tabBarIcon: ({ color, size }) => <MaterialIcons name="groups" size={size ?? 28} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{ tabBarLabel: '我的', tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size ?? 28} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
