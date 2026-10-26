import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getServiceStationList,
  type ServiceStationItem,
} from '@/api/serviceStation';
import { getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';

const SELECTED_STATION_KEY = 'curriculum_selected_service_station';

export type SelectedServiceStation = {
  stationId: string;
  stationName: string;
};

/** 登录会话内手动切换的服务站（切 Tab 保留；退出登录清除） */
let sessionSelectedStation: SelectedServiceStation | null = null;

export function getSessionSelectedServiceStation(): SelectedServiceStation | null {
  return sessionSelectedStation;
}

export function setSessionSelectedServiceStation(station: SelectedServiceStation | null) {
  sessionSelectedStation = station;
}

export function formatServiceStationName(item?: ServiceStationItem | null) {
  const name = item?.stationName?.trim();
  return name || '选择服务站';
}

export function toServiceStationId(item?: ServiceStationItem | null) {
  return item?.stationId != null ? String(item.stationId).trim() : '';
}

export async function loadSelectedServiceStation(): Promise<SelectedServiceStation | null> {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_STATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelectedServiceStation;
    const stationId = parsed?.stationId != null ? String(parsed.stationId).trim() : '';
    if (!stationId) return null;
    return {
      stationId,
      stationName: parsed.stationName?.trim() || '选择服务站',
    };
  } catch {
    return null;
  }
}

export async function saveSelectedServiceStation(station: SelectedServiceStation) {
  const stationId = String(station.stationId).trim();
  if (!stationId) return;
  await AsyncStorage.setItem(
    SELECTED_STATION_KEY,
    JSON.stringify({
      stationId,
      stationName: station.stationName?.trim() || '选择服务站',
    }),
  );
}

/** 退出登录时清除会话与本地缓存，重登后回到所属站 */
export async function clearSelectedServiceStation() {
  sessionSelectedStation = null;
  try {
    await AsyncStorage.removeItem(SELECTED_STATION_KEY);
  } catch {
    /* ignore */
  }
}

/** 拉取启用中的服务站列表（默认拉一页足够切换使用） */
export async function fetchEnabledServiceStations(options?: {
  searchWords?: string;
  pageSize?: number;
  pageNum?: number;
}): Promise<ServiceStationItem[]> {
  const res = await getServiceStationList({
    searchWords: options?.searchWords ?? '',
    pageSize: options?.pageSize ?? 50,
    pageNum: options?.pageNum ?? 1,
  });
  if (!isResourceApiOk(res)) return [];
  return getResourceRows(res);
}

/**
 * 初始化选中服务站：
 * 1. 会话内手动切换（切 Tab 不丢）
 * 2. 用户所属站（首次进入 / 退出重登）
 * 3. 列表第一项
 */
export function resolveInitialServiceStation(
  list: ServiceStationItem[],
  options?: {
    belongingStationId?: string | number | null;
    belongingStationName?: string | null;
    session?: SelectedServiceStation | null;
  },
): ServiceStationItem | null {
  const sessionId = options?.session?.stationId?.trim();
  if (sessionId) {
    const matched = list.find(item => toServiceStationId(item) === sessionId);
    if (matched) return matched;
    return {
      stationId: sessionId,
      stationName: options?.session?.stationName?.trim() || '选择服务站',
    };
  }

  const belongingId =
    options?.belongingStationId != null
      ? String(options.belongingStationId).trim()
      : '';
  if (belongingId) {
    const matched = list.find(item => toServiceStationId(item) === belongingId);
    if (matched) return matched;
    return {
      stationId: belongingId,
      stationName: options?.belongingStationName?.trim() || '选择服务站',
    };
  }

  if (list.length === 0) return null;
  return list[0] ?? null;
}
