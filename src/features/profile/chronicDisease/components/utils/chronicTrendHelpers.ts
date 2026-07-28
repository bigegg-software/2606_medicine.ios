import moment from 'moment';
import type { MeasureDataItem } from '@/api/measureData';
import type { WearableDataItem } from '@/api/wearableData';
import type { BloodPressurePoint } from '@/src/features/profile/components/BloodPressureChart';
import type { BloodPressureDetailPoint } from '@/src/features/profile/vitals/detail/helpers/bloodPressure';
import { getLevelLabel } from '@/src/features/profile/vitals/vitalsHelpers';
import type { TrendChartKind } from '../diseaseConfig';
import {
    CHRONIC_DISEASE_CONTROL_STATUS_LABELS,
    type ChronicDiseaseControlStatus,
} from '../controlStatus';

const MONTH_DAY_COUNT = 30;

function parseMeasureNumber(value?: number | string | null) {
    if (value == null || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function getItemDayKey(item: MeasureDataItem) {
    const date = moment(item.customerLocalDate, ['YYYY-MM-DD', moment.ISO_8601], true);
    return date.isValid() ? date.format('YYYY-MM-DD') : '';
}

/** 将近 30 天血压序列补齐日期与状态，供体征详情图表使用 */
export function enrichChronicBloodPressureMonthSeries(
    series: BloodPressurePoint[],
    measureItems: MeasureDataItem[],
): BloodPressureDetailPoint[] {
    const itemsByDate = new Map<string, MeasureDataItem>();
    [...measureItems]
        .sort((a, b) => {
            const ta = moment(a.customerLocalDate).valueOf();
            const tb = moment(b.customerLocalDate).valueOf();
            return ta - tb;
        })
        .forEach(item => {
            const key = getItemDayKey(item);
            if (!key) return;
            const high = parseMeasureNumber(item.val);
            const low = parseMeasureNumber(item.val2);
            if (high == null || low == null || high <= 0 || low <= 0) return;
            itemsByDate.set(key, item);
        });

    return Array.from({ length: MONTH_DAY_COUNT }, (_, index) => {
        const day = moment().subtract(MONTH_DAY_COUNT - 1 - index, 'days');
        const dateStr = day.format('YYYY-MM-DD');
        const existing = series[index];
        const item = itemsByDate.get(dateStr);
        const high = existing?.high ?? Math.round(parseMeasureNumber(item?.val) ?? 0);
        const low = existing?.low ?? Math.round(parseMeasureNumber(item?.val2) ?? 0);

        return {
            high,
            low,
            hour: day.format('M/D'),
            customerLocalDate: dateStr,
            statusLabel: item ? getLevelLabel(item) || '正常' : undefined,
            dataTime: item?.dataTime,
        };
    });
}

export function getChronicControlStatusColor(status: ChronicDiseaseControlStatus) {
    switch (status) {
        case 'attention':
            return '#FF8B07';
        case 'highRisk':
            return '#D80010';
        default:
            return '#34B69F';
    }
}

export function getChronicControlStatusLabel(status: ChronicDiseaseControlStatus) {
    return CHRONIC_DISEASE_CONTROL_STATUS_LABELS[status];
}

export function getChronicTrendMetricMeta(chartKind: TrendChartKind): {
    title: string;
    normalRangeText: string;
} {
    switch (chartKind) {
        case 'bloodPressure':
            return { title: '平均血压(mmHg)', normalRangeText: '' };
        case 'bloodGlucose':
            return { title: '平均血糖(mmol/L)', normalRangeText: '3.9-6.1' };
        case 'bloodLipids':
            return { title: 'LDL-C(mmol/L)', normalRangeText: '< 3.4' };
        case 'heartRate':
            return { title: '平均心率(次/分)', normalRangeText: '60-100' };
        case 'uricAcid':
            return { title: '平均尿酸(μmol/L)', normalRangeText: '' };
        case 'bloodOxygen':
            return { title: '平均血氧(%)', normalRangeText: '≥ 95' };
        default:
            return { title: '趋势', normalRangeText: '' };
    }
}

/** 近 30 天心率过高/过低次数（基于可穿戴标记） */
export function countChronicHeartRateAbnormal(items: WearableDataItem[]) {
    let highCount = 0;
    let lowCount = 0;
    items.forEach(item => {
        if (item.isHigh === 1) highCount += 1;
        if (item.isLow === 1 || item.isLow === 2 || item.isLow === 3) lowCount += 1;
    });
    return { highCount, lowCount };
}
