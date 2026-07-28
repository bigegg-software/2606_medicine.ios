import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
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
import { getFamilyBindStatusMeta } from '@/src/features/profile/myFamily/utils/myFamilyListHelpers';
import {
  getChildFamilyDisplayName,
  getChildFamilySubtitle,
} from './utils/familyProfileHelpers';
import { AppTheme } from '@/common/theme';
import styles from '@/css/family/profile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyProfilePage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const [switchingIdentity, setSwitchingIdentity] = useState(false);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [familyList, setFamilyList] = useState<FamilyBindItem[]>([]);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
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
      const res = await getFamilyBindMyList();
      const data = apiResourceData(res as unknown as ApiResult<FamilyBindItem[]>) ?? [];
      setFamilyList(Array.isArray(data) ? data : []);
    } catch {
      setFamilyList([]);
    } finally {
      setLoadingFamily(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFamilyList();
    }, [loadFamilyList]),
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
        <Text style={styles.modelTitle}>家人列表</Text>
        <View style={styles.familyBox}>
          {loadingFamily ? (
            <View style={styles.familyListEmpty}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : familyList.length === 0 ? (
            <View style={styles.familyListEmpty}>
              <Text style={styles.familyListEmptyText}>暂无绑定家人</Text>
            </View>
          ) : (
            familyList.map((item, index) => {
              const relationLabel =
                relationLabelMap[String(item.relationType ?? '')] ||
                item.relationType ||
                '家人';
              const status = getFamilyBindStatusMeta(item.bindStatus);
              const isLast = index === familyList.length - 1;
              return (
                <TouchableOpacity
                  key={item.id != null ? String(item.id) : `${item.patientUserId}-${index}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (item.id == null) return;
                    navigation.navigate('FamilyBindInvitePage', { id: String(item.id) });
                  }}
                >
                  <Flex
                    align="center"
                    justify="between"
                    style={[styles.familyListItem, isLast && styles.familyListItemLast]}
                  >
                    <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
                      <Image
                        style={styles.familyListAvatar}
                        source={require('@/assets/images/family/family.png')}
                      />
                      <View style={[styles.familyItemContent, { flex: 1, minWidth: 0 }]}>
                        <Flex align="center" style={styles.familyListNameRow}>
                          <Text style={styles.familyListName} numberOfLines={1}>
                            {getChildFamilyDisplayName(item)}
                          </Text>
                          <Text style={styles.familyListRelation}>{relationLabel}</Text>
                        </Flex>
                        <Text style={styles.familyItemRelation} numberOfLines={1}>
                          {getChildFamilySubtitle(item)}
                        </Text>
                      </View>
                    </Flex>
                    <Text
                      style={[
                        styles.familyListStatus,
                        status.authorized && styles.familyListStatusOk,
                        !status.authorized && !status.pending && styles.familyListStatusFail,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </Flex>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={styles.modelTitle}>设置</Text>
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
