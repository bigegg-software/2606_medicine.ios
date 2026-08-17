import type { ImageSourcePropType } from 'react-native';
import type { MeasureDataItem, MeasureDataType } from '@/api/measureData';
import type { WearableDataItem, WearableDataType } from '@/api/wearableData';
import { WEARABLE_DATA_TYPES } from '@/api/wearableData';
import {
  buildBloodLipidTcSeries,
  buildBloodPressureSeriesFromItems,
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  buildWearableOxygenSeries,
  filterMeasureItemsInRange,
  formatBloodLipidsFromItems,
  formatBloodPressureFromItems,
  formatBodyTemperatureDisplay,
  formatSingleValueFromItems,
  formatUricAcidFromItems,
  getBloodOxygenDisplay,
  getEnergySummary,
  getHeartRateDisplay,
  getSleepSummary,
  getStepsSummary,
} from '@/src/features/profile/vitals/vitalsHelpers';
import { formatWeightFromItemsForVitals } from '@/src/features/profile/vitals/detail/helpers/weight';
import { resolveRestingHeartRateDisplay } from '@/src/features/profile/vitals/detail/helpers/heartRate';
import { calcNutritionProgress } from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import {
  isVitalIndexKey,
  type VitalIndexKey,
} from '@/src/features/profile/vitals/vitalsSortHelpers';
import type { VitalInfoKey } from './vitalInfoContent';

export const HOME_BLUR_VITAL_COUNT = 3;
export const HOME_BLUR_FIXED_KEYS: VitalIndexKey[] = ['心率', '消耗'];
export const HOME_BLUR_DEFAULT_DYNAMIC_KEY: VitalIndexKey = '血糖';
export const HOME_BLUR_CHART_WIDTH = 72;
export const HOME_BLUR_CHART_HEIGHT = 30;
export const HOME_BLUR_PROGRESS_WIDTH = 74;

export type HomeBlurVitalChartKind = 'scatter' | 'bar' | 'progress';

export type HomeBlurVitalCardView = {
  key: VitalIndexKey;
  label: string;
  unit: string;
  infoKey: VitalInfoKey | '卡路里';
  icon: ImageSourcePropType;
  route:
    | 'HeartRatePage'
    | 'ConsumptionPage'
    | 'BloodSugarPage'
    | 'BloodPressurePage'
    | 'StepsPage'
    | 'SleepPage'
    | 'BloodOxygenPage'
    | 'BodyTemperaturePage'
    | 'WeightPage'
    | 'BloodLipidPage'
    | 'UricAcidPage';
  value: string;
  subtitle: string;
  chartKind: HomeBlurVitalChartKind;
  chartColor: string;
  sparkline: number[];
  progress: number;
};

export type HomeBlurVitalDataBag = {
  measureByType: Partial<Record<MeasureDataType, MeasureDataItem[]>>;
  wearableByType: Partial<Record<WearableDataType, WearableDataItem[]>>;
  energyGoal: number;
  stepGoal: number;
  sleepGoalHours: number;
  userGender?: string | null;
};

type HomeBlurVitalMeta = {
  key: VitalIndexKey;
  label: string;
  unit: string;
  infoKey: VitalInfoKey | '卡路里';
  icon: ImageSourcePropType;
  route: HomeBlurVitalCardView['route'];
  chartKind: HomeBlurVitalChartKind;
  chartColor: string;
  measureType?: MeasureDataType;
  wearableTypes?: WearableDataType[];
};

const HOME_ICONS: Record<VitalIndexKey, ImageSourcePropType> = {
  心率: require('@/assets/images/home/xl_Icon.png'),
  消耗: require('@/assets/images/home/kll_Icon.png'),
  血糖: require('@/assets/images/home/xt_Icon.png'),
  血压: require('@/assets/images/home/icon_xy.png'),
  步数: require('@/assets/images/home/icon_bs.png'),
  睡眠: require('@/assets/images/home/icon_sm.png'),
  血氧: require('@/assets/images/home/icon_o2.png'),
  体温: require('@/assets/images/home/icon_tw.png'),
  体重: require('@/assets/images/home/icon_tz.png'),
  血脂: require('@/assets/images/home/icon_xz.png'),
  尿酸: require('@/assets/images/home/icon_ns.png'),
};

