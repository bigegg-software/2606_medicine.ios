import moment from 'moment';
import type {
  MeasureDataDayGroup,
  MeasureDataItem,
  MeasureDataStatisDayGroup,
  VitalKey,
  VitalsMeasureType,
} from '@/api/measureData';
import { VITAL_KEY_API_TYPE, VITAL_KEYS } from '@/api/measureData';
import type { WearableDataItem, WearableOriginalReading } from '@/api/wearableData';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import { TODAY_AXIS_LABELS } from '@/src/features/profile/components/chartAxis';
import type { SleepPieSegment } from '@/src/features/profile/components/SleepPieChart';
import { buildSleepStageTimeline } from '@/src/features/profile/components/sleepStageChartHelpers';
import { getLevelColor } from './vitalLevelColors';
import {
  formatBloodOxygenValueStatus,
  formatBodyTemperatureMeasureDisplay,
  formatHeartRateValueStatus,
} from './vitalsStatusDisplay';

export { getLevelColor, getLevelBgColor } from './vitalLevelColors';
export {
  formatBodyTemperatureMeasureDisplay as formatBodyTemperatureDisplay,
} from './vitalsStatusDisplay';

export { TODAY_AXIS_LABELS as TODAY_HOUR_LABELS };

export type VitalsRange = 'today' | '7Days' | '30Days';

export type WearableDetailRange = VitalsRange | 'week' | 'month' | '7days';

/** 7/30 天汇总不需要 originalData；今天不传，走后端默认 true */
export function getWearableReturnOriginalDataParam(range: WearableDetailRange) {
  return range === 'today' ? {} : { returnOriginalData: false as const };
}

export const VITALS_NAV_LIST: { label: string; value: VitalsRange }[] = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7Days' },
  { label: '近30天', value: '30Days' },
];

export { VITAL_KEYS, VITAL_KEY_API_TYPE };
export type { VitalKey };


export function getRangeDayCount(range: VitalsRange) {
  switch (range) {
    case 'today':
      return 1;
    case '7Days':
      return 7;
    case '30Days':
      return 30;
    default:
      return 1;
  }
}

export function getChartLabels(range: VitalsRange): string[] {
  switch (range) {
    case 'today':
      return TODAY_AXIS_LABELS;
    case '7Days':
    case '30Days': {
      const dayCount = getRangeDayCount(range);
      return Array.from({ length: dayCount }, (_, index) =>
        moment()
          .subtract(dayCount - 1 - index, 'days')
          .format('M/D'),
      );
    }
    default:
      return TODAY_AXIS_LABELS;
  }
}

export function mapTimeToTodayChartX(hour: number, minute = 0) {
  const totalMinutes = hour * 60 + minute;
  return (totalMinutes / (24 * 60)) * (TODAY_AXIS_LABELS.length - 1);
}

function getBucketDay(range: VitalsRange, labelIndex: number, labelCount: number) {
  return moment()
    .subtract(labelCount - 1 - labelIndex, 'days')
    .startOf('day');
}

export function getDateRange(range: VitalsRange) {
  const endDate = moment().format('YYYY-MM-DD');
  const startDate =
    range === 'today'
      ? endDate
      : range === '7Days'
        ? moment().subtract(6, 'days').format('YYYY-MM-DD')
        : moment().subtract(29, 'days').format('YYYY-MM-DD');
  return { startDate, endDate };
}

/** 睡眠查询需包含昨日，否则「今日」看不到昨夜数据 */
export function getSleepFetchDateRange(range: VitalsRange) {
  const { startDate, endDate } = getDateRange(range);
  if (range === 'today') {
    return {
      startDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
      endDate,
    };
  }
  return { startDate, endDate };
}

export type LabeledValue = { label: string; value: number; x?: number };

export type GlucoseStatus = 'low' | 'normal' | 'high';

export type BloodGlucoseChartPoint = {
  hour: string;
  value: number;
  x?: number;
  status?: GlucoseStatus;
  isHigh?: number;
  isLow?: number;
};

export function buildGlucoseStatus(
  _value: number,
  item?: Pick<MeasureDataItem, 'isHigh' | 'isLow' | 'level'>,
): GlucoseStatus {
  const level = item?.level?.split(',')[0]?.trim();
  if (level) {
    if (/偏低|低血糖/.test(level)) return 'low';
    if (/正常|理想/.test(level)) return 'normal';
    return 'high';
  }
  if (item?.isLow === 1) return 'low';
  if (item?.isHigh === 1) return 'high';
  return 'normal';
}

export function flattenMeasureItems(groups?: MeasureDataDayGroup[] | MeasureDataItem[] | null): MeasureDataItem[] {
  if (!groups?.length) return [];

  const items = groups.flatMap(entry => {
    if (entry == null || typeof entry !== 'object') return [] as MeasureDataItem[];

    const record = entry as MeasureDataDayGroup & MeasureDataItem;
    if (Array.isArray(record.childList)) {
      return record.childList.map(item => ({
        ...item,
        customerLocalDate:
          item.customerLocalDate?.trim() || record.customerLocalDate?.trim() || item.customerLocalDate,
      }));
    }

    if (record.val != null || record.val2 != null || record.id != null || record.dataTime) {
      return [record as MeasureDataItem];
    }

    return [] as MeasureDataItem[];
  });

  return items.sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf());
}

export function normalizeMeasureRangeData(raw: unknown): MeasureDataDayGroup[] | MeasureDataItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.childList)) {
      return [raw as MeasureDataDayGroup];
    }
    if (Array.isArray(record.list)) {
      return record.list as MeasureDataItem[];
    }
    if (Array.isArray(record.rows)) {
      return record.rows as MeasureDataItem[];
    }
  }
  return [];
}


function parseMeasureNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseMeasureDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  const parsed = moment(
    value,
    [
      moment.ISO_8601,
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'YYYY/MM/DD HH:mm:ss',
      'YYYY/MM/DD HH:mm',
      'YYYY/MM/DD',
    ],
    true,
  );
  return parsed.isValid() ? parsed : null;
}

function getItemTimestamp(item: MeasureDataItem) {
  const parsedDate = parseMeasureDate(item.customerLocalDate);
  const base = parsedDate ? parsedDate.clone().startOf('day') : moment().startOf('day');
  const time = item.dataTime?.trim();
  if (!time) return base;

  const parsedTime = moment(time, ['HH:mm:ss', 'HH:mm', 'H:mm'], true);
  if (parsedTime.isValid()) {
    return base.hour(parsedTime.hour()).minute(parsedTime.minute()).second(parsedTime.second());
  }
  return base;
}

function getMeasureItemDay(item: MeasureDataItem) {
  return getItemTimestamp(item).clone().startOf('day');
}

