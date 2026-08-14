import moment from 'moment';
import {
  DICT_TYPES,
  buildDictLabelMap,
  getDictDataByType,
  type DictDataItem,
} from '@/api/dict';
import type { IndexMedicationPlanGroupItem, IndexMedicationPlanItem, MedicationPlan, MedicationPlanPayload, DrugPatientRuleInfo } from '@/api/medicationPlan';
import { getDrugPatientRuleHistoryList, getIndexMedicationPlanGroupByTime, getMedicationPlanInfo, getMyMedicationPlanList } from '@/api/medicationPlan';
import { addMedicationRecord, getMedicationRecordAll, getMedicationRecordStatis, type MedicationRecordDayGroup } from '@/api/medicationRecord';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
const WEEKDAY_TO_API: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
};
const API_TO_WEEKDAY: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日',
};

export type MedicationDictMaps = {
  amountUnit: Record<string, string>;
  eventBased: Record<string, string>;
  amountUnitOptions: { label: string; value: string }[];
  eventBasedOptions: { label: string; value: string }[];
};

export type MedicationPlanItemView = {
  key: string;
  medicationPlanId: string;
  medicationPlanTime: string;
  name: string;
  doseText: string;
  planType: number;
  planTypeLabel: string;
  taken: boolean;
  canCheckIn: boolean;
  action: number | null | undefined;
  eventBasedLabel: string;
};

export type MedicationPlanGroupView = {
  time: string;
  timeLabel: string;
  eventBasedLabel: string;
  items: MedicationPlanItemView[];
};

export type MedicationHistoryItemView = {
  key: string;
  name: string;
  planTypeLabel: string;
  isPrescription: boolean;
  timeText: string;
  taken: boolean;
};

export type MedicationHistoryDayView = {
  key: string;
  label: string;
  items: MedicationHistoryItemView[];
};

export type MedicationProgressView = {
  rate: number;
  takeCount: number;
  notTakeCount: number;
};

const EMPTY_DICT_MAPS: MedicationDictMaps = {
  amountUnit: {},
  eventBased: {},
  amountUnitOptions: [],
  eventBasedOptions: [],
};

function toQueryId(id?: string | number | null) {
  if (id == null || id === '') return undefined;
  return String(id);
}

export function resolveDictLabel(map: Record<string, string>, value?: string) {
  const key = value?.trim();
  if (!key) return '';
  return map[key] ?? key;
}

function formatPlanTime(time?: string) {
  const parsed = moment(time, ['HH:mm', 'H:mm'], true);
  return parsed.isValid() ? parsed.format('HH:mm') : time?.trim() || '--';
}

function formatRecordTime(time?: string) {
  if (!time?.trim()) return '--';
  const parsed = moment(time, [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'HH:mm'], true);
  return parsed.isValid() ? parsed.format('HH:mm') : time;
}

export function formatMedicationDoseText(
  plan?: { amount?: string; amountUnit?: string; medicationFrequency?: number },
  dictMaps?: MedicationDictMaps,
) {
  const amount = plan?.amount?.trim();
  const unit = resolveDictLabel(dictMaps?.amountUnit ?? {}, plan?.amountUnit);
  const frequency = plan?.medicationFrequency;
  if (!amount && !unit) return '--';
  const dose = `${amount || '--'}${unit || ''}`;
  if (frequency != null && frequency > 0) {
    return `${dose}，每日${frequency}次`;
  }
  return dose;
}

/** 用药摘要：用药x天，每日x次，每次x单位 */
export function formatMedicationSummaryText(
  plan?: {
    amount?: string;
    amountUnit?: string;
    medicationFrequency?: number;
    courseTreatment?: number;
    startDate?: string;
    endDate?: string;
  },
  dictMaps?: MedicationDictMaps,
) {
  const parts: string[] = [];
  const daysText = resolveMedicationDaysText(plan);
  if (daysText) {
    parts.push(`用药${daysText}`);
  }

  const frequency = Number(plan?.medicationFrequency);
  if (Number.isFinite(frequency) && frequency > 0) {
    parts.push(`每日${frequency}次`);
  }

  const amount = plan?.amount?.trim() || '--';
  const unit = resolveDictLabel(dictMaps?.amountUnit ?? {}, plan?.amountUnit);
  parts.push(`每次${amount}${unit || ''}`);

  return parts.join('，');
}

