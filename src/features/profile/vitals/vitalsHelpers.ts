import moment from 'moment';
import type {
  MeasureDataAllRecordsMonthGroup,
  MeasureDataDayGroup,
  MeasureDataItem,
  MeasureDataStatisDayGroup,
  VitalKey,
  VitalsMeasureType,
} from '@/api/measureData';
import { VITAL_KEY_API_TYPE, VITAL_KEYS } from '@/api/measureData';
import type { WearableDataItem, WearableOriginalReading } from '@/api/wearableData';
import type { BloodPressurePoint } from '@/src/features/home/components/BloodPressureChart';
import { TODAY_AXIS_LABELS } from '@/src/features/home/components/chartAxis';
import type { SleepPieSegment } from '@/src/features/home/components/SleepPieChart';
import { getLevelColor } from './vitalLevelColors';

export { getLevelColor, getLevelBgColor } from './vitalLevelColors';

export { TODAY_AXIS_LABELS as TODAY_HOUR_LABELS };

export type VitalsRange = 'today' | '7Days' | '30Days';

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
      value = type === '心率' || type === '血氧' ? String(Math.round(parsed)) : String(parsed);
    }
  }

  return {
    value,
    status: levelLabel ? `・${levelLabel}` : '',
    statusColor: getLevelColor(levelLabel),
  };
}

export function formatBloodPressure(latest?: BloodPressurePoint) {
  const point = latest ?? { high: 142, low: 92 };
  const status = point.high >= 140 || point.low >= 90 ? '偏高' : '正常';
  const statusColor = getLevelColor(status);
  return {
    value: `${point.high}/${point.low}`,
    status: `・${status}`,
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
  return formatMeasureDisplay(getLatestItemForRange(items, range), type);
}

export function isFemaleGender(gender?: string | null) {
  return gender === '女' || gender === '1';
}

export function getUricAcidRange(gender?: string | null) {
  if (isFemaleGender(gender)) {
    return { min: 155, max: 357 };
  }
  return { min: 208, max: 428 };
}

export function getUricAcidStatusLabel(value: number, gender?: string | null) {
  const { min, max } = getUricAcidRange(gender);
  if (value > max) return '偏高';
  if (value < min) return '偏低';
  return '正常';
}

export function flattenAllMeasureRecords(rows?: MeasureDataAllRecordsMonthGroup[] | null): MeasureDataItem[] {
  if (!rows?.length) return [];

  const items = rows.flatMap(month =>
    (month.list ?? []).flatMap(day =>
      (day.childList ?? []).map(item => ({
        ...item,
        customerLocalDate:
          item.customerLocalDate?.trim() || day.customerLocalDate?.trim() || item.customerLocalDate,
      })),
    ),
  );

  return items.sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf());
}

export function formatUricAcidCompareText(items: MeasureDataItem[]) {
  if (items.length < 2) return null;

  const latest = items[items.length - 1];
  const previous = items[items.length - 2];
  const latestVal = parseMeasureNumber(latest.val);
  const prevVal = parseMeasureNumber(previous.val);
  if (latestVal == null || prevVal == null) return null;

  const diff = Math.round(latestVal - prevVal);
  if (diff === 0) {
    return { text: '较上次持平', color: '#999999' };
  }
  if (diff > 0) {
    return { text: `较上次上升+${diff}μmol/L`, color: '#D80010' };
  }
  return { text: `较上次下降${Math.abs(diff)}μmol/L`, color: '#00C950' };
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
  if (value < 5.2) return '理想';
  if (value < 6.2) return '边缘升高';
  return '升高';
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
      status: '',
      statusColor: '#999999',
    };
  }

  const serverLabel = getLevelLabel(item);
  const label = serverLabel || (tc != null ? getTotalCholesterolStatusLabel(tc) : '');

  return {
    tcValue: tc != null ? tc.toFixed(2) : '--',
    tgValue: tg != null ? tg.toFixed(2) : '--',
    hdlValue: hdl != null ? hdl.toFixed(2) : '--',
    ldlValue: ldl != null ? ldl.toFixed(2) : '--',
    status: label ? `・${label}` : '',
    statusColor: getLevelColor(label),
  };
}

export const SLEEP_STAGE_CONFIG = [
  { key: 'awakeSleepTime' as const, name: '清醒', color: 'rgba(5,58,147,0.4)', stages: ['AWAKE'] },
  { key: 'remSleepTime' as const, name: '入眠', color: 'rgba(5,58,147,0.6)', stages: ['REM'] },
  { key: 'coreSleepTime' as const, name: '浅睡', color: 'rgba(5,58,147,0.8)', stages: ['CORE'] },
  { key: 'deepSleepTime' as const, name: '深睡', color: '#053A93', stages: ['DEEP'] },
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
        readings.push({ ts, value: Math.round(value) });
      }
    }
  }

  return readings.sort((a, b) => a.ts.valueOf() - b.ts.valueOf());
}

