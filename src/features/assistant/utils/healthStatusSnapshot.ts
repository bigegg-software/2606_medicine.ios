import type { BloodGlucosePoint } from '@/src/features/profile/components/BloodGlucoseChart';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import type { BloodOxygenPoint } from '@/src/features/profile/components/BloodOxygenChart';
import type { BloodLipidPoint } from '@/src/features/profile/components/BloodLipidChart';
import type { BodyTemperaturePoint } from '@/src/features/profile/components/BodyTemperatureChart';
import type { HeartRatePoint } from '@/src/features/profile/components/HeartRateChart';
import type { SleepStageTimelineSegment } from '@/src/features/profile/components/sleepStageChartHelpers';
import type { StepsBarPoint } from '@/src/features/profile/components/StepsChart';
import type { UricAcidPoint } from '@/src/features/profile/components/UricAcidChart';
import type { WeightPoint } from '@/src/features/profile/components/WeightChart';
import {
  formatWeightVitalsDisplay,
} from '@/src/features/profile/vitals/detail/helpers/weight';
import {
  buildBloodGlucoseSeriesFromItems,
  buildBloodLipidTcSeries,
  buildBloodPressureSeriesFromItems,
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  buildWearableOxygenSeries,
  formatBloodLipidsFromItems,
  formatBloodOxygenFromItem,
  formatHeartRateFromItem,
  formatMeasureDataTime,
  formatMeasureDisplay,
  formatUricAcidFromItems,
  getBloodOxygenDisplayDataTime,
  getEnergyDisplayDataTime,
  getEnergySummary,
  getHeartRateDisplayDataTime,
  getLatestWearableItem,
  getSleepDisplayDataTime,
  getSleepSummary,
  getStepsDisplayDataTime,
  getStepsSummary,
  toHourPoints,
} from '@/src/features/profile/vitals/vitalsHelpers';
import {
  HEALTH_STATUS_VITAL_ORDER,
  type HealthStatusVitalKey,
  type TodayHealthStatusVitalsData,
} from './healthStatusVitals';

export type HealthStatusChartSnapshot =
  | { kind: 'heart_rate'; points: HeartRatePoint[] }
  | { kind: 'bar'; points: StepsBarPoint[]; metricLabel?: string; valueUnit?: string }
  | { kind: 'glucose'; points: BloodGlucosePoint[] }
  | { kind: 'blood_pressure'; points: BloodPressurePoint[] }
  | { kind: 'sleep'; segments: SleepStageTimelineSegment[] }
  | { kind: 'blood_oxygen'; points: BloodOxygenPoint[] }
  | { kind: 'body_temperature'; points: BodyTemperaturePoint[] }
  | { kind: 'weight'; points: WeightPoint[] }
  | { kind: 'lipid'; points: BloodLipidPoint[] }
  | { kind: 'uric_acid'; points: UricAcidPoint[] };

export type HealthStatusVitalSlide = {
  key: HealthStatusVitalKey;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
  dataTime: string;
  chart: HealthStatusChartSnapshot;
};

function stripStatusPrefix(status: string) {
  return status.replace(/^・/, '');
}

/** 无数值时统一展示「暂无数据」 */
function resolveEmptyStatus(value: string, status: string, statusColor: string) {
  const normalizedStatus = stripStatusPrefix(status).trim();
  const isEmptyValue = !value || value === '--';
  if (isEmptyValue && (!normalizedStatus || normalizedStatus === '--')) {
    return { status: '暂无数据', statusColor: '#999999' };
  }
  return {
    status: normalizedStatus,
    statusColor: normalizedStatus === '暂无数据' ? '#999999' : statusColor,
  };
}

function normalizeChart(raw: unknown): HealthStatusChartSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const chart = raw as HealthStatusChartSnapshot;
  if (chart.kind === 'lipid') {
    if (Array.isArray(chart.points)) {
      return { kind: 'lipid', points: chart.points };
    }
    // 兼容旧版 TG/HDL/LDL 文案快照
    return { kind: 'lipid', points: [] };
  }
  if (chart.kind === 'sleep' && Array.isArray(chart.segments)) {
    return { kind: 'sleep', segments: chart.segments };
  }
  if ('points' in chart && Array.isArray(chart.points)) {
    return chart;
  }
  return null;
}

