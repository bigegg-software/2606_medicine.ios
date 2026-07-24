import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
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
import styles from '@/css/family/profile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyProfilePage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const [switchingIdentity, setSwitchingIdentity] = useState(false);
  const identityLabel = getIdentityLabel(systemUser?.identityPerspective);

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
        <Text style={styles.modelTitle}>设置</Text>
        <View style={styles.familyBox}>
          <TouchableOpacity
            onPress={switchToUserPerspective}
            activeOpacity={0.8}
            disabled={switchingIdentity}>
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
