import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import SwipeDeleteRow, { closeActiveSwipeRow } from '@/src/features/profile/healthRecord/components/SwipeDeleteRow';
import { Flex, Picker } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import { AppTheme } from '@/common/theme';
import styles from '@/css/vitals/all';
import { buildAllDataWeekDays } from './utils/allDataCalendarHelpers';
import {
  resolveVitalsUploadMarker,
  loadVitalsUploadMapByYear,
  type VitalsUploadMap,
} from './utils/vitalsUploadCalendarHelpers';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import {
  buildWearableStatusFilterPickerData,
  filterWearableRecordsByStatus,
  WEARABLE_STATUS_FILTER_ALL,
} from './utils/allDataFilterHelpers';
import {
  getMeasureDataDetailByDate,
  type MeasureDataDetailResult,
  type MeasureDataItem,
  type MeasureDataType,
  type VitalsMeasureType,
} from '@/api/measureData';
import {
  getWearableDataDetailByCustomerLocalDate,
  removeWearableOriginalDataById,
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
  getUricAcidStatusLabel,
  getSleepDurationMinutes,
  getSleepQuality,
} from './vitalsHelpers';
import {
  getBloodLipidStatusLabel,
  type BloodLipidMetricKey,
} from './detail/helpers/bloodLipid';
import {
  resolveEnergyTarget,
  resolveStepTarget,
} from './detail/helpers/vitalsGoalTargets';
import {
  buildSleepGoalProgress,
  getSleepDetailHeaderSummary,
  resolveStoreSleepGoal,
} from './detail/helpers/sleep';
import { buildAllDataSleepCardData } from './allDataSleepHelpers';
import SleepPieChart from '@/src/features/profile/components/SleepPieChart';
import SleepStageDetailChart, {
  type SleepStageSelection,
} from './detail/components/SleepStageDetailChart';
import detailStyles from '@/css/vitals/bloodPage';
import {
  buildEnergyGoalSummaryCardData,
  buildStepsGoalSummaryCardData,
  type AllDataGoalSummaryCardData,
} from './allDataGoalSummaryHelpers';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'AllDataPage'>;

const PAGE_TITLES: Record<VitalsMeasureType, string> = {
  血压: '血压记录',
  血糖: '血糖记录',
  体温: '体温记录',
  尿酸: '尿酸记录',
  血脂: '血脂记录',
  体重: '体重记录',
  血氧: '血氧记录',
  心率: '心率记录',
  步数: '步数记录',
  消耗: '消耗记录',
  睡眠: '睡眠记录',
};

const MEASURE_UNITS: Record<MeasureDataType, string> = {
  血压: 'mmHg',
  血糖: 'mmol/L',
  体温: '℃',
  尿酸: 'μmol/L',
  血脂: 'mmol/L',
  体重: 'kg',
};

const SWIPE_STYLE_OVERRIDES = {
  swipeRow: styles.swipeRow,
  swipeAction: styles.swipeAction,
  swipeForeground: styles.swipeForeground,
  swipeDeleteBtn: styles.swipeDeleteBtn,
  editIcon: styles.swipeDeleteIcon,
};

function getDataSourceLabel(source?: string | null, emptyLabel = '手动录入') {
  return source?.trim() || emptyLabel;
}

function formatWearableReadingDateTime(value?: string) {
  if (!value?.trim()) return '--';
  const normalized = value.trim().replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = moment(normalized);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '--';
}

function formatWearableItemTimeText(value?: string, selectedDate?: string) {
  const formatted = formatWearableReadingDateTime(value);
  if (formatted !== '--') return formatted;
  if (!value?.trim()) return '--';
  const timeText = value.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(timeText)
    ? timeText
    : selectedDate
      ? `${selectedDate} ${timeText}`
      : timeText;
}

