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
  UPSERT_SCANNED_DEVICE,
} from '@/store/type/equipment';
import { saveBoundDevices } from './equipmentStorage';

const CONNECT_TIMEOUT_MS = 20_000;

let listenersReady = false;
let connectTimeout: ReturnType<typeof setTimeout> | null = null;
let scanAutoStopTimeout: ReturnType<typeof setTimeout> | null = null;

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
    dispatch({
      type: SET_DEVICE_CONNECTED,
      payload: {
        deviceId,
        name: device.name?.trim() || deviceId,
      },
    });
    schedulePersistBoundDevices();
    // 原生可能连续回调多次，已连接则不再弹窗
    if (!alreadyConnected) {
      Toast.success('连接成功', 1.5);
    }
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

export async function connectPolarEquipment(deviceId: string) {
  const id = String(deviceId);
  const state = getEquipmentState();
  if (state.isConnecting) return false;

  const scanned = state.scannedDevices.find(item => item.deviceId === id);
  if (scanned?.connectable === false) {
    Alert.alert(
      '设备当前不可连接',
      '广播显示不可连接。\n\n请先：\n1. 湿润电极并佩戴 H10\n2. 设置 → 蓝牙 → 忽略该设备\n3. 关闭其他正在连 H10 的 App\n4. 重新扫描后再连接',
    );
    return false;
  }

  dispatch({
    type: SET_EQUIPMENT_CONNECTING,
    payload: { isConnecting: true, deviceId: id },
  });
  await stopPolarEquipmentScan();

  clearConnectTimeout();
  connectTimeout = setTimeout(() => {
    dispatch({
      type: SET_EQUIPMENT_CONNECTING,
      payload: { isConnecting: false, deviceId: null },
    });
    Alert.alert(
      '连接超时',
      '未收到设备连接成功回调。\n\n请确认：\n1. 已佩戴并湿润电极\n2. 系统蓝牙里忽略该 H10 后重试\n3. 靠近手机，关闭其他蓝牙 App',
    );
    void PolarBle.disconnectFromDevice(id).catch(() => undefined);
  }, CONNECT_TIMEOUT_MS);

  try {
    const ok = await PolarBle.connectToDevice(id);
    if (!ok) {
      clearConnectTimeout();
      dispatch({
        type: SET_EQUIPMENT_CONNECTING,
        payload: { isConnecting: false, deviceId: null },
      });
      Alert.alert('错误', '连接设备失败');
      return false;
    }
    return true;
  } catch {
    clearConnectTimeout();
    dispatch({
      type: SET_EQUIPMENT_CONNECTING,
      payload: { isConnecting: false, deviceId: null },
    });
    Alert.alert('错误', '连接设备失败');
    return false;
  }
}

export async function disconnectPolarEquipment(deviceId: string) {
  const id = String(deviceId);
  clearConnectTimeout();
  try {
    const ok = await PolarBle.disconnectFromDevice(id);
    if (!ok) {
      Alert.alert('错误', '断开设备连接失败');
      return false;
    }
    // 事件回调会更新 store；兜底本地状态
    dispatch({ type: SET_DEVICE_DISCONNECTED, payload: id });
    schedulePersistBoundDevices();
    return true;
  } catch {
    Alert.alert('错误', '断开设备连接失败');
    return false;
  }
}
