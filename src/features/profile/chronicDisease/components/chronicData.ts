import moment from 'moment';
import { getMeasureDataDetailByDateRange, type MeasureDataDayGroup, type MeasureDataItem, type MeasureDataType } from '@/api/measureData';
import { getWearableDataDetailByDateRange, WEARABLE_DATA_TYPES, type WearableDataItem, type WearableDataType } from '@/api/wearableData';
import { getIndexMedicationPlanGroupByTime, type IndexMedicationPlanGroupItem } from '@/api/medicationPlan';
import { getChronicDiseaseInfo, type ChronicDiseaseRecord } from '@/api/chronicDisease';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { buildDictLabelMap, getDictDataByType, DICT_TYPES, type DictDataItem } from '@/api/dict';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    buildBloodPressureSeriesFromItems,
    buildSingleValueSeries,
    buildWearableHeartRateSeries,
    buildWearableOxygenSeries,
    filterMeasureItemsInRange,
    getLevelLabel,
    getWearableReturnOriginalDataParam,
    type LabeledValue,
} from '@/src/features/profile/vitals/vitalsHelpers';
import { getLevelColor } from '@/src/features/profile/vitals/vitalLevelColors';
import type { BloodPressurePoint } from '../../components/BloodPressureChart';
import type { BloodGlucosePoint } from '../../components/BloodGlucoseChart';
import type { BloodOxygenPoint } from '../../components/BloodOxygenChart';
import type { HeartRatePoint } from '../../components/HeartRateChart';
import { collectRestingHeartRateReadings } from '@/src/features/profile/vitals/detail/helpers/shared';
import {
    loadMedicationDictMaps,
    loadMedicationPlanGroups,
    mapIndexPlanGroups,
    type MedicationDictMaps,
    type MedicationPlanGroupView,
} from '@/src/features/profile/medication/medicationHelpers';
import type { DiseaseTrendConfig, StatColumnKey } from './diseaseConfig';
import { resolveDiseaseTrendConfig } from './diseaseConfig';
import {
    resolveChronicDiseaseControlStatusFromData,
    type ChronicDiseaseControlStatus,
    CHRONIC_DISEASE_CONTROL_STATUS_LABELS,
} from './controlStatus';
import {
    resolveMainMealsRecordStatus,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';

export { type ChronicDiseaseControlStatus, CHRONIC_DISEASE_CONTROL_STATUS_LABELS };

export const MONTH_DAY_COUNT = 30;

export type TrendStats = Partial<Record<StatColumnKey, string>>;

export type TodayOverviewRecord = {
    key: string;
    /** 测量状态，如：运动后、晨起 */
    measurementStatus: string;
    time: string;
    value: string;
    /** 指标等级状态，如：正常、轻度高血压 */
    status: string;
    statusColor: string;
};

export type TodayOverviewResult = {
    mode: 'empty' | 'partial' | 'full';
    summary?: string;
    records: TodayOverviewRecord[];
    addDataType?: MeasureDataType | '血氧' | '心率';
};

export type ChronicDiseaseVitalsTodayStatus = 'measured' | 'notMeasured';
export type ChronicDiseaseMealRecordStatus = 'notRecorded' | 'inProgress' | 'achieved';

export type ChronicDiseaseDailyIndicators = {
    vitalsToday: ChronicDiseaseVitalsTodayStatus;
    pendingMedicationCount: number;
    mealRecorded: ChronicDiseaseMealRecordStatus;
    controlStatus: ChronicDiseaseControlStatus;
    lastVitalsText: string;
};

export const DEFAULT_CHRONIC_DISEASE_DAILY_INDICATORS: ChronicDiseaseDailyIndicators = {
    vitalsToday: 'notMeasured',
    pendingMedicationCount: 0,
    mealRecorded: 'notRecorded',
    controlStatus: 'stable',
    lastVitalsText: '上次体征：--',
};

export type AssociatedMedicationRow = {
    key: string;
    medicationPlanId: string;
    name: string;
    doseText: string;
    taken: boolean;
    canCheckIn: boolean;
    planType: number;
    planTypeLabel: string;
    medicationPlanTime: string;
};

export type ChronicDetailData = {
    record: ChronicDiseaseRecord | null;
    diseaseTypeLabels: Record<string, string>;
    config: DiseaseTrendConfig;
    measureItems: MeasureDataItem[];
    secondaryMeasureItems: MeasureDataItem[];
    wearableItems: WearableDataItem[];
    restingWearableItems: WearableDataItem[];
    chartLabels: string[];
    bloodPressureSeries: BloodPressurePoint[];
    singleValueSeries: LabeledValue[];
    ldlSeries: LabeledValue[];
    stats: TrendStats;
    todayOverview: TodayOverviewResult;
    associatedMedications: AssociatedMedicationRow[];
    controlStatus: ChronicDiseaseControlStatus;
};

function parseMeasureNumber(value?: number | string | null) {
    if (value == null || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function getItemTimestamp(item: MeasureDataItem) {
    const parsedDate = moment(item.customerLocalDate, ['YYYY-MM-DD', moment.ISO_8601], true);
    const base = parsedDate.isValid() ? parsedDate.clone().startOf('day') : moment().startOf('day');
    const time = item.dataTime?.trim();
    if (!time) return base;
    const parsedTime = moment(time, ['HH:mm:ss', 'HH:mm', 'H:mm'], true);
    if (parsedTime.isValid()) {
        return base.hour(parsedTime.hour()).minute(parsedTime.minute()).second(parsedTime.second());
    }
    return base;
}

function flattenMeasureItems(groups?: MeasureDataDayGroup[] | MeasureDataItem[] | null): MeasureDataItem[] {
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

function normalizeMeasureRangeData(raw: unknown): MeasureDataDayGroup[] | MeasureDataItem[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        if (Array.isArray(record.childList)) return [raw as MeasureDataDayGroup];
        if (Array.isArray(record.list)) return record.list as MeasureDataItem[];
        if (Array.isArray(record.rows)) return record.rows as MeasureDataItem[];
    }
    return [];
}

export function getMonthChartLabels() {
    return Array.from({ length: MONTH_DAY_COUNT }, (_, index) =>
        moment()
            .subtract(MONTH_DAY_COUNT - 1 - index, 'days')
            .format('M/D'),
    );
}

async function loadMeasureItems(
    type: MeasureDataType,
    range: 'today' | '7days' | 'month' = 'month',
    options?: { patientUserId?: string | number | null },
): Promise<MeasureDataItem[]> {
    try {
        const endDate = moment().format('YYYY-MM-DD');
        const startDate =
            range === 'today'
                ? endDate
                : range === '7days'
                    ? moment().subtract(6, 'days').format('YYYY-MM-DD')
                    : moment().subtract(MONTH_DAY_COUNT - 1, 'days').format('YYYY-MM-DD');
        const res = await getMeasureDataDetailByDateRange(
            { startDate, endDate, type },
            options,
        );
        if (!isResourceApiOk(res as { code?: number })) return [];
        const groups = normalizeMeasureRangeData(apiResourceData<unknown>(res as { code?: number; data?: unknown }));
        return flattenMeasureItems(groups);
    } catch {
        return [];
    }
}

async function loadWearableItems(
    type: WearableDataType,
    range: 'today' | '7days' | 'month' = 'month',
    options?: { patientUserId?: string | number | null },
): Promise<WearableDataItem[]> {
    try {
        const endDate = moment().format('YYYY-MM-DD');
        const startDate =
            range === 'today'
                ? endDate
                : range === '7days'
                    ? moment().subtract(6, 'days').format('YYYY-MM-DD')
                    : moment().subtract(MONTH_DAY_COUNT - 1, 'days').format('YYYY-MM-DD');
        const res = await getWearableDataDetailByDateRange(
            {
                startDate,
                endDate,
                type,
                ...getWearableReturnOriginalDataParam(range),
            },
            options,
        );
        if (!isResourceApiOk(res as { code?: number })) return [];
        const data = apiResourceData<WearableDataItem[]>(
            res as unknown as { code?: number; data?: WearableDataItem[] },
        );
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export async function loadDiseaseTypeLabelMap(): Promise<Record<string, string>> {
    try {
        const res = await getDictDataByType(DICT_TYPES.diseaseType);
        const items = apiResourceData<DictDataItem[]>(
            res as unknown as { code?: number; data?: DictDataItem[] },
        );
        return buildDictLabelMap(items);
    } catch {
        return {};
    }
}

function formatPercent(count: number, total: number) {
    if (total <= 0) return '--';
    return `${Math.round((count / total) * 100)}%`;
}

function formatBpPair(high?: number | null, low?: number | null) {
    if (high == null || low == null) return '--';
    return `${Math.round(high)}/${Math.round(low)}`;
}

function buildLdlSeries(items: MeasureDataItem[]): LabeledValue[] {
    const labels = getMonthChartLabels();
    const rangedItems = filterMeasureItemsInRange(items, '30Days');
    return labels.map((label, index) => {
        const day = moment()
            .subtract(MONTH_DAY_COUNT - 1 - index, 'days')
            .startOf('day');
        const bucketItems = rangedItems.filter(item => getItemTimestamp(item).isSame(day, 'day'));
        const latest = bucketItems.length ? bucketItems[bucketItems.length - 1] : undefined;
        return {
            label,
            value: parseMeasureNumber(latest?.xuezhiLdlC) ?? 0,
        };
    });
}

function computeStats(
    config: DiseaseTrendConfig,
    measureItems: MeasureDataItem[],
    secondaryMeasureItems: MeasureDataItem[],
    wearableItems: WearableDataItem[],
    restingWearableItems: WearableDataItem[] = [],
): TrendStats {
    const stats: TrendStats = {};

    if (config.chartKind === 'bloodPressure') {
        const readings = measureItems
            .map(item => ({ high: parseMeasureNumber(item.val), low: parseMeasureNumber(item.val2) }))
            .filter((item): item is { high: number; low: number } => item.high != null && item.low != null && item.high > 0 && item.low > 0);
        if (!readings.length) return { complianceRate: '--', maxBp: '--', minBp: '--', bpComplianceRate: '--' };
        const compliant = readings.filter(item => item.high < 140 && item.low < 90).length;
        const maxReading = readings.reduce((max, item) => (item.high > max.high ? item : max), readings[0]);
        const minReading = readings.reduce((min, item) => (item.high < min.high ? item : min), readings[0]);
        const rate = formatPercent(compliant, readings.length);
        stats.complianceRate = rate;
        stats.bpComplianceRate = rate;
        stats.maxBp = formatBpPair(maxReading.high, maxReading.low);
        stats.minBp = formatBpPair(minReading.high, minReading.low);
        return stats;
    }

    if (config.chartKind === 'bloodGlucose') {
        const values = measureItems.map(item => parseMeasureNumber(item.val)).filter((v): v is number => v != null && v > 0);
        if (!values.length) return { complianceRate: '--', maxGlucose: '--', avgGlucose: '--' };
        const compliant = values.filter(v => v <= 7.0).length;
        stats.complianceRate = formatPercent(compliant, values.length);
        stats.maxGlucose = String(Math.max(...values).toFixed(1));
        stats.avgGlucose = String((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1));
        return stats;
    }

    if (config.chartKind === 'bloodLipids') {
        const values = measureItems
            .map(item => parseMeasureNumber(item.xuezhiLdlC))
            .filter((v): v is number => v != null && v > 0);
        if (!values.length) return { ldlComplianceRate: '--', maxLdl: '--', latestLdl: '--' };
        const compliant = values.filter(v => v < 3.4).length;
        stats.ldlComplianceRate = formatPercent(compliant, values.length);
        stats.maxLdl = Math.max(...values).toFixed(2);
        const latest = measureItems
            .map(item => parseMeasureNumber(item.xuezhiLdlC))
            .filter((v): v is number => v != null && v > 0)
            .at(-1);
        stats.latestLdl = latest != null ? latest.toFixed(2) : '--';
        return stats;
    }

    if (config.chartKind === 'heartRate') {
        const heartSeries = buildWearableHeartRateSeries(wearableItems, '30Days');
        const heartValues = heartSeries.map(item => item.value).filter(v => v > 0);
        const restingValues = collectRestingHeartRateReadings(restingWearableItems).map(item => item.value);
        const bpReadings = secondaryMeasureItems
            .map(item => ({ high: parseMeasureNumber(item.val), low: parseMeasureNumber(item.val2) }))
            .filter((item): item is { high: number; low: number } => item.high != null && item.low != null && item.high > 0 && item.low > 0);
        stats.avgRestingHeartRate = restingValues.length
            ? String(Math.round(restingValues.reduce((sum, v) => sum + v, 0) / restingValues.length))
            : '--';
        stats.heartRateComplianceRate = heartValues.length
            ? formatPercent(heartValues.filter(v => v >= 60 && v <= 100).length, heartValues.length)
            : '--';
        stats.bpComplianceRate = bpReadings.length
            ? formatPercent(bpReadings.filter(item => item.high < 140 && item.low < 90).length, bpReadings.length)
            : '--';
        return stats;
    }

    if (config.chartKind === 'uricAcid') {
        const values = measureItems.map(item => parseMeasureNumber(item.val)).filter((v): v is number => v != null && v > 0);
        if (!values.length) return { uricAcidComplianceRate: '--', maxUricAcid: '--', latestUricAcid: '--' };
        const compliant = values.filter(v => v <= 420).length;
        stats.uricAcidComplianceRate = formatPercent(compliant, values.length);
        stats.maxUricAcid = String(Math.round(Math.max(...values)));
        stats.latestUricAcid = String(Math.round(values[values.length - 1]));
        return stats;
    }

    const oxygenSeries = buildWearableOxygenSeries(wearableItems, '30Days');
    const oxygenValues = oxygenSeries.map(item => item.value).filter(v => v > 0);
    if (!oxygenValues.length) return { oxygenComplianceRate: '--', minOxygen: '--', avgOxygen: '--' };
    stats.oxygenComplianceRate = formatPercent(oxygenValues.filter(v => v >= 95).length, oxygenValues.length);
    stats.minOxygen = `${Math.round(Math.min(...oxygenValues))}%`;
    stats.avgOxygen = `${Math.round(oxygenValues.reduce((sum, v) => sum + v, 0) / oxygenValues.length)}%`;
    return stats;
}

function formatTodayRecordStatus(item: MeasureDataItem): { status: string; statusColor: string } {
    const status = getLevelLabel(item) || '正常';
    return {
        status,
        statusColor: getLevelColor(status),
    };
}

function formatWearableRecordStatus(item: WearableDataItem): { status: string; statusColor: string } {
    if (item.isHigh === 1) {
        return { status: '偏高', statusColor: getLevelColor('偏高') };
    }
    if (item.isLow === 1 || item.isLow === 2 || item.isLow === 3) {
        return { status: '偏低', statusColor: getLevelColor('偏低') };
    }
    return { status: '正常', statusColor: getLevelColor('正常') };
}

function formatMeasureTime(item: MeasureDataItem): string {
    const time = item.dataTime?.trim();
    if (!time) return '--';
    const parsed = moment(time, ['HH:mm:ss', 'HH:mm', 'H:mm'], true);
    return parsed.isValid() ? parsed.format('HH:mm') : time;
}

function formatTodayMeasurementStatus(
    config: DiseaseTrendConfig,
    item: MeasureDataItem,
    ts: moment.Moment,
): string {
    const status = item.measurementStatus?.trim();
    if (status) return status;
    if (config.chartKind === 'bloodPressure') {
        if (ts.hour() < 12) return '晨起';
        if (ts.hour() >= 17) return '晚餐后';
        return '静息';
    }
    return config.overviewMeasureName;
}

function formatTodayRecordValue(config: DiseaseTrendConfig, item: MeasureDataItem): string {
    if (config.chartKind === 'bloodPressure') {
        const high = parseMeasureNumber(item.val);
        const low = parseMeasureNumber(item.val2);
        if (high != null && low != null) return `${Math.round(high)}/${Math.round(low)}`;
        return '--';
    }
    if (config.chartKind === 'bloodLipids') {
        const ldl = parseMeasureNumber(item.xuezhiLdlC);
        return ldl != null ? `LDL ${ldl.toFixed(2)}` : '--';
    }
    const val = parseMeasureNumber(item.val);
    if (val == null) return '--';
    if (config.chartKind === 'bloodGlucose') return `${val.toFixed(1)} mmol/L`;
    if (config.chartKind === 'uricAcid') return `${Math.round(val)} μmol/L`;
    return String(val);
}

function isValidTodayMeasureItem(config: DiseaseTrendConfig, item: MeasureDataItem): boolean {
    if (config.chartKind === 'bloodPressure') {
        const high = parseMeasureNumber(item.val);
        const low = parseMeasureNumber(item.val2);
        return high != null && low != null && high > 0 && low > 0;
    }
    if (config.chartKind === 'bloodLipids') {
        return (parseMeasureNumber(item.xuezhiLdlC) ?? 0) > 0;
    }
    return (parseMeasureNumber(item.val) ?? 0) > 0;
}

function buildTodayOverviewFromMeasure(
    config: DiseaseTrendConfig,
    items: MeasureDataItem[],
): TodayOverviewResult {
    const today = moment().startOf('day');
    const records = items
        .filter(item => getItemTimestamp(item).isSame(today, 'day'))
        .filter(item => isValidTodayMeasureItem(config, item))
        .sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf())
        .map((item, index) => {
            const ts = getItemTimestamp(item);
            const { status, statusColor } = formatTodayRecordStatus(item);
            return {
                key: String(item.id ?? `today-${index}`),
                measurementStatus: formatTodayMeasurementStatus(config, item, ts),
                time: formatMeasureTime(item),
                value: formatTodayRecordValue(config, item),
                status,
                statusColor,
            };
        });

    if (records.length === 0) {
        return { mode: 'empty', records: [], addDataType: config.addDataType };
    }
    if (records.length >= config.expectedDailyCount) {
        return { mode: 'full', records, addDataType: config.addDataType };
    }
    return {
        mode: 'partial',
        summary: `已监测${records.length}项`,
        records,
        addDataType: config.addDataType,
    };
}

function buildTodayOverviewFromWearable(
    config: DiseaseTrendConfig,
    items: WearableDataItem[],
    label: string,
    formatValue: (value: number) => string,
): TodayOverviewResult {
    const today = moment().startOf('day');
    const records: TodayOverviewRecord[] = [];
    items.forEach((item, itemIndex) => {
        const date = moment(item.customerLocalDate ?? item.dataDate, ['YYYY-MM-DD', moment.ISO_8601], true);
        if (!date.isValid() || !date.isSame(today, 'day')) return;
        const time = item.startTimeStr?.trim() || item.endTimeStr?.trim() || '--';
        const value = config.chartKind === 'heartRate'
            ? parseMeasureNumber(item.heartRate ?? item.newHeartRate)
            : parseMeasureNumber(item.newOxygenSaturation ?? item.maxOxygenSaturation);
        if (value == null || value <= 0) return;
        records.push({
            key: `${item.wearableDataId ?? itemIndex}`,
            measurementStatus: label,
            time: time.length > 5 ? moment(time).format('HH:mm') : time,
            value: formatValue(value),
            ...formatWearableRecordStatus(item),
        });
    });

    if (records.length === 0) {
        return { mode: 'empty', records: [], addDataType: config.addDataType };
    }
    if (records.length >= config.expectedDailyCount) {
        return { mode: 'full', records, addDataType: config.addDataType };
    }
    return {
        mode: 'partial',
        summary: `已监测${records.length}项`,
        records,
        addDataType: config.addDataType,
    };
}

function formatPlanTimeLabel(time?: string) {
    if (!time?.trim()) return '--';
    const parsed = moment(time, [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'HH:mm', 'H:mm'], true);
    return parsed.isValid() ? parsed.format('HH:mm') : time;
}

function compareMedicationPlanTime(a?: string, b?: string) {
    const timeA = formatPlanTimeLabel(a);
    const timeB = formatPlanTimeLabel(b);
    if (timeA === '--' && timeB === '--') return 0;
    if (timeA === '--') return 1;
    if (timeB === '--') return -1;
    return timeA.localeCompare(timeB);
}

function buildAssociatedMedicationRows(
    record: ChronicDiseaseRecord | null,
    planGroups: MedicationPlanGroupView[],
): AssociatedMedicationRow[] {
    const associationIds = new Set((record?.associationMedicationPlanIds ?? []).map(id => String(id)));
    const rows: AssociatedMedicationRow[] = [];

    planGroups.forEach(group => {
        group.items.forEach(item => {
            if (!associationIds.has(item.medicationPlanId)) return;
            const time = item.medicationPlanTime || group.time;
            rows.push({
                key: item.key,
                medicationPlanId: item.medicationPlanId,
                name: item.name,
                doseText: item.doseText,
                taken: item.taken,
                canCheckIn: item.canCheckIn,
                planType: item.planType,
                planTypeLabel: item.planTypeLabel,
                medicationPlanTime: time,
            });
        });
    });

    return rows.sort((a, b) => compareMedicationPlanTime(a.medicationPlanTime, b.medicationPlanTime));
}

function resolveVitalsTodayStatus(
    config: DiseaseTrendConfig,
    measureItems: MeasureDataItem[],
    wearableItems: WearableDataItem[],
): ChronicDiseaseVitalsTodayStatus {
    const overview =
        config.wearableType && (config.chartKind === 'heartRate' || config.chartKind === 'bloodOxygen')
            ? buildTodayOverviewFromWearable(
                config,
                wearableItems,
                config.overviewMeasureName,
                config.chartKind === 'heartRate'
                    ? v => `${Math.round(v)} 次/分`
                    : v => `${Math.round(v)}%`,
            )
            : buildTodayOverviewFromMeasure(config, measureItems);
    // 有至少一条今日有效记录即视为已测（partial 也算）；full 仅用于详情「今日概况」达标判断
    return overview.mode === 'empty' ? 'notMeasured' : 'measured';
}

function getWearableItemTimestamp(item: WearableDataItem) {
    const date = moment(item.customerLocalDate ?? item.dataDate, ['YYYY-MM-DD', moment.ISO_8601], true);
    const base = date.isValid() ? date.clone().startOf('day') : moment().startOf('day');
    const time = item.endTimeStr?.trim() || item.startTimeStr?.trim();
    if (!time) return base;
    const parsedTime = moment(time, [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'HH:mm', 'H:mm'], true);
    if (parsedTime.isValid()) {
        return base.hour(parsedTime.hour()).minute(parsedTime.minute()).second(parsedTime.second());
    }
    return base;
}

function formatRelativeVitalsTime(ts: moment.Moment) {
    if (!ts.isValid()) return '--';
    if (ts.isSame(moment(), 'day')) return `今天${ts.format('HH:mm')}`;
    if (ts.isSame(moment().subtract(1, 'day'), 'day')) return `昨天${ts.format('HH:mm')}`;
    return ts.format('MM-DD HH:mm');
}

function resolveLastVitalsText(
    config: DiseaseTrendConfig,
    measureItems: MeasureDataItem[],
    wearableItems: WearableDataItem[],
): string {
    const name = config.overviewMeasureName || '体征';
    let latest: moment.Moment | null = null;

    if (config.wearableType && (config.chartKind === 'heartRate' || config.chartKind === 'bloodOxygen')) {
        wearableItems.forEach(item => {
            const value = config.chartKind === 'heartRate'
                ? parseMeasureNumber(item.heartRate ?? item.newHeartRate)
                : parseMeasureNumber(item.newOxygenSaturation ?? item.maxOxygenSaturation);
            if (value == null || value <= 0) return;
            const ts = getWearableItemTimestamp(item);
            if (!latest || ts.isAfter(latest)) latest = ts;
        });
    } else {
        measureItems.forEach(item => {
            if (!isValidTodayMeasureItem(config, item)) return;
            const ts = getItemTimestamp(item);
            if (!latest || ts.isAfter(latest)) latest = ts;
        });
    }

    if (!latest) return `上次${name}：--`;
    return `上次${name}：${formatRelativeVitalsTime(latest)}`;
}

function countPendingMedicationDoses(
    record: ChronicDiseaseRecord,
    planGroups: MedicationPlanGroupView[],
): number {
    return buildAssociatedMedicationRows(record, planGroups).filter(row => !row.taken).length;
}

export async function loadChronicIndexIndicators(
    records: ChronicDiseaseRecord[],
    labelMap: Record<string, string>,
    options?: { patientUserId?: string | number | null },
): Promise<Map<number, ChronicDiseaseDailyIndicators>> {
    if (records.length === 0) return new Map();

    const dictMaps = await loadMedicationDictMaps();
    const measureTypes = new Set<MeasureDataType>();
    const wearableTypes = new Set<WearableDataType>();

    records.forEach(record => {
        const config = resolveDiseaseTrendConfig(record.diseaseType, labelMap);
        if (config.measureType) measureTypes.add(config.measureType);
        if (config.wearableType) wearableTypes.add(config.wearableType);
        if (config.chartKind === 'heartRate') wearableTypes.add(WEARABLE_DATA_TYPES.restingHeartRate);
    });

    const [planGroups, todayMealList, measureTodayEntries, wearableTodayEntries, measureWeekEntries, wearableWeekEntries] =
        await Promise.all([
            loadMedicationPlanGroups(dictMaps, options),
            getTodayMealDetailList(options)
                .then(res =>
                    apiResourceData<MealDetailItem[]>(
                        res as unknown as { code?: number; data?: MealDetailItem[] },
                    ) ?? [],
                )
                .catch(() => [] as MealDetailItem[]),
            Promise.all([...measureTypes].map(async type => [type, await loadMeasureItems(type, 'today', options)] as const)),
            Promise.all([...wearableTypes].map(async type => [type, await loadWearableItems(type, 'today', options)] as const)),
            Promise.all([...measureTypes].map(async type => [type, await loadMeasureItems(type, '7days', options)] as const)),
            Promise.all([...wearableTypes].map(async type => [type, await loadWearableItems(type, '7days', options)] as const)),
        ]);

    const measureTodayCache = new Map<MeasureDataType, MeasureDataItem[]>(measureTodayEntries);
    const wearableTodayCache = new Map<WearableDataType, WearableDataItem[]>(wearableTodayEntries);
    const measureWeekCache = new Map<MeasureDataType, MeasureDataItem[]>(measureWeekEntries);
    const wearableWeekCache = new Map<WearableDataType, WearableDataItem[]>(wearableWeekEntries);
    const mealRecorded = resolveMainMealsRecordStatus(todayMealList);
    const result = new Map<number, ChronicDiseaseDailyIndicators>();

    records.forEach(record => {
        if (record.id == null) return;
        const config = resolveDiseaseTrendConfig(record.diseaseType, labelMap);
        const measureTodayItems = config.measureType ? measureTodayCache.get(config.measureType) ?? [] : [];
        const wearableTodayItems = config.wearableType ? wearableTodayCache.get(config.wearableType) ?? [] : [];
        const measureWeekItems = config.measureType ? measureWeekCache.get(config.measureType) ?? [] : [];
        const wearableWeekItems = config.wearableType ? wearableWeekCache.get(config.wearableType) ?? [] : [];
        result.set(record.id, {
            vitalsToday: resolveVitalsTodayStatus(config, measureTodayItems, wearableTodayItems),
            pendingMedicationCount: countPendingMedicationDoses(record, planGroups),
            mealRecorded,
            controlStatus: resolveChronicDiseaseControlStatusFromData(
                config,
                measureWeekItems,
                wearableWeekItems,
            ),
            lastVitalsText: resolveLastVitalsText(config, measureWeekItems, wearableWeekItems),
        });
    });

    return result;
}

export function resolveDiseaseTypeLabel(
    diseaseType: string | undefined,
    labelMap: Record<string, string>,
): string {
    if (!diseaseType) return '慢病详情';
    return labelMap[diseaseType] ?? diseaseType;
}

export async function loadChronicDetailData(
    recordId?: number,
    options?: { patientUserId?: string | number | null },
): Promise<ChronicDetailData> {
    const dictMaps = await loadMedicationDictMaps();
    const [labelMap, planGroupsRes, recordRes] = await Promise.all([
        loadDiseaseTypeLabelMap(),
        getIndexMedicationPlanGroupByTime({}, options),
        recordId != null ? getChronicDiseaseInfo(recordId, options) : Promise.resolve(null),
    ]);

    const record =
        recordId != null
            ? apiResourceData<ChronicDiseaseRecord>(recordRes as { code?: number; data?: ChronicDiseaseRecord }) ?? null
            : null;
    const config = resolveDiseaseTrendConfig(record?.diseaseType, labelMap);

    const [measureItems, secondaryMeasureItems, wearableItems, restingWearableItems] = await Promise.all([
        config.measureType ? loadMeasureItems(config.measureType, 'month', options) : Promise.resolve([]),
        config.secondaryMeasureType ? loadMeasureItems(config.secondaryMeasureType, 'month', options) : Promise.resolve([]),
        config.wearableType ? loadWearableItems(config.wearableType, 'month', options) : Promise.resolve([]),
        config.chartKind === 'heartRate'
            ? loadWearableItems(WEARABLE_DATA_TYPES.restingHeartRate, 'month', options)
            : Promise.resolve([]),
    ]);

    const chartLabels = getMonthChartLabels();
    const bloodPressureSeries = buildBloodPressureSeriesFromItems(
        config.chartKind === 'bloodPressure' ? measureItems : secondaryMeasureItems,
        '30Days',
    );
    const singleValueSeries =
        config.measureType && config.chartKind !== 'bloodPressure' && config.chartKind !== 'bloodLipids'
            ? buildSingleValueSeries(measureItems, '30Days')
            : config.chartKind === 'heartRate'
                ? buildWearableHeartRateSeries(wearableItems, '30Days')
                : config.chartKind === 'bloodOxygen'
                    ? buildWearableOxygenSeries(wearableItems, '30Days')
                    : [];
    const ldlSeries = config.chartKind === 'bloodLipids' ? buildLdlSeries(measureItems) : [];

    const todayOverview =
        config.wearableType && (config.chartKind === 'heartRate' || config.chartKind === 'bloodOxygen')
            ? buildTodayOverviewFromWearable(
                config,
                wearableItems,
                config.overviewMeasureName,
                config.chartKind === 'heartRate' ? v => `${Math.round(v)} 次/分` : v => `${Math.round(v)}%`,
            )
            : buildTodayOverviewFromMeasure(config, measureItems);

    const todayGroups = isResourceApiOk(planGroupsRes as { code?: number })
        ? mapIndexPlanGroups(
            apiResourceData<IndexMedicationPlanGroupItem[]>(
                planGroupsRes as unknown as { code?: number; data?: IndexMedicationPlanGroupItem[] },
            ),
            dictMaps,
        )
        : [];

    return {
        record,
        diseaseTypeLabels: labelMap,
        config,
        measureItems,
        secondaryMeasureItems,
        wearableItems,
        restingWearableItems,
        chartLabels,
        bloodPressureSeries,
        singleValueSeries,
        ldlSeries,
        stats: computeStats(config, measureItems, secondaryMeasureItems, wearableItems, restingWearableItems),
        todayOverview,
        associatedMedications: buildAssociatedMedicationRows(record, todayGroups),
        controlStatus: resolveChronicDiseaseControlStatusFromData(config, measureItems, wearableItems),
    };
}

export function toGlucosePoints(series: LabeledValue[]): BloodGlucosePoint[] {
    return series.map(item => ({ hour: item.label, value: item.value, x: item.x }));
}

export function toHeartRatePoints(series: LabeledValue[]): HeartRatePoint[] {
    return series.map(item => ({ hour: item.label, value: item.value, x: item.x }));
}

export function toOxygenPoints(series: LabeledValue[]): BloodOxygenPoint[] {
    return series.map(item => ({ hour: item.label, value: item.value, x: item.x }));
}
