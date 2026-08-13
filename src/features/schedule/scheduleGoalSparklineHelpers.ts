import moment from 'moment';
import type { HealthGoalJointRomTarget, HealthGoalTarget } from '@/api/healthGoal';
import {
  getMeasureDataDetailByDateRange,
  getMeasureDataStatisByDateRange,
  type MeasureDataDayGroup,
  type MeasureDataStatisDayGroup,
  type MeasureDataType,
} from '@/api/measureData';
import { listHealthTestRecords } from '@/api/exHealthTestRecord';
import { listExUserQuestions } from '@/api/exUserQuestion';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { parseMeasureNumber } from '@/src/features/profile/vitals/detail/helpers/shared';
import {
  isFastingBloodGlucoseMeasure,
  isHealthTestGoal,
  isJointRomGoal,
  isQuestionnaireGoal,
  resolveHealthTestItemIdFromTarget,
  resolveQuestionnaireTypeFromTarget,
} from './scheduleGoalHelpers';
import { flattenMeasureItems } from '@/src/features/profile/vitals/vitalsHelpers';

export type ScheduleGoalChartSeries = {
  weight: number[];
  bloodGlucose: number[];
  bloodPressureSbp: number[];
  bloodPressureDbp: number[];
  uricAcid: number[];
  bloodLipid: {
    ldlC: number[];
    hdlC: number[];
    tc: number[];
    tg: number[];
  };
  healthTestByGoalId: Record<string, number[]>;
  jointRomByGoalId: Record<string, Partial<Record<keyof HealthGoalJointRomTarget, number[]>>>;
  questionnaireByGoalId: Record<string, number[]>;
};

const EMPTY_CHART_SERIES: ScheduleGoalChartSeries = {
  weight: [],
  bloodGlucose: [],
  bloodPressureSbp: [],
  bloodPressureDbp: [],
  uricAcid: [],
  bloodLipid: { ldlC: [], hdlC: [], tc: [], tg: [] },
  healthTestByGoalId: {},
  jointRomByGoalId: {},
  questionnaireByGoalId: {},
};

const JOINT_ROM_KEYS: Array<keyof HealthGoalJointRomTarget> = [
  'shoulderFlexion',
  'shoulderAbduction',
  'elbowFlexion',
  'hipFlexion',
  'kneeFlexion',
  'ankleDorsiflexion',
];

