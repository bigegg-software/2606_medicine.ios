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
import { AppTheme } from '@/common/theme';
import type { AppDispatch, RootState } from '@/store/store';
import {
  fetchFamilyBindMyList,
  setSelectedFamilyKey,
} from '@/store/actions/family';
import {
  FAMILY_MEAL_STATUS_STYLE,
  chunkFamilyVitalRows,
  hasAnyFamilyDataPagePermission,
  hasFamilyDataPermission,
  type FamilyAssessmentItem,
  type FamilyMealNutritionItem,
  type FamilyMedicationItem,
  type FamilyPrescriptionTypeItem,
} from './utils/familyDataHelpers';
import {
  getApprovedFamilyBindList,
  getChildFamilyDisplayName,
  getFamilyTabKey,
  getFamilyTabLabel,
  isFamilyBindPending,
} from '../utils/familyProfileHelpers';
import {
  emptyFamilyVitalItems,
  loadFamilyVitalDisplayValues,
  mergeFamilyVitalItems,
} from './utils/familyDataVitalHelpers';
import {
  emptyFamilyPrescriptionItems,
  loadFamilyPrescriptionItems,
} from './utils/familyDataPrescriptionHelpers';
import {
  emptyFamilyMealNutritionItems,
  loadFamilyMealNutritionItems,
} from './utils/familyDataMealHelpers';
import {
  emptyFamilyMedicationItems,
  loadFamilyMedicationItems,
} from './utils/familyDataMedicationHelpers';
import {
  emptyFamilyAssessmentItems,
  loadFamilyAssessmentItems,
} from './utils/familyDataAssessmentHelpers';
import {
  loadFamilyMedicationRemindedKeys,
  resolveFamilyMedicationRemindSenderName,
  sendFamilyMedicationRemindMessage,
} from './utils/familyDataMedicationRemindHelpers';
import TaskProgressRing from '@/src/features/schedule/components/TaskProgressRing';
import EmptyRecord from '@/src/components/EmptyRecord';
import styles from '@/css/family/data';

