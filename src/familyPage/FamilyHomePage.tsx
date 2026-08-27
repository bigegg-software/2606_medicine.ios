import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Pressable,
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
import { Flex, Toast } from '@ant-design/react-native';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchFamilyBindMyList, setSelectedFamilyKey } from '@/store/actions/family';
import { markMessageRead } from '@/api/message';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { normalizeIdentityPerspective } from '@/src/features/auth/utils/identityHelpers';
import {
  MESSAGE_UNREAD_CHANGED,
} from '@/src/features/message/utils/messageHelpers';
import {
  MESSAGE_NOT_FOUND_TOAST,
  navigateFromMessage,
} from '@/src/features/message/utils/messageNavigationHelpers';
import {
  buildFamilyHomeMemberCards,
  emptyFamilyHomeFocusSummary,
  formatFamilyHomeActivityProgressText,
  formatFamilyHomeFocusHealthText,
  formatFamilyHomeFocusProgressText,
  formatFamilyHomeTokensText,
  getFamilyHomeGreetingTitle,
  getFamilyHomeSubtitle,
  loadFamilyHomeAttentionMap,
  loadFamilyHomeActivityProgressMap,
  loadFamilyHomeFocusSummary,
  loadFamilyHomeTokensMap,
  resolveFamilyHomeActivityProgressPercent,
  type FamilyHomeFocusSummary,
} from './utils/familyHomeHelpers';
import {
  emptyFamilyHomeHealthSnapshot,
  loadFamilyHomeHealthMap,
  resolveFamilyHomeGlucoseTrendIcon,
  type FamilyHomeHealthSnapshot,
} from './utils/familyHomeHealthHelpers';
import {
  loadFamilyHomeWarningTodos,
  type FamilyHomeWarningTodoItem,
} from './utils/familyHomeWarningHelpers';
import {
  getApprovedFamilyBindList,
  getChildFamilyDisplayName,
  getFamilyTabKey,
  getFamilyTabLabel,
} from './utils/familyProfileHelpers';
import styles from '@/css/family/home';

