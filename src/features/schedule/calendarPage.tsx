import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Picker } from '@ant-design/react-native';
import moment, { type Moment } from 'moment';
import { AppTheme } from '@/common/theme';
import styles from '@/css/schedule/calendar';
import { getScheduleMonthlyOverview } from '@/api/schedule';
import { isApiOk } from '@/src/utils/apiHelpers';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;
const MIN_YEAR = moment().year() - 10;
const MAX_YEAR = moment().year() + 1;

const MONTH_PICKER_DATA = [
  Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => {
    const year = MIN_YEAR + index;
    return { label: String(year), value: year };
  }),
  Array.from({ length: 12 }, (_, index) => ({
    label: String(index + 1).padStart(2, '0'),
    value: index + 1,
  })),
];

type CalendarDay = {
  date: Moment;
  isCurrentMonth: boolean;
};

function DashedDivider() {
  return (
    <View style={styles.divider}>
      {Array.from({ length: DASH_COUNT }, (_, index) => (
        <View key={index} style={styles.dash} />
      ))}
    </View>
  );
}

function buildCalendarDays(month: Moment): CalendarDay[] {
  const start = moment(month).startOf('month');
  const end = moment(month).endOf('month');
  const calendarStart = moment(start).startOf('week');
  const calendarEnd = moment(end).endOf('week');
  const days: CalendarDay[] = [];
  const cursor = moment(calendarStart);

  while (!cursor.isAfter(calendarEnd, 'day')) {
    days.push({
      date: moment(cursor),
      isCurrentMonth: cursor.month() === month.month(),
    });
    cursor.add(1, 'day');
  }

  return days;
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const STATIC_TIMELINE = [
  {
    period: '上午',
    items: [
      { time: '9:00', title: '有氧心肺', desc: '快走40分钟' },
      { time: '9:30', title: '柔韧拉伸', desc: '静态拉伸15分钟' },
    ],
  },
  {
    period: '下午',
    items: [
      { time: '13:00', title: '抗阻增肌', desc: '深蹲3组×12次' },
      { time: '19:30', title: '平衡控制', desc: '单脚站立训练' },
    ],
  },
] as const;

function ScheduleTimeline() {
  return (
    <View style={styles.timelineWrap}>
      <View style={styles.axisLine} pointerEvents="none" />
      {STATIC_TIMELINE.map((section, sectionIndex) => (
        <React.Fragment key={section.period}>
          <View
            style={[
              styles.periodRow,
              sectionIndex > 0 && styles.periodRowAfternoon,
            ]}>
            <View style={styles.timeAxis}>
              <Text style={styles.periodText}>{section.period}</Text>
            </View>
            <View style={styles.cardSide} />
          </View>

          {section.items.map((item, itemIndex) => {
            const isLastInSection = itemIndex === section.items.length - 1;
            const isLastOverall =
              sectionIndex === STATIC_TIMELINE.length - 1 && isLastInSection;

            return (
              <View
                key={item.time}
                style={[
                  styles.timelineRow,
                  !isLastInSection && styles.timelineRowGap,
                  isLastInSection && styles.timelineRowSectionLast,
                  isLastOverall && styles.timelineRowLast,
                ]}>
                <View style={styles.timeAxis}>
                  <View style={styles.timeSlot}>
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                </View>
                <View style={styles.cardSide}>
                  <Flex style={styles.taskCard}>
                    <Image style={styles.taskCardIcon} source={require('@/assets/images/schedule/yw.png')}/>
                    <View>
                      <Text style={styles.taskCardTitle}>{item.title}</Text>
                      <Text style={styles.taskCardDesc}>{item.desc}</Text>
                    </View>
                  </Flex>
                </View>
              </View>
            );
          })}
        </React.Fragment>
      ))}
    </View>
  );
}

function normalizeMarkedDates(data: unknown): Set<string> {
  const marked = new Set<string>();

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') {
        marked.add(item);
        continue;
      }
      if (item && typeof item === 'object') {
        const date =
          'date' in item && typeof (item as { date?: unknown }).date === 'string'
            ? (item as { date: string }).date
            : 'customerLocalDate' in item &&
                typeof (item as { customerLocalDate?: unknown }).customerLocalDate === 'string'
              ? (item as { customerLocalDate: string }).customerLocalDate
              : null;
        if (date) marked.add(date);
      }
    }
    return marked;
  }

  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        marked.add(key);
        continue;
      }
      if (Array.isArray(value)) {
        for (const date of value) {
          if (typeof date === 'string') marked.add(date);
        }
      }
    }
  }

  return marked;
}

