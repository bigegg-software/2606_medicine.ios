import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
  InteractionManager,
  type ImageSourcePropType,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import { useFontSize } from '@/common/FontSizeContext';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchFamilyBindMyList } from '@/store/actions/family';
import type { FamilyBindItem } from '@/api/familyBind';
import { getMessageUnreadCount } from '@/api/message';
import {
  buildChildFamilyBindNoticeMessage,
  buildChildFamilyBindNoticeTitle,
  confirmChildFamilyBindNoticeRemove,
  listChildFamilyBindNotices,
} from './utils/familyBindNoticeHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { buildMessageScopeParams, formatHomeUnreadBadge, MESSAGE_UNREAD_CHANGED, } from '@/src/features/message/utils/messageHelpers';
import homeStyles from '@/css/family/home';
import FamilyHomePage from './FamilyHomePage';
import FamilyDataPage from './FamilyData/FamilyDataPage';
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
  FamilyProfile: '我的档案',
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

function FamilyAlertHeaderButton() {
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
      onPress={() => navigation.navigate('FamilyTabs', { screen: 'FamilyAlert' })}
    >
      <Image source={require('@/assets/family/home/tip.png')} style={homeStyles.rightImg} />
      {badgeText ? (
        <View style={homeStyles.redDot} pointerEvents="none">
          <Text style={homeStyles.redDotText}>{badgeText}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function FamilyTabs() {
  const { scaleSize } = useFontSize();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const noticeRunningRef = useRef(false);
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

  const processFamilyBindNotices = useCallback(
    async (list: FamilyBindItem[]) => {
      const notices = listChildFamilyBindNotices(list);
      if (notices.length === 0 || noticeRunningRef.current) return;
      noticeRunningRef.current = true;
      try {
        // 等页面交互稳定后再弹窗，避免 focus 刷新把弹窗冲掉
        await new Promise<void>(resolve => {
          InteractionManager.runAfterInteractions(() => resolve());
        });
        for (const notice of notices) {
          const bindId = notice.item.id != null ? String(notice.item.id) : '';
          if (!bindId) continue;
          await new Promise<void>(resolve => {
            Alert.alert(
              buildChildFamilyBindNoticeTitle(notice),
              buildChildFamilyBindNoticeMessage(notice),
              [
                {
                  text: '确认',
                  onPress: () => {
                    void (async () => {
                      // 仅确认后调用解绑接口
                      const result = await confirmChildFamilyBindNoticeRemove(bindId);
                      if (!result.ok) {
                        Alert.alert('提示', result.msg ?? '操作失败，请稍后重试');
                      }
                      resolve();
                    })();
                  },
                },
              ],
              { cancelable: false },
            );
          });
        }
        await dispatch(fetchFamilyBindMyList({ force: true }));
      } finally {
        noticeRunningRef.current = false;
      }
    },
    [dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const list = await dispatch(fetchFamilyBindMyList({ force: true }));
        await processFamilyBindNotices(Array.isArray(list) ? list : []);
      })();
    }, [dispatch, processFamilyBindNotices]),
  );

  // 只更新 title，并清除非预警页可能残留的 headerRight
  const syncFamilyTabTitle = useCallback(
    (routeName: string) => {
      const title = FAMILY_TAB_TITLES[routeName as keyof FamilyTabParamList] ?? '首页';

      if (routeName === 'FamilyHome') {
        navigation.setOptions({
          title: '',
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: () => null,
          headerLeft: () => null,
          headerRight: () => <FamilyAlertHeaderButton />,
        });
        return;
      }

      if (routeName === 'FamilyAlert') {
        navigation.setOptions({
          title,
          headerTitle: undefined,
          headerLeft: undefined,
        });
        return;
      }

      if (routeName === 'FamilyProfile') {
        navigation.setOptions({
          title: '我的档案',
          headerTitle: undefined,
          headerLeft: undefined,
          headerRight: () => null,
        });
        return;
      }

      navigation.setOptions({
        title,
        headerTitle: undefined,
        headerLeft: undefined,
        headerRight: () => null,
      });
    },
    [navigation],
  );

  useEffect(() => {
    syncFamilyTabTitle('FamilyHome');
  }, [syncFamilyTabTitle]);

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
              source={require('@/assets/tabbar/data.png')}
              activeSource={require('@/assets/tabbar/dataActive.png')}
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
              source={require('@/assets/tabbar/warn.png')}
              activeSource={require('@/assets/tabbar/warnActive.png')}
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
