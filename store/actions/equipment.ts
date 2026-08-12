import type { AppDispatch, RootState } from '../store';
import {
  REMOVE_BOUND_DEVICE,
  SET_BOUND_DEVICES,
  SET_EQUIPMENT_HYDRATED,
} from '../type/equipment';
import { loadBoundDevices } from '@/src/features/equipment/utils/equipmentStorage';
import {
  connectPolarEquipment,
  disconnectPolarEquipment,
  initPolarEquipmentSdk,
  schedulePersistBoundDevices,
  startPolarEquipmentScan,
  stopPolarEquipmentScan,
} from '@/src/features/equipment/utils/polarEquipmentService';

/** 从本地缓存恢复已绑定设备 */
export const hydrateEquipment =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().equipment.hydrated) return;
    const devices = await loadBoundDevices();
    dispatch({ type: SET_BOUND_DEVICES, payload: devices });
    dispatch({ type: SET_EQUIPMENT_HYDRATED, payload: true });
  };

export const prepareEquipmentSdk = () => async () => {
  await initPolarEquipmentSdk();
};

export const startEquipmentScan =
  (options?: { autoStopMs?: number }) => async () => {
    return startPolarEquipmentScan(options);
  };

export const stopEquipmentScan = () => async () => {
  await stopPolarEquipmentScan();
};

export const connectEquipment = (deviceId: string) => async () => {
  return connectPolarEquipment(deviceId);
};

export const disconnectEquipment = (deviceId: string) => async () => {
  return disconnectPolarEquipment(deviceId);
};

/** 删除绑定：若已连接先断开，再移出本地列表 */
export const removeEquipment =
  (deviceId: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const id = String(deviceId);
    const target = getState().equipment.boundDevices.find(
      item => item.deviceId === id,
    );
    if (target?.connected) {
      await disconnectPolarEquipment(id);
    }
    dispatch({ type: REMOVE_BOUND_DEVICE, payload: id });
    schedulePersistBoundDevices();
  };
