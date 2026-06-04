import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Flex, DatePicker, Toast } from '@ant-design/react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import { getUserBaseInfo, updateUserBaseInfo } from '@/api/patient';
import { uploadOss } from '@/api/oss';
import { AppTheme } from '@/common/theme';
import styles from '@/css/medication/index';
import allergyStyles from '@/css/profile/allergies';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { fetchUserBaseInfo } from '@/store/actions/user';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';

const PROGRESS_SIZE = 48;
const PROGRESS_STROKE = 4;
const PROGRESS_VALUE = 67;

const TIME_LIST = [
    { label: '5分钟', value: '5' },
    { label: '10分钟', value: '10' },
    { label: '15分钟', value: '15' }
];
export default function MedicationPage() {

    const navigation: any = useNavigation();
    const [type, setType] = useState('');
    const progressRadius = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
    const progressCenter = PROGRESS_SIZE / 2;
    const progressPath = useMemo(() => {
        const path = Skia.Path.Make();
        path.addArc(
            {
                x: progressCenter - progressRadius,
                y: progressCenter - progressRadius,
                width: progressRadius * 2,
                height: progressRadius * 2,
            },
            -90,
            (360 * PROGRESS_VALUE) / 100,
        );
        return path;
    }, [progressCenter, progressRadius]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('MedicationAddPage')}>
                    <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>添加</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation]);
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>当前用药</Text>
                <View style={styles.medicationBox}>
                    <Flex justify="between">
                        <Text style={styles.medicationTitle}>氨氯地平片</Text>
                        <Flex style={styles.medicationStatus1}>
                            <Text style={styles.medicationStatusText1}>已服用</Text>
                        </Flex>
                    </Flex>
                    <View style={styles.medicationInfo}>
                        <Text style={styles.medicationText}>用法：5mg/次，每日1次，早餐后</Text>
                        <Text style={styles.medicationText}>服用时间：08:00</Text>
                        <Flex justify="between">
                            <Text style={styles.medicationText}>剩余药量：18片</Text>
                            <Text style={[styles.medicationText, { color: AppTheme.primaryColor }]}>下次提醒：明天07:35</Text>
                        </Flex>
                    </View>
                </View>
                <View style={styles.medicationBox}>
                    <Flex justify="between">
                        <Text style={styles.medicationTitle}>氨氯地平片</Text>
                        <Flex style={styles.medicationStatus2}>
                            <Text style={styles.medicationStatusText2}>已服用</Text>
                        </Flex>
                    </Flex>
                    <View style={styles.medicationInfo}>
                        <Text style={styles.medicationText}>用法：5mg/次，每日1次，早餐后</Text>
                        <Text style={styles.medicationText}>服用时间：08:00</Text>
                        <Flex justify="between">
                            <Text style={styles.medicationText}>剩余药量：18片</Text>
                            <Text style={[styles.medicationText, { color: AppTheme.primaryColor }]}>下次提醒：明天07:35</Text>
                        </Flex>
                        <Flex justify='between' style={styles.btnBox}>
                            <TouchableOpacity style={styles.btn}>
                                <Flex style={{ flex: 1 }} justify='center'>
                                    <Text style={styles.btnText}>已服用</Text>
                                </Flex>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnRight}>
                                <Flex style={{ flex: 1 }} justify='center'>
                                    <Text style={styles.btnRightText}>忘记服用</Text>
                                </Flex>
                            </TouchableOpacity>
                        </Flex>
                    </View>
                </View>
                <View style={styles.medicationBox}>
                    <Flex justify="between">
                        <Text style={styles.medicationTitle}>用药进度</Text>
                        <View style={styles.progressRing}>
                            <Canvas style={styles.progressCanvas}>
                                <Circle
                                    cx={progressCenter}
                                    cy={progressCenter}
                                    r={progressRadius}
                                    color="rgba(237,194,98,0.12)"
                                    style="stroke"
                                    strokeWidth={PROGRESS_STROKE}
                                />
                                <Path
                                    path={progressPath}
                                    color="#EDC262"
                                    style="stroke"
                                    strokeWidth={PROGRESS_STROKE}
                                    strokeCap="round"
                                />
                            </Canvas>
                            <Text style={styles.progressText}>{PROGRESS_VALUE}%</Text>
                        </View>
                    </Flex>
                </View>


                <Text style={styles.sectionTitle}>用药提醒</Text>
                <View style={styles.medicationBox}>
                    <Text style={styles.colTitle}>提前提醒时间</Text>
                    <Flex justify="between" style={{ marginTop: 14, marginBottom: 12, gap: 8 }}>
                        {TIME_LIST.map(item => (
                            <TouchableOpacity
                                style={[styles.typeItem, type === item.value && styles.typeItemActive]}
                                key={item.value}
                                onPress={() => setType(item.value)}>
                                <Flex style={{ flex: 1 }}>
                                    <Text style={[styles.typeItemText, type === item.value && styles.typeItemTextActive]}>
                                        {item.label}
                                    </Text>
                                </Flex>
                            </TouchableOpacity>
                        ))}
                    </Flex>
                    <View style={styles.rowLine} />
                    <Text style={styles.colTitle}>提醒方式</Text>
                    <Flex justify="between" style={{ marginTop: 14, marginBottom: 12, gap: 8 }}>
                        <Flex>
                            <Image style={styles.colIcon} source={require('@/assets/images/user/phone.png')} />
                            <Text style={styles.colText}>铃声提醒</Text>
                        </Flex>
                        <Flex>
                            <Image style={styles.colIcon} source={require('@/assets/images/user/phone.png')} />
                            <Text style={styles.colText}>震动</Text>
                        </Flex>
                        <Flex>
                            <Image style={styles.colIcon} source={require('@/assets/images/user/phone.png')} />
                            <Text style={styles.colText}>语音播报</Text>
                        </Flex>
                    </Flex>
                </View>
                <Flex justify="between">
                    <Text style={styles.sectionTitle}>服药历史</Text>
                    <TouchableOpacity>
                        <Text style={styles.more}>全部</Text>
                    </TouchableOpacity>
                </Flex>
                <View style={styles.medicationBox}>
                    <Text style={styles.colTitle}>今天</Text>
                    <View style={styles.listBox}>
                        <Flex justify='between' style={styles.listItem}>
                            <Text style={styles.listItemText}>氨氯地平</Text>
                            <Text style={styles.listItemText}>08:05</Text>
                        </Flex>
                        <Flex justify='between' style={styles.listItem}>
                            <Text style={styles.listItemText}>氨氯地平</Text>
                            <Text style={styles.listItemText}>08:05</Text>
                        </Flex>
                    </View>
                    <View style={styles.rowLine} />
                    <Text style={styles.colTitle}>昨天</Text>
                    <View style={styles.listBox}>
                        <Flex justify='between' style={styles.listItem}>
                            <Text style={styles.listItemText}>氨氯地平</Text>
                            <Text style={styles.listItemText}>08:05</Text>
                        </Flex>
                        <Flex justify='between' style={styles.listItem}>
                            <Text style={styles.listItemText}>氨氯地平</Text>
                            <Text style={styles.listItemText}>08:05</Text>
                        </Flex>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
    <Flex>
        <Text>电话</Text>
    </Flex>
}
