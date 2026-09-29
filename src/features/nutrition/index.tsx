import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/nutrition';
import DietPage from './components/DietPage';
import NutritionPrescriptionPage from './components/NutritionPrescriptionPage';
import HealthPlanPage from './components/HealthPlanPage';
import { getDietPatientRuleInfo, getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { formatDietHeaderInfo } from './components/utils/dietMealHelpers';
import { AppTheme } from '@/common/theme';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserBaseInfo } from '@/store/actions/user';
import type { RootStackParamList } from '@/route/router';
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import { getChildFamilyDisplayName, maskFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';
import { isUserBaseInfoComplete } from '@/src/features/profile/healthRecord/utils/profileCompletenessHelpers';
import CompleteProfileLink from '@/src/features/profile/healthRecord/components/CompleteProfileLink';
import {
  fetchLatestHistoryDietTip,
  formatDietCompletedTipPrefix,
  formatDietPauseTipPrefix,
  isDietRulePaused,
  type DietHistoryTip,
} from './components/utils/dietPauseTipHelpers';

type Route = RouteProp<RootStackParamList, 'NutritionPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type NutritionNavKey = 'todayExercise' | 'prescription' | 'healthPlan';

function resolveNutritionNavKey(tab?: 'diet' | 'prescription'): NutritionNavKey {
  if (tab === 'prescription') return 'prescription';
  return 'todayExercise';
}

export default function NutritionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const {
    readOnly: familyReadOnly,
    patientUserId,
    relationLabel,
    displayName: routeDisplayName,
  } = resolveFamilyReadOnlyView(params);
  const dietPatientRuleId = params?.dietPatientRuleId != null
    ? String(params.dietPatientRuleId).trim()
    : '';
  const prescriptionOnly = Boolean(params?.prescriptionOnly);
  const isFamilyView = Boolean(patientUserId);
  const readOnly = familyReadOnly || Boolean(dietPatientRuleId);
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const familyList = useSelector((s: RootState) => s.family.list);
  const [familyUser, setFamilyUser] = useState<UserBaseInfo | null>(null);
  const initialTab = prescriptionOnly
    ? 'prescription'
    : resolveNutritionNavKey(params?.tab);
  const [activeNav, setActiveNav] = useState<NutritionNavKey>(initialTab);
  const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
  /** 无进行中处方时，历史列表第一条（暂停/已完成）用于顶部提示 */
  const [historyTip, setHistoryTip] = useState<DietHistoryTip | null>(null);
  const [loading, setLoading] = useState(true);
  /** 已访问过的 tab 保持挂载，避免切换时重复请求 */
  const [mountedTabs, setMountedTabs] = useState<Partial<Record<NutritionNavKey, boolean>>>({
    [initialTab]: true,
    ...(prescriptionOnly ? {} : { todayExercise: true }),
  });
  const profileComplete = isFamilyView ? true : isUserBaseInfoComplete(user);

  const familyFromStore = useMemo(() => {
    if (!patientUserId) return null;
    return (
      familyList.find(item => String(item.patientUserId ?? '') === patientUserId) ?? null
    );
  }, [familyList, patientUserId]);

  const familyDisplayName = useMemo(() => {
    if (!readOnly) return undefined;
    return (
      routeDisplayName
      || (familyFromStore ? getChildFamilyDisplayName(familyFromStore) : '')
      || maskFamilyDisplayName(familyUser?.name)
      || relationLabel
    );
  }, [familyFromStore, familyUser?.name, readOnly, relationLabel, routeDisplayName]);

  useEffect(() => {
    const next = resolveNutritionNavKey(params?.tab);
    if (params?.tab !== 'prescription' && params?.tab !== 'diet') return;
    setActiveNav(next);
    setMountedTabs(prev => (prev[next] ? prev : { ...prev, [next]: true }));
  }, [params?.tab]);

  const inUsePaused = Boolean(dietRule && isDietRulePaused(dietRule.status));
  const tipKind: DietHistoryTip['kind'] | null = prescriptionOnly
    ? null
    : inUsePaused
      ? 'paused'
      : !dietRule
        ? (historyTip?.kind ?? null)
        : null;
  const showStatusTip = tipKind != null;
  const pauseTipPrefix = tipKind === 'paused'
    ? formatDietPauseTipPrefix(
      inUsePaused ? dietRule?.stopReason : historyTip?.stopReason,
    )
    : tipKind === 'completed'
      ? formatDietCompletedTipPrefix()
      : '';
  const statusTipLinkText = tipKind === 'completed' ? '点击查看处方执行情况' : '查看详情';
  /** 暂停/已完成提示对应的处方 id（右上角执行统计、提示跳转共用） */
  const statusTipRuleId = inUsePaused
    ? (dietRule?.dietPatientRuleId != null ? String(dietRule.dietPatientRuleId).trim() : '')
    : (historyTip?.dietPatientRuleId ?? '');

  const openStatusTipDetail = useCallback(() => {
    if (!statusTipRuleId) return;
    if (tipKind === 'completed') {
      navigation.push('NutritionExecutionStatsPage', { dietPatientRuleId: statusTipRuleId });
      return;
    }
    navigation.push('NutritionPage', {
      dietPatientRuleId: statusTipRuleId,
      prescriptionOnly: true,
      readOnly: true,
      ...(patientUserId
        ? {
          patientUserId,
          relationLabel,
          displayName: routeDisplayName,
        }
        : {}),
    });
  }, [
    navigation,
    patientUserId,
    relationLabel,
    routeDisplayName,
    statusTipRuleId,
    tipKind,
  ]);

  const openStatusTipExecutionStats = useCallback(() => {
    if (!statusTipRuleId) return;
    navigation.push('NutritionExecutionStatsPage', { dietPatientRuleId: statusTipRuleId });
  }, [navigation, statusTipRuleId]);

  const loadDietRule = useCallback(async () => {
    try {
      const opts = patientUserId ? { patientUserId } : undefined;
      const [ruleRes, baseRes] = await Promise.all([
        dietPatientRuleId
          ? getDietPatientRuleInfo(String(dietPatientRuleId), opts)
          : getInUseDietPatientRuleInfo(opts),
        readOnly && patientUserId
          ? getUserBaseInfo({ patientUserId }).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (!isResourceApiOk(ruleRes as unknown as { code?: number })) {
        setDietRule(null);
        if (!dietPatientRuleId) {
          setHistoryTip(await fetchLatestHistoryDietTip(patientUserId));
        } else {
          setHistoryTip(null);
        }
      } else {
        const raw = apiResourceData<DietPatientRuleInfo>(ruleRes as unknown as never) ?? null;
        setDietRule(raw);
        if (!dietPatientRuleId && !raw) {
          setHistoryTip(await fetchLatestHistoryDietTip(patientUserId));
        } else {
          setHistoryTip(null);
        }
      }
      if (baseRes && isResourceApiOk(baseRes as unknown as { code?: number })) {
        setFamilyUser(apiResourceData<UserBaseInfo>(baseRes as unknown as never) ?? null);
      } else if (readOnly) {
        setFamilyUser(null);
      }
    } catch {
      setDietRule(null);
      setHistoryTip(null);
      if (readOnly) setFamilyUser(null);
    } finally {
      setLoading(false);
    }
  }, [dietPatientRuleId, patientUserId, readOnly]);

  useFocusEffect(
    useCallback(() => {
      if (!readOnly) {
        void dispatch(fetchUserBaseInfo());
      }
      void loadDietRule();
    }, [dispatch, loadDietRule, readOnly]),
  );

  const prevPatientUserIdRef = useRef(patientUserId);
  /** 右上角切换家人后刷新（跳过首屏与 focus 重复请求） */
  useEffect(() => {
    if (!readOnly) return;
    if (prevPatientUserIdRef.current === patientUserId) return;
    prevPatientUserIdRef.current = patientUserId;
    void loadDietRule();
  }, [patientUserId, readOnly, loadDietRule]);

  const onPressNav = useCallback((key: NutritionNavKey) => {
    setActiveNav(key);
    setMountedTabs(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const header = formatDietHeaderInfo(
    dietRule,
    user,
    systemUser,
    readOnly ? null : userExtr,
    readOnly
      ? { forceDisplayName: familyDisplayName, forceUser: familyUser }
      : undefined,
  );
  const pageList: { key: NutritionNavKey; title: string; icon: number }[] = [
    {
      key: 'todayExercise',
      title: '今日营养食谱',
      icon: require('@/assets/images/nutrition/day.png'),
    },
    // {
    //   key: 'prescription',
    //   title: '营养处方',
    //   icon: require('@/assets/images/nutrition/cf.png'),
    // },
    {
      key: 'healthPlan',
      title: '专项健康计划',
      icon: require('@/assets/images/nutrition/star.png'),
    },
  ];

  const pageTitle = dietRule?.prescriptionName?.trim() || '营养处方';

  useEffect(() => {
    const showPausedOrCompletedStats = showStatusTip && Boolean(statusTipRuleId);
    navigation.setOptions({
      title: pageTitle,
      headerTitle: undefined,
      // 历史处方只读：不显示右上角家人切换 / 饮食记录入口
      headerRight: dietPatientRuleId
        ? () => null
        : isFamilyView
          ? () => <FamilyRelationHeaderBadge label={relationLabel} />
          : () => (
            <TouchableOpacity
              style={{ marginRight: 18 }}
              onPress={() => {
                if (showPausedOrCompletedStats) {
                  openStatusTipExecutionStats();
                  return;
                }
                navigation.navigate('FoodRecordingPage');
              }}>
              <Image
                style={{ width: 24, height: 24 }}
                source={require('@/assets/images/nutrition/icon_history.png')}
              />
            </TouchableOpacity>
          ),
    });
  }, [
    dietPatientRuleId,
    isFamilyView,
    navigation,
    openStatusTipExecutionStats,
    pageTitle,
    relationLabel,
    showStatusTip,
    statusTipRuleId,
  ]);

  const statusTipText = showStatusTip ? (
    <Text style={styles.emptyPrescriptionText}>
      {pauseTipPrefix}
      <Text style={styles.pauseTipLink}>{statusTipLinkText}</Text>
    </Text>
  ) : null;

  const emptyStatusTipNode = showStatusTip ? (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.emptyPrescription}
      onPress={openStatusTipDetail}
    >
      <Image
        source={require('@/assets/images/nutrition/icon_yy_empty.png')}
        style={styles.emptyPrescriptionIcon}
      />
      {statusTipText}
    </TouchableOpacity>
  ) : null;

  const compactStatusTipNode = showStatusTip ? (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.pauseTipBox}
      onPress={openStatusTipDetail}
    >
      <Flex align="start">
        <Image
          source={require('@/assets/images/home/icon_warn.png')}
          style={styles.pauseTipIcon}
        />
        <Text style={styles.pauseTipText}>
          {pauseTipPrefix}
          <Text style={styles.pauseTipLink}>{statusTipLinkText}</Text>
        </Text>
      </Flex>
    </TouchableOpacity>
  ) : null;

  return (
    <PageLayout style={styles.container} edges={[]}>
      <View style={styles.topBox}>
        <Flex>
          <Image style={styles.topBoxImage} source={require('@/assets/images/nutrition/model.png')} />
          <Text style={styles.topBoxText}>生活方式医学中心联盟</Text>
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
              <Text style={styles.brText}>{isFamilyView ? relationLabel : '本人'}</Text>
            </Flex>
            <Text style={styles.topInfoText} numberOfLines={1} ellipsizeMode="tail">
              {header.infoText}
            </Text>
          </Flex>
          <Image style={styles.rightImg} source={require('@/assets/images/nutrition/order.png')} />
        </View>
      </View>
      {/* 历史处方（完成情况 / 处方详情）不展示底部 tab */}
      {!prescriptionOnly && !dietPatientRuleId ? (
        <Flex style={styles.navBox}>
          {pageList.map(page => (
            <Flex
              key={page.key}
              style={[styles.navItem, activeNav === page.key && styles.activeNavItem]}
              justify="center"
              onPress={() => onPressNav(page.key)}
            >
              <Text
                style={[styles.navText, activeNav === page.key && styles.activeNavText]}
                numberOfLines={1}
              >
                {page.title}
              </Text>
            </Flex>
          ))}
        </Flex>
      ) : null}
      {loading && !dietRule ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : !dietRule ? (
        emptyStatusTipNode ?? (
          <View style={styles.emptyPrescription}>
            <Image
              source={require('@/assets/images/nutrition/icon_yy_empty.png')}
              style={styles.emptyPrescriptionIcon}
            />
            {profileComplete ? (
              <Text style={styles.emptyPrescriptionText}>
                {readOnly ? '暂无营养处方' : '暂无营养处方，如需开方，请联系工作人员'}
              </Text>
            ) : (
              <Flex style={styles.emptyPrescriptionTextRow}>
                <Text style={styles.emptyPrescriptionTextInline}>暂无营养处方，请先</Text>
                <CompleteProfileLink color="#6D925E" />
              </Flex>
            )}
          </View>
        )
      ) : (
        <View style={{ flex: 1 }}>
          {compactStatusTipNode}
          {prescriptionOnly ? (
            <View style={{ flex: 1 }}>
              <NutritionPrescriptionPage
                key={patientUserId ?? 'self'}
                dietRule={dietRule}
                readOnly={readOnly}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {mountedTabs.todayExercise ? (
                <View style={{ flex: 1, display: activeNav === 'todayExercise' ? 'flex' : 'none' }}>
                  <DietPage
                    key={patientUserId ?? 'self'}
                    dietRule={dietRule}
                    onDietRuleChange={setDietRule}
                    readOnly={readOnly}
                    patientUserId={patientUserId}
                  />
                </View>
              ) : null}
              {mountedTabs.prescription ? (
                <View style={{ flex: 1, display: activeNav === 'prescription' ? 'flex' : 'none' }}>
                  <NutritionPrescriptionPage
                    key={patientUserId ?? 'self'}
                    dietRule={dietRule}
                    readOnly={readOnly}
                  />
                </View>
              ) : null}
              {mountedTabs.healthPlan ? (
                <View style={{ flex: 1, display: activeNav === 'healthPlan' ? 'flex' : 'none' }}>
                  <HealthPlanPage
                    key={patientUserId ?? 'self'}
                    dietRule={dietRule}
                    readOnly={readOnly}
                    patientUserId={patientUserId}
                    dietPatientRuleId={dietPatientRuleId || undefined}
                    isActive={activeNav === 'healthPlan'}
                  />
                </View>
              ) : null}
            </View>
          )}
        </View>
      )}
    </PageLayout>
  );
}