function sortRecordsDesc(items: MeasureDataItem[]) {
  return [...items].sort((a, b) => {
    const timeCompare = (b.dataTime ?? '').localeCompare(a.dataTime ?? '');
    if (timeCompare !== 0) return timeCompare;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

function formatLipidValue(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '--';
  return Number(value).toFixed(2);
}

const LIPID_METRIC_ROWS = [
  {
    key: 'tc',
    metricKey: 'TC' as BloodLipidMetricKey,
    label: '总胆固醇 TC',
    getValue: (item: MeasureDataItem) => item.xuezhiTc ?? item.val,
  },
  {
    key: 'tg',
    metricKey: 'TG' as BloodLipidMetricKey,
    label: 'TG',
    getValue: (item: MeasureDataItem) => item.xuezhiTg,
  },
  {
    key: 'ldl',
    metricKey: 'LDL-C' as BloodLipidMetricKey,
    label: 'LDL-C',
    getValue: (item: MeasureDataItem) => item.xuezhiLdlC,
  },
  {
    key: 'hdl',
    metricKey: 'HDL-C' as BloodLipidMetricKey,
    label: 'HDL-C',
    getValue: (item: MeasureDataItem) => item.xuezhiHdlC,
  },
] as const;

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
  if (type === '体温' || type === '血糖' || type === '体重') {
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
  startTime: string;
  endTime: string;
  value: number;
  level: string;
  sourceName?: string;
  label?: string;
  wearableDataId?: string;
  originalDataId?: string;
};

type WearableDetailOptions = {
  stepGoals?: number;
  energyGoals?: number;
};

type WearableDetailConfig = {
  apiType: WearableDataType;
  label: string;
  unit: string;
  parseValue: (raw: number) => number | null;
  getLevelLabel: (value: number, highLowLabel?: string, options?: WearableDetailOptions) => string;
};

const WEARABLE_DETAIL_CONFIG: Partial<Record<Extract<VitalsMeasureType, '血氧' | '心率' | '步数'>, WearableDetailConfig>> = {
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
  步数: {
    apiType: WEARABLE_DATA_TYPES.steps,
    label: '步数',
    unit: '步',
    parseValue: raw => (raw > 0 ? Math.round(raw) : null),
    getLevelLabel: (value, highLowLabel, options) => {
      const label = highLowLabel?.trim();
      if (label) return label;
      return getGoalStatusLabel(value, options?.stepGoals ?? 10000);
    },
  },
};

const ENERGY_WEARABLE_CONFIG: WearableDetailConfig = {
  apiType: WEARABLE_DATA_TYPES.activeEnergy,
  label: '消耗',
  unit: '千卡',
  parseValue: raw => (raw > 0 ? Math.round(raw) : null),
  getLevelLabel: (value, highLowLabel) => {
    const label = highLowLabel?.trim();
    if (label) return label;
    return '正常';
  },
};

/** 达标 / 未达标（未达标用棕色 #EE9C44） */
function getGoalStatusLabel(value: number, goal?: number) {
  if (goal == null || goal <= 0) return '正常';
  if (value <= 0) return '未达标';
  return value >= goal ? '达标' : '未达标';
}

function getEnergyGoalLevelLabel(value: number, energyGoals?: number) {
  return getGoalStatusLabel(value, energyGoals);
}

function sumEnergyFromWearableItem(
  data: WearableDataItem | undefined,
  field: 'activeEnergyBurned' | 'basalEnergyBurned',
) {
  if (!data) return 0;

  const readings = flattenWearableOriginalData(data.originalData);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => {
      const value = Number(reading.value);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    if (total > 0) return Math.round(total);
  }

  return Math.round(Number(data[field] ?? 0));
}

function buildEnergyAggregateRecord(
  key: string,
  label: string,
  value: number,
  selectedDate: string,
  timeText: string,
  energyGoals: number | undefined,
  useGoalLabel = false,
  sourceName?: string,
): WearableReadingRecord {
  const recordTime = formatWearableItemTimeText(timeText, selectedDate);
  return {
    key,
    label,
    time: /^\d{2}:\d{2}/.test(timeText) ? timeText.slice(0, 5) : '--',
    recordTime,
    startTime: recordTime,
    endTime: recordTime,
    value,
    level: useGoalLabel ? getEnergyGoalLevelLabel(value, energyGoals) : '正常',
    sourceName,
  };
}

function buildEnergyWearableRecords(
  activeData: WearableDataItem | undefined,
  basalData: WearableDataItem | undefined,
  selectedDate: string,
  energyGoals?: number,
): WearableReadingRecord[] {
  const activeRecords = buildWearableRecords(activeData?.originalData, ENERGY_WEARABLE_CONFIG).map(record => ({
    ...record,
    key: `active-${record.key}`,
    label: '活动消耗',
  }));
  const basalRecords = buildWearableRecords(basalData?.originalData, ENERGY_WEARABLE_CONFIG).map(record => ({
    ...record,
    key: `basal-${record.key}`,
    label: '静息消耗',
  }));

  const detailRecords = [...activeRecords, ...basalRecords].sort((a, b) =>
    b.recordTime.localeCompare(a.recordTime),
  );
  if (detailRecords.length > 0) return detailRecords;

  const active = sumEnergyFromWearableItem(activeData, 'activeEnergyBurned');
  const basal = sumEnergyFromWearableItem(basalData, 'basalEnergyBurned');
  const timeText =
    activeData?.endTimeStr ??
    activeData?.startTimeStr ??
    basalData?.endTimeStr ??
    basalData?.startTimeStr ??
    '--';

  // 无明细时：同时有活动+静息才拆成列表项（总览在上方总卡片）
  if (active > 0 && basal > 0) {
    return [
      buildEnergyAggregateRecord(
        'active-energy-total',
        '活动消耗',
        active,
        selectedDate,
        timeText,
        energyGoals,
        false,
      ),
      buildEnergyAggregateRecord(
        'basal-energy-total',
        '静息消耗',
        basal,
        selectedDate,
        timeText,
        energyGoals,
        false,
      ),
    ];
  }

  return [];
}

function buildEnergyGoalSummary(
  activeData: WearableDataItem | undefined,
  basalData: WearableDataItem | undefined,
  energyGoals?: number,
): AllDataGoalSummaryCardData | null {
  const active = sumEnergyFromWearableItem(activeData, 'activeEnergyBurned');
  const basal = sumEnergyFromWearableItem(basalData, 'basalEnergyBurned');
  const timeText =
    activeData?.endTimeStr ??
    activeData?.startTimeStr ??
    basalData?.endTimeStr ??
    basalData?.startTimeStr ??
    '--';
  return buildEnergyGoalSummaryCardData({
    total: active + basal,
    active,
    basal,
    goal: energyGoals,
    timeText,
  });
}

function getSleepMinutesFromItem(data?: WearableDataItem) {
  return getSleepDurationMinutes(data) ?? 0;
}

function buildSleepWearableRecordsFromItem(
  data: WearableDataItem | undefined,
  selectedDate: string,
): WearableReadingRecord[] {
  const minutes = getSleepMinutesFromItem(data);
  if (minutes <= 0) return [];

  const timeText = data?.bedTimeStr ?? data?.startTimeStr ?? data?.endTimeStr ?? '--';
  const startTime = formatWearableItemTimeText(data?.startTimeStr ?? data?.bedTimeStr, selectedDate);
  const endTime = formatWearableItemTimeText(data?.endTimeStr ?? data?.wakeUpTimeStr, selectedDate);
  const recordTime = startTime !== '--' ? startTime : endTime;
  const quality = getSleepQuality(data);
  const sourceName = flattenWearableOriginalData(data?.originalData)[0]?.sourceName;

  return [{
    key: 'sleep-total',
    label: '睡眠',
    time: /T(\d{2}:\d{2})/.test(timeText)
      ? timeText.match(/T(\d{2}:\d{2})/)?.[1] ?? '--'
      : /^\d{2}:\d{2}/.test(timeText)
        ? timeText.slice(0, 5)
        : '--',
    recordTime,
    startTime,
    endTime,
    value: Math.round((minutes / 60) * 10) / 10,
    level: quality.label || '正常',
    sourceName,
  }];
}

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
  options?: WearableDetailOptions,
  parentWearableDataId?: string | number,
): WearableReadingRecord[] {
  const records: WearableReadingRecord[] = [];
  const parentId = parentWearableDataId != null && String(parentWearableDataId).trim()
    ? String(parentWearableDataId)
    : undefined;

  for (const [index, reading] of flattenWearableOriginalData(originalData).entries()) {
    const raw = Number(reading.value);
    if (!Number.isFinite(raw)) continue;
    const value = config.parseValue(raw);
    if (value == null) continue;
    const startTime = formatWearableReadingDateTime(reading.startDate);
    const endTime = formatWearableReadingDateTime(reading.endDate);
    const ts = moment(reading.startDate ?? reading.endDate);
    const recordTime = startTime !== '--' ? startTime : endTime;
    const originalDataId = reading.id != null && String(reading.id).trim()
      ? String(reading.id)
      : undefined;
    records.push({
      key: originalDataId ?? `${reading.startDate ?? reading.endDate ?? index}-${index}`,
      time: ts.isValid() ? ts.format('HH:mm') : '--',
      recordTime,
      startTime,
      endTime,
      value,
      level: config.getLevelLabel(value, reading.highLowLabel, options),
      sourceName: reading.sourceName,
      wearableDataId: parentId,
      originalDataId,
    });
  }

  return records.sort((a, b) => b.recordTime.localeCompare(a.recordTime));
}

function resolveStepsDayTotal(
  data: WearableDataItem | undefined,
  detailRecords: WearableReadingRecord[],
) {
  const stepCount = Math.round(Number(data?.stepCount ?? 0));
  if (stepCount > 0) return stepCount;
  if (!detailRecords.length) return 0;
  return Math.round(detailRecords.reduce((sum, record) => sum + record.value, 0));
}

function buildWearableRecordsFromItem(
  data: WearableDataItem | undefined,
  config: WearableDetailConfig,
  selectedDate: string,
  options?: WearableDetailOptions,
): WearableReadingRecord[] {
  const records = buildWearableRecords(data?.originalData, config, options, data?.wearableDataId);
  if (config.apiType !== WEARABLE_DATA_TYPES.steps) {
    return records;
  }

  // 步数明细仅返回分段记录；日总计在上方总卡片
  if (records.length > 0) return records;

  // 无分段时不在列表里重复总步数
  return [];
}

function buildStepsGoalSummary(
  data: WearableDataItem | undefined,
  detailRecords: WearableReadingRecord[],
  stepGoals?: number,
): AllDataGoalSummaryCardData | null {
  const steps = resolveStepsDayTotal(data, detailRecords);
  const timeText = data?.endTimeStr ?? data?.startTimeStr ?? '--';
  return buildStepsGoalSummaryCardData({
    steps,
    goal: stepGoals,
    timeText,
  });
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
        <Flex justify="between">
          <Text style={styles.mapTime}>{item.dataTime || '--'}</Text>
          {type !== '血脂' ? (
            <Flex style={[styles.mapValueBox, { backgroundColor: getLevelBgColor(levelLabel) }]}>
              <Text style={[styles.mapValue, { color: levelColor }]}>{levelLabel}</Text>
            </Flex>
          ) : null}
        </Flex>
        <Flex justify="between" align="center" style={styles.mapItemMain}>
          {type === '血脂' ? (
            <View style={styles.mapItemLeft}>
              {LIPID_METRIC_ROWS.map(row => {
                const raw = Number(row.getValue(item));
                const hasValue = Number.isFinite(raw);
                const statusLabel = hasValue ? getBloodLipidStatusLabel(row.metricKey, raw) : '';
                return (
                  <Flex key={row.key} justify="between" align="center" style={styles.lipidMetricRow}>
                    <Text style={styles.lipidMetricLabel}>{row.label}</Text>
                    <Flex align="center" justify="end" style={styles.lipidMetricRight}>
                      <Flex align="baseline" justify="end">
                        <Text style={styles.lipidMetricValue}>{formatLipidValue(row.getValue(item))}</Text>
                        <Text style={styles.lipidMetricUnit}>{MEASURE_UNITS[type]}</Text>
                      </Flex>
                      <View style={styles.lipidMetricStatusWrap}>
                        {statusLabel ? (
                          <Text
                            style={[
                              styles.lipidMetricStatus,
                              {
                                color: getLevelColor(statusLabel),
                                borderColor: getLevelColor(statusLabel),
                              },
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        ) : null}
                      </View>
                    </Flex>
                  </Flex>
                );
              })}
              {item.remark ? (
                <Text style={styles.mapItemBz} numberOfLines={2} ellipsizeMode="tail">
                  {item.remark}
                </Text>
              ) : null}
            </View>
          ) : (
            <>
              <View style={styles.mapItemLeft}>
                <Text style={styles.mapItemText}>{type}</Text>
                {item.remark ? (
                  <Text style={styles.mapItemBz} numberOfLines={2} ellipsizeMode="tail">
                    {item.remark}
                  </Text>
                ) : null}
              </View>
              <Flex align="baseline" style={styles.mapItemRight}>
                <Text style={styles.mapItemValue}>{formatMeasureValue(item, type)}</Text>
                <Text style={styles.mapItemUnit}>{MEASURE_UNITS[type]}</Text>
              </Flex>
            </>
          )}
        </Flex>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.expandBtn, expanded && styles.expandBtnExpanded]}
        onPress={onToggle}>
        <Image
          style={styles.expandIcon}
          source={
            expanded
              ? require('@/assets/images/vitals/icon_sq.png')
              : require('@/assets/images/vitals/icon_zk.png')
          }
        />
      </TouchableOpacity>

      {expanded && <View style={styles.rowLine} />}
      {expanded ? (
        <View style={styles.expandDetail}>
          <Flex justify="between">
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
  showLevel = true,
  inSwipe = false,
}: {
  item: WearableReadingRecord;
  label: string;
  unit: string;
  expanded: boolean;
  onToggle: () => void;
  showLevel?: boolean;
  inSwipe?: boolean;
}) {
  const levelColor = getLevelColor(item.level);

  return (
    <View style={[styles.mapBox, inSwipe && styles.mapBoxInSwipe]}>
      <Flex justify="between">
        <Text style={styles.mapTime}>{item.time}</Text>
        {showLevel ? (
          <Flex style={[styles.mapValueBox, { backgroundColor: getLevelBgColor(item.level) }]}>
            <Text style={[styles.mapValue, { color: levelColor }]}>{item.level}</Text>
          </Flex>
        ) : null}
      </Flex>
      <Flex justify="between" align="center" style={styles.mapItemMain}>
        <View style={styles.mapItemLeft}>
          <Text style={styles.mapItemText}>{item.label ?? label}</Text>
        </View>
        <Flex align="baseline" style={styles.mapItemRight}>
          <Text style={styles.mapItemValue}>{item.value}</Text>
          <Text style={styles.mapItemUnit}>{unit}</Text>
        </Flex>
      </Flex>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.expandBtn, expanded && styles.expandBtnExpanded]}
        onPress={onToggle}>
        <Image
          style={styles.expandIcon}
          source={
            expanded
              ? require('@/assets/images/vitals/icon_sq.png')
              : require('@/assets/images/vitals/icon_zk.png')
          }
        />
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.expandDetail}>
          <View style={styles.rowLine} />
          <Flex justify="between">
            <View>
              <Text style={styles.mapLeftText}>记录时间</Text>
              <Text style={styles.mapLeftText}>开始时间</Text>
              <Text style={styles.mapLeftText}>结束时间</Text>
              <Text style={styles.mapLeftText}>数据来源</Text>
            </View>
            <View>
              <Text style={styles.mapRightText}>{item.recordTime}</Text>
              <Text style={styles.mapRightText}>{item.startTime}</Text>
              <Text style={styles.mapRightText}>{item.endTime}</Text>
              <Text style={styles.mapRightText}>{getDataSourceLabel(item.sourceName, '--')}</Text>
            </View>
          </Flex>
        </View>
      ) : null}
    </View>
  );
}