export default function FamilyHomePage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector((state: RootState) => state.user.info);
  const systemUser = useSelector((state: RootState) => state.user.systemUser);
  const familyList = useSelector((state: RootState) => state.family.list);
  const selectedFamilyKey = useSelector((state: RootState) => state.family.selectedKey);
  const identityPerspective = systemUser?.identityPerspective;

  const [attentionMap, setAttentionMap] = useState<Record<string, boolean>>({});
  const [activityProgressMap, setActivityProgressMap] = useState<Record<string, number | null>>({});
  const [tokensMap, setTokensMap] = useState<Record<string, number | null>>({});
  const [healthMap, setHealthMap] = useState<Record<string, FamilyHomeHealthSnapshot>>({});
  const [focusSummary, setFocusSummary] = useState<FamilyHomeFocusSummary>(emptyFamilyHomeFocusSummary);
  const [warningTodos, setWarningTodos] = useState<FamilyHomeWarningTodoItem[]>([]);
  const [warningTodoTotal, setWarningTodoTotal] = useState(0);

  const greetingTitle = useMemo(
    () => getFamilyHomeGreetingTitle(userInfo, systemUser),
    [systemUser, userInfo],
  );
  const greetingSubtitle = useMemo(
    () => getFamilyHomeSubtitle(familyList, attentionMap),
    [attentionMap, familyList],
  );
  const memberCards = useMemo(
    () => buildFamilyHomeMemberCards(familyList),
    [familyList],
  );
  const approvedFamilyList = useMemo(
    () => getApprovedFamilyBindList(familyList),
    [familyList],
  );
  const selectedFamily = useMemo(() => {
    if (!selectedFamilyKey) return approvedFamilyList[0] ?? null;
    return (
      approvedFamilyList.find((item, index) => getFamilyTabKey(item, index) === selectedFamilyKey)
      ?? approvedFamilyList[0]
      ?? null
    );
  }, [approvedFamilyList, selectedFamilyKey]);
  const selectedPatientUserId = useMemo(() => {
    const id = selectedFamily?.patientUserId;
    return id != null ? String(id) : '';
  }, [selectedFamily]);
  const selectedRelationLabel = useMemo(() => {
    if (!selectedFamily) return '家人';
    return getFamilyTabLabel(selectedFamily);
  }, [selectedFamily]);
  const firstMember = memberCards[0];
  const goToFamilyData = useCallback(() => {
    navigation.navigate('FamilyTabs', { screen: 'FamilyData' });
  }, [navigation]);
  const firstExerciseRate = firstMember?.patientUserId
    ? activityProgressMap[firstMember.patientUserId]
    : null;

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchFamilyBindMyList());
    }, [dispatch]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const [attention, progress, tokens, health] = await Promise.all([
          loadFamilyHomeAttentionMap(familyList),
          loadFamilyHomeActivityProgressMap(familyList),
          loadFamilyHomeTokensMap(familyList),
          loadFamilyHomeHealthMap(familyList),
        ]);
        if (!cancelled) {
          setAttentionMap(attention);
          setActivityProgressMap(progress);
          setTokensMap(tokens);
          setHealthMap(health);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [familyList]),
  );

  useFocusEffect(
    useCallback(() => {
      const patientUserId = firstMember?.patientUserId ?? '';
      if (!patientUserId) {
        setFocusSummary(emptyFamilyHomeFocusSummary());
        return undefined;
      }
      let cancelled = false;
      void (async () => {
        const summary = await loadFamilyHomeFocusSummary(patientUserId);
        if (!cancelled) setFocusSummary(summary);
      })();
      return () => {
        cancelled = true;
      };
    }, [firstMember?.patientUserId]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const result = await loadFamilyHomeWarningTodos(familyList, identityPerspective);
        if (cancelled) return;
        setWarningTodos(result.items);
        setWarningTodoTotal(result.total);
      })();
      return () => {
        cancelled = true;
      };
    }, [familyList, identityPerspective]),
  );

  const handlePressWarningTodo = useCallback(
    async (item: FamilyHomeWarningTodoItem) => {
      if (item.unread) {
        try {
          const res = await markMessageRead(item.id, {
            identityPerspective: normalizeIdentityPerspective(identityPerspective) || 'child',
          });
          if (isResourceApiOk(res as { code?: number })) {
            setWarningTodos(prev =>
              prev.map(row => (row.id === item.id ? { ...row, unread: false } : row)),
            );
            DeviceEventEmitter.emit(MESSAGE_UNREAD_CHANGED);
          }
        } catch {
          // ignore
        }
      }

      const navResult = await navigateFromMessage(
        navigation,
        {
          type: item.raw.type,
          bizId: item.raw.bizId,
          messageId: item.raw.messageId,
          createTime: item.raw.createTime,
          userId: item.raw.userId ?? item.patientUserId,
          params: item.raw.params,
        },
        { isElder: false },
      );
      if (navResult.action === 'missing') {
        Toast.show(navResult.toast ?? MESSAGE_NOT_FOUND_TOAST);
      }
    },
    [identityPerspective, navigation],
  );

  return (
    <View style={styles.container}>
      <HeaderBack />
      <View style={[styles.floatingHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.floatingHeaderInner} pointerEvents="box-none">
          <Image source={require('@/assets/family/home/logo.png')} style={styles.miniLogo} />
        </View>
      </View>
      <View style={{ paddingTop: insets.top + 44 }} />
      <ScrollView>
        <View style={styles.developingWrap}>
          <Flex style={styles.topBox} justify="between" align="start">
            <View>
              <Text style={styles.topBoxTitle}>{greetingTitle}</Text>
              <Text style={styles.topBoxSubtitle} numberOfLines={1}>{greetingSubtitle}</Text>
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
            <View style={styles.todoHeader}>
              <Flex align="center">
                <View style={styles.todoBar} />
                {/* （{warningTodoTotal}项） */}
                <Text style={styles.todoTitle}>重要待办</Text>
              </Flex>
              <TouchableOpacity
                style={styles.todoRightHit}
                activeOpacity={0.85}
                disabled={!selectedPatientUserId}
                onPress={() => {
                  if (!selectedFamily || !selectedPatientUserId) return;
                  navigation.navigate('CalendarPage', {
                    readOnly: true,
                    patientUserId: selectedPatientUserId,
                    relationLabel: selectedRelationLabel,
                    displayName: getChildFamilyDisplayName(selectedFamily),
                  });
                }}
              >
                <Image
                  source={require('@/assets/family/home/icon_rl.png')}
                  style={styles.todoRightIcon}
                />
              </TouchableOpacity>
            </View>
            {warningTodos.length === 0 ? (
              <FamilyHomeEmpty />
            ) : (
              warningTodos.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.todoItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    void handlePressWarningTodo(item);
                  }}
                >
                  <Flex align="center">
                    {item.unread && <View style={styles.todoDot} />}
                    <Text style={styles.todoItemText} numberOfLines={1}>
                      {item.text}
                    </Text>
                    <View style={styles.todoTag}>
                      <Text style={styles.todoTagText}>{item.relationLabel}</Text>
                    </View>
                  </Flex>
                </TouchableOpacity>
              ))
            )}
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
            {memberCards.map(member => {
              const snapshot =
                (member.patientUserId && healthMap[member.patientUserId])
                || emptyFamilyHomeHealthSnapshot();
              return (
                <Pressable key={member.key} onPress={() => {
                  dispatch(setSelectedFamilyKey(member.key));
                  if (member.pending) {
                    if (!member.bindId) return;
                    navigation.navigate('FamilyBindInvitePage', { id: member.bindId });
                    return;
                  }
                  navigation.navigate('FamilyTabs', { screen: 'FamilyData' });
                }}>
                  <View style={styles.familyHealthItem}>
                    {member.pending ? (
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        style={{ paddingVertical: 17 }}
                      >
                        <Image
                          source={member.avatarSource}
                          style={styles.familyHealthAddIcon}
                        />
                        <Text style={[styles.familyHealthName, { marginLeft: 0, marginTop: 8 }]}>
                          {member.name}
                        </Text>
                        <Text style={styles.familyHealthPendingText}>等待确认中</Text>
                      </Flex>
                    ) : (
                      <>
                        <Flex align="center">
                          <Image
                            source={member.avatarSource}
                            style={styles.familyHealthIcon}
                          />
                          <Text style={styles.familyHealthName}>{member.name}</Text>
                        </Flex>
                        {snapshot.rows.map((row, index) => {
                          const glucoseTrendIcon =
                            row.key === '血糖'
                              ? resolveFamilyHomeGlucoseTrendIcon(row.glucoseTrend)
                              : null;
                          return (
                            <Flex
                              key={row.key}
                              style={[
                                styles.familyHealthRow,
                                index === 0 && styles.familyHealthRowFirst,
                              ]}
                              justify="between"
                              align="center"
                            >
                              <Text style={styles.familyHealthLabel}>{row.key}</Text>
                              <Flex align="center">
                                <Text style={styles.familyHealthValue}>{row.value}</Text>
                                {glucoseTrendIcon ? (
                                  <Image
                                    source={glucoseTrendIcon}
                                    style={styles.familyHealthTrendIcon}
                                  />
                                ) : null}
                              </Flex>
                            </Flex>
                          );
                        })}
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}
            <TouchableOpacity
              key="add-family"
              style={styles.familyHealthItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('FamilyAddPage')}
            >
              <Flex
                direction="column"
                align="center"
                justify="center"
                style={{ paddingVertical: 30 }}
              >
                <Image
                  source={require('@/assets/family/home/add.png')}
                  style={styles.familyHealthAddIcon}
                />
                <Text style={styles.familyHealthAddText}>添加家人</Text>
              </Flex>
            </TouchableOpacity>
          </ScrollView>

          <Flex align="center" style={styles.todoTitleWrap}>
            <View style={styles.todoBar} />
            <Text style={styles.todoTitle}>重点关注</Text>
          </Flex>

          <Flex style={styles.focusCardWrap}>
            <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} onPress={goToFamilyData}>
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
                <Text style={styles.focusCardSubtitle}>
                  {formatFamilyHomeFocusHealthText(focusSummary.healthAbnormalCount)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} onPress={goToFamilyData}>
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
                <Text style={styles.focusCardSubtitle}>
                  {formatFamilyHomeFocusProgressText(firstExerciseRate)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} onPress={goToFamilyData}>
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
                <Text style={styles.focusCardSubtitle}>
                  {formatFamilyHomeFocusProgressText(focusSummary.nutritionRate)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Flex>

          <Flex align="center" style={styles.todoTitleWrap}>
            <View style={styles.todoBar} />
            <Text style={styles.todoTitle}>家人本周活跃度</Text>
          </Flex>

          {memberCards.length === 0 ? (
            <View style={styles.activityScroll}>
              <FamilyHomeEmpty />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activityScroll}
            >
              {memberCards.map(member => {
                const rate = member.patientUserId
                  ? activityProgressMap[member.patientUserId]
                  : null;
                const tokens = member.patientUserId
                  ? tokensMap[member.patientUserId]
                  : null;
                const percent = resolveFamilyHomeActivityProgressPercent(rate);
                return (
                  <View key={`activity-${member.key}`} style={styles.activityCard}>
                    <Flex align="center" justify="between">
                      <Text style={styles.activityName}>{member.name}</Text>
                      <Flex align="center">
                        <Image
                          source={require('@/assets/family/home/icon_jf.png')}
                          style={styles.activityPointsIcon}
                        />
                        <Text style={styles.activityPoints}>
                          {formatFamilyHomeTokensText(tokens)}
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex style={styles.activityProgressRow} align="center" justify="between">
                      <Text style={styles.activityProgressLabel}>运动处方进度</Text>
                      <Text style={styles.activityProgressValue}>
                        {formatFamilyHomeActivityProgressText(rate)}
                      </Text>
                    </Flex>
                    <View style={styles.activityProgressTrack}>
                      <View
                        style={[
                          styles.activityProgressFill,
                          { width: `${percent}%` as `${number}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FamilyHomeEmpty() {
  return (
    <View style={styles.emptyWrap}>
      <Image
        source={require('@/assets/family/home/empty.png')}
        style={styles.emptyIcon}
        resizeMode="contain"
      />
      <Text style={styles.emptyText}>暂无数据</Text>
    </View>
  );
}
