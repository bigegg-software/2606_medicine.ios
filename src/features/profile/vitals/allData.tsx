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
  type VitalsMeasureType,
} from '@/api/measureData';
import {
  getWearableDataDetailByCustomerLocalDate,
  WEARABLE_DATA_TYPES,
  type WearableDataDetailResult,
  type WearableDataItem,
  type WearableDataType,
  type WearableOriginalReading,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { getLevelBgColor, getLevelColor } from './vitalLevelColors';
import {
  getTotalCholesterolStatusLabel,
  getUricAcidStatusLabel,
} from './vitalsHelpers';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AllDataPage'>;

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;
const MIN_YEAR = moment().year() - 10;
const MAX_YEAR = moment().year() + 1;

const PAGE_TITLES: Record<VitalsMeasureType, string> = {
  血压: '血压记录',
  血糖: '血糖记录',
  体温: '体温记录',
  尿酸: '尿酸记录',
  血脂: '血脂记录',
  血氧: '血氧记录',
  心率: '心率记录',
};

const MEASURE_UNITS: Record<MeasureDataType, string> = {
  血压: 'mmHg',
  血糖: 'mmol/L',
  体温: '℃',
  尿酸: 'μmol/L',
  血脂: 'mmol/L',
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

function getDataSourceLabel(source?: string | null) {
  return source?.trim() || '手动录入';
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
  if (type === '血脂') {
    const tc = item.xuezhiTc ?? item.val;
    const tg = item.xuezhiTg;
    const hdl = item.xuezhiHdlC;
    const ldl = item.xuezhiLdlC;
    const parts: string[] = [];
    if (tc != null && !Number.isNaN(Number(tc))) parts.push(`TC ${Number(tc).toFixed(2)}`);
    if (tg != null && !Number.isNaN(Number(tg))) parts.push(`TG ${Number(tg).toFixed(2)}`);
    if (hdl != null && !Number.isNaN(Number(hdl))) parts.push(`HDL ${Number(hdl).toFixed(2)}`);
    if (ldl != null && !Number.isNaN(Number(ldl))) parts.push(`LDL ${Number(ldl).toFixed(2)}`);
    return parts.length ? parts.join('  ') : '--';
  }
  if (type === '体温' || type === '血糖') {
    const val = Number(item.val);
    return !Number.isNaN(val) ? val.toFixed(1) : '--';
  }
  if (type === '尿酸') {
    const val = Number(item.val);
    return !Number.isNaN(val) ? String(Math.round(val)) : '--';
  }
  return item.val != null ? String(item.val) : '--';
}

function getLevelLabel(item: MeasureDataItem, type?: MeasureDataType, gender?: string | null) {
  const level = item.level?.split(',')[0]?.trim();
  if (level) return level;
  if (item.isHigh === 1) return '偏高';
  if (item.isLow === 1) return '偏低';
  if (type === '血脂') {
    const tc = Number(item.xuezhiTc ?? item.val);
    if (Number.isFinite(tc)) return getTotalCholesterolStatusLabel(tc);
  }
  if (type === '尿酸') {
    const val = Number(item.val);
    if (Number.isFinite(val)) return getUricAcidStatusLabel(val, gender);
  }
  return '正常';
}

type WearableReadingRecord = {
  key: string;
  time: string;
  recordTime: string;
  value: number;
  level: string;
  sourceName?: string;
};

type WearableDetailConfig = {
  apiType: WearableDataType;
  label: string;
  unit: string;
  parseValue: (raw: number) => number | null;
  getLevelLabel: (value: number, highLowLabel?: string) => string;
};

const WEARABLE_DETAIL_CONFIG: Partial<Record<Extract<VitalsMeasureType, '血氧' | '心率'>, WearableDetailConfig>> = {
  血氧: {
    apiType: WEARABLE_DATA_TYPES.oxygen,
    label: '血氧',
    unit: '%',
    parseValue: raw => (raw > 0 ? Math.round(raw * 100) : null),
    getLevelLabel: (value, highLowLabel) => {
      const label = highLowLabel?.trim();
      if (label) return label;
      if (value < 90) return '异常偏低';
      if (value < 95) return '较低';
      return '正常';
    },
  },
  心率: {
    apiType: WEARABLE_DATA_TYPES.heartRate,
    label: '心率',
    unit: '次/分钟',
    parseValue: raw => (raw > 0 ? Math.round(raw) : null),
    getLevelLabel: (value, highLowLabel) => {
      const label = highLowLabel?.trim();
      if (label) return label;
      if (value > 100) return '偏高';
      if (value < 60) return '偏低';
      return '正常';
    },
  },
};

function flattenWearableOriginalData(readings?: WearableOriginalReading[] | WearableOriginalReading[][]) {
  if (!readings?.length) return [] as WearableOriginalReading[];
  if (Array.isArray(readings[0])) {
    return (readings as WearableOriginalReading[][]).flat();
  }
  return readings as WearableOriginalReading[];
}

function buildWearableRecords(
  originalData: WearableOriginalReading[] | WearableOriginalReading[][] | undefined,
  config: WearableDetailConfig,
): WearableReadingRecord[] {
  const records: WearableReadingRecord[] = [];

  for (const [index, reading] of flattenWearableOriginalData(originalData).entries()) {
    const raw = Number(reading.value);
    if (!Number.isFinite(raw)) continue;
    const value = config.parseValue(raw);
    if (value == null) continue;
    const ts = moment(reading.startDate ?? reading.endDate);
    const recordTime = ts.isValid() ? ts.format('YYYY-MM-DD HH:mm') : '--';
    records.push({
      key: reading.id ?? `${reading.startDate ?? reading.endDate ?? index}-${index}`,
      time: ts.isValid() ? ts.format('HH:mm') : '--',
      recordTime,
      value,
      level: config.getLevelLabel(value, reading.highLowLabel),
      sourceName: reading.sourceName,
    });
  }

  return records.sort((a, b) => b.recordTime.localeCompare(a.recordTime));
}

function MeasureRecordCard({
  item,
  type,
  gender,
  expanded,
  onToggle,
  onPress,
}: {
  item: MeasureDataItem;
  type: MeasureDataType;
  gender?: string | null;
  expanded: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const levelLabel = getLevelLabel(item, type, gender);
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
              <Text style={styles.mapLeftText}>数据来源</Text>
              {type === '血压' && item.measuringSite ? (
                <Text style={styles.mapLeftText}>测量部位</Text>
              ) : null}
            </View>
            <View>
              {item.measurementStatus ? (
                <Text style={styles.mapRightText}>{item.measurementStatus}</Text>
              ) : null}
              <Text style={styles.mapRightText}>{recordTime}</Text>
              <Text style={styles.mapRightText}>{getDataSourceLabel(item.sourceName)}</Text>
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

function WearableRecordCard({
  item,
  label,
  unit,
  expanded,
  onToggle,
}: {
  item: WearableReadingRecord;
  label: string;
  unit: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const levelColor = getLevelColor(item.level);

  return (
    <View style={styles.mapBox}>
      <Flex justify="between" style={styles.mapItem}>
        <Flex>
          <Image
            style={styles.mapIcon}
            tintColor={AppTheme.textPrimary}
            source={require('@/assets/images/user/nl.png')}
          />
          <Text style={styles.mapTime}>{item.time}</Text>
        </Flex>
        <Flex style={[styles.mapValueBox, { backgroundColor: getLevelBgColor(item.level) }]}>
          <Text style={[styles.mapValue, { color: levelColor }]}>{item.level}</Text>
        </Flex>
      </Flex>
      <Flex justify="between" align="start" style={styles.mapItem}>
        <View style={styles.mapItemLeft}>
          <Text style={styles.mapItemText}>{label}</Text>
        </View>
        <View style={styles.mapItemRight}>
          <Text style={styles.mapItemValue}>{item.value}</Text>
          <Text style={styles.mapItemUnit}>{unit}</Text>
        </View>
      </Flex>
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
              <Text style={styles.mapLeftText}>记录时间</Text>
              <Text style={styles.mapLeftText}>数据来源</Text>
            </View>
            <View>
              <Text style={styles.mapRightText}>{item.recordTime}</Text>
              <Text style={styles.mapRightText}>{getDataSourceLabel(item.sourceName)}</Text>
            </View>
          </Flex>
        </View>
      ) : null}
    </View>
  );
}

export default function AllDataPage({ route }: Props) {
  const measureType = (route.params?.type ?? '血压') as VitalsMeasureType;
  const userGender = useSelector((state: RootState) => state.user.info?.gender);
  const wearableConfig = WEARABLE_DETAIL_CONFIG[measureType as '血氧' | '心率'];
  const isWearableType = Boolean(wearableConfig);
  const navigation = useNavigation<Nav>();
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [records, setRecords] = useState<MeasureDataItem[]>([]);
  const [wearableRecords, setWearableRecords] = useState<WearableReadingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  useEffect(() => {
    navigation.setOptions({
      title: PAGE_TITLES[measureType],
      headerRight: isWearableType
        ? undefined
        : () => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ marginRight: 16 }}
            onPress={() => navigation.navigate('AddDataPage', { type: measureType as MeasureDataType })}>
            <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>新增记录</Text>
          </TouchableOpacity>
        ),
    });
  }, [isWearableType, measureType, navigation]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setExpandedKey(null);
    try {
      if (wearableConfig) {
        const res = (await getWearableDataDetailByCustomerLocalDate({
          customerLocalDate: selectedDate,
          type: wearableConfig.apiType,
        })) as unknown as WearableDataDetailResult;
        if (!isResourceApiOk(res)) {
          setWearableRecords([]);
          return;
        }
        const data = apiResourceData<WearableDataItem>(res);
        setWearableRecords(buildWearableRecords(data?.originalData, wearableConfig));
        return;
      }

      const res = (await getMeasureDataDetailByDate({
        customerLocalDate: selectedDate,
        type: measureType as MeasureDataType,
      })) as unknown as MeasureDataDetailResult;
      if (!isResourceApiOk(res)) {
        setRecords([]);
        return;
      }
      const data = apiResourceData<MeasureDataItem[]>(res);
      setRecords(Array.isArray(data) ? sortRecordsDesc(data) : []);
    } catch {
      setRecords([]);
      setWearableRecords([]);
    } finally {
      setLoading(false);
    }
  }, [measureType, selectedDate, wearableConfig]);

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
              const isToday = day.date.isSame(moment(), 'day');
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

        {!loading && (isWearableType ? wearableRecords.length === 0 : records.length === 0) ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>暂无记录</Text>
          </View>
        ) : null}

        {isWearableType && wearableConfig
          ? wearableRecords.map(item => (
            <WearableRecordCard
              key={item.key}
              item={item}
              label={wearableConfig.label}
              unit={wearableConfig.unit}
              expanded={expandedKey === item.key}
              onToggle={() => setExpandedKey(prev => (prev === item.key ? null : item.key))}
            />
          ))
          : records.map((item, index) => {
            const itemKey = String(item.id ?? `${item.dataTime}-${item.val}-${index}`);
            return (
              <MeasureRecordCard
                key={itemKey}
                item={item}
                type={measureType as MeasureDataType}
                gender={userGender}
                expanded={expandedKey === itemKey}
                onToggle={() => setExpandedKey(prev => (prev === itemKey ? null : itemKey))}
                onPress={() => navigation.navigate('AddDataPage', { type: measureType as MeasureDataType, item })}
              />
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
