import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/exercise';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { InUseExPatientRule } from '@/api/schedule';
import type { RootStackParamList } from '@/route/router';
import { buildDietWeekDays } from '../utils/dietCalendarHelpers';
import { isCalendarDateInPrescriptionRange } from '@/src/features/nutrition/components/utils/dietCalendarHelpers';
import { loadExPatientRuleForDate } from '../utils/exerciseRuleDateHelpers';
import {
  buildInStoreRehabCards,
  countWeeklyInStoreDays,
  formatInStoreRehabLabels,
  formatWeeklyInStoreTip,
  resolveInStoreDayRule,
} from '../utils/inStoreRehabHelpers';
import {
  loadInStoreRecommendCards,
  type InStoreRecommendCardView,
} from '../utils/inStoreRecommendHelpers';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import { loadCoachTrainingRecordByRuleAndDate } from '../utils/coachTrainingRecordHelpers';
import { type TrainingPhaseExerciseCard } from '../utils/trainingPhaseHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  exerciseRule?: InUseExPatientRule | null;
  /** 历史计划：日历默认落在处方周期内 */
  lockToRule?: boolean;
  /** 家属查看 / 历史只读：不展示约课入口 */
  readOnly?: boolean;
  patientUserId?: string;
  /** 与居家 Tab 共用的选中日（由 ExercisePage 托管） */
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
};

