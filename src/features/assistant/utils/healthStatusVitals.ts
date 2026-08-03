import moment from 'moment';
import {
  getMeasureDataDetailByDate,
  getMeasureDataLatestByType,
  type MeasureDataDetailResult,
  type MeasureDataItem,
  type MeasureDataLatestResult,
  type MeasureDataType,
  type VitalKey,
  VITAL_KEY_API_TYPE,
  VITAL_KEYS,
} from '@/api/measureData';
import {
  getWearableDataDetailByDateRange,
  getWearableDataLatestByType,
  WEARABLE_DATA_TYPES,
  type WearableDataDetailResult,
  type WearableDataItem,
  type WearableDataRangeResult,
  type WearableDataType,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  flattenMeasureItems,
  pickWearableTodayOrDataDayItems,
  sortWearableItems,
  wrapWearableLatestItem,
} from '@/src/features/profile/vitals/vitalsHelpers';

export const HEALTH_STATUS_VITAL_ORDER = [
  '心率',
  '消耗',
  '血糖',
  '血压',
  '步数',
  '睡眠',
  '血氧',
  '体温',
  '体重',
  '血脂',
  '尿酸',
] as const;

export type HealthStatusVitalKey = (typeof HEALTH_STATUS_VITAL_ORDER)[number];

const EMPTY_MEASURE_DATA: Record<VitalKey, MeasureDataItem[]> = {
  bloodPressure: [],
  bloodGlucose: [],
  bodyTemperature: [],
  uricAcid: [],
  bloodLipids: [],
};

export type TodayHealthStatusVitalsData = {
  measureData: Record<VitalKey, MeasureDataItem[]>;
  latestMeasure: Partial<Record<VitalKey, MeasureDataItem>>;
  weightData: MeasureDataItem[];
  latestWeight?: MeasureDataItem;
  wearableSleep: WearableDataItem[];
  wearableSteps: WearableDataItem[];
  wearableOxygen: WearableDataItem[];
  wearableHeartRate: WearableDataItem[];
  wearableActiveEnergy: WearableDataItem[];
  wearableBasalEnergy: WearableDataItem[];
};

async function fetchLatestMeasure(type: MeasureDataType) {
  try {
    const res = (await getMeasureDataLatestByType(type)) as unknown as MeasureDataLatestResult;
    if (!isResourceApiOk(res)) return undefined;
    return apiResourceData<MeasureDataItem>(res);
  } catch {
    return undefined;
  }
}

async function fetchLatestWearable(type: WearableDataType) {
  try {
    const res = (await getWearableDataLatestByType(type)) as unknown as WearableDataDetailResult;
    if (!isResourceApiOk(res)) return undefined;
    return apiResourceData<WearableDataItem>(res);
  } catch {
    return undefined;
  }
}

async function fetchMeasureLatestAndDayItems(type: MeasureDataType) {
  const latest = await fetchLatestMeasure(type);
  const latestDate = latest?.customerLocalDate?.trim();
  if (!latestDate) {
    return { latest, chartItems: latest ? [latest] : [] };
  }

  try {
    const res = (await getMeasureDataDetailByDate({
      customerLocalDate: latestDate,
      type,
    })) as unknown as MeasureDataDetailResult;
    if (!isResourceApiOk(res)) {
      return { latest, chartItems: latest ? [latest] : [] };
    }
    const items = flattenMeasureItems(apiResourceData<MeasureDataItem[]>(res));
    return { latest, chartItems: items.length ? items : latest ? [latest] : [] };
  } catch {
    return { latest, chartItems: latest ? [latest] : [] };
  }
}

async function fetchWearableDayItems(type: WearableDataType, startDate: string, endDate: string) {
  try {
    const res = (await getWearableDataDetailByDateRange({
      startDate,
      endDate,
      type,
    })) as unknown as WearableDataRangeResult;
    if (!isResourceApiOk(res)) return [];
    const data = apiResourceData<WearableDataItem[]>(res);
    return sortWearableItems(Array.isArray(data) ? data : []);
  } catch {
    return [];
  }
}

async function fetchWearableLatestAndDayItems(type: WearableDataType) {
  const latest = await fetchLatestWearable(type);
  const latestDate = latest?.customerLocalDate?.trim() || latest?.dataDate?.slice(0, 10);
  if (!latestDate) {
    return { latest, dayItems: latest ? [latest] : [] };
  }

  const dayItems = await fetchWearableDayItems(type, latestDate, latestDate);
  return {
    latest,
    dayItems: dayItems.length ? dayItems : latest ? [latest] : [],
  };
}

export async function loadTodayHealthStatusVitals(): Promise<TodayHealthStatusVitalsData> {
  const today = moment().format('YYYY-MM-DD');

  const [
    measureResults,
    weightResult,
    latestSleep,
    latestSteps,
    stepsDayItems,
    latestOxygen,
    latestHeartRate,
    activeEnergyResult,
  ] = await Promise.all([
    Promise.all(
      VITAL_KEYS.map(async key => {
        const result = await fetchMeasureLatestAndDayItems(VITAL_KEY_API_TYPE[key]);
        return [key, result] as const;
      }),
    ),
    fetchMeasureLatestAndDayItems('体重'),
    fetchLatestWearable(WEARABLE_DATA_TYPES.sleep),
    fetchLatestWearable(WEARABLE_DATA_TYPES.steps),
    fetchWearableDayItems(WEARABLE_DATA_TYPES.steps, today, today),
    fetchLatestWearable(WEARABLE_DATA_TYPES.oxygen),
    fetchLatestWearable(WEARABLE_DATA_TYPES.heartRate),
    fetchWearableLatestAndDayItems(WEARABLE_DATA_TYPES.activeEnergy),
  ]);

  return {
    measureData: {
      ...EMPTY_MEASURE_DATA,
      ...(Object.fromEntries(
        measureResults.map(([key, result]) => [key, result.chartItems]),
      ) as Record<VitalKey, MeasureDataItem[]>),
    },
    latestMeasure: Object.fromEntries(
      measureResults.map(([key, result]) => [key, result.latest]),
    ) as Partial<Record<VitalKey, MeasureDataItem>>,
    weightData: weightResult.chartItems,
    latestWeight: weightResult.latest,
    wearableSleep: wrapWearableLatestItem(latestSleep),
    wearableSteps: stepsDayItems.length ? stepsDayItems : wrapWearableLatestItem(latestSteps),
    wearableOxygen: wrapWearableLatestItem(latestOxygen),
    wearableHeartRate: wrapWearableLatestItem(latestHeartRate),
    wearableActiveEnergy: pickWearableTodayOrDataDayItems(
      activeEnergyResult.dayItems,
      activeEnergyResult.latest,
    ),
    // 不再请求 basalEnergyBurned
    wearableBasalEnergy: [],
  };
}
