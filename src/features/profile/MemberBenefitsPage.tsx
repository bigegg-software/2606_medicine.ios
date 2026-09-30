import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/profile/memberBenefits';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserSession } from '@/store/actions/user';
import { resolveMemberBenefitsSummary } from './utils/memberBenefitsHelpers';

/** 会员权益：签约状态 + 课次权益 */
export default function MemberBenefitsPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const systemUser = useSelector((state: RootState) => state.user.systemUser);
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => resolveMemberBenefitsSummary(systemUser), [systemUser]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchUserSession());
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchUserSession());
    }, [dispatch]),
  );

  const goBookCourse = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Curriculum' } }],
    });
  };

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >

        <Flex align="center" style={styles.heroInner}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroLabel}>{summary.heroLabel}</Text>
            <Text style={styles.heroStatus}>
              {summary.benefitValidityText || '如需开通/续费，请联系工作人员'}
            </Text>
          </View>
          <Image
            style={styles.heroIcon}
            source={require('@/assets/images/curriculum/qyi.png')}
            resizeMode="contain"
          />
        </Flex>

        {summary.rows.map(row => {
          const weeklyUnlimited = row.weeklyText === '不限';
          const totalUnlimited = row.totalText === '不限';
          const weeklyUnit = weeklyUnlimited || row.weeklyText === '--' ? '' : ' 次';
          return (
            <View key={row.key} style={styles.benefitCard}>
              <Flex justify="between" align="center">
                <Text style={styles.benefitTitle}>{row.title}</Text>
                <Flex align="center">
                  <Text style={styles.benefitMetaLabel}>每周上限 </Text>
                  <Text
                    style={
                      weeklyUnlimited
                        ? styles.benefitMetaLabel
                        : [styles.benefitMetaValue, { color: row.progressColor }]
                    }
                  >
                    {row.weeklyText}
                  </Text>
                  {weeklyUnit ? <Text style={styles.benefitMetaLabel}>{weeklyUnit}</Text> : null}
                </Flex>
              </Flex>
              {totalUnlimited ? (
                <Text style={styles.benefitUnlimitedTip}>次数不限</Text>
              ) : (
                <Flex style={styles.benefitTotalRow}>
                  <Text style={styles.benefitMetaLabel}>总次数 </Text>
                  <Text style={[styles.benefitMetaValue, { color: row.progressColor }]}>
                    {row.totalText}
                  </Text>
                  {row.totalText === '--' ? null : (
                    <Text style={styles.benefitMetaLabel}> 次</Text>
                  )}
                </Flex>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Flex
        justify="between"
        align="center"
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        <TouchableOpacity
          style={styles.bottomBarButton}
          activeOpacity={0.7}
          onPress={goBookCourse}
        >
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            <Image
              style={styles.bottomBarButtonIcon}
              source={require('@/assets/images/curriculum/calendar.png')}
            />
            <Text style={styles.bottomBarButtonText}>预约课程</Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </PageLayout>
  );
}