function toFiniteNumber(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function sortStatisGroups(groups: MeasureDataStatisDayGroup[]) {
  return [...groups].sort((a, b) => {
    const timeA = moment(a.customerLocalDate).valueOf();
    const timeB = moment(b.customerLocalDate).valueOf();
    return (Number.isFinite(timeA) ? timeA : 0) - (Number.isFinite(timeB) ? timeB : 0);
  });
}

/** 健康数据：一天一个点（statis 日均） */
function buildDailySeriesFromStatis(
  groups: MeasureDataStatisDayGroup[],
  pick: (group: MeasureDataStatisDayGroup) => number | null,
) {
  return sortStatisGroups(groups)
    .map(pick)
    .filter((value): value is number => value != null);
}

async function loadMeasureStatisGroups(
  type: MeasureDataType,
  startDate: string,
  endDate: string,
) {
  try {
    const res = await getMeasureDataStatisByDateRange({ startDate, endDate, type });
    if (!isResourceApiOk(res as unknown as { code?: number })) return [] as MeasureDataStatisDayGroup[];
    const rows = apiResourceData<MeasureDataStatisDayGroup[]>(
      res as unknown as { code?: number; data?: MeasureDataStatisDayGroup[] },
    );
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [] as MeasureDataStatisDayGroup[];
  }
}

function pickLipidFromDayGroup(
  group: MeasureDataDayGroup,
  key: 'ldlC' | 'hdlC' | 'tc' | 'tg',
) {
  const items = [...(group.childList ?? [])].reverse();
  for (const item of items) {
    const value = key === 'tc'
      ? parseMeasureNumber(item.xuezhiTc ?? item.val)
      : key === 'tg'
        ? parseMeasureNumber(item.xuezhiTg)
        : key === 'hdlC'
          ? parseMeasureNumber(item.xuezhiHdlC)
          : parseMeasureNumber(item.xuezhiLdlC);
    if (value != null && value > 0) return value;
  }
  return null;
}

async function loadBloodLipidDailySeries(startDate: string, endDate: string) {
  try {
    const res = await getMeasureDataDetailByDateRange({
      startDate,
      endDate,
      type: '血脂',
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) {
      return { ldlC: [], hdlC: [], tc: [], tg: [] };
    }
    const rows = apiResourceData<MeasureDataDayGroup[]>(
      res as unknown as { code?: number; data?: MeasureDataDayGroup[] },
    );
    const groups = (Array.isArray(rows) ? rows : [])
      .filter(group => group.customerLocalDate?.trim())
      .sort((a, b) => {
        const timeA = moment(a.customerLocalDate).valueOf();
        const timeB = moment(b.customerLocalDate).valueOf();
        return (Number.isFinite(timeA) ? timeA : 0) - (Number.isFinite(timeB) ? timeB : 0);
      });

    return {
      ldlC: groups.map(group => pickLipidFromDayGroup(group, 'ldlC')).filter((v): v is number => v != null),
      hdlC: groups.map(group => pickLipidFromDayGroup(group, 'hdlC')).filter((v): v is number => v != null),
      tc: groups.map(group => pickLipidFromDayGroup(group, 'tc')).filter((v): v is number => v != null),
      tg: groups.map(group => pickLipidFromDayGroup(group, 'tg')).filter((v): v is number => v != null),
    };
  } catch {
    return { ldlC: [], hdlC: [], tc: [], tg: [] };
  }
}

/** 空腹血糖：按日取当天最后一条空腹记录 */
async function loadFastingBloodGlucoseDailySeries(startDate: string, endDate: string) {
  try {
    const res = await getMeasureDataDetailByDateRange({
      startDate,
      endDate,
      type: '血糖',
    });
    if (!isResourceApiOk(res as unknown as { code?: number })) return [] as number[];
    const rows = apiResourceData<MeasureDataDayGroup[]>(
      res as unknown as { code?: number; data?: MeasureDataDayGroup[] },
    );
    const groups = (Array.isArray(rows) ? rows : [])
      .filter(group => group.customerLocalDate?.trim())
      .sort((a, b) => {
        const timeA = moment(a.customerLocalDate).valueOf();
        const timeB = moment(b.customerLocalDate).valueOf();
        return (Number.isFinite(timeA) ? timeA : 0) - (Number.isFinite(timeB) ? timeB : 0);
      });

    return groups
      .map(group => {
        const fastingItems = flattenMeasureItems([group]).filter(isFastingBloodGlucoseMeasure);
        for (let index = fastingItems.length - 1; index >= 0; index -= 1) {
          const value = parseMeasureNumber(fastingItems[index]?.val);
          if (value != null && value > 0) return value;
        }
        return null;
      })
      .filter((value): value is number => value != null);
  } catch {
    return [] as number[];
  }
}

async function loadHealthTestSeriesMaps(
  exPatientRuleId: string | number,
  targets: HealthGoalTarget[],
  userId?: string | number | null,
) {
  const healthTestByGoalId: Record<string, number[]> = {};
  const jointRomByGoalId: Record<
    string,
    Partial<Record<keyof HealthGoalJointRomTarget, number[]>>
  > = {};

  await Promise.all(
    targets.map(async target => {
      if (target.healthGoalId == null) return;
      if (!isHealthTestGoal(target) && !isJointRomGoal(target)) return;
      const healthTestItemId = resolveHealthTestItemIdFromTarget(target);
      if (!healthTestItemId) return;

      try {
        const res = await listHealthTestRecords({
          exPatientRuleId,
          healthTestItemId,
          userId: userId != null ? String(userId) : undefined,
          pageNum: 1,
          pageSize: 500,
        });
        if (!isResourceApiOk(res as unknown as { code?: number })) return;
        const rows = getResourceRows(res as any)
          .slice()
          .sort((a, b) => {
            const timeA = new Date(a.createTime ?? 0).getTime();
            const timeB = new Date(b.createTime ?? 0).getTime();
            return timeA - timeB;
          });

        const goalId = String(target.healthGoalId);
        healthTestByGoalId[goalId] = rows
          .map(row => toFiniteNumber(row.testValue))
          .filter((value): value is number => value != null);

        if (isJointRomGoal(target)) {
          const fieldSeries: Partial<Record<keyof HealthGoalJointRomTarget, number[]>> = {};
          for (const key of JOINT_ROM_KEYS) {
            fieldSeries[key] = rows
              .map(row => toFiniteNumber(row.objValue?.[key] as number | string | null | undefined))
              .filter((value): value is number => value != null);
          }
          jointRomByGoalId[goalId] = fieldSeries;
        }
      } catch {
        // ignore single target failure
      }
    }),
  );

  return { healthTestByGoalId, jointRomByGoalId };
}

async function loadQuestionnaireSeriesByGoalId(
  exPatientRuleId: string | number,
  targets: HealthGoalTarget[],
  userId?: string | number | null,
) {
  const questionnaireByGoalId: Record<string, number[]> = {};

  await Promise.all(
    targets.map(async target => {
      if (!isQuestionnaireGoal(target) || target.healthGoalId == null) return;
      const questionnaireType = resolveQuestionnaireTypeFromTarget(target);
      if (questionnaireType == null) return;

      try {
        const res = await listExUserQuestions({
          exPatientRuleId,
          type: questionnaireType,
          userId: userId != null ? String(userId) : undefined,
          pageNum: 1,
          pageSize: 500,
        });
        if (!isResourceApiOk(res as unknown as { code?: number })) return;
        const rows = getResourceRows(res as any)
          .slice()
          .sort((a, b) => {
            const timeA = new Date(a.createTime ?? 0).getTime();
            const timeB = new Date(b.createTime ?? 0).getTime();
            return timeA - timeB;
          });
        questionnaireByGoalId[String(target.healthGoalId)] = rows
          .map(row => toFiniteNumber(row.score))
          .filter((value): value is number => value != null);
      } catch {
        // ignore
      }
    }),
  );

  return questionnaireByGoalId;
}

/** 处方周期内目标卡折线数据（健康指标按日，测试/问卷按全部记录） */
export async function loadScheduleGoalChartSeries(options: {
  startDate?: string | null;
  endDate?: string | null;
  exPatientRuleId?: string | number | null;
  targets?: HealthGoalTarget[];
  userId?: string | number | null;
}): Promise<ScheduleGoalChartSeries> {
  const startDate = options.startDate?.trim();
  const endDate = options.endDate?.trim();
  const targets = options.targets ?? [];
  if (!startDate || !endDate) return EMPTY_CHART_SERIES;

  const [
    weightGroups,
    fastingBloodGlucose,
    pressureGroups,
    uricAcidGroups,
    bloodLipid,
    healthTestMaps,
    questionnaireByGoalId,
  ] = await Promise.all([
    loadMeasureStatisGroups('体重', startDate, endDate),
    loadFastingBloodGlucoseDailySeries(startDate, endDate),
    loadMeasureStatisGroups('血压', startDate, endDate),
    loadMeasureStatisGroups('尿酸', startDate, endDate),
    loadBloodLipidDailySeries(startDate, endDate),
    options.exPatientRuleId != null
      ? loadHealthTestSeriesMaps(options.exPatientRuleId, targets, options.userId)
      : Promise.resolve({ healthTestByGoalId: {}, jointRomByGoalId: {} }),
    options.exPatientRuleId != null
      ? loadQuestionnaireSeriesByGoalId(options.exPatientRuleId, targets, options.userId)
      : Promise.resolve({}),
  ]);

  return {
    weight: buildDailySeriesFromStatis(weightGroups, group => parseMeasureNumber(group.avgVal)),
    bloodGlucose: fastingBloodGlucose,
    bloodPressureSbp: buildDailySeriesFromStatis(pressureGroups, group => parseMeasureNumber(group.avgVal)),
    bloodPressureDbp: buildDailySeriesFromStatis(pressureGroups, group => parseMeasureNumber(group.avgVal2)),
    uricAcid: buildDailySeriesFromStatis(uricAcidGroups, group => parseMeasureNumber(group.avgVal)),
    bloodLipid,
    healthTestByGoalId: healthTestMaps.healthTestByGoalId,
    jointRomByGoalId: healthTestMaps.jointRomByGoalId,
    questionnaireByGoalId,
  };
}
