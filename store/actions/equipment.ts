import type { AppDispatch, RootState } from '../store';
import {
  REMOVE_BOUND_DEVICE,
  SET_BOUND_DEVICES,
  SET_EQUIPMENT_HYDRATED,
} from '../type/equipment';
import {
  clearAutoReconnectForDevice,
  loadAutoReconnectPref,
  loadBoundDevices,
} from '@/src/features/equipment/utils/equipmentStorage';
import {
  fetchBoundDevicesFromServer,
  removeBoundDeviceOnServer,
} from '@/src/features/equipment/utils/equipmentApiSync';
import {
  connectPolarEquipment,
  disconnectPolarEquipment,
  initPolarEquipmentSdk,
  schedulePersistBoundDevices,
  startPolarEquipmentScan,
  stopPolarEquipmentScan,
} from '@/src/features/equipment/utils/polarEquipmentService';

function resolveUserId(getState: () => RootState): string | null {
  const userId =
    getState().user.info?.userId ?? getState().user.userExtr?.userId;
  return userId != null && String(userId).trim() !== ''
    ? String(userId)
    : null;
}

/** 从服务端同步已绑定设备（失败时回退本地缓存） */
export const hydrateEquipment =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const current = getState().equipment.boundDevices;
    const remote = await fetchBoundDevicesFromServer(current);
    if (remote != null) {
      dispatch({ type: SET_BOUND_DEVICES, payload: remote });
      schedulePersistBoundDevices();
      dispatch({ type: SET_EQUIPMENT_HYDRATED, payload: true });
      return;
    }

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

/** 手动断开：同时关闭该用户的自动重连 */
export const disconnectEquipment = (deviceId: string) => async () => {
  return disconnectPolarEquipment(deviceId, { manual: true });
};

/** 删除绑定：调服务端逻辑删除，若已连接先断开，再移出本地列表 */
export const removeEquipment =
  (deviceId: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const id = String(deviceId);
    const target = getState().equipment.boundDevices.find(
      item => item.deviceId === id,
    );
    if (!target) return false;

    const removed = await removeBoundDeviceOnServer(target.recordId);
    if (!removed) return false;

    if (target.connected) {
      await disconnectPolarEquipment(id);
    }

    const userId = resolveUserId(getState);
    if (userId) {
      await clearAutoReconnectForDevice(userId, id);
    }

    dispatch({ type: REMOVE_BOUND_DEVICE, payload: id });
    schedulePersistBoundDevices();
    return true;
  };

/**
 * 冷启动 / 登录后：若当前用户开启了自动重连，静默连接对应设备
 */
export const autoReconnectEquipment =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const userId = resolveUserId(getState);
    if (!userId) return false;

    const pref = await loadAutoReconnectPref();
    if (!pref?.enabled || pref.userId !== userId || !pref.deviceId) {
      return false;
    }

    await dispatch(hydrateEquipment());
    await dispatch(prepareEquipmentSdk());

    const state = getState().equipment;
    if (state.isConnecting) return false;
    const target = state.boundDevices.find(
      item => item.deviceId === pref.deviceId,
    );
    if (!target || target.connected) return false;

    return connectPolarEquipment(pref.deviceId, { silent: true });
  };