function getLatestItem(items: MeasureDataItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

function getLatestItemForRange(items: MeasureDataItem[], range: VitalsRange) {
  const rangedItems = filterMeasureItemsInRange(items, range);
  if (range === 'today') {
    return getLatestItem(rangedItems);
  }
  return getLatestItem(rangedItems);
}

function pickBucketItems(items: MeasureDataItem[], range: VitalsRange, labelIndex: number, labelCount: number) {
  if (range === 'today') {
    return [];
  }
  const day = getBucketDay(range, labelIndex, labelCount);
  return items.filter(item => getMeasureItemDay(item).isSame(day, 'day'));
}

export function filterMeasureItemsInRange(items: MeasureDataItem[], range: VitalsRange) {
  if (range === 'today') {
    return items;
  }
  const { startDate, endDate } = getDateRange(range);
  const start = moment(startDate, 'YYYY-MM-DD', true).startOf('day');
  const end = moment(endDate, 'YYYY-MM-DD', true).endOf('day');
  return items.filter(item => getMeasureItemDay(item).isBetween(start, end, 'day', '[]'));
}

export function buildSingleValueSeries(items: MeasureDataItem[], range: VitalsRange): LabeledValue[] {
  const rangedItems = filterMeasureItemsInRange(items, range);
  if (range === 'today') {
    return rangedItems.map(item => {
      const ts = getItemTimestamp(item);
      return {
        label: ts.format('HH:mm'),
        value: parseMeasureNumber(item.val) ?? 0,
        x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
      };
    });
  }

  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickBucketItems(rangedItems, range, index, labels.length);
    const latest = getLatestItem(bucketItems);
    return { label, value: parseMeasureNumber(latest?.val) ?? 0 };
  });
}

/** 血脂卡片图：用总胆固醇 TC（xuezhiTc / val） */
export function buildBloodLipidTcSeries(items: MeasureDataItem[], range: VitalsRange): LabeledValue[] {
  const rangedItems = filterMeasureItemsInRange(items, range);
  if (range === 'today') {
    return rangedItems.map(item => {
      const ts = getItemTimestamp(item);
      return {
        label: ts.format('HH:mm'),
        value: parseMeasureNumber(item.xuezhiTc ?? item.val) ?? 0,
        x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
      };
    });
  }

  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickBucketItems(rangedItems, range, index, labels.length);
    const latest = getLatestItem(bucketItems);
    return { label, value: parseMeasureNumber(latest?.xuezhiTc ?? latest?.val) ?? 0 };
  });
}

export function getBloodLipidTcPointColor(value: number) {
  return getLevelColor(getTotalCholesterolStatusLabel(value));
}

export function buildBloodGlucoseSeriesFromItems(
  items: MeasureDataItem[],
  range: VitalsRange,
): BloodGlucoseChartPoint[] {
  const rangedItems = filterMeasureItemsInRange(items, range);
  if (range === 'today') {
    return rangedItems.map(item => {
      const ts = getItemTimestamp(item);
      const value = parseMeasureNumber(item.val) ?? 0;
      return {
        hour: ts.format('HH:mm'),
        value,
        x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
        status: buildGlucoseStatus(value, item),
        isHigh: item.isHigh,
        isLow: item.isLow,
      };
    });
  }

  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickBucketItems(rangedItems, range, index, labels.length);
    const latest = getLatestItem(bucketItems);
    const value = parseMeasureNumber(latest?.val) ?? 0;
    return {
      hour: label,
      value,
      status: buildGlucoseStatus(value, latest),
      isHigh: latest?.isHigh,
      isLow: latest?.isLow,
    };
  });
}

export function buildBloodPressureSeriesFromItems(items: MeasureDataItem[], range: VitalsRange): BloodPressurePoint[] {
  const rangedItems = filterMeasureItemsInRange(items, range);
  if (range === 'today') {
    return rangedItems.map(item => {
      const ts = getItemTimestamp(item);
      return {
        high: Math.round(parseMeasureNumber(item.val) ?? 0),
        low: Math.round(parseMeasureNumber(item.val2) ?? 0),
        hour: ts.format('HH:mm'),
        x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
      };
    });
  }

  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickBucketItems(rangedItems, range, index, labels.length);
    const latest = getLatestItem(bucketItems);
    return {
      high: Math.round(parseMeasureNumber(latest?.val) ?? 0),
      low: Math.round(parseMeasureNumber(latest?.val2) ?? 0),
      hour: label,
    };
  });
}

export function buildLabeledSeries(range: VitalsRange, base: number, spread = 3): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, i) => ({
    label,
    value: Math.round((base + Math.sin(i * 0.9) * spread) * 10) / 10,
  }));
}

export function buildBloodPressureSeries(range: VitalsRange): BloodPressurePoint[] {
  const labels = getChartLabels(range);
  return labels.map((_, i) => ({
    high: 138 + (i % 3) * 3,
    low: 86 + (i % 2) * 2,
  }));
}

export function toHourPoints(series: LabeledValue[]) {
  return series.map(({ label, value, x }) => ({ hour: label, value, x }));
}

export function getLevelLabel(item?: MeasureDataItem) {
  if (!item) return '';
  const level = item.level?.split(',')[0]?.trim();
  if (level) return level;
  if (item.isHigh === 1) return '偏高';
  if (item.isLow === 1) return '偏低';
  return '正常';
}

export function formatMeasureDisplay(item: MeasureDataItem | undefined, type: VitalsMeasureType) {
  if (!item) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  const levelLabel = getLevelLabel(item);
  let value = '--';

  if (type === '血压') {
    const high = parseMeasureNumber(item.val);
    const low = parseMeasureNumber(item.val2);
    value = high != null && low != null ? `${Math.round(high)}/${Math.round(low)}` : '--';
  } else {
    const parsed = parseMeasureNumber(item.val);
    if (parsed != null) {
      if (type === '心率' || type === '血氧') {
        value = String(Math.round(parsed));
      } else if (type === '体重') {
        value = parsed.toFixed(1);
      } else {
        value = String(parsed);
      }
    }
  }

  return {
    value,
    status: levelLabel ? `${levelLabel}` : '',
    statusColor: getLevelColor(levelLabel),
  };
}

export function formatBloodPressure(latest?: BloodPressurePoint) {
  const point = latest ?? { high: 142, low: 92 };
  const status = point.high >= 140 || point.low >= 90 ? '偏高' : '正常';
  const statusColor = getLevelColor(status);
  return {
    value: `${point.high}/${point.low}`,
    status: `${status}`,
    statusColor,
  };
}

export function formatBloodPressureFromItems(items: MeasureDataItem[], range: VitalsRange = 'today') {
  return formatMeasureDisplay(getLatestItemForRange(items, range), '血压');
}

export function formatSingleValueFromItems(
  items: MeasureDataItem[],
  type: VitalsMeasureType,
  range: VitalsRange = 'today',
) {
  const latest = getLatestItemForRange(items, range);
  if (type === '体温') {
    return formatBodyTemperatureMeasureDisplay(latest);
  }
  return formatMeasureDisplay(latest, type);
}

