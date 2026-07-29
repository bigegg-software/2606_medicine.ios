import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import { Flex } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import MilestoneRings from './components/MilestoneRings';
import TaskProgressRing from './components/TaskProgressRing';
import styles from '@/css/schedule/schedule';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
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
  formatScheduleTopInfoText,
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

const NAV_TABS = [
  { key: 'vitals', label: '三高指标', icon: require('@/assets/images/schedule/icon_tj.png') },
  { key: 'strength', label: '力量平衡', icon: require('@/assets/images/schedule/icon_ll.png') },
  { key: 'rehab', label: '术后康复', icon: require('@/assets/images/schedule/icon_mx.png') },
] as const;

type NavTabKey = (typeof NAV_TABS)[number]['key'];

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
  const user = useSelector((s: RootState) => s.user.info);
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
  const [activeNavTab, setActiveNavTab] = useState<NavTabKey>('vitals');

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
  const topInfoText = useMemo(
    () => formatScheduleTopInfoText(user, prescription),
    [user, prescription],
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
      <ScrollView contentContainerStyle={styles.scrollNew}>

        <View style={styles.mH12}>
          <Flex style={styles.pageTitleBox}>
            <Text style={styles.pageTitle}>健康提升档案</Text>
            <Flex style={styles.pageTitleSubtitle}>
              <Text style={styles.pageTitleSubtitleText}>已坚持 279 天</Text>
            </Flex>
          </Flex>
          <Text style={styles.pageTopText}>{topInfoText}</Text>
          {/* <Text style={styles.pageTopText}>58岁 | 三高人群 | 力量平衡管理 | 自2025/10/08起</Text> */}

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
                    <Text style={styles.topRowBoxItemValue}>149</Text>
                    <Text style={styles.topRowBoxItemText}>累计训练(小时)</Text>
                  </View>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back2.png')} />
                    <Text style={styles.topRowBoxItemValue}>138</Text>
                    <Text style={styles.topRowBoxItemText}>累计课次</Text>
                  </View>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back3.png')} />
                    <Text style={styles.topRowBoxItemValue}>84%</Text>
                    <Text style={styles.topRowBoxItemText}>平均完成率</Text>
                  </View>
                  <View style={styles.topRowBoxItem}>
                    <Image style={styles.topRowBoxItemImg} source={require('@/assets/images/schedule/top_back4.png')} />
                    <Text style={styles.topRowBoxItemValue}>11</Text>
                    <Text style={styles.topRowBoxItemText}>改善指标数</Text>
                  </View>
                </Flex>
              </View>
            </View>
          </View>
        </View>

        <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
          <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
            <Text style={styles.backImage1Text}>目标拆解·进度</Text>
            <Flex style={styles.tabBox}>
              <Flex justify='center' style={[styles.tabItem, styles.tabItemActive]}><Text style={styles.tabItemText}>30天</Text></Flex>
              <Flex justify='center' style={styles.tabItem}><Text style={styles.tabItemText}>90天</Text></Flex>
            </Flex>
          </Flex>
        </ImageBackground>

        <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={[styles.backImage1, { height: 66 }]}>
          <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
            {NAV_TABS.map(tab => {
              const isActive = activeNavTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.85}
                  onPress={() => setActiveNavTab(tab.key)}
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
          </Flex>
        </ImageBackground>

        <View style={styles.commonWrap}>
          <Flex>
            <Image style={styles.pageTopBgIcon} tintColor={"#333"} source={require('@/assets/images/schedule/icon_ll.png')} />
            <View style={styles.sectionTitleWrap}>
              <LinearGradient
                colors={['#6D925E', 'rgba(109,146,94,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionTitleUnderline}
              />
              <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>力量平衡</Text>
            </View>
            <Flex style={styles.tipBox}>
              <Text style={styles.tipText}>功能管理</Text>
            </Flex>
          </Flex>

          <View style={styles.listBox}>
            <View style={styles.listItem}>
              <Flex>
                <Text style={styles.listItemTitle}>单脚站立时长</Text>
                <Text style={styles.listItemSubtitle}>Single-leg Stance</Text>
              </Flex>
              <Flex justify='between' style={styles.listItemBox}>
                <Flex>
                  <Text style={styles.listItemValue}>32</Text>
                  <Text style={styles.listItemUnit}>秒</Text>
                  <Text style={styles.listItemTarget}>目标≥35</Text>
                </Flex>
                <Flex>
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_gs.png")} />
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_up1.png")} />
                  <Text style={styles.listItemValueNum}>18</Text>
                </Flex>
              </Flex>
              <View style={styles.listItemLine}>
                <View style={[styles.listItemLineFill, { width: '80%' }]} />
              </View>
              <Flex justify='between' style={styles.listItemBtmBox}>
                <Text style={styles.listItemBtmText}>基线14秒·90 天周期改善</Text>
                <Text style={styles.listItemBtmText1}>80%</Text>
              </Flex>
            </View>
            <View style={styles.listItem}>
              <Flex>
                <Text style={styles.listItemTitle}>6米步行速度</Text>
                <Text style={styles.listItemSubtitle}>Gait Speed 提升</Text>
              </Flex>
              <Flex justify='between' style={styles.listItemBox}>
                <Flex>
                  <Text style={styles.listItemValue}>1.28</Text>
                  <Text style={styles.listItemUnit}>m/s</Text>
                  <Text style={styles.listItemTarget}>目标≥1.3</Text>
                </Flex>
                <Flex>
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_gs.png")} />
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_up1.png")} />
                  <Text style={styles.listItemValueNum}>18%</Text>
                </Flex>
              </Flex>
              <View style={styles.listItemLine}>
                <View style={[styles.listItemLineFill, { width: '80%' }]} />
              </View>
              <Flex justify='between' style={styles.listItemBtmBox}>
                <Text style={styles.listItemBtmText}>基线0.98 m/s·90 天周期改善</Text>
                <Text style={styles.listItemBtmText1}>84%</Text>
              </Flex>
            </View>
            <View style={styles.listItem}>
              <Flex>
                <Text style={styles.listItemTitle}>下肢力量评分</Text>
                <Text style={styles.listItemSubtitle}>30秒坐立测试</Text>
              </Flex>
              <Flex justify='between' style={styles.listItemBox}>
                <Flex>
                  <Text style={styles.listItemValue}>18</Text>
                  <Text style={styles.listItemUnit}>次</Text>
                  <Text style={styles.listItemTarget}>目标≥20</Text>
                </Flex>
                <Flex>
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_gs.png")} />
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_up1.png")} />
                  <Text style={styles.listItemValueNum}>18</Text>
                </Flex>
              </Flex>
              <View style={styles.listItemLine}>
                <View style={[styles.listItemLineFill, { width: '80%' }]} />
              </View>
              <Flex justify='between' style={styles.listItemBtmBox}>
                <Text style={styles.listItemBtmText}>基线14秒·90 天周期改善</Text>
                <Text style={styles.listItemBtmText1}>80%</Text>
              </Flex>
            </View>
            <View style={styles.listItem}>
              <Flex>
                <Text style={styles.listItemTitle}>平衡指数</Text>
                <Text style={styles.listItemSubtitle}>Balance Index 改善</Text>
              </Flex>
              <Flex justify='between' style={styles.listItemBox}>
                <Flex>
                  <Text style={styles.listItemValue}>78</Text>
                  <Text style={styles.listItemUnit}>分</Text>
                  <Text style={styles.listItemTarget}>目标≥80</Text>
                </Flex>
                <Flex>
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_gs.png")} />
                  <Image style={styles.listIcon} source={require("@/assets/images/schedule/icon_up1.png")} />
                  <Text style={styles.listItemValueNum}>26</Text>
                </Flex>
              </Flex>
              <View style={styles.listItemLine}>
                <View style={[styles.listItemLineFill, { width: '80%' }]} />
              </View>
              <Flex justify='between' style={styles.listItemBtmBox}>
                <Text style={styles.listItemBtmText}>基线52分·90 天周期改善</Text>
                <Text style={styles.listItemBtmText1}>78%</Text>
              </Flex>
            </View>
          </View>
        </View>

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
            <Text style={styles.xlText}>点击可查看分项</Text>
          </Flex>

          <Flex align="stretch" style={styles.weekTrainWrap}>
            {[
              { key: 'W1', progress: 100 },
              { key: 'W2', progress: 100 },
              { key: 'W3', progress: 60 },
              { key: 'W4', progress: 0 },
              { key: 'W5', progress: 0 },
              { key: 'W6', progress: 0 },
            ].map(week => (
              <Flex direction='column' justify='end' align='stretch' key={week.key} style={styles.weekBox}>
                <View style={styles.iconBox}>
                  <Image style={styles.weekIcon} source={require('@/assets/images/schedule/icon_wx.png')} />
                  <Text style={styles.weekText}>3.9h</Text>
                </View>
                <View style={styles.weekProgress}>
                  <View
                    style={[
                      styles.weekProgressBar,
                      { height: Math.max(0, Math.min(week.progress, 100)) / 100 * 44 },
                      week.progress >= 100 && styles.weekProgressBarDone,
                    ]}
                  />
                </View>
                <Text style={styles.WTitle}>{week.key}</Text>
              </Flex>
            ))}
          </Flex>

          <Flex justify='between' style={[styles.listItemBtmBox, { marginTop: 25 }]}>
            <Flex>
              <View style={styles.leftLine}></View>
              <Text style={styles.xlTitle}>W5分项完成情况</Text>
            </Flex>
            <Text style={styles.weekRateText}>整体完成率 <Text style={styles.weekRateTextNum}>95%</Text></Text>
          </Flex>


          <View style={styles.weekRateList}>
            {[
              { title: '有氧', progress: 95, color: '#6D925E' },
              { title: '抗阻', progress: 95, color: '#72A1C5' },
              { title: '平衡', progress: 95, color: '#0951AE' },
              { title: '拉伸', progress: 95, color: '#EE9C44' },
            ].map(item => (
              <Flex key={item.title} align="center" style={styles.weekRateItem}>
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
            <Text style={styles.kcalInfoText}>训练投入持续走高，第 6 周完成率达 95%，与同期血糖、平衡指标改善曲线高度吻合。</Text>
          </Flex>
        </View>

        <View style={[styles.commonWrap, { marginTop: 12 }]}>
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

          <View style={styles.historyBox}>
            <View style={styles.historyItem}>
              <Flex justify='between'>
                <Text style={styles.historyItemTitle}>代谢综合征运动干预·第 3 疗程</Text>
                <Flex style={styles.historyItemStatus}>
                  <Text style={styles.historyItemStatusText}>进行中</Text>
                </Flex>
              </Flex>
              <Flex style={styles.historyItemTextWrap}>
                <Image style={styles.historyItemIcon} source={require('@/assets/images/schedule/icon_rl.png')} />
                <Text style={styles.historyItemText}>2026/05/01 至今</Text>
              </Flex>

              <Flex style={styles.historyRow}>
                <View>
                  <Flex>
                    <View style={styles.historyLine}></View>
                    <Text style={styles.historyTitle}>总课(次)</Text>
                  </Flex>
                  <Text style={styles.historyValue}>32</Text>
                </View>
                <View>
                  <Flex>
                    <View style={[styles.historyLine, { backgroundColor: "#72A1C5" }]}></View>
                    <Text style={styles.historyTitle}>累计时长(h)</Text>
                  </Flex>
                  <Text style={styles.historyValue}>32</Text>
                </View>
                <View>
                  <Flex>
                    <View style={[styles.historyLine, { backgroundColor: "#FB4550" }]}></View>
                    <Text style={styles.historyTitle}>空腹血糖(mmol/L)</Text>
                  </Flex>
                  <Flex>
                    <Text style={styles.historyValue}>32</Text>
                    <Text style={styles.historyUnit}>3.2</Text>
                    <Image style={[styles.listIcon, { marginTop: 16, marginLeft: 4 }]} source={require("@/assets/images/schedule/icon_gs.png")} />
                  </Flex>
                </View>
              </Flex>
              <Flex style={styles.historyInfo}>
                <Image style={styles.statusIcon} source={require("@/assets/images/schedule/wc.png")} />
                <Text style={styles.historyInfoText}>累计训练 45 小时，血糖回落至正常高值</Text>
              </Flex>
            </View>
              <View style={styles.historyItem}>
              <Flex justify='between'>
                <Text style={styles.historyItemTitle}>代谢综合征运动干预·第 3 疗程</Text>
                <Flex style={[styles.historyItemStatus, styles.historyItemStatusDone]}>
                  <Text style={[styles.historyItemStatusText, styles.historyItemStatusTextDone]}>已完成</Text>
                </Flex>
              </Flex>
              <Flex style={styles.historyItemTextWrap}>
                <Image style={styles.historyItemIcon} source={require('@/assets/images/schedule/icon_rl.png')} />
                <Text style={styles.historyItemText}>2026/05/01 至今</Text>
              </Flex>

              <Flex style={styles.historyRow}>
                <View>
                  <Flex>
                    <View style={styles.historyLine}></View>
                    <Text style={styles.historyTitle}>总课(次)</Text>
                  </Flex>
                  <Text style={styles.historyValue}>32</Text>
                </View>
                <View>
                  <Flex>
                    <View style={[styles.historyLine, { backgroundColor: "#72A1C5" }]}></View>
                    <Text style={styles.historyTitle}>累计时长(h)</Text>
                  </Flex>
                  <Text style={styles.historyValue}>32</Text>
                </View>
                <View>
                  <Flex>
                    <View style={[styles.historyLine, { backgroundColor: "#FB4550" }]}></View>
                    <Text style={styles.historyTitle}>空腹血糖(mmol/L)</Text>
                  </Flex>
                  <Flex>
                    <Text style={styles.historyValue}>32</Text>
                    <Text style={styles.historyUnit}>3.2</Text>
                    <Image style={[styles.listIcon, { marginTop: 16, marginLeft: 4 }]} source={require("@/assets/images/schedule/icon_gs.png")} />
                  </Flex>
                </View>
              </Flex>
              <Flex style={styles.historyInfo}>
                <Image style={styles.statusIcon} source={require("@/assets/images/schedule/wc.png")} />
                <Text style={styles.historyInfoText}>累计训练 45 小时，血糖回落至正常高值</Text>
              </Flex>
            </View>
          </View>


        </View>











        {/* <View style={styles.glassCardWrap}>
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

        </View> */}
      </ScrollView>
    </TabPageLayout>
  );
}
