export const SET_EQUIPMENT_HYDRATED = 'SET_EQUIPMENT_HYDRATED';
export const SET_EQUIPMENT_SDK_READY = 'SET_EQUIPMENT_SDK_READY';
export const SET_EQUIPMENT_SCANNING = 'SET_EQUIPMENT_SCANNING';
export const SET_EQUIPMENT_CONNECTING = 'SET_EQUIPMENT_CONNECTING';
export const SET_SCANNED_DEVICES = 'SET_SCANNED_DEVICES';
export const UPSERT_SCANNED_DEVICE = 'UPSERT_SCANNED_DEVICE';
export const CLEAR_SCANNED_DEVICES = 'CLEAR_SCANNED_DEVICES';
export const SET_BOUND_DEVICES = 'SET_BOUND_DEVICES';
export const UPSERT_BOUND_DEVICE = 'UPSERT_BOUND_DEVICE';
export const UPDATE_BOUND_DEVICE = 'UPDATE_BOUND_DEVICE';
export const REMOVE_BOUND_DEVICE = 'REMOVE_BOUND_DEVICE';
export const SET_DEVICE_CONNECTED = 'SET_DEVICE_CONNECTED';
export const SET_DEVICE_DISCONNECTED = 'SET_DEVICE_DISCONNECTED';
export const SET_DEVICE_BATTERY = 'SET_DEVICE_BATTERY';

/** 已绑定设备（服务端列表 + 本地连接态） */
export type BoundEquipment = {
  /** 服务端主键，删除接口用；未同步前可为空 */
  recordId?: string;
  /** 与 deviceId 一致，统一 string */
  id: string;
  /** 业务侧设备标识（如蓝牙 deviceId） */
  deviceId: string;
  name: string;
  /** 设备类型（如 polar） */
  deviceType?: string;
  connected: boolean;
  batteryPercent?: number;
  firmwareVersion?: string;
};

/** 扫描到的附近设备 */
export type ScannedEquipment = {
  deviceId: string;
  name: string;
  rssi?: number;
  connectable?: boolean;
};

export interface EquipmentState {
  hydrated: boolean;
  sdkReady: boolean;
  isScanning: boolean;
  isConnecting: boolean;
  connectingDeviceId: string | null;
  scannedDevices: ScannedEquipment[];
  boundDevices: BoundEquipment[];
}

export type EquipmentAction =
  | { type: typeof SET_EQUIPMENT_HYDRATED; payload: boolean }
  | { type: typeof SET_EQUIPMENT_SDK_READY; payload: boolean }
  | { type: typeof SET_EQUIPMENT_SCANNING; payload: boolean }
  | {
      type: typeof SET_EQUIPMENT_CONNECTING;
      payload: { isConnecting: boolean; deviceId?: string | null };
    }
  | { type: typeof SET_SCANNED_DEVICES; payload: ScannedEquipment[] }
  | { type: typeof UPSERT_SCANNED_DEVICE; payload: ScannedEquipment }
  | { type: typeof CLEAR_SCANNED_DEVICES }
  | { type: typeof SET_BOUND_DEVICES; payload: BoundEquipment[] }
  | { type: typeof UPSERT_BOUND_DEVICE; payload: BoundEquipment }
  | {
      type: typeof UPDATE_BOUND_DEVICE;
      payload: { deviceId: string; patch: Partial<BoundEquipment> };
    }
  | { type: typeof REMOVE_BOUND_DEVICE; payload: string }
  | {
      type: typeof SET_DEVICE_CONNECTED;
      payload: { deviceId: string; name: string };
    }
  | { type: typeof SET_DEVICE_DISCONNECTED; payload: string }
  | {
      type: typeof SET_DEVICE_BATTERY;
      payload: { deviceId: string; batteryPercent: number };
    };
