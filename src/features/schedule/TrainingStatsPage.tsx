import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import moment from 'moment';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import scheduleStyles from '@/css/schedule/schedule';
import styles from '@/css/schedule/trainingStats';
import { getExRecordDayStatis, type ExRecordDayStatisData } from '@/api/exRecordDay';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  WEEK_LABELS,
  buildWeekStatsFromStatis,
  canShiftWeekWithinPrescription,
  clampDateRangeToPrescription,
  formatWeekRangeText,
  getPrescriptionLastWeekState,
  getWeekDateRange,
  isDateInPrescriptionRange,
  loadDayTrainingDetails,
  loadScheduleDictMaps,
  loadScheduleWeekCalendarForRange,
  type DayTrainingDetailItem,
  type ScheduleDictMaps,
  type ScheduleWeekDayItem,
  type ScheduleWeekStats,
} from './scheduleHelpers';

type TrainingStatsRoute = RouteProp<RootStackParamList, 'TrainingStatsPage'>;

function TrainingWeekDayCell({
  item,
  inPrescriptionRange,
  onPress,
}: {
  item: ScheduleWeekDayItem;
  inPrescriptionRange: boolean;
  onPress: () => void;
}) {
  const isToday = item.date.isSame(moment(), 'day');
  const isFuture = item.date.isAfter(moment(), 'day');
  const label = WEEK_LABELS[item.date.day()];
  const dayLabel = isToday ? '今' : String(item.date.date());

  const renderPlainDate = () => (
    <Flex justify="center" style={scheduleStyles.dayTimeBox}>
      <Text style={[scheduleStyles.dayTime, scheduleStyles.dayTimeColor]}>{dayLabel}</Text>
    </Flex>
  );

  const renderDayContent = () => {
    if (!inPrescriptionRange) {
      return renderPlainDate();
    }

    if (isToday) {
      return (
        <Flex justify="center" style={[scheduleStyles.dayTimeBox, scheduleStyles.dayTimeToday]}>
          <Text style={[scheduleStyles.dayTime, scheduleStyles.dayTimeBadgeText]}>今</Text>
        </Flex>
      );
    }

    if (isFuture) {
      return renderPlainDate();
    }

    if (item.completed) {
      return (
        <Image source={require('@/assets/images/schedule/wc.png')} style={scheduleStyles.dayTimeBox} />
      );
    }

    if (item.total > 0) {
      return (
        <Flex justify="center" align="center" style={[scheduleStyles.dayTimeBox, scheduleStyles.dayTimeIncomplete]}>
          <Text style={scheduleStyles.dayTimeBadgeText}>{item.done}/{item.total}</Text>
        </Flex>
      );
    }

    return renderPlainDate();
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Flex direction="column" justify="center" style={scheduleStyles.dayCol}>
        <Text style={scheduleStyles.dayText}>{label}</Text>
        {renderDayContent()}
      </Flex>
    </TouchableOpacity>
  );
}

const EMPTY_WEEK_STATS: ScheduleWeekStats = {
  trainingCount: '--',
  completionRate: '--',
  totalDuration: '--',
  trainingDone: '--',
  trainingTotal: '',
  durationMinutes: '--',
};

