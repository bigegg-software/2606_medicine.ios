import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, ImageBackground } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Flex } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import MilestoneRings from './components/MilestoneRings';
import TaskProgressRing from './components/TaskProgressRing';
import styles from '@/css/schedule/schedule';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import moment from 'moment';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import {
  getInUseExPatientRuleInfo,
  getHistoryExPatientRuleList,
  type InUseExPatientRule,
  type HistoryExPatientRule,
  type HistoryListResult,
} from '@/api/schedule';
import {
  WEEK_LABELS,
  buildScheduleWeekDays,
  clampDateRangeToPrescription,
  formatPrescriptionCycleDays,
  getCurrentWeekDateRange,
  getHistoryStatusLabel,
  getInUseStatusText,
  isDateInPrescriptionRange,
  loadScheduleDictMaps,
  loadExerciseTypeRingProgress,
  loadScheduleWeekCalendar,
  loadScheduleWeekStatsForRange,
  loadTodayTaskProgressMap,
  normalizeProgress,
  sortHistoryPlans,
  enrichHealthGoalTargets,
  sortHealthGoalDisplayItems,
  toHealthGoalDisplayItem,
  toHistoryPlanItem,
  toTodayTaskItem,
  type ScheduleDictMaps,
  type ScheduleWeekDayItem,
  type ScheduleWeekStats,
} from './scheduleHelpers';

const HISTORY_PREVIEW_SIZE = 5;

const EMPTY_WEEK_STATS: ScheduleWeekStats = {
  trainingCount: '--',
  completionRate: '--',
  totalDuration: '--',
  trainingDone: '--',
  trainingTotal: '',
  durationMinutes: '--',
};

function ScheduleWeekDayCell({
  item,
  inPrescriptionRange,
}: {
  item: ScheduleWeekDayItem;
  inPrescriptionRange: boolean;
}) {
  const isToday = item.date.isSame(moment(), 'day');
  const isFuture = item.date.isAfter(moment(), 'day');
  const label = WEEK_LABELS[item.date.day()];
  const dayLabel = isToday ? '今' : String(item.date.date());

  const renderPlainDate = () => (
    <Flex justify='center' style={styles.dayTimeBox}>
      <Text style={[styles.dayTime, styles.dayTimeColor]}>{dayLabel}</Text>
    </Flex>
  );

  const renderDayContent = () => {
    if (!inPrescriptionRange) {
      return renderPlainDate();
    }

    if (isToday) {
      return (
        <Flex justify='center' style={[styles.dayTimeBox, styles.dayTimeToday]}>
          <Text style={[styles.dayTime, styles.dayTimeBadgeText]}>今</Text>
        </Flex>
      );
    }

    if (isFuture) {
      return renderPlainDate();
    }

    if (item.completed) {
      return (
        <Image source={require('@/assets/images/schedule/wc.png')} style={styles.dayTimeBox} />
      );
    }

    if (item.total > 0) {
      return (
        <Flex justify='center' align='center' style={[styles.dayTimeBox, styles.dayTimeIncomplete]}>
          <Text style={styles.dayTimeBadgeText}>{item.done}/{item.total}</Text>
        </Flex>
      );
    }

    return renderPlainDate();
  };

  return (
    <Flex
      direction="column"
      justify="center"
      style={styles.dayCol}>
      <Text style={styles.dayText}>{label}</Text>
      {renderDayContent()}
    </Flex>
  );
}

