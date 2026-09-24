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

export function resolveInitialServiceStation(
  list: ServiceStationItem[],
  saved?: SelectedServiceStation | null,
): ServiceStationItem | null {
  if (list.length === 0) return null;
  const savedId = saved?.stationId?.trim();
  if (savedId) {
    const matched = list.find(item => toServiceStationId(item) === savedId);
    if (matched) return matched;
  }
  return list[0] ?? null;
}
