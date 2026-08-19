import type { ImageSourcePropType } from 'react-native';
import moment from 'moment';
import type { FamilyBindItem } from '@/api/familyBind';
import {
  getMeasureDataLatestByType,
  type MeasureDataItem,
  type MeasureDataLatestResult,
  type MeasureDataType,
} from '@/api/measureData';
import { getTodayAbnormalList } from '@/api/todayAbnormal';
import {
  getWearableDataDetailByCustomerLocalDate,
  getWearableDataLatestByType,
  WEARABLE_DATA_TYPES,
  type WearableDataDetailResult,
  type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  formatBloodOxygenFromItem,
  formatHeartRateFromItem,
  formatMeasureDisplay,
} from '@/src/features/profile/vitals/vitalsHelpers';
import { buildBloodSugarStatus } from '@/src/features/profile/vitals/detail/helpers/bloodSugar';
import {
  parseStepsFromItem,
  sumEnergyFromItem,
} from '@/src/features/profile/vitals/detail/helpers/shared';
import {
  isVitalIndexKey,
  VITAL_INDEX_KEYS,
  type VitalIndexKey,
} from '@/src/features/profile/vitals/vitalsSortHelpers';
import { getApprovedFamilyBindList } from './familyProfileHelpers';

export type FamilyHomeGlucoseTrend = 'up' | 'down' | null;

export type FamilyHomeHealthRow = {
  key: VitalIndexKey;
  value: string;
  glucoseTrend: FamilyHomeGlucoseTrend;
};

export type FamilyHomeHealthSnapshot = {
  rows: FamilyHomeHealthRow[];
  abnormalCount: number | null;
};

const FAMILY_HOME_HEALTH_ROW_COUNT = 4;
const MEASURE_TYPES = new Set<string>(['血糖', '血压', '体温', '体重', '血脂', '尿酸']);

export function buildFamilyHomeHealthRowTypes(
  abnormalList?: string[] | null,
): VitalIndexKey[] {
  const rows: VitalIndexKey[] = [];
  (abnormalList ?? []).forEach(item => {
    const key = String(item ?? '').trim();
    if (!isVitalIndexKey(key) || rows.includes(key)) return;
    rows.push(key);
  });
  VITAL_INDEX_KEYS.forEach(key => {
    if (rows.length >= FAMILY_HOME_HEALTH_ROW_COUNT) return;
    if (rows.includes(key)) return;
    rows.push(key);
  });
  return rows.slice(0, FAMILY_HOME_HEALTH_ROW_COUNT);
}

export function emptyFamilyHomeHealthSnapshot(): FamilyHomeHealthSnapshot {
  return {
    rows: buildFamilyHomeHealthRowTypes([]).map(key => ({
      key,
      value: '--',
      glucoseTrend: null,
    })),
    abnormalCount: null,
  };
}

function displayOrDash(value?: string) {
  const text = value?.trim();
  return text && text !== '--' ? text : '--';
}

function trimTrailingDecimalZeros(text: string): string {
  const raw = text.trim();
  if (!raw || raw === '--' || raw.includes('/')) return raw;
  const match = raw.match(/^(-?\d+\.\d+)([a-zA-Z%]*)$/);
  if (!match) return raw;
  const [, num, suffix] = match;
  return `${num.replace(/\.?0+$/, '')}${suffix}`;
}

