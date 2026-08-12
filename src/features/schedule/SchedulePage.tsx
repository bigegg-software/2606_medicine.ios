import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import styles from '@/css/schedule/schedule';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  getInUseExPatientRuleInfo,
  type InUseExPatientRule,
} from '@/api/schedule';
import {
  getExMilestoneInfo,
  getExMilestoneRecentSixWeekStats,
  type ExMilestoneInfo,
  type ExMilestoneWeekStat,
} from '@/api/exMilestone';
import {
  buildMilestoneWeekModuleRates,
  calcMilestoneWeekBarProgress,
  calcMilestoneWeekOverallRate,
  formatMilestoneHours,
  formatMilestoneWeekBarDuration,
  formatScheduleTopInfoText,
  normalizeProgress,
} from './scheduleHelpers';

const NAV_TABS = [
  { key: 'vitals', label: '三高指标', icon: require('@/assets/images/schedule/icon_tj.png') },
  { key: 'strength', label: '力量平衡', icon: require('@/assets/images/schedule/icon_ll.png') },
  { key: 'rehab', label: '术后康复', icon: require('@/assets/images/schedule/icon_mx.png') },
] as const;

type NavTabKey = (typeof NAV_TABS)[number]['key'];

export default function SchedulePage() {
  const user = useSelector((s: RootState) => s.user.info);
  const [prescription, setPrescription] = useState<InUseExPatientRule | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<NavTabKey>('vitals');
  const [milestoneInfo, setMilestoneInfo] = useState<ExMilestoneInfo | null>(null);
  const [sixWeekStats, setSixWeekStats] = useState<ExMilestoneWeekStat[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const topInfoText = useMemo(
    () => formatScheduleTopInfoText(user, prescription),
    [user, prescription],
  );

  const loadPrescription = useCallback(async () => {
    try {
      const res = await getInUseExPatientRuleInfo();
      const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
      if (isResourceApiOk(payload)) {
        setPrescription(apiResourceData<InUseExPatientRule>(payload) ?? null);
      } else {
        setPrescription(null);
      }
    } catch {
      setPrescription(null);
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

  const loadScheduleData = useCallback(async () => {
    await Promise.all([loadPrescription(), loadMilestoneStats()]);
  }, [loadMilestoneStats, loadPrescription]);

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

  const loadScheduleDataRef = useRef(loadScheduleData);
  loadScheduleDataRef.current = loadScheduleData;
  const hasMountedRef = useRef(false);

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
              <Text style={styles.dayProgressNum}>1</Text>/30天
            </Text>
          </Flex>
        </ImageBackground>

        <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={[styles.backImage1, { height: 66, marginTop: 0 }]}>
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
      </ScrollView>
    </TabPageLayout>
  );
}
