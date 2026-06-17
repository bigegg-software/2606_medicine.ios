import moment from 'moment';
import type { MeasureDataItem } from '@/api/measureData';
import type { WearableDataItem } from '@/api/wearableData';
import {
    getLevelLabel,
    getUricAcidStatusLabel,
} from '@/src/features/profile/vitals/vitalsHelpers';
import { getVitalLevelTier } from '@/src/features/profile/vitals/vitalLevelColors';
import type { DiseaseTrendConfig } from './diseaseConfig';

export type ChronicDiseaseControlStatus = 'stable' | 'attention' | 'highRisk';

export const CHRONIC_DISEASE_CONTROL_STATUS_LABELS: Record<ChronicDiseaseControlStatus, string> = {
    stable: '控制良好',
    attention: '需关注',
    highRisk: '高风险',
};

type ReadingLevel = 'normal' | 'mild' | 'severe' | 'unknown';

function parseMeasureNumber(value?: number | string | null) {
    if (value == null || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function tierToReadingLevel(tier: ReturnType<typeof getVitalLevelTier>): ReadingLevel {
    if (tier === 'severe') return 'severe';
    if (tier === 'normal') return 'normal';
    if (tier === 'empty') return 'unknown';
    return 'mild';
}

function levelFromLabel(label: string): ReadingLevel {
    if (!label) return 'unknown';
    return tierToReadingLevel(getVitalLevelTier(label));
}

function assessBloodPressureLevel(high: number, low: number): ReadingLevel {
    if (high >= 140 || low >= 90) return 'severe';
    if (high >= 120 || low >= 80) return 'mild';
    return 'normal';
}

function assessGlucoseLevel(value: number): ReadingLevel {
    if (value >= 7.0 || value < 3.9) return 'severe';
    if (value > 6.1) return 'mild';
    return 'normal';
}

function assessLdlLevel(value: number): ReadingLevel {
    if (value >= 3.4) return 'severe';
    if (value >= 2.6) return 'mild';
    return 'normal';
}

function assessUricAcidLevel(value: number, gender?: string | null): ReadingLevel {
    const label = getUricAcidStatusLabel(value, gender);
    if (label === '正常') return 'normal';
    if (label === '偏低') return 'mild';
    if (value >= 540) return 'severe';
    return 'mild';
}

function assessHeartRateLevel(value: number): ReadingLevel {
    if (value > 120 || value < 50) return 'severe';
    if (value > 100 || value < 60) return 'mild';
    return 'normal';
}

function assessOxygenLevel(value: number): ReadingLevel {
    if (value < 90) return 'severe';
    if (value < 95) return 'mild';
    return 'normal';
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

function getWearableTimestamp(item: WearableDataItem) {
    const date = moment(item.customerLocalDate ?? item.dataDate, ['YYYY-MM-DD', moment.ISO_8601], true);
    const base = date.isValid() ? date.clone().startOf('day') : moment().startOf('day');
    const time = item.endTimeStr?.trim() || item.startTimeStr?.trim();
    if (!time) return base;
    const parsedTime = moment(time, [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'HH:mm'], true);
    if (parsedTime.isValid()) {
        return parsedTime;
    }
    return base;
}

function isWithinLastDays(timestamp: moment.Moment, days: number) {
    const start = moment().subtract(days - 1, 'days').startOf('day');
    return timestamp.isSameOrAfter(start, 'day');
}

function assessMeasureItemLevel(
    item: MeasureDataItem,
    config: DiseaseTrendConfig,
    gender?: string | null,
): ReadingLevel {
    const label = getLevelLabel(item);
    if (label) {
        const fromLabel = levelFromLabel(label);
        if (fromLabel !== 'unknown') return fromLabel;
    }

    if (config.chartKind === 'bloodPressure') {
        const high = parseMeasureNumber(item.val);
        const low = parseMeasureNumber(item.val2);
        if (high == null || low == null || high <= 0 || low <= 0) return 'unknown';
        return assessBloodPressureLevel(high, low);
    }

    if (config.chartKind === 'bloodGlucose') {
        const value = parseMeasureNumber(item.val);
        if (value == null || value <= 0) return 'unknown';
        return assessGlucoseLevel(value);
    }

    if (config.chartKind === 'bloodLipids') {
        const ldl = parseMeasureNumber(item.xuezhiLdlC);
        if (ldl == null || ldl <= 0) return 'unknown';
        return assessLdlLevel(ldl);
    }

    if (config.chartKind === 'uricAcid') {
        const value = parseMeasureNumber(item.val);
        if (value == null || value <= 0) return 'unknown';
        return assessUricAcidLevel(value, gender);
    }

    return 'unknown';
}

function assessWearableItemLevel(item: WearableDataItem, config: DiseaseTrendConfig): ReadingLevel {
    if (item.isHigh === 1) {
        const value =
            config.chartKind === 'heartRate'
                ? parseMeasureNumber(item.heartRate ?? item.newHeartRate)
                : parseMeasureNumber(item.newOxygenSaturation ?? item.maxOxygenSaturation);
        if (config.chartKind === 'heartRate' && value != null && (value > 120 || value < 50)) return 'severe';
        if (config.chartKind === 'bloodOxygen' && value != null && value < 90) return 'severe';
        return 'mild';
    }
    if (item.isLow === 1 || item.isLow === 2 || item.isLow === 3) {
        const value =
            config.chartKind === 'heartRate'
                ? parseMeasureNumber(item.heartRate ?? item.newHeartRate)
                : parseMeasureNumber(item.newOxygenSaturation ?? item.maxOxygenSaturation);
        if (config.chartKind === 'heartRate' && value != null && value < 50) return 'severe';
        if (config.chartKind === 'bloodOxygen' && value != null && value < 90) return 'severe';
        return 'mild';
    }

    if (config.chartKind === 'heartRate') {
        const value = parseMeasureNumber(item.heartRate ?? item.newHeartRate);
        if (value == null || value <= 0) return 'unknown';
        return assessHeartRateLevel(value);
    }

    if (config.chartKind === 'bloodOxygen') {
        const value = parseMeasureNumber(item.newOxygenSaturation ?? item.maxOxygenSaturation);
        if (value == null || value <= 0) return 'unknown';
        return assessOxygenLevel(value);
    }

    return 'unknown';
}

function collectMeasureLevels(
    items: MeasureDataItem[],
    config: DiseaseTrendConfig,
    gender?: string | null,
): ReadingLevel[] {
    return items
        .filter(item => isWithinLastDays(getItemTimestamp(item), 7))
        .sort((a, b) => getItemTimestamp(a).valueOf() - getItemTimestamp(b).valueOf())
        .map(item => assessMeasureItemLevel(item, config, gender))
        .filter((level): level is ReadingLevel => level !== 'unknown');
}

function collectWearableLevels(items: WearableDataItem[], config: DiseaseTrendConfig): ReadingLevel[] {
    return items
        .filter(item => isWithinLastDays(getWearableTimestamp(item), 7))
        .sort((a, b) => getWearableTimestamp(a).valueOf() - getWearableTimestamp(b).valueOf())
        .map(item => assessWearableItemLevel(item, config))
        .filter((level): level is ReadingLevel => level !== 'unknown');
}

function resolveControlStatusFromLevels(levels: ReadingLevel[]): ChronicDiseaseControlStatus {
    if (levels.length === 0) return 'stable';

    const latestLevel = levels[levels.length - 1];
    if (latestLevel === 'severe') return 'highRisk';
    if (latestLevel === 'mild') return 'attention';

    const hadOutOfRange = levels.some(level => level === 'mild' || level === 'severe');
    return hadOutOfRange ? 'attention' : 'stable';
}

export function resolveChronicDiseaseControlStatusFromData(
    config: DiseaseTrendConfig,
    measureItems: MeasureDataItem[],
    wearableItems: WearableDataItem[],
    gender?: string | null,
): ChronicDiseaseControlStatus {
    const levels =
        config.wearableType && (config.chartKind === 'heartRate' || config.chartKind === 'bloodOxygen')
            ? collectWearableLevels(wearableItems, config)
            : collectMeasureLevels(measureItems, config, gender);

    return resolveControlStatusFromLevels(levels);
}
