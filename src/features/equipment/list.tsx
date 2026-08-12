import React from 'react';
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
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import {
    clampBatteryPercent,
    getBatteryFillColor,
    getBatteryFillWidth,
} from './utils/equipmentHelpers';
import styles from '@/css/equipment/list';

type BoundDevice = {
    id: string;
    name: string;
    connected: boolean;
    /** 电量 0-100，仅已连接时展示 */
    batteryPercent?: number;
    deviceId?: string;
    firmwareVersion?: string;
};

const BOUND_DEVICES: BoundDevice[] = [
    {
        id: '1',
        name: 'Polar H10 0C9899900',
        connected: true,
        batteryPercent: 95,
        deviceId: '90888AD999',
        firmwareVersion: '4.0.4',
    },
    {
        id: '2',
        name: 'Polar H10 0C9899901',
        connected: true,
        batteryPercent: 19,
        deviceId: 'OC452337',
        firmwareVersion: '4.0.4',
    },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * 我的设备列表
 */
export default function EquipmentListPage() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <ScrollView contentContainerStyle={styles.content}>
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
                    <Flex justify="between" style={{ flex: 1, paddingHorizontal: 27 }}>
                        <Text style={styles.backImage1Text}>已绑定设备</Text>
                    </Flex>
                </ImageBackground>

                <View style={styles.deviceList}>
                    {BOUND_DEVICES.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.75}
                            style={[styles.deviceCard, index === 0 ? styles.deviceCardFirst : null]}
                            onPress={() =>
                                navigation.navigate('EquipmentDetailPage', {
                                    id: item.id,
                                    name: item.name,
                                    connected: item.connected,
                                    batteryPercent: item.batteryPercent,
                                    deviceId: item.deviceId,
                                    firmwareVersion: item.firmwareVersion,
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
                                                                width: getBatteryFillWidth(
                                                                    item.batteryPercent,
                                                                ),
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
                    ))}
                </View>
            </ScrollView>

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
