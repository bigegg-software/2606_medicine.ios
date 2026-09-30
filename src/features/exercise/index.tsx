import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/exercise';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserBaseInfo } from '@/store/actions/user';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { formatExerciseUserInfoText, normalizeExPatientRuleInfo } from './utils/exerciseHelpers';
import { onPressExerciseCheckInFab } from './utils/exerciseCheckInFabHelpers';
import TrainingPage from './components/TrainingPage';
import PrescriptionPage from './components/PrescriptionPage';
import InStoreRehabPage from './components/InStoreRehabPage';
import type { InUseExPatientRule } from '@/api/schedule';
import { getExPatientRuleInfo, getInUseExPatientRuleInfo, getPostponeThisWeekInfo, type ExPatientRuleInfo, type PostponeThisWeekInfo } from '@/api/exPatientRule';
import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import { isUserBaseInfoComplete } from '@/src/features/profile/healthRecord/utils/profileCompletenessHelpers';
import CompleteProfileLink from '@/src/features/profile/healthRecord/components/CompleteProfileLink';
import type { RootStackParamList } from '@/route/router';
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import { getChildFamilyDisplayName, maskFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';
import {
  buildTrainingGoalLabelMap,
  loadTrainingGoalDictItems,
} from '@/src/features/profile/healthRecord/utils/profileExtraFieldsHelpers';
import {
  hasExPostponeChoiceToday,
  postponeThisWeekByRuleId,
  recordExPostponeChoice,
  shouldShowPostponeThisWeekDialog,
  showPostponeThisWeekDialog,
} from './utils/exercisePostponeHelpers';
import {
  fetchLatestHistoryExerciseTip,
  formatExerciseCompletedTipPrefix,
  formatExercisePauseTipPrefix,
  isExerciseRulePaused,
  type ExerciseHistoryTip,
} from './utils/exercisePauseTipHelpers';

type ExerciseNavKey = 'homeTraining' | 'prescription' | 'inStoreRehab';

type Route = RouteProp<RootStackParamList, 'ExercisePage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExercisePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { readOnly: familyReadOnly, patientUserId, relationLabel, displayName: routeDisplayName } =
    resolveFamilyReadOnlyView(route.params);
  const exPatientRuleId = route.params?.exPatientRuleId != null
    ? String(route.params.exPatientRuleId).trim()
    : '';
  const prescriptionOnly = Boolean(route.params?.prescriptionOnly);
  const isFamilyView = Boolean(patientUserId);
  const readOnly = familyReadOnly || Boolean(exPatientRuleId);
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const familyList = useSelector((s: RootState) => s.family.list);
  const [familyUser, setFamilyUser] = useState<UserBaseInfo | null>(null);
  const [trainingGoalLabelMap, setTrainingGoalLabelMap] = useState<Record<string, string>>({});
  const familyFromStore = useMemo(() => {
    if (!patientUserId) return null;
    return (
      familyList.find(item => String(item.patientUserId ?? '') === patientUserId) ?? null
    );
  }, [familyList, patientUserId]);
  const profileUser = isFamilyView ? familyUser : user;
  /** 家人只读：优先路由/家人列表姓名，绝不回落登录人；姓名匿名展示 */
  const displayName = isFamilyView
    ? (
      routeDisplayName
      || (familyFromStore ? getChildFamilyDisplayName(familyFromStore) : '')
      || maskFamilyDisplayName(familyUser?.name)
      || relationLabel
      || '未命名'
    )
    : getDisplayUserName(user, systemUser);
  const profileComplete = isFamilyView ? true : isUserBaseInfoComplete(user);

  const [activeNav, setActiveNav] = useState<ExerciseNavKey>(
    prescriptionOnly ? 'prescription' : 'homeTraining',
  );
  const [exerciseRule, setExerciseRule] = useState<InUseExPatientRule | null>(null);
  /** 无进行中处方时，历史列表第一条（暂停/已完成）用于顶部提示 */
  const [historyTip, setHistoryTip] = useState<ExerciseHistoryTip | null>(null);
  const [loading, setLoading] = useState(true);
  /** 已访问过的 tab 保持挂载，避免切换时重复请求 */
  const [mountedTabs, setMountedTabs] = useState<Partial<Record<ExerciseNavKey, boolean>>>(
    prescriptionOnly ? { prescription: true } : { homeTraining: true },
  );
  /** 首屏后再次 focus（详情/播放器返回等）静默刷新，避免整页 loading */
  const hasLoadedRef = useRef(false);
  const infoText = formatExerciseUserInfoText(
    profileUser,
    readOnly && isFamilyView ? null : userExtr,
    exerciseRule?.trainingGoals ?? profileUser?.trainingGoals,
    trainingGoalLabelMap,
  );
  const relationBadgeText = useMemo(
    () => (isFamilyView ? relationLabel : '本人'),
    [isFamilyView, relationLabel],
  );

  const versionText = (() => {
    const raw = exerciseRule?.version != null ? String(exerciseRule.version).trim() : '';
    if (!raw || raw === '0' || Number(raw) <= 0) return '';
    return `处方V${raw}`;
  })();

  const inUsePaused = Boolean(exerciseRule && isExerciseRulePaused(exerciseRule.status));
  const tipKind: ExerciseHistoryTip['kind'] | null = prescriptionOnly
    ? null
    : inUsePaused
      ? 'paused'
      : !exerciseRule
        ? (historyTip?.kind ?? null)
        : null;
  const showStatusTip = tipKind != null;
  const pauseTipPrefix = tipKind === 'paused'
    ? formatExercisePauseTipPrefix(
      inUsePaused ? exerciseRule?.stopReason : historyTip?.stopReason,
    )
    : tipKind === 'completed'
      ? formatExerciseCompletedTipPrefix()
      : '';

  const openStatusTipDetail = useCallback(() => {
    const ruleId = inUsePaused
      ? (exerciseRule?.exPatientRuleId != null ? String(exerciseRule.exPatientRuleId).trim() : '')
      : (historyTip?.exPatientRuleId ?? '');
    if (!ruleId) return;
    if (tipKind === 'completed') {
      navigation.push('ExerciseExecutionStatsPage', { exPatientRuleId: ruleId });
      return;
    }
    // 当前已在 ExercisePage，需 push 才能打开新页
    navigation.push('ExercisePage', {
      exPatientRuleId: ruleId,
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
    exerciseRule?.exPatientRuleId,
    historyTip?.exPatientRuleId,
    inUsePaused,
    navigation,
    patientUserId,
    relationLabel,
    routeDisplayName,
    tipKind,
  ]);

  const loadExerciseRule = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!silent) setLoading(true);
    try {
      const opts = patientUserId ? { patientUserId } : undefined;
      // 历史处方：按指定 id 拉详情；当前处方（含暂停 status/stopReason）走 getInUseInfo
      const [ruleRes, baseRes] = await Promise.all([
        exPatientRuleId
          ? getExPatientRuleInfo(exPatientRuleId, opts)
          : getInUseExPatientRuleInfo(opts),
        isFamilyView && patientUserId
          ? getUserBaseInfo({ patientUserId }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (!isResourceApiOk(ruleRes as unknown as { code?: number })) {
        setExerciseRule(null);
        if (!exPatientRuleId) {
          setHistoryTip(await fetchLatestHistoryExerciseTip(patientUserId));
        } else {
          setHistoryTip(null);
        }
      } else {
        const raw = apiResourceData<ExPatientRuleInfo>(ruleRes as unknown as never);
        const normalized = raw ? (normalizeExPatientRuleInfo(raw) as InUseExPatientRule) : null;
        setExerciseRule(normalized);
        if (!exPatientRuleId && !normalized) {
          setHistoryTip(await fetchLatestHistoryExerciseTip(patientUserId));
        } else {
          setHistoryTip(null);
        }
      }
      if (baseRes && isResourceApiOk(baseRes as unknown as { code?: number })) {
        setFamilyUser(apiResourceData<UserBaseInfo>(baseRes as unknown as never) ?? null);
      } else if (isFamilyView) {
        setFamilyUser(null);
      }
      hasLoadedRef.current = true;
    } catch {
      setExerciseRule(null);
      setHistoryTip(null);
      if (isFamilyView) setFamilyUser(null);
    } finally {
      setLoading(false);
    }
  }, [exPatientRuleId, isFamilyView, patientUserId]);

  useFocusEffect(
    useCallback(() => {
      if (!isFamilyView) {
        void dispatch(fetchUserBaseInfo());
      }
      void loadExerciseRule({ silent: hasLoadedRef.current });
    }, [dispatch, loadExerciseRule, isFamilyView]),
  );

  useEffect(() => {
    let cancelled = false;
    void loadTrainingGoalDictItems().then(items => {
      if (cancelled) return;
      setTrainingGoalLabelMap(buildTrainingGoalLabelMap(items));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** 进入本人进行中处方时，查询本周是否可顺延并弹窗 */
  const postponePromptedRuleIdRef = useRef('');
  useEffect(() => {
    if (readOnly || isFamilyView) return;
    const ruleId = exerciseRule?.exPatientRuleId;
    if (ruleId == null || String(ruleId).trim() === '') return;
    const id = String(ruleId);
    if (postponePromptedRuleIdRef.current === id) return;

    let cancelled = false;
    const checkPostpone = async () => {
      try {
        const res = await getPostponeThisWeekInfo(id);
        if (cancelled) return;
        if (!isResourceApiOk(res as unknown as { code?: number })) return;
        const info = apiResourceData(
          res as unknown as { code?: number; data?: PostponeThisWeekInfo },
        );
        if (!shouldShowPostponeThisWeekDialog(info)) return;
        const alreadyChose = await hasExPostponeChoiceToday(id);
        if (cancelled) return;
        if (alreadyChose) {
          postponePromptedRuleIdRef.current = id;
          return;
        }
        postponePromptedRuleIdRef.current = id;
        showPostponeThisWeekDialog({
          onCompletePrevious: () => {
            void (async () => {
              const recorded = await recordExPostponeChoice(id, 1);
              if (!recorded) return;
              const ok = await postponeThisWeekByRuleId(id);
              if (!ok) return;
              void loadExerciseRule();
            })();
          },
          onStartToday: () => {
            void recordExPostponeChoice(id, 0);
          },
        });
      } catch {
        // ignore
      }
    };
    void checkPostpone();
    return () => {
      cancelled = true;
    };
  }, [exerciseRule?.exPatientRuleId, isFamilyView, readOnly]);

  const prevPatientUserIdRef = useRef(patientUserId);
  /** 右上角切换家人后刷新（跳过首屏与 focus 重复请求） */
  useEffect(() => {
    if (!isFamilyView) return;
    if (prevPatientUserIdRef.current === patientUserId) return;
    prevPatientUserIdRef.current = patientUserId;
    hasLoadedRef.current = false;
    void loadExerciseRule({ silent: false });
  }, [patientUserId, isFamilyView, loadExerciseRule]);

  const pageTitle = exerciseRule?.prescriptionName?.trim() || '运动处方';

  useEffect(() => {
    const currentRuleId = exerciseRule?.exPatientRuleId != null
      ? String(exerciseRule.exPatientRuleId).trim()
      : '';
    const showStatsEntry = !isFamilyView && !exPatientRuleId && Boolean(currentRuleId);
    navigation.setOptions({
      title: pageTitle,
      headerTitle: undefined,
      headerRight: isFamilyView
        ? () => <FamilyRelationHeaderBadge label={relationLabel} />
        : showStatsEntry
          ? () => (
            <TouchableOpacity
              style={styles.headerHistoryBtn}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => {
                navigation.navigate('ExerciseExecutionStatsPage', {
                  exPatientRuleId: currentRuleId,
                });
              }}
            >
              <Image
                source={require('@/assets/images/exercise/icon_history.png')}
                style={styles.headerHistoryIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )
          : () => null,
    });
  }, [exPatientRuleId, exerciseRule?.exPatientRuleId, navigation, pageTitle, isFamilyView, relationLabel]);

  const onPressNav = useCallback((key: ExerciseNavKey) => {
    setActiveNav(key);
    setMountedTabs(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const pageList: { key: ExerciseNavKey; title: string; icon: number }[] = [
    {
      key: 'homeTraining',
      title: '居家自主训练',
      icon: require('@/assets/images/exercise/model.png'),
    },
    // {
    //   key: 'prescription',
    //   title: '运动处方',
    //   icon: require('@/assets/images/exercise/sport.png'),
    // },
    {
      key: 'inStoreRehab',
      title: '到店专项康复',
      icon: require('@/assets/images/exercise/sport.png'),
    },
  ];

  const statusTipLinkText = tipKind === 'completed' ? '点击查看处方执行情况' : '查看详情';
  const statusTipText = showStatusTip ? (
    <Text style={styles.emptyPrescriptionText}>
      {pauseTipPrefix}
      <Text style={styles.pauseTipLink}>{statusTipLinkText}</Text>
    </Text>
  ) : null;
  /** 无处方时：与空状态同一套 icon + 文案结构 */
  const emptyStatusTipNode = showStatusTip ? (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.emptyPrescription}
      onPress={openStatusTipDetail}
    >
      <Image
        source={require('@/assets/images/exercise/icon_yd_empty.png')}
        style={styles.emptyPrescriptionIcon}
      />
      {statusTipText}
    </TouchableOpacity>
  ) : null;
  /** 有处方但暂停时：顶部紧凑提示 */
  const compactStatusTipNode = showStatusTip ? (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.pauseTipBox}
      onPress={openStatusTipDetail}
    >
      <Flex align="start">
        <Image
          source={require('@/assets/images/exercise/icon_warn.png')}
          style={styles.inStoreDoneTipIcon}
        />
        <Text style={[styles.pauseTipText, { marginLeft: 5 }]}>
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
          <Text style={styles.topBoxText}>北体运动模型</Text>
        </Flex>
        <View style={styles.topNameBox}>
          <Flex style={{ marginTop: 7 }}>
            <Text style={styles.topNameText}>{displayName}</Text>
            {versionText ? (
              <Flex style={styles.containerBox}>
                <Image style={styles.topNameImage} source={require('@/assets/images/nutrition/star.png')} />
                <Text style={styles.cfText}>{versionText}</Text>
              </Flex>
            ) : null}
          </Flex>
          <Flex style={styles.topInfoBox}>
            <Flex style={styles.brBox}>
              <Text style={styles.brText}>{relationBadgeText}</Text>
            </Flex>
            <Text style={styles.topInfoText} numberOfLines={1} ellipsizeMode="tail">
              {infoText}
            </Text>
          </Flex>
          <Image style={styles.rightImg} source={require('@/assets/images/nutrition/order.png')} />
        </View>
      </View>
      {!prescriptionOnly ? (
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
      {loading && !exerciseRule ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : !exerciseRule ? (
        emptyStatusTipNode ?? (
          <View style={styles.emptyPrescription}>
            <Image
              source={require('@/assets/images/exercise/icon_yd_empty.png')}
              style={styles.emptyPrescriptionIcon}
            />
            {profileComplete ? (
              <Text style={styles.emptyPrescriptionText}>
                {readOnly ? '暂无运动处方' : '暂无运动处方，如需开方，请联系工作人员'}
              </Text>
            ) : (
              <Flex style={styles.emptyPrescriptionTextRow}>
                <Text style={styles.emptyPrescriptionTextInline}>暂无运动处方，请先</Text>
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
              <PrescriptionPage exerciseRule={exerciseRule} patientUserId={patientUserId} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {mountedTabs.homeTraining ? (
                <View style={{ flex: 1, display: activeNav === 'homeTraining' ? 'flex' : 'none' }}>
                  <TrainingPage
                    exerciseRule={exerciseRule}
                    forceReadOnly={readOnly}
                    lockToRule={Boolean(exPatientRuleId)}
                    patientUserId={patientUserId}
                  />
                </View>
              ) : null}
              {mountedTabs.prescription ? (
                <View style={{ flex: 1, display: activeNav === 'prescription' ? 'flex' : 'none' }}>
                  <PrescriptionPage exerciseRule={exerciseRule} patientUserId={patientUserId} />
                </View>
              ) : null}
              {mountedTabs.inStoreRehab ? (
                <View style={{ flex: 1, display: activeNav === 'inStoreRehab' ? 'flex' : 'none' }}>
                  <InStoreRehabPage
                    exerciseRule={exerciseRule}
                    lockToRule={Boolean(exPatientRuleId)}
                    patientUserId={patientUserId}
                  />
                </View>
              ) : null}
            </View>
          )}
        </View>
      )}

      {!prescriptionOnly && !readOnly && !showStatusTip && activeNav === 'homeTraining' && exerciseRule ? (
        <TouchableOpacity
          style={styles.checkInFab}
          activeOpacity={0.85}
          onPress={() => void onPressExerciseCheckInFab(exerciseRule)}>
          <Flex align="center">
            <Image
              style={styles.checkInFabIcon}
              source={require('@/assets/images/exercise/icon_dk.png')}
            />
            <Text style={styles.checkInFabText}>戳我打卡</Text>
          </Flex>
        </TouchableOpacity>
      ) : null}
    </PageLayout>
  );
}
