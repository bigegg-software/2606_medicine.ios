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
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { getExPatientRuleInfo, type ExPatientRuleInfo } from '@/api/exPatientRule';
import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import { isUserBaseInfoComplete } from '@/src/features/profile/healthRecord/utils/profileCompletenessHelpers';
import CompleteProfileLink from '@/src/features/profile/healthRecord/components/CompleteProfileLink';
import type { RootStackParamList } from '@/route/router';
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import { getChildFamilyDisplayName, maskFamilyDisplayName } from '@/src/familyPage/utils/familyProfileHelpers';

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
  const isFamilyView = Boolean(patientUserId);
  const readOnly = familyReadOnly || Boolean(exPatientRuleId);
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const familyList = useSelector((s: RootState) => s.family.list);
  const [familyUser, setFamilyUser] = useState<UserBaseInfo | null>(null);
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

  const [activeNav, setActiveNav] = useState(0);
  const [exerciseRule, setExerciseRule] = useState<InUseExPatientRule | null>(null);
  const [loading, setLoading] = useState(true);
  /** 已访问过的 tab 保持挂载，避免切换时重复请求 */
  const [mountedTabs, setMountedTabs] = useState<Record<number, boolean>>({ 0: true });
  const infoText = formatExerciseUserInfoText(
    profileUser,
    readOnly && isFamilyView ? null : userExtr,
    exerciseRule?.diagnosticLabel,
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

  const loadExerciseRule = useCallback(async () => {
    try {
      const opts = patientUserId ? { patientUserId } : undefined;
      // 历史计划详情：/patient/exPatientRule/getInfo?exPatientRuleId=
      // 进行中/家人查看：getInUseInfo
      const [ruleRes, baseRes] = await Promise.all([
        exPatientRuleId
          ? getExPatientRuleInfo(String(exPatientRuleId), opts)
          : getInUseExPatientRuleInfo(opts),
        isFamilyView && patientUserId
          ? getUserBaseInfo({ patientUserId }).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (!isResourceApiOk(ruleRes as unknown as { code?: number })) {
        setExerciseRule(null);
      } else {
        const raw = apiResourceData<ExPatientRuleInfo>(ruleRes as unknown as never);
        setExerciseRule(raw ? (normalizeExPatientRuleInfo(raw) as InUseExPatientRule) : null);
      }
      if (baseRes && isResourceApiOk(baseRes as unknown as { code?: number })) {
        setFamilyUser(apiResourceData<UserBaseInfo>(baseRes as unknown as never) ?? null);
      } else if (isFamilyView) {
        setFamilyUser(null);
      }
    } catch {
      setExerciseRule(null);
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
      void loadExerciseRule();
    }, [dispatch, loadExerciseRule, isFamilyView]),
  );

  const prevPatientUserIdRef = useRef(patientUserId);
  /** 右上角切换家人后刷新（跳过首屏与 focus 重复请求） */
  useEffect(() => {
    if (!isFamilyView) return;
    if (prevPatientUserIdRef.current === patientUserId) return;
    prevPatientUserIdRef.current = patientUserId;
    void loadExerciseRule();
  }, [patientUserId, isFamilyView, loadExerciseRule]);

  const pageTitle = exerciseRule?.prescriptionName?.trim() || '运动处方';

  useEffect(() => {
    const showHistoryEntry = !isFamilyView && !exPatientRuleId;
    navigation.setOptions({
      title: pageTitle,
      headerTitle: undefined,
      headerRight: isFamilyView
        ? () => <FamilyRelationHeaderBadge label={relationLabel} />
        : showHistoryEntry
          ? () => (
            <TouchableOpacity
              style={styles.headerHistoryBtn}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => navigation.navigate('ScheduleHistoryPage')}
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
  }, [exPatientRuleId, navigation, pageTitle, isFamilyView, relationLabel]);

  const onPressNav = useCallback((index: number) => {
    setActiveNav(index);
    setMountedTabs(prev => (prev[index] ? prev : { ...prev, [index]: true }));
  }, []);

  const pageList = [
    {
      title: '今日训练',
      icon: require('@/assets/images/exercise/model.png'),
    },
    {
      title: '运动处方',
      icon: require('@/assets/images/exercise/sport.png'),
    },
  ];

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
            <Text style={styles.topInfoText}>{infoText}</Text>
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
      {loading && !exerciseRule ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : !exerciseRule ? (
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
      ) : (
        <View style={{ flex: 1 }}>
          {mountedTabs[0] ? (
            <View style={{ flex: 1, display: activeNav === 0 ? 'flex' : 'none' }}>
              <TrainingPage
                exerciseRule={exerciseRule}
                forceReadOnly={readOnly}
                lockToRule={Boolean(exPatientRuleId)}
                patientUserId={patientUserId}
              />
            </View>
          ) : null}
          {mountedTabs[1] ? (
            <View style={{ flex: 1, display: activeNav === 1 ? 'flex' : 'none' }}>
              <PrescriptionPage exerciseRule={exerciseRule} patientUserId={patientUserId} />
            </View>
          ) : null}
        </View>
      )}

      {!readOnly && activeNav === 0 && exerciseRule ? (
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
