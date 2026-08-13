import {
  CLEAR_SCANNED_DEVICES,
  REMOVE_BOUND_DEVICE,
  SET_BOUND_DEVICES,
  SET_DEVICE_BATTERY,
  SET_DEVICE_CONNECTED,
  SET_DEVICE_DISCONNECTED,
  SET_EQUIPMENT_CONNECTING,
  SET_EQUIPMENT_HYDRATED,
  SET_EQUIPMENT_SCANNING,
  SET_EQUIPMENT_SDK_READY,
  SET_SCANNED_DEVICES,
  UPDATE_BOUND_DEVICE,
  UPSERT_BOUND_DEVICE,
  UPSERT_SCANNED_DEVICE,
  type BoundEquipment,
  type EquipmentAction,
  type EquipmentState,
} from '../type/equipment';

const initialState: EquipmentState = {
  hydrated: false,
  sdkReady: false,
  isScanning: false,
  isConnecting: false,
  connectingDeviceId: null,
  scannedDevices: [],
  boundDevices: [],
};

function upsertBound(
  list: BoundEquipment[],
  device: BoundEquipment,
): BoundEquipment[] {
  const index = list.findIndex(item => item.deviceId === device.deviceId);
  if (index < 0) return [...list, device];
  const next = [...list];
  next[index] = { ...next[index], ...device };
  return next;
}

export default function equipmentReducer(
  state = initialState,
  action: EquipmentAction,
): EquipmentState {
  switch (action.type) {
    case SET_EQUIPMENT_HYDRATED:
      return { ...state, hydrated: action.payload };
    case SET_EQUIPMENT_SDK_READY:
      return { ...state, sdkReady: action.payload };
    case SET_EQUIPMENT_SCANNING:
      return { ...state, isScanning: action.payload };
    case SET_EQUIPMENT_CONNECTING:
      return {
        ...state,
        isConnecting: action.payload.isConnecting,
        connectingDeviceId: action.payload.isConnecting
          ? action.payload.deviceId ?? state.connectingDeviceId
          : null,
      };
    case SET_SCANNED_DEVICES:
      return { ...state, scannedDevices: action.payload };
    case UPSERT_SCANNED_DEVICE: {
      const index = state.scannedDevices.findIndex(
        item => item.deviceId === action.payload.deviceId,
      );
      if (index < 0) {
        return {
          ...state,
          scannedDevices: [...state.scannedDevices, action.payload],
        };
      }
      const scannedDevices = [...state.scannedDevices];
      scannedDevices[index] = { ...scannedDevices[index], ...action.payload };
      return { ...state, scannedDevices };
    }
    case CLEAR_SCANNED_DEVICES:
      return { ...state, scannedDevices: [] };
    case SET_BOUND_DEVICES:
      return { ...state, boundDevices: action.payload };
    case UPSERT_BOUND_DEVICE:
      return {
        ...state,
        boundDevices: upsertBound(state.boundDevices, action.payload),
      };
    case UPDATE_BOUND_DEVICE: {
      const { deviceId, patch } = action.payload;
      return {
        ...state,
        boundDevices: state.boundDevices.map(item =>
          item.deviceId === deviceId ? { ...item, ...patch } : item,
        ),
      };
    }
    case REMOVE_BOUND_DEVICE:
      return {
        ...state,
        boundDevices: state.boundDevices.filter(
          item => item.deviceId !== action.payload,
        ),
      };
    case SET_DEVICE_CONNECTED: {
      const { deviceId, name } = action.payload;
      const existing = state.boundDevices.find(item => item.deviceId === deviceId);
      const nextDevice: BoundEquipment = {
        recordId: existing?.recordId,
        id: deviceId,
        deviceId,
        name: name || existing?.name || deviceId,
        deviceType: existing?.deviceType,
        connected: true,
        batteryPercent: existing?.batteryPercent,
        firmwareVersion: existing?.firmwareVersion,
      };
      return {
        ...state,
        isConnecting: false,
        connectingDeviceId: null,
        isScanning: false,
        boundDevices: upsertBound(
          state.boundDevices.map(item =>
            item.deviceId === deviceId ? item : { ...item, connected: false },
          ),
          nextDevice,
        ),
      };
    }
    case SET_DEVICE_DISCONNECTED:
      return {
        ...state,
        isConnecting: false,
        connectingDeviceId: null,
        boundDevices: state.boundDevices.map(item =>
          item.deviceId === action.payload
            ? { ...item, connected: false }
            : item,
        ),
      };
    case SET_DEVICE_BATTERY:
      return {
        ...state,
        boundDevices: state.boundDevices.map(item =>
          item.deviceId === action.payload.deviceId
            ? { ...item, batteryPercent: action.payload.batteryPercent }
            : item,
        ),
      };
    default:
      return state;
  }
}