function SleepRecordCard({ item, sleepGoalHours }: { item?: WearableDataItem; sleepGoalHours: number }) {
  const cardData = buildAllDataSleepCardData(item);
  const goalProgress = buildSleepGoalProgress(item, sleepGoalHours);
  const [stageSelection, setStageSelection] = useState<SleepStageSelection | null>(null);
  const currentLabel = useMemo(
    () => getSleepDetailHeaderSummary(item ? [item] : [], 'today').currentLabel,
    [item],
  );
  const nightSleepTitle = stageSelection?.stageLabel ?? '夜间睡眠';
  const nightSleepDuration = stageSelection?.durationText ?? cardData?.duration ?? '--';

  const handleStageChange = useCallback((selection: SleepStageSelection | null) => {
    setStageSelection(selection);
  }, []);

  if (!cardData) return null;

  return (
    <View>
      <Flex style={styles.sleepSummaryRow}>
        <View style={[styles.sleepSummaryCard, styles.sleepSummaryCardFlex]}>
          <Text style={styles.sleepSummaryTitle}>睡眠时长</Text>
          <Text style={styles.sleepSummaryValue}>{cardData.duration}</Text>
        </View>
        <View style={[styles.sleepSummaryCard, styles.sleepSummaryCardFlex, styles.sleepSummaryCardGap]}>
          <Text style={styles.sleepSummaryTitle}>睡眠区间</Text>
          <Text style={styles.sleepSummaryValue}>{cardData.timeRange}</Text>
        </View>
      </Flex>

      <View style={styles.sleepStageCard}>
        <Text style={detailStyles.rowTitle}>{nightSleepTitle}</Text>
        <Text style={detailStyles.rowLeftValue}>{nightSleepDuration}</Text>
        <Flex justify="between">
          <Text style={detailStyles.rowTitle}>建议时长：7-9小时</Text>
          <Flex style={detailStyles.dayBox}>
            <Text style={detailStyles.dayText}>{currentLabel}</Text>
          </Flex>
        </Flex>
        {goalProgress ? (
          <Flex style={detailStyles.mbBox} justify="center">
            <Flex style={[detailStyles.mbBoxContent, { borderColor: goalProgress.borderColor }]}>
              <Text style={[detailStyles.mbBoxText, { color: goalProgress.statusColor }]}>
                {goalProgress.statusLabel}
              </Text>
            </Flex>
            <Text style={detailStyles.mbBoxMessage}>{goalProgress.message}</Text>
          </Flex>
        ) : null}
        <View style={styles.sleepStageChartWrap}>
          <SleepStageDetailChart item={item} onStageChange={handleStageChange} />
        </View>
      </View>

      {cardData.stages.length > 0 ? (
        <View style={styles.sleepStageCard}>
          <Flex justify="between" align="center" style={styles.sleepStageHeader}>
            <Flex align="center">
              <Image
                style={styles.sleepStageHeaderIcon}
                source={require('@/assets/images/vitals/icon_sleep.png')}
              />
              <Text style={styles.sleepStageHeaderTitle}>睡眠状态</Text>
            </Flex>

            {cardData.statusLabel && cardData.statusLabel !== '--' ? (
              <View
                style={[
                  styles.sleepStageStatusBadge,
                  { borderColor: cardData.statusColor },
                ]}
              >
                <Text style={[styles.sleepStageStatusText, { color: cardData.statusColor }]}>
                  {cardData.statusLabel}
                </Text>
              </View>
            ) : null}
          </Flex>

          <Flex style={{ marginTop: 21 }} align="end">
            <Text style={styles.sleepStageDurationValue}>{cardData.scoreText}</Text>
            <Text style={styles.sleepStageDurationUnit}>分</Text>
          </Flex>
          <View style={styles.lineBox} />
          <Flex style={styles.sleepAnalysisBody}>
            <View style={styles.sleepPieWrap}>
              <SleepPieChart
                data={cardData.pieSegments}
                size={90}
                ringWidth={12}
                showCenterLabel
              />
              <View style={styles.sleepPieCenterLabelWrap} pointerEvents="none">
                <Text style={styles.sleepPieCenterLabel}>睡眠{'\n'}分布</Text>
              </View>
            </View>
            <View style={styles.sleepAnalysisLegend}>
              {cardData.stages.map((stage, index) => (
                <Flex key={stage.key} style={[styles.sleepAnalysisLegendRow, index == 0 && { marginTop: 0 }]}>
                  <Flex style={styles.sleepAnalysisLegendLabel}>
                    <View style={[styles.sleepStageDot, { backgroundColor: stage.color }]} />
                    <Text style={styles.sleepAnalysisLegendLabelText}>{stage.label}</Text>
                  </Flex>
                  <Text style={styles.sleepAnalysisLegendValue}>{stage.duration}</Text>
                </Flex>
              ))}
            </View>
          </Flex>
        </View>
      ) : null}
    </View>
  );
}

