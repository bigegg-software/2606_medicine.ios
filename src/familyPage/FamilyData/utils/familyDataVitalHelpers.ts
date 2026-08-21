import moment from 'moment';
import {
  getMeasureDataLatestByType,
  type MeasureDataItem,
  type MeasureDataLatestResult,
  type MeasureDataType,
} from '@/api/measureData';
import {
  getWearableDataLatestByType,
  WEARABLE_DATA_TYPES,
  type WearableDataDetailResult,
  type WearableDataItem,
  type WearableDataType,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  formatBloodOxygenFromItem,
  formatHeartRateFromItem,
  formatMeasureDisplay,
  getLevelColor,
  getSleepQuality,
} from '@/src/features/profile/vitals/vitalsHelpers';
import { formatBodyTemperatureMeasureDisplay } from '@/src/features/profile/vitals/vitalsStatusDisplay';
import {
  parseMeasureNumber,
  parseStepsFromItem,
  roundEnergyValue,
  sumEnergyFromItem,
} from '@/src/features/profile/vitals/detail/helpers/shared';
import type { FamilyVitalItem } from './familyDataHelpers';
import { FAMILY_VITAL_ITEMS } from './familyDataHelpers';

export type FamilyVitalKey =
  | 'hr'
  | 'energy'
  | 'glucose'
  | 'bp'
  | 'steps'
  | 'sleep'
  | 'spo2'
  | 'temp';

const FAMILY_MEASURE_TYPES: { key: FamilyVitalKey; type: MeasureDataType }[] = [
  { key: 'glucose', type: '血糖' },
  { key: 'bp', type: '血压' },
  { key: 'temp', type: '体温' },
];

const FAMILY_WEARABLE_TYPES: { key: FamilyVitalKey; type: WearableDataType }[] = [
  { key: 'hr', type: WEARABLE_DATA_TYPES.heartRate },
  { key: 'energy', type: WEARABLE_DATA_TYPES.activeEnergy },
  { key: 'steps', type: WEARABLE_DATA_TYPES.steps },
  { key: 'sleep', type: WEARABLE_DATA_TYPES.sleep },
  { key: 'spo2', type: WEARABLE_DATA_TYPES.oxygen },
];

const FAMILY_ABNORMAL_MEASURE_TYPES: MeasureDataType[] = ['血糖', '血压', '体温', '血脂', '尿酸'];

const EMPTY_STATUS = { statusText: '--', statusColor: '#999999' };