export function formatWeightFromItems(items: MeasureDataItem[], range: VitalsRange = 'today') {
  return formatMeasureDisplay(getLatestItemForRange(items, range), '体重');
}

export function isFemaleGender(gender?: string | null) {
  return gender === '女' || gender === '1';
}

export function getUricAcidReferenceLines(gender?: string | null) {
  if (isFemaleGender(gender)) {
    return { normalMin: 155, normalMax: 360, elevatedMax: 420 };
  }
  return { normalMin: 208, normalMax: 420, elevatedMax: 480 };
}

export function getUricAcidRange(gender?: string | null) {
  const { normalMin, normalMax } = getUricAcidReferenceLines(gender);
  return { min: normalMin, max: normalMax };
}

export function getUricAcidStatusLabel(value: number, gender?: string | null) {
  const { normalMin, normalMax, elevatedMax } = getUricAcidReferenceLines(gender);
  if (value > elevatedMax) return '异常偏高';
  if (value > normalMax) return '偏高';
  if (value < normalMin) return '偏低';
  return '正常';
}

export function formatUricAcidRecordTime(item?: MeasureDataItem) {
  if (!item) return '';
  const date = item.customerLocalDate?.trim();
  const time = item.dataTime?.trim();
  const status = item.measurementStatus?.trim();
  const datetime = date && time ? `${date} ${time}` : date || time || '';
  if (!datetime) return status ? `(${status})` : '';
  return status ? `${datetime}(${status})` : datetime;
}

export function formatUricAcidFromItems(
  items: MeasureDataItem[],
  range: VitalsRange = 'today',
  gender?: string | null,
) {
  const item = getLatestItemForRange(items, range);
  const val = parseMeasureNumber(item?.val);
  if (val == null) {
    return {
      value: '--',
      status: '',
      statusColor: '#999999',
      statusLabel: '',
      recordTime: '',
    };
  }

  const serverLabel = getLevelLabel(item);
  const label = serverLabel || getUricAcidStatusLabel(val, gender);
  return {
    value: String(Math.round(val)),
    status: label ? `・${label}` : '',
    statusColor: getLevelColor(label),
    statusLabel: label,
    recordTime: formatUricAcidRecordTime(item),
  };
}

export function getTotalCholesterolStatusLabel(value: number) {
  if (value < 5.2) return '正常';
  if (value < 6.2) return '偏高';
  return '异常偏高';
}

export function getTriglycerideStatusLabel(value: number) {
  if (value < 1.7) return '正常';
  if (value < 2.3) return '偏高';
  return '异常偏高';
}

export function getLdlCholesterolStatusLabel(value: number) {
  if (value < 3.4) return '正常';
  if (value < 4.1) return '偏高';
  return '异常偏高';
}

export function getHdlCholesterolStatusLabel(value: number) {
  if (value >= 1.0) return '正常';
  return '偏低';
}

export function formatBloodLipidsFromItems(items: MeasureDataItem[], range: VitalsRange = 'today') {
  const item = getLatestItemForRange(items, range);
  const tc = parseMeasureNumber(item?.xuezhiTc ?? item?.val);
  const tg = parseMeasureNumber(item?.xuezhiTg);
  const hdl = parseMeasureNumber(item?.xuezhiHdlC);
  const ldl = parseMeasureNumber(item?.xuezhiLdlC);

  if (tc == null && tg == null && hdl == null && ldl == null) {
    return {
      tcValue: '--',
      tgValue: '--',
      hdlValue: '--',
      ldlValue: '--',
      tcStatus: '',
      tgStatus: '',
      hdlStatus: '',
      ldlStatus: '',
      tcStatusColor: '#999999',
      tgStatusColor: '#999999',
      hdlStatusColor: '#999999',
      ldlStatusColor: '#999999',
      status: '',
      statusColor: '#999999',
    };
  }

  const tcStatus = tc != null ? getTotalCholesterolStatusLabel(tc) : '';
  const tgStatus = tg != null ? getTriglycerideStatusLabel(tg) : '';
  const hdlStatus = hdl != null ? getHdlCholesterolStatusLabel(hdl) : '';
  const ldlStatus = ldl != null ? getLdlCholesterolStatusLabel(ldl) : '';

  return {
    tcValue: tc != null ? tc.toFixed(2) : '--',
    tgValue: tg != null ? tg.toFixed(2) : '--',
    hdlValue: hdl != null ? hdl.toFixed(2) : '--',
    ldlValue: ldl != null ? ldl.toFixed(2) : '--',
    tcStatus,
    tgStatus,
    hdlStatus,
    ldlStatus,
    tcStatusColor: getLevelColor(tcStatus),
    tgStatusColor: getLevelColor(tgStatus),
    hdlStatusColor: getLevelColor(hdlStatus),
    ldlStatusColor: getLevelColor(ldlStatus),
    // 首页卡片不再展示总状态，排序占位保持空
    status: '',
    statusColor: '#999999',
  };
}

export const SLEEP_STAGE_CONFIG = [
  { key: 'awakeSleepTime' as const, name: '清醒', color: '#CFC9FF', stages: ['AWAKE'] },
  { key: 'remSleepTime' as const, name: '快速眼动', color: '#c4b5fd', stages: ['REM'] },
  { key: 'coreSleepTime' as const, name: '核心睡眠', color: '#8f85f5', stages: ['CORE', 'LIGHT', 'ASLEEP'] },
  { key: 'deepSleepTime' as const, name: '深度睡眠', color: '#542fc8', stages: ['DEEP'] },
];

const SLEEP_DURATION_STAGES = new Set(['ASLEEP', 'CORE', 'DEEP', 'REM']);

function readingDurationMinutes(reading: WearableOriginalReading) {
  const start = reading.startDate ? moment(reading.startDate) : null;
  const end = reading.endDate ? moment(reading.endDate) : null;
  if (!start?.isValid() || !end?.isValid()) return 0;
  return Math.max(0, end.diff(start, 'minutes'));
}

function sumSleepMinutesFromOriginalData(readings: WearableOriginalReading[]) {
  if (!readings.length) return null;

  let stageTotal = 0;
  let hasStage = false;

  for (const reading of readings) {
    const stage = String(reading.value ?? '').toUpperCase();
    const minutes = readingDurationMinutes(reading);
    if (minutes <= 0) continue;

    if (stage && SLEEP_DURATION_STAGES.has(stage)) {
      stageTotal += minutes;
      hasStage = true;
    }
  }

  if (hasStage) return Math.round(stageTotal);

  let durationTotal = 0;
  for (const reading of readings) {
    const stage = String(reading.value ?? '').toUpperCase();
    if (stage === 'INBED' || stage === 'AWAKE') continue;
    const minutes = readingDurationMinutes(reading);
    if (minutes > 0) durationTotal += minutes;
  }

  return durationTotal > 0 ? Math.round(durationTotal) : null;
}

