import { NativeModules, NativeEventEmitter } from 'react-native';

// 定义原生模块接口
interface PolarBleModuleInterface {
  initPolarSdk(): Promise<boolean>;
  /** iOS：granted / denied / restricted / undetermined / unknown */
  getBluetoothAuthorizationStatus?(): Promise<string>;
  startScan(): Promise<boolean>;
  stopScan(): Promise<boolean>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnectFromDevice(deviceId: string): Promise<boolean>;
  startHrStreaming(deviceId: string): Promise<boolean>;
  stopHrStreaming(deviceId: string): Promise<boolean>;
  startEcgStreaming(deviceId: string): Promise<boolean>;
  stopEcgStreaming(deviceId: string): Promise<boolean>;
  getDeviceInfo(deviceId: string): Promise<any>;
  getBatteryLevel(deviceId: string): Promise<{ batteryLevel: number }>;
}

const { PolarBle } = NativeModules as { PolarBle: PolarBleModuleInterface };

// 检查模块是否存在
if (!PolarBle) {
  console.warn('PolarBle native module is not available. Polar SDK may not be properly linked or installed.');
}

// 定义事件类型
export interface PolarDevice {
  deviceId: string;
  name: string;
  rssi?: number;
  /** 广播是否可连接；false 时常导致连接一直无回调 */
  connectable?: boolean;
}

export interface PolarHrData {
  deviceId: string;
  heartRate: number;
  rrs: number[];
  timestamp: number;
}

export interface PolarBatteryData {
  deviceId: string;
  batteryLevel: number;
}

export interface PolarEcgSample {
  timeStamp: number;
  voltage: number;
}

export interface PolarEcgData {
  deviceId: string;
  samples: PolarEcgSample[];
  timestamp: number;
}

// 事件类型
export type PolarEventType =
  | 'PolarDeviceConnecting'
  | 'PolarDeviceConnected'
  | 'PolarDeviceDisconnected'
  | 'PolarHrData'
  | 'PolarDeviceInfo'
  | 'PolarBatteryLevel'
  | 'PolarScanResult'
  | 'PolarEcgData'
  | 'PolarFeatureReady'
  | 'PolarHrStreamError';

export type PolarFeatureReadyData = {
  deviceId: string;
  feature: string;
};

// 事件监听器类型
export type PolarEventListener<T> = (data: T) => void;

// 事件发射器
const polarEventEmitter = NativeModules.PolarBle ? new NativeEventEmitter(NativeModules.PolarBle) : null;

// 检查事件发射器是否存在
if (!polarEventEmitter) {
  console.warn('PolarBle event emitter is not available. Events will not be emitted.');
}

class PolarBleManager {
  private listeners: Map<string, any> = new Map();

