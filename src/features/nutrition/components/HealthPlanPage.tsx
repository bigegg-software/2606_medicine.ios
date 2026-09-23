import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/nutrition';
import { Flex } from '@ant-design/react-native';
import { AppTheme } from '@/common/theme';
import { getSpecialPlanList, type SpecialPlanItem } from '@/api/specialPlan';
import type { DietPatientRuleInfo } from '@/api/dietPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  formatSpecialPlanSchemeName,
  formatSpecialPlanSubtitle,
  getSpecialPlanCoverSource,
} from './utils/healthPlanHelpers';

type Props = {
  dietRule?: DietPatientRuleInfo | null;
  readOnly?: boolean;
  patientUserId?: string;
  /** 营养页内部 tab 激活时刷新（常驻挂载时 useFocusEffect 不会触发） */
  isActive?: boolean;
};

/** 专享健康计划：推荐专项计划列表 */
export default function HealthPlanPage({ isActive = true }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const planItemStyle = [styles.planItem, { width: width - 24 }];
  const [plans, setPlans] = useState<SpecialPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSpecialPlanList();
      if (!isResourceApiOk(res)) {
        setPlans([]);
        return;
      }
      const list = apiResourceData(res);
      setPlans(Array.isArray(list) ? list : []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void loadPlans();
  }, [isActive, loadPlans]);

  const openCoachBooking = (planId?: number | string) => {
    if (planId == null || planId === '') {
      navigation.navigate('CoachBookingPage');
      return;
    }
    navigation.navigate('CoachBookingPage', { planId: String(planId) });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.dayTitle}>从医学评估到每周做得到的健康改变</Text>
        <Text style={styles.daySubtitle}>卓外医院健康管理中心医学评估·LM长期处方执行陪伴</Text>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : (
          plans.map(item => {
            const subtitle = formatSpecialPlanSubtitle(item);
            return (
              <View key={String(item.planId ?? item.planName)} style={planItemStyle}>
                <Flex align="start" style={styles.planItemRow}>
                  <Image style={styles.planItemIcon} source={getSpecialPlanCoverSource(item)} />
                  <View style={styles.planItemContent}>
                    <Flex style={styles.planItemBtn}>
                      <Image
                        style={styles.planItemBtnIcon}
                        source={require('@/assets/images/exercise/hs.png')}
                      />
                      <Text style={styles.planItemBtnText}>适合你</Text>
                    </Flex>
                    <Text style={styles.planItemTitle} numberOfLines={1}>
                      {item.planName?.trim() || '--'}
                    </Text>
                    {subtitle ? (
                      <Text
                        style={styles.planItemSubtitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {subtitle}
                      </Text>
                    ) : null}
                    <Flex align="center" style={styles.planItemBrandRow}>
                      <Image
                        style={styles.planItemBrandIcon}
                        source={require('@/assets/images/exercise/fw.png')}
                      />
                      <Text style={styles.planItemBrandText}>
                        {formatSpecialPlanSchemeName(item)}
                      </Text>
                    </Flex>
                    <Flex
                      style={styles.planItemCoachBtn}
                      onPress={() => openCoachBooking(item.planId)}
                    >
                      <Text style={styles.planItemCoachBtnText}>查看详情</Text>
                    </Flex>
                  </View>
                </Flex>
              </View>
            );
          })
        )}

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>寻得同行者，开启健康路</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </View>
  );
}