function collectHeartRateReadings(items: WearableDataItem[]) {
  return collectWearableReadings(items, reading => parseMeasureNumber(reading.value));
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

function getLatestWearableItem(items: WearableDataItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

export function getTodayWearableItem(items: WearableDataItem[]) {
  const todayItems = items.filter(item => getWearableDate(item).isSame(moment(), 'day'));
  return getLatestWearableItem(todayItems);
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

export function getSleepQuality(item?: WearableDataItem) {
  if (!item) return { label: '', color: '#999999' };
  if (item.isHigh === 1) return { label: '偏高', color: '#FFBA1D' };
  if (item.isLow === 1) return { label: '偏低', color: '#FFBA1D' };
  const score = parseMeasureNumber(item.sqsScore);
  if (score != null) {
    if (score >= 80) return { label: '优秀', color: '#00C950' };
    if (score >= 60) return { label: '良好', color: '#00C950' };
    return { label: '一般', color: '#FFBA1D' };
  }
  return { label: '良好', color: '#00C950' };
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
  };
}

export function getStepsDisplay(items: WearableDataItem[], goalOverride?: number) {
  const item = getTodayWearableItem(items);
  const steps = parseStepsFromItem(item);
  const goal = parseMeasureNumber(item?.stepGoals) ?? goalOverride ?? 10000;
  if (steps <= 0) {
    return { value: `--/${goal}`, status: '・暂无数据', statusColor: '#999999' };
  }
  if (steps >= goal) {
    return { value: `${steps}/${goal}`, status: '・达标', statusColor: '#00C950' };
  }
  const remaining = Math.max(0, Math.round(goal - steps));
  const ratio = goal > 0 ? steps / goal : 0;
  return {
    value: `${steps}/${goal}`,
    status: `・距目标还有${remaining}步`,
    statusColor: ratio >= 0.6 ? '#00C950' : '#FFBA1D',
  };
}

function parseStepsFromItem(item?: WearableDataItem) {
  if (!item) return 0;

  const readings = flattenWearableOriginalData(item);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => sum + (parseMeasureNumber(reading.value) ?? 0), 0);
    if (total > 0) return Math.round(total);
  }

  return Math.round(parseMeasureNumber(item.stepCount) ?? 0);
}

export function buildStepsBarSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickWearableDayItems(items, range, index, labels.length);
    const latest = getLatestWearableItem(bucketItems);
    return { label, value: parseStepsFromItem(latest) };
  });
}

export function getStepsSummary(items: WearableDataItem[], range: VitalsRange, goalOverride?: number) {
  const barSeries = range === 'today' ? [] : buildStepsBarSeries(items, range);
  if (range === 'today') {
    return { ...getStepsDisplay(items, goalOverride), barSeries, unit: '步' as const };
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

function sumEnergyFromItem(item: WearableDataItem | undefined, field: 'activeEnergyBurned' | 'basalEnergyBurned') {
  if (!item) return 0;

  const readings = flattenWearableOriginalData(item);
  if (readings.length) {
    const total = readings.reduce((sum, reading) => sum + (parseMeasureNumber(reading.value) ?? 0), 0);
    if (total > 0) return total;
  }

  return parseMeasureNumber(item[field]) ?? 0;
}

export function getEnergyDisplay(activeItems: WearableDataItem[], basalItems: WearableDataItem[]) {
  const active = Math.round(sumEnergyFromItem(getTodayWearableItem(activeItems), 'activeEnergyBurned'));
  const basal = Math.round(sumEnergyFromItem(getTodayWearableItem(basalItems), 'basalEnergyBurned'));
  const total = active + basal;

  return {
    total: total > 0 ? String(total) : '--',
    active: active > 0 ? String(active) : '--',
    basal: basal > 0 ? String(basal) : '--',
  };
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
    return { label, value: Math.round(active + basal) };
  });
}

export function getEnergySummary(
  activeItems: WearableDataItem[],
  basalItems: WearableDataItem[],
  range: VitalsRange,
) {
  const barSeries = range === 'today' ? [] : buildEnergyBarSeries(activeItems, basalItems, range);
  if (range === 'today') {
    return { ...getEnergyDisplay(activeItems, basalItems), barSeries, showBreakdown: true as const };
  }

  const dailyTotals = barSeries.map(item => item.value).filter(value => value > 0);
  const average = dailyTotals.length
    ? Math.round(dailyTotals.reduce((sum, value) => sum + value, 0) / dailyTotals.length)
    : 0;

  return {
    total: average > 0 ? String(average) : '--',
    active: '--',
    basal: '--',
    barSeries,
    showBreakdown: false as const,
    totalLabel: '日均总消耗',
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
    const readings = collectOxygenReadings(
      items.filter(item => getWearableDate(item).isSame(moment(), 'day')),
    );
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
    const readings = collectHeartRateReadings(
      items.filter(item => getWearableDate(item).isSame(moment(), 'day')),
    );
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
    statusColor = '#FFBA1D';
  } else if (item?.isLow === 3) {
    status = '异常偏低';
    statusColor = '#FFBA1D';
  } else if (item?.isLow === 2) {
    status = '较低';
    statusColor = '#FFBA1D';
  } else if (item?.isLow === 1 || value < 95) {
    status = '偏低';
    statusColor = '#FFBA1D';
  }

  return {
    value: String(value),
    status: `・${status}`,
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

  let status = '正常';
  let statusColor = '#6D925E';
  if (item?.isHigh === 1 || value > 100) {
    status = '偏高';
    statusColor = '#FFBA1D';
  } else if (item?.isLow === 1 || value < 60) {
    status = '偏低';
    statusColor = '#FFBA1D';
  }

  return {
    value: String(value),
    status: `・${status}`,
    statusColor,
  };
}

