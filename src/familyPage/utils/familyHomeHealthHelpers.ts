import type { ImageSourcePropType } from 'react-native';
import moment from 'moment';
import type { FamilyBindItem } from '@/api/familyBind';
import {
  getMeasureDataLatestByType,
  type MeasureDataItem,
  type MeasureDataLatestResult,
  type MeasureDataType,
} from '@/api/measureData';
import {
  getIndexMedicationPlanGroupByTime,
  type IndexMedicationPlanGroupItem,
} from '@/api/medicationPlan';
import {
  getWearableDataDetailByCustomerLocalDate,
  getWearableDataLatestByType,
  WEARABLE_DATA_TYPES,
  type WearableDataDetailResult,
  type WearableDataItem,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { formatMeasureDisplay } from '@/src/features/profile/vitals/vitalsHelpers';
import { buildBloodSugarStatus } from '@/src/features/profile/vitals/detail/helpers/bloodSugar';
import { parseStepsFromItem } from '@/src/features/profile/vitals/detail/helpers/shared';
import { getApprovedFamilyBindList } from './familyProfileHelpers';

export type FamilyHomeGlucoseTrend = 'up' | 'down' | null;

export type FamilyHomeHealthSnapshot = {
  bp: string;
  glucose: string;
  glucoseTrend: FamilyHomeGlucoseTrend;
  steps: string;
  medication: string;
};

export function emptyFamilyHomeHealthSnapshot(): FamilyHomeHealthSnapshot {
  return { bp: '--', glucose: '--', glucoseTrend: null, steps: '--', medication: '--' };
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

function formatGlucoseValue(item?: MeasureDataItem) {
  return displayOrDash(
    trimTrailingDecimalZeros(formatMeasureDisplay(item, '血糖').value),
  );
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

async function loadBpText(patientUserId: string): Promise<string> {
  const item = await fetchLatestMeasure('血压', patientUserId);
  return displayOrDash(formatMeasureDisplay(item, '血压').value);
}

async function loadGlucoseSnapshot(
  patientUserId: string,
): Promise<Pick<FamilyHomeHealthSnapshot, 'glucose' | 'glucoseTrend'>> {
  const item = await fetchLatestMeasure('血糖', patientUserId);
  return {
    glucose: formatGlucoseValue(item),
    glucoseTrend: resolveGlucoseTrend(item),
  };
}

export function resolveFamilyHomeGlucoseTrendIcon(
  trend?: FamilyHomeGlucoseTrend,
): ImageSourcePropType | null {
  if (trend === 'up') return require('@/assets/images/vitals/shang.png');
  if (trend === 'down') return require('@/assets/images/vitals/xia.png');
  return null;
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

async function loadStepsText(patientUserId: string): Promise<string> {
  const today = moment().format('YYYY-MM-DD');
  const todayItem = await fetchWearable(() =>
    getWearableDataDetailByCustomerLocalDate(
      { customerLocalDate: today, type: WEARABLE_DATA_TYPES.steps },
      { patientUserId },
    ),
  );
  const latestItem =
    todayItem
    ?? (await fetchWearable(() =>
      getWearableDataLatestByType(WEARABLE_DATA_TYPES.steps, { patientUserId }),
    ));
  const steps = parseStepsFromItem(latestItem);
  return steps > 0 ? String(steps) : '--';
}

function formatMedicationStatus(groups?: IndexMedicationPlanGroupItem[] | null): string {
  const actions = (groups ?? []).flatMap(group =>
    (group.list ?? []).map(item => item.action),
  );
  if (actions.length === 0) return '--';
  if (actions.some(action => action === 0)) return '漏服';
  if (actions.every(action => action === 1)) return '完成';
  return '--';
}

async function loadMedicationText(patientUserId: string): Promise<string> {
  try {
    const res = await getIndexMedicationPlanGroupByTime(
      { customerLocalDate: moment().format('YYYY-MM-DD') },
      { patientUserId },
    );
    if (!isResourceApiOk(res as { code?: number })) return '--';
    return formatMedicationStatus(
      apiResourceData<IndexMedicationPlanGroupItem[]>(
        res as { data?: IndexMedicationPlanGroupItem[] },
      ),
    );
  } catch {
    return '--';
  }
}

/** 拉取指定家人首页健康速览 */
export async function loadFamilyMemberHealthSnapshot(
  patientUserId: string,
): Promise<FamilyHomeHealthSnapshot> {
  const id = String(patientUserId).trim();
  if (!id) return emptyFamilyHomeHealthSnapshot();
  try {
    const [bp, glucoseSnap, steps, medication] = await Promise.all([
      loadBpText(id),
      loadGlucoseSnapshot(id),
      loadStepsText(id),
      loadMedicationText(id),
    ]);
    return { bp, ...glucoseSnap, steps, medication };
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

export function isFamilyHomeMedicationMissed(status?: string) {
  return status === '漏服';
}

export function isFamilyHomeMedicationDone(status?: string) {
  return status === '完成';
}