function toPositiveMinutes(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/** 去掉小数末尾多余的 0：4.80→4.8，5.00→5；血压 142/92 等不处理 */
function trimTrailingDecimalZeros(text: string): string {
  const raw = text.trim();
  if (!raw || raw === '--' || raw.includes('/')) return raw;
  const match = raw.match(/^(-?\d+\.\d+)([a-zA-Z%]*)$/);
  if (!match) return raw;
  const [, num, suffix] = match;
  return `${num.replace(/\.?0+$/, '')}${suffix}`;
}

async function fetchLatestMeasure(
  type: MeasureDataType,
  patientUserId: string,
): Promise<MeasureDataItem | undefined> {
  try {
    const res = (await getMeasureDataLatestByType(type, {
      patientUserId,
    })) as unknown as MeasureDataLatestResult;
    if (!isResourceApiOk(res)) return undefined;
    return apiResourceData<MeasureDataItem>(res);
  } catch {
    return undefined;
  }
}

async function fetchLatestWearable(
  type: WearableDataType,
  patientUserId: string,
): Promise<WearableDataItem | undefined> {
  try {
    const res = (await getWearableDataLatestByType(type, {
      patientUserId,
    })) as unknown as WearableDataDetailResult;
    if (!isResourceApiOk(res)) return undefined;
    return apiResourceData<WearableDataItem>(res);
  } catch {
    return undefined;
  }
}

function formatFamilySleepValue(item?: WearableDataItem): string {
  const minutes =
    toPositiveMinutes(item?.asleepTime) ??
    toPositiveMinutes(item?.sleepTime) ??
    toPositiveMinutes(item?.inbedSleepTime);
  if (minutes == null) return '--';
  const hours = Math.round((minutes / 60) * 10) / 10;
  return trimTrailingDecimalZeros(`${hours}h`);
}

function toFamilyStatus(status?: string, statusColor?: string) {
  const text = String(status ?? '').replace(/^・/, '').trim();
  if (!text || text === '--' || text === '暂无数据') return EMPTY_STATUS;
  return {
    statusText: text,
    statusColor: statusColor || getLevelColor(text),
  };
}

function formatGoalStatus(value: number, goal: number) {
  if (!(value > 0)) return EMPTY_STATUS;
  const statusText = goal > 0 && value >= goal ? '达标' : '未达标';
  return { statusText, statusColor: getLevelColor(statusText) };
}

function formatFamilyVitalDate(raw?: string | null): string {
  const text = raw?.trim();
  if (!text) return '--';
  const parsed = moment(
    text,
    ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYYMMDD', 'YYYY-MM-DD HH:mm:ss', moment.ISO_8601],
    true,
  );
  if (parsed.isValid()) return parsed.format('YYYY/MM/DD');
  const day = text.slice(0, 10).replace(/-/g, '/');
  return /^\d{4}\/\d{2}\/\d{2}$/.test(day) ? day : '--';
}

function pickMeasureDate(item?: MeasureDataItem): string {
  return formatFamilyVitalDate(item?.customerLocalDate);
}

function pickWearableDate(item?: WearableDataItem): string {
  return formatFamilyVitalDate(
    item?.customerLocalDate || item?.dataDate?.slice(0, 10) || item?.dataDate,
  );
}

function formatFamilyGlucoseDisplay(item?: MeasureDataItem): FamilyVitalDisplay {
  const display = formatMeasureDisplay(item, '血糖');
  const value = trimTrailingDecimalZeros(display.value);
  const dateText = pickMeasureDate(item);
  if (!value || value === '--') return { value: '--', dateText, ...EMPTY_STATUS };
  const suffix = item?.measurementStatus?.trim();
  return {
    value,
    suffix: suffix || undefined,
    dateText,
    ...toFamilyStatus(display.status, display.statusColor),
  };
}

function formatFamilyMeasureDisplay(
  type: MeasureDataType,
  item?: MeasureDataItem,
): FamilyVitalDisplay {
  const dateText = pickMeasureDate(item);
  if (type === '血糖') return formatFamilyGlucoseDisplay(item);
  const display =
    type === '体温' ? formatBodyTemperatureMeasureDisplay(item) : formatMeasureDisplay(item, type);
  const value = trimTrailingDecimalZeros(display.value);
  if (!value || value === '--') return { value: '--', dateText, ...EMPTY_STATUS };
  return {
    value,
    dateText,
    ...toFamilyStatus(display.status, display.statusColor),
  };
}

function formatFamilyEnergyDisplay(item?: WearableDataItem): FamilyVitalDisplay {
  const dateText = pickWearableDate(item);
  const energy = sumEnergyFromItem(item, 'activeEnergyBurned');
  if (!(energy > 0)) return { value: '--', dateText, ...EMPTY_STATUS };
  const goal = parseMeasureNumber(item?.energyGoals) ?? 2000;
  return {
    value: trimTrailingDecimalZeros(String(roundEnergyValue(energy))),
    dateText,
    ...formatGoalStatus(energy, goal),
  };
}

function formatFamilyStepsDisplay(item?: WearableDataItem): FamilyVitalDisplay {
  const dateText = pickWearableDate(item);
  const steps = parseStepsFromItem(item);
  if (!(steps > 0)) return { value: '--', dateText, ...EMPTY_STATUS };
  const goal = parseMeasureNumber(item?.stepGoals) ?? 10000;
  return {
    value: String(steps),
    dateText,
    ...formatGoalStatus(steps, goal),
  };
}

function formatFamilyWearableDisplay(
  key: FamilyVitalKey,
  item?: WearableDataItem,
): FamilyVitalDisplay {
  const dateText = pickWearableDate(item);
  if (key === 'hr') {
    const display = formatHeartRateFromItem(item);
    if (!display.value || display.value === '--') return { value: '--', dateText, ...EMPTY_STATUS };
    return { value: display.value, dateText, ...toFamilyStatus(display.status, display.statusColor) };
  }
  if (key === 'spo2') {
    const display = formatBloodOxygenFromItem(item);
    if (!display.value || display.value === '--') return { value: '--', dateText, ...EMPTY_STATUS };
    return {
      value: display.value.endsWith('%') ? display.value : `${display.value}%`,
      dateText,
      ...toFamilyStatus(display.status, display.statusColor),
    };
  }
  if (key === 'sleep') {
    const value = formatFamilySleepValue(item);
    if (value === '--') return { value, dateText, ...EMPTY_STATUS };
    const quality = getSleepQuality(item);
    return { value, dateText, ...toFamilyStatus(quality.label, quality.color) };
  }
  if (key === 'energy') return formatFamilyEnergyDisplay(item);
  if (key === 'steps') return formatFamilyStepsDisplay(item);
  return { value: '--', dateText, ...EMPTY_STATUS };
}

export type FamilyVitalDisplay = {
  value: string;
  suffix?: string;
  dateText?: string;
  statusText?: string;
  statusColor?: string;
};

/** 拉取指定家人最新体征展示文案（测量 + 穿戴） */
export async function loadFamilyVitalDisplayValues(
  patientUserId: string,
): Promise<Partial<Record<FamilyVitalKey, FamilyVitalDisplay>>> {
  const id = String(patientUserId).trim();
  if (!id) return {};

  const [measureResults, wearableResults] = await Promise.all([
    Promise.all(
      FAMILY_MEASURE_TYPES.map(async ({ key, type }) => {
        const item = await fetchLatestMeasure(type, id);
        return [key, formatFamilyMeasureDisplay(type, item)] as const;
      }),
    ),
    Promise.all(
      FAMILY_WEARABLE_TYPES.map(async ({ key, type }) => {
        const item = await fetchLatestWearable(type, id);
        return [key, formatFamilyWearableDisplay(key, item)] as const;
      }),
    ),
  ]);

  const values: Partial<Record<FamilyVitalKey, FamilyVitalDisplay>> = {};
  for (const [key, display] of [...measureResults, ...wearableResults]) {
    values[key] = display;
  }
  return values;
}

/** 用最新值覆盖静态体征列表 */
export function mergeFamilyVitalItems(
  values?: Partial<Record<FamilyVitalKey, FamilyVitalDisplay>> | null,
): FamilyVitalItem[] {
  return FAMILY_VITAL_ITEMS.map(item => {
    const display = values?.[item.key as FamilyVitalKey];
    return {
      ...item,
      value: display?.value ?? '--',
      valueSuffix: display?.suffix,
      dateText: display?.dateText ?? '--',
      statusText: display?.statusText ?? '--',
      statusColor: display?.statusColor ?? '#999999',
    };
  });
}

/** 无选中家人时的空态列表 */
export function emptyFamilyVitalItems(): FamilyVitalItem[] {
  return mergeFamilyVitalItems(null);
}

function isAbnormalVitalStatus(status?: string) {
  const text = String(status ?? '').trim();
  if (!text || text === '--' || text === '暂无数据') return false;
  return !text.startsWith('正常');
}

/** 统计指定家人最新体征中的异常项数（血压/血糖/体温/尿酸/血脂/心率/血氧） */
export async function countFamilyLatestVitalAbnormal(
  patientUserId: string,
): Promise<number | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;

  try {
    const measureTypes = FAMILY_ABNORMAL_MEASURE_TYPES;
    const wearableTypes = FAMILY_WEARABLE_TYPES.filter(
      item => item.key === 'hr' || item.key === 'spo2',
    );
    const [measureFlags, wearableFlags] = await Promise.all([
      Promise.all(
        measureTypes.map(async type => {
          const item = await fetchLatestMeasure(type, id);
          if (!item) return false;
          return isAbnormalVitalStatus(formatMeasureDisplay(item, type).status);
        }),
      ),
      Promise.all(
        wearableTypes.map(async ({ key, type }) => {
          const item = await fetchLatestWearable(type, id);
          if (!item) return false;
          if (key === 'hr') return isAbnormalVitalStatus(formatHeartRateFromItem(item).status);
          if (key === 'spo2') return isAbnormalVitalStatus(formatBloodOxygenFromItem(item).status);
          return false;
        }),
      ),
    ]);
    return [...measureFlags, ...wearableFlags].filter(Boolean).length;
  } catch {
    return null;
  }
}
