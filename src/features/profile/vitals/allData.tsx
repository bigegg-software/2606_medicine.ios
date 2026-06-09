import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, Picker } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { type Moment } from 'moment';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/all';
import {
  getMeasureDataDetailByDate,
  type MeasureDataDetailResult,
  type MeasureDataItem,
  type MeasureDataType,
} from '@/api/measureData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { getLevelBgColor, getLevelColor } from './vitalLevelColors';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AllDataPage'>;

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;
const MIN_YEAR = moment().year() - 10;
const MAX_YEAR = moment().year() + 1;

const PAGE_TITLES: Record<MeasureDataType, string> = {
  血压: '血压记录',
  血糖: '血糖记录',
  体温: '体温记录',
};

const MEASURE_UNITS: Record<MeasureDataType, string> = {
  血压: 'mmHg',
  血糖: 'mmol/L',
  体温: '℃',
};

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

function DashedDivider() {
  return (
    <View style={styles.divider}>
      {Array.from({ length: DASH_COUNT }, (_, index) => (
        <View key={index} style={styles.dash} />
      ))}
    </View>
  );
}

type CalendarDay = {
  date: Moment;
  isCurrentMonth: boolean;
};

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

function sortRecordsDesc(items: MeasureDataItem[]) {
  return [...items].sort((a, b) => {
    const timeCompare = (b.dataTime ?? '').localeCompare(a.dataTime ?? '');
    if (timeCompare !== 0) return timeCompare;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

function formatMeasureValue(item: MeasureDataItem, type: MeasureDataType) {
  if (type === '血压') {
    return `${Number(item.val) ?? '--'}/${Number(item.val2) ?? '--'}`;
  }
  if (type === '体温' || type === '血糖') {
    const val = Number(item.val);
    return !Number.isNaN(val) ? val.toFixed(1) : '--';
  }
  return item.val != null ? String(item.val) : '--';
}

function getLevelLabel(item: MeasureDataItem) {
  const level = item.level?.split(',')[0]?.trim();
  if (level) return level;
  if (item.isHigh === 1) return '偏高';
  if (item.isLow === 1) return '偏低';
  return '正常';
}

function MeasureRecordCard({
  item,
  type,
  expanded,
  onToggle,
  onPress,
}: {
  item: MeasureDataItem;
  type: MeasureDataType;
  expanded: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const levelLabel = getLevelLabel(item);
  const levelColor = getLevelColor(levelLabel);
  const recordTime =
    item.customerLocalDate && item.dataTime
      ? `${item.customerLocalDate} ${item.dataTime}`
      : item.dataTime || '--';

  return (
    <View style={styles.mapBox}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Flex justify="between" style={styles.mapItem}>
          <Flex>
            <Image
              style={styles.mapIcon}
              tintColor={AppTheme.textPrimary}
              source={require('@/assets/images/user/nl.png')}
            />
            <Text style={styles.mapTime}>{item.dataTime || '--'}</Text>
          </Flex>
          <Flex style={[styles.mapValueBox, { backgroundColor: getLevelBgColor(levelLabel) }]}>
            <Text style={[styles.mapValue, { color: levelColor }]}>{levelLabel}</Text>
          </Flex>
        </Flex>
        <Flex justify="between" align="start" style={styles.mapItem}>
          <View style={styles.mapItemLeft}>
            <Text style={styles.mapItemText}>{type}</Text>
            {item.remark ? (
              <Text style={styles.mapItemBz} numberOfLines={2} ellipsizeMode="tail">
                {item.remark}
              </Text>
            ) : null}
          </View>
          <View style={styles.mapItemRight}>
            <Text style={styles.mapItemValue}>{formatMeasureValue(item, type)}</Text>
            <Text style={styles.mapItemUnit}>{MEASURE_UNITS[type]}</Text>
          </View>
        </Flex>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.expandBtn, expanded && styles.expandBtnExpanded]}
        onPress={onToggle}>
        <Flex align="center" justify="center">
          <Text style={styles.expandText}>{expanded ? '收起' : '展开'}</Text>
          <MaterialIcons
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={18}
            color={AppTheme.textSecondary}
          />
        </Flex>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.expandDetail}>
          <View style={styles.rowLine} />
          <Flex justify="between" style={styles.mapItem}>
            <View>
              {item.measurementStatus ? <Text style={styles.mapLeftText}>记录状态</Text> : null}
              <Text style={styles.mapLeftText}>记录时间</Text>
              {type === '血压' && item.measuringSite ? (
                <Text style={styles.mapLeftText}>测量部位</Text>
              ) : null}
            </View>
            <View>
              {item.measurementStatus ? (
                <Text style={styles.mapRightText}>{item.measurementStatus}</Text>
              ) : null}
              <Text style={styles.mapRightText}>{recordTime}</Text>
              {type === '血压' && item.measuringSite ? (
                <Text style={styles.mapRightText}>{item.measuringSite}</Text>
              ) : null}
            </View>
          </Flex>
          {item.remark ? (
            <View style={styles.remarkBox}>
              <Text style={styles.mapLeftText}>备注</Text>
              <Text style={styles.remarkFullText}>{item.remark}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function AllDataPage({ route }: Props) {
  const measureType = route.params?.type ?? '血压';
  const navigation = useNavigation<Nav>();
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [records, setRecords] = useState<MeasureDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  useEffect(() => {
    navigation.setOptions({
      title: PAGE_TITLES[measureType],
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('AddDataPage', { type: measureType })}>
          <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>新增记录</Text>
        </TouchableOpacity>
      ),
    });
  }, [measureType, navigation]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setExpandedKey(null);
    try {
      const res = (await getMeasureDataDetailByDate({
        customerLocalDate: selectedDate,
        type: measureType,
      })) as unknown as MeasureDataDetailResult;
      if (!isResourceApiOk(res)) {
        setRecords([]);
        return;
      }
      const data = apiResourceData<MeasureDataItem[]>(res);
      setRecords(Array.isArray(data) ? sortRecordsDesc(data) : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [measureType, selectedDate]);

  const loadRecordsRef = useRef(loadRecords);
  loadRecordsRef.current = loadRecords;
  const hasMountedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      loadRecordsRef.current();
    }, []),
  );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.rowBox}>
          <Flex justify="between" align="center">
            <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentMonth(m => moment(m).subtract(1, 'month'))}>
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
            <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentMonth(m => moment(m).add(1, 'month'))}>
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

          <View style={styles.calendarGrid}>
            {calendarDays.map(day => {
              const dateKey = day.date.format('YYYY-MM-DD');
              const isSelected = selectedDate === dateKey;
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
                      {day.date.date()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : null}

        {!loading && records.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>暂无记录</Text>
          </View>
        ) : null}

        {records.map((item, index) => {
          const itemKey = String(item.id ?? `${item.dataTime}-${item.val}-${index}`);
          return (
            <MeasureRecordCard
              key={itemKey}
              item={item}
              type={measureType}
              expanded={expandedKey === itemKey}
              onToggle={() => setExpandedKey(prev => (prev === itemKey ? null : itemKey))}
              onPress={() => navigation.navigate('AddDataPage', { type: measureType, item })}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
