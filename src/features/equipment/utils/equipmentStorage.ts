import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BoundEquipment } from '@/store/type/equipment';

const BOUND_DEVICES_KEY = 'equipment.boundDevices';

export async function loadBoundDevices(): Promise<BoundEquipment[]> {
  try {
    const raw = await AsyncStorage.getItem(BOUND_DEVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BoundEquipment[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item?.deviceId)
      .map(item => ({
        id: String(item.deviceId),
        deviceId: String(item.deviceId),
        name: item.name?.trim() || String(item.deviceId),
        connected: false,
        batteryPercent:
          item.batteryPercent == null
            ? undefined
            : Math.max(0, Math.min(100, Math.round(Number(item.batteryPercent) || 0))),
        firmwareVersion: item.firmwareVersion?.trim() || undefined,
      }));
  } catch {
    return [];
  }
}

export async function saveBoundDevices(devices: BoundEquipment[]) {
  const payload = devices.map(item => ({
    id: String(item.deviceId),
    deviceId: String(item.deviceId),
    name: item.name,
    connected: false,
    batteryPercent: item.batteryPercent,
    firmwareVersion: item.firmwareVersion,
  }));
  await AsyncStorage.setItem(BOUND_DEVICES_KEY, JSON.stringify(payload));
}