function parseSleepStageMinutes(
  item: WearableDataItem | undefined,
  stageKey: (typeof SLEEP_STAGE_CONFIG)[number]['key'],
) {
  const fromField = parseMeasureNumber(item?.[stageKey]);
  if (fromField != null && fromField > 0) return fromField;

  if (!item) return null;
  const stageConfig = SLEEP_STAGE_CONFIG.find(stage => stage.key === stageKey);
  if (!stageConfig) return null;

  let total = 0;
  for (const reading of flattenWearableOriginalData(item)) {
    const stage = String(reading.value ?? '').toUpperCase();
    if (!stageConfig.stages.includes(stage)) continue;
    const minutes = readingDurationMinutes(reading);
    if (minutes > 0) total += minutes;
  }

  return total > 0 ? Math.round(total) : null;
}

function parseSleepDurationMinutes(item?: WearableDataItem) {
  if (!item) return null;

  const asleep = parseMeasureNumber(item.asleepTime);
  if (asleep != null && asleep > 0) return Math.round(asleep);

  const sleep = parseMeasureNumber(item.sleepTime);
  if (sleep != null && sleep > 0) return Math.round(sleep);

  const inbed = parseMeasureNumber(item.inbedSleepTime);
  if (inbed != null && inbed > 0) return Math.round(inbed);

  const stageTotal = SLEEP_STAGE_CONFIG.reduce(
    (sum, stage) => sum + (parseSleepStageMinutes(item, stage.key) ?? 0),
    0,
  );
  if (stageTotal > 0) return stageTotal;

  return sumSleepMinutesFromOriginalData(flattenWearableOriginalData(item));
}

export function getSleepDurationMinutes(item?: WearableDataItem) {
  return parseSleepDurationMinutes(item);
}

function getDisplaySleepItem(items: WearableDataItem[], range: VitalsRange) {
  if (range === 'today') {
    const sorted = [...items].sort((a, b) => getWearableDate(b).valueOf() - getWearableDate(a).valueOf());
    for (const item of sorted) {
      const date = getWearableDate(item);
      if (
        (date.isSame(moment(), 'day') || date.isSame(moment().subtract(1, 'day'), 'day')) &&
        parseSleepDurationMinutes(item) != null
      ) {
        return item;
      }
    }
    for (const item of sorted) {
      if (parseSleepDurationMinutes(item) != null) return item;
    }
    return getTodayWearableItem(items) ?? getLatestWearableItem(items);
  }

  return getLatestWearableItem(
    items.filter(item => {
      const date = getWearableDate(item);
      const { startDate, endDate } = getDateRange(range);
      return date.isBetween(startDate, endDate, 'day', '[]');
    }),
  );
}

function getWearableDate(item: WearableDataItem) {
  const date = item.customerLocalDate ?? item.dataDate?.slice(0, 10) ?? moment().format('YYYY-MM-DD');
  const parsed = moment(date, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : moment();
}

function getWearableTimestamp(item: WearableDataItem) {
  if (item.startTimeStr) {
    const parsed = moment(item.startTimeStr);
    if (parsed.isValid()) return parsed;
  }
  if (item.dataDate && item.dataDate.length > 10) {
    const parsed = moment(item.dataDate);
    if (parsed.isValid()) return parsed;
  }
  return getWearableDate(item);
}

function flattenWearableOriginalData(item: WearableDataItem): WearableOriginalReading[] {
  const data = item.originalData;
  if (!data?.length) return [];
  if (Array.isArray(data[0])) {
    return (data as WearableOriginalReading[][]).flat();
  }
  return data as WearableOriginalReading[];
}

function getOriginalReadingTimestamp(reading: WearableOriginalReading) {
  const dateStr = reading.startDate ?? reading.endDate;
  if (!dateStr) return null;
  const parsed = moment(dateStr);
  return parsed.isValid() ? parsed : null;
}

function getOriginalReadingEndTimestamp(reading: WearableOriginalReading) {
  const dateStr = reading.endDate ?? reading.startDate;
  if (!dateStr) return null;
  const parsed = moment(dateStr);
  return parsed.isValid() ? parsed : null;
}

type WearableTimedReading = { ts: moment.Moment; value: number };

function collectWearableReadings(
  items: WearableDataItem[],
  parseValue: (reading: WearableOriginalReading) => number | null,
): WearableTimedReading[] {
  const readings: WearableTimedReading[] = [];

  for (const item of items) {
    for (const reading of flattenWearableOriginalData(item)) {
      const ts = getOriginalReadingTimestamp(reading);
      const value = parseValue(reading);
      if (ts && value != null && value > 0) {
        // 保留小数：活动能量等可为亚千卡增量，Math.round 会丢数据
        readings.push({ ts, value });
      }
    }
  }

  return readings.sort((a, b) => a.ts.valueOf() - b.ts.valueOf());
}

function collectHeartRateReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => {
    const raw = parseMeasureNumber(reading.value);
    return raw != null ? Math.round(raw) : null;
  });
}

function collectOxygenReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => {
    const raw = parseMeasureNumber(reading.value);
    return raw != null ? Math.round(raw * 100) : null;
  });
}

function parseWearableOxygenValue(item?: WearableDataItem) {
  if (!item) return null;
  const raw =
    parseMeasureNumber(item.newOxygenSaturation) ??
    parseMeasureNumber(item.maxOxygenSaturation) ??
    parseMeasureNumber(item.minOxygenSaturation);
  return raw != null ? Math.round(raw * 100) : null;
}

function parseWearableHeartRateValue(item?: WearableDataItem) {
  if (!item) return null;
  const value =
    parseMeasureNumber(item.newHeartRate) ??
    parseMeasureNumber(item.heartRate) ??
    parseMeasureNumber(item.maxHeartRate) ??
    parseMeasureNumber(item.minHeartRate);
  return value != null ? Math.round(value) : null;
}

export function sortWearableItems(items: WearableDataItem[]) {
  return [...items].sort(
    (a, b) =>
      getWearableDate(a).valueOf() - getWearableDate(b).valueOf() ||
      (a.wearableDataId ?? 0) - (b.wearableDataId ?? 0),
  );
}

