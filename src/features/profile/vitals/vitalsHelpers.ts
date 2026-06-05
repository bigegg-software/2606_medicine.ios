import moment from 'moment';
import type { MeasureDataDayGroup, MeasureDataItem, VitalKey, VitalsMeasureType } from '@/api/measureData';
import { VITAL_KEY_API_TYPE, VITAL_KEYS } from '@/api/measureData';
import type { WearableDataItem } from '@/api/wearableData';
import type { BloodPressurePoint } from '@/src/features/home/components/BloodPressureChart';
import { TODAY_AXIS_LABELS } from '@/src/features/home/components/chartAxis';
import type { SleepPieSegment } from '@/src/features/home/components/SleepPieChart';

export { TODAY_AXIS_LABELS as TODAY_HOUR_LABELS };

export type VitalsRange = 'today' | '7Days' | '30Days';

export const VITALS_NAV_LIST: { label: string; value: VitalsRange }[] = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7Days' },
  { label: '近30天', value: '30Days' },
];

export { VITAL_KEYS, VITAL_KEY_API_TYPE };
export type { VitalKey };

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_DAY_OFFSETS = [29, 24, 19, 14, 9, 4, 0];

export function mapTimeToTodayChartX(hour: number, minute = 0) {
  const totalMinutes = hour * 60 + minute;
  return (totalMinutes / (24 * 60)) * (TODAY_AXIS_LABELS.length - 1);
}

export function getChartLabels(range: VitalsRange): string[] {
  switch (range) {
    case 'today':
      return TODAY_AXIS_LABELS;
    case '7Days':
      return WEEK_LABELS;
    case '30Days':
      return MONTH_DAY_OFFSETS.map(d => moment().subtract(d, 'days').format('M/D'));
    default:
      return TODAY_AXIS_LABELS;
  }
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

export type LabeledValue = { label: string; value: number; x?: number };

export function flattenMeasureItems(groups?: MeasureDataDayGroup[] | null): MeasureDataItem[] {
  return (groups ?? [])
    .flatMap(group =>
      (group.childList ?? []).map(item => ({
        ...item,
        customerLocalDate: item.customerLocalDate || group.customerLocalDate,
      })),
    )
    .sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf());
}

function parseMeasureNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getItemTimestamp(item: MeasureDataItem) {
  const date = item.customerLocalDate ?? moment().format('YYYY-MM-DD');
  const time = item.dataTime ?? '00:00';
  const parsed = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm', true);
  return parsed.isValid() ? parsed : moment(date, 'YYYY-MM-DD', true);
}