export default function TrainingStatsPage() {
  const route = useRoute<TrainingStatsRoute>();
  const {
    exPatientRuleId,
    startDate: prescriptionStartDate,
    endDate: prescriptionEndDate,
    initialWeek = 'current',
  } = route.params;

  const initialWeekState = useMemo(() => {
    if (initialWeek === 'last') {
      return getPrescriptionLastWeekState(prescriptionStartDate, prescriptionEndDate);
    }
    return {
      weekStart: moment().startOf('isoWeek'),
      selectedDate: moment().format('YYYY-MM-DD'),
    };
  }, [initialWeek, prescriptionEndDate, prescriptionStartDate]);

  const [weekStart, setWeekStart] = useState(() => initialWeekState.weekStart);
  const [selectedDate, setSelectedDate] = useState(() => initialWeekState.selectedDate);
  const [weekDays, setWeekDays] = useState<ScheduleWeekDayItem[]>([]);
  const [weekStats, setWeekStats] = useState<ScheduleWeekStats>(EMPTY_WEEK_STATS);
  const [dayDetails, setDayDetails] = useState<DayTrainingDetailItem[]>([]);
  const [dictMaps, setDictMaps] = useState<ScheduleDictMaps | null>(null);
  const [weekLoading, setWeekLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(true);

  const { startDate, endDate } = useMemo(() => getWeekDateRange(weekStart), [weekStart]);
  const weekRangeText = useMemo(() => formatWeekRangeText(startDate, endDate), [startDate, endDate]);
  const selectedInPrescriptionRange = useMemo(
    () => isDateInPrescriptionRange(moment(selectedDate), prescriptionStartDate, prescriptionEndDate),
    [prescriptionEndDate, prescriptionStartDate, selectedDate],
  );
  const canGoPrevWeek = useMemo(
    () => canShiftWeekWithinPrescription(weekStart, -1, prescriptionStartDate, prescriptionEndDate),
    [prescriptionEndDate, prescriptionStartDate, weekStart],
  );
  const canGoNextWeek = useMemo(
    () => canShiftWeekWithinPrescription(weekStart, 1, prescriptionStartDate, prescriptionEndDate),
    [prescriptionEndDate, prescriptionStartDate, weekStart],
  );
  const daySectionTitle = useMemo(() => {
    const date = moment(selectedDate);
    if (!date.isValid()) return '训练详情';
    if (date.isSame(moment(), 'day')) return '今日训练详情';
    return `${date.format('M月D日')}训练详情`;
  }, [selectedDate]);

  const weekSummaryTitle = useMemo(() => {
    const isCurrentWeek = moment(weekStart).startOf('isoWeek').isSame(moment().startOf('isoWeek'), 'day');
    return isCurrentWeek ? '本周汇总' : '当周汇总';
  }, [weekStart]);

  useEffect(() => {
    loadScheduleDictMaps()
      .then(setDictMaps)
      .catch(() => setDictMaps(null));
  }, []);

  const loadWeekData = useCallback(async () => {
    setWeekLoading(true);
    try {
      const calendarDays = await loadScheduleWeekCalendarForRange(
        exPatientRuleId,
        startDate,
        endDate,
        weekStart,
      );
      setWeekDays(calendarDays);
    } catch {
      setWeekDays([]);
    } finally {
      setWeekLoading(false);
    }
  }, [endDate, exPatientRuleId, startDate, weekStart]);

  const loadWeekStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const clampedRange = clampDateRangeToPrescription(
        startDate,
        endDate,
        prescriptionStartDate,
        prescriptionEndDate,
      );
      if (!clampedRange) {
        setWeekStats(EMPTY_WEEK_STATS);
        return;
      }

      const res = await getExRecordDayStatis({
        exPatientRuleId,
        startDate: clampedRange.startDate,
        endDate: clampedRange.endDate,
      });
      if (!isResourceApiOk(res)) {
        setWeekStats(EMPTY_WEEK_STATS);
        return;
      }

      setWeekStats(buildWeekStatsFromStatis(apiResourceData<ExRecordDayStatisData>(res as any)));
    } catch {
      setWeekStats(EMPTY_WEEK_STATS);
    } finally {
      setStatsLoading(false);
    }
  }, [endDate, exPatientRuleId, prescriptionEndDate, prescriptionStartDate, startDate]);

  const loadDayData = useCallback(async () => {
    if (!selectedInPrescriptionRange) {
      setDayDetails([]);
      setDayLoading(false);
      return;
    }

    setDayLoading(true);
    try {
      const details = await loadDayTrainingDetails(exPatientRuleId, selectedDate, dictMaps ?? undefined);
      setDayDetails(details);
    } catch {
      setDayDetails([]);
    } finally {
      setDayLoading(false);
    }
  }, [dictMaps, exPatientRuleId, selectedDate, selectedInPrescriptionRange]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  useEffect(() => {
    loadWeekStats();
  }, [loadWeekStats]);

  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  const shiftWeek = (direction: -1 | 1) => {
    if (!canShiftWeekWithinPrescription(weekStart, direction, prescriptionStartDate, prescriptionEndDate)) {
      return;
    }

    setWeekStart(prev => {
      const next = moment(prev).add(direction, 'week');
      const dayIndex = moment(selectedDate).diff(moment(prev).startOf('isoWeek'), 'days');
      let nextSelected = moment(next).startOf('isoWeek').add(dayIndex, 'day');

      const prescriptionStart = moment(prescriptionStartDate);
      const prescriptionEnd = moment(prescriptionEndDate);
      if (prescriptionStart.isValid() && nextSelected.isBefore(prescriptionStart, 'day')) {
        nextSelected = moment(prescriptionStart);
      }
      if (prescriptionEnd.isValid() && nextSelected.isAfter(prescriptionEnd, 'day')) {
        nextSelected = moment(prescriptionEnd);
      }

      setSelectedDate(nextSelected.format('YYYY-MM-DD'));
      return next;
    });
  };

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.weekNavBox}>
          <Flex justify="between" align="center">
            <TouchableOpacity
              activeOpacity={canGoPrevWeek ? 0.7 : 1}
              disabled={!canGoPrevWeek}
              onPress={() => shiftWeek(-1)}>
              <Image
                source={require('@/assets/images/user/left.png')}
                style={[styles.navIcon, !canGoPrevWeek && styles.navIconDisabled]}
              />
            </TouchableOpacity>
            <Text style={styles.weekRangeText}>{weekRangeText}</Text>
            <TouchableOpacity
              activeOpacity={canGoNextWeek ? 0.7 : 1}
              disabled={!canGoNextWeek}
              onPress={() => shiftWeek(1)}>
              <Image
                source={require('@/assets/images/user/left.png')}
                style={[styles.navIconRight, !canGoNextWeek && styles.navIconDisabled]}
              />
            </TouchableOpacity>
          </Flex>
        </View>

        {weekLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : (
          <Flex justify="between" style={scheduleStyles.dayBox}>
            {weekDays.map(item => {
              const dateKey = item.date.format('YYYY-MM-DD');
              return (
                <TrainingWeekDayCell
                  key={dateKey}
                  item={item}
                  inPrescriptionRange={isDateInPrescriptionRange(
                    item.date,
                    prescriptionStartDate,
                    prescriptionEndDate,
                  )}
                  onPress={() => setSelectedDate(dateKey)}
                />
              );
            })}
          </Flex>
        )}

        <Text style={styles.sectionTitle}>{daySectionTitle}</Text>
        {dayLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : !selectedInPrescriptionRange || dayDetails.length === 0 ? (
          <View style={[scheduleStyles.medicalBox, styles.detailCard, { marginTop: 0 }]}>
            <Text style={styles.emptyText}>暂无训练记录</Text>
          </View>
        ) : (
          dayDetails.map(item => (
            <View key={item.key} style={styles.detailCard}>
              <Flex>
                <Image style={scheduleStyles.exerciseImg} source={item.icon} />
                <Text style={[styles.detailTitle, { marginLeft: 8 }]}>{item.title}</Text>
              </Flex>
              <Text style={styles.detailMeta}>时长：{item.durationText}</Text>
              <Text style={styles.detailMeta}>项目：{item.projects}</Text>
              <Text style={styles.detailProgress}>完成度：{item.progress}%</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>{weekSummaryTitle}</Text>
        {statsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : (
          <Flex style={scheduleStyles.statRow} justify="between">
            <Flex direction="column" style={scheduleStyles.statBox}>
              <Text style={scheduleStyles.statValue}>
                {weekStats.trainingDone}
                {weekStats.trainingTotal ? (
                  <Text style={scheduleStyles.statValue_1}>/{weekStats.trainingTotal}</Text>
                ) : null}
              </Text>
              <Text style={scheduleStyles.statTitle}>训练次数</Text>
            </Flex>
            <Flex direction="column" style={scheduleStyles.statBox}>
              <Text style={scheduleStyles.statValue}>{weekStats.completionRate}</Text>
              <Text style={scheduleStyles.statTitle}>完成率</Text>
            </Flex>
            <Flex direction="column" style={scheduleStyles.statBox}>
              <Text style={scheduleStyles.statValue}>
                {weekStats.durationMinutes}
                {weekStats.durationMinutes !== '--' ? (
                  <Text style={[scheduleStyles.statValue_1, { fontSize: 14 }]}>(分钟)</Text>
                ) : null}
              </Text>
              <Text style={scheduleStyles.statTitle}>累计时长</Text>
            </Flex>
          </Flex>
        )}
      </ScrollView>
    </PageLayout>
  );
}