export function getLatestWearableItem(items: WearableDataItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

export function getTodayWearableItem(items: WearableDataItem[]) {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  return getLatestWearableItem(todayItems);
}

export function getTodayLatestWearableChartItems(items: WearableDataItem[]) {
  const item = getLatestWearableItem(items);
  return item ? [item] : [];
}

export function wrapWearableLatestItem(item?: WearableDataItem) {
  return item ? [item] : [];
}

export function wrapMeasureLatestItem(item?: MeasureDataItem) {
  return item ? [item] : [];
}

function pickWearableDayItems(
  items: WearableDataItem[],
  range: VitalsRange,
  labelIndex: number,
  labelCount: number,
) {
  if (range === 'today') {
    return items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  }
  const day = getBucketDay(range, labelIndex, labelCount);
  return items.filter(item => getWearableDate(item).isSame(day, 'day'));
}

export function formatSleepDuration(minutes?: number | null) {
  const total = parseMeasureNumber(minutes);
  if (total == null || total <= 0) return '--';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

export const SLEEP_SCORE_QUALITY_TIERS = [
  { min: 85, label: '极佳', color: '#6D925E', description: '睡眠质量 极佳' },
  { min: 75, label: '良好', color: '#6D925E', description: '睡眠质量 良好' },
  { min: 65, label: '一般', color: '#EE9C44', description: '睡眠质量 一般' },
  { min: 55, label: '较差', color: '#EE9C44', description: '睡眠质量 较差' },
  { min: 0, label: '差', color: '#FB4550', description: '睡眠质量 差' },
] as const;

export function getSleepScoreQuality(score?: number | null) {
  if (score == null || !Number.isFinite(score)) {
    return { label: '', color: '#999999', description: '暂无睡眠质量数据' };
  }

  const normalized = Math.max(0, Math.min(100, score));
  const tier = SLEEP_SCORE_QUALITY_TIERS.find(entry => normalized >= entry.min)
    ?? SLEEP_SCORE_QUALITY_TIERS[SLEEP_SCORE_QUALITY_TIERS.length - 1];

  return {
    label: tier.label,
    color: tier.color,
    description: tier.description,
  };
}

export function getSleepQuality(item?: WearableDataItem) {
  if (!item) return { label: '', color: '#999999' };
  if (item.isHigh === 1) return { label: '偏高', color: '#EE9C44' };
  if (item.isLow === 1) return { label: '偏低', color: '#72A1C5' };
  const score = parseMeasureNumber(item.sqsScore);
  if (score != null) {
    const quality = getSleepScoreQuality(score);
    return { label: quality.label, color: quality.color };
  }
  return { label: '良好', color: '#6D925E' };
}

export function buildSleepPieSegments(item?: WearableDataItem): SleepPieSegment[] {
  return SLEEP_STAGE_CONFIG.map(stage => ({
    name: stage.name,
    value: parseSleepStageMinutes(item, stage.key) ?? 0,
    color: stage.color,
  }));
}

export function buildSleepHoursSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickWearableDayItems(items, range, index, labels.length);
    const latest = getLatestWearableItem(bucketItems);
    const minutes = parseSleepDurationMinutes(latest) ?? 0;
    return { label, value: Math.round((minutes / 60) * 10) / 10 };
  });
}

export function getSleepSummary(items: WearableDataItem[], range: VitalsRange) {
  const displayItem = getDisplaySleepItem(items, range);
  const minutes = parseSleepDurationMinutes(displayItem);

  return {
    duration: formatSleepDuration(minutes),
    quality: getSleepQuality(displayItem),
    stages: SLEEP_STAGE_CONFIG.map(stage => ({
      ...stage,
      duration: formatSleepDuration(parseSleepStageMinutes(displayItem, stage.key)),
    })),
    pieSegments: buildSleepPieSegments(displayItem),
    barSeries: buildSleepHoursSeries(items, range),
    stageTimeline: buildSleepStageTimeline(displayItem),
  };
}

export function getStepsDisplay(items: WearableDataItem[]) {
  const item = getTodayWearableItem(items) ?? getLatestWearableItem(items);
  const steps = parseStepsFromItem(item);
  if (steps <= 0) {
    return { value: '--', status: '・暂无数据', statusColor: '#999999' };
  }
  return {
    value: String(steps),
    status: '',
    statusColor: '#999999',
  };
}

function parseStepsFromItem(item?: WearableDataItem) {
  if (!item) return 0;

  const stepCount = parseMeasureNumber(item.stepCount);
  if (stepCount != null && stepCount > 0) {
    return Math.round(stepCount);
  }

  const readings = flattenWearableOriginalData(item);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => sum + (parseMeasureNumber(reading.value) ?? 0), 0);
    if (total > 0) return Math.round(total);
  }

  return 0;
}

export function buildStepsTodayBarSeries(items: WearableDataItem[]): LabeledValue[] {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const sourceItems = todayItems.length ? todayItems : items;
  const readings = collectWearableReadings(sourceItems, reading => parseMeasureNumber(reading.value));

  if (readings.length) {
    return readings.map(({ ts, value }) => ({
      label: ts.format('HH:mm'),
      value,
    }));
  }

  const latest = getLatestWearableItem(sourceItems);
  const steps = parseStepsFromItem(latest);
  if (!latest || steps <= 0) {
    return [];
  }

  return [{
    label: getWearableTimestamp(latest).format('HH:mm'),
    value: steps,
  }];
}

export function buildStepsBarSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickWearableDayItems(items, range, index, labels.length);
    const latest = getLatestWearableItem(bucketItems);
    return { label, value: parseStepsFromItem(latest) };
  });
}

function getStepsCardStatus(steps: number, goal: number) {
  if (steps <= 0) {
    return { status: '暂无数据', statusColor: '#999999' };
  }
  if (goal > 0 && steps >= goal) {
    return { status: '达标', statusColor: '#6D925E' };
  }
  return { status: '未达标', statusColor: '#EE9C44' };
}

export function getStepsSummary(items: WearableDataItem[], range: VitalsRange, stepGoal = 10000) {
  const barSeries = range === 'today'
    ? buildStepsTodayBarSeries(items)
    : buildStepsBarSeries(items, range);
  if (range === 'today') {
    const display = getStepsDisplay(items);
    const stepsNum = display.value !== '--' ? Number(display.value) : 0;
    const { status, statusColor } = getStepsCardStatus(stepsNum, stepGoal);
    return { ...display, status, statusColor, barSeries, unit: '步' as const };
  }

  const dailyValues = barSeries.map(item => item.value).filter(value => value > 0);
  const average = dailyValues.length
    ? Math.round(dailyValues.reduce((sum, value) => sum + value, 0) / dailyValues.length)
    : 0;

  if (average <= 0) {
    return { value: '--', status: '・暂无数据', statusColor: '#999999', barSeries, unit: '步/日均' as const };
  }

  return {
    value: String(average),
    status: '・日均',
    statusColor: '#999999',
    barSeries,
    unit: '步/日均' as const,
  };
}

/**
 * 判断 originalData 是「小时/片段增量」还是「累计快照」。
 * Apple Watch 活动能量常见为增量：各段之和 ≈ 全日字段值，单段可超过全日 50%（例如运动时段）。
 */
function isIncrementalEnergyReadings(values: number[], fieldValue: number) {
  if (!values.length) return true;
  if (values.length === 1) {
    // 单点无法区分；优先信字段总值
    return false;
  }

  const sumReadings = values.reduce((sum, value) => sum + value, 0);
  const maxReading = Math.max(...values);

  if (fieldValue > 0) {
    const sumRatio = sumReadings / fieldValue;
    const maxRatio = maxReading / fieldValue;
    // 各段之和接近全日总值 → 增量
    if (sumRatio >= 0.8 && sumRatio <= 1.25) return true;
    // 单点接近全日总值 → 累计快照
    if (maxRatio >= 0.85) return false;
  }

  return sumReadings > maxReading * 1.5;
}

