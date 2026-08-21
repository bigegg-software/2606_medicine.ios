import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { TabPageLayout } from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { logout as logoutApi } from '@/api/auth';
import { clearAll } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { fetchUserSession, clearUser } from '@/store/actions/user';
import { SET_UPLOADING, SET_UPLOAD_PROGRESS } from '@/store/type/upload';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  fetchFamilyBindMyList,
  setSelectedFamilyKey,
} from '@/store/actions/family';
import {
  getIdentityLabel,
  switchIdentityPerspective,
} from '@/src/features/auth/utils/identityHelpers';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import { AppTheme } from '@/common/theme';
import type { UserBaseInfo } from '@/api/patient';
import { loadHealthRecordFamilyUser } from '@/src/features/profile/healthRecord/utils/healthRecordFamilyHelpers';
import {
  FAMILY_DEVICE_ITEMS,
  formatFamilyDeviceStatusText,
  getChildFamilyDisplayName,
  getChildFamilyMetaLine,
  getDisplayFamilyBindList,
  getFamilyTabKey,
  getFamilyTabLabel,
  isFamilyBindPending,
  resolveChildFamilyAvatarSource,
  type FamilyMemberInfoRow,
} from './utils/familyProfileHelpers';
import {
  emptyFamilyMemberInfoRows,
  loadFamilyMemberInfoRows,
} from './utils/familyMemberInfoHelpers';
import {
  buildFamilyBindRemoveConfirmMessage,
  removeFamilyBindById,
} from './utils/familyProfileRemoveHelpers';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import FamilyRelationProofModal from './components/FamilyRelationProofModal';
import styles from '@/css/family/profile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyProfilePage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const familyListRaw = useSelector((s: RootState) => s.family.list);
  const loadingFamily = useSelector((s: RootState) => s.family.loading);
  const selectedFamilyKey = useSelector((s: RootState) => s.family.selectedKey);
  const [switchingIdentity, setSwitchingIdentity] = useState(false);
  const [removingFamily, setRemovingFamily] = useState(false);
  const [relationProofVisible, setRelationProofVisible] = useState(false);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const [memberInfoRows, setMemberInfoRows] = useState<FamilyMemberInfoRow[]>(
    emptyFamilyMemberInfoRows,
  );
  const [memberUser, setMemberUser] = useState<UserBaseInfo | null>(null);
  const identityLabel = getIdentityLabel(systemUser?.identityPerspective);
  const submitterName = getDisplayUserName(undefined, systemUser);

  const familyList = useMemo(
    () => getDisplayFamilyBindList(familyListRaw),
    [familyListRaw],
  );

  const selectedFamily = useMemo(() => {
    if (!selectedFamilyKey) return familyList[0] ?? null;
    return (
      familyList.find((item, index) => getFamilyTabKey(item, index) === selectedFamilyKey) ??
      familyList[0] ??
      null
    );
  }, [familyList, selectedFamilyKey]);

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

  const relationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationOptions.forEach(item => {
      const value = String(item.dictValue ?? '');
      if (!value) return;
      map[value] = item.dictLabel || value;
    });
    return map;
  }, [relationOptions]);

  const selectedRelationLabel = useMemo(() => {
    if (!selectedFamily) return '家人';
    return (
      relationLabelMap[String(selectedFamily.relationType ?? '')] ||
      selectedFamily.relationType ||
      '家人'
    );
  }, [relationLabelMap, selectedFamily]);

  const selectedPatientUserId = useMemo(() => {
    const id = selectedFamily?.patientUserId;
    return id != null ? String(id) : '';
  }, [selectedFamily]);
  const bindPending = isFamilyBindPending(selectedFamily);

  const loadMemberInfo = useCallback(async (patientUserId: string) => {
    if (!patientUserId) {
      setMemberInfoRows(emptyFamilyMemberInfoRows());
      setMemberUser(null);
      return;
    }
    try {
      const [rows, user] = await Promise.all([
        loadFamilyMemberInfoRows(patientUserId),
        loadHealthRecordFamilyUser(patientUserId),
      ]);
      setMemberInfoRows(rows);
      setMemberUser(user);
    } catch {
      setMemberInfoRows(emptyFamilyMemberInfoRows());
      setMemberUser(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchFamilyBindMyList());
    }, [dispatch]),
  );

  useFocusEffect(
    useCallback(() => {
      if (bindPending) {
        setMemberInfoRows(emptyFamilyMemberInfoRows());
        setMemberUser(null);
        return;
      }
      void loadMemberInfo(selectedPatientUserId);
    }, [bindPending, loadMemberInfo, selectedPatientUserId]),
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerSettingBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.navigate('FamilyMemberProfilePage')}
          >
            <Image
              source={require('@/assets/family/profile/icon_sys.png')}
              style={styles.headerSettingIcon}
            />
          </TouchableOpacity>
        ),
      });
      return () => {
        parent?.setOptions({ headerRight: undefined });
      };
    }, [navigation]),
  );

  const switchToUserPerspective = useCallback(async () => {
    if (switchingIdentity) return;
    setSwitchingIdentity(true);
    try {
      const result = await switchIdentityPerspective('old');
      if (!result.ok) {
        Toast.show(result.msg ?? '切换失败', 1.5);
        return;
      }
      await dispatch(fetchUserSession());
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
      });
    } finally {
      setSwitchingIdentity(false);
    }
  }, [dispatch, navigation, switchingIdentity]);

  const handleRemoveSelectedFamily = useCallback(() => {
    if (!selectedFamily || removingFamily) return;
    const bindId = selectedFamily.id != null ? String(selectedFamily.id) : '';
    if (!bindId) {
      Toast.show('家人信息无效');
      return;
    }
    const displayName = getChildFamilyDisplayName(selectedFamily);
    Alert.alert('提示', buildFamilyBindRemoveConfirmMessage(displayName), [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (removingFamily) return;
            setRemovingFamily(true);
            const result = await removeFamilyBindById(bindId);
            setRemovingFamily(false);
            if (!result.ok) {
              Alert.alert('删除失败', result.msg ?? '请稍后重试');
              return;
            }
            Toast.show('已删除');
            await dispatch(fetchFamilyBindMyList({ force: true }));
          })();
        },
      },
    ]);
  }, [dispatch, removingFamily, selectedFamily]);

  const logout = useCallback(() => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await logoutApi() as { code?: number; msg?: string };
            if (!isResourceApiOk(res)) {
              Alert.alert('退出失败', res.msg ?? '请稍后重试');
              return;
            }
          } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
            return;
          }
          await clearAll();
          dispatch(clearUser());
          dispatch({ type: SET_UPLOADING, payload: false });
          dispatch({ type: SET_UPLOAD_PROGRESS, payload: 0 });
          dispatch({ type: SET_LOGIN, payload: false });
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }, [dispatch, navigation]);

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {familyList.length > 0 ? (
          <View style={styles.familyTabBar}>
            <Flex align="center" justify="between" style={styles.familyTabBarInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.familyTabScroll}
                style={styles.familyTabScrollWrap}
              >
                {familyList.map((item, index) => {
                  const key = getFamilyTabKey(item, index);
                  const label = getFamilyTabLabel(item);
                  const selected = selectedFamilyKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.85}
                      onPress={() => dispatch(setSelectedFamilyKey(key))}
                      style={index > 0 ? styles.familyTabGap : undefined}
                    >
                      {selected ? (
                        <ImageBackground
                          source={require('@/assets/family/profile/icon_select.png')}
                          style={styles.familyTabSelected}
                          resizeMode="stretch"
                        >
                          <Text style={styles.familyTabSelectedText}>{label}</Text>
                        </ImageBackground>
                      ) : (
                        <Flex style={styles.familyTabUnselected}>
                          <Text style={styles.familyTabUnselectedText}>{label}</Text>
                        </Flex>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.familyDeleteBtn}
                disabled={!selectedFamily || removingFamily}
                onPress={handleRemoveSelectedFamily}
              >
                <Flex align="center">
                  <Image
                    source={require('@/assets/family/profile/icon_delete.png')}
                    style={styles.familyDeleteIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.familyDeleteText}>
                    {removingFamily ? '删除中' : '删除'}
                  </Text>
                </Flex>
              </TouchableOpacity>
            </Flex>
          </View>
        ) : loadingFamily ? (
          <View style={styles.familyListEmpty}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : null}

        {selectedFamily ? (
          <>
            <View style={styles.memberCard}>
              <Flex align="center">
                <Image
                  source={resolveChildFamilyAvatarSource(selectedFamily, memberUser)}
                  style={styles.memberAvatar}
                  resizeMode="cover"
                />
                <View style={styles.memberInfo}>
                  <Flex align="center" justify="between" style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {getChildFamilyDisplayName(selectedFamily)}
                    </Text>
                    {bindPending ? (
                      <Flex style={styles.memberPendingBadgeWrap}>
                        <Text style={styles.memberPendingBadgeText}>等待确认中</Text>
                      </Flex>
                    ) : null}
                    {!bindPending && selectedFamily.identityAuthStatus == null ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setRelationProofVisible(true)}
                      >
                        <Flex style={styles.memberCertifiedBadgeWrap}>
                          <Image
                            source={require('@/assets/family/profile/icon_certified.png')}
                            style={styles.memberCertifiedBadge}
                            resizeMode="contain"
                          />
                          <Text style={styles.memberCertifiedBadgeText}>上传关系证明</Text>
                        </Flex>
                      </TouchableOpacity>
                    ) : null}
                    {!bindPending && selectedFamily.identityAuthStatus == 0 ? (
                      <Flex style={styles.memberPendingBadgeWrap}>
                        <Text style={styles.memberPendingBadgeText}>等待确认中</Text>
                      </Flex>
                    ) : null}
                    {!bindPending && selectedFamily.identityAuthStatus === 1 ? (
                      <Flex style={styles.memberCertifiedBadgeWrapUnCertified}>
                        <Image
                          source={require('@/assets/family/profile/icon_certified.png')}
                          style={styles.memberCertifiedBadge}
                          resizeMode="contain"
                        />
                        <Text style={styles.memberCertifiedBadgeText}>关系已认证</Text>
                      </Flex>
                    ) : null}
                    {!bindPending && selectedFamily.identityAuthStatus === 2 ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setRelationProofVisible(true)}
                      >
                        <Flex style={styles.memberCertifiedWarn}>
                          <Image
                            source={require('@/assets/family/profile/icon_wtg.png')}
                            style={styles.memberCertifiedBadge}
                            resizeMode="contain"
                          />
                          <Text style={styles.memberCertifiedWarnText}>认证未通过</Text>
                        </Flex>
                      </TouchableOpacity>
                    ) : null}

                    {/* {isFamilyIdentityCertified(selectedFamily) ? (
                      <Image
                        source={require('@/assets/family/profile/yrz.png')}
                        style={styles.memberCertifiedBadge}
                        resizeMode="contain"
                      />
                    ) : null} */}
                  </Flex>
                  <Text style={styles.memberMeta} numberOfLines={1}>
                    {getChildFamilyMetaLine(selectedFamily, selectedRelationLabel)}
                  </Text>
                </View>
              </Flex>
              <View style={styles.memberDivider} />
              {memberInfoRows.map(row => (
                <Flex key={row.key} align="center" style={styles.memberInfoRow}>
                  <Image source={row.icon} style={styles.memberInfoIcon} resizeMode="contain" />
                  <Text style={styles.memberInfoTitle}>{row.title}</Text>
                  <Text style={styles.memberInfoValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                </Flex>
              ))}

              {!bindPending ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.memberViewAllBtn}
                  disabled={!selectedPatientUserId}
                  onPress={() => {
                    if (!selectedFamily || !selectedPatientUserId) return;
                    navigation.navigate('HealthRecord', {
                      readOnly: true,
                      patientUserId: selectedPatientUserId,
                      relationLabel: selectedRelationLabel,
                      displayName: getChildFamilyDisplayName(selectedFamily),
                    });
                  }}
                >
                  <Flex align="center" justify="center">
                    <Text style={styles.memberViewAllText}>查看全部</Text>
                    <Image
                      source={require('@/assets/images/user/icon_right.png')}
                      style={styles.memberViewAllIcon}
                      tintColor="#6D925E"
                      resizeMode="contain"
                    />
                  </Flex>
                </TouchableOpacity>
              ) : null}
            </View>
            {/* <View style={styles.memberCard}>
              <Text style={styles.memberCardTitle}>设备连接状态</Text>
              {FAMILY_DEVICE_ITEMS.map((item, index) => {
                const online = item.status === 'online';
                return (
                  <View
                    key={item.key}
                    style={[
                      styles.deviceItem,
                      index === 0 ? styles.deviceItemFirst : styles.deviceItemGap,
                    ]}
                  >
                    <Flex align="center" justify="between">
                      <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
                        <Image source={item.icon} style={styles.deviceIcon} resizeMode="contain" />
                        <Text style={styles.deviceName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </Flex>
                      <Flex align="center">
                        <View
                          style={[
                            styles.deviceStatusDot,
                            online ? styles.deviceStatusDotOnline : styles.deviceStatusDotOffline,
                          ]}
                        />
                        <Text style={styles.deviceStatusText}>
                          {formatFamilyDeviceStatusText(item)}
                        </Text>
                      </Flex>
                    </Flex>
                  </View>
                );
              })}
              <TouchableOpacity activeOpacity={0.85} style={styles.deviceSyncBtn}>
                <Flex align="center" justify="center">
                  <Image
                    source={require('@/assets/family/profile/device_sync.png')}
                    style={styles.deviceSyncIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.deviceSyncText}>
                    {`提醒${selectedRelationLabel}同步设备`}
                  </Text>
                </Flex>
              </TouchableOpacity>
            </View> */}
          </>
        ) : null}

        <View style={styles.familyBox}>
          <TouchableOpacity
            onPress={switchToUserPerspective}
            activeOpacity={0.8}
            disabled={switchingIdentity}
          >
            <Flex justify="between" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/tab.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>视角与身份</Text>
                  <Text style={styles.familyItemRelation}>
                    {switchingIdentity
                      ? '切换中...'
                      : `当前：${identityLabel} · 点击切换回用户`}
                  </Text>
                </View>
              </Flex>
              <Image style={styles.tabSize} source={require('@/assets/images/user/icon_tab.png')} />
            </Flex>
          </TouchableOpacity>
        </View>

        {!loadingFamily && familyList.length === 0 ? (
          <View style={styles.familyBindEmpty}>
            <Image
              source={require('@/assets/family/profile/empty.png')}
              style={styles.familyBindEmptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.familyBindEmptyText}>暂无绑定家人</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.logoutWrap}>
        <TouchableOpacity style={styles.logout} onPress={logout} activeOpacity={0.8}>
          <Flex justify="center" style={{ flex: 1 }}>
            <Text style={styles.logoutText}>退出登录</Text>
          </Flex>
        </TouchableOpacity>
      </View>

      {selectedFamily && !bindPending ? (
        <FamilyRelationProofModal
          visible={relationProofVisible}
          displayName={getChildFamilyDisplayName(selectedFamily)}
          patientBindId={selectedFamily.id != null ? String(selectedFamily.id) : ''}
          relationType={String(selectedFamily.relationType ?? '')}
          phonenumber={systemUser?.phonenumber}
          submitterName={submitterName}
          onClose={() => setRelationProofVisible(false)}
          onSubmitted={() => {
            void dispatch(fetchFamilyBindMyList());
          }}
        />
      ) : null}
    </TabPageLayout>
  );
}