  // 初始化 Polar SDK
  async initPolarSdk(): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.initPolarSdk();
    } catch (error) {
      console.error('Failed to initialize Polar SDK:', error);
      return false;
    }
  }

  /** iOS 蓝牙授权状态；Android / 未实现时返回 unavailable */
  async getBluetoothAuthorizationStatus(): Promise<string> {
    if (!PolarBle?.getBluetoothAuthorizationStatus) {
      return 'unavailable';
    }
    try {
      return await PolarBle.getBluetoothAuthorizationStatus();
    } catch (error) {
      console.error('Failed to read bluetooth authorization:', error);
      return 'unavailable';
    }
  }

  // 开始扫描设备
  async startScan(): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.startScan();
    } catch (error) {
      console.error('Failed to start scan:', error);
      return false;
    }
  }

  // 停止扫描（连接前应先停止）
  async stopScan(): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.stopScan();
    } catch (error) {
      console.error('Failed to stop scan:', error);
      return false;
    }
  }

  // 连接设备：先停扫，再 connect（SDK connect 内部还会 search，并行扫描会卡死）
  async connectToDevice(deviceId: string): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      await this.stopScan();
      return await PolarBle.connectToDevice(deviceId);
    } catch (error) {
      console.error(`Failed to connect to device ${deviceId}:`, error);
      return false;
    }
  }

  // 断开设备连接
  async disconnectFromDevice(deviceId: string): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.disconnectFromDevice(deviceId);
    } catch (error) {
      console.error(`Failed to disconnect from device ${deviceId}:`, error);
      return false;
    }
  }

  // 开始心率流式传输
  async startHrStreaming(deviceId: string): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      console.log(deviceId)
      return await PolarBle.startHrStreaming(deviceId);
    } catch (error) {
      console.error(`Failed to start HR streaming for device ${deviceId}:`, error);
      return false;
    }
  }

  // 停止心率流式传输
  async stopHrStreaming(deviceId: string): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.stopHrStreaming(deviceId);
    } catch (error) {
      console.error(`Failed to stop HR streaming for device ${deviceId}:`, error);
      return false;
    }
  }

  // 开始ECG流式传输
  async startEcgStreaming(deviceId: string): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.startEcgStreaming(deviceId);
    } catch (error) {
      console.error(`Failed to start ECG streaming for device ${deviceId}:`, error);
      return false;
    }
  }

  // 停止ECG流式传输
  async stopEcgStreaming(deviceId: string): Promise<boolean> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      return false;
    }
    try {
      return await PolarBle.stopEcgStreaming(deviceId);
    } catch (error) {
      console.error(`Failed to stop ECG streaming for device ${deviceId}:`, error);
      return false;
    }
  }

  // 获取设备信息
  async getDeviceInfo(deviceId: string): Promise<any> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      throw new Error('PolarBle native module is not available.');
    }
    try {
      return await PolarBle.getDeviceInfo(deviceId);
    } catch (error) {
      console.error(`Failed to get device info for device ${deviceId}:`, error);
      throw error;
    }
  }

  // 获取电池电量
  async getBatteryLevel(deviceId: string): Promise<{ batteryLevel: number }> {
    if (!PolarBle) {
      console.warn('PolarBle native module is not available.');
      throw new Error('PolarBle native module is not available.');
    }
    try {
      return await PolarBle.getBatteryLevel(deviceId);
    } catch (error) {
      console.error(`Failed to get battery level for device ${deviceId}:`, error);
      throw error;
    }
  }

  // 添加设备连接监听器
  addDeviceConnectingListener(listener: PolarEventListener<PolarDevice>) {
    if (!polarEventEmitter) {
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarDeviceConnecting', listener);
    this.listeners.set('deviceConnecting', subscription);
    return subscription;
  }

  // 添加设备连接监听器
  addDeviceConnectedListener(listener: PolarEventListener<PolarDevice>) {
    if (!polarEventEmitter) {
      console.warn('PolarBle event emitter is not available. Cannot add device connected listener.');
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarDeviceConnected', listener);
    this.listeners.set('deviceConnected', subscription);
    return subscription;
  }

  // 添加设备断开连接监听器
  addDeviceDisconnectedListener(listener: PolarEventListener<PolarDevice>) {
    if (!polarEventEmitter) {
      console.warn('PolarBle event emitter is not available. Cannot add device disconnected listener.');
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarDeviceDisconnected', listener);
    this.listeners.set('deviceDisconnected', subscription);
    return subscription;
  }

  // 添加心率数据监听器
  addHrDataListener(listener: PolarEventListener<PolarHrData>) {
    if (!polarEventEmitter) {
      console.warn('PolarBle event emitter is not available. Cannot add HR data listener.');
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarHrData', listener);
    this.listeners.set('hrData', subscription);
    return subscription;
  }

  // 添加电池电量监听器
  addBatteryLevelListener(listener: PolarEventListener<PolarBatteryData>) {
    if (!polarEventEmitter) {
      console.warn('PolarBle event emitter is not available. Cannot add battery level listener.');
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarBatteryLevel', listener);
    this.listeners.set('batteryLevel', subscription);
    return subscription;
  }

  // 添加扫描结果监听器
  addScanResultListener(listener: PolarEventListener<PolarDevice>) {
    if (!polarEventEmitter) {
      console.warn('PolarBle event emitter is not available. Cannot add scan result listener.');
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarScanResult', listener);
    this.listeners.set('scanResult', subscription);
    return subscription;
  }

  // 添加ECG数据监听器
  addEcgDataListener(listener: PolarEventListener<PolarEcgData>) {
    if (!polarEventEmitter) {
      console.warn('PolarBle event emitter is not available. Cannot add ECG data listener.');
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarEcgData', listener);
    this.listeners.set('ecgData', subscription);
    return subscription;
  }

  addFeatureReadyListener(listener: PolarEventListener<PolarFeatureReadyData>) {
    if (!polarEventEmitter) {
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarFeatureReady', listener);
    this.listeners.set('featureReady', subscription);
    return subscription;
  }

  addHrStreamErrorListener(listener: PolarEventListener<{ deviceId: string; message: string }>) {
    if (!polarEventEmitter) {
      return { remove: () => {} };
    }
    const subscription = polarEventEmitter.addListener('PolarHrStreamError', listener);
    this.listeners.set('hrStreamError', subscription);
    return subscription;
  }

  // 移除监听器
  removeListener(type: string) {
    const subscription = this.listeners.get(type);
    if (subscription) {
      subscription.remove();
      this.listeners.delete(type);
    }
  }

  // 移除所有监听器
  removeAllListeners() {
    this.listeners.forEach((subscription) => subscription.remove());
    this.listeners.clear();
  }
}

export default new PolarBleManager();