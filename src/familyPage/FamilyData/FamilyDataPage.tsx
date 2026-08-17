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
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { TabPageLayout } from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import { AppTheme } from '@/common/theme';
import type { AppDispatch, RootState } from '@/store/store';
import {
  fetchFamilyBindMyList,
  setSelectedFamilyKey,
} from '@/store/actions/family';
import {
  FAMILY_MEAL_STATUS_STYLE,
  chunkFamilyVitalRows,
  type FamilyAssessmentItem,
  type FamilyMealNutritionItem,
  type FamilyMedicationItem,
  type FamilyPrescriptionTypeItem,
} from './utils/familyDataHelpers';
import {
  getApprovedFamilyBindList,
  getChildFamilyDisplayName,
  getFamilyTabKey,
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
import TaskProgressRing from '@/src/features/schedule/components/TaskProgressRing';
import EmptyRecord from '@/src/components/EmptyRecord';
import styles from '@/css/family/data';

export default function FamilyDataPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const familyListRaw = useSelector((s: RootState) => s.family.list);
  const loadingFamily = useSelector((s: RootState) => s.family.loading);
  const selectedFamilyKey = useSelector((s: RootState) => s.family.selectedKey);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);
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

  const vitalRows = useMemo(() => chunkFamilyVitalRows(vitalItems, 2), [vitalItems]);

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

  const selectedRelationLabel = useMemo(() => {
    if (!selectedFamily) return '家人';
    return (
      relationLabelMap[String(selectedFamily.relationType ?? '')] ||
      selectedFamily.relationType?.trim() ||
      '家人'
    );
  }, [relationLabelMap, selectedFamily]);

  const familyViewParams = useMemo(() => {
    if (!selectedPatientUserId || !selectedFamily) return null;
    return {
      patientUserId: selectedPatientUserId,
      readOnly: true as const,
      relationLabel: selectedRelationLabel,
      displayName: getChildFamilyDisplayName(selectedFamily),
    };
  }, [selectedFamily, selectedPatientUserId, selectedRelationLabel]);

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
      return;
    }
    try {
      const items = await loadFamilyMedicationItems(patientUserId);
      setMedicationItems(items);
    } catch {
      setMedicationItems(emptyFamilyMedicationItems());
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
      void loadVitals(selectedPatientUserId);
      void loadPrescription(selectedPatientUserId);
      void loadMeals(selectedPatientUserId);
      void loadMedications(selectedPatientUserId);
      void loadAssessments(selectedPatientUserId);
    }, [
      dispatch,
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
            <View style={styles.familyListEmpty}>
              <EmptyRecord text="暂无绑定家人" compact />
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
                  const label =
                    relationLabelMap[String(item.relationType ?? '')] ||
                    item.relationType ||
                    '家人';
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
                    <Text style={styles.vitalDate}>{item.dateText || '--'}</Text>
                  </Flex>
                  <Text style={styles.vitalValue}>
                    {item.value}
                    {item.valueSuffix ? (
                      <Text style={styles.vitalValueSuffix}>{` ${item.valueSuffix}`}</Text>
                    ) : null}
                  </Text>
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
                      <Flex align="center" style={styles.medicationTitleWrap}>
                        <Text style={styles.medicationTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.missed ? (
                          <View style={styles.medicationMissedBadge}>
                            <Text style={styles.medicationMissedText}>漏服</Text>
                          </View>
                        ) : null}
                      </Flex>
                    </Flex>
                    {item.action === 'taken' ? (
                      <View style={styles.medicationTakenBadge}>
                        <Image
                          source={require('@/assets/family/data/med_taken.png')}
                          style={styles.medicationTakenIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.medicationTakenText}>今日已服</Text>
                      </View>
                    ) : (
                      <TouchableOpacity activeOpacity={0.85} style={styles.medicationRemindBtn}>
                        <Image
                          source={require('@/assets/family/data/icon_tip.png')}
                          style={styles.medicationTakenIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.medicationRemindText}>提醒</Text>
                      </TouchableOpacity>
                    )}
                  </Flex>
                </View>
              ))
            )}
          </View>
        </View>
        <View style={styles.vitalCard}>
          <Flex align="center" justify="between">
            <Text style={styles.vitalHeaderTitle}>评估结果</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!selectedPatientUserId}
              onPress={() => {
                if (!selectedPatientUserId) return;
                navigation.navigate('FamilyAssessmentHistory', {
                  patientUserId: selectedPatientUserId,
                });
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
                        navigation.navigate('FamilyAssessmentResult', {
                          id: item.recordId,
                          patientUserId: selectedPatientUserId,
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
      </ScrollView>
    </TabPageLayout>
  );
}
