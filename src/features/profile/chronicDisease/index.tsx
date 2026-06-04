import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/chronicDisease/index';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { getResourceRows } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import moment from 'moment';


export default function AllergiesPage() {
    const navigation: any = useNavigation();
    const user = useSelector((state: RootState) => state.user.info);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const loadRecords = useCallback(async () => {
        try {
            const res = await getMedicalRecordFrontList({ pageNum: 1, pageSize: 3 });
            setRecords(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
        } catch {
            setRecords([]);
        }
    }, []);

    const loadRecordsRef = useRef(loadRecords);
    loadRecordsRef.current = loadRecords;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRecordsRef.current();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadRecordsRef.current();
        }, []),
    );

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ChronicDiseaseAddPage')} style={{ marginRight: 16 }}>
                    <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>添加</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.body}>
                <Flex style={styles.sectionBox}>
                    <Image style={styles.imgItem} source={require('@/assets/images/user/file.png')} />
                    <Text style={styles.sectionTitle}>已建档慢病</Text>
                </Flex>

                <View style={styles.infoBox}>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoLabel}>病症</Text>
                        <Text style={styles.infoValue}>高血压</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoLabel}>确诊时间</Text>
                        <Text style={styles.infoValue}>2018-06</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoLabel}>当前状态</Text>
                        <Text style={styles.infoValue}>控制中</Text>
                    </Flex>
                    <Flex justify="between" style={styles.infoItem}>
                        <Text style={styles.infoLabel}>最近指标</Text>
                        <Text style={styles.infoValue}>128/85(正常)</Text>
                    </Flex>
                    <View>
                        <Flex justify="between" style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                            <Text style={styles.infoLabel}>用药</Text>
                            <Text style={styles.infoValue}>氨氯地平5mg/天</Text>
                        </Flex>
                        <Flex style={styles.lineBox}>
                            <View style={styles.line}></View>
                        </Flex>
                        <Flex justify="between" style={{ marginTop: 12 }}>
                            <Text style={styles.infoValue}>控制良好</Text>
                            <Text style={styles.infoValue}>80%</Text>
                        </Flex>
                    </View>
                </View>
                <Flex style={styles.sectionBox}>
                    <Image style={styles.imgItem} source={require('@/assets/images/user/dp.png')} />
                    <Text style={styles.sectionTitle}>健康建议</Text>
                </Flex>
                <View style={styles.tipBox}>
                    <Text style={styles.tipTitle}>高血压管理建议</Text>
                    <Text style={styles.tipContent}>· 坚持按时服药</Text>
                    <Text style={styles.tipContent}>· 每日监测血压</Text>
                    <Text style={styles.tipContent}>· 低盐饮食</Text>
                    <Text style={styles.tipContent}>· 适量运动</Text>
                    <Text style={styles.tipTitle}>糖尿病管理建议</Text>
                    <Text style={styles.tipContent}>· 控制碳水化合物摄入</Text>
                    <Text style={styles.tipContent}>· 定期监测血糖</Text>
                    <Text style={styles.tipContent}>· 餐后适量运动</Text>
                    <Text style={styles.tipContent}>· 保持良好作息</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