function GoalSummaryCard({ data }: { data: AllDataGoalSummaryCardData }) {
  const isSteps = data.variant === 'steps';

  return (
    <View style={styles.mapBox}>
      <Flex justify="between" align="center">
        <Flex align="center">
          <Image source={data.icon} style={styles.mapIcon} />
          <Text style={[styles.mapTime, styles.goalTitle]}>{data.title}</Text>
        </Flex>
        {data.statusLabel && data.statusLabel !== '--' ? (
          <View style={[styles.goalStatusBadge, { borderColor: data.statusColor }]}>
            <Text style={[styles.goalStatusText, { color: data.statusColor }]}>{data.statusLabel}</Text>
          </View>
        ) : null}
      </Flex>

      {isSteps ? (
        <View style={styles.stepsBody}>
          <Flex justify="between" align="baseline">
            <Text style={styles.stepsMetricLabel}>{data.metricLabel}</Text>
            <Flex align="baseline">
              <Text style={styles.stepsMetricValue}>{data.valueText}</Text>
              <Text style={styles.stepsMetricUnit}>{data.unit}</Text>
            </Flex>
          </Flex>
          {data.goalLabel && data.goalValueText ? (
            <Flex justify="between" align="center" style={styles.stepsGoalRow}>
              <Text style={styles.goalRowLabel}>{data.goalLabel}</Text>
              <Text style={styles.goalRowValue}>{data.goalValueText}</Text>
            </Flex>
          ) : null}
          {data.progressPercent != null ? (
            <View style={styles.goalRowTrack}>
              <View
                style={[
                  styles.goalRowFill,
                  {
                    width: `${data.progressPercent}%`,
                    backgroundColor: data.progressColor ?? data.statusColor,
                  },
                ]}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <Flex style={styles.goalBody}>
          <View style={styles.goalLeft}>
            <Text style={styles.goalMetricLabel}>{data.metricLabel}</Text>
            <Text style={styles.goalMetricValue}>{data.valueText}</Text>
            <Text style={styles.goalMetricUnit}>{data.unit}</Text>
          </View>
          {data.rows.length > 0 ? (
            <View style={styles.goalRight}>
              {data.rows.map((row, index) => (
                <View key={row.key} style={index > 0 ? styles.goalRowSpaced : undefined}>
                  <Flex justify="between" align="center">
                    <Text style={styles.goalRowLabel}>{row.label}</Text>
                    <Text style={styles.goalRowValue}>{row.valueText}</Text>
                  </Flex>
                  <View style={styles.goalRowTrack}>
                    <View
                      style={[
                        styles.goalRowFill,
                        {
                          width: `${row.percent}%`,
                          backgroundColor: row.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </Flex>
      )}
    </View>
  );
}
export default function AllDataPage({ route }: Props) {
  const measureType = (route.params?.type ?? '血压') as VitalsMeasureType;
  const userGender = useSelector((state: RootState) => state.user.info?.gender);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const storeStepGoal = userExtr?.stepGoals;
  const storeEnergyGoal = userExtr?.energyGoals;
  const sleepGoalHours = useMemo(() => resolveStoreSleepGoal(userExtr?.sleepGoals), [userExtr?.sleepGoals]);
  const isEnergyType = measureType === '消耗';
  const isSleepType = measureType === '睡眠';
  const isGoalSummaryType = isEnergyType || measureType === '步数';
  const canDeleteWearableRecord = measureType === '心率' || measureType === '血氧';
  const showFilterButton = measureType === '血氧' || measureType === '心率';
  const wearableConfig = WEARABLE_DETAIL_CONFIG[measureType as '血氧' | '心率' | '步数'];
  const isWearableType = Boolean(wearableConfig) || isEnergyType || isSleepType;
  const showAddButton = !isWearableType;
  const navigation = useNavigation<Nav>();
  const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [records, setRecords] = useState<MeasureDataItem[]>([]);
  const [wearableRecords, setWearableRecords] = useState<WearableReadingRecord[]>([]);
  const [sleepRecord, setSleepRecord] = useState<WearableDataItem | undefined>();
  const [goalSummary, setGoalSummary] = useState<AllDataGoalSummaryCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(WEARABLE_STATUS_FILTER_ALL);
  const [uploadMap, setUploadMap] = useState<VitalsUploadMap>({});
  const loadedUploadYearsRef = useRef<Set<number>>(new Set());
  const loadingUploadYearsRef = useRef<Set<number>>(new Set());
  const weekDays = useMemo(() => buildAllDataWeekDays(selectedDate), [selectedDate]);
  const uploadMarker = useMemo(() => resolveVitalsUploadMarker(measureType), [measureType]);
  const monthLabel = useMemo(
    () => moment(selectedDate, 'YYYY-MM-DD').format('YYYY年M月'),
    [selectedDate],
  );

  const filteredWearableRecords = useMemo(
    () => (showFilterButton ? filterWearableRecordsByStatus(wearableRecords, statusFilter) : wearableRecords),
    [showFilterButton, statusFilter, wearableRecords],
  );

  const filterPickerData = useMemo(
    () => (showFilterButton
      ? buildWearableStatusFilterPickerData(measureType as '血氧' | '心率', wearableRecords)
      : []),
    [measureType, showFilterButton, wearableRecords],
  );

  useEffect(() => {
    setStatusFilter(WEARABLE_STATUS_FILTER_ALL);
  }, [measureType, selectedDate]);

  const ensureUploadYearLoaded = useCallback(async (year: number) => {
    const currentYear = moment().year();
    if (!Number.isFinite(year) || year > currentYear) return;
    if (loadedUploadYearsRef.current.has(year) || loadingUploadYearsRef.current.has(year)) return;

    loadingUploadYearsRef.current.add(year);
    try {
      const nextMap = await loadVitalsUploadMapByYear(uploadMarker, year);
      if (nextMap) {
        loadedUploadYearsRef.current.add(year);
        setUploadMap(prev => ({ ...prev, ...nextMap }));
      }
    } finally {
      loadingUploadYearsRef.current.delete(year);
    }
  }, [uploadMarker]);

  // 切换指标类型时重置上传标记缓存
  useEffect(() => {
    loadedUploadYearsRef.current = new Set();
    loadingUploadYearsRef.current = new Set();
    setUploadMap({});
    const currentYear = moment().year();
    const selectedYear = moment(selectedDate, 'YYYY-MM-DD').year();
    void ensureUploadYearLoaded(currentYear);
    if (selectedYear < currentYear) {
      void ensureUploadYearLoaded(selectedYear);
    }
  }, [ensureUploadYearLoaded, measureType]);

  // 周切换 / 选中日跨年时懒加载
  useEffect(() => {
    const years = new Set<number>();
    years.add(moment(selectedDate, 'YYYY-MM-DD').year());
    weekDays.forEach(day => years.add(moment(day.key, 'YYYY-MM-DD').year()));
    years.forEach(year => {
      void ensureUploadYearLoaded(year);
    });
  }, [ensureUploadYearLoaded, selectedDate, weekDays]);

  const goToday = useCallback(() => {
    setSelectedDate(moment().format('YYYY-MM-DD'));
  }, []);

  const goPrevWeek = useCallback(() => {
    setSelectedDate(prev => moment(prev, 'YYYY-MM-DD').subtract(1, 'week').format('YYYY-MM-DD'));
  }, []);

  const goNextWeek = useCallback(() => {
    setSelectedDate(prev => moment(prev, 'YYYY-MM-DD').add(1, 'week').format('YYYY-MM-DD'));
  }, []);

  const onPressAdd = useCallback(() => {
    navigation.navigate('AddDataPage', { type: measureType as MeasureDataType });
  }, [measureType, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: PAGE_TITLES[measureType],
      headerRight: showFilterButton
        ? () => (
          <Picker
            data={filterPickerData}
            cols={1}
            value={[statusFilter]}
            onOk={values => {
              const next = String(values[0] ?? WEARABLE_STATUS_FILTER_ALL);
              setStatusFilter(next || WEARABLE_STATUS_FILTER_ALL);
            }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ marginRight: 16 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Image
                style={{ width: 24, height: 24 }}
                source={require('@/assets/images/vitals/icon_filtering.png')}
              />
            </TouchableOpacity>
          </Picker>
        )
        : undefined,
    });
  }, [filterPickerData, measureType, navigation, showFilterButton, statusFilter]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setExpandedKey(null);
    try {
      if (isEnergyType) {
        const [activeRes, basalRes] = await Promise.all([
          getWearableDataDetailByCustomerLocalDate({
            customerLocalDate: selectedDate,
            type: WEARABLE_DATA_TYPES.activeEnergy,
          }),
          getWearableDataDetailByCustomerLocalDate({
            customerLocalDate: selectedDate,
            type: WEARABLE_DATA_TYPES.basalEnergy,
          }),
        ]);

        const activeData = isResourceApiOk(activeRes)
          ? apiResourceData<WearableDataItem>(activeRes as unknown as WearableDataDetailResult)
          : undefined;
        const basalData = isResourceApiOk(basalRes)
          ? apiResourceData<WearableDataItem>(basalRes as unknown as WearableDataDetailResult)
          : undefined;
        const energyGoalsRaw = activeData?.energyGoals ?? basalData?.energyGoals;
        const energyGoals = storeEnergyGoal != null
          ? resolveEnergyTarget(storeEnergyGoal)
          : energyGoalsRaw != null
            ? Number(energyGoalsRaw)
            : undefined;

        setGoalSummary(buildEnergyGoalSummary(activeData, basalData, energyGoals));
        setWearableRecords(buildEnergyWearableRecords(activeData, basalData, selectedDate, energyGoals));
        return;
      }

      if (isSleepType) {
        setGoalSummary(null);
        const res = (await getWearableDataDetailByCustomerLocalDate({
          customerLocalDate: selectedDate,
          type: WEARABLE_DATA_TYPES.sleep,
        })) as unknown as WearableDataDetailResult;
        if (!isResourceApiOk(res)) {
          setSleepRecord(undefined);
          setWearableRecords([]);
          return;
        }
        const data = apiResourceData<WearableDataItem>(res);
        setSleepRecord(data);
        setWearableRecords(buildSleepWearableRecordsFromItem(data, selectedDate));
        return;
      }

      if (wearableConfig) {
        const res = (await getWearableDataDetailByCustomerLocalDate({
          customerLocalDate: selectedDate,
          type: wearableConfig.apiType,
        })) as unknown as WearableDataDetailResult;
        if (!isResourceApiOk(res)) {
          setGoalSummary(null);
          setWearableRecords([]);
          return;
        }
        const data = apiResourceData<WearableDataItem>(res);
        const wearableOptions: WearableDetailOptions | undefined =
          measureType === '步数'
            ? {
              stepGoals: storeStepGoal != null
                ? resolveStepTarget(storeStepGoal)
                : data?.stepGoals != null
                  ? Number(data.stepGoals)
                  : undefined,
            }
            : undefined;
        const detailRecords = buildWearableRecordsFromItem(
          data,
          wearableConfig,
          selectedDate,
          wearableOptions,
        );
        setGoalSummary(
          measureType === '步数'
            ? buildStepsGoalSummary(data, detailRecords, wearableOptions?.stepGoals)
            : null,
        );
        setWearableRecords(detailRecords);
        return;
      }

      setGoalSummary(null);
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
      setSleepRecord(undefined);
      setGoalSummary(null);
    } finally {
      setLoading(false);
    }
  }, [isEnergyType, isSleepType, measureType, selectedDate, storeEnergyGoal, storeStepGoal, wearableConfig]);

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

  const handleDeleteWearableRecord = useCallback((record: WearableReadingRecord) => {
    if (!record.wearableDataId || !record.originalDataId) return;

    Alert.alert(
      '删除记录',
      `确定要删除这条${measureType}记录吗？删除后无法恢复`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = (await removeWearableOriginalDataById(
                record.wearableDataId!,
                record.originalDataId!,
              )) as unknown as {
                code?: number;
                msg?: string;
              };
              if (!isResourceApiOk(res)) {
                Alert.alert('删除失败', res?.msg || '请稍后重试');
                return;
              }
              setWearableRecords(prev => prev.filter(item => item.key !== record.key));
              setExpandedKey(prev => (prev === record.key ? null : prev));
            } catch {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ],
    );
  }, [measureType]);

  const handleScrollBegin = useCallback((_event: NativeSyntheticEvent<NativeScrollEvent>) => {
    closeActiveSwipeRow();
  }, []);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={showAddButton ? [] : undefined}>
      <ScrollView
        contentContainerStyle={[styles.body, showAddButton && styles.bodyWithBottomBar]}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={handleScrollBegin}>
        <View style={styles.calendarBox}>
          <Flex justify="between" align="center" style={styles.calendarHeader}>
            <TouchableOpacity activeOpacity={0.7} onPress={goToday} style={styles.calendarTodayBtn}>
              <Text style={styles.calendarTodayText}>回今天</Text>
            </TouchableOpacity>
            <Flex align="center" justify="center" style={styles.calendarMonthNav}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={goPrevWeek}
                style={styles.calendarArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Image
                  style={styles.calendarArrow}
                  source={require('@/assets/images/vitals/icon_left.png')}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setDatePickerVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={styles.calendarMonthText}>{monthLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={goNextWeek}
                style={styles.calendarArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Image
                  style={styles.calendarArrow}
                  source={require('@/assets/images/vitals/icon_right.png')}
                />
              </TouchableOpacity>
            </Flex>
            <View style={styles.calendarTodayBtn} />
          </Flex>
          <Flex justify="between" style={styles.calendarWeekRow}>
            {weekDays.map(item => {
              const isActive = item.key === selectedDate;
              const hasUpload = Boolean(uploadMap[item.key]);
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  style={[styles.calendarCol, isActive && styles.calendarColActive]}
                  onPress={() => setSelectedDate(item.key)}>
                  <Text style={isActive ? styles.calendarTitleActive : styles.calendarTitle}>
                    {item.label}
                  </Text>
                  <Text style={isActive ? styles.calendarSubtitleActive : styles.calendarSubtitle}>
                    {item.day}
                  </Text>
                  <View style={styles.calendarDotWrap}>
                    {hasUpload ? (
                      <View
                        style={[styles.calendarDot, { backgroundColor: uploadMarker.color }]}
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Flex>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : null}

        {!loading && (isSleepType
          ? !buildAllDataSleepCardData(sleepRecord)
          : isGoalSummaryType
            ? !goalSummary && wearableRecords.length === 0
            : isWearableType
              ? (showFilterButton ? filteredWearableRecords : wearableRecords).length === 0
              : records.length === 0) ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {showFilterButton
                && wearableRecords.length > 0
                && filteredWearableRecords.length === 0
                ? '暂无符合筛选的记录'
                : '暂无记录'}
            </Text>
          </View>
        ) : null}

        {isSleepType ? (
          <SleepRecordCard item={sleepRecord} sleepGoalHours={sleepGoalHours} />
        ) : isWearableType ? (
          <>
            {goalSummary ? <GoalSummaryCard data={goalSummary} /> : null}
            {(showFilterButton ? filteredWearableRecords : wearableRecords).map(item => {
              const card = (
                <WearableRecordCard
                  item={item}
                  label={item.label ?? wearableConfig?.label ?? ENERGY_WEARABLE_CONFIG.label}
                  unit={wearableConfig?.unit ?? ENERGY_WEARABLE_CONFIG.unit}
                  showLevel={!isGoalSummaryType}
                  expanded={expandedKey === item.key}
                  onToggle={() => setExpandedKey(prev => (prev === item.key ? null : item.key))}
                  inSwipe={canDeleteWearableRecord && Boolean(item.wearableDataId && item.originalDataId)}
                />
              );

              if (canDeleteWearableRecord && item.wearableDataId && item.originalDataId) {
                return (
                  <SwipeDeleteRow
                    key={item.key}
                    onDelete={() => handleDeleteWearableRecord(item)}
                    styleOverrides={SWIPE_STYLE_OVERRIDES}>
                    {card}
                  </SwipeDeleteRow>
                );
              }

              return <View key={item.key}>{card}</View>;
            })}
          </>
        ) : (
          records.map((item, index) => {
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
          })
        )}
      </ScrollView>

      <DietDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
        uploadMarker={uploadMarker}
      />

      {showAddButton ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.7} onPress={onPressAdd}>
            <Flex style={{ flex: 1 }}>
              <Image
                style={styles.primaryBtnIcon}
                source={require('@/assets/images/vitals/icon_add.png')}
              />
              <Text style={styles.primaryBtnText}>添加记录</Text>
            </Flex>
          </TouchableOpacity>
        </View>
      ) : null}
    </PageLayout>
  );
}
