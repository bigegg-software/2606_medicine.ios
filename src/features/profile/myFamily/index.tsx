import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/myFamily';
import { getOldFamilyBindMyList, type OldFamilyBindItem } from '@/api/oldFamilyBind';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import {
  getFamilyBindStatusMeta,
  getFamilyDisplayName,
  getFamilyListSubtitle,
  maskFamilyPhone,
  resolveFamilyBindAvatarSource,
} from './utils/myFamilyListHelpers';
import { filterVisibleOldFamilyBindList } from '@/src/features/profile/utils/profileFamilyUnbindHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MyFamilyPage() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<OldFamilyBindItem[]>([]);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);

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

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOldFamilyBindMyList();
      const data =
        apiResourceData(res as unknown as ApiResult<OldFamilyBindItem[]>) ?? [];
      const raw = Array.isArray(data) ? data : [];
      setList(filterVisibleOldFamilyBindList(raw));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadList();
    }, [loadList]),
  );

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView style={styles.body}>
        <Flex style={styles.rowBox} align="start">
          <View style={styles.rowBoxTextWrap}>
            <Text style={styles.rowBoxText}>
              <Text style={styles.rowBoxTextHighlight}>授权家人</Text>
              可以查看您的健康数据、接收健康预警等，让家人随时了解您的健康状况。
            </Text>
          </View>
          <Image style={styles.familyIcon} source={require('@/assets/images/family/family.png')} />
        </Flex>

        <ImageBackground
          source={require('@/assets/images/schedule/calendarBack.png')}
          style={styles.backImage1}
        >
          <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
            <Text style={styles.backImage1Text}>已绑定家人</Text>
          </Flex>
        </ImageBackground>

        <View style={styles.familyList}>
          {loading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : list.length === 0 ? (
            <View style={styles.emptyList}>
              <Image
                source={require('@/assets/family/profile/empty.png')}
                style={styles.emptyIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>暂无绑定家人，快去邀请吧</Text>
            </View>
          ) : (
            list.map(item => {
              const status = getFamilyBindStatusMeta(item.bindStatus);
              const relationLabel =
                relationLabelMap[String(item.relationType ?? '')] ||
                item.relationType ||
                '家人';
              const bindId = item.id != null ? String(item.id) : undefined;

              return (
                <TouchableOpacity
                  key={bindId ?? `${item.jsUserId}-${item.jsPhonenumber}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!bindId) return;
                    if (status.pending) {
                      navigation.navigate('FamilyBindInvitePage', { id: bindId });
                      return;
                    }
                    navigation.navigate('FamilyDetail', { id: bindId });
                  }}
                >
                  <Flex style={styles.familyItem}>
                    <Image
                      style={styles.familyItemIcon}
                      source={resolveFamilyBindAvatarSource(item)}
                    />
                    <View style={styles.familyItemWrap}>
                      <Flex justify="between">
                        <Flex>
                          <Text style={styles.familyItemName}>{getFamilyDisplayName(item)}</Text>
                          <Text style={styles.familyItemRelation}>{relationLabel}</Text>
                        </Flex>
                        <Flex>
                          <View
                            style={
                              status.authorized
                                ? styles.familyItemStatusBox
                                : styles.familyItemStatusBox1
                            }
                          />
                          <Text
                            style={
                              status.authorized
                                ? styles.familyItemStatus
                                : styles.familyItemStatus1
                            }
                          >
                            {status.label}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex justify="between" align="center" style={styles.familyItemPhoneWrap}>
                        <View style={styles.familyItemSubtitleWrap}>
                          <Text style={styles.phoneNumber}>
                            {maskFamilyPhone(item.jsPhonenumber)}
                          </Text>
                          <Text style={styles.familyItemStatusText} numberOfLines={1}>
                            {getFamilyListSubtitle(item)}
                          </Text>
                        </View>
                        <Image
                          style={styles.familyItemRightIcon}
                          source={require('@/assets/images/family/icon_right.png')}
                        />
                      </Flex>
                    </View>
                  </Flex>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBarButtonLeft}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('MyFamilyAdd');
          }}
        >
          <Flex style={{ flex: 1 }}>
            <Image
              style={styles.bottomBarButtonImg}
              source={require('@/assets/images/vitals/icon_add.png')}
            />
            <Text style={styles.bottomBarButtonTextLeft}>邀请家人加入</Text>
          </Flex>
        </TouchableOpacity>
      </View>
    </PageLayout>
  );
}
