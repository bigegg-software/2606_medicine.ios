import React, { useEffect, useMemo, useState } from 'react';
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
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '../utils/dietCalendarHelpers';
import {
  clampDateToPrescriptionRange,
  isCalendarDateInPrescriptionRange,
} from '@/src/features/nutrition/components/utils/dietCalendarHelpers';
import { loadExPatientRuleForDate, resolveLockedExerciseViewDate } from '../utils/exerciseRuleDateHelpers';
import {
  EXERCISE_CHECK_IN_DOT_COLOR,
  loadExerciseCheckInMapByYear,
} from '../utils/exerciseCheckInHelpers';
import {
  buildInStoreRehabCards,
  countWeeklyInStoreDays,
  formatInStoreRehabLabels,
  formatWeeklyInStoreTip,
} from '../utils/inStoreRehabHelpers';
import {
  loadInStoreRecommendCards,
  type InStoreRecommendCardView,
} from '../utils/inStoreRecommendHelpers';
import { loadCoachTrainingRecordByRuleAndDate } from '../utils/coachTrainingRecordHelpers';
import { type TrainingPhaseExerciseCard } from '../utils/trainingPhaseHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  exerciseRule?: InUseExPatientRule | null;
  /** 历史计划：日历默认落在处方周期内 */
  lockToRule?: boolean;
  patientUserId?: string;
};

/** 到店专项康复：渲染当日 actionType=in_store 的视频 */
export default function InStoreRehabPage({
  exerciseRule = null,
  lockToRule = false,
  patientUserId,
}: Props) {
  const navigation = useNavigation<Nav>();
  const [selectedDate, setSelectedDate] = useState(() =>
    lockToRule ? resolveLockedExerciseViewDate(exerciseRule) : moment().format('YYYY-MM-DD'),
  );
  const insets = useSafeAreaInsets();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dayRule, setDayRule] = useState<InUseExPatientRule | null>(exerciseRule ?? null);
  const [cards, setCards] = useState<TrainingPhaseExerciseCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklyInStoreTip, setWeeklyInStoreTip] = useState('建议每周到店1-2次');
  const [recommendCards, setRecommendCards] = useState<InStoreRecommendCardView[]>([]);
  /** 当日是否已有教练到店训练日志 */
  const [inStoreDone, setInStoreDone] = useState(false);
  const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
  const prescriptionStartDate = exerciseRule?.startDate?.trim() || '';
  const prescriptionEndDate = exerciseRule?.endDate?.trim() || '';
  const isToday = moment(selectedDate).isSame(moment(), 'day');
  const showInStoreDoneTip = isToday && inStoreDone;
  const exerciseDayRecordMarker = useMemo(() => ({
    color: EXERCISE_CHECK_IN_DOT_COLOR,
    loadByYear: (year: number) =>
      loadExerciseCheckInMapByYear(year, patientUserId, exerciseRule?.exPatientRuleId),
  }), [exerciseRule?.exPatientRuleId, patientUserId]);

  useEffect(() => {
    if (!lockToRule || !exerciseRule) return;
    setSelectedDate(resolveLockedExerciseViewDate(exerciseRule));
  }, [exerciseRule, lockToRule]);

  useEffect(() => {
    if (!prescriptionStartDate && !prescriptionEndDate) return;
    setSelectedDate(prev =>
      clampDateToPrescriptionRange(prev, prescriptionStartDate, prescriptionEndDate),
    );
  }, [prescriptionEndDate, prescriptionStartDate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rule = await loadExPatientRuleForDate(selectedDate, exerciseRule, {
          patientUserId,
        });
        if (cancelled) return;
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
        setWeeklyInStoreTip(formatWeeklyInStoreTip(inStoreDayCount));
        setInStoreDone(Boolean(coachRecord));
      } catch {
        if (cancelled) return;
        setDayRule(null);
        setCards([]);
        setWeeklyInStoreTip(formatWeeklyInStoreTip(0));
        setInStoreDone(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseRule, patientUserId, selectedDate]);

  useEffect(() => {
    if (lockToRule) {
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
  }, [lockToRule]);

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
      <DietDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
        dayRecordMarker={exerciseDayRecordMarker}
        selectableStartDate={prescriptionStartDate || null}
        selectableEndDate={prescriptionEndDate || null}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
        <Flex justify="between" style={styles.calendarBox}>
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
                  setSelectedDate(item.key);
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
        </Flex>
        <View style={styles.autonomousTrainingBox}>
          <View style={styles.autonomousTrainingItem}>
            <Text style={styles.autonomousText}>关键训练，在专业陪伴中完成</Text>
            <Text style={styles.autonomousText2}>这些训练需要老师指导、器械辅助或在安全范围内完成负荷进阶。</Text>
          </View>
          <ImageBackground
            source={
              patientUserId || lockToRule
                ? require('@/assets/images/exercise/zzxl1_1.png')
                : require('@/assets/images/exercise/zzxl1.png')
            }
            style={styles.autonomousTrainingBackground}
            imageStyle={styles.autonomousTrainingBackgroundImage}
          >
            <Flex justify="between" style={styles.autonomousContentTop}>
              <Flex>
                <Image style={styles.autonomousContentTopIcon} source={require('@/assets/images/common/wc.png')} />
                <Text style={styles.autonomousContentTopText}>本阶段到店训练重点</Text>
              </Flex>
              <Text style={styles.autonomousContentTopText2}>{weeklyInStoreTip}</Text>
            </Flex>
            <Text style={[styles.autonomousTrainingText2, { marginTop: 16 }]}>下肢稳定与核心控制</Text>
            <Text style={styles.autonomousTrainingText5}>由老师结合你的运动处方安排训练</Text>

            {!lockToRule ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { }}
                style={styles.inStoreGuideBtn}
              >
                <Image
                  style={styles.autonomousStartBtnIcon}
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
          ) : cards.length === 0 ? (
            <Text style={[styles.trainingExerciseDuration, { marginTop: 12 }]}>
              {dayRule ? '今日暂无到店专项训练' : '暂无到店专项训练'}
            </Text>
          ) : (
            cards.map(card => (
              <Flex key={card.key} align="center" style={styles.mainTrainingActionRow}>
                <Image style={styles.trainingExerciseThumb} source={card.coverSource} />
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

        {!lockToRule && recommendCards.length > 0 ? (
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
            {recommendCards.map(card => (
              <Flex key={card.key} align="center" style={styles.mainTrainingActionRow}>
                <Image
                  style={styles.trainingExerciseThumb}
                  source={
                    card.avatarUri
                      ? { uri: card.avatarUri }
                      : require('@/assets/images/exercise/dtls.png')
                  }
                />
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
            ))}
          </View>
        ) : null}

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>在老师的陪伴下，稳稳走向下一阶段</Text>
          <View style={styles.planListFooterLine} />
        </Flex>

      </ScrollView>
      {!lockToRule ? (
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