const HOME_BLUR_VITAL_META: Record<VitalIndexKey, HomeBlurVitalMeta> = {
  心率: {
    key: '心率',
    label: '心率',
    unit: '次/分',
    infoKey: '心率',
    icon: HOME_ICONS.心率,
    route: 'HeartRatePage',
    chartKind: 'scatter',
    chartColor: '#EE9C44',
    wearableTypes: [WEARABLE_DATA_TYPES.heartRate, WEARABLE_DATA_TYPES.restingHeartRate],
  },
  消耗: {
    key: '消耗',
    label: '卡路里',
    unit: '千卡',
    infoKey: '卡路里',
    icon: HOME_ICONS.消耗,
    route: 'ConsumptionPage',
    chartKind: 'bar',
    chartColor: '#EE9C44',
    wearableTypes: [WEARABLE_DATA_TYPES.activeEnergy],
  },
  血糖: {
    key: '血糖',
    label: '血糖',
    unit: 'mmol/L',
    infoKey: '血糖',
    icon: HOME_ICONS.血糖,
    route: 'BloodSugarPage',
    chartKind: 'scatter',
    chartColor: '#EE9C44',
    measureType: '血糖',
  },
  血压: {
    key: '血压',
    label: '血压',
    unit: 'mmHg',
    infoKey: '血压',
    icon: HOME_ICONS.血压,
    route: 'BloodPressurePage',
    chartKind: 'scatter',
    chartColor: '#FB4550',
    measureType: '血压',
  },
  步数: {
    key: '步数',
    label: '步数',
    unit: '步',
    infoKey: '步数',
    icon: HOME_ICONS.步数,
    route: 'StepsPage',
    chartKind: 'progress',
    chartColor: '#72A1C5',
    wearableTypes: [WEARABLE_DATA_TYPES.steps],
  },
  睡眠: {
    key: '睡眠',
    label: '睡眠',
    unit: '小时',
    infoKey: '睡眠',
    icon: HOME_ICONS.睡眠,
    route: 'SleepPage',
    chartKind: 'progress',
    chartColor: '#8f85f5',
    wearableTypes: [WEARABLE_DATA_TYPES.sleep],
  },
  血氧: {
    key: '血氧',
    label: '血氧',
    unit: '%',
    infoKey: '血氧',
    icon: HOME_ICONS.血氧,
    route: 'BloodOxygenPage',
    chartKind: 'scatter',
    chartColor: '#72A1C5',
    wearableTypes: [WEARABLE_DATA_TYPES.oxygen],
  },
  体温: {
    key: '体温',
    label: '体温',
    unit: '℃',
    infoKey: '体温',
    icon: HOME_ICONS.体温,
    route: 'BodyTemperaturePage',
    chartKind: 'scatter',
    chartColor: '#EE9C44',
    measureType: '体温',
  },
  体重: {
    key: '体重',
    label: '体重',
    unit: 'kg',
    infoKey: '体重',
    icon: HOME_ICONS.体重,
    route: 'WeightPage',
    chartKind: 'scatter',
    chartColor: '#0951AE',
    measureType: '体重',
  },
  血脂: {
    key: '血脂',
    label: '血脂',
    unit: 'TC mmol/L',
    infoKey: '血脂',
    icon: HOME_ICONS.血脂,
    route: 'BloodLipidPage',
    chartKind: 'scatter',
    chartColor: '#EE9C44',
    measureType: '血脂',
  },
  尿酸: {
    key: '尿酸',
    label: '尿酸',
    unit: 'μmol/L',
    infoKey: '尿酸',
    icon: HOME_ICONS.尿酸,
    route: 'UricAcidPage',
    chartKind: 'scatter',
    chartColor: '#6D925E',
    measureType: '尿酸',
  },
};

function toSparklineValues(series: { value: number }[]) {
  const values = series.map(point => point.value).filter(value => value > 0);
  if (values.length >= 2) return values;
  if (values.length === 1) return [values[0], values[0]];
  return [];
}

