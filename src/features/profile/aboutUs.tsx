import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import PageLayout from '@/src/components/PageLayout';

import DeviceInfo from 'react-native-device-info';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/profile/aboutUs';


export default function ProfilePage() {
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
                </View>
            </ScrollView>
        </PageLayout>
    );
}
