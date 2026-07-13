import type { BloodGlucosePoint } from '@/src/features/profile/components/BloodGlucoseChart';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import type { BloodOxygenPoint } from '@/src/features/profile/components/BloodOxygenChart';
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
  | { kind: 'lipid'; tg: string; hdl: string; ldl: string }
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

function normalizeChart(raw: unknown): HealthStatusChartSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const chart = raw as HealthStatusChartSnapshot;
  if (chart.kind === 'lipid') {
    return {
      kind: 'lipid',
      tg: chart.tg ?? '--',
      hdl: chart.hdl ?? '--',
      ldl: chart.ldl ?? '--',
    };
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
  return {
    key: item.key,
    value: item.value ?? '--',
    unit: item.key === '睡眠' ? '' : item.unit ?? '',
    status: item.status ?? '',
    statusColor: item.statusColor ?? '#999999',
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
  const glucose = latestMeasure.bloodGlucose
    ? formatMeasureDisplay(latestMeasure.bloodGlucose, '血糖')
    : { value: '--', status: '', statusColor: '#999999' };

  const bloodPressureSeries = buildBloodPressureSeriesFromItems(measureData.bloodPressure, range);
  const bloodPressure = latestMeasure.bloodPressure
    ? formatMeasureDisplay(latestMeasure.bloodPressure, '血压')
    : { value: '--', status: '', statusColor: '#999999' };

  const stepsSummary = getStepsSummary(wearableSteps, range, stepTarget);
  const stepsBarData = stepsSummary.barSeries.map(item => ({ label: item.label, value: item.value }));

  const sleepSummary = getSleepSummary(wearableSleep, range);

  const bloodOxygenSeries = buildWearableOxygenSeries(wearableOxygen, range);
  const bloodOxygen = formatBloodOxygenFromItem(getLatestWearableItem(wearableOxygen));

  const bodyTemperatureSeries = buildSingleValueSeries(measureData.bodyTemperature, range);
  const bodyTemperature = latestMeasure.bodyTemperature
    ? formatMeasureDisplay(latestMeasure.bodyTemperature, '体温')
    : { value: '--', status: '', statusColor: '#999999' };

  const weightSeries = buildSingleValueSeries(weightData, range);
  const weight = latestWeight
    ? formatWeightVitalsDisplay(latestWeight)
    : { value: '--', status: '', statusColor: '#999999' };

  const bloodLipids = latestMeasure.bloodLipids
    ? formatBloodLipidsFromItems([latestMeasure.bloodLipids], range)
    : formatBloodLipidsFromItems(measureData.bloodLipids, range);

  const uricAcidSeries = buildSingleValueSeries(measureData.uricAcid, range);
  const uricAcid = latestMeasure.uricAcid
    ? formatUricAcidFromItems([latestMeasure.uricAcid], range, gender)
    : formatUricAcidFromItems(measureData.uricAcid, range, gender);

  const slideMap: Record<HealthStatusVitalKey, HealthStatusVitalSlide> = {
    心率: {
      key: '心率',
      value: heartRate.value,
      unit: '次/分钟',
      status: stripStatusPrefix(heartRate.status),
      statusColor: heartRate.statusColor,
      dataTime: getHeartRateDisplayDataTime(wearableHeartRate, range),
      chart: { kind: 'heart_rate', points: toHourPoints(heartRateSeries) },
    },
    消耗: {
      key: '消耗',
      value: energySummary.total,
      unit: energySummary.unit,
      status: stripStatusPrefix(energySummary.status),
      statusColor: energySummary.statusColor,
      dataTime: getEnergyDisplayDataTime(wearableActiveEnergy, wearableBasalEnergy, range),
      chart: {
        kind: 'bar',
        points: energyBarData,
        metricLabel: '消耗',
        valueUnit: '千卡',
      },
    },
    血糖: {
      key: '血糖',
      value: glucose.value,
      unit: 'mmol/L',
      status: stripStatusPrefix(glucose.status),
      statusColor: glucose.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bloodGlucose),
      chart: { kind: 'glucose', points: glucoseSeries },
    },
    血压: {
      key: '血压',
      value: bloodPressure.value,
      unit: 'mmHg',
      status: stripStatusPrefix(bloodPressure.status),
      statusColor: bloodPressure.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bloodPressure),
      chart: { kind: 'blood_pressure', points: bloodPressureSeries },
    },
    步数: {
      key: '步数',
      value: stepsSummary.value,
      unit: stepsSummary.unit,
      status: stripStatusPrefix(stepsSummary.status),
      statusColor: stepsSummary.statusColor,
      dataTime: getStepsDisplayDataTime(wearableSteps, range),
      chart: { kind: 'bar', points: stepsBarData },
    },
    睡眠: {
      key: '睡眠',
      value: sleepSummary.duration,
      unit: '',
      status: sleepSummary.quality.label,
      statusColor: sleepSummary.quality.color,
      dataTime: getSleepDisplayDataTime(wearableSleep, range),
      chart: { kind: 'sleep', segments: sleepSummary.stageTimeline },
    },
    血氧: {
      key: '血氧',
      value: bloodOxygen.value,
      unit: '%',
      status: stripStatusPrefix(bloodOxygen.status),
      statusColor: bloodOxygen.statusColor,
      dataTime: getBloodOxygenDisplayDataTime(wearableOxygen, range),
      chart: { kind: 'blood_oxygen', points: toHourPoints(bloodOxygenSeries) },
    },
    体温: {
      key: '体温',
      value: bodyTemperature.value,
      unit: '℃',
      status: stripStatusPrefix(bodyTemperature.status),
      statusColor: bodyTemperature.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bodyTemperature),
      chart: { kind: 'body_temperature', points: toHourPoints(bodyTemperatureSeries) },
    },
    体重: {
      key: '体重',
      value: weight.value,
      unit: 'kg',
      status: stripStatusPrefix(weight.status),
      statusColor: weight.statusColor,
      dataTime: formatMeasureDataTime(latestWeight),
      chart: { kind: 'weight', points: toHourPoints(weightSeries) },
    },
    血脂: {
      key: '血脂',
      value: bloodLipids.tcValue,
      unit: 'mmol/L',
      status: stripStatusPrefix(bloodLipids.status),
      statusColor: bloodLipids.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.bloodLipids),
      chart: {
        kind: 'lipid',
        tg: bloodLipids.tgValue,
        hdl: bloodLipids.hdlValue,
        ldl: bloodLipids.ldlValue,
      },
    },
    尿酸: {
      key: '尿酸',
      value: uricAcid.value,
      unit: 'μmol/L',
      status: stripStatusPrefix(uricAcid.statusLabel),
      statusColor: uricAcid.statusColor,
      dataTime: formatMeasureDataTime(latestMeasure.uricAcid),
      chart: { kind: 'uric_acid', points: toHourPoints(uricAcidSeries) },
    },
  };

  return HEALTH_STATUS_VITAL_ORDER.map(key => slideMap[key]);
}
