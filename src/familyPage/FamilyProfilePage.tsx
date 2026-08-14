import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { TabPageLayout } from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserSession } from '@/store/actions/user';
import {
  getIdentityLabel,
  switchIdentityPerspective,
} from '@/src/features/auth/utils/identityHelpers';
import { getFamilyBindMyList, type FamilyBindItem } from '@/api/familyBind';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import { AppTheme } from '@/common/theme';
import styles from '@/css/family/profile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getFamilyTabKey(item: FamilyBindItem, index: number) {
  if (item.id != null) return String(item.id);
  if (item.patientUserId != null) return String(item.patientUserId);
  return `family-${index}`;
}

export default function FamilyProfilePage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const [switchingIdentity, setSwitchingIdentity] = useState(false);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [familyList, setFamilyList] = useState<FamilyBindItem[]>([{},{}]);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
  const [selectedFamilyKey, setSelectedFamilyKey] = useState<string | null>(null);
  const identityLabel = getIdentityLabel(systemUser?.identityPerspective);

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

  const loadFamilyList = useCallback(async () => {
    setLoadingFamily(true);
    try {
      // const res = await getFamilyBindMyList();
      // const data = apiResourceData(res as unknown as ApiResult<FamilyBindItem[]>) ?? [];
      // const list = Array.isArray(data) ? data : [];
      // setFamilyList(list);
      // setSelectedFamilyKey(prev => {
      //   if (prev && list.some((item, index) => getFamilyTabKey(item, index) === prev)) {
      //     return prev;
      //   }
      //   return list.length ? getFamilyTabKey(list[0], 0) : null;
      // });
    } catch {
      setFamilyList([]);
      setSelectedFamilyKey(null);
    } finally {
      setLoadingFamily(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFamilyList();
    }, [loadFamilyList]),
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
            onPress={() => navigation.navigate('NotificationSettingPage')}
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

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.familyTabBar}>
          {loadingFamily ? (
            <View style={styles.familyListEmpty}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : familyList.length === 0 ? (
            <View style={styles.familyListEmpty}>
              <Text style={styles.familyListEmptyText}>暂无绑定家人</Text>
            </View>
          ) : (
            <Flex align="center" justify="between" style={styles.familyTabBarInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.familyTabScroll}
                style={styles.familyTabScrollWrap}
              >
                {familyList.map((item, index) => {
                  const key = getFamilyTabKey(item, index);
                  const label =
                    relationLabelMap[String(item.relationType ?? '')] ||
                    item.relationType ||
                    '家人';
                  const selected = selectedFamilyKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.85}
                      onPress={() => setSelectedFamilyKey(key)}
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
              <Flex align="center" style={styles.familyReadonly}>
                <Image
                  source={require('@/assets/family/profile/icon_sz.png')}
                  style={styles.familyReadonlyIcon}
                />
                <Text style={styles.familyReadonlyText}>只读</Text>
              </Flex>
            </Flex>
          )}
        </View>

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
      </ScrollView>
    </TabPageLayout>
  );
}