export default function FamilyDataPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const familyListRaw = useSelector((s: RootState) => s.family.list);
  const loadingFamily = useSelector((s: RootState) => s.family.loading);
  const selectedFamilyKey = useSelector((s: RootState) => s.family.selectedKey);
  const userInfo = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const [vitalItems, setVitalItems] = useState(emptyFamilyVitalItems);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState<FamilyPrescriptionTypeItem[]>(
    emptyFamilyPrescriptionItems,
  );
  const [mealItems, setMealItems] = useState<FamilyMealNutritionItem[]>(emptyFamilyMealNutritionItems);
  const [medicationItems, setMedicationItems] = useState<FamilyMedicationItem[]>(
    emptyFamilyMedicationItems,
  );
  const [assessmentItems, setAssessmentItems] = useState<FamilyAssessmentItem[]>(
    emptyFamilyAssessmentItems,
  );
  const [remindedMedicationKeys, setRemindedMedicationKeys] = useState<Record<string, true>>({});
  const [remindingMedicationKey, setRemindingMedicationKey] = useState('');

  const familyList = useMemo(
    () => getApprovedFamilyBindList(familyListRaw),
    [familyListRaw],
  );

  const selectedFamily = useMemo(() => {
    if (!selectedFamilyKey) return familyList[0] ?? null;
    return (
      familyList.find((item, index) => getFamilyTabKey(item, index) === selectedFamilyKey) ??
      familyList[0] ??
      null
    );
  }, [familyList, selectedFamilyKey]);

  const selectedPatientUserId = useMemo(() => {
    const id = selectedFamily?.patientUserId;
    return id != null ? String(id) : '';
  }, [selectedFamily]);
  const bindPending = isFamilyBindPending(selectedFamily);

  const canViewHealthData = !bindPending && hasFamilyDataPermission(selectedFamily, 'health_data');
  const canViewExercise = !bindPending && hasFamilyDataPermission(selectedFamily, 'exercise');
  const canViewDiet = !bindPending && hasFamilyDataPermission(selectedFamily, 'diet');
  const canViewMedication = !bindPending && hasFamilyDataPermission(selectedFamily, 'medication');
  const canViewAssessment = !bindPending && hasFamilyDataPermission(selectedFamily, 'assessment');
  const hasAnyDataSection = !bindPending && hasAnyFamilyDataPagePermission(selectedFamily);

  const vitalRows = useMemo(() => chunkFamilyVitalRows(vitalItems, 2), [vitalItems]);

  const selectedRelationLabel = useMemo(() => {
    if (!selectedFamily) return '家人';
    return getFamilyTabLabel(selectedFamily);
  }, [selectedFamily]);

  const familyViewParams = useMemo(() => {
    if (!selectedPatientUserId || !selectedFamily) return null;
    return {
      patientUserId: selectedPatientUserId,
      readOnly: true as const,
      relationLabel: selectedRelationLabel,
      displayName: getChildFamilyDisplayName(selectedFamily),
    };
  }, [selectedFamily, selectedPatientUserId, selectedRelationLabel]);

  const medicationRemindSenderName = useMemo(
    () => resolveFamilyMedicationRemindSenderName(userInfo, systemUser),
    [systemUser, userInfo],
  );

  useEffect(() => {
    setRemindedMedicationKeys({});
    setRemindingMedicationKey('');
  }, [selectedPatientUserId]);

  const handleMedicationRemind = useCallback(
    async (item: FamilyMedicationItem) => {
      if (!selectedPatientUserId || !item.key) return;
      if (remindedMedicationKeys[item.key] || remindingMedicationKey) return;
      setRemindingMedicationKey(item.key);
      const result = await sendFamilyMedicationRemindMessage({
        patientUserId: selectedPatientUserId,
        senderName: medicationRemindSenderName,
        medicationName: item.title,
        bizId: item.key,
        medicationPlanId: item.medicationPlanId,
        time: item.time,
      });
      setRemindingMedicationKey('');
      if (!result.ok) {
        Toast.show(result.message ?? '提醒发送失败');
        return;
      }
      setRemindedMedicationKeys(prev => ({ ...prev, [item.key]: true }));
      Toast.show('已发送用药提醒');
    },
    [
      medicationRemindSenderName,
      remindedMedicationKeys,
      remindingMedicationKey,
      selectedPatientUserId,
    ],
  );

  const loadVitals = useCallback(async (patientUserId: string) => {
    if (!patientUserId) {
      setVitalItems(emptyFamilyVitalItems());
      return;
    }
    setLoadingVitals(true);
    try {
      const values = await loadFamilyVitalDisplayValues(patientUserId);
      setVitalItems(mergeFamilyVitalItems(values));
    } catch {
      setVitalItems(emptyFamilyVitalItems());
    } finally {
      setLoadingVitals(false);
    }
  }, []);

  const loadPrescription = useCallback(async (patientUserId: string) => {
    if (!patientUserId) {
      setPrescriptionItems(emptyFamilyPrescriptionItems());
      return;
    }
    try {
      const items = await loadFamilyPrescriptionItems(patientUserId);
      setPrescriptionItems(items);
    } catch {
      setPrescriptionItems(emptyFamilyPrescriptionItems());
    }
  }, []);

  const loadMeals = useCallback(async (patientUserId: string) => {
    if (!patientUserId) {
      setMealItems(emptyFamilyMealNutritionItems());
      return;
    }
    try {
      const items = await loadFamilyMealNutritionItems(patientUserId);
      setMealItems(items);
    } catch {
      setMealItems(emptyFamilyMealNutritionItems());
    }
  }, []);

  const loadMedications = useCallback(async (patientUserId: string) => {
    if (!patientUserId) {
      setMedicationItems(emptyFamilyMedicationItems());
      setRemindedMedicationKeys({});
      return;
    }
    try {
      const [items, remindedKeys] = await Promise.all([
        loadFamilyMedicationItems(patientUserId),
        loadFamilyMedicationRemindedKeys(patientUserId),
      ]);
      setMedicationItems(items);
      setRemindedMedicationKeys(remindedKeys);
    } catch {
      setMedicationItems(emptyFamilyMedicationItems());
      setRemindedMedicationKeys({});
    }
  }, []);

  const loadAssessments = useCallback(async (patientUserId: string) => {
    if (!patientUserId) {
      setAssessmentItems(emptyFamilyAssessmentItems());
      return;
    }
    try {
      const items = await loadFamilyAssessmentItems(patientUserId);
      setAssessmentItems(items);
    } catch {
      setAssessmentItems(emptyFamilyAssessmentItems());
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchFamilyBindMyList());
      if (canViewHealthData) {
        void loadVitals(selectedPatientUserId);
      } else {
        setVitalItems(emptyFamilyVitalItems());
      }
      if (canViewExercise) {
        void loadPrescription(selectedPatientUserId);
      } else {
        setPrescriptionItems(emptyFamilyPrescriptionItems());
      }
      if (canViewDiet) {
        void loadMeals(selectedPatientUserId);
      } else {
        setMealItems(emptyFamilyMealNutritionItems());
      }
      if (canViewMedication) {
        void loadMedications(selectedPatientUserId);
      } else {
        setMedicationItems(emptyFamilyMedicationItems());
        setRemindedMedicationKeys({});
      }
      if (canViewAssessment) {
        void loadAssessments(selectedPatientUserId);
      } else {
        setAssessmentItems(emptyFamilyAssessmentItems());
      }
    }, [
      dispatch,
      canViewAssessment,
      canViewDiet,
      canViewExercise,
      canViewHealthData,
      canViewMedication,
      loadAssessments,
      loadMeals,
      loadMedications,
      loadPrescription,
      loadVitals,
      selectedPatientUserId,
    ]),
  );

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.familyTabBar}>
          {loadingFamily && familyList.length === 0 ? (
            <View style={styles.familyListEmpty}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : familyList.length === 0 ? (
            <View style={styles.vitalNoData}>
              <EmptyRecord text="暂无绑定家人" />
            </View>
          ) : (
            <Flex align="center" style={styles.familyTabBarInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.familyTabScroll}
                style={styles.familyTabScrollWrap}
              >
                {familyList.map((item, index) => {
                  const key = getFamilyTabKey(item, index);
                  const label = getFamilyTabLabel(item);
                  const selected = selectedFamilyKey === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.85}
                      onPress={() => dispatch(setSelectedFamilyKey(key))}
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
            </Flex>
          )}
        </View>

        {selectedFamily && bindPending ? (
          <View style={styles.vitalNoData}>
            <EmptyRecord text="等待确认中" />
          </View>
        ) : null}

        {selectedFamily && !bindPending && !hasAnyDataSection ? (
          <View style={styles.vitalNoData}>
            <EmptyRecord text="对方暂未授权查看内容" />
          </View>
        ) : null}

        {canViewHealthData ? (
          <View style={styles.vitalCard}>
            <Flex align="center" justify="between">
              <Text style={styles.vitalHeaderTitle}>体征监测</Text>
              <Text style={styles.vitalHeaderRight}>
                {loadingVitals ? '加载中…' : '最新一条'}
              </Text>
            </Flex>
            {vitalRows.map((row, rowIndex) => (
              <Flex
                key={rowIndex}
                align="stretch"
                style={[styles.vitalRow, rowIndex === 0 ? styles.vitalRowFirst : null]}
              >
                {row.map(item => (
                  <View key={item.key} style={styles.vitalItem}>
                    <Flex align="center" justify="between">
                      <Flex align="center" style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                        <Image source={item.icon} style={styles.vitalIcon} resizeMode="contain" />
                        <Text style={styles.vitalLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                      </Flex>
                      <View
                        style={[
                          styles.vitalStatus,
                          { borderColor: item.statusColor || '#999999' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.vitalStatusText,
                            { color: item.statusColor || '#999999' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.statusText || '--'}
                        </Text>
                      </View>
                    </Flex>
                    <Text style={styles.vitalValue}>
                      {item.value}
                      {item.valueSuffix ? (
                        <Text style={styles.vitalValueSuffix}>{` ${item.valueSuffix}`}</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.vitalDate}>{item.dateText || '--'}</Text>
                  </View>
                ))}
                {row.length === 1 ? <View style={styles.vitalItemPlaceholder} /> : null}
              </Flex>
            ))}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.vitalTrendBtn}
              disabled={!selectedPatientUserId}
              onPress={() => {
                if (!selectedPatientUserId) return;
                navigation.navigate('VitalsPage', {
                  patientUserId: selectedPatientUserId,
                  readOnly: true,
                  relationLabel: selectedRelationLabel,
                });
              }}
            >
              <Flex align="center" justify="center">
                <Text style={styles.vitalTrendBtnText}>查看全部体征趋势图</Text>
                <Image
                  source={require('@/assets/images/schedule/right.png')}
                  style={styles.vitalTrendArrow}
                  resizeMode="contain"
                />
              </Flex>
            </TouchableOpacity>
          </View>
        ) : null}

        {canViewExercise ? (
          <View style={styles.vitalCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!familyViewParams}
              onPress={() => {
                if (!familyViewParams) return;
                navigation.navigate('ExercisePage', familyViewParams);
              }}
            >
              <Flex align="center" justify="between">
                <Text style={styles.vitalHeaderTitle}>运动处方</Text>
                <Flex align="center">
                  <Text style={styles.vitalHeaderRight}>查看</Text>
                  <Image
                    source={require('@/assets/images/schedule/right.png')}
                    style={styles.vitalTrendArrow}
                    resizeMode="contain"
                  />
                </Flex>
              </Flex>
            </TouchableOpacity>
            <View style={styles.prescriptionTypeBox}>
              {prescriptionItems.map(item => (
                <View key={item.key} style={styles.prescriptionTypeCol}>
                  <Flex align="center">
                    <Image
                      source={item.icon}
                      style={styles.prescriptionTypeIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.prescriptionTypeTitle}>{item.title}</Text>
                  </Flex>
                  <View style={styles.prescriptionTypeProgress}>
                    <TaskProgressRing
                      progress={item.progress}
                      progressColor={item.progressColor}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {canViewDiet ? (
          <View style={styles.vitalCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!familyViewParams}
              onPress={() => {
                if (!familyViewParams) return;
                navigation.navigate('NutritionPage', {
                  ...familyViewParams,
                  tab: 'diet',
                });
              }}
            >
              <Flex align="center" justify="between">
                <Text style={styles.vitalHeaderTitle}>用餐记录</Text>
                <Flex align="center">
                  <Text style={styles.vitalHeaderRight}>查看</Text>
                  <Image
                    source={require('@/assets/images/schedule/right.png')}
                    style={styles.vitalTrendArrow}
                    resizeMode="contain"
                  />
                </Flex>
              </Flex>
            </TouchableOpacity>
            <View style={styles.mealNutritionBox}>
              {mealItems.map(item => {
                const statusStyle = FAMILY_MEAL_STATUS_STYLE[item.status];
                return (
                  <View key={item.key} style={styles.mealNutritionItem}>
                    <Flex align="center" justify="between">
                      <Flex align="center" style={{ flex: 1 }}>
                        <Image
                          source={item.icon}
                          style={styles.mealNutritionIcon}
                          resizeMode="contain"
                        />
                        <Text style={[styles.mealNutritionTitle, { color: item.titleColor }]}>
                          {item.title}
                        </Text>
                      </Flex>
                      <View
                        style={[
                          styles.mealNutritionStatus,
                          {
                            backgroundColor: statusStyle.backgroundColor,
                            borderColor: statusStyle.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.mealNutritionStatusText, { color: statusStyle.color }]}>
                          {item.status}
                        </Text>
                      </View>
                    </Flex>
                    <Text style={styles.mealNutritionValue}>
                      {item.currentValue}
                      <Text style={styles.mealNutritionValueTarget}>/{item.targetValue}</Text>
                    </Text>
                    <View style={styles.mealNutritionBarTrack}>
                      <View
                        style={[
                          styles.mealNutritionBarFill,
                          {
                            width: `${Math.max(0, Math.min(item.progress, 100))}%`,
                            backgroundColor: item.progressColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
        {canViewMedication ? (
          <View style={styles.vitalCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!familyViewParams}
              onPress={() => {
                if (!familyViewParams) return;
                navigation.navigate('Medication', {
                  ...familyViewParams,
                  tab: 'medication',
                });
              }}
            >
              <Flex align="center" justify="between">
                <Text style={styles.vitalHeaderTitle}>用药记录</Text>
                <Flex align="center">
                  <Text style={styles.vitalHeaderRight}>查看</Text>
                  <Image
                    source={require('@/assets/images/schedule/right.png')}
                    style={styles.vitalTrendArrow}
                    resizeMode="contain"
                  />
                </Flex>
              </Flex>
            </TouchableOpacity>
            <View>
              {medicationItems.length === 0 ? (
                <View style={styles.sectionEmpty}>
                  <EmptyRecord text="暂无用药计划" compact />
                </View>
              ) : (
                medicationItems.map((item, index) => (
                  <View
                    key={item.key}
                    style={[
                      styles.medicationItem,
                      index === 0 ? styles.medicationItemFirst : styles.medicationItemGap,
                    ]}
                  >
                    <Flex align="center" justify="between">
                      <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
                        <Image source={item.icon} style={styles.medicationIcon} resizeMode="contain" />
                        <View style={styles.medicationTitleWrap}>
                          <Flex align="center">
                            <Text style={styles.medicationTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <View
                              style={[
                                styles.medicationStatusBadge,
                                item.action === 'taken'
                                  ? styles.medicationStatusTaken
                                  : styles.medicationStatusUntaken,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.medicationStatusText,
                                  item.action === 'taken'
                                    ? styles.medicationStatusTextTaken
                                    : styles.medicationStatusTextUntaken,
                                ]}
                              >
                                {item.action === 'taken' ? '已服用' : '未服用'}
                              </Text>
                            </View>
                          </Flex>
                          <Text style={styles.medicationMeta} numberOfLines={1}>
                            {[item.time, item.dose, item.meal, item.frequency]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                      </Flex>
                      {item.action === 'remind' ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={[
                            styles.medicationRemindBtn,
                            (remindedMedicationKeys[item.key] || remindingMedicationKey === item.key)
                              ? styles.medicationRemindBtnDisabled
                              : null,
                          ]}
                          disabled={
                            Boolean(remindedMedicationKeys[item.key])
                            || Boolean(remindingMedicationKey)
                          }
                          onPress={() => {
                            void handleMedicationRemind(item);
                          }}
                        >
                          {remindedMedicationKeys[item.key] ? null : (
                            <Image
                              source={require('@/assets/family/data/icon_tip.png')}
                              style={styles.medicationTakenIcon}
                              resizeMode="contain"
                            />
                          )}
                          <Text
                            style={[
                              styles.medicationRemindText,
                              remindedMedicationKeys[item.key]
                                ? styles.medicationRemindTextDisabled
                                : null,
                            ]}
                          >
                            {remindedMedicationKeys[item.key] ? '已提醒' : '提醒'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </Flex>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}
        {canViewAssessment ? (
          <View style={styles.vitalCard}>
            <Flex align="center" justify="between">
              <Text style={styles.vitalHeaderTitle}>评估结果</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!selectedPatientUserId}
                onPress={() => {
                  if (!selectedPatientUserId) return;
                  if (!familyViewParams) return;
                  navigation.navigate('FamilyAssessmentHistory', familyViewParams);
                }}
              >
                <Flex align="center">
                  <Text style={styles.vitalHeaderRight}>全部</Text>
                  <Image
                    source={require('@/assets/images/schedule/right.png')}
                    style={styles.vitalTrendArrow}
                    resizeMode="contain"
                  />
                </Flex>
              </TouchableOpacity>
            </Flex>
            <View>
              {assessmentItems.length === 0 ? (
                <View style={styles.sectionEmpty}>
                  <EmptyRecord text="暂无评估记录" compact />
                </View>
              ) : (
                assessmentItems.map((item, index) => (
                  <View
                    key={item.key}
                    style={[
                      styles.assessmentItem,
                      index === 0 ? styles.assessmentItemFirst : styles.assessmentItemGap,
                    ]}
                  >
                    <Flex align="center" justify="between">
                      <View style={styles.assessmentTextWrap}>
                        <Text style={styles.assessmentTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.assessmentSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.assessmentReportBtn}
                        disabled={!item.recordId || !selectedPatientUserId}
                        onPress={() => {
                          if (!item.recordId || !selectedPatientUserId) return;
                          if (!familyViewParams) return;
                          navigation.navigate('FamilyAssessmentResult', {
                            id: item.recordId,
                            ...familyViewParams,
                            ...(item.type != null ? { type: item.type } : {}),
                          });
                        }}
                      >
                        <Text style={styles.assessmentReportBtnText}>查看报告</Text>
                      </TouchableOpacity>
                    </Flex>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </TabPageLayout>
  );
}
