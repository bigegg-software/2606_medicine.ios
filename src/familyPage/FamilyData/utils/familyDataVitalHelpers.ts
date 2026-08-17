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
} from '@/src/features/profile/vitals/vitalsHelpers';
import type { FamilyVitalItem } from './familyDataHelpers';
import { FAMILY_VITAL_ITEMS } from './familyDataHelpers';

export type FamilyVitalKey =
  | 'bp'
  | 'glucose'
  | 'hr'
  | 'sleep'
  | 'spo2'
  | 'temp'
  | 'uric'
  | 'lipid'
  | 'weight';

const FAMILY_MEASURE_TYPES: { key: FamilyVitalKey; type: MeasureDataType }[] = [
  { key: 'bp', type: '血压' },
  { key: 'glucose', type: '血糖' },
  { key: 'temp', type: '体温' },
  { key: 'uric', type: '尿酸' },
  { key: 'lipid', type: '血脂' },
  { key: 'weight', type: '体重' },
];

const FAMILY_WEARABLE_TYPES: { key: FamilyVitalKey; type: WearableDataType }[] = [
  { key: 'hr', type: WEARABLE_DATA_TYPES.heartRate },
  { key: 'sleep', type: WEARABLE_DATA_TYPES.sleep },
  { key: 'spo2', type: WEARABLE_DATA_TYPES.oxygen },
];

function toPositiveMinutes(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
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
  return `${hours}h`;
}

function formatFamilyLipidValue(item?: MeasureDataItem): string {
  if (!item) return '--';
  const tc = typeof item.xuezhiTc === 'number' ? item.xuezhiTc : Number(item.xuezhiTc);
  if (!Number.isFinite(tc)) return '--';
  return tc.toFixed(2);
}

function formatFamilyGlucoseDisplay(item?: MeasureDataItem): FamilyVitalDisplay {
  const value = formatMeasureDisplay(item, '血糖').value;
  if (!value || value === '--') return { value: '--' };
  const suffix = item?.measurementStatus?.trim();
  return suffix ? { value, suffix } : { value };
}

function formatFamilyMeasureDisplay(
  type: MeasureDataType,
  item?: MeasureDataItem,
): FamilyVitalDisplay {
  if (type === '血脂') return { value: formatFamilyLipidValue(item) };
  if (type === '血糖') return formatFamilyGlucoseDisplay(item);
  return { value: formatMeasureDisplay(item, type).value };
}

function formatFamilyWearableDisplay(
  key: FamilyVitalKey,
  item?: WearableDataItem,
): FamilyVitalDisplay {
  if (key === 'hr') return { value: formatHeartRateFromItem(item).value };
  if (key === 'spo2') {
    const value = formatBloodOxygenFromItem(item).value;
    if (!value || value === '--') return { value: '--' };
    return { value: value.endsWith('%') ? value : `${value}%` };
  }
  if (key === 'sleep') return { value: formatFamilySleepValue(item) };
  return { value: '--' };
}

export type FamilyVitalDisplay = {
  value: string;
  suffix?: string;
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
    };
  });
}

/** 无选中家人时的空态列表 */
export function emptyFamilyVitalItems(): FamilyVitalItem[] {
  return mergeFamilyVitalItems(null);
}
