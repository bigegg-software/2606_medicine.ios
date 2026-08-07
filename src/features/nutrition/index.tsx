import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import styles from '@/css/nutrition';
import DietPage from './components/DietPage';
import NutritionPrescriptionPage from './components/NutritionPrescriptionPage';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { formatDietHeaderInfo } from './components/utils/dietMealHelpers';
import { AppTheme } from '@/common/theme';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserBaseInfo } from '@/store/actions/user';
import type { RootStackParamList } from '@/route/router';

type Route = RouteProp<RootStackParamList, 'NutritionPage'>;

export default function NutritionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation: any = useNavigation();
  const { params } = useRoute<Route>();
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const initialTab = params?.tab === 'prescription' ? 1 : 0;
  const [activeNav, setActiveNav] = useState(initialTab);
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  /** 已访问过的 tab 保持挂载，避免切换时重复请求 */
  const [mountedTabs, setMountedTabs] = useState<Record<number, boolean>>({
    [initialTab]: true,
    0: true,
  });

  useEffect(() => {
    if (params?.tab !== 'prescription') return;
    setActiveNav(1);
    setMountedTabs(prev => (prev[1] ? prev : { ...prev, 1: true }));
  }, [params?.tab]);

  const loadDietRule = useCallback(async () => {
    try {
      const res = await getInUseDietPatientRuleInfo();
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        setDietRule(null);
        return;
      }
      setDietRule(
        apiResourceData<DietPatientRuleInfo>(res as unknown as never) ?? null,
      );
    } catch {
      setDietRule(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchUserBaseInfo());
      void loadDietRule();
    }, [dispatch, loadDietRule]),
  );

  const onPressNav = useCallback((index: number) => {
    setActiveNav(index);
    setMountedTabs(prev => (prev[index] ? prev : { ...prev, [index]: true }));
  }, []);

  const header = formatDietHeaderInfo(dietRule, user, systemUser, userExtr);
  const pageList = [
    {
      title: '今日食谱',
      icon: require('@/assets/images/nutrition/day.png'),
    },
    {
      title: '营养处方',
      icon: require('@/assets/images/nutrition/cf.png'),
    },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 18 }}
          onPress={() => {
            navigation.navigate('FoodRecordingPage');
          }}>
          <Image style={{ width: 24, height: 24 }} source={require('@/assets/images/nutrition/icon_history.png')} />
        </TouchableOpacity>
      ),
    });
  }, [])

  return (
    <PageLayout style={styles.container} edges={[]}>
      <View style={styles.topBox}>
        <Flex>
          <Image style={styles.topBoxImage} source={require('@/assets/images/nutrition/model.png')} />
          <Text style={styles.topBoxText}>阜外 My Nutrition 模型</Text>
        </Flex>
        <View style={styles.topNameBox}>
          <Flex style={{ marginTop: 7 }}>
            <Text style={styles.topNameText}>{header.name}</Text>
            {header.version ? (
              <Flex style={styles.containerBox}>
                <Image style={styles.topNameImage} source={require('@/assets/images/nutrition/star.png')} />
                <Text style={styles.cfText}>{header.version}</Text>
              </Flex>
            ) : null}
          </Flex>
          <Flex style={styles.topInfoBox}>
            <Flex style={styles.brBox}>
              <Text style={styles.brText}>本人</Text>
            </Flex>
            <Text style={styles.topInfoText}>{header.infoText}</Text>
          </Flex>
          <Image style={styles.rightImg} source={require('@/assets/images/nutrition/order.png')} />
        </View>
      </View>
      <Flex style={styles.navBox}>
        {pageList.map((page, index) => (
          <Flex
            key={page.title}
            style={[styles.navItem, activeNav === index && styles.activeNavItem]}
            justify="center"
            onPress={() => onPressNav(index)}
          >
            <Image style={styles.navIcon} source={page.icon} />
            <Text style={[styles.navText, activeNav === index && styles.activeNavText]}>
              {page.title}
            </Text>
          </Flex>
        ))}
      </Flex>
      {loading && !dietRule ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {mountedTabs[0] ? (
            <View style={{ flex: 1, display: activeNav === 0 ? 'flex' : 'none' }}>
              <DietPage dietRule={dietRule} onDietRuleChange={setDietRule} />
            </View>
          ) : null}
          {mountedTabs[1] ? (
            <View style={{ flex: 1, display: activeNav === 1 ? 'flex' : 'none' }}>
              <NutritionPrescriptionPage dietRule={dietRule} />
            </View>
          ) : null}
        </View>
      )}
    </PageLayout>
  );
}
