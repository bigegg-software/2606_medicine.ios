import moment from 'moment';
import {
  getMeasureDataDetailByDate,
  type MeasureDataItem,
} from '@/api/measureData';
import {
  getWearableDataDetailByCustomerLocalDate,
  WEARABLE_DATA_TYPES,
  type WearableDataItem,
} from '@/api/wearableData';
import { buildSignedChatPayload, saveChatAction } from '@/api/assistant';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  formatMeasureDisplay,
  getHeartRateDisplay,
} from '@/src/features/profile/vitals/vitalsHelpers';
import type { ChatGuideState } from './types';

export const HEALTH_STATUS_QUESTION = '健康状况';
export const HEALTH_STATUS_ANSWER = '好的，为您发送今日健康状况卡片，请查看。';
export const HEALTH_STATUS_ACTION = 'health_status';

const MEASURE_DETAIL_PATH = '/patient/measureData/detailByCustomerLocalDate';
const WEARABLE_DETAIL_PATH = '/patient/wearableData/detailByCustomerLocalDate';

export type HealthStatusCardItem = {
  key: 'bloodPressure' | 'bloodGlucose' | 'heartRate';
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
};

function getTodayDate() {
  return moment().format('YYYY-MM-DD');
}

function pickLatestMeasureItem(items: MeasureDataItem[]) {
  if (!items.length) return undefined;
  return [...items].sort((a, b) => {
    const timeCompare = (b.dataTime ?? '').localeCompare(a.dataTime ?? '');
    if (timeCompare !== 0) return timeCompare;
    return (b.id ?? 0) - (a.id ?? 0);
  })[0];
}

function buildMeasureCard(
  key: 'bloodPressure' | 'bloodGlucose',
  label: string,
  unit: string,
  item: MeasureDataItem | undefined,
  type: '血压' | '血糖',
): HealthStatusCardItem {
  const display = formatMeasureDisplay(item, type);
  return {
    key,
    label,
    value: display.value,
    unit,
    status: display.status.replace(/^・/, ''),
    statusColor: display.statusColor,
  };
}

function buildHeartRateCard(items: WearableDataItem[]): HealthStatusCardItem {
  const display = getHeartRateDisplay(items);
  return {
    key: 'heartRate',
    label: '心率',
    value: display.value,
    unit: '次/分',
    status: display.status.replace(/^・/, ''),
    statusColor: display.statusColor,
  };
}

async function fetchTodayMeasureItem(type: '血压' | '血糖') {
  const res = await getMeasureDataDetailByDate({
    customerLocalDate: getTodayDate(),
    type,
  });
  if (!isResourceApiOk(res as { code?: number })) return undefined;
  const items = apiResourceData<MeasureDataItem[]>(
    res as unknown as { code?: number; data?: MeasureDataItem[] },
  );
  return pickLatestMeasureItem(Array.isArray(items) ? items : []);
}

async function fetchTodayHeartRateItems() {
  const res = await getWearableDataDetailByCustomerLocalDate({
    customerLocalDate: getTodayDate(),
    type: WEARABLE_DATA_TYPES.heartRate,
  });
  if (!isResourceApiOk(res as { code?: number })) return [];
  const data = apiResourceData<WearableDataItem>(
    res as unknown as { code?: number; data?: WearableDataItem },
  );
  return data ? [data] : [];
}

export async function loadHealthStatusCards(): Promise<HealthStatusCardItem[]> {
  const [bloodPressureItem, bloodGlucoseItem, heartRateItems] = await Promise.all([
    fetchTodayMeasureItem('血压'),
    fetchTodayMeasureItem('血糖'),
    fetchTodayHeartRateItems(),
  ]);

  return [
    buildMeasureCard('bloodPressure', '血压', 'mmHg', bloodPressureItem, '血压'),
    buildMeasureCard('bloodGlucose', '血糖', 'mmol/L', bloodGlucoseItem, '血糖'),
    buildHeartRateCard(heartRateItems),
  ];
}

export function parseHealthStatusCardsFromInterfaceData(
  interfaceData: { respData?: unknown } | undefined,
): HealthStatusCardItem[] {
  const respData = interfaceData?.respData as { cards?: HealthStatusCardItem[] } | undefined;
  return Array.isArray(respData?.cards) ? respData.cards : [];
}

export async function requestHealthStatusQuickAction(params: {
  chatId: string;
  chatGuide: ChatGuideState;
  question?: string;
}) {
  const cards = await loadHealthStatusCards();
  const question = params.question?.trim() || HEALTH_STATUS_QUESTION;
  const interfaceData = {
    reqParams: {
      measureUrl: MEASURE_DETAIL_PATH,
      wearableUrl: WEARABLE_DETAIL_PATH,
      customerLocalDate: getTodayDate(),
      types: ['血压', '血糖', WEARABLE_DATA_TYPES.heartRate],
    },
    respData: {
      cards,
    },
  };

  const saveRes = await saveChatAction(
    buildSignedChatPayload({
      chatId: params.chatId,
      question,
      answer: HEALTH_STATUS_ANSWER,
      action: HEALTH_STATUS_ACTION,
      userChatGuideId: params.chatGuide.userChatGuideId,
      userChatGuideText: params.chatGuide.userChatGuideText,
      interfaceData,
      deepMode: 'quick',
    }),
  );

  return {
    saveRes,
    cards,
    answer: HEALTH_STATUS_ANSWER,
    interfaceData,
    question,
  };
}