function normalizeSlide(raw: unknown): HealthStatusVitalSlide | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<HealthStatusVitalSlide>;
  if (!item.key || !HEALTH_STATUS_VITAL_ORDER.includes(item.key)) return null;
  const chart = normalizeChart(item.chart);
  if (!chart) return null;
  const value = item.value ?? '--';
  const resolved = resolveEmptyStatus(value, item.status ?? '', item.statusColor ?? '#999999');
  return {
    key: item.key,
    value,
    unit: item.key === '睡眠' ? '' : item.unit ?? '',
    status: resolved.status,
    statusColor: resolved.statusColor,
    dataTime: item.dataTime ?? '',
    chart,
  };
}

export function normalizeHealthStatusSlides(raw?: unknown): HealthStatusVitalSlide[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSlide).filter((item): item is HealthStatusVitalSlide => item != null);
}

export function parseHealthStatusSlidesFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
): HealthStatusVitalSlide[] | null {
  const respData = interfaceData?.respData as { slides?: unknown } | undefined;
  const slides = normalizeHealthStatusSlides(respData?.slides);
  return slides.length ? slides : null;
}

function toVitalSlide(params: {
  key: HealthStatusVitalKey;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
  dataTime: string;
  chart: HealthStatusChartSnapshot;
}): HealthStatusVitalSlide {
  const resolved = resolveEmptyStatus(params.value, params.status, params.statusColor);
  return {
    key: params.key,
    value: params.value,
    unit: params.key === '睡眠' ? '' : params.unit,
    status: resolved.status,
    statusColor: resolved.statusColor,
    dataTime: params.dataTime,
    chart: params.chart,
  };
}