function parseSleepHours(durationText: string) {
  const hourMatch = durationText.match(/(\d+(?:\.\d+)?)\s*小时/);
  const minuteMatch = durationText.match(/(\d+)\s*分钟/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  if (!Number.isFinite(hours) && !Number.isFinite(minutes)) return 0;
  return Math.max(0, hours) + Math.max(0, minutes) / 60;
}

function getLatestTodayMeasureItem(items: MeasureDataItem[]) {
  const ranged = filterMeasureItemsInRange(items, 'today');
  return ranged.length ? ranged[ranged.length - 1] : undefined;
}

function formatGlucoseSubtitle(status?: string | null) {
  const text = status?.trim();
  if (!text) return '--';
  return text === '餐后' ? '餐后2小时' : text;
}

function formatMeasureStatusSubtitle(status?: string | null) {
  const text = status?.trim();
  return text ? `测量状态：${text}` : '测量状态：--';
}

const HOME_BLUR_SUBTITLE = {
  血氧: '正常范围：95-100',
  体温: '正常范围：36-37.2',
  体重: 'BMI：18.5-23.9',
  血脂: '总胆固醇',
} as const;

export function resolveHomeBlurDynamicVitalKey(
  type?: string | null,
): VitalIndexKey {
  const trimmed = type?.trim();
  if (trimmed && isVitalIndexKey(trimmed) && !HOME_BLUR_FIXED_KEYS.includes(trimmed)) {
    return trimmed;
  }
  return HOME_BLUR_DEFAULT_DYNAMIC_KEY;
}

/** 前两格固定心率 / 消耗，第三格由个性化动态指标接口决定 */
export function getHomeBlurVitalKeys(dynamicType?: string | null): VitalIndexKey[] {
  return [...HOME_BLUR_FIXED_KEYS, resolveHomeBlurDynamicVitalKey(dynamicType)].slice(
    0,
    HOME_BLUR_VITAL_COUNT,
  );
}

export function collectHomeBlurVitalFetchPlan(keys: VitalIndexKey[]) {
  const measureTypes = new Set<MeasureDataType>();
  const wearableTypes = new Set<WearableDataType>();

  for (const key of keys) {
    const meta = HOME_BLUR_VITAL_META[key];
    if (meta.measureType) measureTypes.add(meta.measureType);
    for (const type of meta.wearableTypes ?? []) {
      wearableTypes.add(type);
    }
  }

  return {
    measureTypes: [...measureTypes],
    wearableTypes: [...wearableTypes],
  };
}

export function buildHomeBlurVitalCards(
  keys: VitalIndexKey[],
  bag: HomeBlurVitalDataBag,
): HomeBlurVitalCardView[] {
  return keys.map(key => {
    const meta = HOME_BLUR_VITAL_META[key];
    const base = {
      key: meta.key,
      label: meta.label,
      unit: meta.unit,
      infoKey: meta.infoKey,
      icon: meta.icon,
      route: meta.route,
      chartKind: meta.chartKind,
      chartColor: meta.chartColor,
      sparkline: [] as number[],
      progress: 0,
      value: '--',
      subtitle: '--',
    };

    switch (key) {
      case '心率': {
        const heartItems = bag.wearableByType[WEARABLE_DATA_TYPES.heartRate] ?? [];
        const restingItems = bag.wearableByType[WEARABLE_DATA_TYPES.restingHeartRate] ?? [];
        const display = getHeartRateDisplay(heartItems);
        const resting = resolveRestingHeartRateDisplay(restingItems, 'today');
        return {
          ...base,
          value: display.value,
          subtitle: `静息心率:${resting}次/分`,
          sparkline: toSparklineValues(buildWearableHeartRateSeries(heartItems, 'today')),
        };
      }
      case '消耗': {
        const items = bag.wearableByType[WEARABLE_DATA_TYPES.activeEnergy] ?? [];
        // 与 VitalsPage energySummary 同源：getEnergySummary → barSeries
        const summary = getEnergySummary(items, [], 'today');
        const total = summary.total === '--' ? 0 : Number(summary.total);
        const barValues = summary.barSeries
          .map(item => item.value)
          .filter(value => Number.isFinite(value) && value > 0);
        const sparkline =
          barValues.length > 0
            ? barValues
            : total > 0
              ? [total]
              : [];
        return {
          ...base,
          value: summary.total,
          unit: summary.unit,
          subtitle: `目标：${bag.energyGoal}千卡`,
          chartColor: '#EE9C44',
          progress: calcNutritionProgress(total, bag.energyGoal),
          sparkline,
        };
      }
      case '血糖': {
        const items = bag.measureByType.血糖 ?? [];
        const display = formatSingleValueFromItems(items, '血糖', 'today');
        const latest = getLatestTodayMeasureItem(items);
        return {
          ...base,
          value: display.value,
          subtitle: formatGlucoseSubtitle(latest?.measurementStatus),
          sparkline: toSparklineValues(buildSingleValueSeries(items, 'today')),
        };
      }
      case '血压': {
        const items = bag.measureByType.血压 ?? [];
        const display = formatBloodPressureFromItems(items, 'today');
        const latest = getLatestTodayMeasureItem(items);
        return {
          ...base,
          value: display.value,
          subtitle: formatMeasureStatusSubtitle(latest?.measurementStatus),
          sparkline: toSparklineValues(
            buildBloodPressureSeriesFromItems(items, 'today').map(point => ({
              value: point.high,
            })),
          ),
        };
      }
      case '步数': {
        const items = bag.wearableByType[WEARABLE_DATA_TYPES.steps] ?? [];
        const summary = getStepsSummary(items, 'today', bag.stepGoal);
        const stepsNum = summary.value === '--' ? 0 : Number(summary.value);
        return {
          ...base,
          value: summary.value,
          subtitle: `目标：${bag.stepGoal}步`,
          progress: calcNutritionProgress(stepsNum, bag.stepGoal),
        };
      }
      case '睡眠': {
        const items = bag.wearableByType[WEARABLE_DATA_TYPES.sleep] ?? [];
        const summary = getSleepSummary(items, 'today');
        const hours = parseSleepHours(summary.duration);
        const value =
          summary.duration === '--' || hours <= 0
            ? '--'
            : Number.isInteger(hours)
              ? String(hours)
              : hours.toFixed(1);
        return {
          ...base,
          value,
          unit: '小时',
          subtitle: `目标：${bag.sleepGoalHours}小时`,
          progress: calcNutritionProgress(hours, bag.sleepGoalHours),
        };
      }
      case '血氧': {
        const items = bag.wearableByType[WEARABLE_DATA_TYPES.oxygen] ?? [];
        const display = getBloodOxygenDisplay(items);
        return {
          ...base,
          value: display.value,
          subtitle: HOME_BLUR_SUBTITLE.血氧,
          sparkline: toSparklineValues(buildWearableOxygenSeries(items, 'today')),
        };
      }
      case '体温': {
        const items = bag.measureByType.体温 ?? [];
        const latest = getLatestTodayMeasureItem(items);
        const display = formatBodyTemperatureDisplay(latest);
        return {
          ...base,
          value: display.value,
          subtitle: HOME_BLUR_SUBTITLE.体温,
          sparkline: toSparklineValues(buildSingleValueSeries(items, 'today')),
        };
      }
      case '体重': {
        const items = bag.measureByType.体重 ?? [];
        const display = formatWeightFromItemsForVitals(items, 'today');
        return {
          ...base,
          value: display.value,
          subtitle: HOME_BLUR_SUBTITLE.体重,
          sparkline: toSparklineValues(buildSingleValueSeries(items, 'today')),
        };
      }
      case '血脂': {
        const items = bag.measureByType.血脂 ?? [];
        const display = formatBloodLipidsFromItems(items, 'today');
        return {
          ...base,
          value: display.tcValue,
          subtitle: HOME_BLUR_SUBTITLE.血脂,
          sparkline: toSparklineValues(buildBloodLipidTcSeries(items, 'today')),
        };
      }
      case '尿酸': {
        const items = bag.measureByType.尿酸 ?? [];
        const display = formatUricAcidFromItems(items, 'today', bag.userGender);
        const latest = getLatestTodayMeasureItem(items);
        return {
          ...base,
          value: display.value,
          subtitle: formatMeasureStatusSubtitle(latest?.measurementStatus),
          sparkline: toSparklineValues(buildSingleValueSeries(items, 'today')),
        };
      }
      default:
        return base;
    }
  });
}