function getLatestItem(items: MeasureDataItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

function pickBucketItems(items: MeasureDataItem[], range: VitalsRange, labelIndex: number, labelCount: number) {
  if (range === 'today') {
    return [];
  }
  if (range === '7Days') {
    const day = moment()
      .subtract(labelCount - 1 - labelIndex, 'days')
      .startOf('day');
    return items.filter(item => getItemTimestamp(item).isSame(day, 'day'));
  }
  const day = moment().subtract(MONTH_DAY_OFFSETS[labelIndex], 'days').startOf('day');
  return items.filter(item => getItemTimestamp(item).isSame(day, 'day'));
}

export function buildSingleValueSeries(items: MeasureDataItem[], range: VitalsRange): LabeledValue[] {
  if (range === 'today') {
    return items
      .filter(item => getItemTimestamp(item).isSame(moment(), 'day'))
      .map(item => {
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
    const bucketItems = pickBucketItems(items, range, index, labels.length);
    const latest = getLatestItem(bucketItems);
    return { label, value: parseMeasureNumber(latest?.val) ?? 0 };
  });
}

export function buildBloodPressureSeriesFromItems(items: MeasureDataItem[], range: VitalsRange): BloodPressurePoint[] {
  if (range === 'today') {
    return items
      .filter(item => getItemTimestamp(item).isSame(moment(), 'day'))
      .map(item => {
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
    const bucketItems = pickBucketItems(items, range, index, labels.length);
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

export function getLevelColor(label: string) {
  if (!label || label.includes('正常')) return '#00C950';
  return '#FFBA1D';
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
  const statusColor = status === '偏高' ? '#FFBA1D' : '#00C950';
  return {
    value: `${point.high}/${point.low}`,
    status: `・${status}`,
    statusColor,
  };
}

export function formatBloodPressureFromItems(items: MeasureDataItem[]) {
  return formatMeasureDisplay(getLatestItem(items), '血压');
}

export function formatSingleValue(
  value: number,
  opts: { high?: number; low?: number; unit?: string } = {},
) {
  const { high, low } = opts;
  let status = '正常';
  if (high != null && value > high) status = '偏高';
  if (low != null && value < low) status = '偏低';
  const statusColor = status === '正常' ? '#00C950' : '#FFBA1D';
  return {
    value: String(value),
    status: `・${status}`,
    statusColor,
  };
}

export function formatSingleValueFromItems(items: MeasureDataItem[], type: VitalsMeasureType) {
  return formatMeasureDisplay(getLatestItem(items), type);
}

export const SLEEP_STAGE_CONFIG = [
  { key: 'awakeSleepTime' as const, name: '清醒', color: 'rgba(5,58,147,0.4)' },
  { key: 'remSleepTime' as const, name: '入眠', color: 'rgba(5,58,147,0.6)' },
  { key: 'coreSleepTime' as const, name: '浅睡', color: 'rgba(5,58,147,0.8)' },
  { key: 'deepSleepTime' as const, name: '深睡', color: '#053A93' },
];

function getWearableDate(item: WearableDataItem) {
  const date = item.customerLocalDate ?? item.dataDate?.slice(0, 10) ?? moment().format('YYYY-MM-DD');
  const parsed = moment(date, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : moment();
}

function getWearableTimestamp(item: WearableDataItem) {
  if (item.dataDate) {
    const parsed = moment(item.dataDate);
    if (parsed.isValid()) return parsed;
  }
  return getWearableDate(item);
}

function parseWearableOxygenValue(item?: WearableDataItem) {
  if (!item) return null;
  const value =
    parseMeasureNumber(item.newOxygenSaturation) ??
    parseMeasureNumber(item.maxOxygenSaturation) ??
    parseMeasureNumber(item.minOxygenSaturation);
  return value != null ? Math.round(value) : null;
}

function parseWearableHeartRateValue(item?: WearableDataItem) {
  if (!item) return null;
  const value =
    parseMeasureNumber(item.newHeartRate) ??
    parseMeasureNumber(item.restingHeartRate) ??
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
  if (range === '7Days') {
    const day = moment()
      .subtract(labelCount - 1 - labelIndex, 'days')
      .startOf('day');
    return items.filter(item => getWearableDate(item).isSame(day, 'day'));
  }
  const day = moment().subtract(MONTH_DAY_OFFSETS[labelIndex], 'days').startOf('day');
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
    value: parseMeasureNumber(item?.[stage.key]) ?? 0,
    color: stage.color,
  }));
}

export function buildSleepHoursSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  const labels = getChartLabels(range);
  return labels.map((label, index) => {
    const bucketItems = pickWearableDayItems(items, range, index, labels.length);
    const latest = getLatestWearableItem(bucketItems);
    const minutes =
      parseMeasureNumber(latest?.asleepTime) ?? parseMeasureNumber(latest?.sleepTime) ?? 0;
    return { label, value: Math.round((minutes / 60) * 10) / 10 };
  });
}

export function getSleepSummary(items: WearableDataItem[], range: VitalsRange) {
  const todayItem = getTodayWearableItem(items);
  const displayItem =
    range === 'today'
      ? todayItem
      : getLatestWearableItem(
          items.filter(item => {
            const date = getWearableDate(item);
            const { startDate, endDate } = getDateRange(range);
            return date.isBetween(startDate, endDate, 'day', '[]');
          }),
        );
  const minutes =
    parseMeasureNumber(displayItem?.asleepTime) ?? parseMeasureNumber(displayItem?.sleepTime);

  return {
    duration: formatSleepDuration(minutes),
    quality: getSleepQuality(displayItem),
    stages: SLEEP_STAGE_CONFIG.map(stage => ({
      ...stage,
      duration: formatSleepDuration(parseMeasureNumber(displayItem?.[stage.key])),
    })),
    pieSegments: buildSleepPieSegments(todayItem),
    barSeries: buildSleepHoursSeries(items, range),
  };
}

export function getStepsDisplay(items: WearableDataItem[]) {
  const item = getTodayWearableItem(items);
  const steps = parseMeasureNumber(item?.stepCount) ?? 0;
  const goal = parseMeasureNumber(item?.stepGoals) ?? 10000;
  if (steps <= 0) {
    return { value: `--/${goal}`, status: '・暂无数据', statusColor: '#999999' };
  }
  const ratio = goal > 0 ? steps / goal : 0;
  const status = ratio >= 1 ? '・达标' : ratio >= 0.6 ? '・进行中' : '・偏少';
  const statusColor = ratio >= 0.6 ? '#00C950' : '#FFBA1D';
  return { value: `${steps}/${goal}`, status, statusColor };
}

export function getEnergyDisplay(items: WearableDataItem[]) {
  const item = getTodayWearableItem(items);
  const active = parseMeasureNumber(item?.activeEnergyBurned) ?? 0;
  const basal = parseMeasureNumber(item?.basalEnergyBurned) ?? 0;
  const total = Math.round(active + basal);
  return {
    total: total > 0 ? String(total) : '--',
    active: active > 0 ? String(Math.round(active)) : '--',
    basal: basal > 0 ? String(Math.round(basal)) : '--',
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
  return buildWearableValueSeries(items, range, parseWearableOxygenValue);
}

export function buildWearableHeartRateSeries(items: WearableDataItem[], range: VitalsRange): LabeledValue[] {
  return buildWearableValueSeries(items, range, parseWearableHeartRateValue);
}

export function getBloodOxygenDisplay(items: WearableDataItem[]) {
  const item = getLatestWearableItem(items);
  const value = parseWearableOxygenValue(item);
  if (value == null) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  let status = '正常';
  let statusColor = '#00C950';
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
  const item = getLatestWearableItem(items);
  const value = parseWearableHeartRateValue(item);
  if (value == null) {
    return { value: '--', status: '', statusColor: '#999999' };
  }

  let status = '正常';
  let statusColor = '#00C950';
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
