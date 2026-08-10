import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';

import DeviceInfo from 'react-native-device-info';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/profile/aboutUs';


export default function ProfilePage() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [appVersion, setAppVersion] = useState<string>('');


    useEffect(() => {
        const getVersion = async () => {
            const version = DeviceInfo.getVersion();
            setAppVersion(`v${version}`);
        };
        getVersion();
    }, []);

    return (
        <PageLayout style={styles.container} showHeaderBackground={false}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.logoBox}>
                    <Image style={styles.logo} source={require('@/assets/icon.png')}></Image>
                </View>

                <Text style={styles.pageText}>莱益晟</Text>


                <View style={styles.urlBox}>
                    <Flex style={[styles.urlRow, styles.urlBoxBtm]} justify="between">
                        <Text style={styles.leftTitle}>版本</Text>
                        <Text style={styles.rightTitle}>{appVersion || 'v1.0.0'}</Text>
                    </Flex>
                    <Flex style={styles.urlRow} justify="between">
                        <Text style={styles.leftTitle}>联系我们</Text>
                        <Text style={styles.rightTitle}>support@lifemedicine.com</Text>
                    </Flex>
                    {__DEV__ ? (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('PolarDeviceTestPage')}>
                            <Flex style={[styles.urlRow, { borderTopWidth: 1, borderTopColor: '#F0F0F0' }]} justify="between">
                                <Text style={styles.leftTitle}>Polar H10 测试</Text>
                                <Text style={[styles.rightTitle, { color: '#6D925E' }]}>进入</Text>
                            </Flex>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </ScrollView>
        </PageLayout>
    );
}
