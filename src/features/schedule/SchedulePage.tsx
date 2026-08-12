import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import styles from '@/css/schedule/schedule';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchInUsePrescription } from '@/store/actions/prescription';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { getMeasureDataLatestByType, type MeasureDataItem } from '@/api/measureData';
import {
  getExPatientRuleModuleCompleteRate,
  type ExPatientRuleModuleCompleteRate,
} from '@/api/exPatientRule';
import {
  getExMilestoneInfo,
  getExMilestoneRecentSixWeekStats,
  type ExMilestoneInfo,
  type ExMilestoneWeekStat,
} from '@/api/exMilestone';
import HistoryArchiveCard from './HistoryArchiveCard';
import {
  buildMilestoneWeekModuleRates,
  calcMilestoneWeekBarProgress,
  calcMilestoneWeekOverallRate,
  formatMilestoneHours,
  formatMilestoneWeekBarDuration,
  formatScheduleTopInfoText,
  getPrescriptionDayProgress,
  loadScheduleHistoryArchivePreview,
  normalizeProgress,
  type ScheduleHistoryArchiveItem,
} from './scheduleHelpers';
import {
  buildScheduleGoalProgressItems,
  buildVisibleScheduleGoalCategoryTabs,
  filterScheduleGoalsByCategory,
  getScheduleGoalCategoryTab,
  loadHealthTestFirstAndLatestByGoalId,
  loadPrescriptionEarliestMeasures,
  loadQuestionnaireFirstAndLatestByGoalId,
  openScheduleGoalDetail,
} from './scheduleGoalHelpers';