function isIncrementalEnergyDay(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  const checkItems = (items: WearableDataItem[], field: 'activeEnergyBurned' | 'basalEnergyBurned') => {
    const item = getLatestWearableItem(items);
    if (!item) return null;
    const fieldValue = Math.round(parseMeasureNumber(item[field]) ?? 0);
    const values = flattenWearableOriginalData(item)
      .map(reading => parseMeasureNumber(reading.value) ?? 0)
      .filter(value => value > 0);
    if (!values.length) return null;
    return isIncrementalEnergyReadings(values, fieldValue);
  };

  const activeKind = checkItems(activeItems, 'activeEnergyBurned');
  const basalKind = checkItems(basalItems, 'basalEnergyBurned');
  if (activeKind == null && basalKind == null) return false;
  if (activeKind == null) return basalKind === true;
  if (basalKind == null) return activeKind === true;
  return activeKind || basalKind;
}

/** 能量数值：四舍五入保留两位小数 */
function roundEnergyValue(value: number) {
  return Math.round(value * 100) / 100;
}

function formatEnergyDisplayValue(value: number) {
  if (!(value > 0)) return '--';
  return roundEnergyValue(value).toFixed(2);
}

function sumEnergyFromItem(item: WearableDataItem | undefined, field: 'activeEnergyBurned' | 'basalEnergyBurned') {
  if (!item) return 0;

  const fieldValue = roundEnergyValue(parseMeasureNumber(item[field]) ?? 0);
  const readings = flattenWearableOriginalData(item);
  if (!readings.length) return fieldValue;

  const values = readings
    .map(reading => parseMeasureNumber(reading.value) ?? 0)
    .filter(value => value > 0);
  if (!values.length) return fieldValue;

  const sumReadings = roundEnergyValue(values.reduce((sum, value) => sum + value, 0));
  if (isIncrementalEnergyReadings(values, fieldValue)) {
    return fieldValue > 0 ? Math.max(fieldValue, sumReadings) : sumReadings;
  }

  const maxReading = roundEnergyValue(Math.max(...values));
  const lastReading = roundEnergyValue(values[values.length - 1]);
  return Math.max(fieldValue, maxReading, lastReading);
}

function buildIncrementalEnergyTodayBarSeries(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
): LabeledValue[] {
  const bucketMap = new Map<number, LabeledValue>();

  const addItems = (items: WearableDataItem[]) => {
    collectWearableReadings(items, reading => parseMeasureNumber(reading.value)).forEach(({ ts, value }) => {
      const hourStart = ts.clone().startOf('hour');
      const bucketKey = hourStart.valueOf();
      const existing = bucketMap.get(bucketKey);
      bucketMap.set(bucketKey, {
        label: hourStart.format('HH:mm'),
        value: roundEnergyValue((existing?.value ?? 0) + value),
      });
    });
  };

  addItems(activeItems);
  addItems(basalItems);

  return Array.from(bucketMap.entries())
    .sort(([left], [right]) => left - right)
    .map(([, bar]) => bar)
    .filter(bar => bar.value > 0);
}

function getDayEnergyTotalsFromItems(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  const active = roundEnergyValue(sumEnergyFromItem(getLatestWearableItem(activeItems), 'activeEnergyBurned'));
  const basal = roundEnergyValue(sumEnergyFromItem(getLatestWearableItem(basalItems), 'basalEnergyBurned'));
  return { active, basal, total: roundEnergyValue(active + basal) };
}

function appendEnergyBarRemainder(
  bars: LabeledValue[],
  previousTotal: number,
  targetTotal: number,
  sourceActive: WearableDataItem[],
  sourceBasal: WearableDataItem[],
) {
  if (targetTotal <= previousTotal) return bars;

  const remainder = targetTotal - previousTotal;
  const latest = pickLatestEnergyReferenceItem(sourceActive, sourceBasal);
  const label = latest ? getWearableTimestamp(latest).format('HH:mm') : '--';
  const lastBar = bars[bars.length - 1];

  if (lastBar?.label === label) {
    return [
      ...bars.slice(0, -1),
      { ...lastBar, value: lastBar.value + remainder },
    ];
  }

  return [...bars, { label, value: remainder }];
}

export function getEnergyDisplay(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  const { day, activeItems: dayActive, basalItems: dayBasal } = resolveEnergyDisplayDay(activeItems, basalItems);
  const { active, basal, total } = getDayEnergyTotalsFromItems(dayActive, dayBasal);
  const isDataToday = day.isSame(moment(), 'day');

  return {
    total: formatEnergyDisplayValue(total),
    active: formatEnergyDisplayValue(active),
    basal: formatEnergyDisplayValue(basal),
    dataDayLabel: isDataToday ? '' : day.format('M/D'),
  };
}

function resolveEnergyDisplayDay(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  const today = moment();
  const todayActive = activeItems.filter(item => getWearableDate(item).isSame(today, 'day'));
  const todayBasal = basalItems.filter(item => getWearableDate(item).isSame(today, 'day'));

  if (todayActive.length > 0 || todayBasal.length > 0) {
    return { day: today, activeItems: todayActive, basalItems: todayBasal };
  }

  const latestItem = pickLatestEnergyReferenceItem(activeItems, basalItems);
  if (!latestItem) {
    return { day: today, activeItems: [], basalItems: [] };
  }

  const day = getWearableDate(latestItem);
  return {
    day,
    activeItems: activeItems.filter(item => getWearableDate(item).isSame(day, 'day')),
    basalItems: basalItems.filter(item => getWearableDate(item).isSame(day, 'day')),
  };
}

function pickLatestEnergyReferenceItem(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  return [getLatestWearableItem(activeItems), getLatestWearableItem(basalItems)]
    .filter((item): item is WearableDataItem => !!item)
    .sort((a, b) => getWearableTimestamp(b).valueOf() - getWearableTimestamp(a).valueOf())[0];
}

export function getEnergyDisplayDataTime(activeItems: WearableDataItem[], basalItems: WearableDataItem[], range: VitalsRange) {
  if (range !== 'today') {
    return getLatestWearableDataTime(
      sortWearableItems([...activeItems, ...basalItems]),
      range,
    );
  }

  const { activeItems: dayActive, basalItems: dayBasal } = resolveEnergyDisplayDay(activeItems, basalItems);
  const endTimes: moment.Moment[] = [];
  for (const item of [...dayActive, ...dayBasal]) {
    for (const reading of flattenWearableOriginalData(item)) {
      const ts = getOriginalReadingEndTimestamp(reading);
      if (ts) endTimes.push(ts);
    }
  }

  if (endTimes.length) {
    endTimes.sort((a, b) => a.valueOf() - b.valueOf());
    return formatVitalsCardTimeOrDate(endTimes[endTimes.length - 1]);
  }

  const bars = buildEnergyTodayBarSeries(activeItems, basalItems);
  const lastBar = bars[bars.length - 1];
  if (lastBar?.label && lastBar.label !== '--') {
    return lastBar.label;
  }

  const latest = pickLatestEnergyReferenceItem(dayActive, dayBasal);
  return formatWearableDataTime(latest);
}

