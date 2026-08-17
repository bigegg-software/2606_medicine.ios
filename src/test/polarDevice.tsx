import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Polyline } from 'react-native-svg';
import PageLayout from '@/src/components/PageLayout';
import PolarBle, {
  type PolarDevice,
  type PolarEcgData,
  type PolarHrData,
} from './utils/polarBle';
import { calculateHRVIndices } from './utils/hrvCalculator';

/**
 * Polar 设备连接测试页
 * 连接模式对齐 meditation/src/settings/polarDevice.tsx：
 * 扫描 → 连接 → 手动「开始心率监测」/ ECG
 */
export default function PolarDeviceTestPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [devices, setDevices] = useState<PolarDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<PolarDevice | null>(null);
  const [hrData, setHrData] = useState<PolarHrData | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [hrvData, setHrvData] = useState<{
    rmssd: number | null;
    sdnn: number | null;
    meanRR: number | null;
  } | null>(null);
  const [rrHistory, setRrHistory] = useState<number[]>([]);
  const [ecgData, setEcgData] = useState<PolarEcgData | null>(null);
  const [ecgHistory, setEcgHistory] = useState<number[]>([]);
  const [isEcgStreaming, setIsEcgStreaming] = useState(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const ECG_GRAPH_WIDTH = SCREEN_WIDTH - 64;
  const ECG_GRAPH_HEIGHT = 200;
  const MAX_ECG_POINTS = 500;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-20), logMessage]);
  };

  useEffect(() => {
    const initPolar = async () => {
      addLog('正在初始化 Polar SDK...');
      const success = await PolarBle.initPolarSdk();
      if (success) {
        addLog('✅ Polar SDK 初始化成功');
      } else {
        addLog('❌ Polar SDK 初始化失败');
      }
    };

    void initPolar();

    return () => {
      try {
        PolarBle.removeAllListeners();
      } catch (error) {
        console.warn('Failed to remove PolarBle listeners:', error);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const scanListener = PolarBle.addScanResultListener(device => {
        const connectableText = device.connectable === false ? ' [不可连接]' : '';
        addLog(`📱 发现设备: ${device.name} (${device.deviceId})${connectableText}`);
        setDevices(prevDevices => {
          if (!prevDevices.some(d => d.deviceId === device.deviceId)) {
            return [...prevDevices, device];
          }
          return prevDevices.map(d => (d.deviceId === device.deviceId ? { ...d, ...device } : d));
        });
      });

      const connectingListener = PolarBle.addDeviceConnectingListener(device => {
        addLog(`⏳ 正在建立连接: ${device.name}`);
        setIsConnecting(true);
      });

      const connectListener = PolarBle.addDeviceConnectedListener(device => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        addLog(`✅ 设备已连接: ${device.name}`);
        setIsConnecting(false);
        setIsScanning(false);
        setIsConnected(true);
        setConnectedDevice(device);

        if (device.name && device.name.includes('Loop')) {
          Alert.alert(
            '设备提醒',
            '您连接的是 Polar Loop 系列设备。\n\n'
              + '请注意：Polar Loop 是活动追踪器，不支持实时心率流功能。\n\n'
              + '如需获取实时心率数据，请使用：\n'
              + '• Polar H10 心率带\n'
              + '• Polar H9 心率带\n'
              + '• Polar OH1 光学心率传感器\n'
              + '• Polar Verity Sense 光学心率传感器',
            [{ text: '知道了' }],
          );
        } else {
          Alert.alert('连接成功', `已连接到设备: ${device.name}`);
        }
      });

      const disconnectListener = PolarBle.addDeviceDisconnectedListener((device: PolarDevice & {
        pairingError?: boolean;
      }) => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        const isPairingError = device.pairingError;
        addLog(`❌ 设备已断开: ${device.name}${isPairingError ? ' (配对失败)' : ''}`);
        addLog(`   pairingError=${String(isPairingError)}, deviceId=${device.deviceId}`);
        setIsConnecting(false);
        setIsConnected(false);
        setConnectedDevice(null);
        setHrData(null);
        setHrvData(null);
        setRrHistory([]);
        setIsEcgStreaming(false);

        if (isPairingError) {
          addLog('⚠️ 这是配对失败，显示详细错误信息...');
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
            [{ text: '知道了' }],
          );
        } else {
          Alert.alert('连接断开', `设备已断开连接: ${device.name}`);
        }
      });

      const hrListener = PolarBle.addHrDataListener(data => {
        setHrData(data);

        if (data.rrs && data.rrs.length > 0) {
          setRrHistory(prev => {
            const newRrHistory = [...prev, ...data.rrs].slice(-100);
            if (newRrHistory.length >= 10) {
              const hrv = calculateHRVIndices(newRrHistory);
              setHrvData(hrv);
              addLog(`💓 HRV更新 - RMSSD: ${hrv.rmssd?.toFixed(1)}ms, SDNN: ${hrv.sdnn?.toFixed(1)}ms`);
            }
            return newRrHistory;
          });
        }
      });

      const batteryListener = PolarBle.addBatteryLevelListener(data => {
        setBatteryLevel(data.batteryLevel);
      });

      const ecgListener = PolarBle.addEcgDataListener(data => {
        setEcgData(data);
        if (data.samples && data.samples.length > 0) {
          setEcgHistory(prev => {
            const newVoltages = data.samples.map(s => s.voltage);
            return [...prev, ...newVoltages].slice(-MAX_ECG_POINTS);
          });
          addLog(
            `💡 ECG数据 - 样本数: ${data.samples.length}, 电压范围: ${Math.min(...data.samples.map(s => s.voltage))}-${Math.max(...data.samples.map(s => s.voltage))} μV`,
          );
        }
      });

      return () => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        scanListener?.remove?.();
        connectingListener?.remove?.();
        connectListener?.remove?.();
        disconnectListener?.remove?.();
        hrListener?.remove?.();
        batteryListener?.remove?.();
        ecgListener?.remove?.();
      };
    }, []),
  );

  const startScan = async () => {
    if (isScanning) return;

    addLog('🔍 开始扫描设备...');
    setIsScanning(true);
    setDevices([]);

    try {
      const success = await PolarBle.startScan();
      if (success) {
        addLog('扫描已启动');
      } else {
        addLog('❌ 扫描启动失败');
        Alert.alert('错误', '开始扫描失败');
        setIsScanning(false);
        return;
      }
    } catch (error) {
      addLog(`❌ 扫描错误: ${String(error)}`);
      Alert.alert('错误', '开始扫描失败');
      setIsScanning(false);
      return;
    }

    setTimeout(() => {
      setIsScanning(false);
      addLog('扫描已停止');
      void PolarBle.stopScan();
    }, 10000);
  };

  const connectToDevice = async (deviceId: string) => {
    if (isConnecting) {
      addLog('⚠️ 正在连接中，请稍候...');
      return;
    }

    const target = devices.find(d => d.deviceId === deviceId);
    if (target?.connectable === false) {
      Alert.alert(
        '设备当前不可连接',
        '广播显示 connectable=false。\n\n请先：\n1. 湿润电极并佩戴 H10\n2. 设置 → 蓝牙 → 忽略该设备\n3. 关闭其他正在连 H10 的 App\n4. 重新扫描后再连接',
      );
      return;
    }

    addLog(`🔗 停止扫描并连接: ${deviceId}`);
    setIsConnecting(true);
    setIsScanning(false);

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
    }
    connectTimeoutRef.current = setTimeout(() => {
      addLog('❌ 连接超时（20秒无响应）');
      setIsConnecting(false);
      Alert.alert(
        '连接超时',
        '未收到设备连接成功回调。\n\n请确认：\n1. 已佩戴并湿润电极\n2. 系统蓝牙里忽略该 H10 后重试\n3. 靠近手机，关闭其他蓝牙 App',
      );
      void PolarBle.disconnectFromDevice(deviceId).catch(() => undefined);
    }, 20000);

    try {
      await PolarBle.stopScan();
      const success = await PolarBle.connectToDevice(deviceId);
      if (success) {
        addLog('连接请求已发送，等待设备响应...');
      } else {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        addLog('❌ 连接失败');
        setIsConnecting(false);
        Alert.alert('错误', '连接设备失败');
      }
    } catch (error) {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      addLog(`❌ 连接错误: ${String(error)}`);
      setIsConnecting(false);
      Alert.alert('错误', '连接设备失败');
    }
  };

  const disconnectFromDevice = async () => {
    if (!connectedDevice) return;

    try {
      const success = await PolarBle.disconnectFromDevice(connectedDevice.deviceId);
      if (!success) {
        Alert.alert('错误', '断开设备连接失败');
      }
    } catch (error) {
      console.warn('Failed to disconnect from device:', error);
      Alert.alert('错误', '断开设备连接失败');
    }
  };

  const startHrMonitoring = async () => {
    if (!connectedDevice) {
      Alert.alert('错误', '请先连接设备');
      return;
    }

    try {
      const success = await PolarBle.startHrStreaming(connectedDevice.deviceId);
      if (!success) {
        Alert.alert('错误', '开始心率监测失败');
      } else {
        addLog('✅ 心率流已启动');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.warn('Failed to start HR streaming:', error);
      Alert.alert('错误', `开始心率监测失败: ${message}`);
    }
  };

  const getBatteryLevel = async () => {
    if (!connectedDevice) {
      Alert.alert('错误', '请先连接设备');
      return;
    }

    try {
      const battery = await PolarBle.getBatteryLevel(connectedDevice.deviceId);
      if (typeof battery.batteryLevel === 'number') {
        setBatteryLevel(battery.batteryLevel);
        Alert.alert('电池电量', `电池电量: ${battery.batteryLevel}%`);
      } else {
        Alert.alert('提示', '电量将通过事件回调更新');
      }
    } catch (error) {
      console.warn('Failed to get battery level:', error);
      Alert.alert('错误', '获取电池电量失败');
    }
  };

  const startEcgMonitoring = async () => {
    if (!connectedDevice) {
      Alert.alert('错误', '请先连接设备');
      return;
    }

    try {
      addLog('💡 正在启动ECG流...');
      const success = await PolarBle.startEcgStreaming(connectedDevice.deviceId);
      if (success) {
        setIsEcgStreaming(true);
        addLog('✅ ECG流启动成功');
        setEcgHistory([]);
      } else {
        Alert.alert('错误', '开始ECG监测失败');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.warn('Failed to start ECG streaming:', error);
      addLog(`❌ ECG启动失败: ${message}`);
      Alert.alert('错误', `ECG启动失败: ${message}`);
    }
  };

  const stopEcgMonitoring = async () => {
    if (!connectedDevice) return;

    try {
      await PolarBle.stopEcgStreaming(connectedDevice.deviceId);
      setIsEcgStreaming(false);
      addLog('🛑 ECG流已停止');
    } catch (error) {
      console.warn('Failed to stop ECG streaming:', error);
    }
  };

  const getEcgWaveformPath = () => {
    if (ecgHistory.length === 0) return '';

    const minVoltage = Math.min(...ecgHistory);
    const maxVoltage = Math.max(...ecgHistory);
    const voltageRange = maxVoltage - minVoltage || 1;

    return ecgHistory
      .map((voltage, index) => {
        const x = (index / ecgHistory.length) * ECG_GRAPH_WIDTH;
        const normalizedVoltage = (voltage - minVoltage) / voltageRange;
        const y = ECG_GRAPH_HEIGHT - (normalizedVoltage * ECG_GRAPH_HEIGHT * 0.8 + ECG_GRAPH_HEIGHT * 0.1);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const renderDevice = ({ item }: { item: PolarDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.deviceId}</Text>
        {item.rssi != null ? <Text style={styles.rssi}>RSSI: {item.rssi}</Text> : null}
        {item.connectable === false ? (
          <Text style={[styles.rssi, { color: '#FF3B30' }]}>不可连接（请佩戴后重扫）</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.connectButton, (isConnecting || isConnected || item.connectable === false) && styles.disabledButton]}
        onPress={() => void connectToDevice(item.deviceId)}
        disabled={isConnecting || isConnected || item.connectable === false}>
        <Text style={styles.buttonText}>{isConnecting ? '连接中...' : '连接'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Polar 设备连接</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, isScanning && styles.disabledButton]}
            onPress={() => void startScan()}
            disabled={isScanning}>
            <Text style={styles.buttonText}>{isScanning ? '扫描中...' : '扫描设备'}</Text>
          </TouchableOpacity>
        </View>

        {connectedDevice ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>已连接设备</Text>
            <View style={styles.connectedDevice}>
              <Text style={styles.deviceName}>{connectedDevice.name}</Text>
              <Text style={styles.deviceId}>{connectedDevice.deviceId}</Text>
              {batteryLevel != null ? (
                <Text style={styles.batteryLevel}>电池电量: {batteryLevel}%</Text>
              ) : null}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.flexButton]} onPress={() => void startHrMonitoring()}>
                <Text style={styles.buttonText}>开始心率监测</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, styles.flexButton, isEcgStreaming && styles.disabledButton]}
                onPress={() => void startEcgMonitoring()}
                disabled={isEcgStreaming}>
                <Text style={styles.buttonText}>{isEcgStreaming ? 'ECG监测中...' : '开始ECG监测'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, styles.flexButton]}
                onPress={() => void getBatteryLevel()}>
                <Text style={styles.buttonText}>获取电池电量</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.dangerButton, styles.flexButton]}
                onPress={() => void disconnectFromDevice()}>
                <Text style={styles.buttonText}>断开连接</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {hrData ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>心率数据</Text>
            <View style={styles.hrData}>
              <Text style={styles.hrValue}>心率: {hrData.heartRate} BPM</Text>
              <Text style={styles.rrCount}>RR间隔数: {hrData.rrs.length}</Text>
              <Text style={styles.rrCount}>累计RR数据: {rrHistory.length}</Text>
            </View>
          </View>
        ) : null}

        {isEcgStreaming ? (
          <View style={styles.section}>
            <View style={styles.ecgHeader}>
              <Text style={styles.sectionTitle}>💡 实时ECG波形</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.ecgContainer}>
              {ecgHistory.length > 0 ? (
                <Svg width={ECG_GRAPH_WIDTH} height={ECG_GRAPH_HEIGHT}>
                  <Polyline
                    points={getEcgWaveformPath()}
                    fill="none"
                    stroke="#FF3B30"
                    strokeWidth="2"
                  />
                </Svg>
              ) : (
                <View style={styles.ecgPlaceholder}>
                  <Text style={styles.ecgPlaceholderText}>等待ECG数据...</Text>
                </View>
              )}
            </View>

            {ecgData ? (
              <View style={styles.ecgStats}>
                <Text style={styles.ecgStatsText}>样本数: {ecgData.samples.length}</Text>
                <Text style={styles.ecgStatsText}>
                  缓冲区: {ecgHistory.length}/{MAX_ECG_POINTS}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.dangerButton, { marginTop: 12 }]}
              onPress={() => void stopEcgMonitoring()}>
              <Text style={styles.buttonText}>停止ECG监测</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {hrvData ? (
          <View style={styles.section}>
            <View style={styles.hrvHeader}>
              <Text style={styles.sectionTitle}>💓 实时HRV指标</Text>
              {hrData ? (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.hrvContainer}>
              <View style={styles.hrvItem}>
                <View style={styles.hrvLabelContainer}>
                  <Text style={styles.hrvLabel}>RMSSD</Text>
                  <Text style={styles.hrvSubLabel}>副交感活性</Text>
                </View>
                <Text style={styles.hrvValue}>
                  {hrvData.rmssd != null ? hrvData.rmssd.toFixed(1) : 'N/A'}
                </Text>
                <Text style={styles.hrvUnit}>ms</Text>
              </View>
              <View style={styles.hrvDivider} />
              <View style={styles.hrvItem}>
                <View style={styles.hrvLabelContainer}>
                  <Text style={styles.hrvLabel}>SDNN</Text>
                  <Text style={styles.hrvSubLabel}>整体变异性</Text>
                </View>
                <Text style={styles.hrvValue}>
                  {hrvData.sdnn != null ? hrvData.sdnn.toFixed(1) : 'N/A'}
                </Text>
                <Text style={styles.hrvUnit}>ms</Text>
              </View>
              <View style={styles.hrvDivider} />
              <View style={styles.hrvItem}>
                <View style={styles.hrvLabelContainer}>
                  <Text style={styles.hrvLabel}>平均RR</Text>
                  <Text style={styles.hrvSubLabel}>心跳间隔</Text>
                </View>
                <Text style={styles.hrvValue}>
                  {hrvData.meanRR != null ? hrvData.meanRR.toFixed(1) : 'N/A'}
                </Text>
                <Text style={styles.hrvUnit}>ms</Text>
              </View>
            </View>
          </View>
        ) : null}

        {devices.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>扫描到的设备</Text>
            <FlatList
              data={devices}
              keyExtractor={item => item.deviceId}
              renderItem={renderDevice}
              style={styles.deviceList}
              scrollEnabled={false}
            />
          </View>
        ) : null}

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>1. 湿润电极并佩戴 H10（不佩戴常显示不可连接 / 连不上）</Text>
          <Text style={styles.instructionText}>2. 点击「扫描设备」，再点「连接」（会先停扫再连）</Text>
          <Text style={styles.instructionText}>3. 若弹出系统蓝牙配对，请点「配对」</Text>
          <Text style={styles.instructionText}>4. 连接成功后点「开始心率监测」</Text>
          <Text style={styles.instructionText}>5. 一直连不上：设置 → 蓝牙 → 忽略该 H10 后重试</Text>
        </View>

        {logs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>调试日志</Text>
            <View style={styles.logContainer}>
              {logs.slice(-10).map((log, index) => (
                <Text key={`${log}-${index}`} style={styles.logText}>
                  {log}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexButton: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  deviceList: {
    maxHeight: 200,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rssi: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectedDevice: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 12,
  },
  batteryLevel: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  hrData: {
    padding: 12,
    backgroundColor: '#fff0f5',
    borderRadius: 8,
  },
  hrValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  rrCount: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  instructions: {
    marginTop: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  logContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
    marginBottom: 4,
  },
  hrvContainer: {
    padding: 16,
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  hrvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hrvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  hrvLabelContainer: {
    flex: 1,
  },
  hrvLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  hrvSubLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  hrvValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
    marginRight: 4,
  },
  hrvUnit: {
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  hrvDivider: {
    height: 1,
    backgroundColor: '#34C75933',
    marginVertical: 4,
  },
  ecgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ecgContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  ecgPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ecgPlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
  ecgStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  ecgStatsText: {
    fontSize: 12,
    color: '#666',
  },
});
