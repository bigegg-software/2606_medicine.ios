import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutApi } from '@/api/auth';
import { getUserSignInfo, getUserSignTip, postUserSign, type UserSignInfoRecord } from '@/api/userSignInfo';
import { getOldFamilyBindMyList, type OldFamilyBindItem } from '@/api/oldFamilyBind';
import type { DictDataItem } from '@/api/dict';
import { clearAll } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { fetchUserSession, clearUser } from '@/store/actions/user';
import { SET_UPLOADING, SET_UPLOAD_PROGRESS } from '@/store/type/upload';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import type { RootState, AppDispatch } from '@/store/store';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/profile';
import { getDisplayUserName, getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import type { RootStackParamList } from '@/route/router';
import { useFontSize } from '@/common/FontSizeContext';
import {
  getIdentityLabel,
  switchIdentityPerspective,
} from '@/src/features/auth/utils/identityHelpers';
import SignInModal from './components/SignInModal';
import { buildSignButtonLabel, isSignedTodayByBjDate } from './utils/signInHelpers';
import { getIdentityAuditInfo } from '@/api/identityAudit';
import { resolveIdentityAuthBadgeSource, resolveIdentityAuthBadgeWidth, canPressIdentityAuthBadge, shouldShowIdentityAuthEntry } from './utils/identityAuthBadgeHelpers';
import { formatSyncRangeLabel, formatVoiceSpeedLabel } from './settingPage/utils/settingsHelpers';
import { parseNotificationSettings } from '@/src/utils/notificationSettingsHelpers';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import {
  getFamilyBindStatusMeta,
  getFamilyDisplayName,
  getFamilyListSubtitle,
} from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';
import {
  hydrateEquipment,
  prepareEquipmentSdk,
} from '@/store/actions/equipment';
import { buildEquipmentSummaryText } from '@/src/features/equipment/utils/equipmentHelpers';
type Nav = NativeStackNavigationProp<RootStackParamList>;

const navList = [
  {
    img: require('@/assets/images/user/img2.png'),
    label: '健康档案',
    route: 'HealthRecord' as const,
  },
  {
    img: require('@/assets/images/user/img3.png'),
    label: '健康数据',
    route: 'VitalsPage' as const,
  },
  {
    img: require('@/assets/images/user/img6.png'),
    label: '运动处方',
    route: 'ExercisePage' as const,
  },
  {
    img: require('@/assets/images/user/img5.png'),
    label: '营养处方',
    route: 'NutritionPage' as const,
  },
  {
    img: require('@/assets/images/user/img4.png'),
    label: '用药记录',
    route: 'Medication' as const,
    params: { tab: 'medication' as const },
  },
];

export default function ProfilePage() {
  const navigation: any = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser: any = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const loading = useSelector((s: RootState) => s.user.loading);
  const { label: fontSizeLabel } = useFontSize();
  const dataManageLabel = formatSyncRangeLabel(userExtr?.synWdataDays, userExtr?.autoSyncData);
  const speechSpeedLabel = formatVoiceSpeedLabel(userExtr?.voiceSpeed);
  const notificationEnabled = parseNotificationSettings(userExtr).enabled;
  const boundDevices = useSelector((s: RootState) => s.equipment.boundDevices);
  const equipmentSummary = useMemo(() => {
    const online = boundDevices.filter(item => item.connected).length;
    return buildEquipmentSummaryText({
      total: boundDevices.length,
      online,
    });
  }, [boundDevices]);
  const [switchingIdentity, setSwitchingIdentity] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedToday, setSignedToday] = useState(false);
  const [signTip, setSignTip] = useState('');
  const [signRewardTokens, setSignRewardTokens] = useState<string | number>('10');
  const [signModalTip, setSignModalTip] = useState('');
  const [authStatus, setAuthStatus] = useState<number | null>(null);
  const [familyList, setFamilyList] = useState<OldFamilyBindItem[]>([]);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const identityLabel = getIdentityLabel(systemUser?.identityPerspective);
  const authBadgeSource = resolveIdentityAuthBadgeSource(authStatus);
  const authBadgeWidth = resolveIdentityAuthBadgeWidth(authStatus);
  const canPressAuthBadge = canPressIdentityAuthBadge(authStatus);
  const showIdentityAuthEntry = shouldShowIdentityAuthEntry(authStatus);

  const relationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationOptions.forEach(item => {
      const value = String(item.dictValue ?? '');
      if (!value) return;
      map[value] = item.dictLabel || value;
    });
    return map;
  }, [relationOptions]);

  const loadSignTip = useCallback(async () => {
    try {
      const res = await getUserSignTip();
      const tip = apiResourceData<string>(
        res as unknown as { code?: number; data?: string },
      );
      if (typeof tip === 'string') {
        setSignTip(tip);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadSignStatus = useCallback(async () => {
    try {
      const res = await getUserSignInfo();
      const data = apiResourceData(res as unknown as ApiResult<UserSignInfoRecord>);
      setSignedToday(isSignedTodayByBjDate(data?.signDateBj));
    } catch {
      /* ignore */
    }
  }, []);

  const loadIdentityAuthStatus = useCallback(async () => {
    try {
      const res = (await getIdentityAuditInfo()) as unknown as {
        code?: number;
        data?: { authStatus?: number | null };
      };
      if (!isResourceApiOk(res)) {
        setAuthStatus(null);
        return;
      }
      const status = apiResourceData<{ authStatus?: number | null }>(res)?.authStatus;
      setAuthStatus(status == null ? null : Number(status));
    } catch {
      setAuthStatus(null);
    }
  }, []);

  const loadFamilyList = useCallback(async () => {
    try {
      const res = await getOldFamilyBindMyList();
      const data =
        apiResourceData(res as unknown as ApiResult<OldFamilyBindItem[]>) ?? [];
      setFamilyList(Array.isArray(data) ? data : []);
    } catch {
      setFamilyList([]);
    }
  }, []);

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
      void dispatch(fetchUserSession());
      void dispatch(hydrateEquipment());
      void dispatch(prepareEquipmentSdk());
      void loadSignTip();
      void loadSignStatus();
      void loadIdentityAuthStatus();
      void loadFamilyList();
    }, [dispatch, loadFamilyList, loadIdentityAuthStatus, loadSignStatus, loadSignTip]),
  );

  const handleSignIn = useCallback(async () => {
    if (signing) return;
    if (signedToday) {
      Toast.show('今日已签到', 1.5);
      return;
    }
    setSigning(true);
    const loadingKey = Toast.loading('签到中', 0);
    try {
      const res = await postUserSign();
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        const msg = (res as { msg?: string })?.msg || '签到失败';
        if (msg.includes('已签到') || msg.includes('重复')) {
          setSignedToday(true);
        }
        Toast.show(msg, 1.5);
        return;
      }
      const data = apiResourceData<{
        rewardsTokens?: string | number;
        tipMsg?: string;
      }>(
        res as unknown as {
          code?: number;
          data?: { rewardsTokens?: string | number; tipMsg?: string };
        },
      );
      if (!data) {
        Toast.show((res as { msg?: string })?.msg || '签到失败', 1.5);
        return;
      }
      setSignedToday(true);
      setSignRewardTokens(data.rewardsTokens ?? 10);
      setSignModalTip(data.tipMsg ?? '');
      if (data.tipMsg) {
        setSignTip(data.tipMsg);
      }
      setSignInVisible(true);
      await dispatch(fetchUserSession());
      void loadSignTip();
      void loadSignStatus();
    } catch {
      Toast.show('签到失败，请稍后重试', 1.5);
    } finally {
      Toast.remove(loadingKey);
      setSigning(false);
    }
  }, [dispatch, loadSignStatus, loadSignTip, signedToday, signing]);

  const switchToFamilyPerspective = useCallback(async () => {
    Toast.show('正在开发中', 1.5);
    return;
    if (switchingIdentity) return;
    setSwitchingIdentity(true);
    try {
      const result = await switchIdentityPerspective('child');
      if (!result.ok) {
        Toast.show(result.msg ?? '切换失败', 1.5);
        return;
      }
      await dispatch(fetchUserSession());
      navigation.reset({
        index: 0,
        routes: [{ name: result.homeRoute }],
      });
    } finally {
      setSwitchingIdentity(false);
    }
  }, [dispatch, navigation, switchingIdentity]);

  const logout = () => {
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
  };

  const name = getDisplayUserName(user, systemUser);
  const avatarOssUrl = String(user?.avatarOssUrl ?? '');
  const defaultAvatar = getDefaultAvatarByGender(user?.gender);
  if (loading && user == null) {
    return (
      <TabPageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </TabPageLayout>
    );
  }

  return (
    <TabPageLayout style={styles.container}>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Flex justify='between' style={styles.avatarBox}>
          <Flex>
            {avatarOssUrl ? (
              <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
            ) : (
              <Image source={defaultAvatar} style={styles.avatarImg} />
            )}
            <View>
              <Flex>
                <Text style={styles.name}>{name}</Text>
                {canPressAuthBadge ? (
                  <TouchableOpacity onPress={() => navigation.navigate('AuthenticationPage')}>
                    <Image style={[styles.wrzImg, { width: authBadgeWidth }]} source={authBadgeSource} />
                  </TouchableOpacity>
                ) : (
                  <Image style={[styles.wrzImg, { width: authBadgeWidth }]} source={authBadgeSource} />
                )}
              </Flex>
              <TouchableOpacity onPress={() => {
                navigation.navigate('RecordPointsPage');
              }}>
                <Flex style={{ marginTop: 7 }}>
                  <Image style={styles.avatarIcon} source={require('@/assets/images/user/img1.png')} />
                  <Text style={styles.avatarValue}>{Number(systemUser?.tokens ?? 0).toFixed(2)}</Text>
                </Flex>
              </TouchableOpacity>
            </View>
          </Flex>
          {showIdentityAuthEntry ? (
            <TouchableOpacity onPress={() => navigation.navigate('AuthenticationPage')}>
              <View style={styles.rlBox}>
                <Image style={styles.rlImg} source={require('@/assets/images/user/smrz.png')} />
              </View>
            </TouchableOpacity>
          ) : null}
        </Flex>

        <ImageBackground
          source={require('@/assets/images/user/userBack.png')}
          style={styles.bgImg}>
          <Flex align="start" style={styles.diamondsBox}>
            <View style={{ flex: 1 }}>
              <Flex justify='between'>
                <Flex>
                  <Image style={styles.diamondsImg} source={require('@/assets/images/user/diamonds.png')} />
                  <Text style={styles.diamondsTitle}>积分商城</Text>
                </Flex>
                <TouchableOpacity
                  disabled={signing || signedToday}
                  onPress={handleSignIn}
                  style={signedToday || signing ? { opacity: 0.6 } : undefined}>
                  <Flex style={styles.diamondsSignIn}>
                    <Text style={styles.diamondsSignInText}>
                      {buildSignButtonLabel(10, signedToday)}
                    </Text>
                    <Image style={styles.diamondsSignInImg} tintColor={"#804A15"} source={require('@/assets/images/user/img1.png')} />
                  </Flex>
                </TouchableOpacity>
              </Flex>
              {signTip ? <Text style={styles.diamondsDesc}>{signTip}</Text> : null}
            </View>
          </Flex>
        </ImageBackground>

        <Flex justify="around" align="center" style={styles.navList}>
          {navList.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.route, 'params' in item ? item.params : undefined)}
            >
              <Flex direction="column" justify="start" align='center'>
                <Image style={styles.navListItemImg} source={item.img} />
                <Text style={styles.navListItemText}>{item.label}</Text>
              </Flex>
            </TouchableOpacity>
          ))}
        </Flex>

        <Flex justify="between" align="center" style={styles.modelTitleRow}>
          <Text style={[styles.modelTitle, styles.modelTitleInRow]}>我的家人</Text>
          {familyList.length > 0 && <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate('MyFamily')}
          >
            <Image
              style={{ width: 8, height: 13 }}
              source={require('@/assets/images/user/icon_right.png')}
            />
          </TouchableOpacity>}
        </Flex>
        <View style={[styles.familyBox, { paddingVertical: 10 }]}>
          {familyList.length === 0 ? (
            <Flex justify="between" align="center" style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
                <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>点击添加联系人</Text>
                  <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                </View>
              </Flex>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => navigation.navigate('MyFamily')}
              >
                <Image
                  style={{ width: 8, height: 13 }}
                  source={require('@/assets/images/user/icon_right.png')}
                />
              </TouchableOpacity>
            </Flex>
          ) : (
            familyList.map((item, index) => {
              const relationLabel =
                relationLabelMap[String(item.relationType ?? '')] ||
                item.relationType ||
                '家人';
              const status = getFamilyBindStatusMeta(item.bindStatus);
              const bindId = item.id != null ? String(item.id) : undefined;
              const isLast = index === familyList.length - 1;
              return (
                <Flex
                  key={bindId ?? `${item.jsUserId}-${item.jsPhonenumber}`}
                  justify="between"
                  align="center"
                  style={[styles.familyItem, isLast && { borderBottomWidth: 0 }]}
                >
                  <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
                    <Image
                      style={styles.imgItem}
                      source={require('@/assets/images/family/family.png')}
                    />
                    <View style={[styles.familyItemContent, { flex: 1, minWidth: 0 }]}>
                      <Flex align="center">
                        <Text style={styles.familyItemName} numberOfLines={1}>
                          {getFamilyDisplayName(item)}
                        </Text>
                        <Text style={styles.familyListRelation}>{relationLabel}</Text>
                        <Text
                          style={[
                            styles.familyListStatus,
                            status.authorized && styles.familyListStatusOk,
                            !status.authorized && !status.pending && styles.familyListStatusFail,
                            { marginLeft: 6 },
                          ]}
                          numberOfLines={1}
                        >
                          {status.label}
                        </Text>
                      </Flex>
                      <Text style={styles.familyItemRelation} numberOfLines={1}>
                        {getFamilyListSubtitle(item)}
                      </Text>
                    </View>
                  </Flex>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      if (!bindId) {
                        navigation.navigate('MyFamily');
                        return;
                      }
                      navigation.navigate('FamilyDetail', { id: bindId });
                    }}
                  >
                    <Image
                      style={{ width: 8, height: 13 }}
                      source={require('@/assets/images/user/icon_right.png')}
                    />
                  </TouchableOpacity>
                </Flex>
              );
            })
          )}
        </View>

        <Text style={styles.modelTitle}>我的设备</Text>
        <View style={[styles.familyBox, { paddingVertical: 10 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('EquipmentListPage')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/phone.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>{equipmentSummary.title}</Text>
                  <Text style={styles.familyItemRelation}>{equipmentSummary.subtitle}</Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </View>

        <Text style={styles.modelTitle}>设置</Text>
        <View style={styles.familyBox}>
          <TouchableOpacity
            disabled={switchingIdentity}
            onPress={switchToFamilyPerspective}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/tab.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>视角与身份</Text>
                  <Text style={styles.familyItemRelation}>
                    {switchingIdentity ? '切换中...' : `当前：${identityLabel}`}
                  </Text>
                </View>
              </Flex>
              <Image style={styles.tabSize} source={require('@/assets/images/user/icon_tab.png')} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FontSizeSettingPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/fontSize.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>字体大小</Text>
                  <Text style={styles.familyItemRelation}>当前：{fontSizeLabel}</Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SpeechSpeedSettingPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/zs.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>语音语速</Text>
                  <Text style={styles.familyItemRelation}>当前：{speechSpeedLabel}</Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationSettingPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/tip.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>消息通知</Text>
                  <Text style={styles.familyItemRelation}>
                    {notificationEnabled ? '已开启' : '已关闭'}
                  </Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DataManageSettingPage')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/data.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>数据管理</Text>
                  <Text style={styles.familyItemRelation}>{dataManageLabel}</Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </View>

        <View style={styles.familyBox}>
          <TouchableOpacity onPress={() => navigation.navigate('FeedbackPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/info.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>帮助与反馈</Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AboutUsPage')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/about.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>关于我们</Text>
                </View>
              </Flex>
              <Image
                style={{ width: 8, height: 13 }}
                source={require('@/assets/images/user/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </View>
        {/* <Text style={styles.modelTitle}>隐私设置</Text>
        <View style={styles.familyBox}>
          <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Image style={styles.imgItem} source={require('@/assets/images/user/sz.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>修改密码</Text>
              </View>
            </Flex>
             <Image
                  style={{ width: 8, height: 13 }}
                  source={require('@/assets/images/user/icon_right.png')}
                />
          </Flex>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Image style={styles.imgItem} source={require('@/assets/images/user/eye.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>个人信息可见性</Text>
              </View>
            </Flex>
             <Image
                  style={{ width: 8, height: 13 }}
                  source={require('@/assets/images/user/icon_right.png')}
                />
          </Flex>
        </View> */}
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Flex justify='center' style={{ flex: 1 }}>
            <Text style={styles.logoutText}>退出登录</Text>
          </Flex>
        </TouchableOpacity>
      </ScrollView>
      <SignInModal
        visible={signInVisible}
        rewardsTokens={signRewardTokens}
        tipMsg={signModalTip}
        onClose={() => setSignInVisible(false)}
      />
    </TabPageLayout>
  );
}
