import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergies';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { getResourceRows } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import moment from 'moment';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AllergiesPage() {
    const navigation = useNavigation<Nav>();
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


    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const name = user?.name ?? '';

    const birthMoment = moment(user?.birthDate, 'YYYYMMDD', true);
    const birthDate = birthMoment.isValid() ? birthMoment.format('YYYY-MM-DD') : '--';
    const age = birthMoment.isValid() ? moment().diff(birthMoment, 'years') : '--';
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.body}>
                <Flex style={styles.sectionBox}>
                    <Image style={styles.imgItem} source={require('@/assets/images/user/file.png')} />
                    <Text style={styles.sectionTitle}>已记录的家族病史</Text>
                </Flex>
                <View style={styles.listBox}>
                    <Flex justify='between' style={styles.infoBox}>
                        <View>
                            <Flex>
                                <Text style={styles.mapItemName}>父亲·65岁</Text>
                                <Flex style={styles.jzBox}>
                                    <Text style={styles.jzText}>健在</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapItemSubtitle}>高血压、糖尿病</Text>
                        </View>
                        <TouchableOpacity>
                            <Image style={styles.delIcon} source={require('@/assets/images/user/del.png')} />
                        </TouchableOpacity>
                    </Flex>
                </View>
                <View style={styles.listBox}>
                    <Flex justify='between' style={styles.infoBox}>
                        <View>
                            <Flex>
                                <Text style={styles.mapItemName}>祖父·享年78岁</Text>
                                <Flex style={styles.ygBox}>
                                    <Text style={styles.ygText}>已故</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapItemSubtitle}>脑卒中</Text>
                        </View>
                        <TouchableOpacity>
                            <Image style={styles.delIcon} source={require('@/assets/images/user/del.png')} />

                        </TouchableOpacity>
                    </Flex>
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} >
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text style={styles.addText}>添加家族成员病史</Text>
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