function resolveMedicationDaysText(
  plan?: {
    courseTreatment?: number;
    startDate?: string;
    endDate?: string;
  },
) {
  const course = Number(plan?.courseTreatment);
  if (Number.isFinite(course) && course > 0) {
    return `${Math.floor(course)}天`;
  }
  if (plan?.courseTreatment === 0) {
    return '长期';
  }

  const start = plan?.startDate?.trim() ? moment(plan.startDate) : null;
  const end = plan?.endDate?.trim() ? moment(plan.endDate) : null;
  if (start?.isValid() && end?.isValid()) {
    const days = end.diff(start, 'days') + 1;
    if (days > 0) return `${days}天`;
  }

  return '';
}

export function formatMedicationUsageText(
  plan?: { amount?: string; amountUnit?: string; medicationFrequency?: number; eventBased?: string },
  dictMaps?: MedicationDictMaps,
) {
  const dosePart = formatMedicationDoseText(plan, dictMaps);
  const eventLabel = resolveDictLabel(dictMaps?.eventBased ?? {}, plan?.eventBased);
  const parts: string[] = [];
  if (dosePart && dosePart !== '--') {
    parts.push(dosePart);
  }
  if (eventLabel && eventLabel !== '无' && plan?.eventBased?.trim() !== '无') {
    parts.push(eventLabel);
  }
  return parts.length > 0 ? parts.join('，') : '--';
}

export function formatMedicationTimeList(timeList?: string[]) {
  if (!Array.isArray(timeList) || timeList.length === 0) {
    return '--';
  }
  return timeList.map(time => formatPlanTime(time)).join("，");
}

