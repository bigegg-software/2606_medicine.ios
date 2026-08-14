import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import {
  connectEquipment,
  disconnectEquipment,
  hydrateEquipment,
  prepareEquipmentSdk,
  removeEquipment,
} from '@/store/actions/equipment';
import {
  clampBatteryPercent,
  resolveEquipmentProductName,
} from './utils/equipmentHelpers';
import { ensureEquipmentBluetoothReady } from './utils/equipmentPermissions';
import {
  loadHrConnectConsent,
  saveHrConnectConsent,
} from './utils/equipmentStorage';
import HrDeviceConsentModal from './components/HrDeviceConsentModal';
import styles from '@/css/equipment/detail';

type Route = RouteProp<RootStackParamList, 'EquipmentDetailPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * 已绑定设备详情
 */
export default function EquipmentDetailPage() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const deviceId = String(route.params.id);

  const hydrated = useSelector((state: RootState) => state.equipment.hydrated);
  const device = useSelector((state: RootState) =>
    state.equipment.boundDevices.find(item => item.deviceId === deviceId),
  );
  const isConnecting = useSelector(
    (state: RootState) => state.equipment.isConnecting,
  );
  const connectingDeviceId = useSelector(
    (state: RootState) => state.equipment.connectingDeviceId,
  );
  const [consentVisible, setConsentVisible] = useState(false);
  const pendingConsentRef = useRef(false);

  useEffect(() => {
    void (async () => {
      await ensureEquipmentBluetoothReady();
      await dispatch(hydrateEquipment());
      await dispatch(prepareEquipmentSdk());
    })();
  }, [dispatch]);

  useEffect(() => {
    if (hydrated && !device) {
      navigation.goBack();
    }
  }, [device, hydrated, navigation]);

  const connected = !!device?.connected;
  const connecting = isConnecting && connectingDeviceId === deviceId;

  const productName = useMemo(
    () => resolveEquipmentProductName(device?.name),
    [device?.name],
  );

  const batteryText = useMemo(() => {
    if (!connected) return '--';
    return `${clampBatteryPercent(device?.batteryPercent)}%`;
  }, [connected, device?.batteryPercent]);

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: '设备名称', value: productName },
    { label: '设备ID', value: device?.deviceId?.trim() || '--' },
    { label: '电量', value: batteryText },
    {
      label: '连接状态',
      value: (
        <Flex align="center">
          <View
            style={[
              styles.statusDot,
              connected ? styles.statusDotOn : styles.statusDotOff,
            ]}
          />
          <Text style={styles.rowValue}>{connected ? '已连接' : '未连接'}</Text>
        </Flex>
      ),
    },
  ];

  const onDelete = () => {
    Alert.alert('删除设备', `确定删除「${productName}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const ok = await dispatch(removeEquipment(deviceId));
            if (ok) {
              navigation.goBack();
              return;
            }
            Alert.alert('删除失败', '请稍后重试');
          })();
        },
      },
    ]);
  };

  const doConnect = useCallback(() => {
    if (isConnecting) return;
    void dispatch(connectEquipment(deviceId));
  }, [deviceId, dispatch, isConnecting]);

  const onToggleConnect = useCallback(() => {
    if (isConnecting) return;
    if (connected) {
      void dispatch(disconnectEquipment(deviceId));
      return;
    }
    void (async () => {
      const consented = await loadHrConnectConsent();
      if (!consented) {
        pendingConsentRef.current = true;
        setConsentVisible(true);
        return;
      }
      doConnect();
    })();
  }, [connected, deviceId, dispatch, doConnect, isConnecting]);

  const handleConsentAgree = useCallback(() => {
    void (async () => {
      await saveHrConnectConsent();
      setConsentVisible(false);
      if (pendingConsentRef.current) {
        pendingConsentRef.current = false;
        doConnect();
      }
    })();
  }, [doConnect]);

  const handleConsentDecline = useCallback(() => {
    pendingConsentRef.current = false;
    setConsentVisible(false);
  }, []);

  if (!device) return null;

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <HrDeviceConsentModal
        visible={consentVisible}
        onAgree={handleConsentAgree}
        onDecline={handleConsentDecline}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('@/assets/images/equipment/detail.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.card}>
          {rows.map((item, index) => (
            <View key={item.label}>
              <Flex align="center" justify="between">
                <Text style={styles.rowLabel}>{item.label}</Text>
                {typeof item.value === 'string' ? (
                  <Text style={styles.rowValue}>{item.value}</Text>
                ) : (
                  item.value
                )}
              </Flex>
              {index < rows.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Flex align="center" justify="center">
            <Image
              source={require('@/assets/images/equipment/icon_into.png')}
              style={styles.tipIcon}
            />
            <Text style={styles.tipTitle}>如何佩戴胸带？</Text>
          </Flex>
          <Text style={styles.tipDesc}>
            先润湿电极，然后将胸带牢固地缠绕在胸部
          </Text>
        </View>
      </ScrollView>

      <Flex
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          activeOpacity={0.75}
          onPress={onDelete}
          disabled={isConnecting}>
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            <Image
              source={require('@/assets/images/equipment/icon_delete.png')}
              style={styles.deleteBtnIcon}
            />
            <Text style={styles.deleteBtnText}>删除设备</Text>
          </Flex>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.75}
          onPress={onToggleConnect}
          disabled={isConnecting}>
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            <Image
              source={
                connected
                  ? require('@/assets/images/equipment/icon_unlink.png')
                  : require('@/assets/images/equipment/icon_link.png')
              }
              style={styles.actionBtnIcon}
            />
            <Text style={styles.actionBtnText}>
              {connecting
                ? '连接中'
                : connected
                  ? '断开连接'
                  : '连接'}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </PageLayout>
  );
}
