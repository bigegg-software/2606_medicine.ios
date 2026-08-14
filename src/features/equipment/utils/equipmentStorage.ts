import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BoundEquipment } from '@/store/type/equipment';

const BOUND_DEVICES_KEY = 'equipment.boundDevices';
/** 按用户记录：是否允许冷启动自动重连 */
const AUTO_RECONNECT_KEY = 'equipment.autoReconnect';
/** 首次连接心率设备说明文案是否已同意 */
const HR_CONNECT_CONSENT_KEY = 'equipment.hrConnectConsent';

export type EquipmentAutoReconnectPref = {
  /** 用户 id（string） */
  userId: string;
  /** 要自动连接的设备 deviceId */
  deviceId: string;
  /** 手动断开后为 false，连接成功后为 true */
  enabled: boolean;
};

export async function loadBoundDevices(): Promise<BoundEquipment[]> {
  try {
    const raw = await AsyncStorage.getItem(BOUND_DEVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BoundEquipment[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item?.deviceId)
      .map(item => ({
        recordId: item.recordId != null && item.recordId !== ''
          ? String(item.recordId)
          : undefined,
        id: String(item.deviceId),
        deviceId: String(item.deviceId),
        name: item.name?.trim() || String(item.deviceId),
        deviceType: item.deviceType?.trim() || undefined,
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
    recordId: item.recordId,
    id: String(item.deviceId),
    deviceId: String(item.deviceId),
    name: item.name,
    deviceType: item.deviceType,
    connected: false,
    batteryPercent: item.batteryPercent,
    firmwareVersion: item.firmwareVersion,
  }));
  await AsyncStorage.setItem(BOUND_DEVICES_KEY, JSON.stringify(payload));
}

export async function loadAutoReconnectPref(): Promise<EquipmentAutoReconnectPref | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTO_RECONNECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EquipmentAutoReconnectPref;
    if (!parsed?.userId || !parsed?.deviceId) return null;
    return {
      userId: String(parsed.userId),
      deviceId: String(parsed.deviceId),
      enabled: Boolean(parsed.enabled),
    };
  } catch {
    return null;
  }
}

export async function saveAutoReconnectPref(
  pref: EquipmentAutoReconnectPref | null,
) {
  if (!pref) {
    await AsyncStorage.removeItem(AUTO_RECONNECT_KEY);
    return;
  }
  await AsyncStorage.setItem(
    AUTO_RECONNECT_KEY,
    JSON.stringify({
      userId: String(pref.userId),
      deviceId: String(pref.deviceId),
      enabled: Boolean(pref.enabled),
    }),
  );
}

/** 连接成功：记录当前用户 + 设备，允许下次自动连 */
export async function enableAutoReconnect(userId: string, deviceId: string) {
  const uid = String(userId).trim();
  const did = String(deviceId).trim();
  if (!uid || !did) return;
  await saveAutoReconnectPref({
    userId: uid,
    deviceId: did,
    enabled: true,
  });
}

/** 手动断开：同一用户下关闭自动连 */
export async function disableAutoReconnect(userId: string, deviceId?: string) {
  const uid = String(userId).trim();
  if (!uid) return;
  const current = await loadAutoReconnectPref();
  if (!current || current.userId !== uid) return;
  if (deviceId && current.deviceId !== String(deviceId)) return;
  await saveAutoReconnectPref({
    ...current,
    enabled: false,
  });
}

/** 删除设备时清掉对应自动连配置 */
export async function clearAutoReconnectForDevice(
  userId: string,
  deviceId: string,
) {
  const uid = String(userId).trim();
  const did = String(deviceId).trim();
  const current = await loadAutoReconnectPref();
  if (!current) return;
  if (current.userId === uid && current.deviceId === did) {
    await saveAutoReconnectPref(null);
  }
}

/** 是否已同意首次连接心率设备说明 */
export async function loadHrConnectConsent(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(HR_CONNECT_CONSENT_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

/** 保存首次连接说明同意状态 */
export async function saveHrConnectConsent() {
  await AsyncStorage.setItem(HR_CONNECT_CONSENT_KEY, '1');
}
