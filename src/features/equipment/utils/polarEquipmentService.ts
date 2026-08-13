import { Alert } from 'react-native';
import { Toast } from '@ant-design/react-native';
import PolarBle, {
  type PolarDevice,
} from '@/src/test/utils/polarBle';
import store from '@/store/store';
import {
  CLEAR_SCANNED_DEVICES,
  SET_DEVICE_BATTERY,
  SET_DEVICE_CONNECTED,
  SET_DEVICE_DISCONNECTED,
  SET_EQUIPMENT_CONNECTING,
  SET_EQUIPMENT_SCANNING,
  SET_EQUIPMENT_SDK_READY,
  UPDATE_BOUND_DEVICE,
  UPSERT_SCANNED_DEVICE,
} from '@/store/type/equipment';
import { saveBoundDevices, enableAutoReconnect } from './equipmentStorage';
import { POLAR_DEVICE_TYPE, syncEquipmentAfterConnect } from './equipmentApiSync';
import { ensureEquipmentBluetoothReady } from './equipmentPermissions';

const CONNECT_TIMEOUT_MS = 20_000;

let listenersReady = false;
let connectTimeout: ReturnType<typeof setTimeout> | null = null;
let scanAutoStopTimeout: ReturnType<typeof setTimeout> | null = null;
/** 自动重连时抑制弹窗 / Toast */
let silentConnect = false;

function resolveCurrentUserId(): string | null {
  const state = store.getState();
  const userId = state.user.info?.userId ?? state.user.userExtr?.userId;
  return userId != null && String(userId).trim() !== ''
    ? String(userId)
    : null;
}

function clearConnectTimeout() {
  if (connectTimeout) {
    clearTimeout(connectTimeout);
    connectTimeout = null;
  }
}

function clearScanAutoStop() {
  if (scanAutoStopTimeout) {
    clearTimeout(scanAutoStopTimeout);
    scanAutoStopTimeout = null;
  }
}

function dispatch(action: { type: string; payload?: unknown }) {
  store.dispatch(action as never);
}

function getEquipmentState() {
  return store.getState().equipment;
}

/** 持久化当前已绑定列表（忽略 connected，下次冷启动均为未连接） */
export function schedulePersistBoundDevices() {
  const devices = getEquipmentState().boundDevices;
  void saveBoundDevices(devices).catch(() => undefined);
}

/**
 * 注册全局 Polar 事件 → Redux（仅挂一次）
 */
export function ensurePolarEquipmentListeners() {
  if (listenersReady) return;
  listenersReady = true;

  PolarBle.addScanResultListener(device => {
    dispatch({
      type: UPSERT_SCANNED_DEVICE,
      payload: {
        deviceId: String(device.deviceId),
        name: device.name?.trim() || String(device.deviceId),
        rssi: device.rssi,
        connectable: device.connectable,
      },
    });
  });

  PolarBle.addDeviceConnectingListener(device => {
    dispatch({
      type: SET_EQUIPMENT_CONNECTING,
      payload: { isConnecting: true, deviceId: String(device.deviceId) },
    });
  });

  PolarBle.addDeviceConnectedListener(device => {
    clearConnectTimeout();
    const deviceId = String(device.deviceId);
    const alreadyConnected = getEquipmentState().boundDevices.some(
      item => item.deviceId === deviceId && item.connected,
    );
    const existing = getEquipmentState().boundDevices.find(
      item => item.deviceId === deviceId,
    );
    dispatch({
      type: SET_DEVICE_CONNECTED,
      payload: {
        deviceId,
        name: device.name?.trim() || existing?.name || deviceId,
      },
    });
    // 补齐 deviceType，便于上报服务端
    if (!existing?.deviceType) {
      dispatch({
        type: UPDATE_BOUND_DEVICE,
        payload: {
          deviceId,
          patch: { deviceType: POLAR_DEVICE_TYPE },
        },
      });
    }
    schedulePersistBoundDevices();
    const userId = resolveCurrentUserId();
    if (userId) {
      void enableAutoReconnect(userId, deviceId);
    }
    void syncEquipmentAfterConnect(deviceId);
    // 原生可能连续回调多次，已连接则不再弹窗；自动重连也不提示
    if (!alreadyConnected && !silentConnect) {
      Toast.success('连接成功', 1.5);
    }
    silentConnect = false;
  });

  PolarBle.addDeviceDisconnectedListener(
    (device: PolarDevice & { pairingError?: boolean }) => {
      clearConnectTimeout();
      const deviceId = String(device.deviceId);
      dispatch({ type: SET_DEVICE_DISCONNECTED, payload: deviceId });
      schedulePersistBoundDevices();

      if (device.pairingError) {
        Alert.alert(
          '连接失败 - 配对错误',
          '设备配对失败\n\n'
            + '可能原因：\n'
            + '1. 未佩戴 / 电极未湿润\n'
            + '2. 设备已与其他手机配对\n'
            + '3. 系统蓝牙配对弹窗未确认\n\n'
            + '解决方法：\n'
            + '• 湿润电极并佩戴 H10\n'
            + '• 设置 → 蓝牙 → 忽略该设备后重试\n'
            + '• 确保设备电量充足',
        );
        return;
      }
    },
  );

  PolarBle.addBatteryLevelListener(data => {
    dispatch({
      type: SET_DEVICE_BATTERY,
      payload: {
        deviceId: String(data.deviceId),
        batteryPercent: Math.max(
          0,
          Math.min(100, Math.round(Number(data.batteryLevel) || 0)),
        ),
      },
    });
    schedulePersistBoundDevices();
  });
}