export function formatMedicationPlanDate(date?: string) {
  if (!date?.trim()) {
    return '--';
  }
  const parsed = moment(date, ['YYYY-MM-DD', 'YYYYMMDD', moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format('YYYY/MM/DD') : date;
}

export async function loadMyMedicationPlans(params?: { planType?: number }) {
  try {
    const res = await getMyMedicationPlanList(params);
    const data = apiResourceData<MedicationPlan[]>(
      res as unknown as { code?: number; data?: MedicationPlan[] },
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getDrugPatientRuleStatusLabel(status?: number) {
  if (status === 0) return '进行中';
  if (status === 1) return '已暂停';
  if (status === 2) return '已结束';
  return '--';
}

export function formatDrugPatientRuleCycle(startDate?: string, endDate?: string) {
  const formatDate = (value?: string) => {
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY/MM/DD') : value?.trim() || '--';
  };
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start === '--' && end === '--') return '--';
  return `${start} - ${end}`;
}

export function formatDrugRuleListNames(drugRuleList?: MedicationPlan[]) {
  const names = (drugRuleList ?? [])
    .map(item => item.name?.trim())
    .filter(Boolean);
  return names.length > 0 ? names.join('、') : '--';
}

export async function loadDrugPatientRuleHistoryPage(pageNum: number, pageSize: number) {
  try {
    const res = await getDrugPatientRuleHistoryList({ pageNum, pageSize });
    if (!isResourceApiOk(res)) {
      return { rows: [] as DrugPatientRuleInfo[], total: 0, hasMore: false };
    }
    const rows = getResourceRows<DrugPatientRuleInfo>(res);
    const total = (res as { total?: number }).total ?? rows.length;
    return {
      rows,
      total,
      hasMore: pageNum * pageSize < total,
    };
  } catch {
    return { rows: [] as DrugPatientRuleInfo[], total: 0, hasMore: false };
  }
}

export async function loadMedicationPlanForEdit(medicationPlanId: string | number) {
  try {
    const res = await getMedicationPlanInfo(medicationPlanId);
    return apiResourceData<MedicationPlan>(
      res as unknown as { code?: number; data?: MedicationPlan },
    );
  } catch {
    return undefined;
  }
}

export type MedicationPlanFormValues = {
  drugName: string;
  drugType: string;
  dosageSpec: string;
  mealRelation: string;
  doseAmount: string;
  doseUnit: string;
  dailyFrequency: number;
  takeTimes: string[];
  weekDays: string[];
  cycleStartDate: string;
  cycleEndDate: string;
  continuousMedication: boolean;
};

export function mapMedicationPlanToFormValues(plan: MedicationPlan): MedicationPlanFormValues {
  const dailyFrequency = Math.max(1, plan.medicationFrequency ?? 1);
  const rawTimes = (plan.timeList ?? [])
    .map(time => formatPlanTime(time))
    .filter(time => time !== '--');
  const takeTimes = Array.from({ length: dailyFrequency }, (_, index) => rawTimes[index] ?? '08:00');
  const weekDays = weekDayApiToLabels(plan.daysWeek);
  const startMoment = plan.startDate
    ? moment(plan.startDate, ['YYYY-MM-DD', 'YYYYMMDD'], true)
    : null;
  const endMoment = plan.endDate
    ? moment(plan.endDate, ['YYYY-MM-DD', 'YYYYMMDD'], true)
    : null;
  const cycleStartDate = startMoment?.isValid()
    ? startMoment.format('YYYY-MM-DD')
    : moment().format('YYYY-MM-DD');

  return {
    drugName: plan.name?.trim() ?? '',
    drugType: plan.drugType?.trim() || '片剂',
    dosageSpec: plan.remark?.trim() ?? '',
    mealRelation: plan.eventBased?.trim() ?? '',
    doseAmount: plan.amount?.trim() || '1',
    doseUnit: plan.amountUnit?.trim() ?? '',
    dailyFrequency,
    takeTimes,
    weekDays: weekDays.length > 0 ? weekDays : [...WEEKDAY_LABELS],
    cycleStartDate,
    cycleEndDate: endMoment?.isValid()
      ? endMoment.format('YYYY-MM-DD')
      : moment(cycleStartDate).add(7, 'day').format('YYYY-MM-DD'),
    continuousMedication: plan.courseTreatment === 0,
  };
}

export function isPersonalMedicationPlan(plan?: MedicationPlan | null) {
  return plan != null && plan.planType !== 1;
}

export function getMedicationPlanTypeLabel(planType?: number) {
  return planType === 1 ? '处方' : '个人';
}

export function isMedicationTaken(action?: number | null) {
  return action === 1;
}

export function canMedicationCheckIn(action?: number | null) {
  return action == null;
}

export function mapIndexPlanItem(
  item: IndexMedicationPlanItem,
  dictMaps?: MedicationDictMaps,
): MedicationPlanItemView | null {
  const plan = item.healthMedicationPlan;
  const medicationPlanId = toQueryId(plan?.medicationPlanId);
  if (!plan || !medicationPlanId) return null;

  const medicationPlanTime = formatPlanTime(item.medicationPlanTime ?? plan.timeList?.[0]);
  const planType = plan.planType ?? 0;

  return {
    key: `${medicationPlanId}-${medicationPlanTime}`,
    medicationPlanId,
    medicationPlanTime,
    name: plan.name?.trim() || '--',
    doseText: formatMedicationDoseText(plan, dictMaps),
    planType,
    planTypeLabel: getMedicationPlanTypeLabel(planType),
    taken: isMedicationTaken(item.action),
    canCheckIn: canMedicationCheckIn(item.action),
    action: item.action,
    eventBasedLabel: resolveDictLabel(dictMaps?.eventBased ?? {}, plan.eventBased),
  };
}

export function mapIndexPlanGroups(
  groups: IndexMedicationPlanGroupItem[] | undefined,
  dictMaps?: MedicationDictMaps,
): MedicationPlanGroupView[] {
  return (groups ?? [])
    .map(group => {
      const items = (group.list ?? [])
        .map(item => mapIndexPlanItem(item, dictMaps))
        .filter((item): item is MedicationPlanItemView => item != null);

      if (items.length === 0) return null;

      const time = formatPlanTime(group.medicationPlanTime ?? items[0]?.medicationPlanTime);
      const eventBasedLabel = items.find(item => {
        const label = item.eventBasedLabel?.trim();
        return Boolean(label) && label !== '无';
      })?.eventBasedLabel?.trim() ?? '';

      return {
        time,
        timeLabel: time,
        eventBasedLabel,
        items,
      };
    })
    .filter((group): group is MedicationPlanGroupView => group != null);
}

function formatHistoryDayLabel(yyyyMMdd?: string) {
  const parsed = moment(yyyyMMdd, 'YYYYMMDD', true);
  if (!parsed.isValid()) return yyyyMMdd?.trim() || '--';
  if (parsed.isSame(moment(), 'day')) return '今天';
  if (parsed.isSame(moment().subtract(1, 'day'), 'day')) return '昨天';
  return parsed.format('M月D日');
}

export function mapMedicationHistoryRows(rows: MedicationRecordDayGroup[]): MedicationHistoryDayView[] {
  return rows
    .map(group => {
      const items = (group.list ?? []).map((item, index) => {
        const plan = item.snapshotRule;
        const planType = plan?.planType ?? 0;
        return {
          key: `${group.yyyyMMdd ?? ''}-${item.medicationRecordId ?? index}`,
          name: plan?.name?.trim() || '--',
          planTypeLabel: getMedicationPlanTypeLabel(planType),
          isPrescription: planType === 1,
          timeText: formatRecordTime(item.actionTime ?? item.medicationPlanTime),
          taken: isMedicationTaken(item.action),
        };
      });

      if (items.length === 0) return null;

      return {
        key: group.yyyyMMdd ?? String(items[0]?.key),
        label: formatHistoryDayLabel(group.yyyyMMdd),
        items,
      };
    })
    .filter((group): group is MedicationHistoryDayView => group != null);
}

/** 按展示顺序截取最近 N 条服药记录（日内倒序） */
export function limitMedicationHistoryDays(
  days: MedicationHistoryDayView[],
  limit = 5,
): MedicationHistoryDayView[] {
  let remaining = limit;
  const result: MedicationHistoryDayView[] = [];
  for (const day of days) {
    if (remaining <= 0) break;
    const items = [...day.items].reverse().slice(0, remaining);
    if (items.length === 0) continue;
    result.push({ ...day, items });
    remaining -= items.length;
  }
  return result;
}

export function mapMedicationProgress(data?: { takeCount?: number; notTakeCount?: number; rate?: number } | null): MedicationProgressView {
  const takeCount = data?.takeCount ?? 0;
  const notTakeCount = data?.notTakeCount ?? 0;
  const rateValue = Number(data?.rate);
  const rate = Number.isFinite(rateValue) ? Math.min(100, Math.max(0, Math.round(rateValue))) : 0;
  return { rate, takeCount, notTakeCount };
}

/** 按今日用药列表统计进度（已服用 / 全部条目） */
export function buildMedicationProgressFromPlanGroups(
  groups: MedicationPlanGroupView[],
): MedicationProgressView {
  let takeCount = 0;
  let total = 0;
  for (const group of groups) {
    for (const item of group.items) {
      total += 1;
      if (item.taken) takeCount += 1;
    }
  }
  const notTakeCount = Math.max(0, total - takeCount);
  const rate = total > 0 ? Math.min(100, Math.max(0, Math.round((takeCount / total) * 100))) : 0;
  return { rate, takeCount, notTakeCount };
}

export function applyMedicationCheckInToPlanGroups(
  groups: MedicationPlanGroupView[],
  itemKey: string,
): MedicationPlanGroupView[] {
  return applyMedicationCheckInBatchToPlanGroups(groups, [itemKey]);
}

export function applyMedicationCheckInBatchToPlanGroups(
  groups: MedicationPlanGroupView[],
  itemKeys: string[],
): MedicationPlanGroupView[] {
  if (itemKeys.length === 0) return groups;
  const keySet = new Set(itemKeys);
  return groups.map(group => ({
    ...group,
    items: group.items.map(planItem =>
      keySet.has(planItem.key)
        ? { ...planItem, taken: true, canCheckIn: false, action: 1 }
        : planItem,
    ),
  }));
}

export function applyMedicationCheckInToProgress(progress: MedicationProgressView): MedicationProgressView {
  return applyMedicationCheckInBatchToProgress(progress, 1);
}

export function applyMedicationCheckInBatchToProgress(
  progress: MedicationProgressView,
  count: number,
): MedicationProgressView {
  if (count <= 0) return progress;
  const takeCount = progress.takeCount + count;
  const notTakeCount = Math.max(0, progress.notTakeCount - count);
  const total = takeCount + notTakeCount;
  const rate = total > 0 ? Math.min(100, Math.round((takeCount / total) * 100)) : 0;
  return { rate, takeCount, notTakeCount };
}

export function buildMedicationCheckInConfirmMessage(items: MedicationPlanItemView[]) {
  const names = items.map(item => item.name).filter(Boolean).join('、');
  return `确定要把【${names}】全部标记为“已服用”吗？`;
}

let medicationDictMapsPromise: Promise<MedicationDictMaps> | null = null;

export async function loadMedicationDictMaps(): Promise<MedicationDictMaps> {
  if (medicationDictMapsPromise) return medicationDictMapsPromise;

  medicationDictMapsPromise = (async () => {
    const requests = [
      { key: 'amountUnit', dictType: DICT_TYPES.drugAmountUnit },
      { key: 'eventBased', dictType: DICT_TYPES.medicationEventBased },
    ] as const;

    const responses = await Promise.all(
      requests.map(item =>
        getDictDataByType(item.dictType)
          .then(res => ({
            ...item,
            items: isResourceApiOk(res) ? apiResourceData<DictDataItem[]>(res as any) ?? [] : [],
          }))
          .catch(() => ({ ...item, items: [] as DictDataItem[] })),
      ),
    );

    const maps: MedicationDictMaps = { ...EMPTY_DICT_MAPS };

    for (const item of responses) {
      const labelMap = buildDictLabelMap(item.items);
      const options = item.items
        .filter(row => row.dictValue)
        .map(row => ({
          label: row.dictLabel?.trim() || String(row.dictValue),
          value: String(row.dictValue),
        }));

      if (item.key === 'amountUnit') {
        maps.amountUnit = labelMap;
        maps.amountUnitOptions = options;
      } else {
        maps.eventBased = labelMap;
        maps.eventBasedOptions = options;
      }
    }

    return maps;
  })().catch(error => {
    medicationDictMapsPromise = null;
    throw error;
  });

  return medicationDictMapsPromise;
}

export async function loadMedicationPlanGroups(dictMaps?: MedicationDictMaps) {
  return loadMedicationPlanGroupsForDate(moment().format('YYYY-MM-DD'), dictMaps);
}

export async function loadMedicationPlanGroupsForDate(
  customerLocalDate: string,
  dictMaps?: MedicationDictMaps,
) {
  try {
    const maps = dictMaps ?? (await loadMedicationDictMaps());
    const res = await getIndexMedicationPlanGroupByTime({ customerLocalDate });
    if (!isResourceApiOk(res)) return [];
    return mapIndexPlanGroups(apiResourceData<IndexMedicationPlanGroupItem[]>(res as any), maps);
  } catch {
    return [];
  }
}

export async function loadMedicationProgress() {
  const startDate = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endDate = moment().endOf('isoWeek').format('YYYY-MM-DD');

  try {
    const res = await getMedicationRecordStatis({ startDate, endDate });
    if (!isResourceApiOk(res)) {
      return mapMedicationProgress(null);
    }
    return mapMedicationProgress(apiResourceData(res as any));
  } catch {
    return mapMedicationProgress(null);
  }
}

export async function loadMedicationHistory(limitDays = 7) {
  const endDate = moment().format('YYYY-MM-DD');
  const startDate = moment().subtract(limitDays - 1, 'day').format('YYYY-MM-DD');

  try {
    const res = await getMedicationRecordAll({
      startDate,
      endDate,
      pageSize: Math.max(limitDays, 7),
      pageNum: 1,
    });
    return mapMedicationHistoryRows(getResourceRows(res));
  } catch {
    return [];
  }
}

export async function submitMedicationCheckIn(item: MedicationPlanItemView) {
  return addMedicationRecord({
    medicationPlanId: item.medicationPlanId,
    medicationPlanTime: item.medicationPlanTime,
    action: 1,
  });
}

export function weekDayLabelsToApi(days: string[]) {
  return days
    .map(day => WEEKDAY_TO_API[day])
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);
}

export function weekDayApiToLabels(days?: number[]) {
  return (days ?? [])
    .map(day => API_TO_WEEKDAY[day])
    .filter((value): value is string => !!value);
}

export function buildMedicationPlanPayload(input: {
  name: string;
  drugType: string;
  remark?: string;
  eventBased: string;
  amount: string;
  amountUnit: string;
  medicationFrequency: number;
  timeList: string[];
  weekDays: string[];
  startDate: string;
  endDate?: string;
  continuousMedication: boolean;
  reminderEnabled: boolean;
}): MedicationPlanPayload {
  return {
    name: input.name.trim(),
    drugType: input.drugType,
    remark: input.remark?.trim() || undefined,
    eventBased: input.eventBased,
    amount: input.amount.trim(),
    amountUnit: input.amountUnit,
    medicationFrequency: input.medicationFrequency,
    timeList: input.timeList.map(time => moment(time, 'HH:mm', true).format('HH:mm')),
    startDate: input.startDate,
    endDate: input.continuousMedication ? undefined : input.endDate,
    daysWeek: weekDayLabelsToApi(input.weekDays),
    courseTreatment: input.continuousMedication ? 0 : -1,
    isEnable: input.reminderEnabled ? 1 : 0,
    dataType: 0,
  };
}

export { WEEKDAY_LABELS };

export const DRUG_TIP_TYPE_OPTIONS = [
  { label: '铃声提醒', value: '0' },
  { label: '震动', value: '1' },
  { label: '语音播报', value: '2' },
] as const;

export const DRUG_BEFORE_TIP_MINUTES = [5, 10, 15] as const;

export type DrugTipSettings = {
  drugIsTip: number;
  drugBeforeTipTime: number;
  drugTipTypes: string[];
};

export function normalizeDrugBeforeTipTime(minutes?: number) {
  if (minutes === 5 || minutes === 10 || minutes === 15) return minutes;
  return 5;
}

export function parseDrugTipTypes(value?: string | null) {
  if (value == null || value === '') {
    return DRUG_TIP_TYPE_OPTIONS.map(item => item.value);
  }

  const parsed = value
    .split(',')
    .map(item => item.trim())
    .filter(item => DRUG_TIP_TYPE_OPTIONS.some(option => option.value === item));

  return parsed.length > 0 ? parsed : DRUG_TIP_TYPE_OPTIONS.map(item => item.value);
}

export function encodeDrugTipTypes(types: string[]) {
  return types.join(',');
}

export function buildDrugTipSettingsFromUserExtr(userExtr?: {
  drugIsTip?: number;
  drugBeforeTipTime?: number;
  drugTipTypes?: string;
} | null): DrugTipSettings {
  const drugIsTip = userExtr?.drugIsTip === 0 ? 0 : 1;
  const drugTipTypes = drugIsTip === 0 ? [] : parseDrugTipTypes(userExtr?.drugTipTypes);

  return {
    drugIsTip,
    drugBeforeTipTime: normalizeDrugBeforeTipTime(userExtr?.drugBeforeTipTime),
    drugTipTypes,
  };
}

export function buildUpdateDrugTipInfoPayload(settings: DrugTipSettings) {
  const drugTipTypes = settings.drugTipTypes;
  return {
    drugIsTip: drugTipTypes.length > 0 && settings.drugIsTip !== 0 ? 1 : 0,
    drugBeforeTipTime: settings.drugBeforeTipTime,
    drugTipTypes: encodeDrugTipTypes(drugTipTypes),
  };
}
