import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
  type ImageSourcePropType,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Toast } from '@ant-design/react-native';
import HomeTab from '@/src/features/home/HomeTab';
import SchedulePage from '@/src/features/schedule/SchedulePage';
import CommunityPage from '@/src/features/community/CommunityPage';
import ProfilePage from '@/src/features/profile/ProfilePage';
import AcceptAiPromptModal from '@/src/features/profile/settingPage/components/AcceptAiPromptModal';
import { updateExtrInfo } from '@/api/user';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import { getMainTabTitle, setActiveMainTabTitle, type MainTabParamList } from '@/src/utils/tabNavigation';
import type { RootStackParamList } from '@/route/router';
import homeStyles from '@/css/home/home';
import { getMessageUnreadCount } from '@/api/message';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildMessageScopeParams,
  formatHomeUnreadBadge,
  MESSAGE_UNREAD_CHANGED,
} from '@/src/features/message/utils/messageHelpers';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';

export type { MainTabParamList };

const HomeTabScreen = HomeTab;
const ScheduleTabScreen = SchedulePage;
const CommunityTabScreen = CommunityPage;
const ProfileTabScreen = ProfilePage;

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyTabScreen() {
  return null;
}

function MessageHeaderButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const identityPerspective = useSelector(
    (state: RootState) => state.user.systemUser?.identityPerspective,
  );
  const userId = useSelector(
    (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
  );
  const messageScope = useMemo(
    () => buildMessageScopeParams({ identityPerspective, userId }),
    [identityPerspective, userId],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const badgeText = formatHomeUnreadBadge(unreadCount);

  const loadUnreadCount = useCallback(async () => {
    if (!messageScope.userIds) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = (await getMessageUnreadCount(messageScope)) as unknown as {
        code?: number;
        data?: number;
      };
      if (!isResourceApiOk(res)) {
        setUnreadCount(0);
        return;
      }
      setUnreadCount(Number(apiResourceData<number>(res) ?? 0));
    } catch {
      setUnreadCount(0);
    }
  }, [messageScope]);

  useFocusEffect(
    useCallback(() => {
      void loadUnreadCount();
    }, [loadUnreadCount]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(MESSAGE_UNREAD_CHANGED, () => {
      void loadUnreadCount();
    });
    return () => sub.remove();
  }, [loadUnreadCount]);

  return (
    <TouchableOpacity
      style={[homeStyles.topRight, { marginRight: 18 }]}
      activeOpacity={0.8}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={() => navigation.navigate('MessagePage')}
    >
      <Image source={require('@/assets/images/home/tip.png')} style={homeStyles.rightImg} />
      {badgeText ? (
        <View style={homeStyles.redDot} pointerEvents="none">
          <Text style={homeStyles.redDotText}>{badgeText}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function TabIcon({
  focused,
  source,
  activeSource,
  focusedMarginLeft,
}: {
  focused: boolean;
  source: ImageSourcePropType;
  activeSource: ImageSourcePropType;
  focusedMarginLeft?: number;
}) {
  return (
    <Image
      source={focused ? activeSource : source}
      style={{
        width: 28,
        height: 28,
        marginLeft: focusedMarginLeft ?? 0,
      }}
    />
  );
}

export default function MainTabs() {
  const { scaleSize } = useFontSize();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const acceptAiAuthorized = userExtr?.acceptAi !== 0;
  const [acceptAiModalVisible, setAcceptAiModalVisible] = useState(false);
  const [savingAcceptAi, setSavingAcceptAi] = useState(false);
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

  const openAssistantPage = useCallback(() => {
    navigation.navigate('AssistantPage');
  }, [navigation]);

  const handleAssistantTabPress = useCallback(() => {
    if (!acceptAiAuthorized) {
      setAcceptAiModalVisible(true);
      return;
    }
    openAssistantPage();
  }, [acceptAiAuthorized, openAssistantPage]);

  const handleAcceptAiCancel = useCallback(() => {
    if (savingAcceptAi) return;
    setAcceptAiModalVisible(false);
  }, [savingAcceptAi]);

  const handleAcceptAiConfirm = useCallback(async () => {
    if (savingAcceptAi) return;
    setSavingAcceptAi(true);
    try {
      const res = await updateExtrInfo({ acceptAi: 1 });
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '授权失败，请稍后重试', 1.5);
        return;
      }
      if (userExtr) {
        dispatch({
          type: SET_USER_EXTR,
          payload: {
            ...userExtr,
            acceptAi: 1,
          },
        });
      }
      setAcceptAiModalVisible(false);
      openAssistantPage();
    } catch {
      Toast.show('网络错误，请稍后重试', 1.5);
    } finally {
      setSavingAcceptAi(false);
    }
  }, [dispatch, openAssistantPage, savingAcceptAi, userExtr]);

  const syncMainTabTitle = useCallback(
    (routeName: string) => {
      const title = routeName === 'Home' ? '' : getMainTabTitle(routeName);
      setActiveMainTabTitle(title);

      if (routeName === 'Home') {
        navigation.setOptions({
          title: '',
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: () => null,
          headerLeft: () => null,
          headerRight: () => <MessageHeaderButton />,
        });
        return;
      }

      if (routeName === 'Schedule') {
        navigation.setOptions({
          title,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: undefined,
          headerLeft: undefined,
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 18 }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => navigation.navigate('CalendarPage')}
            >
              <Image
                source={require('@/assets/images/schedule/time.png')}
                style={{ width: 24, height: 24 }}
              />
            </TouchableOpacity>
          ),
        });
        return;
      }

      // headerRight 必须显式设为 () => null；undefined 不会清除已有按钮
      navigation.setOptions({
        title,
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerTitle: undefined,
        headerLeft: undefined,
        headerRight: () => null,
      });
    },
    [navigation],
  );

  return (
    <>
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
          tabBarStyle,
        }}>
        <Tab.Screen
          name="Home"
          component={HomeTabScreen}
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
          name="Schedule"
          component={ScheduleTabScreen}
          options={{
            tabBarLabel: '里程碑',
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
          name="Assistant"
          component={EmptyTabScreen}
          listeners={() => ({
            tabPress: e => {
              e.preventDefault();
              handleAssistantTabPress();
            },
          })}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => (
              <Image source={require('@/assets/tabbar/gj.png')} style={{ width: 80, height: 80 }} />
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
              <TabIcon
                focused={focused}
                source={require('@/assets/tabbar/community.png')}
                activeSource={require('@/assets/tabbar/communityActive.png')}
                focusedMarginLeft={-2}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileTabScreen}
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

      <AcceptAiPromptModal
        visible={acceptAiModalVisible}
        enabling
        saving={savingAcceptAi}
        onCancel={handleAcceptAiCancel}
        onConfirm={() => {
          void handleAcceptAiConfirm();
        }}
      />
    </>
  );
}