export async function initPolarEquipmentSdk() {
  ensurePolarEquipmentListeners();
  const ok = await PolarBle.initPolarSdk();
  dispatch({ type: SET_EQUIPMENT_SDK_READY, payload: !!ok });
  return ok;
}

export async function startPolarEquipmentScan(options?: {
  /** 自动停扫毫秒；默认不自动停，由页面超时/重搜控制 */
  autoStopMs?: number;
}) {
  const ready = await ensureEquipmentBluetoothReady();
  if (!ready.ok) {
    dispatch({ type: SET_EQUIPMENT_SCANNING, payload: false });
    return false;
  }

  ensurePolarEquipmentListeners();
  clearScanAutoStop();
  dispatch({ type: CLEAR_SCANNED_DEVICES });
  dispatch({ type: SET_EQUIPMENT_SCANNING, payload: true });

  const ok = await PolarBle.startScan();
  if (!ok) {
    dispatch({ type: SET_EQUIPMENT_SCANNING, payload: false });
    Alert.alert('错误', '开始扫描失败，请确认蓝牙已开启');
    return false;
  }

  if (options?.autoStopMs && options.autoStopMs > 0) {
    scanAutoStopTimeout = setTimeout(() => {
      void stopPolarEquipmentScan();
    }, options.autoStopMs);
  }
  return true;
}

export async function stopPolarEquipmentScan() {
  clearScanAutoStop();
  dispatch({ type: SET_EQUIPMENT_SCANNING, payload: false });
  try {
    await PolarBle.stopScan();
  } catch {
    /* ignore */
  }
}

export async function connectPolarEquipment(
  deviceId: string,
  options?: { silent?: boolean },
) {
  const id = String(deviceId);
  const state = getEquipmentState();
  if (state.isConnecting) return false;
  silentConnect = Boolean(options?.silent);

  const ready = await ensureEquipmentBluetoothReady({
    showAlert: !options?.silent,
  });
  if (!ready.ok) {
    silentConnect = false;
    return false;
  }

  const scanned = state.scannedDevices.find(item => item.deviceId === id);
  if (scanned?.connectable === false) {
    silentConnect = false;
    if (!options?.silent) {
      Alert.alert(
        '设备当前不可连接',
        '广播显示不可连接。\n\n请先：\n1. 湿润电极并佩戴 H10\n2. 设置 → 蓝牙 → 忽略该设备\n3. 关闭其他正在连 H10 的 App\n4. 重新扫描后再连接',
      );
    }
    return false;
  }

  dispatch({
    type: SET_EQUIPMENT_CONNECTING,
    payload: { isConnecting: true, deviceId: id },
  });
  await stopPolarEquipmentScan();

  clearConnectTimeout();
  connectTimeout = setTimeout(() => {
    silentConnect = false;
    dispatch({
      type: SET_EQUIPMENT_CONNECTING,
      payload: { isConnecting: false, deviceId: null },
    });
    if (!options?.silent) {
      Alert.alert(
        '连接超时',
        '未收到设备连接成功回调。\n\n请确认：\n1. 已佩戴并湿润电极\n2. 系统蓝牙里忽略该 H10 后重试\n3. 靠近手机，关闭其他蓝牙 App',
      );
    }
    void PolarBle.disconnectFromDevice(id).catch(() => undefined);
  }, CONNECT_TIMEOUT_MS);

  try {
    const ok = await PolarBle.connectToDevice(id);
    if (!ok) {
      clearConnectTimeout();
      silentConnect = false;
      dispatch({
        type: SET_EQUIPMENT_CONNECTING,
        payload: { isConnecting: false, deviceId: null },
      });
      if (!options?.silent) {
        Alert.alert('错误', '连接设备失败');
      }
      return false;
    }
    return true;
  } catch {
    clearConnectTimeout();
    silentConnect = false;
    dispatch({
      type: SET_EQUIPMENT_CONNECTING,
      payload: { isConnecting: false, deviceId: null },
    });
    if (!options?.silent) {
      Alert.alert('错误', '连接设备失败');
    }
    return false;
  }
}

export async function disconnectPolarEquipment(
  deviceId: string,
  options?: { manual?: boolean },
) {
  const id = String(deviceId);
  clearConnectTimeout();
  silentConnect = false;
  try {
    const ok = await PolarBle.disconnectFromDevice(id);
    if (!ok) {
      if (options?.manual) {
        Alert.alert('错误', '断开设备连接失败');
        return false;
      }
      // 非手动：仍更新本地状态
    }
    dispatch({ type: SET_DEVICE_DISCONNECTED, payload: id });
    schedulePersistBoundDevices();

    if (options?.manual) {
      const { disableAutoReconnect } = await import('./equipmentStorage');
      const userId = resolveCurrentUserId();
      if (userId) {
        await disableAutoReconnect(userId, id);
      }
    }
    return true;
  } catch {
    if (options?.manual) {
      Alert.alert('错误', '断开设备连接失败');
    }
    return false;
  }
}
