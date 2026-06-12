import React, { useEffect, useMemo } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeTab from '@/src/features/home/HomeTab';
import SchedulePage from '@/src/features/schedule/SchedulePage';
import CommunityPage from '@/src/features/community/CommunityPage';
import ProfilePage from '@/src/features/profile/ProfilePage';
import withUploadProgress from '@/src/components/withUploadProgress';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import { getMainTabTitle, setActiveMainTabTitle, type MainTabParamList } from '@/src/utils/tabNavigation';
import type { RootStackParamList } from '@/route/router';

export type { MainTabParamList };

const HomeTabScreen = withUploadProgress(HomeTab);
const ScheduleTabScreen = withUploadProgress(SchedulePage);
const CommunityTabScreen = withUploadProgress(CommunityPage);
const ProfileTabScreen = withUploadProgress(ProfilePage);

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyTabScreen() {
  return null;
}

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabBarLabelStyle = useMemo(
    () => ({ fontSize: scaleSize(14), fontWeight: '600' as const }),
    [scaleSize],
  );

  const syncMainTabTitle = (routeName: string) => {
    const title = getMainTabTitle(routeName);
    setActiveMainTabTitle(title);
    navigation.setOptions({ title });
  };

  useEffect(() => {
    syncMainTabTitle('Home');
  }, [navigation]);

  return (
    <Tab.Navigator
      screenListeners={{
        state: event => {
          const tabState = event.data.state;
          if (!tabState) return;
          const route = tabState.routes[tabState.index];
          syncMainTabTitle(route.name);
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.primaryColor,
        tabBarInactiveTintColor: AppTheme.textSecondary,
        tabBarLabelStyle,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeTabScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={require('@/assets/tabbar/home.png')} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleTabScreen}
        options={{
          tabBarLabel: '安排',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={require('@/assets/tabbar/time.png')} />,
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={EmptyTabScreen}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.getParent()?.navigate('AssistantPage');
          },
        })}
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
        component={CommunityTabScreen}
        options={{
          tabBarLabel: '社区',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={require('@/assets/tabbar/community.png')} focusedMarginLeft={-2} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={require('@/assets/tabbar/user.png')} />,
        }}
      />
    </Tab.Navigator>
  );
}
