import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { DotLottie } from '@lottiefiles/dotlottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import {
  connectEquipment,
  hydrateEquipment,
  prepareEquipmentSdk,
  startEquipmentScan,
  stopEquipmentScan,
} from '@/store/actions/equipment';
import { ensureEquipmentBluetoothReady } from './utils/equipmentPermissions';
import styles from '@/css/equipment/search';

const SEARCH_TIMEOUT_MS = 30_000;
/** 重新搜索：先清空列表，至少展示 1s「搜索中」再露出结果 */
const RESEARCH_SEARCHING_HOLD_MS = 1_000;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SEARCH_TIPS: Array<{
  prefix: string;
  highlights?: Array<{ text: string; suffix: string }>;
  suffix?: string;
}> = [
    { prefix: '1. 确保Polar设备已开启并处于配对模式' },
    {
      prefix: '2. 点击',
      highlights: [{ text: '“扫描设备”', suffix: '查找附近的Polar设备' }],
    },
    {
      prefix: '3. 从列表中选择设备并点击',
      highlights: [{ text: '“连接”', suffix: '' }],
    },
    { prefix: '4. 连接成功后可以开始心率监测' },
  ];

/**
 * 搜索 / 添加 Polar 等蓝牙设备
 */
export default function EquipmentSearchPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const scannedDevices = useSelector(
    (state: RootState) => state.equipment.scannedDevices,
  );
  const isConnecting = useSelector(
    (state: RootState) => state.equipment.isConnecting,
  );
  const connectingDeviceId = useSelector(
    (state: RootState) => state.equipment.connectingDeviceId,
  );
  const boundDevices = useSelector(
    (state: RootState) => state.equipment.boundDevices,
  );

  const [searchKey, setSearchKey] = useState(0);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const [bleReady, setBleReady] = useState(false);
  /** 重新搜索后强制停留在「搜索中」，避免结果秒回闪 */
  const [holdSearching, setHoldSearching] = useState(false);
  const pendingConnectIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ready = await ensureEquipmentBluetoothReady();
      if (cancelled) return;
      if (!ready.ok) {
        setBleReady(false);
        return;
      }
      setBleReady(true);
      await dispatch(hydrateEquipment());
      await dispatch(prepareEquipmentSdk());
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // 从系统设置返回后复检权限，便于授权后继续搜索
  useEffect(() => {
    if (bleReady) return undefined;
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') return;
      void (async () => {
        const ready = await ensureEquipmentBluetoothReady({ showAlert: false });
        if (!ready.ok) return;
        setBleReady(true);
        await dispatch(hydrateEquipment());
        await dispatch(prepareEquipmentSdk());
      })();
    });
    return () => sub.remove();
  }, [bleReady, dispatch]);

  useEffect(() => {
    if (!bleReady) return undefined;

    let cancelled = false;
    setSearchTimedOut(false);

    void (async () => {
      await dispatch(startEquipmentScan({ clearResults: true }));
      if (cancelled) return;
    })();

    const emptyTimer = setTimeout(() => {
      if (cancelled) return;
      setSearchTimedOut(true);
      void dispatch(stopEquipmentScan());
    }, SEARCH_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(emptyTimer);
      void dispatch(stopEquipmentScan());
    };
  }, [bleReady, dispatch, searchKey]);

  useEffect(() => {
    if (!holdSearching) return undefined;
    const timer = setTimeout(() => {
      setHoldSearching(false);
    }, RESEARCH_SEARCHING_HOLD_MS);
    return () => clearTimeout(timer);
  }, [holdSearching, searchKey]);

  useEffect(() => {
    const pendingId = pendingConnectIdRef.current;
    if (!pendingId) return;
    const connected = boundDevices.some(
      item => item.deviceId === pendingId && item.connected,
    );
    if (!connected) return;
    pendingConnectIdRef.current = null;
    navigation.goBack();
  }, [boundDevices, navigation]);

  const connectedDeviceIds = useMemo(
    () => new Set(
      boundDevices.filter(item => item.connected).map(item => item.deviceId),
    ),
    [boundDevices],
  );
  const visibleScannedDevices = useMemo(
    () => scannedDevices.filter(item => !connectedDeviceIds.has(item.deviceId)),
    [connectedDeviceIds, scannedDevices],
  );

  const hasDevices = visibleScannedDevices.length > 0;
  const hasFound = hasDevices && !holdSearching;
  const showEmpty = searchTimedOut && !hasDevices && !holdSearching;

  const handleResearch = useCallback(() => {
    setSearchTimedOut(false);
    setHoldSearching(true);
    setSearchKey(key => key + 1);
  }, []);

  const handleConnect = useCallback(
    async (deviceId: string) => {
      if (isConnecting) return;
      pendingConnectIdRef.current = String(deviceId);
      const ok = await dispatch(connectEquipment(deviceId));
      if (!ok) {
        pendingConnectIdRef.current = null;
      }
    },
    [dispatch, isConnecting],
  );

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          hasFound ? styles.contentFound : styles.contentIdle,
        ]}
        scrollEnabled={hasFound}
        bounces={hasFound}>
        {hasFound ? (
          <View style={styles.foundModule}>
            <Flex align="center" justify="between" style={styles.foundHeader}>
              <Text style={styles.foundTitle}>搜索结果</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.researchBtn}
                onPress={handleResearch}
                disabled={isConnecting}>
                <Flex align="center">
                  <Image
                    source={require('@/assets/images/equipment/icon_research.png')}
                    style={styles.researchBtnIcon}
                  />
                  <Text style={styles.researchBtnText}>重新搜索</Text>
                </Flex>
              </TouchableOpacity>
            </Flex>

            <View style={styles.foundList}>
              {visibleScannedDevices.map(item => {
                const connecting =
                  isConnecting && connectingDeviceId === item.deviceId;
                return (
                  <View key={item.deviceId} style={styles.foundCard}>
                    <Image
                      source={require('@/assets/images/equipment/logo.png')}
                      style={styles.foundLogo}
                    />
                    <View style={styles.foundInfo}>
                      <Text style={styles.foundName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.foundId} numberOfLines={1}>
                        ID:{item.deviceId}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={styles.connectBtn}
                      disabled={isConnecting}
                      onPress={() => void handleConnect(item.deviceId)}>
                      <Flex align="center">
                        <Image
                          source={require('@/assets/images/equipment/icon_link.png')}
                          style={styles.connectBtnIcon}
                        />
                        <Text style={styles.connectBtnText}>
                          {connecting ? '连接中' : '连接'}
                        </Text>
                      </Flex>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.contentModule}>
            <View style={styles.searchHero}>
              {showEmpty ? (
                <Image
                  source={require('@/assets/images/equipment/icon_search.png')}
                  style={styles.searchIcon}
                />
              ) : (
                <DotLottie
                  source={require('@/assets/images/equipment/search.lottie')}
                  style={styles.searchLottie}
                  autoplay
                  loop
                />
              )}
              <Text style={styles.searchingText}>
                {showEmpty ? '未搜索到设备' : '正在搜索设备'}
              </Text>
              {showEmpty ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[styles.researchBtn, { marginTop: 16 }]}
                  onPress={handleResearch}>
                  <Flex align="center">
                    <Image
                      source={require('@/assets/images/equipment/icon_research.png')}
                      style={styles.researchBtnIcon}
                    />
                    <Text style={styles.researchBtnText}>重新搜索</Text>
                  </Flex>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.tipBox}>
              {SEARCH_TIPS.map((item, index) => (
                <Text key={`tip-${index}`} style={styles.tipText}>
                  {item.prefix}
                  {item.highlights?.map((part, partIndex) => (
                    <Text key={`tip-${index}-${partIndex}`}>
                      <Text style={styles.tipHighlight}>{part.text}</Text>
                      {part.suffix}
                    </Text>
                  ))}
                  {item.suffix ?? ''}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </PageLayout>
  );
}
