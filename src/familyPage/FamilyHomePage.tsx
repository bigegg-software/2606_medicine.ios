import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import HeaderBack from '@/src/components/HeaderBack';
import { Flex } from '@ant-design/react-native';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchFamilyBindMyList } from '@/store/actions/family';
import type { DictDataItem } from '@/api/dict';
import { getMessageUnreadCount } from '@/api/message';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildMessageScopeParams,
  formatHomeUnreadBadge,
  MESSAGE_UNREAD_CHANGED,
} from '@/src/features/message/utils/messageHelpers';
import {
  buildFamilyHomeMemberCards,
  getFamilyHomeGreetingTitle,
  getFamilyHomeSubtitle,
} from './utils/familyHomeHelpers';
import styles from '@/css/family/home';

export default function FamilyHomePage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const identityPerspective = useSelector(
    (state: RootState) => state.user.systemUser?.identityPerspective,
  );
  const userId = useSelector(
    (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
  );
  const userInfo = useSelector((state: RootState) => state.user.info);
  const systemUser = useSelector((state: RootState) => state.user.systemUser);
  const familyList = useSelector((state: RootState) => state.family.list);

  const messageScope = useMemo(
    () => buildMessageScopeParams({ identityPerspective, userId }),
    [identityPerspective, userId],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const badgeText = formatHomeUnreadBadge(unreadCount);

  const relationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationOptions.forEach(item => {
      const value = String(item.dictValue ?? '');
      if (!value) return;
      map[value] = item.dictLabel || value;
    });
    return map;
  }, [relationOptions]);

  const greetingTitle = useMemo(
    () => getFamilyHomeGreetingTitle(userInfo, systemUser),
    [systemUser, userInfo],
  );
  const greetingSubtitle = useMemo(
    () => getFamilyHomeSubtitle(familyList, relationLabelMap),
    [familyList, relationLabelMap],
  );
  const memberCards = useMemo(
    () => buildFamilyHomeMemberCards(familyList, relationLabelMap),
    [familyList, relationLabelMap],
  );

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

  useEffect(() => {
    void (async () => {
      try {
        const options = await loadRelationTypeOptions();
        setRelationOptions(options);
      } catch {
        setRelationOptions([]);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchFamilyBindMyList());
      void loadUnreadCount();
    }, [dispatch, loadUnreadCount]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(MESSAGE_UNREAD_CHANGED, () => {
      void loadUnreadCount();
    });
    return () => sub.remove();
  }, [loadUnreadCount]);

  return (
    <View style={styles.container}>
      <HeaderBack />
      <View style={[styles.floatingHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.floatingHeaderInner} pointerEvents="box-none">
          <Image source={require('@/assets/family/home/logo.png')} style={styles.miniLogo} />
          <TouchableOpacity
            style={styles.topRight}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.navigate('MessagePage')}
          >
            <Image source={require('@/assets/family/home/tip.png')} style={styles.rightImg} />
            {badgeText ? (
              <View style={styles.redDot} pointerEvents="none">
                <Text style={styles.redDotText}>{badgeText}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ paddingTop: insets.top + 44 }} />
      <ScrollView>
        <View style={styles.developingWrap}>
          <Flex style={styles.topBox} justify="between" align="start">
            <View>
              <Text style={styles.topBoxTitle}>{greetingTitle}</Text>
              <Text style={styles.topBoxSubtitle}>{greetingSubtitle}</Text>
            </View>

            <Image source={require('@/assets/family/home/img.png')} style={styles.topBoxImg} />
          </Flex>

          <LinearGradient
            colors={['#E4EFDD', 'rgba(255,255,255,0)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.todoCard}
          >
            <Flex align="center" justify="between">
              <Flex align="center">
                <View style={styles.todoBar} />
                <Text style={styles.todoTitle}>重要待办（2项）</Text>
              </Flex>
              <Image
                source={require('@/assets/family/home/icon_rl.png')}
                style={styles.todoRightIcon}
              />
            </Flex>
            <Flex style={[styles.todoItem, { marginTop: 12 }]} align="center" justify="between">
              <Flex align="center" style={{ flex: 1 }}>
                <View style={styles.todoDot} />
                <Text style={styles.todoItemText}>母亲血糖偏高 (7.2)</Text>
              </Flex>
              <View style={styles.todoTag}>
                <Text style={styles.todoTagText}>建议今日复查</Text>
              </View>
            </Flex>
            <Flex style={styles.todoItem} align="center" justify="between">
              <Flex align="center" style={{ flex: 1 }}>
                <View style={styles.todoDot} />
                <Text style={styles.todoItemText}>母亲血糖偏高 (7.2)</Text>
              </Flex>
              <View style={styles.todoTag}>
                <Text style={styles.todoTagText}>建议今日复查</Text>
              </View>
            </Flex>
          </LinearGradient>

          <Flex align="center" style={styles.todoTitleWrap}>
            <View style={styles.todoBar} />
            <Text style={styles.todoTitle}>家人健康速览</Text>
          </Flex>

          <ScrollView
            horizontal
            style={styles.familyHealthWrap}
            showsHorizontalScrollIndicator={false}
          >
            {memberCards.map(member => (
              <View key={member.key} style={styles.familyHealthItem}>
                <Flex align="center">
                  <Image
                    source={require('@/assets/images/default/default1.png')}
                    style={styles.familyHealthIcon}
                  />
                  <Text style={styles.familyHealthName}>{member.name}</Text>
                </Flex>
                <Flex
                  style={[styles.familyHealthRow, styles.familyHealthRowFirst]}
                  justify="between"
                  align="center"
                >
                  <Text style={styles.familyHealthLabel}>血压</Text>
                  <Text style={styles.familyHealthValue}>--</Text>
                </Flex>
                <Flex style={styles.familyHealthRow} justify="between" align="center">
                  <Text style={styles.familyHealthLabel}>血糖</Text>
                  <Text style={styles.familyHealthValue}>--</Text>
                </Flex>
                <Flex style={styles.familyHealthRow} justify="between" align="center">
                  <Text style={styles.familyHealthLabel}>步数</Text>
                  <Text style={styles.familyHealthValue}>--</Text>
                </Flex>
                <Flex style={styles.familyHealthRow} justify="between" align="center">
                  <Text style={styles.familyHealthLabel}>用药</Text>
                  <Text style={styles.familyHealthValue}>--</Text>
                </Flex>
              </View>
            ))}
            <Flex
              style={styles.familyHealthItem}
              direction="column"
              align="center"
              justify="center"
            >
              <Image
                source={require('@/assets/family/home/add.png')}
                style={styles.familyHealthAddIcon}
              />
              <Text style={styles.familyHealthAddText}>添加家人</Text>
            </Flex>
          </ScrollView>

          <Flex align="center" style={styles.todoTitleWrap}>
            <View style={styles.todoBar} />
            <Text style={styles.todoTitle}>重点关注</Text>
          </Flex>

          <Flex style={styles.focusCardWrap}>
            <LinearGradient
              colors={['#F5FFF0', '#FFFFFF']}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.focusCard}
            >
              <Image
                source={require('@/assets/family/home/icon_data.png')}
                style={styles.focusCardIcon}
              />
              <Text style={styles.focusCardTitle}>健康数据</Text>
              <Text style={styles.focusCardSubtitle}>2项异常</Text>
            </LinearGradient>
            <LinearGradient
              colors={['#E6F1FF', '#FFFFFF']}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.focusCard}
            >
              <Image
                source={require('@/assets/family/home/icon_yd.png')}
                style={styles.focusCardIcon}
              />
              <Text style={styles.focusCardTitle}>运动处方</Text>
              <Text style={styles.focusCardSubtitle}>进度 30%</Text>
            </LinearGradient>
            <LinearGradient
              colors={['#FEF3F3', '#FFFFFF']}
              locations={[0, 0.3689]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.focusCard}
            >
              <Image
                source={require('@/assets/family/home/icon_yy.png')}
                style={styles.focusCardIcon}
              />
              <Text style={styles.focusCardTitle}>营养处方</Text>
              <Text style={styles.focusCardSubtitle}>进度 40%</Text>
            </LinearGradient>
          </Flex>

          <Flex align="center" style={styles.todoTitleWrap}>
            <View style={styles.todoBar} />
            <Text style={styles.todoTitle}>家人本周活跃度</Text>
          </Flex>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activityScroll}
          >
            {memberCards.map(member => (
              <View key={`activity-${member.key}`} style={styles.activityCard}>
                <Flex align="center" justify="between">
                  <Text style={styles.activityName}>{member.name}</Text>
                  <Flex align="center">
                    <Image
                      source={require('@/assets/family/home/icon_jf.png')}
                      style={styles.activityPointsIcon}
                    />
                    <Text style={styles.activityPoints}>--</Text>
                  </Flex>
                </Flex>
                <Flex style={styles.activityProgressRow} align="center" justify="between">
                  <Text style={styles.activityProgressLabel}>运动处方进度</Text>
                  <Text style={styles.activityProgressValue}>--</Text>
                </Flex>
                <View style={styles.activityProgressTrack}>
                  <View style={[styles.activityProgressFill, { width: '0%' }]} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