export function pickWearableTodayOrDataDayItems(items: WearableDataItem[], latest?: WearableDataItem) {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  if (todayItems.length) return todayItems;
  if (items.length) return items;
  return wrapWearableLatestItem(latest);
}

export function buildEnergyBarSeries(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  range: VitalsRange,
): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const activeBucket = pickWearableDayItems(activeItems, range, index, labels.length);
    const basalBucket = pickWearableDayItems(basalItems, range, index, labels.length);
    const active = sumEnergyFromItem(getLatestWearableItem(activeBucket), 'activeEnergyBurned');
    const basal = sumEnergyFromItem(getLatestWearableItem(basalBucket), 'basalEnergyBurned');
    return { label, value: roundEnergyValue(active + basal) };
  });
}

export function buildEnergyTodayBarSeries(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
): LabeledValue[] {
  const { activeItems: sourceActive, basalItems: sourceBasal } = resolveEnergyDisplayDay(activeItems, basalItems);

  if (isIncrementalEnergyDay(sourceActive, sourceBasal)) {
    const incrementalBars = buildIncrementalEnergyTodayBarSeries(sourceActive, sourceBasal);
    if (incrementalBars.length) return incrementalBars;
  }

  const events = [
    ...collectWearableReadings(sourceActive, reading => parseMeasureNumber(reading.value))
      .map(item => ({ ...item, kind: 'active' as const })),
    ...collectWearableReadings(sourceBasal, reading => parseMeasureNumber(reading.value))
      .map(item => ({ ...item, kind: 'basal' as const })),
  ].sort((a, b) => a.ts.valueOf() - b.ts.valueOf());

  if (events.length) {
    let latestActive = 0;
    let latestBasal = 0;
    let previousTotal = 0;
    const bars: LabeledValue[] = [];

    events.forEach((event, index) => {
      if (event.kind === 'active') {
        latestActive = roundEnergyValue(event.value);
      } else {
        latestBasal = roundEnergyValue(event.value);
      }

      const isLastAtSameTs =
        index === events.length - 1 || events[index + 1].ts.valueOf() !== event.ts.valueOf();
      if (!isLastAtSameTs) return;

      const currentTotal = roundEnergyValue(latestActive + latestBasal);
      const delta = roundEnergyValue(Math.max(0, currentTotal - previousTotal));
      previousTotal = currentTotal;
      if (delta > 0) {
        bars.push({ label: event.ts.format('HH:mm'), value: delta });
      }
    });

    const { total: targetTotal } = getDayEnergyTotalsFromItems(sourceActive, sourceBasal);
    return appendEnergyBarRemainder(bars, previousTotal, targetTotal, sourceActive, sourceBasal);
  }

  const { total } = getDayEnergyTotalsFromItems(sourceActive, sourceBasal);
  if (total <= 0) return [];

  const latest = getLatestWearableItem(sourceActive) ?? getLatestWearableItem(sourceBasal);
  const ts = latest ? getWearableTimestamp(latest) : moment();

  return [{ label: ts.format('HH:mm'), value: total }];
}

function getEnergyCardStatus(total: number, goal: number) {
  if (total <= 0) {
    return { status: '暂无数据', statusColor: '#999999' };
  }
  if (goal > 0 && total >= goal) {
    return { status: '达标', statusColor: '#6D925E' };
  }
  return { status: '未达标', statusColor: '#EE9C44' };
}

export function getEnergySummary(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  range: VitalsRange,
  energyGoal = 2000,
) {
  // 图表与主数值统一按活动消耗，不计入静息
  const barSeries = range === 'today'
    ? buildEnergyTodayBarSeries(activeItems, [])
    : buildEnergyBarSeries(activeItems, [], range);

  if (range === 'today') {
    const display = getEnergyDisplay(activeItems, basalItems);
    // total = 活动 + 静息；VitalsPage 不传静息时 total 即活动消耗
    const totalNum = display.total !== '--' ? Number(display.total) : 0;
    const { status, statusColor } = getEnergyCardStatus(totalNum, energyGoal);
    return {
      ...display,
      barSeries,
      unit: '千卡' as const,
      status,
      statusColor,
    };
  }

  const dailyTotals = barSeries.map(item => item.value).filter(value => value > 0);
  const average = dailyTotals.length
    ? roundEnergyValue(dailyTotals.reduce((sum, value) => sum + value, 0) / dailyTotals.length)
    : 0;

  if (average <= 0) {
    return {
      total: '--',
      active: '--',
      basal: '--',
      barSeries,
      totalLabel: '日均活动消耗',
      unit: '千卡/日均' as const,
      status: '・暂无数据',
      statusColor: '#999999',
    };
  }

  return {
    total: formatEnergyDisplayValue(average),
    active: formatEnergyDisplayValue(average),
    basal: '--',
    barSeries,
    totalLabel: '日均活动消耗',
    unit: '千卡/日均' as const,
    status: '・日均',
    statusColor: '#999999',
  };
}

function buildWearableValueSeries(
  items: WearableDataItem[],
  range: VitalsRange,
  parseValue: (item?: WearableDataItem) => number | null,
): LabeledValue[] {
  if (range === 'today') {
    return items
      .filter(item => getWearableDate(item).isSame(moment(), 'day'))
      .map(item => {
        const ts = getWearableTimestamp(item);
        return {
          label: ts.format('HH:mm'),
          value: parseValue(item) ?? 0,
          x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
        };
      });
  }

  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickWearableDayItems(items, range, index, labels.length);
    const latest = getLatestWearableItem(bucketItems);
    return { label, value: parseValue(latest) ?? 0 };
  });
}

export function buildWearableOxygenSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  if (range === 'today') {
    const readings = collectOxygenReadings(items);
    if (readings.length) {
      return readings.map(({ ts, value }) => ({
        label: ts.format('HH:mm'),
        value,
        x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
      }));
    }
  }

  return buildWearableValueSeries(items, range, parseWearableOxygenValue);
}

export function buildWearableHeartRateSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  if (range === 'today') {
    const readings = collectHeartRateReadings(items);
    if (readings.length) {
      return readings.map(({ ts, value }) => ({
        label: ts.format('HH:mm'),
        value,
        x: mapTimeToTodayChartX(ts.hour(), ts.minute()),
      }));
    }
  }

  if (range !== 'today') {
    const labels = getChartLabels(range);
    return labels.map((label, index) => {
      const bucketItems = pickWearableDayItems(items, range, index, labels.length);
      const dayReadings = collectHeartRateReadings(bucketItems);
      if (dayReadings.length) {
        const avg = Math.round(dayReadings.reduce((sum, reading) => sum + reading.value, 0) / dayReadings.length);
        return { label, value: avg };
      }
      const latest = getLatestWearableItem(bucketItems);
      return { label, value: parseWearableHeartRateValue(latest) ?? 0 };
    });
  }

  return buildWearableValueSeries(items, range, parseWearableHeartRateValue);
}