export function buildHealthStatusVitalsSlides(
  data: TodayHealthStatusVitalsData,
  options: {
    stepTarget: number;
    energyTarget: number;
    gender?: string | null;
  },
): HealthStatusVitalSlide[] {
  const range = 'today' as const;
  const {
    measureData,
    latestMeasure,
    weightData,
    latestWeight,
    wearableSleep,
    wearableSteps,
    wearableOxygen,
    wearableHeartRate,
    wearableActiveEnergy,
    wearableBasalEnergy,
  } = data;
  const { stepTarget, energyTarget, gender } = options;

  const heartRateSeries = buildWearableHeartRateSeries(wearableHeartRate, range);
  const heartRate = formatHeartRateFromItem(getLatestWearableItem(wearableHeartRate));

  const energySummary = getEnergySummary(wearableActiveEnergy, wearableBasalEnergy, range, energyTarget);
  const energyBarData = energySummary.barSeries.map(item => ({ label: item.label, value: item.value }));

  const glucoseSeries = buildBloodGlucoseSeriesFromItems(measureData.bloodGlucose, range);
  const glucose = formatMeasureDisplay(latestMeasure.bloodGlucose, '血糖');

  const bloodPressureSeries = buildBloodPressureSeriesFromItems(measureData.bloodPressure, range);
  const bloodPressure = formatMeasureDisplay(latestMeasure.bloodPressure, '血压');

  const stepsSummary = getStepsSummary(wearableSteps, range, stepTarget);
  const stepsBarData = stepsSummary.barSeries.map(item => ({ label: item.label, value: item.value }));

  const sleepSummary = getSleepSummary(wearableSleep, range);

  const bloodOxygenSeries = buildWearableOxygenSeries(wearableOxygen, range);
  const bloodOxygen = formatBloodOxygenFromItem(getLatestWearableItem(wearableOxygen));

  const bodyTemperatureSeries = buildSingleValueSeries(measureData.bodyTemperature, range);
  const bodyTemperature = formatMeasureDisplay(latestMeasure.bodyTemperature, '体温');

  const weightSeries = buildSingleValueSeries(weightData, range);
  const weight = formatWeightVitalsDisplay(latestWeight);

  const bloodLipids = latestMeasure.bloodLipids
    ? formatBloodLipidsFromItems([latestMeasure.bloodLipids], range)
    : formatBloodLipidsFromItems(measureData.bloodLipids, range);
  const bloodLipidsSeries = buildBloodLipidTcSeries(measureData.bloodLipids, range);

  const uricAcidSeries = buildSingleValueSeries(measureData.uricAcid, range);
  const uricAcid = latestMeasure.uricAcid
    ? formatUricAcidFromItems([latestMeasure.uricAcid], range, gender)
    : formatUricAcidFromItems(measureData.uricAcid, range, gender);

  const slideMap: Record<HealthStatusVitalKey, HealthStatusVitalSlide> = {
    心率: toVitalSlide({
      key: '心率',
      value: heartRate.value,
      unit: '次/分钟',
      status: heartRate.status,
      statusColor: heartRate.statusColor,
      dataTime: getHeartRateDisplayDataTime(wearableHeartRate, range),
      chart: { kind: 'heart_rate', points: toHourPoints(heartRateSeries) },
    }),
    消耗: toVitalSlide({
      key: '消耗',
      value: energySummary.total,
      unit: energySummary.unit,
      status: energySummary.status,
      statusColor: energySummary.statusColor,
      dataTime: getEnergyDisplayDataTime(wearableActiveEnergy, wearableBasalEnergy, range),
      chart: {
        kind: 'bar',
        points: energyBarData,
        metricLabel: '消耗',
        valueUnit: '千卡',
      },
    }),
    血糖: toVitalSlide({
      key: '血糖',
      value: glucose.value,
      unit: 'mmol/L',
      status: glucose.status,
      statusColor: glucose.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bloodGlucose),
      chart: { kind: 'glucose', points: glucoseSeries },
    }),
    血压: toVitalSlide({
      key: '血压',
      value: bloodPressure.value,
      unit: 'mmHg',
      status: bloodPressure.status,
      statusColor: bloodPressure.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bloodPressure),
      chart: { kind: 'blood_pressure', points: bloodPressureSeries },
    }),
    步数: toVitalSlide({
      key: '步数',
      value: stepsSummary.value,
      unit: stepsSummary.unit,
      status: stepsSummary.status,
      statusColor: stepsSummary.statusColor,
      dataTime: getStepsDisplayDataTime(wearableSteps, range),
      chart: { kind: 'bar', points: stepsBarData },
    }),
    睡眠: toVitalSlide({
      key: '睡眠',
      value: sleepSummary.duration,
      unit: '',
      status: sleepSummary.quality.label,
      statusColor: sleepSummary.quality.color,
      dataTime: getSleepDisplayDataTime(wearableSleep, range),
      chart: { kind: 'sleep', segments: sleepSummary.stageTimeline },
    }),
    血氧: toVitalSlide({
      key: '血氧',
      value: bloodOxygen.value,
      unit: '%',
      status: bloodOxygen.status,
      statusColor: bloodOxygen.statusColor,
      dataTime: getBloodOxygenDisplayDataTime(wearableOxygen, range),
      chart: { kind: 'blood_oxygen', points: toHourPoints(bloodOxygenSeries) },
    }),
    体温: toVitalSlide({
      key: '体温',
      value: bodyTemperature.value,
      unit: '℃',
      status: bodyTemperature.status,
      statusColor: bodyTemperature.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bodyTemperature),
      chart: { kind: 'body_temperature', points: toHourPoints(bodyTemperatureSeries) },
    }),
    体重: toVitalSlide({
      key: '体重',
      value: weight.value,
      unit: 'kg',
      status: weight.status,
      statusColor: weight.statusColor,
      dataTime: formatMeasureDataTime(latestWeight),
      chart: { kind: 'weight', points: toHourPoints(weightSeries) },
    }),
    血脂: toVitalSlide({
      key: '血脂',
      value: bloodLipids.tcValue,
      unit: 'mmol/L',
      status: bloodLipids.status || bloodLipids.tcStatus,
      statusColor: bloodLipids.statusColor || bloodLipids.tcStatusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bloodLipids),
      chart: { kind: 'lipid', points: toHourPoints(bloodLipidsSeries) },
    }),
    尿酸: toVitalSlide({
      key: '尿酸',
      value: uricAcid.value,
      unit: 'μmol/L',
      status: uricAcid.statusLabel,
      statusColor: uricAcid.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.uricAcid),
      chart: { kind: 'uric_acid', points: toHourPoints(uricAcidSeries) },
    }),
  };

  return HEALTH_STATUS_VITAL_ORDER.map(key => slideMap[key]);
}