/** 到店专项康复：渲染当日 actionType=in_store 的视频 */
export default function InStoreRehabPage({
  exerciseRule = null,
  lockToRule = false,
  readOnly = false,
  patientUserId,
  selectedDate,
  onSelectedDateChange,
}: Props) {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [dayRule, setDayRule] = useState<InUseExPatientRule | null>(exerciseRule ?? null);
  const [cards, setCards] = useState<TrainingPhaseExerciseCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklyInStoreTip, setWeeklyInStoreTip] = useState('建议每周到店1-2次');
  const [recommendCards, setRecommendCards] = useState<InStoreRecommendCardView[]>([]);
  /** 当日是否已有教练到店训练日志 */
  const [inStoreDone, setInStoreDone] = useState(false);
  /** 选中日是否为处方休息日 */
  const [isRestDay, setIsRestDay] = useState(false);
  /** 选中日是否被顺延腾空 */
  const [isPostponedAway, setIsPostponedAway] = useState(false);
  /** 处方 focus 刷新时静默更新，避免整页 loading */
  const hasLoadedRef = useRef(false);
  const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
  const prescriptionStartDate = exerciseRule?.startDate?.trim() || '';
  const prescriptionEndDate = exerciseRule?.endDate?.trim() || '';
  /** 本人在用处方才可约课；家属查看 / 历史计划不展示 */
  const canBook = !lockToRule && !readOnly;
  const isToday = moment(selectedDate).isSame(moment(), 'day');
  const showInStoreDoneTip = isToday && inStoreDone && !isRestDay;
  const specialtyEmptyText = isRestDay
    ? '今日为休息日，暂无到店训练'
    : isPostponedAway
      ? '今日训练已顺延，暂无到店训练'
      : dayRule
        ? '今日暂无到店专项康复'
        : '暂无到店专项康复';
  /**
   * 按选中日渲染：有到店动作才展示专项区；
   * 无到店动作只走空状态，不展示「相关专项」标题与推荐约课。
   */
  const showInStoreSpecialtySection =
    !isRestDay && !isPostponedAway && (loading || cards.length > 0);
  const showInStoreRecommend =
    !isRestDay && !isPostponedAway && !loading && cards.length > 0;
  /** 到店训练重点（接口 inStoreTrainingFocus） */
  const inStoreTrainingFocusText = useMemo(
    () =>
      dayRule?.inStoreTrainingFocus?.trim()
      || exerciseRule?.inStoreTrainingFocus?.trim()
      || '',
    [dayRule?.inStoreTrainingFocus, exerciseRule?.inStoreTrainingFocus],
  );

  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedRef.current) setLoading(true);
    void (async () => {
      try {
        // 与居家训练一致：快照优先，无快照才回退进行中处方（勿用 inUse 周课表覆盖空快照）
        const snapshot = await loadExPatientRuleForDate(selectedDate, exerciseRule, {
          patientUserId,
          exPatientRuleId: exerciseRule?.exPatientRuleId,
        });
        if (cancelled) return;
        const rule = resolveInStoreDayRule(snapshot, exerciseRule);
        setDayRule(rule);
        const exPatientRuleId = rule?.exPatientRuleId ?? exerciseRule?.exPatientRuleId;
        const [result, inStoreDayCount, coachRecord] = await Promise.all([
          buildInStoreRehabCards(rule, selectedDate),
          countWeeklyInStoreDays(rule),
          loadCoachTrainingRecordByRuleAndDate({
            exPatientRuleId,
            customerLocalDate: selectedDate,
            patientUserId,
          }),
        ]);
        if (cancelled) return;
        setCards(result.cards);
        setIsRestDay(Boolean(result.isRest));
        setIsPostponedAway(Boolean(result.isPostponedAway));
        setWeeklyInStoreTip(formatWeeklyInStoreTip(inStoreDayCount));
        setInStoreDone(Boolean(coachRecord));
        hasLoadedRef.current = true;
      } catch {
        if (cancelled) return;
        setDayRule(null);
        setCards([]);
        setIsRestDay(false);
        setIsPostponedAway(false);
        setWeeklyInStoreTip(formatWeeklyInStoreTip(0));
        setInStoreDone(false);
        hasLoadedRef.current = true;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseRule, patientUserId, selectedDate]);

  useEffect(() => {
    if (!canBook) {
      setRecommendCards([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const list = await loadInStoreRecommendCards();
      if (!cancelled) setRecommendCards(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [canBook]);

  const goCurriculum = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Curriculum' } }],
    });
  };

  const openRecommendSession = (card: InStoreRecommendCardView) => {
    const sessionId = card.sessionId;
    if (!sessionId) return;
    if (card.courseType === 'group') {
      navigation.navigate('GroupCourseDetail', { sessionId });
      return;
    }
    if (card.courseType === 'online') {
      navigation.navigate('OnlineCourseDetail', { sessionId });
      return;
    }
    navigation.navigate('PrivateCourseDetail', { sessionId });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 12 }}
      >
        {/* <Flex justify="between" style={styles.calendarBox}>
          {weekDays.map(item => {
            const isActive = item.key === selectedDate;
            const selectable = isCalendarDateInPrescriptionRange(
              item.key,
              prescriptionStartDate,
              prescriptionEndDate,
            );
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={selectable ? 0.7 : 1}
                disabled={!selectable}
                style={[
                  styles.calendarCol,
                  isActive && selectable && styles.calendarColActive,
                ]}
                onPress={() => {
                  if (!selectable) return;
                  onSelectedDateChange(item.key);
                }}>
                <Text
                  style={[
                    isActive && selectable
                      ? styles.calendarTitleActive
                      : styles.calendarTitle,
                    !selectable && styles.calendarTitleDisabled,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    isActive && selectable
                      ? styles.calendarSubtitleActive
                      : styles.calendarSubtitle,
                    !selectable && styles.calendarSubtitleDisabled,
                  ]}
                >
                  {item.day}
                </Text>
                <View style={styles.calendarDotWrap} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.calendarCol}
            onPress={() => setDatePickerVisible(true)}>
            <Text style={styles.calendarTitle}>日期</Text>
            <Image
              style={styles.calendarImage}
              source={require('@/assets/images/nutrition/time.png')}
            />
          </TouchableOpacity>
        </Flex> */}

        <View style={styles.autonomousTrainingBox}>
          <View style={styles.autonomousTrainingItem}>
            <Text style={styles.autonomousText}>关键训练，在专业陪伴中完成</Text>
            <Text style={styles.autonomousText2}>这些训练需要老师指导、器械辅助或在安全范围内完成负荷进阶。</Text>
          </View>
          <ImageBackground
            source={require('@/assets/images/exercise/zzxl1.png')}
            style={styles.autonomousTrainingBackground}
            imageStyle={styles.autonomousTrainingBackgroundImage}
          >
            <Text style={styles.autonomousContentTopText}>本阶段到店训练重点</Text>
            {inStoreTrainingFocusText ? (
              <Text
                style={[styles.autonomousTrainingText2, { marginTop: 9 }]}
                numberOfLines={1}
              >
                {inStoreTrainingFocusText}
              </Text>
            ) : null}
            <Text style={styles.autonomousContentTopText2}>{weeklyInStoreTip}</Text>
            <Text style={styles.autonomousTrainingText5}>由老师结合你的运动处方安排训练</Text>

            {canBook ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { }}
                style={styles.inStoreGuideBtn}
              >
                <Image
                  style={styles.inStoreGuideBtnIcon}
                  source={require('@/assets/images/exercise/book.png')}
                />
                <Text style={styles.inStoreGuideBtnText}>需要老师指导</Text>
              </TouchableOpacity>
            ) : null}

          </ImageBackground>
        </View>

        {showInStoreDoneTip ? (
          <Flex align="center" style={styles.inStoreDoneTip}>
            <Image
              style={styles.inStoreDoneTipIcon}
              source={require('@/assets/images/exercise/fw.png')}
            />
            <Text style={styles.inStoreDoneTipText}>
              今日训练已到店完成，训练进度已记录
            </Text>
          </Flex>
        ) : null}

        {showInStoreSpecialtySection ? (
          <View style={styles.trainingExerciseCard}>
            <Flex align="center">
              <Image
                style={styles.mainTrainingModuleIcon}
                tintColor="#333"
                source={require('@/assets/images/exercise/zx.png')}
              />
              <View style={styles.mainTrainingModuleTitleWrap}>
                <LinearGradient
                  colors={['rgba(109,146,94,0.5)', 'rgba(109,146,94,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mainTrainingModuleUnderline}
                />
                <Text style={styles.mainTrainingModuleTitle}>相关专项训练</Text>
              </View>
            </Flex>
            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color="#6D925E" />
              </View>
            ) : (
              cards.map(card => (
                <Flex key={card.key} align="center" style={styles.mainTrainingActionRow}>
                  <Image style={styles.inStoreSpecialtyThumb} source={card.coverSource} />
                  <View style={styles.trainingExerciseInfo}>
                    <Text style={styles.trainingExerciseTitle} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <Text style={styles.trainingExerciseDuration} numberOfLines={1}>
                      {formatInStoreRehabLabels(card.labels)}
                    </Text>
                  </View>
                  {!lockToRule ? (
                    <View>
                      <Flex align="center" style={styles.mainTrainingActionTimer}>
                        <Image
                          style={styles.mainTrainingActionTimerIcon}
                          source={
                            inStoreDone
                              ? require('@/assets/images/exercise/icon_wc.png')
                              : require('@/assets/images/exercise/sz.png')
                          }
                        />
                        <Text style={styles.mainTrainingActionTimerText}>
                          {inStoreDone ? '完成' : '到店'}
                        </Text>
                      </Flex>
                    </View>
                  ) : null}
                </Flex>
              ))
            )}
          </View>
        ) : !loading ? (
          <View style={styles.trainingExerciseCard}>
            <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 }}>
              <Image
                source={require('@/assets/images/exercise/icon_empty_instore.png')}
                style={{ width: 64, height: 64 }}
              />
              <Text style={[styles.trainingExerciseEmptyText, { marginTop: 12 }]}>
                {specialtyEmptyText}
              </Text>
            </View>
          </View>
        ) : null}

        {showInStoreRecommend && canBook && recommendCards.length > 0 ? (
          <View style={styles.trainingExerciseCard}>
            <Flex align="center">
              <Image
                style={styles.mainTrainingModuleIcon}
                tintColor="#333"
                source={require('@/assets/images/exercise/dd.png')}
              />
              <View style={styles.mainTrainingModuleTitleWrap}>
                <LinearGradient
                  colors={['rgba(109,146,94,0.5)', 'rgba(109,146,94,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mainTrainingModuleUnderline}
                />
                <Text style={styles.mainTrainingModuleTitle}>为你推荐的到店训练</Text>
              </View>
            </Flex>
            {recommendCards.map(card => {
              const coachId = card.coachUserId?.trim() || '';
              const avatarUri = card.avatarUri?.trim() || '';
              return (
                <Flex key={card.key} align="center" style={styles.mainTrainingActionRow}>
                  <TouchableOpacity
                    activeOpacity={coachId ? 0.7 : 1}
                    disabled={!coachId}
                    onPress={() => {
                      if (!coachId) return;
                      navigation.navigate('CoachDetail', { coachUserId: coachId });
                    }}
                  >
                    <Image
                      style={styles.inStoreRecommendAvatar}
                      source={
                        avatarUri
                          ? { uri: avatarUri }
                          : getDefaultAvatarByGender(card.coachSex)
                      }
                    />
                  </TouchableOpacity>
                  <View style={styles.trainingExerciseInfo}>
                    <Text style={styles.trainingExerciseTitle} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <Text style={styles.trainingExerciseDuration} numberOfLines={1}>
                      {card.subtitle}
                    </Text>
                  </View>
                  {card.bookedByMe ? (
                    <TouchableOpacity onPress={() => openRecommendSession(card)} activeOpacity={0.7}>
                      <Flex align="center" style={styles.mainTrainingActionTimer}>
                        <Text style={styles.mainTrainingActionTimerText}>已预约</Text>
                      </Flex>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => openRecommendSession(card)} activeOpacity={0.7}>
                      <Flex align="center" style={styles.inStoreBookBtn}>
                        <Text style={styles.inStoreBookBtnText}>去约课</Text>
                      </Flex>
                    </TouchableOpacity>
                  )}
                </Flex>
              );
            })}
          </View>
        ) : null}

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>在老师的陪伴下，稳稳走向下一阶段</Text>
          <View style={styles.planListFooterLine} />
        </Flex>

      </ScrollView>
      {canBook ? (
        <Flex
          justify="between"
          align="center"
          style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
        >
          <TouchableOpacity
            style={styles.bottomBarButtonLeft}
            activeOpacity={0.7}
            onPress={goCurriculum}
          >
            <Flex justify="center" align="center" style={{ flex: 1 }}>
              <Image
                style={styles.bottomBarButtonIcon}
                source={require('@/assets/images/exercise/icon_next.png')}
              />
              <Text style={styles.bottomBarButtonTextLeft}>去约课</Text>
            </Flex>
          </TouchableOpacity>
        </Flex>
      ) : null}
    </View>
  );
}