export function getBloodOxygenDisplay(items: WearableDataItem[]) {
  const todayReadings = collectOxygenReadings(
    items.filter(item => getWearableDate(item).isSame(moment(), 'day')),
  );
  const latestReading = todayReadings.length ? todayReadings[todayReadings.length - 1] : undefined;
  const item = getTodayWearableItem(items) ?? getLatestWearableItem(items);
  const value = latestReading?.value ?? parseWearableOxygenValue(item);
  if (value == null) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  let status = '正常';
  let statusColor = '#6D925E';
  if (item?.isHigh === 1) {
    status = '偏高';
    statusColor = getLevelColor(status);
  } else {
    const oxygenStatus = formatBloodOxygenValueStatus(value);
    status = oxygenStatus.status;
    statusColor = oxygenStatus.statusColor;
  }

  return {
    value: String(value),
    status: `${status}`,
    statusColor,
  };
}

export function getHeartRateDisplay(items: WearableDataItem[]) {
  const todayReadings = collectHeartRateReadings(
    items.filter(item => getWearableDate(item).isSame(moment(), 'day')),
  );
  const latestReading = todayReadings.length ? todayReadings[todayReadings.length - 1] : undefined;
  const item = getTodayWearableItem(items) ?? getLatestWearableItem(items);
  const value = latestReading?.value ?? parseWearableHeartRateValue(item);
  if (value == null) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  const { status, statusColor } = formatHeartRateValueStatus(value);

  return {
    value: String(value),
    status: `${status}`,
    statusColor,
  };
}

const VITALS_CARD_DATE_FORMAT = 'YYYY/M/D';

export function formatMeasureDataTime(item?: MeasureDataItem) {
  if (!item) return '';
  const date = item.customerLocalDate?.trim();
  const time = item.dataTime?.trim();
  if (date) {
    const parsed = moment(date, 'YYYY-MM-DD', true);
    if (parsed.isValid()) {
      if (parsed.isSame(moment(), 'day') && time) return time;
      return parsed.format(VITALS_CARD_DATE_FORMAT);
    }
  }
  return time || '';
}

export function formatWearableDataTime(item?: WearableDataItem) {
  if (!item) return '';
  const date = getWearableDate(item);
  if (date.isSame(moment(), 'day')) {
    const ts = getWearableTimestamp(item);
    return ts.format('HH:mm');
  }
  return date.format(VITALS_CARD_DATE_FORMAT);
}

function formatVitalsCardTimeOrDate(ts: moment.Moment) {
  return ts.isSame(moment(), 'day') ? ts.format('HH:mm') : ts.format(VITALS_CARD_DATE_FORMAT);
}

function formatTodayLatestReadingTime(
  items: WearableDataItem[],
  collectReadings: (source: WearableDataItem[]) => WearableTimedReading[],
) {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  const source = todayItems.length ? todayItems : items;
  const readings = collectReadings(source);
  const ts = readings.length
    ? readings[readings.length - 1].ts
    : (() => {
      const latest = getLatestWearableItem(source);
      return latest ? getWearableTimestamp(latest) : null;
    })();
  if (!ts) return '';
  return formatVitalsCardTimeOrDate(ts);
}

export function getHeartRateDisplayDataTime(items: WearableDataItem[], range: VitalsRange = 'today') {
  if (range !== 'today') return getLatestWearableDataTime(items, range);
  return formatTodayLatestReadingTime(items, collectHeartRateReadings);
}

export function getBloodOxygenDisplayDataTime(items: WearableDataItem[], range: VitalsRange = 'today') {
  if (range !== 'today') return getLatestWearableDataTime(items, range);
  return formatTodayLatestReadingTime(items, collectOxygenReadings);
}

export function getStepsDisplayDataTime(items: WearableDataItem[], range: VitalsRange = 'today') {
  if (range !== 'today') return getLatestWearableDataTime(items, range);
  return formatTodayLatestReadingTime(items, sourceItems =>
    collectWearableReadings(sourceItems, reading => parseMeasureNumber(reading.value)),
  );
}

export function getSleepDisplayDataTime(items: WearableDataItem[], range: VitalsRange = 'today') {
  const item = getDisplaySleepItem(items, range);
  if (!item) return '';
  const date = getWearableDate(item);
  if (date.isSame(moment(), 'day')) {
    return date.format('M/D');
  }
  return date.format(VITALS_CARD_DATE_FORMAT);
}

export function getLatestMeasureDataTime(items: MeasureDataItem[], range: VitalsRange = 'today') {
  return formatMeasureDataTime(getLatestItemForRange(items, range));
}

function formatHeartRateStatus(item: WearableDataItem | undefined, value: number) {
  const { status, statusColor } = formatHeartRateValueStatus(value);
  return { status: `${status}`, statusColor };
}

function formatBloodOxygenStatus(item: WearableDataItem | undefined, value: number) {
  if (item?.isHigh === 1) {
    return { status: '偏高', statusColor: getLevelColor('偏高') };
  }
  const { status, statusColor } = formatBloodOxygenValueStatus(value);
  return { status: `${status}`, statusColor };
}

export function formatHeartRateFromItem(item?: WearableDataItem) {
  const readings = item ? collectHeartRateReadings([item]) : [];
  const latestReading = readings.length ? readings[readings.length - 1] : undefined;
  const value = latestReading?.value ?? parseWearableHeartRateValue(item);
  if (value == null) {
    return { value: '--', status: '', statusColor: '#999999' };
  }
  const { status, statusColor } = formatHeartRateStatus(item, value);
  return { value: String(value), status, statusColor };
}

export function formatBloodOxygenFromItem(item?: WearableDataItem) {
  const readings = item ? collectOxygenReadings([item]) : [];
  const latestReading = readings.length ? readings[readings.length - 1] : undefined;
  const value = latestReading?.value ?? parseWearableOxygenValue(item);
  if (value == null) {
    return { value: '--', status: '', statusColor: '#999999' };
  }
  const { status, statusColor } = formatBloodOxygenStatus(item, value);
  return { value: String(value), status, statusColor };
}

export function getLatestWearableDataTime(items: WearableDataItem[], range: VitalsRange = 'today') {
  if (range === 'today') {
    return formatWearableDataTime(getLatestWearableItem(items));
  }
  const { startDate, endDate } = getDateRange(range);
  const rangedItems = items.filter(item =>
    getWearableDate(item).isBetween(startDate, endDate, 'day', '[]'),
  );
  return formatWearableDataTime(getLatestWearableItem(rangedItems));
}