export default function SchedulePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.user.info);
  const prescription = useSelector((s: RootState) => s.prescription.inUse);
  const categoryLabelMap = useSelector((s: RootState) => s.prescription.categoryLabelMap);
  const categorySortMap = useSelector((s: RootState) => s.prescription.categorySortMap);
  const [activeNavTab, setActiveNavTab] = useState('');
  const [milestoneInfo, setMilestoneInfo] = useState<ExMilestoneInfo | null>(null);
  const [sixWeekStats, setSixWeekStats] = useState<ExMilestoneWeekStat[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [latestWeightKg, setLatestWeightKg] = useState<number | null>(null);
  const [latestBloodGlucose, setLatestBloodGlucose] = useState<number | null>(null);
  const [latestBloodPressure, setLatestBloodPressure] = useState<{
    sbp: number | null;
    dbp: number | null;
  } | null>(null);
  const [latestUricAcid, setLatestUricAcid] = useState<number | null>(null);
  const [latestBloodLipid, setLatestBloodLipid] = useState<{
    ldlC: number | null;
    hdlC: number | null;
    tc: number | null;
    tg: number | null;
  } | null>(null);
  const [baselineWeightKg, setBaselineWeightKg] = useState<number | null>(null);
  const [baselineBloodGlucose, setBaselineBloodGlucose] = useState<number | null>(null);
  const [baselineBloodPressure, setBaselineBloodPressure] = useState<{
    sbp: number | null;
    dbp: number | null;
  } | null>(null);
  const [baselineUricAcid, setBaselineUricAcid] = useState<number | null>(null);
  const [baselineBloodLipid, setBaselineBloodLipid] = useState<{
    ldlC: number | null;
    hdlC: number | null;
    tc: number | null;
    tg: number | null;
  } | null>(null);
  const [latestHealthTestByGoalId, setLatestHealthTestByGoalId] = useState<Record<string, number | null>>({});
  const [baselineHealthTestByGoalId, setBaselineHealthTestByGoalId] = useState<Record<string, number | null>>({});
  const [latestJointRomByGoalId, setLatestJointRomByGoalId] = useState<
    Record<string, Partial<Record<string, number | null>>>
  >({});
  const [baselineJointRomByGoalId, setBaselineJointRomByGoalId] = useState<
    Record<string, Partial<Record<string, number | null>>>
  >({});
  const [latestQuestionnaireByGoalId, setLatestQuestionnaireByGoalId] = useState<Record<string, number | null>>({});
  const [baselineQuestionnaireByGoalId, setBaselineQuestionnaireByGoalId] = useState<Record<string, number | null>>({});
  const [prescriptionMainCompleteRate, setPrescriptionMainCompleteRate] = useState<number | null>(null);
  const [historyArchiveItems, setHistoryArchiveItems] = useState<ScheduleHistoryArchiveItem[]>([]);

  const topInfoText = useMemo(
    () => formatScheduleTopInfoText(user, prescription),
    [user, prescription],
  );

  const dayProgress = useMemo(
    () => getPrescriptionDayProgress(prescription?.startDate, prescription?.endDate),
    [prescription?.endDate, prescription?.startDate],
  );

  const categoryTabs = useMemo(
    () => buildVisibleScheduleGoalCategoryTabs(
      prescription?.healthGoalTargetList,
      categoryLabelMap,
      categorySortMap,
    ),
    [categoryLabelMap, categorySortMap, prescription?.healthGoalTargetList],
  );

  useEffect(() => {
    if (!categoryTabs.length) {
      if (activeNavTab) setActiveNavTab('');
      return;
    }
    if (!categoryTabs.some(tab => tab.key === activeNavTab)) {
      setActiveNavTab(categoryTabs[0].key);
    }
  }, [activeNavTab, categoryTabs]);

  const goalItems = useMemo(
    () => buildScheduleGoalProgressItems(prescription?.healthGoalTargetList, {
      categoryLabelMap,
      startDate: prescription?.startDate,
      endDate: prescription?.endDate,
      currentWeightKg: latestWeightKg,
      currentBloodGlucose: latestBloodGlucose,
      currentBloodPressure: latestBloodPressure,
      currentUricAcid: latestUricAcid,
      currentBloodLipid: latestBloodLipid,
      baselineWeightKg,
      baselineBloodGlucose,
      baselineBloodPressure,
      baselineUricAcid,
      baselineBloodLipid,
      currentHealthTestByGoalId: latestHealthTestByGoalId,
      baselineHealthTestByGoalId,
      currentJointRomByGoalId: latestJointRomByGoalId,
      baselineJointRomByGoalId,
      currentQuestionnaireByGoalId: latestQuestionnaireByGoalId,
      baselineQuestionnaireByGoalId,
      prescriptionMainCompleteRate,
      prescriptionTargetWeight: prescription?.targetWeight,
    }),
    [
      baselineBloodGlucose,
      baselineBloodLipid,
      baselineBloodPressure,
      baselineHealthTestByGoalId,
      baselineJointRomByGoalId,
      baselineQuestionnaireByGoalId,
      baselineUricAcid,
      baselineWeightKg,
      categoryLabelMap,
      latestBloodGlucose,
      latestBloodLipid,
      latestBloodPressure,
      latestHealthTestByGoalId,
      latestJointRomByGoalId,
      latestQuestionnaireByGoalId,
      latestUricAcid,
      latestWeightKg,
      prescription?.endDate,
      prescription?.healthGoalTargetList,
      prescription?.startDate,
      prescription?.targetWeight,
      prescriptionMainCompleteRate,
    ],
  );

  const activeCategoryGoals = useMemo(
    () => filterScheduleGoalsByCategory(goalItems, activeNavTab),
    [activeNavTab, goalItems],
  );

  const activeCategoryTab = useMemo(() => {
    if (!categoryTabs.length) return null;
    return getScheduleGoalCategoryTab(activeNavTab, categoryTabs);
  }, [activeNavTab, categoryTabs]);

  const loadLatestMeasures = useCallback(async () => {
    const readLatestItem = async (type: '体重' | '血糖' | '血压' | '尿酸' | '血脂') => {
      try {
        const res = await getMeasureDataLatestByType(type);
        if (!isResourceApiOk(res as unknown as { code?: number })) return null;
        return apiResourceData<MeasureDataItem>(
          res as unknown as { code?: number; data?: MeasureDataItem },
        ) ?? null;
      } catch {
        return null;
      }
    };

    const toNumber = (value?: number | string | null) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const [weightItem, glucoseItem, pressureItem, uricAcidItem, lipidItem, earliest] = await Promise.all([
      readLatestItem('体重'),
      readLatestItem('血糖'),
      readLatestItem('血压'),
      readLatestItem('尿酸'),
      readLatestItem('血脂'),
      loadPrescriptionEarliestMeasures(prescription?.startDate, prescription?.endDate),
    ]);

    setLatestWeightKg(toNumber(weightItem?.val));
    setLatestBloodGlucose(toNumber(glucoseItem?.val));
    setLatestBloodPressure(
      pressureItem
        ? { sbp: toNumber(pressureItem.val), dbp: toNumber(pressureItem.val2) }
        : null,
    );
    setLatestUricAcid(toNumber(uricAcidItem?.val));
    setLatestBloodLipid(
      lipidItem
        ? {
          ldlC: toNumber(lipidItem.xuezhiLdlC),
          hdlC: toNumber(lipidItem.xuezhiHdlC),
          tc: toNumber(lipidItem.xuezhiTc ?? lipidItem.val),
          tg: toNumber(lipidItem.xuezhiTg),
        }
        : null,
    );

    setBaselineWeightKg(earliest.weightKg);
    setBaselineBloodGlucose(earliest.bloodGlucose);
    setBaselineBloodPressure(earliest.bloodPressure);
    setBaselineUricAcid(earliest.uricAcid);
    setBaselineBloodLipid(earliest.bloodLipid);
  }, [prescription?.endDate, prescription?.startDate]);

  const loadLatestHealthTestScores = useCallback(async () => {
    if (prescription?.exPatientRuleId == null) {
      setLatestHealthTestByGoalId({});
      setBaselineHealthTestByGoalId({});
      setLatestJointRomByGoalId({});
      setBaselineJointRomByGoalId({});
      return;
    }
    const {
      latestByGoalId,
      firstByGoalId,
      latestJointRomByGoalId: latestRom,
      firstJointRomByGoalId: firstRom,
    } = await loadHealthTestFirstAndLatestByGoalId(
      prescription.exPatientRuleId,
      prescription.healthGoalTargetList,
      user?.userId,
    );
    setLatestHealthTestByGoalId(latestByGoalId);
    setBaselineHealthTestByGoalId(firstByGoalId);
    setLatestJointRomByGoalId(latestRom);
    setBaselineJointRomByGoalId(firstRom);
  }, [prescription?.exPatientRuleId, prescription?.healthGoalTargetList, user?.userId]);

  const loadLatestQuestionnaireScores = useCallback(async () => {
    if (prescription?.exPatientRuleId == null) {
      setLatestQuestionnaireByGoalId({});
      setBaselineQuestionnaireByGoalId({});
      return;
    }
    const { latestByGoalId, firstByGoalId } = await loadQuestionnaireFirstAndLatestByGoalId(
      prescription.exPatientRuleId,
      prescription.healthGoalTargetList,
      user?.userId,
    );
    setLatestQuestionnaireByGoalId(latestByGoalId);
    setBaselineQuestionnaireByGoalId(firstByGoalId);
  }, [prescription?.exPatientRuleId, prescription?.healthGoalTargetList, user?.userId]);

  const loadPrescriptionMainCompleteRate = useCallback(async () => {
    if (prescription?.exPatientRuleId == null) {
      setPrescriptionMainCompleteRate(null);
      return;
    }
    try {
      const res = await getExPatientRuleModuleCompleteRate(String(prescription.exPatientRuleId));
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        setPrescriptionMainCompleteRate(null);
        return;
      }
      const data = apiResourceData<ExPatientRuleModuleCompleteRate>(
        res as unknown as { code?: number; data?: ExPatientRuleModuleCompleteRate },
      );
      const rate = Number(data?.mainCompleteRate);
      setPrescriptionMainCompleteRate(Number.isFinite(rate) ? rate : null);
    } catch {
      setPrescriptionMainCompleteRate(null);
    }
  }, [prescription?.exPatientRuleId]);

  const loadHistoryArchive = useCallback(async () => {
    try {
      const items = await loadScheduleHistoryArchivePreview();
      setHistoryArchiveItems(items);
    } catch {
      setHistoryArchiveItems([]);
    }
  }, []);

  const loadMilestoneStats = useCallback(async () => {
    try {
      const [infoRes, weekRes] = await Promise.all([
        getExMilestoneInfo(),
        getExMilestoneRecentSixWeekStats(),
      ]);

      if (isResourceApiOk(infoRes as unknown as { code?: number })) {
        setMilestoneInfo(
          apiResourceData<ExMilestoneInfo>(infoRes as unknown as { code?: number; data?: ExMilestoneInfo })
          ?? null,
        );
      } else {
        setMilestoneInfo(null);
      }

      if (isResourceApiOk(weekRes as unknown as { code?: number })) {
        const rows = apiResourceData<ExMilestoneWeekStat[]>(
          weekRes as unknown as { code?: number; data?: ExMilestoneWeekStat[] },
        ) ?? [];
        const list = Array.isArray(rows) ? rows.slice(0, 6) : [];
        setSixWeekStats(list);
        setSelectedWeekIndex(Math.max(0, list.length - 1));
      } else {
        setSixWeekStats([]);
        setSelectedWeekIndex(0);
      }
    } catch {
      setMilestoneInfo(null);
      setSixWeekStats([]);
      setSelectedWeekIndex(0);
    }
  }, []);

  const loadLatestMeasuresRef = useRef(loadLatestMeasures);
  loadLatestMeasuresRef.current = loadLatestMeasures;
  const loadLatestHealthTestScoresRef = useRef(loadLatestHealthTestScores);
  loadLatestHealthTestScoresRef.current = loadLatestHealthTestScores;
  const loadMilestoneStatsRef = useRef(loadMilestoneStats);
  loadMilestoneStatsRef.current = loadMilestoneStats;
  const loadHistoryArchiveRef = useRef(loadHistoryArchive);
  loadHistoryArchiveRef.current = loadHistoryArchive;

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchInUsePrescription({ force: true }));
      loadLatestMeasuresRef.current();
      loadMilestoneStatsRef.current();
      loadHistoryArchiveRef.current();
    }, [dispatch]),
  );

  useEffect(() => {
    void loadLatestHealthTestScores();
  }, [loadLatestHealthTestScores]);

  useEffect(() => {
    void loadLatestQuestionnaireScores();
  }, [loadLatestQuestionnaireScores]);

  useEffect(() => {
    void loadPrescriptionMainCompleteRate();
  }, [loadPrescriptionMainCompleteRate]);

  const sixWeekMaxMinutes = useMemo(
    () => sixWeekStats.reduce(
      (max, item) => Math.max(max, Math.max(0, Math.round(Number(item.exerciseDuration) || 0))),
      0,
    ),
    [sixWeekStats],
  );

  const selectedWeekStat = sixWeekStats[selectedWeekIndex] ?? null;
  const selectedWeekModuleRates = useMemo(
    () => buildMilestoneWeekModuleRates(selectedWeekStat),
    [selectedWeekStat],
  );
  const selectedWeekOverallRate = useMemo(
    () => calcMilestoneWeekOverallRate(selectedWeekStat),
    [selectedWeekStat],
  );

  const persistDaysText = useMemo(() => {
    const days = Math.max(0, Math.round(Number(milestoneInfo?.persistDays) || 0));
    return String(days);
  }, [milestoneInfo?.persistDays]);

  const overviewHoursText = useMemo(
    () => formatMilestoneHours(milestoneInfo?.exerciseDuration),
    [milestoneInfo?.exerciseDuration],
  );
  const overviewLessonsText = useMemo(() => {
    const value = Math.max(0, Math.round(Number(milestoneInfo?.totalLessons) || 0));
    return String(value);
  }, [milestoneInfo?.totalLessons]);
  const overviewRateText = useMemo(
    () => `${normalizeProgress(milestoneInfo?.avgCompleteRate)}%`,
    [milestoneInfo?.avgCompleteRate],
  );
  const overviewImproveText = useMemo(() => {
    const value = Math.max(0, Math.round(Number(milestoneInfo?.improveTargetCount) || 0));
    return String(value);
  }, [milestoneInfo?.improveTargetCount]);

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollNew}>

        <View style={styles.mH12}>
          <Flex style={styles.pageTitleBox}>
            <Text style={styles.pageTitle}>健康提升档案</Text>
            <Flex style={styles.pageTitleSubtitle}>
              <Text style={styles.pageTitleSubtitleText}>已坚持 {persistDaysText} 天</Text>
            </Flex>
          </Flex>
          <Text style={styles.pageTopText}>{topInfoText}</Text>

          <View style={styles.pageTopBgWrap}>
            <View style={styles.pageTopBg}>
              <Image
                style={styles.pageTopBgImg}
                resizeMode="cover"
                source={require('@/assets/images/schedule/daback.png')}
              />
              <View style={{ padding: 12 }}>
                <Flex>
                  <Image style={styles.pageTopBgIcon} source={require('@/assets/images/schedule/icon_jb.png')} />
                  <Text style={styles.pageTopBgText}>长期投入 · 成效总览</Text>
                </Flex>

                <Flex wrap='wrap' justify='between'>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back1.png')} />
                    <Text style={styles.topRowBoxItemValue}>{overviewHoursText}</Text>
                    <Text style={styles.topRowBoxItemText}>累计训练(小时)</Text>
                  </View>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back2.png')} />
                    <Text style={styles.topRowBoxItemValue}>{overviewLessonsText}</Text>
                    <Text style={styles.topRowBoxItemText}>累计课次</Text>
                  </View>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back3.png')} />
                    <Text style={styles.topRowBoxItemValue}>{overviewRateText}</Text>
                    <Text style={styles.topRowBoxItemText}>平均完成率</Text>
                  </View>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back4.png')} />
                    <Text style={styles.topRowBoxItemValue}>{overviewImproveText}</Text>
                    <Text style={styles.topRowBoxItemText}>改善指标数</Text>
                  </View>
                </Flex>
              </View>
            </View>
          </View>
        </View>

        <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
          <Flex justify="between" align="center" style={{ flex: 1, paddingHorizontal: 20 }}>
            <Text style={styles.backImage1Text}>目标拆解·进度</Text>
            <Text style={styles.dayProgressText}>
              <Text style={styles.dayProgressNum}>{dayProgress?.currentDay ?? '--'}</Text>
              /{dayProgress?.totalDays ?? '--'}天
            </Text>
          </Flex>
        </ImageBackground>

        {categoryTabs.length > 0 ? (
          <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={[styles.backImage1, { height: 66, marginTop: 0 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.navTabScroll}
            >
              {categoryTabs.map(tab => {
                const isActive = activeNavTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.85}
                    onPress={() => setActiveNavTab(tab.key)}
                    style={styles.navTabItem}
                  >
                    <Flex style={[styles.navTabBox, isActive && styles.navTabBoxActive]}>
                      <Image
                        style={styles.navTabIcon}
                        source={tab.icon}
                        tintColor={isActive ? '#FFFFFF' : '#333333'}
                      />
                      <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                        {tab.label}
                      </Text>
                    </Flex>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ImageBackground>
        ) : null}

        {activeCategoryTab ? (
          <View style={styles.commonWrap}>
            <Flex>
              <Image style={styles.pageTopBgIcon} tintColor={"#333"} source={activeCategoryTab.icon} />
              <View style={styles.sectionTitleWrap}>
                <LinearGradient
                  colors={['#6D925E', 'rgba(109,146,94,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleUnderline}
                />
                <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>{activeCategoryTab.label}</Text>
              </View>
              <Flex style={styles.tipBox}>
                <Text style={styles.tipText}>{activeCategoryTab.tip}</Text>
              </Flex>
            </Flex>

            <View style={styles.listBox}>
              {activeCategoryGoals.length > 0 ? activeCategoryGoals.map(item => (
                <TouchableOpacity
                  style={styles.listItem}
                  key={item.key}
                  activeOpacity={0.85}
                  onPress={() => openScheduleGoalDetail(navigation, item)}
                >
                  <Flex>
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </Flex>
                  <Flex justify='between' style={styles.listItemBox}>
                    <Flex>
                      <Text style={styles.listItemValue}>{item.valueText}</Text>
                      {item.unitText ? (
                        <Text style={styles.listItemUnit}>{item.unitText}</Text>
                      ) : null}
                      <Text style={styles.listItemTarget}>{item.targetText}</Text>
                    </Flex>
                    <Flex>
                      <Image
                        style={styles.listIcon}
                        source={
                          item.improveUp
                            ? require('@/assets/images/schedule/icon_gs.png')
                            : require('@/assets/images/schedule/icon_xx.png')
                        }
                      />
                      <Image
                        style={styles.listIcon}
                        source={
                          item.improveUp
                            ? require('@/assets/images/schedule/icon_up1.png')
                            : require('@/assets/images/schedule/icon_down1.png')
                        }
                      />
                      <Text style={styles.listItemValueNum}>{item.improveText}</Text>
                    </Flex>
                  </Flex>
                  <View style={styles.listItemLine}>
                    <View style={[styles.listItemLineFill, { width: `${Math.max(0, Math.min(item.progress, 100))}%` }]} />
                  </View>
                  <Flex justify='between' style={styles.listItemBtmBox}>
                    <Text style={styles.listItemBtmText}>{item.baselineHint}</Text>
                    <Text style={styles.listItemBtmText1}>{item.progress}%</Text>
                  </Flex>
                </TouchableOpacity>
              )) : (
                <View style={[styles.listItem, { marginTop: 12 }]}>
                  <Text style={styles.listItemBtmText}>暂无该分类下的健康目标</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        <View style={[styles.commonWrap, { marginTop: 12 }]}>
          <Flex justify="between" align="center">
            <Flex>
              <Image style={styles.pageTopBgIcon} tintColor={"#333"} source={require('@/assets/images/schedule/icon_id.png')} />
              <View style={styles.sectionTitleWrap}>
                <LinearGradient
                  colors={['#6D925E', 'rgba(109,146,94,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleUnderline}
                />
                <Text style={styles.sectionTitleText}>周期训练复盘</Text>
              </View>
            </Flex>
            <Text style={styles.rightText}>近6周</Text>
          </Flex>

          <Flex justify='between' style={styles.listItemBtmBox}>
            <Flex>
              <View style={styles.leftLine}></View>
              <Text style={styles.xlTitle}>每周总训练时长</Text>
            </Flex>
            {/* <Text style={styles.xlText}>点击可查看分项</Text> */}
          </Flex>

          <Flex align="stretch" style={styles.weekTrainWrap}>
            {(sixWeekStats.length > 0
              ? sixWeekStats
              : Array.from({ length: 6 }, () => ({} as ExMilestoneWeekStat))
            ).map((week, index) => {
              const progress = calcMilestoneWeekBarProgress(
                week.exerciseDuration,
                sixWeekMaxMinutes,
              );
              const selected = index === selectedWeekIndex;
              return (
                <TouchableOpacity
                  key={`week-${week.weekStartDate || index}`}
                  activeOpacity={0.85}
                  style={styles.weekBox}
                  onPress={() => setSelectedWeekIndex(index)}>
                  <Flex direction='column' justify='end' align='stretch' style={{ flex: 1 }}>
                    <View style={styles.iconBox}>
                      <Image style={styles.weekIcon} source={require('@/assets/images/schedule/icon_wx.png')} />
                      <Text style={styles.weekText}>
                        {formatMilestoneWeekBarDuration(week.exerciseDuration)}
                      </Text>
                    </View>
                    <View style={styles.weekProgress}>
                      <View
                        style={[
                          styles.weekProgressBar,
                          { height: Math.max(0, Math.min(progress, 100)) / 100 * 44 },
                          progress >= 100 && styles.weekProgressBarDone,
                          selected ? { opacity: 1 } : { opacity: 0.7 },
                        ]}
                      />
                    </View>
                    <Text style={styles.WTitle}>{`W${index + 1}`}</Text>
                  </Flex>
                </TouchableOpacity>
              );
            })}
          </Flex>

          <Flex justify='between' style={[styles.listItemBtmBox, { marginTop: 25 }]}>
            <Flex>
              <View style={styles.leftLine}></View>
              <Text style={styles.xlTitle}>{`W${selectedWeekIndex + 1}分项完成情况`}</Text>
            </Flex>
            <Text style={styles.weekRateText}>
              整体完成率{' '}
              <Text style={styles.weekRateTextNum}>{selectedWeekOverallRate}%</Text>
            </Text>
          </Flex>


          <View style={styles.weekRateList}>
            {selectedWeekModuleRates.map(item => (
              <Flex key={item.key} align="center" style={styles.weekRateItem}>
                <Text style={styles.weekRateItemTitle}>{item.title}</Text>
                <View style={styles.weekRateBar}>
                  <View
                    style={[
                      styles.weekRateBarFill,
                      {
                        width: `${Math.max(0, Math.min(item.progress, 100))}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weekRateTextNum}>{item.progress}%</Text>
              </Flex>
            ))}
          </View>
          <Flex align="start" style={styles.kcalInfoBox}>
            <Image style={styles.kcalInfoIcon} source={require('@/assets/images/nutrition/kllInfo.png')} />
            <Text style={styles.kcalInfoText}>
              {`点击上方周次可查看分项；当前 W${selectedWeekIndex + 1} 整体完成率 ${selectedWeekOverallRate}%。`}
            </Text>
          </Flex>
        </View>

        <View style={[styles.commonWrap, { marginTop: 12 }]}>
          <Flex justify="between" align="center">
            <Flex>
              <Image style={styles.pageTopBgIcon} tintColor={"#333"} source={require('@/assets/images/schedule/icon_book.png')} />
              <View style={styles.sectionTitleWrap}>
                <LinearGradient
                  colors={['#6D925E', 'rgba(109,146,94,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionTitleUnderline}
                />
                <Text style={styles.sectionTitleText}>历史干预计划档案</Text>
              </View>
            </Flex>
            {historyArchiveItems.length > 0 ? (
              <TouchableOpacity onPress={() => navigation.navigate('ScheduleHistoryPage')}>
                <Flex>
                  <Text style={styles.rightText}>全部</Text>
                  <Image style={{ width: 5, height: 9, marginLeft: 4 }} source={require('@/assets/images/schedule/right.png')} />
                </Flex>
              </TouchableOpacity>
            ) : null}
          </Flex>

          <View style={styles.historyBox}>
            {historyArchiveItems.length > 0 ? historyArchiveItems.map(item => (
              <HistoryArchiveCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('ScheduleHistoryDetailPage', {
                  exPatientRuleId: item.id,
                })}
              />
            )) : (
              <View style={styles.historyItem}>
                <Text style={styles.listItemBtmText}>暂无历史干预计划</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </TabPageLayout>
  );
}
