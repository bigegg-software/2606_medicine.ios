import type { ImageSourcePropType } from 'react-native';
import type { MeasureDataType } from '@/api/measureData';
import type { WearableDataType } from '@/api/wearableData';

export type TrendChartKind =
    | 'bloodPressure'
    | 'bloodGlucose'
    | 'bloodLipids'
    | 'heartRate'
    | 'uricAcid'
    | 'bloodOxygen';

export type StatColumnKey =
    | 'complianceRate'
    | 'maxBp'
    | 'minBp'
    | 'maxGlucose'
    | 'avgGlucose'
    | 'ldlComplianceRate'
    | 'maxLdl'
    | 'latestLdl'
    | 'avgRestingHeartRate'
    | 'heartRateComplianceRate'
    | 'bpComplianceRate'
    | 'uricAcidComplianceRate'
    | 'maxUricAcid'
    | 'latestUricAcid'
    | 'oxygenComplianceRate'
    | 'minOxygen'
    | 'avgOxygen';

export type DiseaseTrendConfig = {
    chartKind: TrendChartKind;
    trendTitle: string;
    icon: ImageSourcePropType;
    tintColor: string;
    measureType?: MeasureDataType;
    secondaryMeasureType?: MeasureDataType;
    wearableType?: WearableDataType;
    addDataType?: MeasureDataType | '血氧' | '心率';
    statColumns: { key: StatColumnKey; title: string }[];
    expectedDailyCount: number;
    overviewMeasureName: string;
};

const HYPERTENSION: DiseaseTrendConfig = {
    chartKind: 'bloodPressure',
    trendTitle: '血压趋势（近30天）',
    icon: require('@/assets/images/home/bp.png'),
    tintColor: '#F33F3E',
    measureType: '血压',
    addDataType: '血压',
    statColumns: [
        { key: 'complianceRate', title: '达标率' },
        { key: 'maxBp', title: '最高血压' },
        { key: 'minBp', title: '最低血压' },
    ],
    expectedDailyCount: 2,
    overviewMeasureName: '血压',
};

const DIABETES: DiseaseTrendConfig = {
    chartKind: 'bloodGlucose',
    trendTitle: '血糖趋势（近30天）',
    icon: require('@/assets/images/home/xt.png'),
    tintColor: '#06BDFF',
    measureType: '血糖',
    addDataType: '血糖',
    statColumns: [
        { key: 'complianceRate', title: '达标率' },
        { key: 'maxGlucose', title: '最高血糖' },
        { key: 'avgGlucose', title: '平均血糖' },
    ],
    expectedDailyCount: 1,
    overviewMeasureName: '血糖',
};

const HYPERLIPIDEMIA: DiseaseTrendConfig = {
    chartKind: 'bloodLipids',
    trendTitle: '血脂趋势（近30天）',
    icon: require('@/assets/images/home/xy.png'),
    tintColor: '#FF8B07',
    measureType: '血脂',
    addDataType: '血脂',
    statColumns: [
        { key: 'ldlComplianceRate', title: 'LDL-C达标率' },
        { key: 'maxLdl', title: '最高LDL-C' },
        { key: 'latestLdl', title: '最近LDL-C' },
    ],
    expectedDailyCount: 1,
    overviewMeasureName: '血脂',
};

const CORONARY: DiseaseTrendConfig = {
    chartKind: 'heartRate',
    trendTitle: '心率趋势（近30天）',
    icon: require('@/assets/images/home/xl.png'),
    tintColor: '#FF2056',
    wearableType: 'heartRate',
    secondaryMeasureType: '血压',
    addDataType: '心率',
    statColumns: [
        { key: 'avgRestingHeartRate', title: '平均静息心率' },
        { key: 'heartRateComplianceRate', title: '心率达标率' },
        { key: 'bpComplianceRate', title: '血压达标率' },
    ],
    expectedDailyCount: 1,
    overviewMeasureName: '心率',
};

const HYPERURICEMIA: DiseaseTrendConfig = {
    chartKind: 'uricAcid',
    trendTitle: '尿酸趋势（近30天）',
    icon: require('@/assets/images/home/xy.png'),
    tintColor: '#4F86EE',
    measureType: '尿酸',
    addDataType: '尿酸',
    statColumns: [
        { key: 'uricAcidComplianceRate', title: '血尿酸达标率' },
        { key: 'maxUricAcid', title: '最高血尿酸' },
        { key: 'latestUricAcid', title: '最近血尿酸' },
    ],
    expectedDailyCount: 1,
    overviewMeasureName: '尿酸',
};

const STROKE: DiseaseTrendConfig = {
    ...HYPERTENSION,
    trendTitle: '血压趋势（近30天）',
    statColumns: [
        { key: 'bpComplianceRate', title: '血压达标率' },
        { key: 'maxBp', title: '最高血压' },
        { key: 'minBp', title: '最低血压' },
    ],
};

const COPD: DiseaseTrendConfig = {
    chartKind: 'bloodOxygen',
    trendTitle: '血氧饱和度趋势（近30天）',
    icon: require('@/assets/images/home/xy.png'),
    tintColor: '#00C950',
    wearableType: 'oxygenSaturation',
    addDataType: '血氧',
    statColumns: [
        { key: 'oxygenComplianceRate', title: '血氧达标率' },
        { key: 'minOxygen', title: '最低血氧' },
        { key: 'avgOxygen', title: '平均血氧' },
    ],
    expectedDailyCount: 1,
    overviewMeasureName: '血氧',
};

const DISEASE_MATCHERS: { pattern: RegExp; config: DiseaseTrendConfig }[] = [
    { pattern: /高血压|gaoxueya/i, config: HYPERTENSION },
    { pattern: /糖尿病|tangniaobing/i, config: DIABETES },
    { pattern: /高血脂|高脂血症|gaoxuezhi/i, config: HYPERLIPIDEMIA },
    { pattern: /冠心病|guanxinbing/i, config: CORONARY },
    { pattern: /高尿酸|gaoniaosuan/i, config: HYPERURICEMIA },
    { pattern: /脑卒中|naozuzhong|中风/i, config: STROKE },
    { pattern: /慢阻肺|manzufei|copd/i, config: COPD },
];

export function resolveDiseaseTrendConfig(
    diseaseType?: string,
    labelMap?: Record<string, string>,
): DiseaseTrendConfig {
    const label = diseaseType ? labelMap?.[diseaseType] ?? diseaseType : '';
    const text = `${diseaseType ?? ''}${label}`;
    const matched = DISEASE_MATCHERS.find(item => item.pattern.test(text));
    return matched?.config ?? HYPERTENSION;
}
