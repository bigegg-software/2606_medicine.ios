import {
  addPatientDevice,
  getPatientDeviceList,
  removePatientDeviceById,
  type PatientDevice,
} from '@/api/device';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import store from '@/store/store';
import { SET_BOUND_DEVICES, type BoundEquipment } from '@/store/type/equipment';
import { saveBoundDevices } from './equipmentStorage';

/** Polar 胸带在服务端的设备类型标识 */
export const POLAR_DEVICE_TYPE = 'polar';

export function mapPatientDeviceToBound(
  item: PatientDevice,
  runtime?: Partial<Pick<BoundEquipment, 'connected' | 'batteryPercent' | 'firmwareVersion'>>,
): BoundEquipment | null {
  const deviceId = item.deviceId != null ? String(item.deviceId).trim() : '';
  if (!deviceId) return null;
  return {
    recordId: item.id != null && item.id !== '' ? String(item.id) : undefined,
    id: deviceId,
    deviceId,
    name: item.deviceName?.trim() || deviceId,
    deviceType: item.deviceType?.trim() || POLAR_DEVICE_TYPE,
    connected: runtime?.connected ?? false,
    batteryPercent: runtime?.batteryPercent,
    firmwareVersion: runtime?.firmwareVersion,
  };
}

/** 拉取服务端设备列表，并合并本地连接态 */
export async function fetchBoundDevicesFromServer(
  current: BoundEquipment[] = [],
): Promise<BoundEquipment[] | null> {
  try {
    const res = await getPatientDeviceList();
    if (!isResourceApiOk(res as unknown as { code?: number })) return null;
    const rows = apiResourceData<PatientDevice[]>(res) ?? [];
    if (!Array.isArray(rows)) return [];

    const runtimeById = new Map(
      current.map(item => [item.deviceId, item] as const),
    );

    return rows
      .map(item => {
        const deviceId = item.deviceId != null ? String(item.deviceId) : '';
        const runtime = runtimeById.get(deviceId);
        return mapPatientDeviceToBound(item, {
          connected: runtime?.connected,
          batteryPercent: runtime?.batteryPercent,
          firmwareVersion: runtime?.firmwareVersion,
        });
      })
      .filter((item): item is BoundEquipment => item != null);
  } catch {
    return null;
  }
}

/** 连接成功后同步到服务端（同类型+deviceId 覆盖更新） */
export async function upsertBoundDeviceOnServer(device: BoundEquipment) {
  try {
    const res = await addPatientDevice({
      ...(device.recordId ? { id: device.recordId } : {}),
      deviceType: device.deviceType?.trim() || POLAR_DEVICE_TYPE,
      deviceName: device.name,
      deviceId: String(device.deviceId),
      extr: {
        ...(device.batteryPercent != null
          ? { batteryPercent: device.batteryPercent }
          : {}),
        ...(device.firmwareVersion
          ? { firmwareVersion: device.firmwareVersion }
          : {}),
      },
    });
    return isResourceApiOk(res as unknown as { code?: number });
  } catch {
    return false;
  }
}

/** 按服务端主键删除 */
export async function removeBoundDeviceOnServer(recordId?: string | null) {
  const id = recordId?.trim();
  if (!id) return true;
  try {
    const res = await removePatientDeviceById(id);
    return isResourceApiOk(res as unknown as { code?: number });
  } catch {
    return false;
  }
}

/** 连接成功后：上报服务端并回拉列表补齐 recordId */
export async function syncEquipmentAfterConnect(deviceId: string) {
  const id = String(deviceId);
  const device = store.getState().equipment.boundDevices.find(
    item => item.deviceId === id,
  );
  if (!device) return;

  await upsertBoundDeviceOnServer(device);
  const remote = await fetchBoundDevicesFromServer(
    store.getState().equipment.boundDevices,
  );
  if (remote == null) return;
  store.dispatch({ type: SET_BOUND_DEVICES, payload: remote });
  void saveBoundDevices(remote).catch(() => undefined);
}
