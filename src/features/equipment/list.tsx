import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import {
  hydrateEquipment,
  prepareEquipmentSdk,
} from '@/store/actions/equipment';
import {
  clampBatteryPercent,
  getBatteryFillColor,
  getBatteryFillWidth,
} from './utils/equipmentHelpers';
import { ensureEquipmentBluetoothReady } from './utils/equipmentPermissions';
import {
  loadHrConnectConsent,
  saveHrConnectConsent,
} from './utils/equipmentStorage';
import HrDeviceConsentModal from './components/HrDeviceConsentModal';
import styles from '@/css/equipment/list';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * 我的设备列表
 */
export default function EquipmentListPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const boundDevices = useSelector(
    (state: RootState) => state.equipment.boundDevices,
  );
  const [consentVisible, setConsentVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const consented = await loadHrConnectConsent();
      if (cancelled) return;
      if (!consented) {
        setConsentVisible(true);
      }
      await ensureEquipmentBluetoothReady();
      await dispatch(hydrateEquipment());
      await dispatch(prepareEquipmentSdk());
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const handleConsentAgree = useCallback(() => {
    void (async () => {
      await saveHrConnectConsent();
      setConsentVisible(false);
    })();
  }, []);

  const handleConsentDecline = useCallback(() => {
    setConsentVisible(false);
    navigation.goBack();
  }, [navigation]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <HrDeviceConsentModal
        visible={consentVisible}
        onAgree={handleConsentAgree}
        onDecline={handleConsentDecline}
        declineLabel="返回"
        agreeLabel="同意"
      />
      <View style={styles.body}>
        <View style={styles.banner}>
          <Image
            source={require('@/assets/images/equipment/back.png')}
            style={styles.bannerImage}
            resizeMode="contain"
          />
          <View style={styles.bannerTextWrap} pointerEvents="none">
            <Text style={styles.bannerText}>
              <Text style={styles.bannerTextHighlight}>绑定设备</Text>
              {' 可以查看更多健康数据，当前支持Polar H10胸带心率监测设备。'}
            </Text>
          </View>
        </View>

        <ImageBackground
          source={require('@/assets/images/schedule/calendarBack.png')}
          style={styles.backImage1}>
          <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
            <Text style={styles.backImage1Text}>已绑定设备</Text>
          </Flex>
        </ImageBackground>

        <ScrollView
          style={styles.deviceScroll}
          contentContainerStyle={styles.deviceScrollContent}
          showsVerticalScrollIndicator={false}
          bounces>
          <View style={styles.deviceList}>
            {boundDevices.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>暂无已绑定设备，请点击下方添加</Text>
              </View>
            ) : (
              boundDevices.map((item, index) => (
                <TouchableOpacity
                  key={item.deviceId}
                  activeOpacity={0.75}
                  style={[
                    styles.deviceCard,
                    index === 0 ? styles.deviceCardFirst : null,
                  ]}
                  onPress={() =>
                    navigation.navigate('EquipmentDetailPage', {
                      id: String(item.deviceId),
                    })
                  }>
                  <Image
                    source={require('@/assets/images/equipment/logo.png')}
                    style={styles.deviceLogo}
                  />
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Flex align="center" style={styles.deviceStatusRow}>
                      <View
                        style={[
                          styles.deviceStatusDot,
                          item.connected
                            ? styles.deviceStatusDotOn
                            : styles.deviceStatusDotOff,
                        ]}
                      />
                      <Text style={styles.deviceStatusText}>
                        {item.connected ? '已连接' : '未连接'}
                      </Text>
                      {item.connected ? (
                        <Flex align="center" style={styles.deviceBatteryWrap}>
                          <View style={styles.deviceBatteryIcon}>
                            <View style={styles.deviceBatteryFillTrack}>
                              <View
                                style={[
                                  styles.deviceBatteryFill,
                                  {
                                    width: getBatteryFillWidth(item.batteryPercent),
                                    backgroundColor: getBatteryFillColor(
                                      item.batteryPercent,
                                    ),
                                  },
                                ]}
                              />
                            </View>
                            <Image
                              source={require('@/assets/images/equipment/icon_battery.png')}
                              style={styles.deviceBatteryOutline}
                            />
                          </View>
                          <Text style={styles.deviceBatteryText}>
                            {clampBatteryPercent(item.batteryPercent)}%
                          </Text>
                        </Flex>
                      ) : null}
                    </Flex>
                  </View>
                  <Image
                    source={require('@/assets/images/equipment/icon_right.png')}
                    style={styles.deviceArrow}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <Flex
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <TouchableOpacity
          style={styles.addDeviceBtn}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('EquipmentSearchPage')}>
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            <Image
              style={styles.addDeviceBtnIcon}
              source={require('@/assets/images/vitals/icon_add.png')}
            />
            <Text style={styles.addDeviceBtnText}>添加设备</Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </PageLayout>
  );
}
