import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import { resolveEquipmentProductName } from './utils/equipmentHelpers';
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
  const device = route.params;
  const [connected, setConnected] = useState(!!device.connected);

  const productName = useMemo(
    () => resolveEquipmentProductName(device.name),
    [device.name],
  );

  const batteryText = useMemo(() => {
    if (!connected || device.batteryPercent == null) return '--';
    const percent = Math.max(0, Math.min(100, Math.round(Number(device.batteryPercent) || 0)));
    return `${percent}%`;
  }, [connected, device.batteryPercent]);

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: '设备名称', value: productName },
    { label: '设备ID', value: device.deviceId?.trim() || '--' },
    { label: '电量', value: batteryText },
    { label: '固件版本', value: device.firmwareVersion?.trim() || '--' },
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
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const onToggleConnect = () => {
    setConnected(prev => !prev);
  };

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
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
          <Flex align="center">
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
          onPress={onDelete}>
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
          onPress={onToggleConnect}>
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
              {connected ? '断开连接' : '连接'}
            </Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
    </PageLayout>
  );
}