export default function SchedulePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [weekDays, setWeekDays] = useState<ScheduleWeekDayItem[]>(() => buildScheduleWeekDays());
  const [prescription, setPrescription] = useState<InUseExPatientRule | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [dictMaps, setDictMaps] = useState<ScheduleDictMaps | null>(null);
  const [historyPlans, setHistoryPlans] = useState<HistoryExPatientRule[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [todayTaskProgressMap, setTodayTaskProgressMap] = useState<Record<string, number>>({});
  const [ringProgress, setRingProgress] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [weekStats, setWeekStats] = useState<ScheduleWeekStats>(EMPTY_WEEK_STATS);

  const prescriptionProgress = normalizeProgress(prescription?.progress ?? prescription?.progressInfo?.complateRatio);
  const todayTasks = useMemo(
    () => (prescription?.ruleRatioList ?? []).map((rule, index) =>
      toTodayTaskItem(rule, index, dictMaps ?? undefined, todayTaskProgressMap),
    ),
    [prescription?.ruleRatioList, dictMaps, todayTaskProgressMap],
  );
  const goalItems = useMemo(
    () => sortHealthGoalDisplayItems(
      (prescription?.healthGoalTargetList ?? []).map((target, index) =>
        toHealthGoalDisplayItem(target, index, prescription?.progressInfo),
      ),
    ),
    [prescription?.healthGoalTargetList, prescription?.progressInfo],
  );
  const historyItems = useMemo(
    () => historyPlans.map(toHistoryPlanItem),
    [historyPlans],
  );

  const loadPrescription = useCallback(async () => {
    setPrescriptionLoading(true);
    try {
      const res = await getInUseExPatientRuleInfo();
      const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
      let current: InUseExPatientRule | null = null;
      if (isResourceApiOk(payload)) {
        current = apiResourceData<InUseExPatientRule>(payload) ?? null;
        if (current?.healthGoalTargetList?.length) {
          const enrichedTargets = await enrichHealthGoalTargets(current.healthGoalTargetList);
          current = { ...current, healthGoalTargetList: enrichedTargets };
        }
        setPrescription(current);
      } else {
        setPrescription(null);
      }

      const { startDate, endDate } = getCurrentWeekDateRange();
      const clampedRange = clampDateRangeToPrescription(
        startDate,
        endDate,
        current?.startDate,
        current?.endDate,
      );
      const weekStatsPromise = clampedRange && current?.exPatientRuleId
        ? loadScheduleWeekStatsForRange(
          current.exPatientRuleId,
          clampedRange.startDate,
          clampedRange.endDate,
        )
        : Promise.resolve(EMPTY_WEEK_STATS);

      const [calendarDays, progressMap, typeRingProgress, stats] = await Promise.all([
        loadScheduleWeekCalendar(current?.exPatientRuleId),
        loadTodayTaskProgressMap(current?.exPatientRuleId),
        loadExerciseTypeRingProgress(current?.exPatientRuleId, current?.ruleRatioList),
        weekStatsPromise,
      ]);
      setWeekDays(calendarDays);
      setTodayTaskProgressMap(progressMap);
      setRingProgress(typeRingProgress);
      setWeekStats(stats);
    } catch {
      setPrescription(null);
      setWeekDays(buildScheduleWeekDays());
      setTodayTaskProgressMap({});
      setRingProgress([0, 0, 0, 0]);
      setWeekStats(EMPTY_WEEK_STATS);
    } finally {
      setPrescriptionLoading(false);
    }
  }, []);

  const loadHistoryPlans = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const [pausedRes, endedRes] = await Promise.all([
        getHistoryExPatientRuleList({ status: 1, pageSize: HISTORY_PREVIEW_SIZE, pageNum: 1 }),
        getHistoryExPatientRuleList({ status: 2, pageSize: HISTORY_PREVIEW_SIZE, pageNum: 1 }),
      ]);

      const rows = sortHistoryPlans([
        ...getResourceRows<HistoryExPatientRule>(pausedRes),
        ...getResourceRows<HistoryExPatientRule>(endedRes),
      ]).slice(0, HISTORY_PREVIEW_SIZE);

      setHistoryPlans(rows);
      const pausedTotal = (pausedRes as unknown as HistoryListResult).total ?? 0;
      const endedTotal = (endedRes as unknown as HistoryListResult).total ?? 0;
      setHistoryTotal(pausedTotal + endedTotal);
    } catch {
      setHistoryPlans([]);
      setHistoryTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadScheduleData = useCallback(async () => {
    await Promise.all([loadPrescription(), loadHistoryPlans()]);
  }, [loadPrescription, loadHistoryPlans]);

  const loadScheduleDataRef = useRef(loadScheduleData);
  loadScheduleDataRef.current = loadScheduleData;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    loadScheduleDictMaps()
      .then(setDictMaps)
      .catch(() => setDictMaps(null));
  }, []);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      loadScheduleDataRef.current();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const stackNavigation = navigation.getParent()?.getParent() ?? navigation.getParent();
      stackNavigation?.setOptions({
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 18 }} onPress={() => navigation.navigate('CalendarPage')}>
            <Image style={styles.navIcon} source={require('@/assets/images/schedule/time.png')} />
          </TouchableOpacity>
        ),
      });
      return () => {
        stackNavigation?.setOptions({ headerRight: undefined });
      };
    }, [navigation]),
  );

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.glassCardWrap}>
          <View style={styles.glassCard}>
            <Flex justify="between" align="center">
              <Text style={styles.glassCardTitle} numberOfLines={1}>
                {prescription?.prescriptionName?.trim() || '暂无运动处方'}
              </Text>
              <Flex style={styles.statusBox}>
                <Text style={styles.statusText}>{getInUseStatusText(prescription)}</Text>
              </Flex>
            </Flex>
            <Flex direction="column" justify='center' style={{ marginTop: 20, width: "100%" }}>
              <MilestoneRings progress={ringProgress} />

              <Flex justify="between" style={styles.colRow}>
                <Flex align="start" style={styles.colBox}>
                  <View style={styles.colIcon} />
                  <View>
                    <Text style={styles.colTitle}>周期(天)</Text>
                    <Text style={styles.colText}>
                      {formatPrescriptionCycleDays(prescription?.startDate, prescription?.endDate)}
                    </Text>
                  </View>
                </Flex>
                <Flex align="start" style={styles.colBox}>
                  <View style={styles.colIcon} />
                  <View>
                    <Text style={styles.colTitle}>目标</Text>
                    <Text style={styles.colText} numberOfLines={1}>
                      {prescription?.diagnosis?.trim() || '--'}
                    </Text>
                  </View>
                </Flex>
                <Flex align="start" style={styles.colBox}>
                  <View style={styles.colIcon} />
                  <View>
                    <Text style={styles.colTitle}>整体进度</Text>
                    <Text style={styles.colText}>{prescriptionProgress}%</Text>
                  </View>
                </Flex>
              </Flex>
            </Flex>
          </View>

          {prescriptionLoading ? (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : null}

          {!prescriptionLoading && !prescription ? (
            <View style={[styles.medicalBox, { marginTop: 16 }]}>
              <Text style={[styles.leftText, { marginTop: 0 }]}>暂无进行中的运动处方</Text>
            </View>
          ) : null}



          {goalItems.length > 0 ? (

            <View style={styles.rowBox}>
              <Flex justify="between" align="center">
                <Text style={styles.glassCardTitle}>目标分解</Text>
              </Flex>

              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.scrollBox}>
                {goalItems.map(item => (
                  <TouchableOpacity style={styles.backBox} key={item.key} onPress={() => {
                    if (item.assessmentType === 'sys_health_test_item') {
                      navigation.navigate('TestingPage', { id: String(item.key) });
                    } else if (item.assessmentType === 'question_type') {
                      navigation.navigate('QuestionnaireTestingPage', { id: String(item.key) });
                    } else if (
                      item.assessmentType === 'health_indicator_type' &&
                      item.assessmentValue === 'xueYa'
                    ) {
                      navigation.navigate('BloodPressurePage');
                    } else if (
                      item.assessmentType === 'health_indicator_type' &&
                      item.assessmentValue === 'xueTang'
                    ) {
                      navigation.navigate('BloodSugarPage');
                    } else if (
                      item.assessmentType === 'health_indicator_type' &&
                      item.assessmentValue === 'xueZhi'
                    ) {
                      navigation.navigate('BloodLipidPage');
                    } else if (
                      item.assessmentType === 'health_indicator_type' &&
                      item.assessmentValue === 'tiZhong'
                    ) {
                      navigation.navigate('WeightPage');
                    }
                  }}>
                    <Image style={styles.backImg} source={item.backImage} />
                    <Flex justify="between">
                      <Text style={styles.backText}>{item.title}</Text>
                      <Image style={styles.exerciseImg} source={item.icon} />
                    </Flex>
                    <Flex style={styles.statusColBox}>
                      <Text style={styles.statusColText}>{item.statusText}</Text>
                      <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
                    </Flex>
                    <Text style={styles.colBtmText} numberOfLines={1}>{item.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          ) : null}


          {todayTasks.length > 0 ? (<View style={styles.rowBox}>
            <Text style={styles.glassCardTitle}>今日任务</Text>

            <View style={styles.tasksBox}>
              {todayTasks.map((task, index) => (
                <TouchableOpacity
                  style={styles.tasksCol}
                  key={task.key}
                  onPress={() => {
                    const rule = prescription?.ruleRatioList?.[index];
                    navigation.navigate('PlayerPage', {
                      exerciseType: rule?.exerciseType,
                      exerciseChildType: rule?.exerciseChildType,
                      strengthLevel: rule?.strengthLevel,
                      taskIndex: index,
                    });
                  }}>
                  <Flex>
                    <Image style={styles.exerciseImg} source={task.icon} />
                    <Text style={styles.tasksTitle}>{task.title}</Text>
                  </Flex>
                  <Text style={styles.tasksIntro}>{task.intro}</Text>

                  <View style={styles.taskProgressWrap}>
                    <TaskProgressRing progress={task.progress} progressColor={task.progressColor} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          ) : null}


          <View style={styles.rowBox}>
            <Flex justify="between" align="center">
              <Text style={styles.glassCardTitle}>本周训练统计</Text>
              {prescription ? (
                <TouchableOpacity
                  onPress={() => {
                    const ruleId = prescription.exPatientRuleId;
                    if (ruleId == null || ruleId === '') return;
                    navigation.navigate('TrainingStatsPage', {
                      exPatientRuleId: String(ruleId),
                      startDate: prescription.startDate,
                      endDate: prescription.endDate,
                    });
                  }}>
                  <Flex>
                    <Text style={styles.allBtn}>全部训练统计</Text>
                    <Image style={{ width: 5, height: 9 }} source={require('@/assets/images/schedule/right.png')} />
                  </Flex>
                </TouchableOpacity>
              ) : null}

            </Flex>

            <Flex justify="between" style={styles.dayBox}>
              {weekDays.map(item => (
                <ScheduleWeekDayCell
                  key={item.date.format('YYYY-MM-DD')}
                  item={item}
                  inPrescriptionRange={isDateInPrescriptionRange(
                    item.date,
                    prescription?.startDate,
                    prescription?.endDate,
                  )}
                />
              ))}
            </Flex>

            <Flex style={styles.statRow} justify='between'>
              <Flex direction='column' style={styles.statBox}>
                <Text style={styles.statValue}>
                  {weekStats.trainingDone}
                  {weekStats.trainingTotal ? (
                    <Text style={styles.statValue_1}>/{weekStats.trainingTotal}</Text>
                  ) : null}
                </Text>
                <Text style={styles.statTitle}>训练次数</Text>
              </Flex>
              <Flex direction='column' style={styles.statBox}>
                <Text style={styles.statValue}>{weekStats.completionRate}</Text>
                <Text style={styles.statTitle}>完成率</Text>
              </Flex>
              <Flex direction='column' style={styles.statBox}>
                <Text style={styles.statValue}>
                  {weekStats.durationMinutes}
                  {weekStats.durationMinutes !== '--' ? (
                    <Text style={[styles.statValue_1, { fontSize: 14 }]}>(分钟)</Text>
                  ) : null}
                </Text>
                <Text style={styles.statTitle}>累计时长</Text>
              </Flex>
            </Flex>
          </View>

          <View style={styles.rowBox}>
            <Flex justify="between" align="center">
              <Text style={styles.glassCardTitle}>历史计划</Text>
              {historyTotal > 0 ? (
                <TouchableOpacity onPress={() => navigation.navigate('ScheduleHistoryPage')}>
                  <Flex>
                    <Text style={styles.allBtn}>全部计划</Text>
                    <Image style={{ width: 5, height: 9 }} source={require('@/assets/images/schedule/right.png')} />
                  </Flex>
                </TouchableOpacity>
              ) : null}
            </Flex>
            {historyLoading ? (
              <View style={[styles.medicalBox, { alignItems: 'center' }]}>
                <ActivityIndicator color={AppTheme.primaryColor} />
              </View>
            ) : null}

            {!historyLoading && historyItems.length === 0 ? (
              <View style={styles.medicalBox}>
                <Text style={[styles.leftText, { marginTop: 0 }]}>暂无历史计划</Text>
              </View>
            ) : null}

            {historyItems.map(item => (
              <TouchableOpacity
                key={String(item.id)}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('ScheduleHistoryDetailPage', {
                    exPatientRuleId: String(item.id),
                  });
                }}>
                <ImageBackground
                  source={require('@/assets/images/schedule/back.png')}
                  style={styles.medicalBox}
                  imageStyle={styles.medicalBackImg}>
                  <Flex justify='between' align='center'>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[styles.medicalTitle, { marginTop: 0 }]}>{item.title}</Text>
                      <Text style={[styles.leftText, { marginTop: 6 }]}>{item.cycle}</Text>
                      {item.status === 1 && item.stopReason ? (
                        <Text style={styles.statusInfo}>暂停原因：{item.stopReason}</Text>
                      ) : null}
                    </View>
                    <Flex style={item.status === 2 ? styles.yjsBox : styles.yztBox}>
                      <Text style={item.status === 2 ? styles.yjsText : styles.yztText}>{getHistoryStatusLabel(item.status)}</Text>
                    </Flex>
                  </Flex>
                </ImageBackground>
              </TouchableOpacity>
            ))}

          </View>

        </View>
      </ScrollView>
    </TabPageLayout>
  );
}
