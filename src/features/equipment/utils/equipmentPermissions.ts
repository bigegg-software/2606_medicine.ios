import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import PolarBle from '@/src/test/utils/polarBle';

export type EquipmentBluetoothReadyResult = {
  ok: boolean;
  reason?: 'denied' | 'error';
};

type AndroidPermission =
  (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS];

type IosBluetoothAuthStatus =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'undetermined'
  | 'unavailable'
  | 'unknown';

function androidApiLevel(): number {
  return typeof Platform.Version === 'number'
    ? Platform.Version
    : parseInt(String(Platform.Version), 10) || 0;
}

function showBluetoothPermissionAlert() {
  Alert.alert(
    '需要蓝牙权限',
    '连接 Polar 等设备需要开启蓝牙相关权限，请在系统设置中允许后重试。',
    [
      { text: '取消', style: 'cancel' },
      { text: '去设置', onPress: () => void Linking.openSettings() },
    ],
  );
}

async function ensureAndroidBluetoothPermissions(
  showAlert: boolean,
): Promise<EquipmentBluetoothReadyResult> {
  const api = androidApiLevel();
  const permissions: AndroidPermission[] = [];

  // Android 12+ 需运行时申请扫描/连接
  if (api >= 31) {
    permissions.push(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  }
  // BLE 扫描在多数机型仍依赖精确位置
  permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

  const unique = [...new Set(permissions)];
  const missing: AndroidPermission[] = [];
  for (const permission of unique) {
    // eslint-disable-next-line no-await-in-loop
    const granted = await PermissionsAndroid.check(permission);
    if (!granted) missing.push(permission);
  }

  if (missing.length === 0) {
    return { ok: true };
  }

  const results = await PermissionsAndroid.requestMultiple(missing);
  const allGranted = missing.every(
    permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );

  if (!allGranted) {
    if (showAlert) showBluetoothPermissionAlert();
    return { ok: false, reason: 'denied' };
  }
  return { ok: true };
}

async function readIosBluetoothAuthorization(): Promise<IosBluetoothAuthStatus> {
  try {
    const status = await PolarBle.getBluetoothAuthorizationStatus();
    if (
      status === 'granted'
      || status === 'denied'
      || status === 'restricted'
      || status === 'undetermined'
      || status === 'unavailable'
    ) {
      return status;
    }
    return 'unknown';
  } catch {
    return 'unavailable';
  }
}

async function ensureIosBluetoothPermission(
  showAlert: boolean,
): Promise<EquipmentBluetoothReadyResult> {
  let status = await readIosBluetoothAuthorization();

  // 未决定：初始化 SDK 触发系统授权弹窗，再读一次状态
  if (status === 'undetermined' || status === 'unavailable') {
    try {
      await PolarBle.initPolarSdk();
    } catch {
      // ignore
    }
    status = await readIosBluetoothAuthorization();
  }

  if (status === 'denied' || status === 'restricted') {
    if (showAlert) showBluetoothPermissionAlert();
    return { ok: false, reason: 'denied' };
  }

  // granted / undetermined（用户尚未点选）/ unavailable（旧原生包）→ 放行
  return { ok: true };
}

/**
 * 进入设备相关页面 / 扫描连接前：检查并申请蓝牙权限。
 * 未授权时弹窗引导前往系统设置。
 */
export async function ensureEquipmentBluetoothReady(
  options?: { showAlert?: boolean },
): Promise<EquipmentBluetoothReadyResult> {
  const showAlert = options?.showAlert !== false;

  try {
    if (Platform.OS === 'android') {
      return await ensureAndroidBluetoothPermissions(showAlert);
    }
    if (Platform.OS === 'ios') {
      return await ensureIosBluetoothPermission(showAlert);
    }
    return { ok: true };
  } catch {
    if (showAlert) showBluetoothPermissionAlert();
    return { ok: false, reason: 'error' };
  }
}