function toPositiveMinutes(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function formatGlucoseValue(item?: MeasureDataItem) {
  return displayOrDash(
    trimTrailingDecimalZeros(formatMeasureDisplay(item, '血糖').value),
  );
}

function formatLipidValue(item?: MeasureDataItem): string {
  if (!item) return '--';
  const tc = typeof item.xuezhiTc === 'number' ? item.xuezhiTc : Number(item.xuezhiTc);
  if (!Number.isFinite(tc)) return '--';
  return displayOrDash(trimTrailingDecimalZeros(tc.toFixed(2)));
}

function formatSleepValue(item?: WearableDataItem): string {
  const minutes =
    toPositiveMinutes(item?.asleepTime) ??
    toPositiveMinutes(item?.sleepTime) ??
    toPositiveMinutes(item?.inbedSleepTime);
  if (minutes == null) return '--';
  const hours = Math.round((minutes / 60) * 10) / 10;
  return trimTrailingDecimalZeros(`${hours}h`);
}

function resolveGlucoseTrend(item?: MeasureDataItem): FamilyHomeGlucoseTrend {
  if (!item) return null;
  const status = buildBloodSugarStatus(0, item);
  if (status === 'high' || status === 'highRisk') return 'up';
  if (status === 'low') return 'down';
  return null;
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

async function fetchWearable(
  loader: () => Promise<unknown>,
): Promise<WearableDataItem | undefined> {
  try {
    const res = (await loader()) as WearableDataDetailResult;
    if (!isResourceApiOk(res as { code?: number })) return undefined;
    return apiResourceData<WearableDataItem>(res as { code?: number; data?: WearableDataItem });
  } catch {
    return undefined;
  }
}

export function resolveFamilyHomeGlucoseTrendIcon(
  trend?: FamilyHomeGlucoseTrend,
): ImageSourcePropType | null {
  if (trend === 'up') return require('@/assets/images/vitals/shang.png');
  if (trend === 'down') return require('@/assets/images/vitals/xia.png');
  return null;
}

async function loadTodayWearable(
  type: (typeof WEARABLE_DATA_TYPES)[keyof typeof WEARABLE_DATA_TYPES],
  patientUserId: string,
): Promise<WearableDataItem | undefined> {
  const today = moment().format('YYYY-MM-DD');
  const todayItem = await fetchWearable(() =>
    getWearableDataDetailByCustomerLocalDate(
      { customerLocalDate: today, type },
      { patientUserId },
    ),
  );
  if (todayItem) return todayItem;
  return fetchWearable(() => getWearableDataLatestByType(type, { patientUserId }));
}

async function loadFamilyHomeHealthRow(
  key: VitalIndexKey,
  patientUserId: string,
): Promise<FamilyHomeHealthRow> {
  if (MEASURE_TYPES.has(key)) {
    const item = await fetchLatestMeasure(key as MeasureDataType, patientUserId);
    const value =
      key === '血脂'
        ? formatLipidValue(item)
        : key === '血糖'
          ? formatGlucoseValue(item)
          : displayOrDash(trimTrailingDecimalZeros(formatMeasureDisplay(item, key as MeasureDataType).value));
    return {
      key,
      value,
      glucoseTrend: key === '血糖' ? resolveGlucoseTrend(item) : null,
    };
  }

  if (key === '步数') {
    const item = await loadTodayWearable(WEARABLE_DATA_TYPES.steps, patientUserId);
    const steps = parseStepsFromItem(item);
    return { key, value: steps > 0 ? String(steps) : '--', glucoseTrend: null };
  }
  if (key === '心率') {
    const item = await loadTodayWearable(WEARABLE_DATA_TYPES.heartRate, patientUserId);
    return { key, value: displayOrDash(formatHeartRateFromItem(item).value), glucoseTrend: null };
  }
  if (key === '血氧') {
    const item = await loadTodayWearable(WEARABLE_DATA_TYPES.oxygen, patientUserId);
    const raw = formatBloodOxygenFromItem(item).value;
    const value = !raw || raw === '--' ? '--' : raw.endsWith('%') ? raw : `${raw}%`;
    return { key, value, glucoseTrend: null };
  }
  if (key === '睡眠') {
    const item = await loadTodayWearable(WEARABLE_DATA_TYPES.sleep, patientUserId);
    return { key, value: formatSleepValue(item), glucoseTrend: null };
  }
  if (key === '消耗') {
    const item = await loadTodayWearable(WEARABLE_DATA_TYPES.activeEnergy, patientUserId);
    const energy = sumEnergyFromItem(item, 'activeEnergyBurned');
    return {
      key,
      value: energy > 0 ? String(Math.round(energy)) : '--',
      glucoseTrend: null,
    };
  }

  return { key, value: '--', glucoseTrend: null };
}

export async function loadFamilyTodayAbnormalTypes(
  patientUserId: string,
): Promise<string[] | null> {
  const id = String(patientUserId).trim();
  if (!id) return null;
  try {
    const res = await getTodayAbnormalList({ patientUserId: id });
    const data = apiResourceData<{ list?: string[] }>(res);
    if (!data) return null;
    return Array.isArray(data.list) ? data.list : [];
  } catch {
    return null;
  }
}

/** 拉取指定家人首页健康速览（异常项优先，不足补默认前 4 项） */
export async function loadFamilyMemberHealthSnapshot(
  patientUserId: string,
): Promise<FamilyHomeHealthSnapshot> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyHomeHealthSnapshot();
  try {
    const abnormalList = await loadFamilyTodayAbnormalTypes(id);
    const types = buildFamilyHomeHealthRowTypes(abnormalList ?? []);
    const rows = await Promise.all(types.map(key => loadFamilyHomeHealthRow(key, id)));
    return {
      rows,
      abnormalCount: abnormalList == null ? null : abnormalList.length,
    };
  } catch {
    return emptyFamilyHomeHealthSnapshot();
  }
}

/** 批量拉取已绑定家人健康速览，key 为 patientUserId */
export async function loadFamilyHomeHealthMap(
  list: FamilyBindItem[],
): Promise<Record<string, FamilyHomeHealthSnapshot>> {
  const approved = getApprovedFamilyBindList(list);
  const entries = await Promise.all(
    approved.map(async item => {
      const id = item.patientUserId != null ? String(item.patientUserId).trim() : '';
      if (!id) return ['', emptyFamilyHomeHealthSnapshot()] as const;
      const snapshot = await loadFamilyMemberHealthSnapshot(id);
      return [id, snapshot] as const;
    }),
  );
  const map: Record<string, FamilyHomeHealthSnapshot> = {};
  entries.forEach(([id, snapshot]) => {
    if (id) map[id] = snapshot;
  });
  return map;
}