export default function ScheduleCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loadingMonth, setLoadingMonth] = useState(false);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const dateHeader = `${moment(selectedDate).format('YYYY.MM.DD')} ${WEEKDAY_LABELS[moment(selectedDate).day()]}`;

  const loadMonthlyOverview = useCallback(async (month: Moment) => {
    setLoadingMonth(true);
    try {
      const res = await getScheduleMonthlyOverview(month.format('YYYY-MM'));
      if (isApiOk(res as { code?: number })) {
        const data = (res as { data?: unknown }).data;
        setMarkedDates(normalizeMarkedDates(data));
      } else {
        setMarkedDates(new Set());
      }
    } catch {
      setMarkedDates(new Set());
    } finally {
      setLoadingMonth(false);
    }
  }, []);

  useEffect(() => {
    loadMonthlyOverview(currentMonth);
  }, [currentMonth, loadMonthlyOverview]);

  return (
    <PageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.rowBox}>
          <Flex justify="between" align="center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentMonth(m => moment(m).subtract(1, 'month'))}>
              <Image source={require('@/assets/images/user/left.png')} style={styles.navIcon} />
            </TouchableOpacity>
            <Picker
              data={MONTH_PICKER_DATA}
              cols={2}
              cascade={false}
              value={[currentMonth.year(), currentMonth.month() + 1]}
              onOk={values => {
                setCurrentMonth(
                  moment({
                    year: Number(values[0]),
                    month: Number(values[1]) - 1,
                    date: 1,
                  }),
                );
              }}>
              <TouchableOpacity activeOpacity={0.7} style={styles.dayTitleBtn}>
                <Text style={styles.dayTitle}>{currentMonth.format('YYYY-MM')}</Text>
              </TouchableOpacity>
            </Picker>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentMonth(m => moment(m).add(1, 'month'))}>
              <Image source={require('@/assets/images/user/left.png')} style={styles.navIconRight} />
            </TouchableOpacity>
          </Flex>

          <View style={styles.weekHead}>
            {WEEK_LABELS.map(label => (
              <Text key={label} style={styles.weekCell}>
                {label}
              </Text>
            ))}
          </View>

          <DashedDivider />

          {loadingMonth ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={AppTheme.primaryColor} />
            </View>
          ) : (
            <View style={styles.calendarGrid}>
              {calendarDays.map(day => {
                const dateKey = day.date.format('YYYY-MM-DD');
                const isSelected = selectedDate === dateKey;
                const isToday = day.date.isSame(moment(), 'day');
                const hasTask = markedDates.has(dateKey);

                return (
                  <TouchableOpacity
                    key={dateKey}
                    activeOpacity={0.7}
                    style={styles.dayCell}
                    onPress={() => setSelectedDate(dateKey)}>
                    <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                      <Text
                        style={
                          isSelected
                            ? styles.dayTextSelected
                            : day.isCurrentMonth
                              ? styles.dayText
                              : styles.dayTextOther
                        }>
                        {isToday ? '今' : day.date.date()}
                      </Text>
                    </View>
                    {hasTask ? (
                      <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        <Text style={styles.titleText}>{dateHeader}</Text>
        <ScheduleTimeline />
      </ScrollView>
    </PageLayout>
  );
}
