import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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
  formatCompletionRate,
  formatPrescriptionCycleDays,
  formatTotalDuration,
  formatTrainingCount,
  getHistoryStatusLabel,
  getInUseStatusText,
  loadScheduleDictMaps,
  loadScheduleWeekCalendar,
  loadTodayTaskProgressMap,
  normalizeProgress,
  sortHistoryPlans,
  toGoalItem,
  toHistoryPlanItem,
  toTodayTaskItem,
  type ScheduleDictMaps,
  type ScheduleWeekDayItem,
} from './scheduleHelpers';

const HISTORY_PREVIEW_SIZE = 5;

function ScheduleWeekDayCell({ item }: { item: ScheduleWeekDayItem }) {
  const isToday = item.date.isSame(moment(), 'day');
  const isFuture = item.date.isAfter(moment(), 'day');
  const label = WEEK_LABELS[item.date.day()];

  const renderDayContent = () => {
    if (isToday) {
      return (
        <Flex justify='center' style={[styles.dayTimeBox, styles.dayTimeToday]}>
          <Text style={[styles.dayTime, styles.dayTimeBadgeText]}>{item.date.date()}</Text>
        </Flex>
      );
    }

    if (isFuture) {
      return (
        <Flex justify='center' style={styles.dayTimeBox}>
          <Text style={[styles.dayTime, styles.dayTimeColor]}>{item.date.date()}</Text>
        </Flex>
      );
    }

    if (item.completed) {
      return (
        <Flex justify='center' align='center' style={[styles.dayTimeBox, styles.dayTimeCompleted]}>
          <Text style={styles.dayTimeBadgeText}>✓</Text>
        </Flex>
      );
    }

    if (item.total > 0) {
      return (
        <Flex justify='center' align='center' style={[styles.dayTimeBox, styles.dayTimeIncomplete]}>
          <Text style={styles.dayTimeBadgeText}>{item.done}/{item.total}</Text>
        </Flex>
      );
    }

    return (
      <Flex justify='center' style={styles.dayTimeBox}>
        <Text style={[styles.dayTime, styles.dayTimeColor]}>{item.date.date()}</Text>
      </Flex>
    );
  };

  return (
    <Flex
      direction="column"
      justify="center"
      style={[styles.dayCol, isToday && styles.dayColAcitve]}>
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

  const prescriptionProgress = normalizeProgress(prescription?.progress ?? prescription?.progressInfo?.complateRatio);
  const todayTasks = useMemo(
    () => (prescription?.ruleRatioList ?? []).map((rule, index) =>
      toTodayTaskItem(rule, index, dictMaps ?? undefined, todayTaskProgressMap),
    ),
    [prescription?.ruleRatioList, dictMaps, todayTaskProgressMap],
  );
  const goalItems = useMemo(
    () => (prescription?.ruleRatioList ?? []).map((rule, index) => toGoalItem(rule, index, dictMaps ?? undefined)),
    [prescription?.ruleRatioList, dictMaps],
  );
  const ringProgress = useMemo((): [number, number, number, number] => {
    const ratios = prescription?.ruleRatioList ?? [];
    return [
      normalizeProgress(ratios[0]?.ratio) / 100,
      normalizeProgress(ratios[1]?.ratio) / 100,
      normalizeProgress(ratios[2]?.ratio) / 100,
      normalizeProgress(ratios[3]?.ratio) / 100,
    ];
  }, [prescription?.ruleRatioList]);

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
        console.log(current)
        setPrescription(current);
      } else {
        setPrescription(null);
      }

      const [calendarDays, progressMap] = await Promise.all([
        loadScheduleWeekCalendar(current?.exPatientRuleId),
        loadTodayTaskProgressMap(current?.exPatientRuleId),
      ]);
      setWeekDays(calendarDays);
      setTodayTaskProgressMap(progressMap);
    } catch {
      setPrescription(null);
      setWeekDays(buildScheduleWeekDays());
      setTodayTaskProgressMap({});
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
          <GlassView style={styles.glassCard} glassEffectStyle="regular" tintColor="#F8FAFF">
            <View style={styles.glassCardHighlight} pointerEvents="none" />
            <Flex justify="between" align="center">
              <Text style={styles.glassCardTitle} numberOfLines={1}>
                {prescription?.prescriptionName?.trim() || '暂无运动处方'}
              </Text>
              <Flex style={styles.statusBox}>
                <Text style={styles.statusText}>{getInUseStatusText(prescription)}</Text>
              </Flex>
            </Flex>
            <Flex justify="between" style={{ marginTop: 20 }}>
              <View>
                <Flex style={styles.colBox}>
                  <Image style={styles.iconImg} source={require('@/assets/images/schedule/icon1.png')} />
                  <Text style={styles.colTitle}>周期：</Text>
                  <Text style={styles.colText}>
                    {formatPrescriptionCycleDays(prescription?.startDate, prescription?.endDate)}
                  </Text>
                </Flex>
                <Flex style={styles.colBox}>
                  <Image style={styles.iconImg} source={require('@/assets/images/schedule/icon2.png')} />
                  <Text style={styles.colTitle}>目标：</Text>
                  <Text style={styles.colText} numberOfLines={1}>
                    {prescription?.diagnosis?.trim() || '--'}
                  </Text>
                </Flex>
                <Flex style={styles.colBox}>
                  <Image style={styles.iconImg} source={require('@/assets/images/schedule/icon3.png')} />
                  <Text style={styles.colTitle}>完成：</Text>
                  <Text style={styles.colText}>{prescriptionProgress}%</Text>
                </Flex>
              </View>
              <MilestoneRings progress={ringProgress} />
            </Flex>
          </GlassView>

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
            <>
              <Flex style={styles.titleBox}>
                <View style={styles.borderBox}></View>
                <Text style={styles.titleText}>目标分解</Text>
              </Flex>

              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.scrollBox}>
                {goalItems.map(item => (
                  <View style={styles.backBox} key={item.key}>
                    <Image style={styles.backImg} source={item.backImage} />
                    <Flex justify="between">
                      <Text style={styles.backText}>{item.title}</Text>
                      <Image style={styles.exerciseImg} source={item.icon} />
                    </Flex>
                    <Flex style={styles.statusColBox}>
                      <Text style={styles.statusColText}>持续改善中</Text>
                      <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
                    </Flex>
                    <Text style={styles.colBtmText} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          {todayTasks.length > 0 ? (
            <>
              <Flex style={styles.titleBox}>
                <View style={styles.borderBox}></View>
                <Text style={styles.titleText}>今日任务</Text>
              </Flex>
              <Flex wrap="wrap" justify='between' style={styles.tasksBox}>
                {todayTasks.map(task => (
                  <View style={styles.tasksCol} key={task.key}>
                    <Flex>
                      <Image style={styles.exerciseImg} source={task.icon} />
                      <Text style={styles.tasksTitle}>{task.title}</Text>
                    </Flex>
                    <Text style={styles.tasksIntro}>{task.intro}</Text>

                    <View style={styles.taskProgressWrap}>
                      <TaskProgressRing progress={task.progress} />
                    </View>
                  </View>
                ))}
              </Flex>
            </>
          ) : null}



          <Flex style={styles.titleBox}>
            <View style={styles.borderBox}></View>
            <Text style={styles.titleText}>本周训练统计</Text>
          </Flex>

          <Flex justify="between" style={styles.dayBox}>
            {weekDays.map(item => (
              <ScheduleWeekDayCell key={item.date.format('YYYY-MM-DD')} item={item} />
            ))}
          </Flex>

          <Flex style={styles.statRow}>
            <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
              <Text style={styles.statValue}>
                {formatTrainingCount(prescription?.progressInfo)}
              </Text>
              <Text style={styles.statTitle}>训练次数</Text>
            </Flex>
            <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
              <Text style={styles.statValue}>{formatCompletionRate(prescription?.progressInfo)}</Text>
              <Text style={styles.statTitle}>完成率</Text>
            </Flex>
            <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
              <Text style={styles.statValue}>
                {formatTotalDuration(prescription?.progressInfo?.sumExerciseDuration)}
              </Text>
              <Text style={styles.statTitle}>累计时长</Text>
            </Flex>
          </Flex>

          <Flex justify='between' style={styles.titleBox}>
            <Flex>
              <View style={styles.borderBox}></View>
              <Text style={styles.titleText}>历史计划</Text>
            </Flex>
            {historyTotal > 0 ? (
              <TouchableOpacity onPress={() => navigation.navigate('ExercisePage')}>
                <Text style={styles.allBtn}>全部</Text>
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
            <Flex justify='between' style={styles.medicalBox} key={String(item.id)}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.medicalTitle, { marginTop: 0 }]}>{item.title}</Text>
                <Text style={[styles.leftText, { marginTop: 6 }]}>{item.cycle}</Text>
                {item.status === 1 && item.stopReason ? (
                  <Text style={styles.statusInfo}>暂停原因：{item.stopReason}</Text>
                ) : null}
              </View>
              <Flex style={item.status === 2 ? styles.yjsBox : styles.yztBox}>
                <Text style={styles.yztText}>{getHistoryStatusLabel(item.status)}</Text>
              </Flex>
            </Flex>
          ))}


        </View>
      </ScrollView>
    </TabPageLayout>
  );
}
